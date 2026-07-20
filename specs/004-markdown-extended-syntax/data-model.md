# Phase 1 Data Model: Markdown Extended Syntax

## Entities

### CalloutDirective (신규 — 파싱 중간 표현, 외부 노출 없음)

`remark-callout.ts`가 `blockquote` mdast 노드에서 `[!TYPE]` 패턴을 감지했을 때의 중간 표현.

| Field | Type | Notes |
|---|---|---|
| `type` | string | 정규화(대문자→소문자, 별칭 매핑) 이전의 원본 타입 문자열. 미상 타입일 때 헤더 라벨로 그대로 사용(FR-014) |
| `resolvedType` | `"note" \| "tip" \| "warning" \| "danger" \| "info" \| "success" \| "question" \| "bug" \| "example" \| "quote"` | 별칭 매핑(GitHub Alerts 5종 포함) 후 스타일 결정에 쓰이는 정규화된 타입. 미상 타입이면 `"note"`로 폴백 |
| `collapseState` | `"none" \| "collapsed" \| "expanded"` | `-` → collapsed, `+` → expanded, 없으면 none(일반 콜아웃, `<details>` 미사용) |
| `title` | string | `[!TYPE]` 뒤에 이어지는 텍스트. 없으면 `type` 원본을 기본 제목으로 사용(FR-005) |
| `children` | mdast 노드 배열 | blockquote 내부의 나머지 콘텐츠(리스트, 코드블록 등 중첩 요소 포함, Edge Case) |

### HighlightSpan (신규 — 파싱 중간 표현, 외부 노출 없음)

`remark-highlight.ts`가 `text` mdast 노드 안에서 `==...==` 패턴을 감지했을 때의 중간 표현. 코드
스팬(`inlineCode`)·코드 블록(`code`) 노드는 애초에 `text` 노드 순회 대상이 아니므로 별도 제외
로직 없이 구조적으로 배제된다(Edge Case).

| Field | Type | Notes |
|---|---|---|
| `plainBefore` | string | `==` 시작 이전의 일반 텍스트 |
| `highlighted` | string | `==`로 감싸진 텍스트(구분자 제외) |
| `plainAfter` | string | 재귀 처리 대상이 되는 나머지 텍스트 |

### HeadingAnchor (개념 정리 — 신규 타입 아님)

기존 `TocItem`과 별개로, 이번 기능으로 "TOC에는 없지만 앵커 id는 있는 heading"이 처음 생긴다.
`lib/data/types.ts`에 새 타입을 추가하지 않는다 — heading의 `id` 속성은 `bodyHtml` 문자열 안에
`<h1 id="...">`처럼 직접 존재하며, 별도 구조화 데이터로 상위 레이어(React)에 노출할 필요가 없다
(TOC 사이드바만 `TocItem[]`을 쓰고, 그 외 앵커는 URL 해시로만 소비됨).

| Field | Type | Notes |
|---|---|---|
| `depth` | 1~6 | heading level. 2/3만 `TocItem`으로 승격, 나머지는 `id` 속성으로만 존재 |
| `id` | string | `github-slugger`로 생성, 문서 전체에서 유일 |

### MathBlock / InlineMath (신규 — `remark-math`가 이미 제공하는 mdast 노드, 프로젝트 코드가 직접 정의하지 않음)

`remark-math`가 파싱 단계에서 생성하는 `math`(블록, `$$...$$`)/`inlineMath`(인라인, `$...$`) mdast
노드를 그대로 사용한다. `rehype-katex`가 이 노드들을 조판된 hast(및 에러 시 `errorColor` 스타일이
적용된 원본 텍스트 hast)로 치환하므로, 프로젝트 코드 레벨에서 별도 타입을 정의하지 않는다.

### CommentSpan (신규 — mdast에 존재하지 않음, 파싱 이전 raw 문자열 단계에서 완전히 소거됨)

`%%...%%`(및 미종료 시 EOF까지)는 `remark-parse`가 문자열을 받기 **이전에** `strip-comments.ts`가
제거하므로, mdast·hast 어느 트리에도 흔적이 남지 않는다. 별도 파싱 중간 표현이 존재하지 않는다 —
이는 이번 데이터 모델에서 유일하게 "AST 엔티티가 아예 생기지 않는 것 자체가 설계"인 항목이다.

## Relationships

```
rawBody (string)
  --stripComments()--> rawBody' (주석 완전 제거, mdast 단계 진입 전)
  --remark-parse--> mdast
  --remark-gfm--> mdast (표/취소선/작업목록/각주/자동링크)
  --remark-math--> mdast (+ math/inlineMath 노드)
  --remark-metrics (기존)--> mdast (metrics 코드펜스 → hast 치환)
  --remark-callout (신규)--> mdast (blockquote[!TYPE] → CalloutDirective → hast 치환)
  --remark-highlight (신규)--> mdast (text 노드 ==..== → HighlightSpan → <mark> hast 치환)
  --remark-toc (수정)--> mdast (heading 전체에 id, h2/h3만 TocItem[] 사이드채널 수집)
  --remarkRehype--> hast
  --rehype-pretty-code (기존)--> hast (코드 블록 Shiki 하이라이팅)
  --rehype-katex (신규)--> hast (math/inlineMath → 조판된 수식 또는 에러 시 원본 텍스트)
  --rehype-stringify--> bodyHtml (string)
```

## Validation Rules (spec.md FR-014, FR-015, Edge Cases 대응)

1. 콜아웃 타입이 매핑 테이블(GitHub Alerts 별칭 포함)에 없으면 `resolvedType = "note"`로 폴백하되,
   렌더링되는 헤더 라벨 텍스트는 원본 `type` 문자열을 그대로 보존한다(FR-014).
2. 콜아웃 blockquote 내부에 리스트·코드블록 등이 중첩되어 있어도, `CalloutDirective.children`은
   변환 없이 그대로 hast로 넘겨 정상 렌더링을 보장한다(Edge Case).
3. `==...==`가 코드 스팬/코드 블록 내부에 있으면 애초에 `text` 노드 순회 대상이 아니므로 변환되지
   않는다 — 이는 별도 검증 로직이 아니라 mdast 구조 자체가 보장하는 불변식이다.
4. 미종료 `%%`(파일 끝까지 이어짐)는 `strip-comments.ts`가 시작 지점부터 파일 끝까지 전부 제거한다
   (Edge Case).
5. 수식 구문 오류는 `rehype-katex`의 `throwOnError: false`로 인해 페이지 전체 렌더링을 중단시키지
   않고, 해당 위치에 원본 텍스트가 `errorColor`로 스타일링되어 표시된다(FR-015).
6. `remark-toc`가 부여하는 heading id는 depth와 무관하게 전체 heading에 적용되지만, `TocItem[]`
   수집은 depth 2/3에서만 이뤄진다 — 두 책임이 같은 `slugger` 인스턴스·같은 순회 패스를 공유해
   id 불일치가 구조적으로 발생하지 않는다(003 결정 계승).
