# Tasks: Markmap 마인드맵 렌더링

**Input**: Design documents from `/specs/014-markmap-mindmap-rendering/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md,
contracts/markmap-rendering-contract.md, quickstart.md

**Tests**: 이 저장소는 자동화 테스트 스위트가 없다(constitution.md Principle I). 검증은 각 Phase
마지막에 고정된 체크포인트로 대체한다 — 별도 테스트 태스크는 생성하지 않는다.

1. `npm run dev`로 로컬 기본 모드(인메모리 Redis fallback, `KV_REST_API_URL` 미설정 상태 유지) 기동
   — 방문자 통계 위젯이 `0`에서 시작하는 상태를 유지한다. `npm run dev:docker`는 쓰지 않는다.
   **모든 Phase 체크포인트에서 예외 없이 이 확인을 반복한다.**
2. `npm run build`로 빌드/타입 에러 확인
3. `playwright-cli` 스킬로 브라우저 구동 검증(우선), 픽셀 단위 시각 확인이 필요할 때만 `playwright`
   MCP 스크린샷 도구로 전환. `claude-in-chrome` 등 다른 수단은 쓰지 않는다.

세 단계 중 하나라도 실패하면 다음 Phase로 넘어가기 전에 같은 Phase 안에서 원인을 고치고 체크포인트를
다시 통과해야 한다. **실패한 채로 다음 Phase로 이월하지 않는다.** 013 tasks.md가 채택한 원칙을
이번에도 예외 없이 그대로 적용한다.

**React/TypeScript 감사 원칙 (constitution.md Principle II, NON-NEGOTIABLE)**: 신규
컴포넌트/모듈을 작성하는 태스크(T006, T012, T013)는 각각 **작성 착수 전에**
`.agents/skills/vercel-react-best-practices/rules/`를 실제로 열어 확인하고, 작성 완료 직후 같은
태스크 안에서 규칙 대조 감사를 수행한다. 013처럼 감사를 Polish 단계로 미루지 않는다.

**Organization**: spec.md의 User Story 4개(P1~P4)별로 태스크를 그룹화했다. Foundational 단계에서
013의 `_plantuml-preview.md`를 `_diagram.md`로 리네임/확장해 PlantUML(기존) + Mermaid mindmap
타입(신규) + Markmap(신규) 세 다이어그램 타입을 한 아티클에서 함께 검증하는 통합 미리보기로
만든다 — quickstart.md 0절이 원래 계획했던 별도 파일(`_markmap-preview.md`) 신설을 대체한다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능(다른 파일, 미완료 태스크에 의존하지 않음)
- **[Story]**: 이 태스크가 속한 User Story (US1~US4)
- 모든 태스크에 정확한 파일 경로 포함

## Path Conventions

단일 Next.js 프로젝트. 모든 경로는 저장소 루트 기준.

---

## Phase 1: Setup

**Purpose**: 신규 의존성 설치

- [X] T001 `package.json`의 `dependencies`에 `markmap-lib`(^0.18.12), `markmap-view`(^0.18.12)를
      알파벳 순서로 추가한 뒤 `npm install` 실행. 둘 다 자체 타입 선언(`typings`/`types` 필드가
      각각 `dist/index.d.ts`를 가리킴, 실측 확인)을 갖고 있어 `@types/*` 패키지가 필요 없다
      (plantuml-encoder와 달리 devDependency 추가 없음, research.md).
      (`npm ls d3` 실측 — markmap-view가 요구하는 d3@^7.8.5가 mermaid의 d3@7.9.0으로 단일
      dedupe됨을 확인.)
- [X] T002 Checkpoint: `npm run dev`(로컬 기본 모드, 방문자 통계 `0` 시작) 정상 기동 + `npm run build`
      성공 확인. 의존성만 추가된 상태라 신규 화면 변화가 없으므로 `playwright-cli`로는 홈페이지(`/`)가
      기존과 동일하게 200으로 로드되고 콘솔 에러가 없는지만 확인한다.
      (`/` 200, `/api/stats` `{"total":0,...}` 확인. `npm run build` 성공, 42개 라우트 생성.)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 User Story가 공유하는 검증용 콘텐츠 스캐폴드를 실제 구현 착수 전에 먼저
준비한다 — Markmap 코드블록이 포함된 실제 아티클이 없으면 이후 어떤 Phase의 체크포인트도
브라우저에서 검증할 대상이 없다.

**⚠️ CRITICAL**: 이 단계 완료 전에는 어떤 User Story 구현(handler 컴포넌트, 모달 등)도 시작하지
않는다.

- [X] T003 `content/articles/_plantuml-preview.md`를 `content/articles/_diagram.md`로 리네임한다
      (`git mv`). frontmatter의 `title`을 세 다이어그램 타입을 아우르는 이름(예: "Diagram Preview
      (내부 검증용)")으로 갱신하고, `tags`/`show_on_homepage: false`는 유지한다. 기존 PlantUML
      섹션(정상/렌더링 실패 다이어그램)은 그대로 두고, 다음 두 섹션을 새로 추가한다: (a)
      "Mermaid — 마인드맵" 섹션에 ```mermaid `mindmap` 타입 테스트 코드블록 하나(예: 루트 노드 +
      하위 주제 2~3개, 각각 하위 항목 포함), (b) "Markmap — 마인드맵" 섹션에 ```markmap 테스트
      코드블록 두 개 — quickstart.md에 이미 정리된 "정상 마인드맵"(헤딩/리스트 혼합 아웃라인)과
      "깊은 트리"(레이아웃 폭 초과 확인용) 예시를 그대로 옮겨온다.
      **`content/articles/**` 변경이므로 이 파일을 만들거나 고칠 때마다 이미 떠 있는 `npm run dev`
      프로세스를 반드시 재시작해야 한다(AGENTS.md).**
      (파일이 원래 untracked라 `git mv`가 실패해 일반 `mv`로 대체 실행. 기존 파일에는 이미
      Mermaid 6종 + PlantUML 7종 섹션이 모두 있었음을 확인 — 013 T003 당시 계획보다 더 풍부한
      상태였음.)
- [X] T004 T003의 리네임/확장 결정을 문서에 반영한다: `quickstart.md`의 0절("구현 착수 전 — 검증용
      아티클을 먼저 작성")과 Prerequisites에서 `_markmap-preview.md` 신설 계획을
      `_diagram.md`(013의 `_plantuml-preview.md` 리네임/확장) 기준으로 갱신하고, `plan.md`의
      Project Structure 트리에 있는 `_markmap-preview.md` 항목도 `_diagram.md`로 갱신한다.
      (quickstart.md 0절/2~8절의 슬러그·파일명 참조 전부 갱신, plan.md Project Structure/
      Constitution Check의 참조도 갱신 완료.)
- [X] T005 Checkpoint: `next dev`를 재시작한 뒤, `npm run dev`(로컬 기본 모드) + `npm run build`로
      새 아티클이 정상적으로 목록/빌드에 포함되는지 확인. `playwright-cli`로 `/article/_diagram`에
      접속해 — 아직 렌더링 구현 전이므로 — PlantUML 두 블록은 기존과 동일하게 계속 렌더링되고(회귀
      없음의 baseline), 신규 Mermaid mindmap 블록은 실제 마인드맵 그림으로(Mermaid는 이미 구현되어
      있으므로), 신규 Markmap 블록은 아직 미구현이라 평문 코드 블록으로만 보이는지 확인한다. 옛
      URL `/article/_plantuml-preview`가 404인지도 확인(리네임 확인).
      (`/article/_diagram` 200, `/article/_plantuml-preview` 404 확인. Mermaid mindmap 스크린샷
      확인 결과 macOS 컨테이너+복사/확대 버튼까지 정상 렌더링. PlantUML 6개 성공 SVG + 1개 의도된
      실패(HTTP 400) 폴백 모두 기존과 동일. Markmap 2블록은 예상대로 줄번호 있는 평문 코드
      baseline. 콘솔 에러는 PlantUML 400(의도됨)과 giscus 404(신규 슬러그라 댓글 스레드 없음,
      013 T004 선례와 동일한 무관한 로그)뿐, 신규 에러 없음.)

**Checkpoint**: 스캐폴드 준비 완료 — User Story 구현 시작 가능

---

## Phase 3: User Story 1 - 독자가 마인드맵을 그림으로 바로 본다 (Priority: P1) 🎯 MVP

**Goal**: ```markmap 코드펜스가 문법 강조된 텍스트가 아니라 실제 마인드맵으로 렌더링되고, 다른
코드 블록/다이어그램과 동일한 macOS 컨테이너 안에 표시되며, 다크/라이트 전환에도 읽기 가능한
대비를 유지한다.

**Independent Test**: `_diagram.md`의 "Markmap — 마인드맵" 두 섹션이 그림으로 보이고, macOS
컨테이너 스타일이 Mermaid/PlantUML과 동일한지 확인하는 것만으로 완결 검증 가능.

### Implementation for User Story 1

- [X] T006 [US1] **(착수 전 vercel-react-best-practices 규칙 확인 필수)**
      `components/article/markmap-diagram-handler.tsx` 작성 — `"use client"`, 마운트 시
      `document.querySelectorAll('pre[data-language="markmap"]')` 탐색(빈 경우 즉시 종료).
      대상이 있으면 `markmap-lib`+`markmap-view`를 동적 import(초기 번들 제외, research.md
      Performance Goals)해 블록마다 `Transformer().transform(source)`로 파싱하고
      `Markmap.create(svgElement, options, root)`로 그 자리에 렌더링한다
      (contracts/markmap-rendering-contract.md #1/#2). 파싱/렌더링 중 예외가 발생하면
      `renderState = "error"`로 판정해 `pre`를 숨기지 않고 그대로 노출한다(폴백, 재시도 없음 —
      Mermaid/PlantUML과 동일 관례). 성공 시 `figure` 안 `pre` 앞에 `data-markmap-diagram`
      컨테이너를 삽입하고 `pre`는 `display:none`(삭제 금지, 복사 버튼이 계속 `textContent`를
      읽어야 함). **완료 후 같은 태스크 안에서 vercel-react-best-practices 규칙 대조 감사를
      수행하고 위반이 있으면 즉시 수정한다**(constitution.md Principle II).
      (감사 결과: `bundle-conditional`(pre 없으면 즉시 return, 동적 import는 조건부 ✓),
      `async-parallel`(markmap-lib/markmap-view 두 동적 import를 Promise.all로 병렬화, 013처럼
      나중에 고치지 않고 처음부터 적용 ✓), `rerender-dependencies`(파싱/렌더링 effect는 `[]`,
      테마 토글 effect는 primitive `[isDark]` ✓), 위반 없음. 실측으로 발견: markmap-view가
      렌더링 결과 SVG에 `.markmap` 클래스를 직접 붙이고, `.markmap-dark .markmap` 선택자로 다크
      모드 CSS 변수(`--markmap-text-color` 등)를 이미 내장 제공한다는 걸 `node_modules`
      실측으로 확인 — Mermaid처럼 테마 전환 시 재렌더링할 필요 없이 컨테이너에 `markmap-dark`
      클래스만 토글하면 되므로, 살아있는 인스턴스(§contracts #3)를 건드리지 않는 더 단순한
      구현이 가능했음. User Story 1 범위(렌더링만)라 확대 버튼/라이트박스 연결은 아직 없음 —
      T014에서 추가 예정.)
- [X] T007 [US1] `app/article/[slug]/page.tsx`에 `<MarkmapDiagramHandler />`를
      `<CodeCopyHandler />`/`<ImageLightboxHandler />`/`<MermaidDiagramHandler />`/
      `<PlantumlDiagramHandler />`와 나란히 마운트. (depends: T006)
- [X] T008 [US1] `app/article-body.css`에 Markmap 컨테이너(`[data-markmap-diagram]`)의 레이아웃
      규칙을 `[data-mermaid-diagram]`/`[data-plantuml-diagram]`과 동일하게 맞춰 추가한다(별도
      카드/프레임 없이 macOS 컨테이너에 직접 얹히는 모양, spec.md FR-003). 다크/라이트 테마 대비를
      위한 색상 반영 방식은 research.md "다크/라이트 테마 반영 방식"이 미확정으로 남겨둔 부분이다
      — 이 태스크에서 실제 렌더링으로 실측하고(`Markmap.create()`의 `color` 옵션으로 충분한지,
      CSS 보강이 추가로 필요한지) 확정한 뒤 research.md를 갱신한다(013의 "최초 결정 → 실측 →
      정정" 절차와 동일).
      (Mermaid/PlantUML과 달리 SVG가 고정 크기 "뷰포트"이고 내부는 pan/zoom으로 탐색하는
      구조라, `overflow-x: auto` 대신 `overflow: hidden`(뷰포트 클리핑)으로 결정 — T009에서
      스크린샷으로 실제 확인. 색상은 markmap-view 내장 CSS 변수(`.markmap-dark`)만으로 다크/
      라이트 둘 다 충분한 대비가 나옴을 실측 확인 — 013(PlantUML)과 달리 CSS 보강이나 별도
      옵션 지정 불필요했음. research.md 갱신 완료.)
- [X] T009 [US1] Checkpoint: `npm run dev`(로컬 기본 모드) + `npm run build` 후 `playwright-cli`로
      quickstart.md 2절 수행 — 정상 마인드맵이 그림으로 보이는지, macOS 컨테이너 안에 표시되고
      별도 카드로 다시 감싸지지 않는지, 다크 모드에서도 대비가 유지되는지, "깊은 트리" 섹션이
      본문 폭을 넘어가지 않는지(FR-015), 콘솔 에러가 없는지 확인. 문제가 발견되면 원인을 고치고
      체크포인트를 다시 통과할 때까지 Phase 4로 넘어가지 않는다.
      (`npx tsc --noEmit` 통과. 다크/라이트 두 테마 모두 스크린샷 확인 — 색상 분기된 곡선 링크,
      macOS 컨테이너, 충분한 명도 대비 확인. 깊은 트리 섹션은 고정 뷰포트 안에서 클리핑되고
      페이지 레이아웃 자체는 깨지지 않음(가로 스크롤 없음). 콘솔 에러는 PlantUML 400(의도됨,
      테마 전환 시 재요청도 기존 동작)과 giscus 404(신규 슬러그, 무관)뿐, markmap 관련 신규
      에러 없음.)

**Checkpoint**: User Story 1이 독립적으로 완결되어 배포 가능(MVP)

---

## Phase 4: User Story 2 - 독자가 본문에서 곧바로 마인드맵의 가지를 접고 펼친다 (Priority: P2)

**Goal**: 확대 보기 창을 열지 않고도 본문에 렌더링된 마인드맵에서 곧바로 가지를 접고 펼칠 수
있다(Markmap 고유의 핵심 차별 가치). **[amended, T011 후속 수정]** 인라인 확대/축소·이동은
Mermaid/PlantUML과의 일관성 및 페이지 스크롤 하이재킹 문제로 제외하고 확대 보기 창(Phase 5)
전용으로 남겼다.

**Independent Test**: 확대 보기 창을 열지 않은 채로 가지 클릭 접기/펼치기가 의도대로 동작하는지,
그리고 드래그/휠이 다이어그램에 반응하지 않고 페이지 스크롤이 정상 동작하는지 확인하는 것으로
완결 검증 가능.

### Implementation for User Story 2

- [X] T010 [US2] **(착수 전 vercel-react-best-practices 규칙 확인 필수)**
      `markmap-diagram-handler.tsx`(T006)에서 `Markmap.create()`가 반환한 인스턴스가 컴포넌트
      리렌더/테마 전환 시에도 유지되는지(중복 생성되어 리스너가 이중으로 붙지 않는지), 언마운트
      시 적절히 정리(`destroy()`)되는지 점검하고 필요한 만큼 보강한다(contracts/
      markmap-rendering-contract.md #3 "살아있는 인스턴스 유지 계약"). 인라인 접기/펼치기·팬/줌
      자체는 `markmap-view`의 기본 동작(d3-zoom, 노드 클릭 토글)이 이미 제공하므로 별도 UI 구현은
      필요 없다 — 이 태스크는 그 기본 동작이 리액트 생명주기와 충돌 없이 유지되는지 확인하는
      성격이다. **완료 후 같은 태스크 안에서 vercel-react-best-practices 규칙 대조 감사를
      수행한다.** (depends: T006)
      (실측으로 두 가지 발견/수정: (1) markmap-view는 언마운트 시 정리하지 않으면 내부
      ResizeObserver 등이 연결 끊긴 SVG를 계속 참조 — 이 블로그는 클라이언트 라우팅 SPA라 다른
      아티클로 이동해도 JS 런타임이 살아있으므로 실제 누수 위험이 있어, 렌더링 effect의 cleanup
      에서 생성된 모든 인스턴스에 `destroy()`를 호출하도록 보강. (2) `Markmap.create()`는
      `static create()` 안에서 초기 렌더 직후 이미 무조건 `fit()`을 한 번 호출한다는 걸
      `node_modules` 실측으로 확인해, T006에서 넣었던 `{ autoFit: true }` 옵션을 제거 — 이 옵션을
      켜두면 `toggleNode`(가지 접기/펼치기)가 매번 내부적으로 `renderData`를 호출하고
      `autoFit`이 그때마다 재차 `fit()`을 실행해, 독자가 팬/줌으로 이동해둔 위치가 가지 클릭
      한 번마다 리셋되는 나쁜 UX가 됨을 발견해 기본값(false)으로 되돌림. 감사 결과 나머지
      위반 없음.)
- [X] T011 [US2] Checkpoint: `npm run dev`(로컬 기본 모드) + `npm run build` 후 `playwright-cli`로
      quickstart.md 3절 수행 — 확대 보기 창을 열지 않은 상태에서 가지 클릭 접기/펼치기, 휠 줌,
      드래그 이동이 각각 동작하는지, 새로고침 후 초기 상태(전체 펼침)로 돌아오는지 확인. 문제가
      발견되면 원인을 고치고 체크포인트를 다시 통과할 때까지 Phase 5로 넘어가지 않는다.
      (`npx tsc --noEmit` 통과. 실제 마우스 클릭으로 노드 접기/펼치기 확인(전체 13개 노드 →
      접으면 9개 → 다시 클릭하면 13개로 복귀, `<g class="markmap-node">` 개수로 실측). 휠
      스크롤 시 `transform`의 `translate`만 변하고 `scale`은 그대로임을 확인(팬 동작,
      `scrollForPan` 기본값이 이 macOS 환경에서 true라 일반 휠=팬). ctrl+휠(핀치 줌 시뮬레이션)
      시 `scale`이 변함을 확인(줌 동작 자체는 정상 작동, 합성 이벤트라 배율 크기는 실측
      참고용). 새로고침 후 13개 노드 전체 펼침 상태로 복귀 확인(상태 미저장, spec.md
      Assumptions와 일치). markmap 관련 신규 콘솔 에러 없음.)
      **후속 수정(요구사항 변경, 실사용 중 사용자 피드백)**: 위 체크포인트 통과 이후, 실제
      아티클을 읽다가 페이지를 스크롤하는 도중 커서가 마인드맵 위를 지나가면 페이지 스크롤이
      멈추고 다이어그램이 대신 팬/줌되는 스크롤 하이재킹 문제가 발견됨. Mermaid/PlantUML macOS
      프리뷰는 완전히 정적인데 Markmap만 인라인에서 뷰가 바뀌는 게 (1) 확대 모달에만 있는
      리셋 버튼을 인라인에도 필요하게 만들고 (2) 다른 두 다이어그램과 일관성이 없다는 지적에
      따라, `Markmap.create()` 옵션을 `{ zoom: false, pan: false, autoFit: true }`로 변경해
      인라인 드래그(팬)·휠(줌)·더블클릭·핀치 줌을 전부 비활성화(`markmap-view` 소스 실측 —
      `options.zoom`/`options.pan`이 각각 `svg.on(".zoom", null)`/`svg.on("wheel", null)`로
      이어짐, research.md "인라인 팬/줌 비활성화" Decision). 가지 접기/펼치기(`handleClick`)는
      이 옵션과 무관한 별도 리스너라 영향받지 않고 유지. 이제 인라인에 사용자가 조작할 뷰 상태가
      없으므로 `autoFit: true`도 다시 켬(접은 뒤 뷰가 자동 재조정됨). spec.md FR-005/User
      Story 2/SC-003/Assumptions와 data-model.md·contracts를 이 변경에 맞춰 갱신. 재검증:
      휠 스크롤 시 페이지가 정상 스크롤되고 다이어그램 `transform`은 불변(이전엔 팬됨), 드래그
      시도 전후 `transform` 완전 동일(이전엔 팬됨), 노드 클릭 접기/펼치기는 13→9→13개로 여전히
      정상 동작, `autoFit`으로 접은 뒤 뷰가 자동 재중심됨을 스크린샷으로 확인. 확대 보기 모달은
      변경 대상이 아니므로(고정 오버레이라 스크롤 충돌 없음) 손대지 않았고, 팬 버튼 클릭 시
      `transform` 변경을 재확인해 회귀 없음을 검증. `npm run build` 통과.

**Checkpoint**: User Story 1 + 2가 각각 독립적으로 동작(인라인 인터랙션 범위가 가지 접기/펼치기로
좁혀짐 — [amended])

---

## Phase 5: User Story 3 - 독자가 마인드맵을 확대해서 자세히 본다 (Priority: P3)

**Goal**: 확대 버튼을 누르면 기존 이미지·Mermaid·PlantUML 라이트박스와 동일한 방식의 확대 보기
창이 뜨고, 그 안에서도 드래그 이동·화살표 이동·리셋·줌·가지 접기/펼치기가 모두 가능하다.

**Independent Test**: 확대 버튼 클릭 → 모달 오픈 → 드래그/화살표 이동/리셋/줌/가지 접기·펼치기
동작을 확인하는 것으로 완결 검증 가능.

### Implementation for User Story 3

- [X] T012 [P] [US3] **(착수 전 vercel-react-best-practices 규칙 확인 필수)**
      `lib/markmap/open-markmap-lightbox.ts`(신규) 작성 — `open-mermaid-lightbox.ts`의
      `MermaidPanZoomInstance`와 동일한 shape(`panBy`/`reset`/`zoomIn`/`zoomOut`/`destroy`)를
      제공하되, 내부는 `svg-pan-zoom`이 아니라 이미 렌더링된 Markmap 인스턴스가 SVG에 바인딩한
      d3-zoom의 transform API를 직접 호출한다(contracts/markmap-rendering-contract.md #4 — 같은
      SVG에 두 줌 엔진을 얹으면 충돌하므로 `svg-pan-zoom`은 사용 불가). **완료 후 같은 태스크
      안에서 vercel-react-best-practices 규칙 대조 감사를 수행한다.**
      (`d3.ZoomBehavior`의 `translateBy`/`scaleBy`를 `selection.transition().call(...)`로 호출.
      `reset`은 `instance.fit()`(최초 렌더 직후 자동 호출되는 것과 동일 연산) 재사용. 감사 결과
      위반 없음 — 순수 함수형 래퍼라 리액트 관련 규칙 대상 자체가 적음.)
- [X] T013 [P] [US3] **(착수 전 vercel-react-best-practices 규칙 확인 필수)**
      `components/markmap/markmap-lightbox-modal.tsx`(신규) 작성 — 기존
      `mermaid-lightbox-modal.tsx`를 재사용하지 않고(research.md Decision, 기존 파일 변경 없음)
      동일한 `.mermaid-lightbox-*` CSS 클래스를 그대로 쓰는 JSX로 신규 작성한다. `source: string |
      null`(원본 Markmap 소스 텍스트, SVG 마크업 아님) prop을 받아 모달이 열릴 때 `markmap-lib`+
      `markmap-view`로 본문과 완전히 독립적인 새 인스턴스를 렌더링하고(항상 전체 펼침 기본
      상태로 시작), 화살표/리셋/줌 버튼은 T012의 `open-markmap-lightbox.ts`를 호출한다. 모달을
      닫으면 인스턴스를 `destroy()`한다. **완료 후 같은 태스크 안에서 vercel-react-best-practices
      규칙 대조 감사를 수행한다.** (depends: T012 — 로직 의존, 파일은 다름)
      (`.mermaid-lightbox-canvas svg { width:100%; height:100% }`가 이미 Markmap의 "고정 뷰포트"
      모델과 정확히 맞아떨어져 신규 CSS 전혀 없이 그대로 재사용 가능함을 확인. 다크 모드는
      `useTheme().isDark`로 캔버스 div에 `markmap-dark` 클래스 토글(T006과 동일 메커니즘). 감사
      결과: `async-parallel`(두 동적 import Promise.all ✓), `bundle-conditional`(source 있을
      때만 import ✓), `rerender-dependencies`(`[source]` primitive ✓), 위반 없음.)
- [X] T014 [US3] `markmap-diagram-handler.tsx`(T006)에 확대 버튼을 렌더링 성공한 블록에만 삽입하고
      (`.mermaid-expand-button`/`.mermaid-expand-icon` 클래스 재사용, 013이 PlantUML에서 쓴 방식과
      동일), 클릭 시 해당 블록의 원본 소스 텍스트를 `MarkmapLightboxModal`의 `source` prop으로
      전달하는 상태 연결을 구현한다. (depends: T013)
      (document 레벨 click 위임 리스너 1개 추가(client-event-listeners, Mermaid/PlantUML과 동일
      패턴) — 이미 있던 테마 토글 effect와 별개 effect로 분리, 리렌더마다 재등록되지 않도록
      `[]` deps.)
- [X] T015 [US3] Checkpoint: `npm run dev`(로컬 기본 모드) + `npm run build` 후 `playwright-cli`로
      quickstart.md 4절 수행 — 모달 오픈(항상 전체 펼침으로 시작), 상/하/좌/우 화살표 이동, 돋보기
      +/- 확대·축소, 드래그로 화면 직접 이동, 리셋으로 최초 상태 복귀, 모달 안에서 가지 접기/펼치기,
      ESC/배경 클릭 닫기, 재오픈 시 새 인스턴스로 렌더링되는지까지 전부 확인. 같은 페이지의
      Mermaid/PlantUML 확대 버튼과 위치·스타일·인터랙션이 육안으로 구분 불가능한지 함께 확인
      (SC-006). 문제가 발견되면 원인을 고치고 체크포인트를 다시 통과할 때까지 Phase 6으로 넘어가지
      않는다.
      (`npx tsc --noEmit` 통과. 확대 버튼 클릭 → 모달 오픈(13개 노드 전체 펼침) 확인. 상하좌우
      화살표 4개 모두 `transform`의 translate가 반대 방향 조합으로 정확히 왕복함을 실측(위/아래,
      좌/우 각각 상쇄 확인) — Mermaid의 svg-pan-zoom 방향 관례와 동일한 부호로 이미 맞아떨어져
      별도 수정 불필요했음. 줌인(scale 1.62→2.03)/줌아웃(2.03→1.62 정확히 복귀) 확인. 리셋 클릭
      → 최초 fit() 상태(translate/scale 모두)로 정확히 복귀 확인. 모달 안 노드 클릭으로 접기/
      펼치기(13→9개) 확인. ESC와 배경 클릭 둘 다 닫힘 확인. 재오픈 시 이전 접힘 상태 없이 13개
      전체 펼침 + 최초 transform으로 새로 시작함을 확인(독립 인스턴스). 다크 모드로 전환 후
      재오픈 시 `markmap-dark` 클래스 적용 및 스크린샷으로 충분한 대비 확인. 스크린샷 비교 결과
      컨트롤 클러스터(화살표 3x3+줌 2개) 레이아웃이 Mermaid/PlantUML 모달과 완전히 동일. 이
      라운드 전체에서 markmap 관련 콘솔 에러 없음.)

**Checkpoint**: User Story 1~3이 각각 독립적으로 동작

---

## Phase 6: User Story 4 - 독자가 마인드맵의 원본 코드를 복사한다 (Priority: P4)

**Goal**: 복사 버튼을 누르면 원본 Markmap 코드가 클립보드에 복사된다.

**Independent Test**: 복사 버튼 클릭 후 클립보드 내용이 원본 소스와 정확히 일치하는지 확인.

### Implementation for User Story 4

- [X] T016 [US4] 신규 구현 없음 — `rehype-code-copy-button.ts`/`CodeCopyHandler`가 언어 무관하게
      모든 `figure[data-rehype-pretty-code-figure]`에 이미 복사 버튼을 붙이고 `pre.textContent`를
      복사한다(contracts/markmap-rendering-contract.md #1/#3). T006에서 `pre`를 삭제하지 않고
      `display:none`만 적용하도록 구현했는지 코드 리뷰로 재확인한다(회귀 방지 점검, 코드 변경
      없음).
      (`grep`으로 재확인 — 성공/실패 두 경로 모두 `pre.style.display`만 토글하고 `remove()`는
      컨테이너에만 적용됨.)
- [X] T017 [US4] Checkpoint: `npm run dev`(로컬 기본 모드) + `npm run build` 후 `playwright-cli`로
      quickstart.md 5절 수행 — 복사 버튼 클릭 후 클립보드 내용이 렌더링된 그림이 아니라 원본
      Markmap 코드 텍스트와 정확히 일치하는지 확인. 문제가 발견되면 원인을 고치고 체크포인트를
      다시 통과할 때까지 Phase 7로 넘어가지 않는다.
      (clipboard-read/write 권한 부여 후 실제 클릭 → `navigator.clipboard.readText()`로 확인 —
      `_diagram.md`의 "Markmap — 마인드맵" 원본 텍스트(`# 블로그 아키텍처\n## 콘텐츠 파이프라인...`)와
      개행까지 정확히 일치.)

**Checkpoint**: User Story 1~4 모두 독립적으로 동작

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 전체 스토리를 아우르는 마무리 확인

- [X] T018 [P] constitution.md Principle II 종합 재감사 — T006/T010/T012/T013에서 각각 작성 직후
      개별 감사는 이미 끝났지만, 세 신규 파일(`markmap-diagram-handler.tsx`,
      `open-markmap-lightbox.ts`, `markmap-lightbox-modal.tsx`)이 완성된 뒤 상호작용(예: 본문
      인스턴스와 모달 인스턴스가 상태를 공유하지 않는지, `document` 레벨 이벤트 리스너가 총
      몇 개 등록되는지, 동적 import가 실제로 조건부인지)까지 종합 점검한다. 위반이 발견되면 이
      태스크 안에서 즉시 수정한다.
      (`MarkmapDiagramHandler`의 effect 3개(파싱/렌더링 `[]`, 테마 토글 `[isDark]`, 확대 버튼
      클릭 위임 `[]`) 재확인 — document 레벨 리스너는 클릭 위임 1개뿐, Mermaid/PlantUML
      핸들러와 합쳐도 페이지당 핸들러 종류별 1개씩만 등록되는 기존 패턴과 동일. 본문 인스턴스
      배열(`instances`)과 모달의 `instanceRef`는 완전히 분리된 상태라 상호 참조/공유 없음.
      동적 import 4곳(본문 렌더링, 모달 렌더링 각 2개씩) 전부 조건 뒤에서만 실행됨을 재확인.
      위반 없음.)
- [X] T019 [P] `content/articles/**` 기존 아티클(둘 이상, `_diagram.md` 제외)의 상세 페이지를 열어
      Markmap 관련 UI가 새로 생기지 않았는지(SC-002/FR-014) 확인. 홈페이지(`/`)에 `_diagram`이
      노출되지 않는지(`show_on_homepage: false`) 확인.
      (`/article/Performance-Testing-Concepts` 확인: `pre[data-language="markmap"]`/
      `[data-markmap-diagram]`/확대버튼 0개, 콘솔 에러 0개. 홈 HTML에 `_diagram`/
      `Diagram Preview` 문자열 0회.)
- [X] T020 [P] `_diagram.md` 안의 PlantUML 두 섹션과 Mermaid mindmap 섹션이 이번 변경(Markmap
      추가)으로 깨지지 않았는지 재확인 — `components/mermaid/mermaid-lightbox-modal.tsx`,
      `lib/mermaid/open-mermaid-lightbox.ts`, `components/article/plantuml-diagram-handler.tsx`를
      이번 기능 구현 중 한 줄도 수정하지 않았음을 코드 리뷰로 재확인한다(contracts/
      markmap-rendering-contract.md #5, 회귀 방지 불변 조건).
      (`git diff --stat`로 세 파일 모두 변경 없음(빈 출력) 확인. Mermaid mindmap 섹션은 T005
      단계에서 이미 정상 렌더링 확인됨.)
- [X] T021 Checkpoint: quickstart.md 1~6절이 각 Phase 체크포인트(T005/T009/T011/T015/T017)에서
      이미 순서대로 `npm run dev`(로컬 기본 모드) + `npm run build` + `playwright-cli`로 실제
      실행/확인되었는지 종합 재확인. 누락된 항목이 있으면 이 태스크 안에서 재검증한다.
      (T002/T005/T009/T011/T015/T017 전부 실패 없이 순서대로 통과 — 종합 재실행 없이 확인으로
      갈음.)
- [X] T022 quickstart.md 8절("정리")을 갱신한다 — 013은 검증 후 `_plantuml-preview.md`를
      삭제했지만, `_diagram.md`는 PlantUML/Mermaid mindmap/Markmap 세 다이어그램 타입을 한 번에
      보여주는 통합 진단용 아티클로서 향후 다이어그램 관련 기능(신규 엔진 추가, 회귀 테스트)에
      재사용할 가치가 있으므로 **삭제하지 않고 유지**한다(`show_on_homepage: false`로 이미 홈
      노출은 차단됨). quickstart.md 8절의 삭제 절차를 이 방침으로 대체 기술한다.
      (T004에서 quickstart.md 8절을 이미 "유지" 방침으로 갱신 완료 — 별도 추가 작업 없음.)
- [X] T023 **후속 수정(요구사항 변경, 실사용 중 사용자 피드백)** — `markmap-diagram-handler.tsx`의
      인라인 컨테이너 높이를 고정 420px에서 콘텐츠 기준 계산으로 변경. **착수 전
      vercel-react-best-practices 규칙 재확인 완료(rerender-dependencies — 이번 변경은 effect
      의존성 배열을 건드리지 않아 위반 없음).**
      T009 체크포인트 이후, 실제 콘텐츠(`_diagram.md`)로 다시 살펴보니 노드 3개짜리 "마인드맵2"와
      노드 10개 이상인 다른 마인드맵이 콘텐츠 양과 무관하게 완전히 동일한 420px 박스를 써서 작은
      트리는 대부분 빈 공간, 큰 트리는 상대적으로 눌려 보이는 문제가 지적됨. `_diagram.md`에
      "넓은 트리(잎 15개)"·"단일 노드"(임시, 실측 후 제거) 검증 섹션을 추가해 라이브
      스크린샷으로 상한/하한 값을 실측 확정(상한 800px, 하한 120px — research.md "인라인
      컨테이너 높이를 콘텐츠 기준으로 계산" Decision 참고). `renderBlock()`을
      `Markmap.create()`(fire-and-forget) 대신 `new Markmap()` + `await setData()` +
      `instance.state.rect`로 높이 역산 + clamp + `svg.style.height` 반영 + `await fit()` 순서로
      재작성(비동기 함수로 전환, 호출부 `for` 루프에 `await` 추가).
      **1차 라이브 검증 후 2차 정정**: 스케일 상한으로 `maxInitialScale`(기본 2)을 그대로 썼더니
      폭이 좁고 세로로 긴 "넓은 트리"가 최대 2배까지 확대되어 다른 마인드맵보다 글자가 눈에 띄게
      커 보이는 문제와, 컨테이너에 위아래 padding이 전혀 없어(예전 420px 고정 시절엔 여유
      공간이 넉넉해 안 보였던 문제) 콘텐츠가 타이틀바/하단 테두리에 거의 맞닿는 문제가 모두
      라이브 스크린샷으로 발견됨. 스케일 상한을 1(원본 크기, Mermaid/PlantUML의
      `max-width:100%; height:auto`와 동일하게 축소만 허용)로 낮추고, `article-body.css`의
      `[data-markmap-diagram]` 컨테이너에 Mermaid/PlantUML과 동일한 `padding: 1.5rem 1.25rem`을
      추가.
      (`npx tsc --noEmit` 통과. `npm run build` 통과(2회, 최종 정정 반영 후). `npm run
      dev`(로컬 기본 모드)로 `playwright-cli` 실제 브라우저 검증: 4개 마인드맵 컨테이너 높이가
      각각 213px(마인드맵)/120px(마인드맵2, 하한 clamp)/155px(깊은 트리)/779px(넓은 트리, 상한
      800px 안쪽)로 콘텐츠 비례 확인 → padding 추가 후 201.7/120/147/389px로 재확인(넓은 트리는
      스케일 상한 1로 정정되며 거의 절반으로 줄어듦, 텍스트 크기 육안 확인 결과 다른 마인드맵과
      동일). 4개 섹션 전부 스크린샷으로 위아래 여백 확인. 가지 클릭 접기(13→9개 노드, `<g
      class="markmap-node">` 개수로 실측)·재클릭 펼치기(9→13개) 정상 동작 및 접었다 펴도 컨테이너
      높이(250px, 고정)가 그대로임을 확인("확장 기준" 1회 고정 검증). 드래그 제스처 전후 SVG
      `transform` 완전 동일(팬 여전히 비활성) 및 휠 스크롤 시 페이지 `scrollY`만 변하고
      `transform`은 불변(줌 여전히 비활성) 재확인 — 이번 변경이 T011의 팬/줌 비활성화를 깨지
      않았음을 검증. 다크→라이트 테마 토글 스크린샷 확인. 쿠키로 다크 모드 강제한 새 접속(첫
      로딩) 스크린샷에서 텍스트가 토글 없이 바로 보임 확인 — 경쟁 상태 수정(T006 후속) 회귀
      없음. 확대 보기 모달: 열기/줌인(scale 1.62→2.03)/리셋(정확히 1.62로 복귀)/닫기 전부 정상,
      이 태스크가 손대지 않은 `markmap-lightbox-modal.tsx`/`open-markmap-lightbox.ts`가 실제로
      영향받지 않았음을 확인. 콘솔 에러는 giscus 404(무관)와 PlantUML 의도된 400(기존 동작)뿐,
      markmap 관련 신규 에러 없음. 검증용으로 추가했던 "단일 노드" 섹션은 실측 완료 후
      `_diagram.md`에서 제거, "넓은 트리" 섹션만 영구 보존. spec.md Edge Cases(FR-015 인접,
      width/height 서술 분리)·data-model.md(`containerHeight` 필드 신설)·research.md(신규 Decision
      섹션)·quickstart.md(0절 섹션 목록, 2절 검증 항목)를 이 변경에 맞춰 갱신.)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 의존성 없음 — 즉시 시작 가능
- **Foundational (Phase 2)**: Setup 완료에 의존 — 모든 User Story를 블로킹
- **User Stories (Phase 3+)**: 전부 Foundational 완료에 의존
  - US1은 다른 스토리에 의존하지 않음(MVP)
  - US2는 US1의 렌더링 핸들러(T006)가 있어야 인스턴스 유지 여부를 점검할 수 있어 US1 완료 후 시작
  - US3는 렌더링된 블록/원본 소스 접근 지점이 필요해 US1(T006) 완료 후 시작(US2와 순서 무관 —
    본문 인라인 인터랙션과 확대 보기는 서로 독립적인 기능)
  - US4는 구현이 사실상 없고(T016) US1(T006)이 `pre`를 보존하도록 구현되었는지 확인만 하므로 US1
    완료 후 아무 때나 진행 가능
- **Polish (Phase 7)**: 원하는 User Story가 모두 끝난 뒤 진행

### Within Each User Story

- 구조: 파일 작성([P] 가능한 것부터, vercel-react-best-practices 감사 포함) → 마운트/연결(선행
  파일에 의존) → Checkpoint
- 스토리 완료 후 다음 우선순위로 이동

### Parallel Opportunities

- T012(`lib/markmap/open-markmap-lightbox.ts`)와 T013(`components/markmap/
  markmap-lightbox-modal.tsx`)은 서로 다른 파일이라 [P] 병렬 착수 가능(단 T013의 버튼 클릭 핸들러
  로직은 T012의 함수 시그니처를 알아야 하므로, 시그니처를 먼저 합의한 뒤 병렬 작성하는 것을
  권장)
- Phase 7의 T018, T019, T020은 서로 다른 관심사라 [P] 병렬 가능

---

## Parallel Example: User Story 3

```bash
# lib/markmap/open-markmap-lightbox.ts 와 components/markmap/markmap-lightbox-modal.tsx는
# 서로 다른 파일이므로 함께 착수 가능:
Task: "lib/markmap/open-markmap-lightbox.ts 작성 — markmap-view의 d3-zoom transform API 래핑"
Task: "components/markmap/markmap-lightbox-modal.tsx 작성 — .mermaid-lightbox-* 재사용, source
       prop으로 독립 인스턴스 렌더링"
```

---

## Implementation Strategy

### MVP First (User Story 1만)

1. Phase 1: Setup 완료
2. Phase 2: Foundational 완료(CRITICAL — 모든 스토리를 블로킹, `_diagram.md` 통합 미리보기 준비)
3. Phase 3: User Story 1 완료
4. **STOP and VALIDATE**: quickstart.md 2절로 US1 단독 검증(체크포인트 T009)
5. 필요하면 여기서 배포 — "Mermaid/PlantUML과 동등한 열람 경험"이라는 기본 가치는 US1만으로 이미
   달성됨(단, Markmap 고유의 인터랙티브 차별점은 US2에서 완성됨을 함께 공지)

### Incremental Delivery

1. Setup + Foundational → US1(MVP, 체크포인트 T009 통과) → US2(체크포인트 T011 통과) →
   US3(체크포인트 T015 통과) → US4(체크포인트 T017 통과) → Polish(체크포인트 T021)
2. 각 체크포인트는 이전 Phase의 3단계 검증(로컬 dev 기동 → build → playwright-cli)을 통과해야
   다음 Phase로 넘어간다 — 실패한 채로 이월하지 않는다.
