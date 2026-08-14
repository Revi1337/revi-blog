# Contract: Mermaid 다이어그램 렌더링/복사/확대 통합 지점

이 기능의 "외부 인터페이스"는 API가 아니라 (1) 정적 `bodyHtml`이 DOM에 이미 남겨둔 속성을 클라이언트
핸들러가 어떻게 찾아내는지, (2) 그 DOM을 어떻게 치환/보존하는지, (3) 확대 보기 모달이 어떤 라이브러리
호출로 요구사항의 6개 버튼을 구현하는지에 대한 계약이다. 이 계약이 어긋나면 복사 버튼이 엉뚱한
텍스트를 복사하거나, 렌더링 실패 시 페이지가 깨지거나, 테마 전환이 반영되지 않는 등의 회귀가
발생하므로 tasks/구현 단계에서 그대로 지켜야 한다.

## 1. DOM 탐색 계약 — 어떤 코드 블록이 "Mermaid 블록"인가

| 항목 | 값 | 비고 |
|---|---|---|
| 탐색 대상 | `pre[data-language="mermaid"]` | `rehype-pretty-code`가 모든 코드펜스에 이미 부여(research.md) — 신규 rehype 플러그인 불필요 |
| 소속 컨테이너 | 가장 가까운 조상 `figure[data-rehype-pretty-code-figure]` | 렌더링된 SVG/버튼을 이 안에 삽입 |
| 원본 소스 | `pre.textContent` | Shiki 하이라이트 span은 텍스트 노드를 바꾸지 않으므로 항상 원본과 일치 |

`MermaidDiagramHandler`는 마운트 시 `document.querySelectorAll('pre[data-language="mermaid"]')`를
한 번 순회한다. 본문에 Mermaid 블록이 없으면(빈 NodeList) 이후 로직(mermaid 동적 import 포함)을
전혀 실행하지 않는다 — `ImageLightboxHandler`가 `images.length === 0`일 때 리스너를 등록하지 않는
것과 동일한 조기 종료 관례.

## 2. 렌더링 ↔ 원본 코드 블록 보존 계약

```text
성공 경로 (mermaid.render() resolve):
  1. figure 안에 렌더된 SVG를 담을 새 컨테이너(예: <div data-mermaid-diagram>)를 pre 앞에 삽입
  2. pre에 style="display:none" 부여 (요소 자체는 DOM에서 제거하지 않음)
  3. 복사 버튼(rehype-code-copy-button.ts가 이미 삽입)은 그대로 유지 — CodeCopyHandler가
     여전히 figure.querySelector("pre")?.textContent를 읽으므로 별도 수정 불필요(FR-004)
  4. 확대 버튼을 새로 삽입(figure 안, 복사 버튼과 나란히)

실패 경로 (mermaid.render() reject, try/catch):
  1. 1~2단계를 실행하지 않는다 — pre는 숨기지 않고 원래대로 노출(FR-009)
  2. 확대 버튼도 삽입하지 않는다 — 그려지지 않은 다이어그램을 확대할 수 없으므로
  3. 페이지의 나머지 렌더링/hydration은 계속 진행된다(이 블록 하나의 실패가 throw로 전파되지
     않도록 개별 try/catch로 격리 — 한 아티클에 다이어그램이 여럿일 때 하나의 오류가 나머지를
     막지 않아야 함)
```

**불변 조건**: `pre[data-language="mermaid"]` 요소는 렌더링 성공/실패 어느 경로에서도 DOM에서
삭제되지 않는다. 삭제하면 (a) 복사 버튼이 읽을 원본 텍스트가 사라지고, (b) 실패 시 폴백으로 보여줄
콘텐츠도 함께 사라진다.

## 3. 테마 반영 계약

```text
트리거: components/theme/theme-context.tsx의 useTheme().isDark 값 변경
동작:
  1. mermaid.initialize({ theme: isDark ? "dark" : "default" })
  2. 이미 renderState === "rendered"인 모든 블록에 대해 mermaid.render()를 재호출해 SVG 교체
  3. renderState === "error"인 블록은 재시도하지 않는다 — 문법 자체가 틀린 소스는 테마를
     바꿔도 여전히 실패하므로 불필요한 재시도 방지
```

## 4. 확대 버튼 → 모달 오픈 계약

`components/mermaid/mermaid-lightbox-modal.tsx` + `lib/mermaid/open-mermaid-lightbox.ts`가
`components/article/image-lightbox-handler.tsx` + `lib/lightbox/open-image-lightbox.ts` 쌍과
동일한 역할 분담을 따른다 — "클릭 위임은 handler가, 실제 라이브러리 초기화는 `lib/`의 open 함수가".

```text
클릭 대상: 다이어그램 컨테이너 안의 확대 버튼(data-mermaid-expand-button)
동작:
  1. svg-pan-zoom을 동적 import(아직 로드되지 않았다면) — 초기 번들 제외(Performance Goals)
  2. 렌더링된 SVG를 모달(mermaid-lightbox-modal.tsx) 안으로 이동/복제해 표시
  3. svg-pan-zoom 인스턴스를 그 SVG에 초기화
```

### 버튼 ↔ svg-pan-zoom API 매핑 (spec.md FR-006~008)

| UI 버튼 | svg-pan-zoom API | 비고 |
|---|---|---|
| 상/하/좌/우 화살표 | `instance.panBy({ x, y })` | 방향별로 고정 이동량 상수 사용 |
| 리셋(새로고침) | `instance.reset()` | pan/zoom 동시 초기화(data-model.md 참조) — 두 값을 개별 초기화하는 로직 금지 |
| 돋보기 + | `instance.zoomIn()` | |
| 돋보기 − | `instance.zoomOut()` | |
| 닫기(배경 클릭/ESC/닫기 버튼) | `instance.destroy()` 후 모달 언마운트 | 메모리 누수 방지 — 모달이 다시 열릴 때 새 인스턴스 생성 |

## 5. 회귀 방지 계약 (FR-011)

기존에 발행된 아티클(Mermaid 코드펜스를 쓰지 않는 글)은 `document.querySelectorAll('pre[data-language="mermaid"]')`가
빈 NodeList를 반환하므로 이 기능의 어떤 코드 경로도 실행되지 않는다 — `pipeline.ts`,
`rehype-pretty-code` 설정, 기존 코드 블록의 HTML 구조 모두 변경하지 않는다(신규 rehype/remark
플러그인 없음, research.md 결정).
