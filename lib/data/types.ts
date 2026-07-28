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
  date: string
  /** QuickSearch 태그 필터 매칭에 사용 (Article.tags와 동일) */
  tags: string[]
}

export interface TocItem {
  /** 본문 heading의 anchor id와 매칭 (활성 상태 하이라이트용) */
  id: string
  label: string
  /** 계층형 점 표기 — h2 "02", h3 "02.1", h4 "02.1.1" */
  order: string
  /** h2/h3/h4 구분 — TOC 인덴트 렌더링에 사용 */
  depth: 2 | 3 | 4
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
  title: string
  date: string
  /** 수정 이력이 있을 때만 존재; 없으면 date와 동일한 값으로 간주 */
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
export const DEFAULT_THUMBNAIL_LIGHT = "/images/default-thumbnail-light.svg"
/** 아티클 상세 페이지 최상단 히어로 전용 — 홈 카드 그리드용과 달리 배경 그라디언트/글로우가 빠진
 * 투명 배경 버전이라 페이지 배경 위에 얹었을 때 이질감이 없다 */
export const DEFAULT_THUMBNAIL_DETAIL = "/images/default-thumbnail-less.svg"
export const DEFAULT_THUMBNAIL_DETAIL_LIGHT = "/images/default-thumbnail-light-less.svg"

/** 썸네일이 없는 글에 쓸 폴백을 소비처(홈 그리드/캐러셀 vs 아티클 상세 히어로)와 현재 테마에 맞게
 * 한 곳에서 고른다 — 각 컴포넌트가 `isDark ? A : B` 삼항식을 따로 들고 있으면 폴백 페어가 하나
 * 늘어날 때마다 소비처 전부를 찾아 고쳐야 하고, 실제로 캐러셀 한 곳을 빠뜨렸던 적이 있다 */
export function resolveDefaultThumbnail(
  explicitSrc: string | undefined,
  isDark: boolean,
  variant: "grid" | "detail" = "grid"
): string {
  if (explicitSrc) return explicitSrc
  if (variant === "detail") return isDark ? DEFAULT_THUMBNAIL_DETAIL : DEFAULT_THUMBNAIL_DETAIL_LIGHT
  return isDark ? DEFAULT_THUMBNAIL : DEFAULT_THUMBNAIL_LIGHT
}

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

export interface BookmarkItem {
  title: string
  url: string
  description?: string
}

export interface BookmarkCategory {
  name: string
  /** lucide-react 아이콘 이름 (예: "code", "palette") — 없으면 텍스트 라벨만 표시 */
  icon?: string
  items?: BookmarkItem[]
  /** 하위 카테고리 — 재귀 깊이 제한 없음. depth 0만 큰 헤딩이고 depth 1 이상은 전부 동일한 서브헤딩 스타일을 재사용한다 */
  categories?: BookmarkCategory[]
}
