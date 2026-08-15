# Phase 1 Data Model: PlantUML 다이어그램 렌더링

이 기능은 DB나 영속 데이터를 추가하지 않는다. `lib/data/types.ts`에도 신규 타입을 추가하지
않는다 — [012-mermaid-diagram-rendering/data-model.md](../012-mermaid-diagram-rendering/data-model.md)와
동일한 이유로, 서버가 미리 구조화해 내려주는 데이터가 아니라 클라이언트가 이미 렌더링된
`bodyHtml`을 읽어 그 자리에서 파생시키는 상태이기 때문이다.

## Entities

### PlantumlDiagramBlock (개념 정리 — 신규 타입 아님, DOM에서 직접 파생)

`PlantumlDiagramHandler`가 마운트 시 `article-body` DOM을 훑어 찾아내는 대상.

| Field | 도출 방법 | Notes |
|---|---|---|
| `source` | `pre[data-language="plantuml"]`의 `textContent` | PlantUML 원본 코드. Shiki에 `plantuml` 문법이 없어 하이라이트 없이 그대로 평문으로 남으므로(research.md) 원본과 항상 정확히 일치 |
| `encoded` | `pre`의 `data-plantuml-encoded` 속성 | `rehype-plantuml.ts`가 빌드 타임에 `plantuml-encoder`로 미리 계산해 심어둔 값. 클라이언트는 이 값을 그대로 URL에 붙이기만 하면 됨(런타임 재인코딩 없음) |
| `container` | `pre[data-language="plantuml"]`를 감싸는 `figure[data-rehype-pretty-code-figure]` | 렌더링된 SVG를 삽입할 기준 위치. `pre` 자체는 숨김 처리(삭제 아님)해 복사 버튼이 계속 `textContent`를 읽을 수 있게 유지 |
| `renderState` | `"pending" \| "rendered" \| "error"` | 컴포넌트 로컬 상태(전역 저장 안 함). `error`면 `pre`를 숨기지 않고 그대로 노출(FR-008/FR-009) |
| `svgText` | `fetch(\`https://www.plantuml.com/plantuml/svg/${encoded}\`)` 응답 본문 | 성공 시 `container.innerHTML`에 그대로 주입. 실패 판별 기준은 research.md "렌더링 실패 판별 기준" 참고 |

### 확대 보기 창 상태

Mermaid와 완전히 동일한 컴포넌트(`MermaidLightboxModal` + `openMermaidLightbox`)를 그대로
재사용하므로(research.md), 별도 엔티티를 새로 정의하지 않는다.
[012-mermaid-diagram-rendering/data-model.md의 `MermaidLightboxState`](../012-mermaid-diagram-rendering/data-model.md)를
그대로 참조한다 — `pan`/`zoom`/`isOpen` 모두 이 기능이 새로 만들지 않는 기존 상태다.

## State Transitions

```text
PlantumlDiagramBlock.renderState:
  pending --(fetch 성공 + data-diagram-type 속성 존재)--> rendered
  pending --(fetch 실패 | 4xx/5xx | content-type 불일치 | data-diagram-type 속성 없음)--> error
```

Mermaid와 달리 테마 전환(`useTheme().isDark` 변경)은 `renderState`에 영향을 주지 않는다 —
PlantUML 다이어그램은 컨테이너의 고정 라이트 카드로 대비를 확보하므로(research.md), 테마가
바뀌어도 이미 받아온 `svgText`를 재요청/재렌더링할 필요가 없다.

`renderState === "error"`인 블록은 확대 버튼을 표시하지 않는다 — Mermaid의 동일 규칙
([012/data-model.md](../012-mermaid-diagram-rendering/data-model.md))을 그대로 따른다. 폴백으로
노출되는 원본 코드 블록에는 코드 복사 버튼만 남는다(기존 `rehype-code-copy-button.ts`가 이미
그렇게 동작함, 별도 처리 불필요).
