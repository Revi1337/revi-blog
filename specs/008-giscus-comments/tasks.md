---

description: "Task list template for feature implementation"
---

# Tasks: Giscus 게시글 댓글

**Input**: Design documents from `/specs/008-giscus-comments/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/giscus-embed-contract.md, quickstart.md

**Tests**: 이 프로젝트에는 자동화 테스트 스위트가 없다. 대신 AGENTS.md의 Testing 섹션과 Constitution Principle I(Feature-Level Verification, NON-NEGOTIABLE)에 따라 `npm run build` + 실제 브라우저 구동 검증이 **필수 게이트**다. 아래 T009는 선택 사항이 아니며 생략할 수 없다 — 통과 없이는 이 기능을 완료로 간주하지 않는다.

**Organization**: Tasks are grouped by user story (spec.md 기준 P1/P2/P3) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

기존 단일 Next.js 앱 구조를 그대로 따른다 (plan.md Project Structure 참조): `app/`, `components/`, `core/`가 저장소 루트에 위치.

---

## Phase 1: Setup

**Purpose**: 댓글 위젯 구현에 필요한 의존성 설치

- [X] T001 `npm install @giscus/react`를 실행해 `package.json`/`package-lock.json`에 의존성을 추가한다

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 User Story가 공유하는 댓글 위젯 컴포넌트 자체를 만든다 — 이 컴포넌트가 없으면 어떤 User Story도 검증할 수 없다

**⚠️ CRITICAL**: 이 Phase가 끝나기 전에는 어떤 User Story 작업도 시작하지 않는다

- [X] T002 [P] `.claude/skills/vercel-react-best-practices/rules/bundle-dynamic-imports.md`와 `.claude/skills/vercel-react-best-practices/rules/rerender-derived-state.md`를 실제로 열어서 확인한다 — 이번 컴포넌트에 바로 적용할 두 규칙이므로 일반 지식으로 대체하지 않는다 (Constitution Principle III)
- [X] T003 `components/article/article-comments.tsx`를 신규 생성한다: `"use client"` 컴포넌트로, `components/theme/theme-context.tsx`의 `useTheme()`을 호출해 `isDark`를 읽고, `components/article/toc-sidebar.tsx`의 헤딩 패턴(lucide-react 아이콘 + `font-label-caps text-xs tracking-widest`)과 `components/article/article-nav.tsx`의 `border-outline-variant/20` 상단 구분선을 참고해 "Comments" 섹션 헤더를 그린 뒤, `@giscus/react`의 `<Giscus>`를 `specs/008-giscus-comments/contracts/giscus-embed-contract.md`에 정의된 고정 props(`repo`, `repoId`, `category`, `categoryId`, `mapping="pathname"`, `strict="0"`, `reactionsEnabled="1"`, `emitMetadata="0"`, `inputPosition="bottom"`, `lang="ko"`, `loading="lazy"`)와 함께 렌더링한다. `theme={isDark ? "dark" : "light"}`는 별도 `useEffect` 없이 렌더 중 파생값으로 바로 전달한다 (rerender-derived-state)

**Checkpoint**: `article-comments.tsx`가 독립적으로 존재하며 컴파일된다 — 이제 User Story 작업을 시작할 수 있다

---

## Phase 3: User Story 1 - 로그인 없이 댓글 읽기 (Priority: P1) 🎯 MVP

**Goal**: 방문자는 GitHub 계정이 없어도 게시글 하단에서 기존 댓글과 반응을 읽을 수 있다

**Independent Test**: 로그인하지 않은 브라우저 세션으로 댓글이 하나 이상 달린 게시글에 접속해, 페이지 하단에서 기존 댓글 목록과 반응이 표시되는지 확인한다

### Implementation for User Story 1

- [X] T004 [US1] `app/article/[slug]/page.tsx`에서 `ArticleComments`를 `next/dynamic`으로 `{ ssr: false }` 옵션과 함께 동적 임포트하고, `<ArticleNav prev={article.prev} next={article.next} />` 바로 다음, `<article>` 요소 안쪽 최하단에 렌더링한다 (bundle-dynamic-imports)

**Checkpoint**: User Story 1이 독립적으로 완전히 동작한다 — 로그인 없이 댓글/반응을 읽을 수 있다 (MVP 완료)

---

## Phase 4: User Story 2 - GitHub 계정으로 댓글 작성 (Priority: P2)

**Goal**: GitHub 계정을 가진 사용자가 게시글 하단에서 로그인 후 댓글을 작성할 수 있다

**Independent Test**: GitHub 계정으로 로그인한 브라우저 세션으로 게시글에 접속해, 댓글을 작성하고 목록에 반영되는지 확인한다

### Implementation for User Story 2

- [X] T005 [US2] 검증 전용 태스크(구현 변경 없음): T003에서 설정한 `inputPosition="bottom"`, `reactionsEnabled="1"`이 spec.md User Story 2의 "로그인 유도 → 댓글 작성 → 새로고침 없이 목록 반영" 흐름을 giscus 기본 동작만으로 충족하는지 확인한다. 부족하면 `components/article/article-comments.tsx`의 props를 조정한다

**Checkpoint**: User Story 1과 2가 함께 독립적으로 동작한다 — 읽기와 쓰기 모두 확인됨

---

## Phase 5: User Story 3 - 사이트 테마와 댓글 위젯 테마 동기화 (Priority: P3)

**Goal**: 사용자가 사이트 테마 토글을 누르면 이미 로드된 댓글 위젯의 테마도 재마운트 없이 즉시 전환된다

**Independent Test**: 댓글 위젯이 로드된 상태에서 사이트 테마 토글을 클릭해, 페이지 새로고침 없이 댓글 위젯의 배경/텍스트 색상이 사이트 테마와 일치하게 바뀌는지 확인한다

### Implementation for User Story 3

- [X] T006 [US3] 검증 전용 태스크(구현 변경 없음): T003에서 `theme` prop이 `useTheme()`의 `isDark`로부터 별도 `useEffect` 없이 파생 전달되고 있는지 재확인한다. `@giscus/react`가 prop 변경만으로 iframe에 postMessage 동기화를 반영하지 못하는 경우에만 `components/article/article-comments.tsx`를 수정한다 — `key`를 바꿔 강제 재마운트하는 방식은 rerender-derived-state 위반이므로 사용하지 않는다

**Checkpoint**: 3개 User Story 모두 독립적으로 동작한다

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 다크/라이트 목업 반영, best-practices 재감사, 그리고 필수 브라우저 검증

- [X] T007 `core/article-detail-dark.html`과 `core/article-detail-light.html`을 **같은 변경 안에서 함께** 수정한다: Post Navigation 블록 바로 다음, `</article>` 닫히기 전에 "Comments" 섹션 자리표시자(T003과 동일한 헤더 구조 + 위젯 컨테이너)를 추가한다. dark 파일은 `border-outline-variant/20` + `-container` 계열 hover 톤을, light 파일은 투명도 없는 `border-outline-variant` + `primary` 톤을 기존 파일 컨벤션 그대로 사용한다 (Constitution Principle II — 한쪽만 갱신된 상태로 두지 않는다)
- [X] T008 `components/article/article-comments.tsx`와 `app/article/[slug]/page.tsx`를 `.claude/skills/vercel-react-best-practices/rules/bundle-dynamic-imports.md`, `.claude/skills/vercel-react-best-practices/rules/rerender-derived-state.md` 기준으로 재감사하고, 위반이 발견되면 지적만 하지 않고 실제로 수정한다 (Constitution Principle III)
- [X] T009 **[필수, 스킵 불가]** AGENTS.md Testing 섹션 규칙에 따라 `npm run build`를 실행한 뒤, 실제 브라우저에서 앱을 구동해 검증한다 — `claude-in-chrome` MCP 도구를 우선 사용하고, 사용 불가능할 때만 `playwright-cli` 스킬로 폴백한다. 픽셀 단위 시각 검증(렌더링된 화면을 눈으로 확인해야 하는 경우)이 필요하면 `playwright` MCP 서버의 스크린샷 도구를 사용한다. `specs/008-giscus-comments/quickstart.md`에 정리된 5개 시나리오(댓글 섹션 노출, 지연 로딩, 로그인 없이 읽기, 테마 동기화, 다크/라이트 목업 대조)를 **모두** 실행한다. 이 중 에러나 시각적 불일치가 하나라도 발견되면, 기능을 완료로 간주하기 전에 반드시 수정한다 (Constitution Principle I, NON-NEGOTIABLE)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 의존성 없음 — 바로 시작 가능
- **Foundational (Phase 2)**: Setup 완료 후 시작 — 모든 User Story를 BLOCK한다
- **User Stories (Phase 3~5)**: 모두 Foundational 완료를 전제로 하며, 우선순위 순서(P1 → P2 → P3)로 순차 진행을 권장한다 (US2/US3는 US1이 만든 컴포넌트를 검증하는 성격이 강해 병렬보다 순차가 자연스럽다)
- **Polish (Phase 6)**: 원하는 User Story가 모두 끝난 뒤 진행. T009(필수 테스트)는 T007(목업)까지 끝난 뒤 실행해야 quickstart.md의 5개 시나리오를 전부 검증할 수 있다

### Within Each User Story

- US1은 신규 코드(T004)가 필요하지만, US2/US3는 T003에서 이미 구현된 것을 검증만 한다 — giscus 위젯 하나가 읽기/쓰기/테마를 모두 내장하고 있기 때문
- Story 완료 후 다음 우선순위로 이동

---

## Parallel Example: Setup + Foundational

```bash
# T001과 T002는 서로 다른 파일(package.json vs 스킬 문서)이며 서로 의존하지 않으므로 병렬 가능:
Task: "npm install @giscus/react 실행"
Task: "vercel-react-best-practices의 bundle-dynamic-imports, rerender-derived-state 규칙 문서 검토"

# T003은 T002(규칙 검토)가 끝난 뒤 시작 — 병렬 아님
```

---

## Implementation Strategy

### MVP First (User Story 1까지만)

1. Phase 1: Setup 완료
2. Phase 2: Foundational 완료 (CRITICAL — 모든 Story를 막는다)
3. Phase 3: User Story 1 완료
4. **STOP and VALIDATE**: 로그인하지 않은 세션으로 댓글 읽기 확인
5. 필요하면 여기서 데모/배포 가능 (MVP)

### Incremental Delivery

1. Setup + Foundational 완료 → 기반 준비 완료
2. User Story 1 추가 → 독립 테스트 → MVP 데모 가능
3. User Story 2 추가 → 독립 테스트 (giscus 기본 동작 검증)
4. User Story 3 추가 → 독립 테스트 (테마 동기화 검증)
5. Phase 6: 목업 반영 + best-practices 재감사 + **필수** 브라우저 검증(T009)까지 마쳐야 기능이 완료된 것으로 간주한다

---

## Notes

- [P] tasks = 서로 다른 파일, 의존성 없음
- [Story] 라벨은 각 태스크가 어떤 User Story에 속하는지 추적성을 위해 표시한다
- T005, T006은 "검증 전용" 태스크다 — giscus 위젯 하나가 읽기/쓰기/테마 전환을 모두 내장하므로, T003 이후 별도 구현 없이 동작을 확인만 하면 된다. 확인 중 문제가 발견되면 그때 코드를 수정한다
- T009(필수 테스트)는 절대 생략하지 않는다 — AGENTS.md Testing 섹션과 Constitution Principle I이 이를 게이트로 못박고 있다
