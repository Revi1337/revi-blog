# Phase 1 Data Model: Mermaid 다이어그램 렌더링

이 기능은 DB나 영속 데이터를 추가하지 않는다. 아래 "엔티티"는 모두 클라이언트 런타임에만 존재하는
DOM/컴포넌트 상태이며, `lib/data/types.ts`에 신규 타입을 추가하지 않는다(TOC/이미지처럼 서버가
미리 구조화해 내려주는 데이터가 아니라, 클라이언트가 이미 렌더링된 `bodyHtml`을 읽어 그 자리에서
파생시키는 상태이기 때문).

## Entities

### MermaidDiagramBlock (개념 정리 — 신규 타입 아님, DOM에서 직접 파생)

`MermaidDiagramHandler`가 마운트 시 `article-body` DOM을 훑어 찾아내는 대상. 별도 배열로
구조화해 상위 컴포넌트에 전달하지 않는다 — `ImageLightboxHandler`가 `Article.images`를 서버에서
받는 것과 달리, 이 기능은 소스 코드가 이미 `bodyHtml` 문자열(및 그 DOM) 안에 그대로 있으므로
런타임에 그 자리에서 읽어내는 것으로 충분하다.

| Field | 도출 방법 | Notes |
|---|---|---|
| `source` | `pre[data-language="mermaid"]`의 `textContent` | Mermaid 원본 코드. Shiki 하이라이트는 텍스트 노드를 바꾸지 않으므로 항상 원본과 정확히 일치(research.md) |
| `container` | `pre[data-language="mermaid"]`를 감싸는 `figure[data-rehype-pretty-code-figure]` | 렌더링된 SVG를 삽입할 기준 위치. `pre` 자체는 숨김 처리(삭제 아님)해 복사 버튼이 계속 `textContent`를 읽을 수 있게 유지 |
| `renderState` | `"pending" \| "rendered" \| "error"` | 컴포넌트 로컬 상태(전역 저장 안 함). `error`면 `pre`를 숨기지 않고 그대로 노출(FR-009) |
| `svgId` | `mermaid.render()` 호출 시 부여하는 고유 id | 같은 페이지에 다이어그램이 여럿이면 각 렌더 호출마다 유일해야 함(Mermaid 라이브러리 요구사항) |

### MermaidLightboxState (신규 — 확대 보기 모달의 클라이언트 로컬 상태)

`svg-pan-zoom` 인스턴스가 내부적으로 들고 있는 상태를 그대로 노출하는 개념적 모델. React
state로 별도 미러링하지 않고 라이브러리 인스턴스에 위임한다(불필요한 리렌더 방지).

| Field | Type | Notes |
|---|---|---|
| `pan` | `{ x: number, y: number }` | 상하좌우 버튼 클릭 시 `panBy()`로 갱신(FR-006) |
| `zoom` | number | 돋보기 +/- 버튼 클릭 시 `zoomIn()`/`zoomOut()`으로 갱신(FR-008) |
| `isOpen` | boolean | 확대 버튼 클릭 시 true, 배경 클릭/ESC/닫기 버튼으로 false |

**리셋 계약(FR-007)**: 리셋 버튼은 `pan`/`zoom` 모두를 `svg-pan-zoom`의 `reset()` 단일 호출로
동시에 초기값으로 되돌린다 — 두 값을 각각 별도로 되돌리는 로직을 만들지 않는다(라이브러리가
이미 원자적으로 제공).

## State Transitions

```text
MermaidDiagramBlock.renderState:
  pending --(mermaid.render() 성공)--> rendered
  pending --(mermaid.render() 실패, catch)--> error
  rendered --(useTheme().isDark 변경)--> pending --(재시도)--> rendered | error

MermaidLightboxState.isOpen:
  false --(확대 버튼 클릭, renderState === "rendered"인 경우에만 버튼 활성)--> true
  true --(닫기 버튼 | 배경 클릭 | ESC)--> false
```

`renderState === "error"`인 블록은 확대 버튼 자체를 표시하지 않는다 — 그려지지 않은 다이어그램을
확대할 수는 없으므로, 폴백으로 노출되는 원본 코드 블록에는 코드 복사 버튼만 남는다(기존
`rehype-code-copy-button.ts`가 이미 그렇게 동작함, 별도 처리 불필요).
