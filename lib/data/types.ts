export type Theme = "dark" | "light"

export interface NavLink {
  label: string
  href: string
}

/** 없으면 "cover"(꽉 채워 크롭) — 로고처럼 크롭하면 안 되는 썸네일만 "contain"으로 전체 노출 */
export type ThumbnailFit = "cover" | "contain"

export interface BlogCardData {
  /** Article.slug와 동일한 값 — 별도 id를 두지 않고 slug를 식별자로 재사용 */
  slug: string
  title: string
  /** 없으면 기본 썸네일 이미지로 폴백 */
  thumbnail?: string
  thumbnailFit?: ThumbnailFit
  publishedAt: string
  /** QuickSearch 태그 필터 매칭에 사용 (Article.tags와 동일) */
  tags: string[]
}

export interface TocItem {
  /** 본문 heading의 anchor id와 매칭 (활성 상태 하이라이트용) */
  id: string
  label: string
  order: number
  /** h2/h3 구분 — TOC 인덴트 렌더링에 사용 */
  depth: 2 | 3
}

export interface ArticleImage {
  src: string
  alt: string
  /** 본문 내 등장 순서(0부터 시작) — 배열 인덱스와 항상 일치하며, 본문 <img>의
   * data-lightbox-index 속성과 매칭된다 (lib/content/plugins/remark-images.ts) */
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
  thumbnailFit?: ThumbnailFit
  bodyHtml: string
  /** 검색 전용 — 마크다운 서식 기호를 제거한 순수 본문 텍스트 */
  plainBody: string
  toc: TocItem[]
  /** 본문에 등장하는 이미지 목록(등장 순서대로) — 이미지 라이트박스 갤러리 데이터(spec 009) */
  images: ArticleImage[]
  metrics: MetricCard[]
  prev?: ArticleNavRef
  next?: ArticleNavRef
  /** 없으면 true — 홈 카드 그리드/캐러셀/검색 노출 여부 */
  showOnHomepage: boolean
}

export const DEFAULT_THUMBNAIL = "/images/default-thumbnail.svg"

/** 검색 대상 — showOnHomepage가 true인 아티클에서만 파생된다 (lib/content/search-index.ts) */
export interface SearchIndexEntry {
  slug: string
  title: string
  plainBody: string
  tags: string[]
}

export type SearchMode = "text" | "tag"

export interface SearchQuery {
  raw: string
  mode: SearchMode
  term: string
}

export interface SearchResult {
  entry: SearchIndexEntry
  /** mode가 "text"일 때만 랭킹에 쓰인다 — "tag" 모드에서는 null */
  matchedIn: "title" | "body" | null
}
