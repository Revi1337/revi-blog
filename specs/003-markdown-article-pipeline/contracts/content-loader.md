# Contract: Content Loader Public Interface

이 기능은 외부 API가 아니라 애플리케이션 내부 모듈이므로, "계약"은 (1) `lib/data/articles.ts`가
계속 지켜야 하는 함수 시그니처, (2) 콘텐츠 작성자가 지켜야 하는 `.md` 파일 형식이다.

## 1. `lib/data/articles.ts` (어댑터 — 기존 export 시그니처 유지)

```ts
export function getArticleBySlug(slug: string): Article | undefined
export const articles: Article[]        // publishedAt 내림차순 정렬 상태
export const blogCards: BlogCardData[]  // articles로부터 파생 (title, slug, thumbnail?, publishedAt)
```

- `app/article/[slug]/page.tsx`, `app/page.tsx`는 이 세 export만 사용하도록 유지한다.
- **제거되는 export**: `CODE_BLOCK_PLACEHOLDER`, `CODE_BLOCK_SOURCE`, `METRICS_PLACEHOLDER` — 이번
  기능으로 플레이스홀더 조립 방식 자체가 사라지므로 더 이상 필요하지 않다. 이를 사용하던
  `app/article/[slug]/page.tsx`의 `split()` 로직도 함께 제거되고, `article.bodyHtml`을 그대로
  `dangerouslySetInnerHTML`로 렌더링하는 단일 블록으로 단순화된다.

## 2. `lib/content/loader.ts` (신규 — 내부 모듈)

```ts
export function loadArticles(): Article[]
```

- `content/articles/*.md` 전체를 읽고 파싱해 `Article[]`을 반환한다(모듈 로드 시 1회 평가, 동기 호출).
- 프론트매터 필수 필드 누락 또는 slug 중복 시 `Error`를 throw한다 (data-model.md Validation Rules 참고).
- `lib/data/articles.ts`가 이 함수의 결과를 모듈 최상위에서 호출해 `articles`/`blogCards`를 구성한다.

## 3. 콘텐츠 작성자를 위한 `.md` 파일 형식 (사실상의 공개 계약)

```markdown
---
title: "아티클 제목"
category: "SYSTEM_ARCHITECTURE"
publishedAt: "2024-10-12"
updatedAt: "2024-11-05"      # optional
tags: ["GO_1.21", "REDIS"]
thumbnail: "https://..."      # optional
slug: "custom-slug"           # optional — 없으면 파일명 사용
readingTimeMinutes: 12        # optional — 없으면 자동 계산
---

## 섹션 제목

본문 내용...

​```ts {2-3} title="server.ts"
const a = 1
const b = 2 // highlighted
const c = 3 // highlighted
​```

​```metrics
P99_LATENCY: 120ms
THROUGHPUT: 2.4M
ERROR_RATE: 0.004%
​```
```

- 프론트매터는 YAML.
- H2/H3 heading은 자동으로 TOC 항목이 된다 — 별도 설정 불필요.
- 코드 블록 라인 하이라이트: ` ```lang {n,n-n} ` 문법 (Obsidian/Astro Expressive Code와 동일 관례).
- 성능 지표 카드: 언어 태그가 `metrics`인 코드 펜스, 각 줄은 `LABEL: VALUE`.
