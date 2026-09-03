# Data Model: 헤딩 접기/펼치기

이 기능에는 데이터베이스나 영속 스토리지가 없다(spec.md Assumptions — 접힘 상태 비영속). 여기서
"엔티티"는 빌드 타임에 생성되는 문서 구조와, 그 구조가 브라우저에서 갖는 런타임 상태를 뜻한다.

## HeadingFoldSection

아티클 본문의 한 헤딩(H1~H6)과, 그 헤딩부터 다음에 나오는 동급 이상 헤딩 직전까지의 콘텐츠 범위.
빌드 타임에 `remark-heading-fold.ts`가 mdast에서 만들고, `remarkRehype`가 최종적으로
`<details>/<summary>` HTML로 직렬화한다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `level` | `1..6` | 원본 헤딩의 depth(H1~H6) — 중첩 판단 기준 |
| `headingId` | `string` | `remark-toc.ts`가 이미 부여한 github-slugger id(`#id`) — 이 플러그인은 새 id를 만들지 않고 기존 id를 그대로 `<summary>` 안 헤딩에 유지한다 |
| `open` | `boolean` (HTML `open` 속성) | 항상 `true`로 시작(spec.md FR-005) — 별도 상태 관리 없이 HTML 속성 자체가 상태다 |
| `children` | `Node[]` | 원본 헤딩 다음에 오던 형제 노드들(문단/코드/이미지/표/콜아웃/다이어그램/하위 `HeadingFoldSection`) 그대로 |
| `parent` | `HeadingFoldSection \| null` | 더 얕은(작은 depth) 조상 섹션. 트리의 루트는 `null` |

**불변 조건**:
- `level`이 작을수록(H2 < H3) 상위 — `parent.level < level`이 항상 성립.
- 한 `HeadingFoldSection`을 닫아도(`open = false`) 그 `children` 안에 중첩된 하위
  `HeadingFoldSection`들의 `open` 값 자체는 바뀌지 않는다(spec.md 요구사항 3 — 상태 독립성). 다만
  브라우저 렌더링상 부모가 닫히면 자식은 화면에서 보이지 않는다(당연한 결과, spec.md와 동일 표현).
- `HeadingFoldSection`은 문서 최상위 레벨에서만 생성된다 — blockquote/list 등에 중첩된 헤딩은
  대상에서 제외(research.md §3 Assumption).

**상태 전이**:

```text
open=true (기본, 페이지 로드 시)
  --[독자가 <summary> 클릭 또는 포커스 후 Enter/Space]--> open=false
open=false
  --[독자가 <summary> 클릭 또는 포커스 후 Enter/Space]--> open=true
  --[expandFoldAncestors(id)가 이 섹션을 조상으로 가진 헤딩으로 이동]--> open=true
```

`open`은 브라우저가 관리하는 DOM 상태일 뿐 애플리케이션 상태로 미러링되지 않는다 — 페이지를
벗어나면(새로고침 포함) 소멸하고 다음 로드는 항상 `open=true`로 시작한다.

## FoldAncestorExpansion (동작, 엔티티 아님)

"타겟 heading id로 이동할 때 그 조상 `HeadingFoldSection`들을 전부 `open=true`로 만든다"는 동작
자체를 가리키는 이름 — 저장되는 데이터는 없고, `heading-fold-ancestors.ts`의 함수 호출로만 존재한다.
입력은 `headingId: string`, 부수효과는 `document.getElementById(headingId).closest("details")`를
반복 호출해 찾은 모든 조상 `<details>`의 `.open`을 `true`로 설정하는 것.
