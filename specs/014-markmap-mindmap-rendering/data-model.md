# Phase 1 Data Model: Markmap 마인드맵 렌더링

이 기능은 DB나 영속 데이터를 추가하지 않는다. `lib/data/types.ts`에도 신규 타입을 추가하지 않는다
— [012](../012-mermaid-diagram-rendering/data-model.md)/[013](../013-plantuml-diagram-rendering/data-model.md)과
동일한 이유로, 서버가 미리 구조화해 내려주는 데이터가 아니라 클라이언트가 이미 렌더링된
`bodyHtml`을 읽어 그 자리에서 파생시키는 상태이기 때문이다. 다만 012/013과 달리 이번엔 "렌더링
결과"가 정적 값이 아니라 **살아있는 인스턴스**라는 점이 핵심 차이다.

## Entities

### MarkmapDiagramBlock (개념 정리 — 신규 타입 아님, DOM에서 직접 파생)

`MarkmapDiagramHandler`가 마운트 시 `article-body` DOM을 훑어 찾아내는 대상.

| Field | 도출 방법 | Notes |
|---|---|---|
| `source` | `pre[data-language="markmap"]`의 `textContent` | Markmap 원본 마크다운 아웃라인. Shiki에 `markmap` 문법이 없어 하이라이트 없이 평문으로 남으므로 원본과 항상 정확히 일치 |
| `container` | `pre[data-language="markmap"]`를 감싸는 `figure[data-rehype-pretty-code-figure]` | 렌더링된 SVG를 삽입할 기준 위치. `pre` 자체는 숨김 처리(삭제 아님)해 복사 버튼이 계속 `textContent`를 읽을 수 있게 유지 |
| `instance` | `markmap-view`의 `Markmap.create(svgEl, { zoom: false, pan: false, autoFit: true }, root)` 반환값 | **컴포넌트가 계속 참조를 들고 있어야 하는 살아있는 객체** — 노드 클릭 토글 핸들러가 이 인스턴스를 통해 SVG에 바인딩되어 있다. `zoom: false, pan: false`로 d3-zoom의 드래그(팬)·휠(줌)·더블클릭·핀치 줌은 인라인에서 전부 비활성화되어 있다([amended] — Mermaid/PlantUML macOS 프리뷰와의 인터랙션 일관성, 페이지 스크롤 하이재킹 문제로 변경, spec.md FR-005). 참조를 버려도 DOM 리스너 자체는 SVG 노드가 살아있는 한 계속 동작하지만(브라우저 GC는 DOM에서 참조 가능한 리스너를 수거하지 않음), 언마운트 시 `destroy()` 정리와 테마 전환 시 재렌더링 여부 판단 등에 필요해 유지한다 |
| `renderState` | `"pending" \| "rendered" \| "error"` | 컴포넌트 로컬 상태(전역 저장 안 함). `error`면 `pre`를 숨기지 않고 그대로 노출(FR-012, Mermaid/PlantUML과 동일 관례) |
| `foldState` (노드별) | `markmap-view` 인스턴스 내부 상태 | 이 기능이 별도로 관리하지 않는다 — 독자가 가지를 접고 펼치는 조작(FR-004)은 `markmap-view`가 자체적으로 SVG 데이터 속성/내부 상태로 추적한다. 페이지를 벗어나거나 새로고침하면 인스턴스 자체가 사라지므로 자동으로 초기화된다(spec.md Assumptions). `zoom:false, pan:false`와 무관한 별도 클릭 리스너(`handleClick`)로 동작해 인라인 팬/줌 비활성화의 영향을 받지 않는다 |
| `pan`/`zoom` (뷰 상태) | N/A | 인라인에는 존재하지 않는다 — 본문 마인드맵은 뷰(위치/배율)를 조작할 수 없으므로 이 상태 자체가 없다([amended], spec.md FR-005). 확대/축소·이동은 `MarkmapLightboxState`(아래)에서만 상태로 존재한다 |

### MarkmapLightboxState — 확대 보기 창

Mermaid/PlantUML과 달리 기존 `MermaidLightboxState`를 재사용하지 않는다(research.md Decision —
`svgMarkup: string` 스냅샷 계약이 아니라 원본 소스를 받아 모달 안에서 독립적으로 재렌더링해야
하기 때문). 신규로 정의한다.

| Field | 설명 | Notes |
|---|---|---|
| `isOpen` | 모달 노출 여부 | 확대 버튼 클릭 시 true, 닫기(배경 클릭/ESC/닫기 버튼)로 false |
| `source` | 확대 버튼 클릭 시점의 `MarkmapDiagramBlock.source` 그대로 전달 | 본문과 동일한 원본이지만, 모달은 이 값으로 **완전히 새로운** `markmap-view` 인스턴스를 렌더링한다 — 본문의 `instance`나 `foldState`를 참조/공유하지 않는다 |
| `instance` | 모달 전용 `Markmap.create()` 반환값 | 항상 전체 펼침 기본 상태로 시작(본문에서 접어둔 가지 상태를 이어받지 않음 — Mermaid/PlantUML 모달이 항상 정규 상태의 새 렌더링을 보여주는 것과 일관, spec.md Assumptions) |
| `pan`/`zoom` | 모달 안 이동/확대 배율 | `open-markmap-lightbox.ts`가 `instance`의 d3-zoom transform을 통해 관리. 리셋 버튼 클릭 시 두 값 모두 초기 상태로 복귀(FR-009) |

## State Transitions

```text
MarkmapDiagramBlock.renderState:
  pending --(markmap-lib 파싱 성공 + markmap-view 렌더링 성공)--> rendered
  pending --(파싱/렌더링 중 예외 발생)--> error
```

`renderState === "error"`인 블록은 확대 버튼을 표시하지 않는다 — Mermaid/PlantUML의 동일 규칙
([012](../012-mermaid-diagram-rendering/data-model.md)/[013](../013-plantuml-diagram-rendering/data-model.md))을
그대로 따른다. 폴백으로 노출되는 원본 코드 블록에는 코드 복사 버튼만 남는다(기존
`rehype-code-copy-button.ts`가 이미 그렇게 동작함, 별도 처리 불필요).

```text
MarkmapLightboxState.isOpen:
  false --(확대 버튼 클릭, renderState === "rendered"인 블록만 가능)--> true
  true --(배경 클릭 | ESC | 닫기 버튼 | 팬/줌 리셋과 무관)--> false
```

모달이 `false`로 전환될 때 `instance`는 파괴(`destroy()`)되고 다음에 열릴 때 다시 새로
렌더링된다 — 본문 인스턴스와 독립적이므로 본문 쪽 `foldState`에 영향을 주지 않는다(Key Entities
"확대 보기 창"의 spec.md 서술과 일치).

테마 전환(`useTheme().isDark` 변경)은 재렌더링을 필요로 하지 않는다(research.md "다크/라이트
테마 반영 방식" 확정) — `markmap-view`가 내장한 `.markmap-dark .markmap` CSS 변수 오버라이드를
쓰므로, `MarkmapDiagramHandler`는 `[data-markmap-diagram]` 컨테이너에 `markmap-dark` 클래스만
토글한다. `instance`(살아있는 Markmap 인스턴스)나 `foldState`는 전혀 건드리지 않으므로, 테마
전환이 본문에서 조작 중이던 접기/펼치기 상태를 초기화하지 않는다.
