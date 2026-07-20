---

description: "Task list template for feature implementation"
---

# Tasks: 헤더 Nav Dark/Light 토글 버튼 추가

**Input**: Design documents from `/specs/002-header-theme-toggle/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/theme-toggle-component.md, quickstart.md

**Tests**: spec에서 명시적으로 요청되지 않았고, 이 프로젝트에는 별도 자동화 테스트 러너가 구성되어 있지 않다. 검증은 constitution Principle I에 따라 `npm run build` + `playwright-cli`/`playwright` MCP 스크린샷으로 수동으로 진행하며, `quickstart.md`의 번호가 매겨진 시나리오를 사용한다.

**Organization**: `spec.md`의 User Story(US1/US2/US3)별로 태스크를 묶어, 각 story를 독립적으로 구현·검증할 수 있게 한다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능 (다른 파일, 의존성 없음)
- **[Story]**: 이 태스크가 속한 user story (US1, US2, US3)
- 설명에는 정확한 파일 경로를 포함한다

## Path Conventions

리포지토리 루트의 단일 Next.js 프로젝트(`plan.md`의 Project Structure 참조): `app/`, `components/`. `frontend/`/`backend/` 분리 없음.

---

## Phase 1: Setup

**Purpose**: React/Next.js 코드를 작성하기 전에 반드시 통과해야 하는 사전 게이트를 만족시킨다

- [X] T001 `vercel-react-best-practices` 스킬을 호출하고
      `.agents/skills/vercel-react-best-practices/rules/`의 규칙 파일을 읽는다 — Phase 2 이후의
      컴포넌트를 작성하기 전 필수 (constitution Principle III, NON-NEGOTIABLE)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 user story가 의존하는 테마 상태 배관(plumbing)

**⚠️ CRITICAL**: 이 phase가 끝나기 전엔 어떤 user story도 시작할 수 없음

- [X] T002 `components/theme/theme-context.tsx`에 `ThemeProvider`/`useTheme` 클라이언트 컨텍스트를
      만든다: `document.documentElement.classList.contains("dark")`를 읽어 상태를 초기화하고
      (`research.md`의 Decision 절에 따라 SSR 가드 포함), `document.documentElement`의 `dark`
      클래스를 뒤집고 새 값을 `localStorage["revi-blog-theme"]`에 쓰는 `toggleTheme()`을
      노출한다 (`components/theme/theme-script.tsx`에 이미 예약된 것과 동일한 키)
- [X] T003 `app/layout.tsx`에서 T002의 새 `<ThemeProvider>`로 `{children}`을 감싼다

**Checkpoint**: 기반이 준비됨 — user story 구현을 시작할 수 있음

---

## Phase 3: User Story 1 - 버튼 클릭으로 테마 전환 (Priority: P1) 🎯 MVP

**Goal**: 헤더 토글을 클릭하면 페이지 리로드 없이 dark ↔ light가 즉시 전환되고, 모든 UI 요소
(nav, 카드, 코드 블록, TOC, 메트릭 카드, 푸터)가 반응한다.

**Independent Test**: 어느 페이지에서든 토글 버튼을 클릭해, US2의 정확한 레퍼런스 스타일이나
US3의 영속화 동작 없이도 모든 색상이 네트워크 요청 0건으로 즉시 바뀌는지 확인할 수 있다.

### Implementation for User Story 1

- [X] T004 [P] [US1] `components/theme/theme-toggle.tsx`에 `ThemeToggle` 컴포넌트를 만든다:
      클릭 시 `useTheme().toggleTheme()`을 호출하는 `<button type="button">`이며, 현재 테마에
      따라 `research.md`에 정리된 `light_mode`/`dark_mode` Material Symbols path 데이터를
      바꿔가며 렌더링하는 인라인 SVG 아이콘(`viewBox="0 -960 960 960"`, `fill="currentColor"`)을
      포함한다 (T002에 의존)
- [X] T005 [US1] `components/layout/nav-bar.tsx`의 nav 우측 버튼 그룹 안, 기존 `LOGIN` 버튼
      바로 오른쪽에 `<ThemeToggle />`을 삽입한다 (T004에 의존)
- [X] T006 [US1] 수동 검증: 홈 화면과 아티클 상세 화면 양쪽에서 `quickstart.md` 시나리오 1
      ("리로드 없이 토글로 테마 전환")과 6("모든 UI 요소가 토글에 반응")을 실행한다

**Checkpoint**: User Story 1이 완전히 동작하며 독립적으로 검증 가능함 — 토글을 클릭하면 리로드
없이 사이트 전체 테마가 전환된다.

---

## Phase 4: User Story 2 - 레퍼런스 사이트와 완벽히 동일한 토글 디자인 (Priority: P1)

**Goal**: `LOGIN` → `|` → 토글 영역이 me.revi1337.com 헤더와 시각적으로 구분 불가능하다 — 같은
구분선, 같은 아이콘 SVG, 같은 크기, 같은 호버/클릭 효과.

**Independent Test**: 재구성된 `LOGIN | toggle` 영역을 me.revi1337.com의 것과 나란히
스크린샷으로 비교해, US3의 영속화 여부와 무관하게 아이콘 모양/크기, 구분선 스타일/간격, 호버
상태, 클릭 전환이 구분 불가능한지 확인한다.

### Implementation for User Story 2

- [X] T007 [US2] `components/layout/nav-bar.tsx`의 `LOGIN`과 `<ThemeToggle />` 사이에 레퍼런스
      마크업과 정확히 동일한 `|` 구분선을 추가한다:
      `<span className="text-outline-variant select-none text-code-sm">|</span>` (T005에 의존)
- [X] T008 [P] [US2] `components/theme/theme-toggle.tsx`의 `ThemeToggle` 크기와 호버 클래스를
      레퍼런스와 정확히 맞춘다 (32×32px 클릭 영역: `w-8 h-8`, `rounded`,
      `text-on-surface-variant`, `hover:text-primary hover:bg-surface-container-highest/50`,
      `transition-colors`; 18×18px 아이콘: `w-[18px] h-[18px]`), `aria-label`을
      `"라이트 모드로 전환"`(dark일 때 → light 제안) / `"다크 모드로 전환"`(light일 때 → dark
      제안)으로 설정한다 (T004에 의존)
- [X] T009 [US2] 수동 검증: `quickstart.md` 시나리오 2를 실행한다(`playwright-cli`/`playwright`
      MCP 스크린샷으로 `https://me.revi1337.com`과 나란히 비교), 홈과 아티클 상세 페이지에서
      토글이 동일하게 렌더링되는지 확인한다 (FR-012)

**Checkpoint**: User Story 1과 2가 모두 동작함 — 기능하는 토글에 레퍼런스와 픽셀 단위로 일치하는
스타일과 구분선까지 갖춤.

---

## Phase 5: User Story 3 - 테마 선택 기억 (Priority: P2)

**Goal**: 선택한 테마가 하드 리프레시와 페이지 이동에도 유지되고, 첫 방문 시에는 OS 선호도 또는
dark로 폴백한다.

**Independent Test**: light로 전환한 뒤 하드 리프레시해서, US2의 정확한 시각적 완성도와
무관하게 페이지가 깜빡임 없이 바로 light로 로드되는지 확인한다.

### Implementation for User Story 3

- [X] T010 [US3] `ThemeProvider`(T002)와 `components/theme/theme-script.tsx`의 기존 블로킹
      스크립트가 `revi-blog-theme` localStorage 키와 `dark` 클래스 방식에 대해 서로 일치하는지
      확인한다; 불일치가 발견되면 하드 리프레시 시 첫 페인트 전에 마지막으로 기록된 값이
      재적용되도록 `components/theme/theme-context.tsx`를 조정한다
- [X] T011 [US3] 수동 검증: `quickstart.md` 시나리오 3(하드 리프레시 시 유지), 4(페이지 이동 간
      유지), 5(최초 방문 시 기본값), 7(빠른 클릭 시 정확성)을 실행한다

**Checkpoint**: 세 user story 모두 독립적으로 동작함 — 토글이 작동하고, 레퍼런스와 픽셀 단위로
일치하며, 하드 리프레시/페이지 이동에도 유지됨.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 기능을 완료로 표시하기 전 constitution이 요구하는 최종 게이트

- [X] T012 [P] `npm run build`를 실행하고 에러가 있으면 수정한다 (constitution Principle I)
- [X] T013 T001에서 읽은 `vercel-react-best-practices` 규칙에 따라
      `components/theme/theme-context.tsx`와 `components/theme/theme-toggle.tsx`를 감사한다;
      위반이 발견되면 단순히 기록만 하지 말고 수정한다 (constitution Principle III,
      NON-NEGOTIABLE)
- [X] T014 `playwright-cli`로 실제 브라우저에서 `quickstart.md` 전체 검증(7개 시나리오 전부)을
      끝까지 실행하고, 빌드나 브라우저 검증에서 드러난 오류가 하나도 남지 않았는지 확인한다
      (constitution Principle I)
- [X] T015 `commit` 스킬의 컨벤션(한국어 subject/body, `-` bullet, footer 없음)에 따라 변경을
      커밋한다

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 의존성 없음 — 바로 시작 가능
- **Foundational (Phase 2)**: Phase 1에 의존 (`theme-context.tsx`를 작성하기 전에 스킬 규칙을
  먼저 읽어야 함) — 모든 user story를 막는다(BLOCKS)
- **User Story 1 (Phase 3)**: Foundational에 의존 — MVP를 전달한다
- **User Story 2 (Phase 4)**: User Story 1에 의존 (T004/T005가 만든 것과 같은
  `ThemeToggle`/`NavBar` 파일을 수정) — US1의 파일과 완전히 독립적이진 않지만, 자신의 태스크가
  끝나면 독립적으로 *검증*할 수 있다
- **User Story 3 (Phase 5)**: Foundational(T002)과 User Story 1(T004)이 갖춰져 있어야 함; US2의
  시각적 완성도와는 무관함
- **Polish (Phase 6)**: 세 user story가 모두 완료된 뒤에 진행

### Within Each User Story

- 그 상태를 소비하는 컴포넌트보다 Foundational 컨텍스트가 먼저
- `NavBar`에 연결하기 전에 컴포넌트 생성이 먼저
- 수동 검증 태스크보다 구현이 먼저

### Parallel Opportunities

- T004(`ThemeToggle` 생성)는 T003(레이아웃 감싸기)과 병렬 실행 가능 — 둘 다 T002에만 의존하고
  서로 다른 파일을 건드림
- T008(`ThemeToggle` 스타일 맞추기)은 T007(`NavBar`에 구분선 추가)과 병렬 실행 가능 — 다른 파일
- T012(빌드)는 T013(best-practices 감사)과 병렬 실행 가능 — 서로 독립적인 점검

---

## Parallel Example: Phase 2 → Phase 3 handoff

```bash
# T002(ThemeProvider)가 완료된 뒤, 아래 둘은 함께 진행할 수 있다:
Task: "app/layout.tsx에서 {children}을 <ThemeProvider>로 감싼다 (T003)"
Task: "components/theme/theme-toggle.tsx에 ThemeToggle 컴포넌트를 만든다 (T004)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 Setup 완료 (T001)
2. Phase 2 Foundational 완료 (T002-T003)
3. Phase 3 User Story 1 완료 (T004-T006)
4. **STOP and VALIDATE**: quickstart 시나리오 1, 6 실행
5. 레퍼런스와 픽셀 단위로 일치하기 전에도 토글은 이미 기능한다

### Incremental Delivery

1. Setup + Foundational → 테마 상태 배관 준비 완료
2. User Story 1 → 기능하는 토글 → 검증 → MVP
3. User Story 2 → 구분선 포함 me.revi1337.com과 픽셀 단위 동일 → 검증
4. User Story 3 → 하드 리프레시/페이지 이동에도 유지 → 검증
5. Polish → 빌드, best-practices 감사, quickstart 전체 실행, 커밋

---

## Notes

- [P] 태스크는 서로 다른 파일을 건드리며 해소되지 않은 의존성이 없다
- 작은 단일 화면 UI 기능이라, 대부분의 태스크가 같은 두세 개 파일(`theme-context.tsx`,
  `theme-toggle.tsx`, `nav-bar.tsx`)을 순차적으로 수정하는 형태일 수밖에 없다
- 자동화 테스트는 요청되지 않았으므로, 각 user story는 그 대신 특정 `quickstart.md` 시나리오에
  묶인 수동 검증 태스크를 갖는다
- 빌드 + best-practices 감사 + quickstart 전체 통과 후, Phase 6(T015)에서만 커밋한다
