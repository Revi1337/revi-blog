import fs from "node:fs"
import path from "node:path"

import { parseFrontmatter } from "@/lib/content/frontmatter"
import { renderMarkdown } from "@/lib/content/pipeline"
import { stripComments } from "@/lib/content/strip-comments"
import { computeReadingTimeMinutes } from "@/lib/content/reading-time"
import { attachPrevNext } from "@/lib/content/prev-next"
import { DEFAULT_THUMBNAIL } from "@/lib/data/types"
import type { Article } from "@/lib/data/types"

const CONTENT_DIR = path.join(process.cwd(), "content", "articles")

interface LoadedArticle extends Article {
  showOnHomepage: boolean
}

async function loadArticleFile(filePath: string): Promise<LoadedArticle> {
  const raw = fs.readFileSync(filePath, "utf-8")
  const { frontmatter, rawBody } = parseFrontmatter(filePath, raw)
  const { bodyHtml, toc } = await renderMarkdown(stripComments(rawBody))

  const slug = frontmatter.slug ?? path.basename(filePath, ".md")
  const readingTimeMinutes = frontmatter.readingTimeMinutes ?? computeReadingTimeMinutes(rawBody)

  return {
    slug,
    category: frontmatter.category,
    title: frontmatter.title,
    publishedAt: frontmatter.publishedAt,
    updatedAt: frontmatter.updatedAt,
    readingTimeMinutes,
    tags: frontmatter.tags,
    thumbnail: frontmatter.thumbnail ?? DEFAULT_THUMBNAIL,
    bodyHtml,
    toc,
    // metrics 카드는 remark-metrics가 bodyHtml 안에 직접 렌더링하므로 별도 구조화 데이터로는 노출하지 않는다
    metrics: [],
    showOnHomepage: frontmatter.showOnHomepage ?? true,
  }
}

function assertNoDuplicateSlugs(loaded: Array<{ slug: string; filePath: string }>) {
  const bySlug = new Map<string, string[]>()
  for (const { slug, filePath } of loaded) {
    bySlug.set(slug, [...(bySlug.get(slug) ?? []), filePath])
  }

  const conflicts = [...bySlug.entries()].filter(([, paths]) => paths.length > 1)
  if (conflicts.length > 0) {
    const detail = conflicts.map(([slug, paths]) => `${slug}: ${paths.join(", ")}`).join(" | ")
    throw new Error(`[content/articles] 중복된 slug가 있습니다 — ${detail}`)
  }
}

export interface LoadedContent {
  articles: Article[]
  blogSlugs: string[]
}

export async function loadArticles(): Promise<LoadedContent> {
  const filenames = fs.readdirSync(CONTENT_DIR).filter((name) => name.endsWith(".md"))
  const filePaths = filenames.map((name) => path.join(CONTENT_DIR, name))

  const loaded = await Promise.all(filePaths.map((filePath) => loadArticleFile(filePath)))
  assertNoDuplicateSlugs(loaded.map((article, index) => ({ slug: article.slug, filePath: filePaths[index] })))

  const sortedDesc = [...loaded].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))

  // prev/next 체인은 showOnHomepage 아티클끼리만 계산한다 — 홈 그리드에서 제외된 글은 발행일이
  // 아무리 최신이어도 다른 글의 이전/다음 글로 끼어들지 않는다.
  const chain = sortedDesc.filter((article) => article.showOnHomepage)
  const chainWithNav = attachPrevNext(chain)

  const bySlug = new Map(chainWithNav.map((article) => [article.slug, article]))
  const articles = sortedDesc.map((article) => bySlug.get(article.slug) ?? article)
  const blogSlugs = chain.map((article) => article.slug)

  return { articles, blogSlugs }
}
