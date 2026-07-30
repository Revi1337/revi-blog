import { NextResponse } from "next/server"

import { getArticleBySlug } from "@/lib/data/articles"
import { getArticleViews, getGlobalStats } from "@/lib/stats/get-stats"

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  if (!getArticleBySlug(slug)) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 })
  }

  const [globalStats, views] = await Promise.all([getGlobalStats(), getArticleViews(slug)])

  return NextResponse.json({ ...globalStats, views })
}
