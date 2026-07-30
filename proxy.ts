import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { redis } from "@/lib/stats/redis"
import { isBotUserAgent } from "@/lib/stats/bot-detection"
import { getKstDateString } from "@/lib/stats/get-stats"

const DAILY_VISIT_TTL_SECONDS = 60 * 60 * 24
const ARTICLE_SLUG_PATTERN = /^\/article\/([^/]+)\/?$/

function getClientIp(request: NextRequest): string | null {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null
}

export async function proxy(request: NextRequest) {
  if (isBotUserAgent(request.headers.get("user-agent"))) {
    return NextResponse.next()
  }

  // next/link의 뷰포트 자동 prefetch(next-router-prefetch 헤더)는 사용자가 실제로 보지 않은
  // 요청이라 실방문 집계에서 제외해야 한다 — 이걸 걸러내지 않으면 화면에 보이는 카드/네비
  // 링크 개수만큼 조회수가 중복으로 올라간다.
  if (request.headers.get("next-router-prefetch")) {
    return NextResponse.next()
  }

  const ip = getClientIp(request)
  // x-forwarded-for가 없는 요청(비정상 프록시 등)은 IP 없이는 중복 방문을 구분할 수 없으므로
  // 전역 카운터 집계를 건너뛴다 — Vercel 엣지 네트워크는 이 헤더를 항상 채워주므로 실사용 시엔 발생하지 않는다.
  if (ip) {
    const today = getKstDateString()
    const dedupKey = `visited:${today}:${ip}`
    const alreadyVisited = await redis.get(dedupKey)

    if (!alreadyVisited) {
      await Promise.all([
        redis.set(dedupKey, "1", { ex: DAILY_VISIT_TTL_SECONDS }),
        redis.incr("visits:total"),
        redis.incr(`visits:daily:${today}`),
      ])
    }
  }

  const articleMatch = request.nextUrl.pathname.match(ARTICLE_SLUG_PATTERN)
  if (articleMatch) {
    await redis.incr(`pageviews:${articleMatch[1]}`)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|feed.xml|robots.txt|sitemap.xml|.*\\..*).*)"],
}
