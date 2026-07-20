# Contract: Pipeline Plugin Interfaces

이 기능은 외부 API가 아니라 애플리케이션 내부 렌더링 파이프라인이므로, "계약"은 (1) 각 신규
모듈이 지켜야 하는 함수 시그니처, (2) 콘텐츠 작성자가 지켜야 하는 신규 마크다운 문법이다.

## 1. `lib/content/strip-comments.ts` (신규)

```ts
export function stripComments(rawBody: string): string
```

- `%%...%%` 쌍을 전부 제거하고, 닫히지 않은 `%%`는 파일 끝까지 제거한 문자열을 반환한다.
- 입력에 `%%`가 전혀 없으면 입력을 그대로 반환한다(no-op 보장).
- `lib/content/loader.ts`에서 `parseFrontmatter()`가 반환한 `rawBody`에 `renderMarkdown()` 호출
  직전 적용한다.

## 2. `lib/content/plugins/remark-callout.ts` (신규)

```ts
export function remarkCallout(): (tree: Root) => void
```

- `blockquote` mdast 노드 중 첫 문단이 `[!TYPE]` 패턴에 매치하는 것만 콜아웃 hast로 치환한다.
- 매치되지 않는 일반 blockquote는 그대로 통과시킨다(no-op 보장, 회귀 방지).
- `remarkRehype` 이전, `remark-gfm` 이후에 파이프라인에 등록한다.

## 3. `lib/content/plugins/remark-highlight.ts` (신규)

```ts
export function remarkHighlight(): (tree: Root) => void
```

- `text` mdast 노드 안의 `==...==` 구간만 `<mark>` hast로 치환한다.
- `==`가 없는 텍스트 노드는 그대로 통과시킨다(no-op 보장).

## 4. `lib/content/plugins/remark-toc.ts` (수정 — 기존 시그니처 유지)

```ts
export function remarkToc(): (tree: Root, file: VFile) => void
```

- **변경 전**: h2/h3 heading에만 `hProperties.id` 부여 + `TocItem[]` 수집.
- **변경 후**: 모든 heading(h1~h6)에 `hProperties.id` 부여, `TocItem[]` 수집은 h2/h3로 유지.
- `file.data.toc`의 타입(`TocItem[]`)과 값 범위(h2/h3만)는 기존과 동일 — 하위 호환 유지.

## 5. `lib/content/pipeline.ts` (수정 — 기존 시그니처 유지)

```ts
export interface RenderResult {
  bodyHtml: string
  toc: TocItem[]
}
export async function renderMarkdown(rawBody: string): Promise<RenderResult>
```

- 시그니처 변경 없음. 내부 unified 체인에 `remark-math`, `remarkCallout`, `remarkHighlight`,
  `rehype-katex`를 추가로 등록한다.
- 신규 플러그인 등록 순서: `remark-parse → remark-gfm → remark-math → remarkCallout →
  remarkHighlight → remark-metrics → remark-toc → remarkRehype → rehype-pretty-code →
  rehype-katex → rehype-stringify`.

## 6. `lib/content/loader.ts` (수정)

```ts
export async function loadArticles(): Promise<LoadedContent>
```

- 시그니처 변경 없음. `renderMarkdown(rawBody)` 호출을 `renderMarkdown(stripComments(rawBody))`로
  교체한다.

## 7. 콘텐츠 작성자를 위한 신규 문법 (사실상의 공개 계약)

```markdown
> [!WARNING]- 커스텀 제목
> 접힌 상태로 시작하는 경고 콜아웃

> [!TIP]
> 기본 펼침 상태의 팁 콜아웃

인라인 수식 $O(n \log n)$ 그리고 블록 수식:

$$
\sum_{i=1}^{n} x_i
$$

이 문장은 ==강조==되어야 한다.

공개 문장. %%이 메모는 발행되면 안 됨%% 다음 공개 문장.

#### h4 레벨 소제목도 앵커 id를 가진다 (TOC에는 미노출)

<details>
<summary>접기/펼치기 세부 설명</summary>
raw HTML details는 이미 동작하며, 이번 변경으로 스타일만 다듬어진다.
</details>
```

- 콜아웃 지원 타입: `note`, `tip`, `warning`, `danger`(별칭: `caution`), `info`, `success`,
  `question`, `bug`, `example`, `quote`. GitHub Alerts(`NOTE`/`TIP`/`IMPORTANT`/`WARNING`/`CAUTION`,
  대소문자 무관)는 동일 컴포넌트로 매핑된다.
- 콜아웃 접기: 타입 뒤 `-`는 기본 접힘, `+`는 기본 펼침, 생략 시 접기 UI 없이 항상 펼쳐진 상태.
