# Tasks: Mermaid 다이어그램 렌더링

**Input**: Design documents from `/specs/012-mermaid-diagram-rendering/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md,
contracts/mermaid-rendering-contract.md, quickstart.md

**Tests**: 이 저장소는 자동화 테스트 스위트가 없다(constitution.md Principle I). 검증은 각 Phase
마지막에 고정된 3단계 체크포인트로 대체한다 — 별도 테스트 태스크는 생성하지 않는다.

1. `npm run dev`로 로컬 기본 모드(인메모리 Redis fallback, `KV_REST_API_URL` 미설정 상태 유지) 기동
2. `npm run build`로 빌드/타입 에러 확인
3. `playwright-cli` 스킬로 브라우저 구동 검증(우선), 픽셀 단위 시각 확인이 필요할 때만 `playwright`
   MCP 스크린샷 도구로 전환. `claude-in-chrome` 등 다른 수단은 쓰지 않는다.

세 단계 중 하나라도 실패하면 다음 Phase로 넘어가기 전에 같은 Phase 안에서 원인을 고치고 체크포인트를
다시 통과해야 한다.

**Organization**: spec.md의 User Story 3개(P1~P3)별로 태스크를 그룹화했다. Foundational 단계에서
Mermaid 코드블록(정상 + 의도적 오류 1개)을 포함한 검증용 아티클을 먼저 만들어, 이후 모든 Phase의
체크포인트가 처음부터 실제 콘텐츠를 대상으로 즉시 브라우저 검증 가능하게 한다(quickstart.md와 동일
스캐폴드).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능(다른 파일, 미완료 태스크에 의존하지 않음)
- **[Story]**: 이 태스크가 속한 User Story (US1~US3)
- 모든 태스크에 정확한 파일 경로 포함

## Path Conventions

단일 Next.js 프로젝트. 모든 경로는 저장소 루트 기준.

---

## Phase 1: Setup

**Purpose**: 신규 의존성 설치

- [X] T001 `package.json`의 `dependencies`에 `mermaid`(^11.16.1), `svg-pan-zoom`(^3.6.2)를
      알파벳 순서로 추가하고 `npm install` 실행. 둘 다 자체 TypeScript 타입을 내장하므로
      `@types/*` 패키지는 추가하지 않는다(research.md).
- [X] T002 Checkpoint: `npm run dev`(로컬 기본 모드) 정상 기동 + `npm run build` 성공 확인.
      의존성만 추가된 상태라 신규 화면 변화가 없으므로 `playwright-cli`로는 홈페이지(`/`)가 기존과
      동일하게 200으로 로드되고 콘솔 에러가 없는지만 확인한다.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 User Story가 공유하는 검증용 콘텐츠 스캐폴드를 먼저 준비한다 — Mermaid 코드블록이
포함된 실제 아티클이 없으면 이후 어떤 Phase의 체크포인트도 브라우저에서 검증할 대상이 없다.

**⚠️ CRITICAL**: 이 단계 완료 전에는 어떤 User Story 구현도 시작하지 않는다

- [X] T003 `content/articles/_mermaid-preview.md`를 생성한다. frontmatter는 `title`, `date`,
      `tags`, `showOnHomepage: false`를 채운다. 본문에는 (a) "정상 다이어그램" 섹션에 유효한
      ```mermaid flowchart 코드블록 하나, (b) "문법 오류가 있는 다이어그램" 섹션에 의도적으로
      깨진 ```mermaid 코드블록 하나를 포함한다(quickstart.md 1절과 동일 내용).
- [X] T004 Checkpoint: `content/articles/**` 변경이므로 이미 떠 있는 `next dev`를 반드시
      재시작한 뒤(AGENTS.md), `npm run dev`(로컬 기본 모드) + `npm run build`로 새 아티클이
      정상적으로 목록/빌드에 포함되는지 확인. `playwright-cli`로 `/article/_mermaid-preview`에
      접속해 — 아직 렌더링 구현 전이므로 — 두 ```mermaid 블록이 모두 기존과 동일하게 문법
      강조된 코드 블록으로만 보이는지(회귀 없음의 baseline) 확인한다.

**Checkpoint**: 스캐폴드 준비 완료 — User Story 구현 시작 가능

---

## Phase 3: User Story 1 - 독자가 다이어그램을 그림으로 바로 본다 (Priority: P1) 🎯 MVP

**Goal**: ```mermaid 코드펜스가 문법 강조된 텍스트가 아니라 실제 다이어그램으로 렌더링되고, 문법
오류가 있어도 페이지가 깨지지 않으며, 다크/라이트 전환에도 반응한다.

**Independent Test**: `_mermaid-preview.md`의 "정상 다이어그램" 섹션이 그림으로 보이고,
"문법 오류가 있는 다이어그램" 섹션은 원본 코드가 그대로 노출되는지 확인하는 것만으로 완결 검증 가능.

### Implementation for User Story 1

- [X] T005 [P] [US1] `components/article/mermaid-diagram-handler.tsx` 작성 — `"use client"`,
      마운트 시 `document.querySelectorAll('pre[data-language="mermaid"]')` 탐색(빈 경우 즉시
      종료), 대상이 있을 때만 `mermaid` 동적 import, 블록별로 개별 try/catch로 격리된
      `mermaid.render()` 호출(contracts/mermaid-rendering-contract.md #1~2). 성공 시
      `figure[data-rehype-pretty-code-figure]` 안 `pre` 앞에 SVG 컨테이너
      (`data-mermaid-diagram`)를 삽입하고 `pre`는 `display:none` 처리(삭제 금지). 실패 시 `pre`를
      그대로 노출.
- [X] T006 [US1] `app/article/[slug]/page.tsx`에 `<MermaidDiagramHandler />`를
      `<CodeCopyHandler />`/`<ImageLightboxHandler />`와 나란히 마운트.
- [X] T007 [US1] `mermaid-diagram-handler.tsx`에 `components/theme/theme-context.tsx`의
      `useTheme().isDark` 반영 — `mermaid.initialize({ theme: isDark ? "dark" : "default" })` 후
      `renderState === "rendered"`인 블록만 재렌더링(`error` 블록은 재시도 안 함,
      contracts/mermaid-rendering-contract.md #3, data-model.md). T005와 한 파일이라 T005 작성
      시점에 함께 구현됨(`pre.dataset.mermaidError`로 오류 블록만 재시도 제외).
- [X] T008 [US1] 다이어그램 SVG 컨테이너(`[data-mermaid-diagram]`)의 스타일 추가 — 실제 조사 결과
      `.article-body` 스타일은 `app/globals.css`가 아니라 별도 파일 `app/article-body.css`에
      있어 plan.md 기재 경로를 여기로 정정, 그 파일에 추가. `[data-rehype-pretty-code-figure]`
      기존 코드 블록과 같은 레이아웃 관례를 따름(색상은 mermaid가 SVG에 직접 구움).
- [X] T009 [US1] Checkpoint: `npm run dev`(로컬 기본 모드) + `npm run build` 후 `playwright-cli`로
      quickstart.md 2~3절 수행 — 정상 다이어그램이 그림으로 보이는지, 다크/라이트 전환 시
      재렌더링되는지, 오류 다이어그램은 원본 코드로 폴백되고 확대 버튼이 없는지(아직 US2 미구현이라
      당연히 없음), 콘솔 에러가 없는지 확인.
      **후속 수정(사용자 발견)**: 엣지 라벨("Yes"/"No")이 반투명 검은/회색 박스로 하이라이트된
      것처럼 보이는 문제 발견. mermaid 기본 테마가 `.edgeLabel`과 `.labelBkg` 두 클래스에 각각
      배경색을 굽는데, `mermaid.initialize({ themeVariables: { edgeLabelBackground } })`는
      `.edgeLabel`만 제어하고 `.labelBkg`는 테마 변수와 무관하게 항상 `rgba(0,0,0,0.5)`로 고정됨을
      확인. `themeVariables.edgeLabelBackground: "transparent"` 추가(mermaid-diagram-handler.tsx)
      + `.labelBkg`를 `!important`로 투명 처리하는 CSS(article-body.css, mermaid의 ID 스코프
      embedded style보다 명시도가 낮아 `!important` 필요) 두 가지를 함께 적용해 다크/라이트 양쪽에서
      실제로 사라짐을 재확인.

**Checkpoint**: User Story 1이 독립적으로 완결되어 배포 가능(MVP)

---

## Phase 4: User Story 2 - 독자가 다이어그램을 확대해서 자세히 본다 (Priority: P2)

**Goal**: 렌더링된 다이어그램의 확대 버튼을 누르면 상하좌우 이동/리셋/확대·축소가 가능한 확대 보기
창이 뜬다.

**Independent Test**: 확대 버튼 클릭 → 모달 오픈 → 6개 버튼(상/하/좌/우/리셋/±) 각각의 동작을
확인하는 것으로 완결 검증 가능.

### Implementation for User Story 2

- [X] T010 [P] [US2] `lib/mermaid/open-mermaid-lightbox.ts` 작성 — `open-image-lightbox.ts`와
      동일한 레벨의 open 함수. 호출 시점에 `svg-pan-zoom` 동적 import, 대상 SVG에 인스턴스
      초기화, 모달 닫힘 시 `instance.destroy()`(contracts/mermaid-rendering-contract.md #4).
- [X] T011 [P] [US2] `components/mermaid/mermaid-lightbox-modal.tsx` 작성 — 배경
      스크림/열림·닫힘 애니메이션/ESC 닫기/배경 클릭 닫기(기존 이미지 라이트박스와 시각적으로
      맞춤, PhotoSwipe 내부 재사용 없음, research.md 결정), 상/하/좌/우 화살표·리셋·돋보기 +/-
      6개 버튼 UI.
- [X] T012 [US2] `mermaid-lightbox-modal.tsx`의 6개 버튼을 `open-mermaid-lightbox.ts`가 반환한
      인스턴스의 API에 매핑 — 상하좌우→`panBy()`, 리셋→`reset()`(pan/zoom 동시 초기화, 개별
      초기화 로직 금지), 돋보기 +/−→`zoomIn()`/`zoomOut()`(contracts/mermaid-rendering-contract.md
      표). T011 작성 시점에 한 파일 안에서 함께 구현됨.
- [X] T013 [US2] `mermaid-diagram-handler.tsx`(T005)에 확대 버튼을 렌더링 성공한 블록에만 삽입하고
      클릭 시 svg를 상태로 올려 `mermaid-lightbox-modal.tsx`를 여는 이벤트 위임 연결.
      (depends: T005, T010)
- [X] T014 [US2] 확대 보기 모달의 스타일 추가 — T008과 동일한 사유로 `app/article-body.css`에
      추가(plan.md 기재 경로 정정).
- [X] T015 [US2] Checkpoint: `npm run dev`(로컬 기본 모드) + `npm run build` 후 `playwright-cli`로
      quickstart.md 5절 수행 — 모달 오픈, 상/하/좌/우 이동, 돋보기 +/−, 리셋으로 최초 상태 복귀,
      ESC/배경 클릭 닫기까지 전부 확인.

**Checkpoint**: User Story 1 + 2가 각각 독립적으로 동작

---

## Phase 5: User Story 3 - 독자가 다이어그램의 원본 코드를 복사한다 (Priority: P3)

**Goal**: 렌더링된 다이어그램의 복사 버튼을 누르면 원본 Mermaid 코드가 클립보드에 복사된다.

**Independent Test**: 복사 버튼 클릭 후 클립보드 내용이 원본 소스와 정확히 일치하는지 확인.

### Implementation for User Story 3

- [X] T016 [US3] 신규 구현 없음 — `rehype-code-copy-button.ts`/`CodeCopyHandler`가 언어 무관하게
      모든 `figure[data-rehype-pretty-code-figure]`에 이미 복사 버튼을 붙이고
      `pre.textContent`를 복사한다(contracts/mermaid-rendering-contract.md #1). T005에서 `pre`를
      삭제하지 않고 `display:none`만 적용하도록 구현했는지 코드 리뷰로 재확인한다(회귀 방지
      점검, 코드 변경 없음).
- [X] T017 [US3] Checkpoint: `npm run dev`(로컬 기본 모드) + `npm run build` 후 `playwright-cli`로
      quickstart.md 4절 수행 — 복사 버튼 클릭 후 클립보드 내용이 렌더링된 그림이 아니라 원본
      Mermaid 코드 텍스트와 정확히 일치하는지 확인.

**Checkpoint**: User Story 1~3 모두 독립적으로 동작

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 전체 스토리를 아우르는 마무리 확인

- [X] T018 [P] constitution.md Principle II(vercel-react-best-practices Compliance,
      NON-NEGOTIABLE)에 따라 `.agents/skills/vercel-react-best-practices/rules/`를 실제로 열어,
      신규 client 컴포넌트 3개(`mermaid-diagram-handler.tsx`, `mermaid-lightbox-modal.tsx`,
      `open-mermaid-lightbox.ts`)를 규칙에 대조 감사 — `bundle-conditional`(다이어그램 존재 시에만
      동적 import ✓), `client-event-listeners`(확대 버튼도 document 레벨 위임 리스너 1개 ✓),
      `rerender-dependencies`(`isDark` primitive 의존성 ✓), `rerender-move-effect-to-event`(pan/
      zoom/reset/닫기는 전부 onClick 핸들러, useEffect는 DOM 커밋 후 svg-pan-zoom을 그 DOM에
      동기화하는 정당한 용도 ✓), `rendering-conditional-render`(`!svgMarkup` 명시적 조건, `&&`
      falsy 렌더 위험 없음 ✓). 위반 사항 없음, 수정 불필요.
- [X] T019 [P] `content/articles/**` 기존 아티클(둘 이상, `_mermaid-preview.md` 제외)의 상세
      페이지를 열어 Mermaid 관련 UI가 새로 생기지 않았는지(신규 코드 경로가 no-op인지, SC-006)
      확인. 홈페이지(`/`)에 `_mermaid-preview`가 노출되지 않는지(`showOnHomepage: false`) 확인.
      (`/article/Scope` 확인: `[data-mermaid-diagram]`/확대버튼 0개, 콘솔 에러 0개. 홈 HTML에
      `_mermaid-preview` 문자열 0회)
- [X] T020 Checkpoint: quickstart.md 1~6절은 각 Phase 체크포인트(T004/T009/T015/T017/T019)에서
      이미 순서대로 `npm run dev`(로컬 기본 모드) + `npm run build` + `playwright-cli`로 실제
      실행/확인됨(정상 렌더링, 다크/라이트 재렌더링, 오류 폴백, 클립보드 복사, 확대 모달 6버튼,
      회귀 없음). 추가로 확대 모달의 다이어그램이 왼쪽으로 쏠려 보이던 문제(mermaid가 SVG에 굽는
      `style="max-width"` 인라인 스타일이 모달 캔버스 전체를 못 채우던 원인)를 발견해
      `buildLightboxSvgMarkup`로 수정 후 재확인 완료. 별도 재실행 없이 종합 확인으로 갈음.
- [X] T021 quickstart.md 7절에 따라 `content/articles/_mermaid-preview.md` 삭제 여부를 결정하고
      정리한다. 삭제한다면 `next dev`/`next start` 프로세스를 재시작해 실제로 목록에서 사라졌는지
      확인한다(AGENTS.md). → 삭제 완료, `npm run build` 라우트 목록에서 `/article/_mermaid-preview`
      제거됨을 확인.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 의존성 없음 — 즉시 시작 가능
- **Foundational (Phase 2)**: Setup 완료에 의존 — 모든 User Story를 블로킹
- **User Stories (Phase 3+)**: 전부 Foundational 완료에 의존
  - US1은 다른 스토리에 의존하지 않음(MVP)
  - US2는 렌더링된 SVG/확대 버튼 삽입 지점이 필요해 US1(T005) 완료 후 시작
  - US3는 구현이 사실상 없고(T016) US1(T005)이 `pre`를 보존하도록 구현되었는지 확인만 하므로
    US1 완료 후 아무 때나(US2와 순서 무관) 진행 가능
- **Polish (Phase 6)**: 원하는 User Story가 모두 끝난 뒤 진행

### Within Each User Story

- 구조: 파일 작성([P] 가능한 것부터) → 통합/연결(선행 파일에 의존) → 스타일 → Checkpoint
- 스토리 완료 후 다음 우선순위로 이동

### Parallel Opportunities

- T005는 [P] — Phase 3 안에서 T006~T008과 파일이 겹치지 않아 병렬 착수 가능(단 T006은 T005가
  export하는 컴포넌트 이름에 의존하므로 실질적으로는 T005 완료 후 착수 권장)
- T010, T011은 서로 다른 파일이라 [P] 병렬 가능
- Phase 6의 T018, T019는 서로 다른 관심사라 [P] 병렬 가능

---

## Parallel Example: User Story 2

```bash
# lib/mermaid/open-mermaid-lightbox.ts 와 components/mermaid/mermaid-lightbox-modal.tsx는
# 서로 다른 파일이므로 함께 착수 가능:
Task: "lib/mermaid/open-mermaid-lightbox.ts 작성 — svg-pan-zoom 동적 import/초기화/destroy"
Task: "components/mermaid/mermaid-lightbox-modal.tsx 작성 — 모달 껍데기 UI + 6개 버튼"
```

---

## Implementation Strategy

### MVP First (User Story 1만)

1. Phase 1: Setup 완료
2. Phase 2: Foundational 완료(CRITICAL — 모든 스토리를 블로킹)
3. Phase 3: User Story 1 완료
4. **STOP and VALIDATE**: quickstart.md 2~3절로 US1 단독 검증(체크포인트 T009)
5. 필요하면 여기서 배포 — "GitHub과 동등한 열람 경험"이라는 핵심 가치는 US1만으로 이미 달성됨

### Incremental Delivery

1. Setup + Foundational → US1(MVP, 체크포인트 T009 통과) → US2(체크포인트 T015 통과) →
   US3(체크포인트 T017 통과) → Polish(체크포인트 T020)
2. 각 체크포인트는 이전 Phase의 3단계 검증(로컬 dev 기동 → build → playwright-cli)을 통과해야
   다음 Phase로 넘어간다 — 실패한 채로 이월하지 않는다.
