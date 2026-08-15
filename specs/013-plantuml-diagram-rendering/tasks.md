# Tasks: PlantUML 다이어그램 렌더링

**Input**: Design documents from `/specs/013-plantuml-diagram-rendering/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md,
contracts/plantuml-rendering-contract.md, quickstart.md

**Tests**: 이 저장소는 자동화 테스트 스위트가 없다(constitution.md Principle I). 검증은 각 Phase
마지막에 고정된 3단계 체크포인트로 대체한다 — 별도 테스트 태스크는 생성하지 않는다.

1. `npm run dev`로 로컬 기본 모드(인메모리 Redis fallback, `KV_REST_API_URL` 미설정 상태 유지) 기동
   — 방문자 통계 위젯이 `0`에서 시작하는 상태를 유지한다. `npm run dev:docker`는 쓰지 않는다.
2. `npm run build`로 빌드/타입 에러 확인
3. `playwright-cli` 스킬로 브라우저 구동 검증(우선), 픽셀 단위 시각 확인이 필요할 때만 `playwright`
   MCP 스크린샷 도구로 전환. `claude-in-chrome` 등 다른 수단은 쓰지 않는다.

세 단계 중 하나라도 실패하면 다음 Phase로 넘어가기 전에 같은 Phase 안에서 원인을 고치고 체크포인트를
다시 통과해야 한다. **실패한 채로 다음 Phase로 이월하지 않는다.**

**Organization**: spec.md의 User Story 3개(P1~P3)별로 태스크를 그룹화했다. Foundational 단계에서
PlantUML 코드블록(정상 + 의도적 렌더링 실패 1개)을 포함한 검증용 아티클을 실제 구현(rehype
플러그인/handler 컴포넌트) 착수 **이전에** 먼저 만들어, 이후 모든 Phase의 체크포인트가 처음부터
실제 콘텐츠를 대상으로 즉시 브라우저 검증 가능하게 한다(012 Mermaid 기능과 동일한 관례,
quickstart.md와 동일 스캐폴드).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능(다른 파일, 미완료 태스크에 의존하지 않음)
- **[Story]**: 이 태스크가 속한 User Story (US1~US3)
- 모든 태스크에 정확한 파일 경로 포함

## Path Conventions

단일 Next.js 프로젝트. 모든 경로는 저장소 루트 기준.

---

## Phase 1: Setup

**Purpose**: 신규 의존성 설치

- [X] T001 `package.json`의 `dependencies`에 `plantuml-encoder`(^1.4.0)를 알파벳 순서로 추가하고,
      `devDependencies`에 `@types/plantuml-encoder`(^1.4.2)를 추가한 뒤 `npm install` 실행
      (research.md — `plantuml-encoder`는 자체 타입 선언이 없어 DefinitelyTyped 패키지가 필요함).
- [X] T002 Checkpoint: `npm run dev`(로컬 기본 모드, 방문자 통계 `0` 시작) 정상 기동 + `npm run build`
      성공 확인. 의존성만 추가된 상태라 신규 화면 변화가 없으므로 `playwright-cli`로는 홈페이지(`/`)가
      기존과 동일하게 200으로 로드되고 콘솔 에러가 없는지만 확인한다.
      (`npm run build`가 `.env.production.local`을 읽어 "실제 프로덕션 Upstash에 연결됨" 경고를
      띄우는 것을 확인 — `npm run dev`는 이 파일을 읽지 않으므로 정상 동작. `/api/stats/Scope`
      응답이 `{"total":0,...}`으로 로컬 인메모리 모드임을 실측 확인.)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 User Story가 공유하는 검증용 콘텐츠 스캐폴드를 실제 구현 착수 전에 먼저
준비한다 — PlantUML 코드블록이 포함된 실제 아티클이 없으면 이후 어떤 Phase의 체크포인트도
브라우저에서 검증할 대상이 없다.

**⚠️ CRITICAL**: 이 단계 완료 전에는 어떤 User Story 구현(rehype 플러그인, handler 컴포넌트 등)도
시작하지 않는다.

- [X] T003 `content/articles/_plantuml-preview.md`를 생성한다. frontmatter는 `title`, `date`,
      `tags`, `showOnHomepage: false`를 채운다. 본문에는 (a) "정상 다이어그램" 섹션에 유효한
      ```plantuml 시퀀스 다이어그램 코드블록 하나(`@startuml / Alice -> Bob: 요청 / Bob --> Alice:
      응답 / @enduml`), (b) "렌더링 실패 다이어그램" 섹션에 PlantUML이 다이어그램으로 인식하지
      못하는(= 응답에 `data-diagram-type` 속성이 없는, research.md에서 실측 확인한 "Welcome to
      PlantUML!" 케이스를 재현하는) ```plantuml 코드블록 하나를 포함한다(quickstart.md 0절과
      동일 내용).
- [X] T004 Checkpoint: `content/articles/**` 변경이므로 이미 떠 있는 `next dev`를 반드시
      재시작한 뒤(AGENTS.md), `npm run dev`(로컬 기본 모드) + `npm run build`로 새 아티클이
      정상적으로 목록/빌드에 포함되는지 확인. `playwright-cli`로 `/article/_plantuml-preview`에
      접속해 — 아직 렌더링 구현 전이므로 — 두 ```plantuml 블록이 모두 기존과 동일하게 평문
      코드 블록(Shiki에 plantuml 문법이 없어 하이라이트 없음, research.md)으로만 보이는지(회귀
      없음의 baseline) 확인한다.
      (baseline 확인 완료 — 두 블록 모두 평문 코드로 보임. giscus 404/warning은 신규 슬러그의
      댓글 스레드가 아직 없어 뜨는 무관한 로그로 확인.)

**Checkpoint**: 스캐폴드 준비 완료 — User Story 구현 시작 가능

---

## Phase 3: User Story 1 - 독자가 다이어그램을 그림으로 바로 본다 (Priority: P1) 🎯 MVP

**Goal**: ```plantuml 코드펜스가 문법 강조된 텍스트가 아니라 실제 다이어그램으로 렌더링되고,
렌더링에 실패해도 페이지가 깨지지 않으며, 다크/라이트 전환에도 읽기 가능한 대비를 유지한다.

**Independent Test**: `_plantuml-preview.md`의 "정상 다이어그램" 섹션이 그림으로 보이고,
"렌더링 실패 다이어그램" 섹션은 원본 코드가 그대로 노출되는지 확인하는 것만으로 완결 검증 가능.

### Implementation for User Story 1

- [X] T005 [P] [US1] `lib/content/plugins/rehype-plantuml.ts` 작성 — `remarkRehype` 직후,
      `rehypePrettyCode` 이전에 실행되는 rehype 플러그인. `lang === "plantuml"`인 code 노드를
      찾아 원본 텍스트를 `plantuml-encoder`의 `encode()`로 인코딩하고, 대응하는 `pre`에
      `data-plantuml-encoded` 속성으로 부여한다(contracts/plantuml-rendering-contract.md #1).
      **네트워크 호출을 포함하지 않는다** — 순수 문자열 변환만 수행해 빌드를 실패시킬 수 없어야
      한다(불변 조건).
      **후속 수정(실측으로 발견)**: 원래 계획한 위치(rehypePrettyCode 이전)에서 실제 렌더링을
      확인해보니 `data-plantuml-encoded` 속성이 브라우저 DOM에서 사라짐을 발견 — rehypePrettyCode가
      코드펜스마다 `pre`를 기존 속성을 보존한 채 데코레이션하는 게 아니라 완전히 새 엘리먼트로
      교체하기 때문. rehypePrettyCode **이후**로 실행 순서를 옮기고, 원본 텍스트도 code 노드의
      직접 텍스트 자식 대신 `hast-util-to-string`(기존 의존성)으로 읽도록 수정(Shiki가 토큰을
      span으로 감싸도 텍스트 자체는 안 바뀌므로 원본과 일치, 012 research.md와 동일 근거).
      research.md의 "신규 rehype 플러그인의 파이프라인 삽입 위치" Decision도 이 실측 결과로 정정.
- [X] T006 [US1] `lib/content/pipeline.ts`의 unified 체인에 `.use(rehypePlantuml)`을
      `remarkRehype` 직후, `rehypePrettyCode` 이전 위치에 추가(research.md "신규 rehype 플러그인의
      파이프라인 삽입 위치"). (depends: T005)
      **후속 수정**: T005와 동일 사유로 실제 삽입 위치는 `rehypePrettyCode` **이후**(rehypeCodeCopyButton
      이전)로 정정.
- [X] T007 [P] [US1] `components/article/plantuml-diagram-handler.tsx` 작성 — `"use client"`,
      마운트 시 `document.querySelectorAll('pre[data-language="plantuml"]')` 탐색(빈 경우 즉시
      종료), 대상이 있는 블록마다 `data-plantuml-encoded` 값으로
      `https://www.plantuml.com/plantuml/svg/{encoded}` URL을 만들어 개별 `fetch()`(블록 단위로
      격리 — 하나의 실패가 다른 블록에 전파되지 않도록).
      실패 판정은 contracts/plantuml-rendering-contract.md #3을 그대로 구현: (a) fetch reject
      또는 `!response.ok`, (b) `Content-Type`이 `image/svg+xml` 아님, (c) 응답 텍스트의 루트
      `<svg>`에 `data-diagram-type` 속성 없음 — 세 조건 중 하나라도 해당하면 실패.
      **후속 수정(사용자 요청으로 vercel-react-best-practices 감사)**: 최초 구현이 블록마다
      `for...await` 순차 루프로 fetch해 다이어그램이 여럿인 페이지에서 불필요한 워터폴을 만드는
      `async-parallel`(CRITICAL) 위반이었음을 발견. mermaid.render()와 달리 각 fetch는 공유 상태
      없이 완전히 독립적이므로 `Promise.all(targets.map(...))`로 병렬화. 언마운트 후 DOM 조작을
      막기 위한 취소 플래그는 클로저 변수 대신 fetch들이 공유하는 `cancelledRef` 객체로 전달.
- [X] T008 [US1] `plantuml-diagram-handler.tsx`(T007)의 성공/실패 DOM 치환을
      contracts/plantuml-rendering-contract.md #4대로 구현 — 성공 시
      `figure[data-rehype-pretty-code-figure]` 안 `pre` 앞에 SVG 컨테이너(`data-plantuml-diagram`)를
      삽입하고 응답 SVG 텍스트를 `innerHTML`로 주입, `pre`는 `display:none`(삭제 금지). 실패 시
      `pre`를 그대로 노출하고 재시도하지 않는다(`data-plantuml-error="true"` 마킹). T007과 한
      파일이라 T007 작성 시점에 함께 구현됨.
- [X] T009 [US1] `app/article/[slug]/page.tsx`에 `<PlantumlDiagramHandler />`를
      `<CodeCopyHandler />`/`<ImageLightboxHandler />`/`<MermaidDiagramHandler />`와 나란히
      마운트. (depends: T007)
- [X] T010 [US1] `app/article-body.css`에 PlantUML 다이어그램 컨테이너
      (`[data-plantuml-diagram]`)의 고정 라이트 카드 스타일(흰 배경, 둥근 모서리) 추가 — 다크
      모드에서도 카드 경계로 대비를 확보한다(research.md "다크/라이트 테마 반영 방식").
- [X] T011 [US1] Checkpoint: `npm run dev`(로컬 기본 모드) + `npm run build` 후 `playwright-cli`로
      quickstart.md 1~3절 수행 — 빌드가 네트워크 이슈 없이 통과하는지, 정상 다이어그램이 그림으로
      보이는지, 다크 모드에서 라이트 카드로 대비가 유지되는지, 렌더링 실패 다이어그램은 원본 코드로
      폴백되고 확대 버튼이 없는지(아직 US2 미구현이라 당연히 없음), 콘솔 에러가 없는지 확인.
      문제가 발견되면 원인을 고치고 체크포인트를 다시 통과할 때까지 Phase 4로 넘어가지 않는다.
      (다크/라이트 두 테마 모두 스크린샷으로 육안 확인 완료. 실패 다이어그램은 실측 결과 200+
      "Welcome to PlantUML!"이 아니라 HTTP 400으로 응답 — 판정 조건 (a)(`!response.ok`)가 이미
      이 경우도 커버해 별도 수정 없이 정상 폴백됨을 확인.)

**Checkpoint**: User Story 1이 독립적으로 완결되어 배포 가능(MVP)

---

## Phase 4: User Story 2 - 독자가 다이어그램을 확대해서 자세히 본다 (Priority: P2)

**Goal**: 렌더링된 다이어그램의 확대 버튼을 누르면 Mermaid와 동일한 확대 보기 창(이동/확대·축소)이
뜬다.

**Independent Test**: 확대 버튼 클릭 → 모달 오픈 → 이동/돋보기 +/−/리셋 동작을 확인하는 것으로
완결 검증 가능.

### Implementation for User Story 2

- [X] T012 [US2] `plantuml-diagram-handler.tsx`(T007/T008)에 확대 버튼을 렌더링 성공한 블록에만
      삽입하고, 클릭 시 SVG를 클론해 기존 `MermaidLightboxModal`(신규 컴포넌트 없음, research.md
      Decision)을 그대로 여는 이벤트 위임 연결 —
      `components/article/mermaid-diagram-handler.tsx`의 `ensureExpandButton`/
      `buildLightboxSvgMarkup` 패턴을 그대로 따른다(contracts/plantuml-rendering-contract.md #5).
      (depends: T008) (T007/T008 작성 시점에 한 파일 안에서 함께 구현됨 — Mermaid 실제 구현도
      동일하게 한 파일에 통합된 형태였음)
- [X] T013 [US2] Checkpoint: `npm run dev`(로컬 기본 모드) + `npm run build` 후 `playwright-cli`로
      quickstart.md 5절 수행 — 모달 오픈, 상/하/좌/우 이동, 돋보기 +/−, 리셋으로 최초 상태 복귀,
      ESC/배경 클릭 닫기까지 전부 확인. 같은 페이지에 Mermaid 다이어그램도 있다면(별도 아티클과
      비교) 확대/복사 버튼의 위치·스타일·인터랙션이 육안으로 구분 불가능한지 함께 확인(SC-004).
      문제가 발견되면 원인을 고치고 체크포인트를 다시 통과할 때까지 Phase 5로 넘어가지 않는다.
      (모달 오픈/줌인×2/리셋/닫기 전부 실제 클릭으로 확인, 콘솔 에러 없음. Mermaid 라이트박스를
      그대로 재사용하므로 클래스명이 동일해 UI 구분 불가능함이 재사용 자체로 보장됨.)

**Checkpoint**: User Story 1 + 2가 각각 독립적으로 동작

---

## Phase 5: User Story 3 - 독자가 다이어그램의 원본 코드를 복사한다 (Priority: P3)

**Goal**: 렌더링된 다이어그램의 복사 버튼을 누르면 원본 PlantUML 코드가 클립보드에 복사된다.

**Independent Test**: 복사 버튼 클릭 후 클립보드 내용이 원본 소스와 정확히 일치하는지 확인.

### Implementation for User Story 3

- [X] T014 [US3] 신규 구현 없음 — `rehype-code-copy-button.ts`/`CodeCopyHandler`가 언어 무관하게
      모든 `figure[data-rehype-pretty-code-figure]`에 이미 복사 버튼을 붙이고
      `pre.textContent`를 복사한다(contracts/plantuml-rendering-contract.md #2/#4). T008에서
      `pre`를 삭제하지 않고 `display:none`만 적용하도록 구현했는지 코드 리뷰로 재확인한다(회귀
      방지 점검, 코드 변경 없음).
      (코드 리뷰 결과 확인 — plantuml-diagram-handler.tsx는 실패 경로에서만이 아니라 성공
      경로에서도 pre를 display:none으로만 숨기고 DOM에서 제거하지 않음.)
- [X] T015 [US3] Checkpoint: `npm run dev`(로컬 기본 모드) + `npm run build` 후 `playwright-cli`로
      quickstart.md 4절 수행 — 복사 버튼 클릭 후 클립보드 내용이 렌더링된 그림이 아니라 원본
      PlantUML 코드 텍스트와 정확히 일치하는지 확인. 문제가 발견되면 원인을 고치고 체크포인트를
      다시 통과할 때까지 Phase 6으로 넘어가지 않는다.
      (clipboard-read/write 권한 부여 후 실제 클릭 → `navigator.clipboard.readText()`로 확인 —
      `"@startuml\nAlice -> Bob: 요청\nBob --> Alice: 응답\n@enduml"`와 정확히 일치.)

**Checkpoint**: User Story 1~3 모두 독립적으로 동작

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 전체 스토리를 아우르는 마무리 확인

- [X] T016 [P] constitution.md Principle II(vercel-react-best-practices Compliance,
      NON-NEGOTIABLE)에 따라 `.agents/skills/vercel-react-best-practices/rules/`를 실제로 열어,
      신규 client 컴포넌트/플러그인(`rehype-plantuml.ts`, `plantuml-diagram-handler.tsx`)을
      규칙에 대조 감사 — 특히 조건부 동적 import, `document` 레벨 이벤트 위임 1개 유지, 상태/
      이펙트 의존성 관례를 Mermaid 구현(012 T018 감사 결과)과 동일 기준으로 점검한다. 위반이
      발견되면 이 태스크 안에서 즉시 수정한다.
      **처리 순서 정정**: 원래 Polish 단계로 미뤄뒀으나, AGENTS.md/constitution.md Principle II가
      "작성 전에" 감사하라는 요구임을 사용자가 지적해 T007 구현 직후(Phase 3 도중)로 앞당겨 실제
      수행함 — `async-parallel`(T007 후속 수정) 발견/수정이 그 결과. `bundle-conditional`(무거운
      의존성 없음 — fetch/DOMParser는 네이티브 API, 조건부 로드 대상 자체가 없음 ✓),
      `client-event-listeners`(document 레벨 위임 리스너 1개, 컴포넌트도 페이지당 1개 인스턴스만
      마운트 ✓), `rerender-dependencies`(두 useEffect 모두 `[]` — data-model.md 결정상 테마가
      렌더링에 영향 없어 Mermaid와 달리 의존성 자체가 불필요 ✓), `rendering-conditional-render`
      (`&&` 조건부 렌더링 없음 ✓) 추가 확인 완료, 위반 없음.
- [X] T017 [P] `content/articles/**` 기존 아티클(둘 이상, `_plantuml-preview.md` 제외)의 상세
      페이지를 열어 PlantUML 관련 UI가 새로 생기지 않았는지(신규 코드 경로가 no-op인지, SC-007)
      확인. 홈페이지(`/`)에 `_plantuml-preview`가 노출되지 않는지(`showOnHomepage: false`) 확인.
      (`/article/Scope` 확인: `pre[data-language="plantuml"]`/`[data-plantuml-diagram]`/확대버튼
      0개, 콘솔 에러 0개. 홈 HTML에 `_plantuml-preview`/`PlantUML Preview` 문자열 0회.)
- [X] T018 Checkpoint: quickstart.md 1~6절이 각 Phase 체크포인트(T004/T011/T013/T015/T017)에서
      이미 순서대로 `npm run dev`(로컬 기본 모드) + `npm run build` + `playwright-cli`로 실제
      실행/확인되었는지 종합 재확인(정상 렌더링, 다크/라이트 대비, 실패 폴백, 클립보드 복사, 확대
      모달, Mermaid와의 UI 동일성, 회귀 없음). 누락된 항목이 있으면 이 태스크 안에서 재검증한다.
      (각 체크포인트가 실패 없이 순서대로 통과했으므로 별도 재실행 없이 종합 확인으로 갈음.)
- [X] T019 quickstart.md 8절에 따라 `content/articles/_plantuml-preview.md` 삭제 여부를 결정하고
      정리한다. 삭제한다면 `next dev`/`next start` 프로세스를 재시작해 실제로 목록에서 사라졌는지
      확인한다(AGENTS.md).
      → 삭제 완료, 재시작 후 `/article/_plantuml-preview` 404 확인, `npm run build` 라우트
      목록에서도 제거됨을 확인.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 의존성 없음 — 즉시 시작 가능
- **Foundational (Phase 2)**: Setup 완료에 의존 — 모든 User Story를 블로킹
- **User Stories (Phase 3+)**: 전부 Foundational 완료에 의존
  - US1은 다른 스토리에 의존하지 않음(MVP)
  - US2는 렌더링된 SVG/확대 버튼 삽입 지점이 필요해 US1(T007/T008) 완료 후 시작
  - US3는 구현이 사실상 없고(T014) US1(T008)이 `pre`를 보존하도록 구현되었는지 확인만 하므로
    US1 완료 후 아무 때나(US2와 순서 무관) 진행 가능
- **Polish (Phase 6)**: 원하는 User Story가 모두 끝난 뒤 진행

### Within Each User Story

- 구조: 파일 작성([P] 가능한 것부터) → 파이프라인/마운트 연결(선행 파일에 의존) → 스타일 →
  Checkpoint
- 스토리 완료 후 다음 우선순위로 이동

### Parallel Opportunities

- T005(rehype 플러그인)와 T007(client handler)은 서로 다른 파일이고 서로 의존하지 않아 [P] 병렬
  착수 가능 — 단 T006(파이프라인 연결)은 T005 완료에, T009(page.tsx 마운트)는 T007 완료에 각각
  의존
- Phase 6의 T016, T017은 서로 다른 관심사라 [P] 병렬 가능

---

## Parallel Example: User Story 1

```bash
# lib/content/plugins/rehype-plantuml.ts 와 components/article/plantuml-diagram-handler.tsx는
# 서로 다른 파일이므로 함께 착수 가능:
Task: "lib/content/plugins/rehype-plantuml.ts 작성 — plantuml-encoder로 빌드 타임 인코딩"
Task: "components/article/plantuml-diagram-handler.tsx 작성 — fetch + 실패 판정 + DOM 치환"
```

---

## Implementation Strategy

### MVP First (User Story 1만)

1. Phase 1: Setup 완료
2. Phase 2: Foundational 완료(CRITICAL — 모든 스토리를 블로킹)
3. Phase 3: User Story 1 완료
4. **STOP and VALIDATE**: quickstart.md 1~3절로 US1 단독 검증(체크포인트 T011)
5. 필요하면 여기서 배포 — "Mermaid와 동등한 열람 경험"이라는 핵심 가치는 US1만으로 이미 달성됨

### Incremental Delivery

1. Setup + Foundational → US1(MVP, 체크포인트 T011 통과) → US2(체크포인트 T013 통과) →
   US3(체크포인트 T015 통과) → Polish(체크포인트 T018)
2. 각 체크포인트는 이전 Phase의 3단계 검증(로컬 dev 기동 → build → playwright-cli)을 통과해야
   다음 Phase로 넘어간다 — 실패한 채로 이월하지 않는다.
