import { articles } from "@/lib/data/articles"
import { SITE_URL } from "@/lib/site-config"

export const dynamic = "force-static"

const EXCERPT_LENGTH = 180

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function excerpt(plainBody: string): string {
  const collapsed = plainBody.trim().replace(/\s+/g, " ")
  if (collapsed.length <= EXCERPT_LENGTH) {
    return collapsed
  }
  return `${collapsed.slice(0, EXCERPT_LENGTH).trimEnd()}...`
}

export function GET() {
  const feedArticles = articles
    .filter((article) => article.showOnHomepage)
    .toSorted((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const items = feedArticles
    .map((article) => {
      const url = `${SITE_URL}/article/${article.slug}`
      return `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${new Date(article.date).toUTCString()}</pubDate>
      <description>${escapeXml(excerpt(article.plainBody))}</description>
    </item>`
    })
    .join("\n")

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Revi's Blog</title>
    <link>${SITE_URL}</link>
    <description>Revi's engineering blog</description>
    <language>ko</language>
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  })
}
