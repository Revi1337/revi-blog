# Contract: Markmap 마인드맵 파싱/렌더링/인터랙션/복사/확대 통합 지점

이 기능의 "외부 인터페이스"는 API가 아니라 (1) 클라이언트 핸들러가 어떤 DOM을 탐색해 무엇을
렌더링하는지, (2) 렌더링된 인스턴스가 본문에서 어떻게 살아있는 상태로 유지되는지, (3) 성공/실패
각각에서 DOM을 어떻게 치환/보존하는지, (4) 확대 보기가 왜 Mermaid/PlantUML과 다른 신규
컴포넌트를 쓰는지에 대한 계약이다. 이 계약이 어긋나면 복사 버튼이 엉뚱한 텍스트를 복사하거나,
본문 인터랙션이 죽거나, 모달 안 접기/펼치기가 동작하지 않는 회귀가 발생하므로 tasks/구현 단계에서
그대로 지켜야 한다.

## 1. DOM 탐색 계약 — 어떤 코드 블록이 "Markmap 블록"인가

| 항목 | 값 | 비고 |
|---|---|---|
| 탐색 대상 | `pre[data-language="markmap"]` | Mermaid/PlantUML과 동일 선택자 패턴([012 계약](../../012-mermaid-diagram-rendering/contracts/mermaid-rendering-contract.md) #1, [013 계약](../../013-plantuml-diagram-rendering/contracts/plantuml-rendering-contract.md) #2) |
| 소속 컨테이너 | 가장 가까운 조상 `figure[data-rehype-pretty-code-figure]` | 렌더링된 SVG/버튼을 이 안에 삽입 |
| 원본 소스 | `pre.textContent` | 복사 버튼(FR-007)과 확대 보기 모달(§4) 둘 다 이 값을 그대로 사용 |
| 신규 rehype 플러그인 | 없음 | research.md Decision — 빌드 타임에 미리 계산해둘 수 있는 부분이 없다(파싱·렌더링 모두 브라우저 전용) |

`MarkmapDiagramHandler`는 마운트 시 `document.querySelectorAll('pre[data-language="markmap"]')`를
한 번 순회한다. 본문에 Markmap 블록이 없으면 이후 로직(동적 import 포함)을 전혀 실행하지 않는다
— Mermaid/PlantUML/이미지 라이트박스가 이미 따르는 조기 종료 관례와 동일.

## 2. 파싱/렌더링 ↔ 실패 판정 계약

```text
1. 원본 소스를 markmap-lib의 Transformer().transform(source)로 파싱해 { root, features } 획득
2. root를 markmap-view의 Markmap.create(svgElement, options, root)에 전달해 렌더링
3. 1~2 단계 중 어느 하나라도 예외를 던지면 renderState = "error"
4. 예외가 없으면 renderState = "rendered"이고, 반환된 Markmap 인스턴스를 컴포넌트가 계속 참조로
   유지한다(§3 "살아있는 인스턴스 유지 계약")
```

**재시도 정책**: 실패는 재시도하지 않는다(Mermaid/PlantUML과 동일 정책 — 소스가 그대로인 한 결과도
항상 같으므로). 이전 렌더에서 이미 실패로 판정된 블록은 테마가 바뀌어도 다시 시도하지 않는다.

## 3. 살아있는 인스턴스 유지 계약 (Mermaid/PlantUML과 가장 크게 다른 지점)

```text
성공 경로:
  1. figure 안에 SVG를 담을 새 컨테이너(예: <div data-markmap-diagram>)를 pre 앞에 삽입
  2. pre에 style="display:none" 부여 (요소 자체는 DOM에서 제거하지 않음)
  3. Markmap.create(svg, { zoom: false, pan: false, autoFit: true }, root)가 반환한 인스턴스를
     그대로 둔다 — 이 인스턴스가 SVG에 바인딩한 노드 클릭 토글 핸들러가 본문 인라인 접기·
     펼치기(FR-004)를 담당한다. `zoom: false, pan: false`는 드래그(팬)·휠(줌)·더블클릭·핀치
     줌을 인라인에서 전부 비활성화한다([amended] — Mermaid/PlantUML macOS 프리뷰와의 인터랙션
     일관성, 페이지 스크롤 하이재킹 문제로 spec.md FR-005가 뒤집힘, research.md 참고). 접기/
     펼치기만은 이 옵션과 무관한 별도 리스너라 영향받지 않는다. Mermaid/PlantUML처럼 "렌더링
     결과 문자열만 innerHTML로 꽂고 참조를 버리는" 방식을 쓰면 이 접기/펼치기 인터랙션조차
     동작하지 않는다.
  4. 복사 버튼(rehype-code-copy-button.ts가 이미 삽입)은 그대로 유지 — CodeCopyHandler가 여전히
     figure.querySelector("pre")?.textContent를 읽으므로 별도 수정 불필요(FR-007)
  5. 확대 버튼을 새로 삽입(figure 안, 복사 버튼과 나란히)

실패 경로:
  1. 1~3단계를 실행하지 않는다 — pre는 숨기지 않고 원래대로 노출(FR-012)
  2. 확대 버튼도 삽입하지 않는다
  3. 페이지의 나머지 렌더링은 계속 진행된다(이 블록 하나의 실패가 다른 블록/페이지 전체로
     전파되지 않도록 블록 단위로 격리)
```

**불변 조건**: `pre[data-language="markmap"]` 요소는 성공/실패 어느 경로에서도 DOM에서 삭제되지
않는다([012 계약](../../012-mermaid-diagram-rendering/contracts/mermaid-rendering-contract.md) #2와
동일한 불변 조건).

## 4. 확대 버튼 → 신규 Markmap 전용 모달 계약 (Mermaid/PlantUML 재사용 아님)

기존 `components/mermaid/mermaid-lightbox-modal.tsx` + `lib/mermaid/open-mermaid-lightbox.ts`를
**재사용하지 않는다**(research.md Decision — 013이 재사용에 성공한 전제인 "완성된 markup 문자열이면
충분"이 Markmap에는 성립하지 않는다). 대신 신규 `components/markmap/markmap-lightbox-modal.tsx` +
`lib/markmap/open-markmap-lightbox.ts`를 만든다.

```text
클릭 대상: 다이어그램 컨테이너 안의 확대 버튼(data-markmap-expand-button)
동작:
  1. §1에서 확인한 원본 소스 텍스트(본문 SVG를 clone하지 않음)를 MarkmapLightboxModal의
     source prop으로 전달
  2. 모달이 열릴 때 그 source로 markmap-lib+markmap-view를 이용해 본문과 완전히 독립적인 새
     Markmap 인스턴스를 모달 canvas 안에서 렌더링(항상 전체 펼침 기본 상태로 시작)
  3. 화살표(↑↓←→)/리셋/줌 인·아웃 버튼의 JSX는 기존 .mermaid-lightbox-* CSS 클래스를 그대로
     사용(신규 CSS 없음, 픽셀 단위로 동일한 모양 — FR-011)
  4. 각 버튼 클릭 핸들러는 open-markmap-lightbox.ts가 노출하는 panBy/reset/zoomIn/zoomOut을
     호출하며, 그 내부는 svg-pan-zoom이 아니라 markmap-view가 이미 SVG에 바인딩한 d3-zoom의
     transform API를 직접 조작한다(같은 SVG에 svg-pan-zoom을 추가로 얹으면 포인터 이벤트가
     충돌하므로 사용 불가)
  5. 모달 안에서도 노드 클릭으로 가지를 접고 펼칠 수 있다(FR-010) — markmap-view의 기본 클릭
     토글 동작이 모달 전용 인스턴스에도 동일하게 적용되므로 별도 구현 불필요
  6. 모달을 닫으면 이 인스턴스를 destroy()한다 — 본문 인스턴스(§3)에는 어떤 영향도 주지 않는다
```

**불변 조건**: 기존 `MermaidLightboxModal`/`open-mermaid-lightbox.ts`의 코드는 이 기능 구현 중
한 줄도 변경되지 않는다 — 변경되면 Mermaid/PlantUML 확대 보기 회귀 여부를 반드시 재검증해야 한다.

## 5. 회귀 방지 계약 (FR-014)

기존에 발행된 아티클(Markmap 코드펜스를 쓰지 않는 글)은
`document.querySelectorAll('pre[data-language="markmap"]')`가 빈 NodeList를 반환하므로 이 기능의
어떤 코드 경로(동적 import 포함)도 실행되지 않는다. `MermaidDiagramHandler`/`PlantumlDiagramHandler`,
`MermaidLightboxModal`/`open-mermaid-lightbox.ts`는 이 기능 구현으로 전혀 수정되지 않으므로,
Mermaid/PlantUML 다이어그램이 있는 기존 아티클의 렌더링 결과도 변하지 않는다.
