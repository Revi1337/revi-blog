import matter from "gray-matter"

export interface ArticleFrontmatter {
  slug?: string
  title: string
  category: string
  date: string
  updatedAt?: string
  tags: string[]
  thumbnail?: string
  /** 없으면 "cover"(꽉 채워 크롭) — 로고처럼 크롭하면 안 되는 썸네일만 "contain"으로 전체 노출 */
  thumbnailFit?: "cover" | "contain"
  readingTimeMinutes?: number
  /** 없으면 true — 홈 카드 그리드/캐러셀 노출 여부 */
  showOnHomepage?: boolean
}

const REQUIRED_FIELDS = ["title", "category", "date", "tags"] as const

export function parseFrontmatter(
  filePath: string,
  fileContents: string
): { frontmatter: ArticleFrontmatter; rawBody: string } {
  const { data, content } = matter(fileContents)

  const missing = REQUIRED_FIELDS.filter((field) => data[field] === undefined || data[field] === null)
  if (missing.length > 0) {
    throw new Error(
      `[content/articles] ${filePath}: 필수 프론트매터 필드 누락 — ${missing.join(", ")}`
    )
  }

  return {
    frontmatter: data as ArticleFrontmatter,
    rawBody: content,
  }
}
