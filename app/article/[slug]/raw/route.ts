import { getArticleRawMarkdown } from "@/lib/data/articles"

// runtime을 지정하지 않는다(기본값 Node 유지) — lib/data/articles.ts가 node:fs 기반 모듈 그래프를
// import하므로 edge 런타임을 지정하면 빌드 자체가 깨진다(app/api/track과 동일한 이유, 017 plan.md
// Constraints). app/api/stats/*처럼 edge로 착각해 지정하지 않도록 주의.
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const raw = getArticleRawMarkdown(slug)

  if (raw === undefined) {
    return new Response("Not Found", { status: 404 })
  }

  return new Response(raw, { headers: { "Content-Type": "text/markdown; charset=utf-8" } })
}
