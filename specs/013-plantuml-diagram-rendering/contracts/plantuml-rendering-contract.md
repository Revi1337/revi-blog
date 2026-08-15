# Contract: PlantUML 다이어그램 인코딩/렌더링/복사/확대 통합 지점

이 기능의 "외부 인터페이스"는 API가 아니라 (1) 빌드 타임 rehype 플러그인이 어떤 속성을 DOM에
남겨두는지, (2) 클라이언트 핸들러가 그 속성으로 어떤 외부 요청을 만들고 응답을 어떻게 판정하는지,
(3) 성공/실패 각각에서 DOM을 어떻게 치환/보존하는지, (4) 확대 보기를 어떻게 Mermaid와 공유하는지에
대한 계약이다. 이 계약이 어긋나면 복사 버튼이 엉뚱한 텍스트를 복사하거나, 외부 서버 장애가 빌드
실패로 번지거나, 실패한 렌더링을 성공으로 오판하는 회귀가 발생하므로 tasks/구현 단계에서 그대로
지켜야 한다.

## 1. 빌드 타임 인코딩 계약 — `rehype-plantuml.ts`

| 항목 | 값 | 비고 |
|---|---|---|
| 대상 | `pre[data-language="plantuml"]` | `rehypePrettyCode` **이후**에 실행(research.md — 최초에는 이전으로 계획했으나, rehypePrettyCode가 `pre`를 완전히 새 엘리먼트로 교체한다는 사실을 실제 렌더링으로 확인하고 정정) |
| 입력 | `pre`의 텍스트를 `hast-util-to-string`으로 읽음 | Shiki가 토큰을 `<span>`으로 감싸도 텍스트 노드 자체는 바꾸지 않으므로 원본과 항상 일치 |
| 출력 | 같은 `pre`에 `data-plantuml-encoded="{encoded}"` 속성 부여 | `encoded`는 `plantuml-encoder`의 `encode()` 결과. **네트워크 호출 없음** — 이 플러그인은 항상 성공하며 빌드를 실패시킬 수 없다 |
| 언어 표시 | 손대지 않음 | `rehype-pretty-code`가 이미 부여한 `data-language="plantuml"`를 그대로 재사용 |

**불변 조건**: 이 플러그인은 순수 문자열 변환만 수행한다 — `fetch`, 파일 I/O, 예외를 던질 수 있는
어떤 외부 의존도 갖지 않는다. `content/articles/**`를 포함하는 모든 빌드/`next dev` 재시작이 이
플러그인 때문에 실패하는 경우는 없어야 한다.

## 2. DOM 탐색 계약 — 어떤 코드 블록이 "PlantUML 블록"인가

| 항목 | 값 | 비고 |
|---|---|---|
| 탐색 대상 | `pre[data-language="plantuml"]` | Mermaid와 동일 선택자 패턴([012 계약](../../012-mermaid-diagram-rendering/contracts/mermaid-rendering-contract.md) #1) |
| 소속 컨테이너 | 가장 가까운 조상 `figure[data-rehype-pretty-code-figure]` | 렌더링된 SVG/버튼을 이 안에 삽입 |
| 인코딩된 값 | 같은 `pre`의 `data-plantuml-encoded` 속성 | 빌드 타임에 이미 계산 완료 — 클라이언트는 읽기만 함(1번 계약) |
| 원본 소스 | `pre.textContent` | 복사 버튼(FR-004)이 그대로 사용 |

`PlantumlDiagramHandler`는 마운트 시 `document.querySelectorAll('pre[data-language="plantuml"]')`를
한 번 순회한다. 본문에 PlantUML 블록이 없으면 이후 로직(어떤 `fetch`도 포함)을 전혀 실행하지
않는다 — Mermaid/이미지 라이트박스가 이미 따르는 조기 종료 관례와 동일.

## 3. 클라이언트 fetch ↔ 실패 판정 계약

```text
1. `https://www.plantuml.com/plantuml/svg/${encoded}` 로 fetch() 요청
2. 다음 중 하나라도 해당하면 실패로 판정(research.md 실측 근거):
   a. fetch 자체가 reject(네트워크 오류) 또는 response.ok === false(4xx/5xx)
   b. response의 Content-Type이 image/svg+xml이 아님
   c. 응답 텍스트를 파싱한 루트 <svg> 엘리먼트에 data-diagram-type 속성이 없음
3. 실패가 아니면 renderState = "rendered", 응답 SVG 텍스트를 container.innerHTML에 주입
4. 실패면 renderState = "error" — 4번(성공 경로)을 실행하지 않음
```

**재시도 정책**: 실패는 재시도하지 않는다(Mermaid의 문법 오류 재시도 안 함 정책과 동일 — 소스가
그대로인 한 결과도 항상 같으므로). 단, Mermaid는 "테마 변경 시 재시도"가 있었지만 PlantUML은
테마가 렌더링에 영향을 주지 않으므로(data-model.md) 그 경로 자체가 없다.

## 4. 렌더링 ↔ 원본 코드 블록 보존 계약

```text
성공 경로:
  1. figure 안에 SVG를 담을 새 컨테이너(예: <div data-plantuml-diagram>)를 pre 앞에 삽입
  2. pre에 style="display:none" 부여 (요소 자체는 DOM에서 제거하지 않음)
  3. 복사 버튼(rehype-code-copy-button.ts가 이미 삽입)은 그대로 유지 — CodeCopyHandler가
     여전히 figure.querySelector("pre")?.textContent를 읽으므로 별도 수정 불필요(FR-004)
  4. 확대 버튼을 새로 삽입(figure 안, 복사 버튼과 나란히)

실패 경로:
  1. 1~2단계를 실행하지 않는다 — pre는 숨기지 않고 원래대로 노출(FR-008/FR-009)
  2. 확대 버튼도 삽입하지 않는다
  3. 페이지의 나머지 렌더링은 계속 진행된다(이 블록 하나의 실패가 다른 블록/페이지 전체로
     전파되지 않도록 블록 단위로 격리)
```

**불변 조건**: `pre[data-language="plantuml"]` 요소는 성공/실패 어느 경로에서도 DOM에서
삭제되지 않는다([012 계약](../../012-mermaid-diagram-rendering/contracts/mermaid-rendering-contract.md) #2와
동일한 불변 조건).

## 5. 확대 버튼 → 라이트박스 재사용 계약

신규 컴포넌트를 만들지 않고 Mermaid가 이미 쓰는 `components/mermaid/mermaid-lightbox-modal.tsx` +
`lib/mermaid/open-mermaid-lightbox.ts`를 그대로 import한다(research.md Decision).

```text
클릭 대상: 다이어그램 컨테이너 안의 확대 버튼(data-plantuml-expand-button)
동작:
  1. 렌더링된 SVG 마크업을 buildLightboxSvgMarkup 동등 로직으로 클론해 MermaidLightboxModal에 전달
  2. 이후 동작은 012 계약 #4(svg-pan-zoom 동적 import, panBy/reset/zoomIn/zoomOut 매핑)과 완전히 동일
```

이 재사용이 성립하는 전제는 §4에서 만든 SVG DOM 노드가 Mermaid의 `mermaid.render()` 결과와
동일하게 "인라인 `<svg>`"라는 점이다 — 이 전제가 깨지면(예: `<img>` 태그로 대체) 이 계약 전체를
다시 검토해야 한다.

## 6. 회귀 방지 계약 (FR-011)

기존에 발행된 아티클(PlantUML 코드펜스를 쓰지 않는 글)은
`document.querySelectorAll('pre[data-language="plantuml"]')`가 빈 NodeList를 반환하므로 이 기능의
어떤 코드 경로도 실행되지 않는다. `rehype-plantuml.ts`도 `lang === "plantuml"`이 아닌 code
노드는 그대로 통과시키므로, 기존 코드 블록의 HTML 구조를 변경하지 않는다.
