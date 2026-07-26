import matter from "gray-matter"

export interface ArticleFrontmatter {
  slug?: string
  title: string
  category: string
  date: string
  updated_at?: string
  tags: string[]
  thumbnail?: string
  /** 없으면 "cover"(꽉 채워 크롭) — 로고처럼 크롭하면 안 되는 썸네일만 "contain"으로 전체 노출 */
  thumbnail_fit?: "cover" | "contain"
  reading_time_minutes?: number
  /** 없으면 true — 홈 카드 그리드/캐러셀 노출 여부 */
  show_on_homepage?: boolean
}

const REQUIRED_FIELDS = ["title", "category", "date", "tags"] as const

const CAMEL_CASE_CHAR = /[A-Z]/g

/** `updatedAt` → `updated_at` — camelCase로 써도 snake_case 필드와 동일하게 인식되도록 정규화 */
function toSnakeCase(key: string): string {
  return key.replace(CAMEL_CASE_CHAR, (char) => `_${char.toLowerCase()}`)
}

function normalizeFrontmatterKeys(data: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    normalized[toSnakeCase(key)] = value
  }
  return normalized
}

export function parseFrontmatter(
  filePath: string,
  fileContents: string
): { frontmatter: ArticleFrontmatter; rawBody: string } {
  const { data, content } = matter(fileContents)
  const normalized = normalizeFrontmatterKeys(data)

  const missing = REQUIRED_FIELDS.filter((field) => normalized[field] === undefined || normalized[field] === null)
  if (missing.length > 0) {
    throw new Error(
      `[content/articles] ${filePath}: 필수 프론트매터 필드 누락 — ${missing.join(", ")}`
    )
  }

  return {
    frontmatter: normalized as unknown as ArticleFrontmatter,
    rawBody: content,
  }
}
