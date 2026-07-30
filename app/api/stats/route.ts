import { NextResponse } from "next/server"

import { getGlobalStats } from "@/lib/stats/get-stats"

export const runtime = "edge"

export async function GET() {
  const stats = await getGlobalStats()
  return NextResponse.json(stats)
}
