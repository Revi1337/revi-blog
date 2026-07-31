import { NextResponse } from "next/server"

import { getArticleViews, getGlobalStats } from "@/lib/stats/get-stats"

export const runtime = "edge"

// slug 존재 검증(getArticleBySlug)은 node:fs로 마크다운을 읽는 lib/data/articles.ts에 의존해
// Edge Runtime에서 쓸 수 없다 — 이 라우트는 실제 게시글 페이지에서만 slug를 넘겨 호출되므로
// 검증 없이도 정상 동작하며, 존재하지 않는 slug는 조회수 0으로 응답한다.
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const [globalStats, views] = await Promise.all([getGlobalStats(), getArticleViews(slug)])

  // 개인화 없는 공개 지표라 엣지에서 공유 캐시해도 안전하다 — TTL 안에 들어온 요청은 Redis를
  // 안 거치고, 그 이후 요청은 응답을 기다리지 않고 백그라운드에서 갱신된다(stale-while-revalidate).
  return NextResponse.json(
    { ...globalStats, views },
    { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300" } }
  )
}
