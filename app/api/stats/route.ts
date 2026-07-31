import { NextResponse } from "next/server"

import { getGlobalStats } from "@/lib/stats/get-stats"

export const runtime = "edge"

export async function GET() {
  const stats = await getGlobalStats()
  // 개인화 없는 공개 지표라 엣지에서 공유 캐시해도 안전하다 — TTL 안에 들어온 요청은 Redis를
  // 안 거치고, 그 이후 요청은 응답을 기다리지 않고 백그라운드에서 갱신된다(stale-while-revalidate).
  return NextResponse.json(stats, {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300" },
  })
}
