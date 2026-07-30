import { NextResponse } from "next/server"

import { getArticleBySlug } from "@/lib/data/articles"
import { isBotUserAgent } from "@/lib/stats/bot-detection"
import { redis } from "@/lib/stats/redis"
import { getKstDateString } from "@/lib/stats/get-stats"

const DAILY_VISIT_TTL_SECONDS = 60 * 60 * 24
const PAGEVIEW_COOLDOWN_SECONDS = 60

function getClientIp(request: Request): string | null {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null
}

// next/link의 뷰포트 자동 prefetch는 proxy.ts(Edge Middleware) 레이어에서 next-router-prefetch
// 헤더로 걸러내려 했으나, Next가 미들웨어 호출 직전에 이 헤더 자체를 지워버려(node_modules/next/dist/
// server/web/adapter.js) 애초에 구분이 불가능했다 — 그래서 카운팅을 미들웨어에서 걷어내고, 페이지가
// 실제로 마운트될 때만 클라이언트가 이 라우트를 호출하는 방식으로 옮겼다. prefetch는 데이터만
// 미리 받아둘 뿐 컴포넌트를 마운트하지 않으므로 이 방식이면 구조적으로 절대 카운트되지 않는다.
function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin")
  const host = request.headers.get("host")
  if (!origin || !host) return false
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request) || isBotUserAgent(request.headers.get("user-agent"))) {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  let slug: string | undefined
  try {
    const body: unknown = await request.json()
    if (body && typeof body === "object" && typeof (body as { slug?: unknown }).slug === "string") {
      slug = (body as { slug: string }).slug
    }
  } catch {
    // 사이트 전역 방문 집계(slug 없음)는 body가 비어도 정상 요청이므로 무시하고 계속 진행한다
  }

  const ip = getClientIp(request)
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

  if (slug) {
    if (!getArticleBySlug(slug)) {
      return NextResponse.json({ ok: false, error: "unknown slug" }, { status: 404 })
    }

    // 조회수는 원래부터 dedup 없이 볼 때마다 증가하는 지표지만, 이 라우트는 클라이언트에서
    // 직접 호출 가능해 fetch 반복 호출로 스팸할 수 있다 — IP+slug당 짧은 쿨다운으로 그 스팸만
    // 막고, 실제 재방문(쿨다운 이후)은 그대로 정상 카운트되게 한다.
    if (ip) {
      const cooldownKey = `track-cooldown:${ip}:${slug}`
      const acquired = await redis.set(cooldownKey, "1", { ex: PAGEVIEW_COOLDOWN_SECONDS, nx: true })
      if (acquired === "OK") {
        await redis.incr(`pageviews:${slug}`)
      }
    }
  }

  return NextResponse.json({ ok: true })
}
