# Quickstart: Markmap 마인드맵 렌더링 검증

이 기능이 실제로 동작하는지 로컬에서 확인하는 절차. constitution.md Principle I(빌드 +
`playwright-cli`로 실제 브라우저 구동해 검증, 필요 시 스크린샷은 `playwright` MCP)을 따른다.
인터랙티브 컴포넌트라 클릭·드래그 조작까지 실제로 수행해 확인해야 의미가 있다.

## Prerequisites

- `package.json`에 `markmap-lib`, `markmap-view`가 설치되어 있어야 한다.
- `components/article/markmap-diagram-handler.tsx`가
  `app/article/[slug]/page.tsx`에서 `CodeCopyHandler`/`ImageLightboxHandler`/
  `MermaidDiagramHandler`/`PlantumlDiagramHandler`와 나란히 마운트되어 있어야 한다.
- `components/markmap/markmap-lightbox-modal.tsx`, `lib/markmap/open-markmap-lightbox.ts`가
  신규로 존재해야 하며, `components/mermaid/mermaid-lightbox-modal.tsx`,
  `lib/mermaid/open-mermaid-lightbox.ts`는 **변경되지 않았어야** 한다(contracts #4 불변 조건).
- **서버는 반드시 일반 `npm run dev`(로컬/인메모리 Redis 모드)로 띄운다.** `npm run dev:docker`는
  쓰지 않는다 — Docker 모드는 실제 방문자 통계 위젯 검증용이라 이 기능과 무관하고, 인메모리
  모드로 띄워야 방문자 통계 위젯이 항상 `0`에서 시작해(AGENTS.md "In-memory fallback for local
  dev") 다이어그램 검증 화면에 실제 운영 데이터가 섞여 보이지 않는다.

## 0. 구현 착수 전 — 검증용 아티클을 먼저 준비

별도 파일을 새로 만들지 않는다. 013(PlantUML)이 만든 `content/articles/_plantuml-preview.md`를
`content/articles/_diagram.md`로 리네임/확장해, PlantUML(기존) + Mermaid `mindmap` 타입(신규) +
Markmap(신규) 세 다이어그램 타입을 한 아티클에서 함께 검증한다(tasks.md T003/T004 결정 —
`_markmap-preview.md`를 새로 만드는 원래 계획을 대체).

`_diagram.md`에 다음 두 섹션이 추가되어 있어야 한다:

- **"Markmap — 마인드맵"**: 헤딩/리스트 혼합 아웃라인 기반 정상 마인드맵 코드블록
- **"Markmap — 깊은 트리(레이아웃 폭 초과 확인용)"**: 6단계 깊이의 헤딩 트리 코드블록

**참고**: markmap-lib의 마크다운 파서는 관대해서(013의 PlantUML 실측과 유사), 명백히 깨진 렌더링
실패 케이스를 코드펜스 예시만으로 확정하기 어렵다. 실제 예외를 던지는 입력(예: 빈 소스, 순환
참조 등)이 있는지는 구현 착수 시 `markmap-lib`/`markmap-view`를 실제로 호출해 실측하고, 확인되면
이 파일과 contracts #2("실패 판정 계약")에 구체적인 실패 케이스를 추가한다.

**⚠️ `content/articles/**` 변경이므로, `_diagram.md`를 만들거나 고칠 때마다 이미 떠 있는
`npm run dev` 프로세스를 반드시 재시작해야 한다(AGENTS.md).**

## 1. 빌드 통과 확인

```bash
npm run build
```

**Expected**: 신규 rehype 플러그인이 없으므로(research.md Decision) 이 기능 자체가 빌드 타임에
할 일이 없다 — 실패하면 다른 원인(타입 에러 등)이다.

## 2. 정상 마인드맵 렌더링 확인 (User Story 1)

```bash
npm run dev   # http://localhost:3999, 반드시 일반 모드(Prerequisites 참고)
```

`playwright-cli`로(부족하면 `playwright` MCP 스크린샷으로 보강):

1. `/article/_diagram`으로 이동
2. 상단 방문자 통계 위젯이 `0`에서 시작하는지 확인(로컬 모드 확인 겸)
3. 라이트 테마에서 "Markmap — 마인드맵" 섹션에 인터랙티브 마인드맵 그림(SVG)이 보이는지 확인 — 원본
   코드 텍스트가 그대로 노출되면 안 됨
4. 마인드맵이 다른 코드 블록/다이어그램(예: 같은 페이지의 다른 섹션)과 동일한 타이틀바 +
   트래픽라이트 컨테이너 안에 표시되는지 확인 — 별도 카드로 다시 감싸져 있으면 안 됨(spec.md
   User Story 1 Acceptance Scenario 2)
5. 테마 토글로 다크 전환 후, 마인드맵 텍스트/선/배경이 읽기 충분한 대비를 유지하는지 확인
   (research.md "다크/라이트 테마 반영 방식" — 여기서 실측 결과를 이 문서와 research.md에 갱신)
6. "깊은 트리" 섹션이 본문 폭을 넘어가지 않고 레이아웃이 깨지지 않는지 확인(FR-015)
7. 브라우저 콘솔에 렌더링 에러가 없는지 확인

## 3. 본문 인라인 인터랙션 확인 (User Story 2, FR-004/FR-005 — [amended])

확대 보기 창을 **열지 않은 상태**에서:

1. "Markmap — 마인드맵"의 특정 가지(예: "다이어그램 렌더링")를 클릭 → 그 가지가 접히는지 확인
2. 같은 가지를 다시 클릭 → 다시 펼쳐지는지 확인
3. 페이지를 아래로 스크롤하다가 커서가 마인드맵 위를 지나가도, 페이지 스크롤이 멈추지 않고
   계속 정상적으로 진행되는지 확인(FR-005 — 인라인 드래그/휠 비활성화)
4. 마우스 휠(또는 트랙패드 스크롤)로 마인드맵 위에서 확대/축소를 시도 → 다이어그램은 반응하지
   않아야 함(휠 이벤트가 페이지 스크롤로 그대로 전달됨)
5. 마우스로 마인드맵 위를 드래그 → 화면이 이동하지 않아야 함(드래그가 다이어그램에 반응하지
   않음)
6. 페이지를 새로고침한 뒤 다시 접속 → 이전에 접었던 가지가 초기 상태(전체 펼침)로 돌아오는지
   확인(spec.md Assumptions — 상태 미저장)

## 4. 확대 보기 창 확인 (User Story 3, FR-008~FR-010)

1. "Markmap — 마인드맵"의 확대 버튼 클릭 → 모달이 뜨는지, 항상 전체 펼침 기본 상태로 시작하는지 확인
2. 상/하/좌/우 화살표 버튼으로 이동, 돋보기 +/- 확대·축소가 각각 동작하는지 확인
3. 마우스로 모달 안 화면을 직접 드래그해서 이동시킬 수 있는지 확인(FR-009)
4. 이동/확대를 조작한 상태에서 리셋 버튼 클릭 → 위치/배율이 모두 최초 상태로 돌아오는지 확인
5. 모달 안에서 가지를 클릭해 접고 펼칠 수 있는지 확인(FR-010)
6. 같은 페이지에 Mermaid/PlantUML 다이어그램이 있다면(별도 검증용 아티클과 비교) 세 종류의
   확대/복사 버튼 위치·스타일·인터랙션이 육안으로 구분 불가능한지 비교(SC-006)
7. ESC 또는 배경 클릭으로 모달이 닫히는지 확인
8. 모달을 다시 열었을 때 매번 새 인스턴스로 렌더링되는지(이전 모달에서의 조작이 남아있지 않은지)
   확인(data-model.md MarkmapLightboxState)

## 5. 복사 버튼 확인 (User Story 4, FR-007)

1. "Markmap — 마인드맵" 섹션의 복사 버튼을 클릭
2. 클립보드 내용이 렌더링된 그림이 아니라 원본 Markmap 코드 텍스트(`# 블로그 아키텍처 ...`)와
   정확히 일치하는지 확인

## 6. 회귀 확인 (SC-002, FR-014, contracts #4/#5)

- 기존에 발행된 아티클(`_diagram.md` 제외) 상세 페이지를 몇 개 열어, Markmap 관련 UI가 새로
  생기지 않았는지 확인
- `_diagram.md` 안의 기존 Mermaid/PlantUML 섹션이 이번 변경 이전과 동일하게 렌더링·확대 보기·
  복사가 동작하는지 확인(`components/mermaid/mermaid-lightbox-modal.tsx`,
  `lib/mermaid/open-mermaid-lightbox.ts`, `components/article/plantuml-diagram-handler.tsx`를
  건드리지 않았다는 것의 실제 증거)
- 홈 페이지(`/`)에 `_diagram`이 노출되지 않는지 확인(`show_on_homepage: false`)

## 7. 문제 발견 시

각 단계에서 이상 동작을 발견하면 즉시 원인을 고치고 해당 단계(및 그 이전에 영향을 줄 수 있는
단계)를 다시 실행해 통과를 확인한다 — 통과하지 못한 상태로 다음 Phase로 넘어가지 않는다.

## 8. 정리

013처럼 검증 후 삭제하지 않는다. `_diagram.md`는 PlantUML/Mermaid mindmap/Markmap 세 다이어그램
타입을 한 번에 보여주는 통합 진단용 아티클로서, 향후 다이어그램 관련 기능(신규 엔진 추가, 회귀
테스트)에 재사용할 가치가 있어 그대로 유지한다(`show_on_homepage: false`로 이미 홈 노출은
차단됨, tasks.md T022).
