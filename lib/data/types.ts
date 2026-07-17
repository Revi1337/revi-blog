export type Theme = "dark" | "light"

export interface NavLink {
  label: string
  href: string
}

export interface BlogCardData {
  /** Article.slug와 동일한 값 — 별도 id를 두지 않고 slug를 식별자로 재사용 */
  slug: string
  title: string
  /** 없으면 기본 썸네일 이미지로 폴백 */
  thumbnail?: string
  publishedAt: string
}

export interface TocItem {
  /** 본문 heading의 anchor id와 매칭 (활성 상태 하이라이트용) */
  id: string
  label: string
  order: number
}

export interface MetricCard {
  label: string
  value: string
}

export interface ArticleNavRef {
  slug: string
  title: string
}

export interface Article {
  slug: string
  category: string
  title: string
  publishedAt: string
  /** 수정 이력이 있을 때만 존재; 없으면 publishedAt과 동일한 값으로 간주 */
  updatedAt?: string
  readingTimeMinutes: number
  tags: string[]
  /** 없으면 기본 썸네일 이미지로 폴백 (BlogCardData와 동일 필드명) */
  thumbnail?: string
  bodyHtml: string
  toc: TocItem[]
  metrics: MetricCard[]
  prev?: ArticleNavRef
  next?: ArticleNavRef
}

export const DEFAULT_THUMBNAIL = "/images/default-thumbnail.svg"
