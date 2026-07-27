# Phase 1 Data Model: Markdown 기반 아티클 콘텐츠 파이프라인

## Entities

### ArticleFrontmatter (입력 — 파일 파싱 직후, 검증 전)

`gray-matter`가 각 `.md` 파일에서 추출하는 원시 프론트매터. 검증 전이므로 필드 존재를 보장하지 않는다.

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | ✅ | 누락 시 빌드 실패 (FR-006) |
| `category` | string | ✅ | 누락 시 빌드 실패 |
| `publishedAt` | string (ISO date) | ✅ | 누락 시 빌드 실패; prev/next 정렬 기준 |
| `updatedAt` | string (ISO date) | optional | 없으면 `Article.updatedAt`은 `undefined` (기존 계약 유지) |
| `tags` | string[] | ✅ | 빈 배열은 허용, 필드 자체 누락은 실패 |
| `thumbnail` | string (URL) | optional | 없으면 `DEFAULT_THUMBNAIL` 폴백 |
| `slug` | string | optional | 없으면 파일명(확장자 제외)으로 폴백 |
| `readingTimeMinutes` | number | optional | 없으면 본문 텍스트로부터 자동 계산 |

### ArticleContentFile

파일시스템상의 원자 단위. `content/articles/<slug>.md` 하나 = `ArticleContentFile` 하나.

- `filePath`: 절대 경로 (에러 메시지에 사용)
- `frontmatter`: `ArticleFrontmatter`
- `rawBody`: 프론트매터를 제외한 마크다운 본문 원문

### ParsedArticle (출력 — 기존 `Article` 타입, `lib/data/types.ts` 그대로 재사용)

로더의 최종 산출물. 기존 `Article` 인터페이스와 필드 단위로 1:1 대응하며 **타입 자체는 변경하지
않는다**:

- `slug`, `category`, `title`, `publishedAt`, `updatedAt?`, `tags`, `thumbnail?` — frontmatter에서 직접 매핑
- `readingTimeMinutes` — frontmatter 값 또는 자동 계산 값
- `bodyHtml` — remark→rehype 파이프라인의 최종 HTML 문자열. 코드 블록(라인 하이라이트 포함)과
  metrics 카드까지 전부 포함된 완결된 HTML (더 이상 플레이스홀더로 쪼개지지 않음)
- `toc: TocItem[]` — 본문 heading(H2/H3/H4)에서 자동 파생
- `metrics: MetricCard[]` — 본문의 `metrics` 커스텀 블록에서 파생. 블록이 없으면 빈 배열
  (`MetricCardGrid`는 이미 빈 배열일 때 `null` 렌더링을 지원하므로 하위 호환)
- `prev?`, `next?: ArticleNavRef` — `publishedAt` 내림차순 정렬 기준 자동 계산 (research.md 참고)

### TocItem (변경 없음, 기존 타입 재사용)

`{ id, label, order }` — heading 텍스트가 `label`, `github-slugger` 결과가 `id`, 문서 내 순서가 `order`.

### MetricCard (변경 없음, 기존 타입 재사용)

`{ label, value }` — `metrics` 코드펜스 안의 `LABEL: VALUE` 각 줄이 하나의 항목.

### MetricsBlockDirective (신규 — 파싱 중간 표현, 외부 노출 없음)

mdast 상에서 `code` 노드(`lang === "metrics"`)를 커스텀 remark 플러그인이 감지했을 때의 중간 표현.
`value`를 줄바꿈 기준으로 분리하고, 각 줄을 최초 `:` 기준으로 `label`/`value`로 분리한다. 파싱
실패(콜론 없는 줄 등)는 해당 줄을 무시하고 빌드는 계속 진행한다(치명적이지 않은 콘텐츠 오탈자로 간주).

### CodeHighlightDirective (신규 — 파싱 중간 표현, 외부 노출 없음)

코드 펜스 meta 문자열(예: ` ```ts {2-3,10} title="server.ts" `)에서 `rehype-pretty-code`가 파싱하는
표준 표기. `{n,n-n}` 부분이 하이라이트 대상 줄, `title="..."`가 파일명 라벨.

## Relationships

```
ArticleContentFile (1) --parse--> ArticleFrontmatter + rawBody
rawBody --remark/rehype pipeline--> bodyHtml + TocItem[] + MetricCard[]
ArticleFrontmatter + 파생 필드 --assemble--> ParsedArticle (= Article)
ParsedArticle[] --sort by publishedAt desc--> prev/next 관계 계산
ParsedArticle[] --project--> BlogCardData[] (slug, title, thumbnail?, publishedAt)
```

## Validation Rules (FR-006, Edge Cases 대응)

1. 필수 프론트매터 필드(`title`, `category`, `publishedAt`, `tags`) 중 하나라도 없으면, 로더는
   `파일 경로 + 누락 필드명`을 포함한 에러를 던지고 빌드를 중단시킨다.
2. 동일한 `slug`(명시적 지정 또는 파일명 유도)를 가진 파일이 2개 이상이면, 로더는 충돌한 파일
   경로 목록을 포함한 에러를 던진다.
3. `metrics` 블록 안에서 `:` 없이 작성된 줄은 무시하고 나머지 유효한 줄만 `MetricCard[]`로 반영한다
   (빌드를 막지 않는다 — 콘텐츠 오탈자 수준의 문제로 간주).
4. 코드 블록의 라인 하이라이트 지시자가 실제 줄 수를 벗어나면(`rehype-pretty-code` 기본 동작을
   따름) 렌더링은 실패하지 않고 존재하는 줄까지만 강조되거나 무시된다.
