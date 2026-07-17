# Data Model: 정적 HTML 블로그 컴포넌트 재구현

이 feature는 DB/외부 저장소가 없다(spec Assumptions). 아래는 `lib/data/`에 하드코딩될 정적 데이터의 형태(TypeScript 타입)이며, "Key Entities" 절을 구현 가능한 구조로 옮긴 것이다.

## Theme

```ts
type Theme = "dark" | "light"
```
- `<html>` class로만 표현되는 값이지 별도 저장/영속화 대상이 아님 (영속화는 002 범위).

## NavLink (공유 UI 요소 — 네비게이션)

```ts
interface NavLink {
  label: string        // "Home" | "About" | "Feeds" | "Bookmark"
  href: string
}
```
- 단일 배열(`lib/data/nav.ts`)로 관리되어 홈/아티클 상세 4개 화면이 모두 참조 (FR-004, SC-003).

## BlogCard (홈 화면 카드 그리드)

```ts
interface BlogCardData {
  slug: string           // Article.slug와 동일한 값 — 별도 id를 두지 않고 slug를 식별자로 재사용
  title: string
  thumbnail?: string     // 없으면 기본 썸네일 이미지로 폴백
  publishedAt: string    // ISO date
}
```
- 상태 전이 없음(정적 목록). Pagination이 페이지당 표시 개수를 슬라이스.
- `href`는 별도 필드로 두지 않고 렌더링 시 `slug`로부터 `/article/${slug}`를 계산한다 — `slug`와 어긋날 수 있는 중복 데이터를 없앤다.

## Article (아티클 상세)

```ts
interface Article {
  slug: string
  category: string        // "SYSTEM_ARCHITECTURE" | "BACKEND" | ...
  title: string
  publishedAt: string
  updatedAt?: string       // 수정 이력이 있을 때만 존재; 없으면 publishedAt과 동일한 값으로 간주
  readingTimeMinutes: number
  tags: string[]
  thumbnail?: string        // 없으면 기본 썸네일 이미지로 폴백 (BlogCardData와 동일 필드명)
  bodyHtml: string          // Shiki로 사전 하이라이팅된 코드 블록을 포함한 본문 HTML
  toc: TocItem[]
  metrics: MetricCard[]
  prev?: { slug: string; title: string }
  next?: { slug: string; title: string }
}

interface TocItem {
  id: string          // 본문 heading의 anchor id와 매칭 (활성 상태 하이라이트용)
  label: string
  order: number
}

interface MetricCard {
  label: string        // "P99_LATENCY" | "THROUGHPUT" | "ERROR_RATE"
  value: string
}
```

## 관계

- `BlogCardData.slug`는 `Article.slug`와 동일한 값을 참조하는 식별자다 — DB가 없으므로 별도 opaque `id`를 두지 않고, 라우트(`/article/[slug]`)와 콘텐츠 양쪽에서 이미 고유해야 하는 `slug`를 그대로 식별자로 쓴다.
- `NavLink[]`, `MetricCard[]`, `TocItem[]`은 부모 엔티티에 종속된 값 객체이며 독립적인 식별자/생명주기가 없음.
- `thumbnail`(BlogCardData, Article 공통)이 없을 때는 렌더링 시 고정된 기본 이미지로 폴백한다.
- 검증 규칙: `TocItem.id`는 `bodyHtml` 내 동일 id를 가진 heading이 반드시 존재해야 함(그렇지 않으면 활성 하이라이트가 어떤 항목과도 매칭되지 않음) — 구현 시 정적 데이터 작성 규칙으로만 강제(런타임 검증 없음, 콘텐츠가 하드코딩이라 스키마 검증 도구는 이 feature 범위 밖).
