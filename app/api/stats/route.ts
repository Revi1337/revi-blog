import { NextResponse } from "next/server"

import { getGlobalStats } from "@/lib/stats/get-stats"

export async function GET() {
  const stats = await getGlobalStats()
  return NextResponse.json(stats)
}
