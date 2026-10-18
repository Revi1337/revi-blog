import matter from "gray-matter"

export interface ArticleFrontmatter {
  slug?: string
  title: string
  date: string
  updated_at?: string
  tags: string[]
  description?: string
  thumbnail?: string
  /** 없으면 "cover"(꽉 채워 크롭) — 로고처럼 크롭하면 안 되는 썸네일만 "contain"으로 전체 노출 */
  thumbnail_fit?: "cover" | "contain"
  /** 없으면 재생 버튼 자체를 노출하지 않음 — 브라우저에서 바로 재생 가능한 오디오 URL.
   * 배열로 여러 개를 주면(예: 챕터별 오디오) 재생 시 선택 드롭다운이 뜬다. */
  audio?: string | string[]
  reading_time_minutes?: number
  /** 없으면 true — 홈 카드 그리드/캐러셀 노출 여부 */
  show_on_homepage?: boolean
  show_on_page?: boolean
}

const REQUIRED_FIELDS = ["title", "date", "tags"] as const

const CAMEL_CASE_CHAR = /[A-Z]/g

/** `updatedAt` → `updated_at` — camelCase로 써도 snake_case 필드와 동일하게 인식되도록 정규화 */
function toSnakeCase(key: string): string {
  return key.replace(CAMEL_CASE_CHAR, (char) => `_${char.toLowerCase()}`)
}

/** YAML은 `2026-01-07`처럼 따옴표 없는 날짜를 문자열이 아닌 Date로 파싱하므로 다시 문자열로 되돌린다.
 * 시간까지 적었으면(`2026-01-07T10:30:00`) 정렬(loader.ts)이 시간까지 반영할 수 있도록 ISO
 * 문자열 그대로 보존한다 — 화면에는 어차피 날짜만 잘라서 보여준다(formatCardDate/formatDate). */
function toIsoString(value: Date): string {
  return value.toISOString()
}

const DATE_FIELDS = ["date", "updated_at"] as const

function normalizeFrontmatterKeys(data: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    normalized[toSnakeCase(key)] = value
  }
  for (const field of DATE_FIELDS) {
    const value = normalized[field]
    if (value instanceof Date) {
      normalized[field] = toIsoString(value)
    }
  }
  if (normalized.show_on_page !== undefined && normalized.show_on_homepage === undefined) {
    normalized.show_on_homepage = normalized.show_on_page
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
