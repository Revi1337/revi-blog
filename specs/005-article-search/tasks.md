---
description: "Task list for feature 005-article-search"
---

# Tasks: 아티클 통합 검색

**Input**: Design documents from `/specs/005-article-search/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: 자동화 테스트 task는 생성하지 않는다 — 이 프로젝트에는 테스트 러너(vitest/jest/playwright test
runner)가 없고, spec에도 테스트 요구가 없다. Constitution Principle I(Feature-Level Verification)이 요구하는
검증 방식은 "`npm run build` + 실제 브라우저 구동"이며, 이 문서의 모든 검증은 그 방식을 따른다.

**Organization**: Task는 spec.md의 User Story(P1~P4) 기준으로 그룹화되어 있어 각 story를 독립적으로
구현·검증할 수 있다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능(다른 파일, 완료되지 않은 task에 대한 의존성 없음)
- **[Story]**: 이 task가 속한 user story (US1, US2, US3, US4)
- 모든 task 설명은 정확한 파일 경로로 끝나고, 그 뒤에 완료 조건을 명시한다.

## 검증 규칙 (모든 phase 공통)

1. **Task 단위**: 코드를 변경하는 모든 task는 설명 끝에 `완료 조건: npm run build 통과`가 붙어 있다.
   `npm run build`가 에러 없이 끝나야만 그 task를 체크할 수 있다. 이 검증은 별도 task로 분리하지
   않고 각 task 자체의 완료 조건이다. 정적 HTML(`core/*.html`)만 바꾸는 task처럼 빌드에 영향이 없는
   경우는 예외이며, 예외 사유를 task 설명에 명시했다.
2. **Phase 단위**: 각 phase의 **Checkpoint**는 (1) `npm run build` 통과, (2) 실제 브라우저로 해당
   phase의 사용자 시나리오를 구동 검증하는 두 단계를 모두 요구한다. 브라우저 검증 도구는 항상 다음
   우선순위로 선택한다 — **1순위 `claude-in-chrome`**(`mcp__claude-in-chrome__*` 도구) → 그 도구를 쓸 수
   없는 환경일 때만 **2순위 `playwright-cli`** 스킬 → 그마저 불가능할 때만 **3순위 `playwright`**라는
   이름의 MCP 서버 도구. 상위 우선순위 도구가 사용 가능한데 임의로 하위 순위를 쓰지 않는다.
3. **US1·US2 필수 게이트**: User Story 1(제목/본문 텍스트 검색)과 User Story 2(`#태그` 검색)의
   Checkpoint에 있는 검색 동작 확인 항목은 다른 항목이 전부 통과해도 이 항목이 실패하면 해당 phase를
   미완료로 간주하는 **필수 게이트**다 (아래 각 phase의 Checkpoint에 표시).

## Path Conventions

plan.md의 Project Structure를 그대로 따른다 — 단일 Next.js 앱(App Router), 새 코드는
`components/search/`와 `lib/content/` · `lib/data/`에 추가하고, 헤더 nav 변경은 정적 목업
`core/*.html` 4종에도 동일 반영한다.

---

## Phase 1: Setup

**Purpose**: 이번 기능이 새로 필요로 하는 의존성 준비

- [ ] T001 `cmdk`를 의존성으로 추가한다 (`npm install cmdk`) — `package.json`, `package-lock.json`.
      완료 조건: `npm run build` 통과.

**Checkpoint**: `cmdk`가 설치되고 기존 빌드가 깨지지 않음을 확인. 아직 이 패키지를 사용하는 코드가
없어 브라우저 검증 대상이 없다(브라우저 검증은 US1 Checkpoint부터 시작).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 검색 인덱스(데이터 계층) — 텍스트 검색(US1)과 태그 검색(US2) 모두 이 인덱스 없이는 시작할
수 없는 진짜 차단 요소

**⚠️ CRITICAL**: 이 phase가 끝나기 전에는 어떤 User Story 작업도 시작할 수 없다.

- [X] T002 [P] `lib/data/types.ts`의 `Article` 인터페이스에 `plainBody: string`(검색용 순수 텍스트
      본문)과 `showOnHomepage: boolean` 필드를 추가한다. 완료 조건: `npm run build` 통과.
- [X] T003 `lib/content/loader.ts`의 `loadArticleFile`을 확장해 `mdast-util-to-string`(기존 의존성,
      `lib/content/plugins/remark-toc.ts`에서 이미 사용 중인 패턴)으로 `rawBody`에서 `plainBody`를
      추출하고, 계산된 `showOnHomepage`와 함께 반환되는 `Article` 객체에 포함시킨다
      (depends on T002). 완료 조건: `npm run build` 통과.
      구현 노트: 별도 mdast 재파싱 대신 `lib/content/plugins/remark-plain-text.ts`(신규 remark 플러그인)를
      기존 unified 파이프라인(`pipeline.ts`)에 추가해 `remarkToc`와 동일한 단일 패스 방식으로
      `file.data.plainText`를 채우고, `renderMarkdown()`이 이를 `plainBody`로 반환하도록 구현함.
- [X] T004 [P] `lib/content/search-index.ts`를 신규 생성해 `buildSearchIndex(articles: Article[]):
      SearchIndexEntry[]`를 구현한다 — `showOnHomepage === true`인 아티클만 남기고
      `{slug, title, plainBody, tags}`로 매핑한다(FR-017). `showOnHomepage === false`인 아티클의
      데이터는 이 함수를 거치는 순간부터 완전히 제외되어야 한다 (depends on T002, T003). 완료 조건:
      `npm run build` 통과.
- [X] T005 [P] `lib/data/search.ts`를 신규 생성해 `lib/data/articles.ts`와 동일한 패턴(모듈 최상위에서
      1회 계산)으로 `export const searchIndex: SearchIndexEntry[] = buildSearchIndex(articles)`를
      export한다 (depends on T004). 완료 조건: `npm run build` 통과.

**Checkpoint**: `npm run build` 통과. 이 phase는 UI를 만들지 않으므로 브라우저로 확인할 사용자 시나리오가
아직 없다 — `searchIndex`에 `showOnHomepage: false`인 아티클(`_syntax-preview.md`)이 빠져 있는지는
코드 리뷰 또는 임시 로그로 확인하고, 실제 브라우저 검증은 US1 Checkpoint에서 수행한다.

---

## Phase 3: User Story 1 - 제목/본문 텍스트로 아티클 찾기 (Priority: P1) 🎯 MVP

**Goal**: 헤더에 검색 트리거를 노출하고, 클릭 또는 `Ctrl+K`/`Cmd+K`로 모달을 열어 제목/본문 텍스트 검색이
실시간으로 동작하게 한다.

**Independent Test**: 헤더에서 트리거를 클릭해 모달을 열고, 특정 아티클 제목에 포함된 단어를 입력했을 때
결과 최상단에 나타나는지, 본문에만 포함된 단어를 입력했을 때도 결과에 나타나는지 확인한다.

### Implementation for User Story 1

- [X] T006 [P] [US1] `components/search/search-query.ts`를 신규 생성해 `runTextSearch(entries:
      SearchIndexEntry[], rawTerm: string): SearchResult[]`를 구현한다 — 대소문자 무시 substring
      매칭(FR-015), 제목 매치를 본문 매치보다 항상 위로 정렬(FR-011), 태그는 대상에 포함하지 않음
      (FR-009), fuzzy matching·형태소 분석 없음(FR-016). 이 시점에는 `#` 접두사를 특별 취급하지
      않고 항상 텍스트 모드로만 동작한다(태그 모드 분기는 US2에서 추가). 완료 조건: `npm run build` 통과.
- [X] T007 [P] [US1] `components/search/search-trigger.tsx`를 신규 생성한다 — 헤더에 상시 노출되는
      입력창 모양 버튼. 검색 안내 placeholder 문구 + 우측 `Ctrl+K` 단축키 뱃지를 항상 표시하고(FR-001,
      FR-002), 텍스트를 직접 입력받지 않으며 클릭 시 `onOpen` 콜백만 호출한다(FR-003). 완료 조건:
      `npm run build` 통과.
- [X] T008 [P] [US1] `components/search/use-search-shortcut.ts`를 신규 생성한다 — `document`에
      `keydown` 리스너를 등록해 `Ctrl+K`(Win/Linux)·`Cmd+K`(Mac)를 감지하고(FR-004), `event.target`이
      input/textarea/contenteditable이면 무시하며, `useEffect` cleanup으로 리스너를 해제한다
      (vercel-react-best-practices의 `client-event-listeners` 규칙 준수). 완료 조건: `npm run build`
      통과.
- [X] T009 [US1] `components/search/search-results.tsx`를 신규 생성한다 — `SearchResult[]`를 개수
      제한 없이 스크롤 가능한 리스트로 렌더링하고(FR-013), 결과가 0건이면 "No results found."를
      표시하며(FR-014), 각 항목 선택 시 `/article/{slug}`로 이동 후 모달을 닫는다(FR-019)
      (depends on T006 — `SearchResult` 타입 사용). 완료 조건: `npm run build` 통과.
- [X] T010 [US1] `components/search/search-modal.tsx`를 신규 생성한다 — `cmdk`의 `Command.Dialog`를
      `shouldFilter={false}`로 사용하고, 상단 입력창 + 입력이 비어 있을 때의 `#태그명` 힌트(자리표시자,
      문구는 US2에서 확정) + `search-results.tsx` 렌더 + cmdk 기본 제공 방향키·Enter 탐색 + 하단
      `↑↓ 이동 · ↵ 선택 · esc 닫기` 키보드 힌트 푸터(FR-023)로 구성한다. 입력값은 `useDeferredValue`로
      감싸 non-urgent 업데이트로 필터링하고(rerender-use-deferred-value 규칙, SC-002), 그 값으로
      `runTextSearch()`를 호출한다. `Esc` 또는 바깥 영역 클릭으로 닫힌다(FR-022, cmdk 기본 제공)
      (depends on T006, T008, T009). 완료 조건: `npm run build` 통과.
- [X] T011 [US1] `components/layout/nav-bar.tsx`에 `search-trigger.tsx`를 삽입하고,
      `use-search-shortcut.ts`로 모달 열림 상태를 관리하며, `search-modal.tsx`를
      `next/dynamic(() => import(...), { ssr: false })`로 지연 로드해 연결한다(`bundle-dynamic-imports`
      규칙 — 검색을 열지 않는 방문자의 초기 헤더 번들에 `cmdk`가 포함되지 않도록) (depends on T007,
      T010). 완료 조건: `npm run build` 통과.
      구현 노트: 처음 설계와 달리 `search-modal.tsx`(클라이언트 컴포넌트)가 `lib/data/search.ts`를
      직접 import하면 `node:fs`를 쓰는 `lib/content/loader.ts`가 클라이언트 번들에 끌려 들어가
      Turbopack 빌드가 실패했다(`the chunking context does not support external modules: node:fs`).
      research.md #1이 원래 의도한 대로 `app/layout.tsx`(Server Component)에서 `searchIndex`를 계산해
      `NavBar` → `SearchModal`로 props 전달하도록 수정해 해결함. 또한 `next/dynamic` 컴포넌트를 JSX에
      무조건 렌더링하면 `open` prop과 무관하게 즉시 청크가 로드되므로, `hasOpenedSearch` 상태로 첫
      오픈 전까지 `SearchModal` 엘리먼트 자체를 렌더 트리에서 제외해 실제로 지연 로드되게 함. 헤더
      공간 확보를 위해 기능 없는 기존 LOGIN 버튼과 구분선을 `sm:` 미만에서 숨김 처리함(FR-002가 요구하는
      placeholder+Ctrl+K 뱃지 상시 노출을 모바일에서도 지키기 위한 트레이드오프).
- [X] T012 [P] [US1] `core/home-dark.html`, `core/home-light.html`에 검색 트리거 마크업(placeholder
      문구 + `Ctrl+K` 뱃지)을 T007에서 확정한 디자인 그대로 동일 반영한다(Constitution Principle II).
      완료 조건: 정적 HTML이라 빌드에 영향이 없으므로 `npm run build` 예외 — 대신 두 파일을 브라우저로
      열어 다크/라이트 각각 트리거가 보이는지 육안 확인한다.
- [X] T013 [P] [US1] `core/article-detail-dark.html`, `core/article-detail-light.html`에 동일한 검색
      트리거 마크업을 반영한다(Constitution Principle II). 완료 조건: T012와 동일 — 브라우저 육안 확인.

**Checkpoint**: (1) `npm run build` 통과. (2) 브라우저(우선순위: `claude-in-chrome` → `playwright-cli`
→ `playwright` MCP)로 아래를 구동 검증 — **★ FR-008/FR-011 검색 동작은 필수 게이트, 실패 시 이 phase는
미완료로 간주**:
- 헤더에 트리거가 항상 보이고 placeholder + `Ctrl+K` 뱃지가 노출되는지
- 트리거 클릭과 `Ctrl+K`(`Cmd+K`) 둘 다로 모달이 열리는지
- **★ 제목에 포함된 단어로 검색 시 해당 아티클이 결과에 나타나는지**
- **★ 본문에만 포함된 단어로 검색 시 해당 아티클이 나타나되, 같은 단어가 제목에 매치되는 다른 아티클보다
  아래에 위치하는지(FR-011)**
- 결과 클릭 시 아티클 상세로 이동하고 모달이 닫히는지
- 매치 없는 검색어에 "No results found."가 표시되는지
- 방향키(↑/↓) + `Enter`로 결과를 탐색·선택할 수 있는지
- `Esc`와 바깥 영역 클릭으로 모달이 닫히는지
- `core/*.html` 4개 파일을 각각 열어 트리거가 React 버전과 시각적으로 일치하는지

**검증 결과 (claude-in-chrome 사용)**: 위 항목 모두 통과. `#backend` 등 태그 검색은 US2 범위라 여기서는
텍스트 검색만 확인함 — "Kafka"(제목 매치, 최상단), "Shenandoah"(JVM 아티클 본문에만 있는 단어, 본문
매치로 결과에 나타남), "Syntax Preview"(제외 대상 아티클 제목 — 결과 없음, FR-017 확인), 무작위
문자열(No results found.), Enter로 결과 선택 시 `/article/{slug}`로 정상 이동. `core/*.html` 4개 모두
React 버전과 동일하게 트리거 노출.
클릭-오픈(FR-003)과 Esc 닫기(FR-022)는 claude-in-chrome의 좌표 클릭/Escape 키 전달 자체에 오차가 있어
처음에는 반응이 없었으나, `btn.click()`과 `document.dispatchEvent(new KeyboardEvent('keydown', {key:
'Escape', ...}))`로 직접 재현해 앱 로직 자체는 정상 동작함을 별도로 확인함(툴의 좌표/키 전달 이슈이지
앱 버그가 아님). 바깥 영역 클릭으로 닫히는 것은 실제 클릭으로 정상 확인됨.

---

## Phase 4: User Story 2 - #태그명으로 아티클 찾기 (Priority: P2)

**Goal**: 입력값이 `#`으로 시작하면 텍스트 검색과 분리된 태그 검색 모드로 전환되고, 모달을 처음 열었을 때
이 문법을 알려주는 힌트가 노출되게 한다.

**Independent Test**: 검색 모달을 새로 열었을 때 태그 검색 힌트가 보이는지 확인하고, `#태그명`을
입력했을 때 해당 태그가 붙은 아티클만(랭킹 없이) 모두 나타나는지, 일반 텍스트 검색 결과와 섞이지 않는지
확인한다.

### Implementation for User Story 2

- [X] T014 [US2] `components/search/search-query.ts`를 확장한다 — `parseSearchQuery(raw: string):
      {mode: "text" | "tag"; term: string}`를 추가해 `raw.trim()`이 `#`으로 시작하면 `mode: "tag"`
      (term은 `#` 다음 문자열), 아니면 `mode: "text"`로 판별하고(FR-008, FR-010), 태그 모드 전용
      `runTagSearch(entries, term): SearchResult[]`(대소문자 무시 substring, `tags` 배열만 대상,
      랭킹 없음 — FR-012)를 추가한다. 두 모드를 분기하는 `runSearch(entries, parsedQuery)`로
      `runTextSearch`/`runTagSearch`를 감싼다(depends on T006). 완료 조건: `npm run build` 통과.
- [X] T015 [US2] `components/search/search-modal.tsx`가 `runTextSearch` 직접 호출 대신
      `parseSearchQuery` + `runSearch`를 사용하도록 교체한다(depends on T014, T010). 완료 조건:
      `npm run build` 통과.
- [X] T016 [US2] `search-modal.tsx`의 빈 입력 상태 힌트 문구를 "`#태그명`으로 태그 검색이 가능합니다"
      류의 구체적 안내로 확정한다(FR-007) (depends on T015). 완료 조건: `npm run build` 통과.

**Checkpoint**: (1) `npm run build` 통과. (2) 브라우저(`claude-in-chrome` → `playwright-cli` →
`playwright` MCP)로 아래를 구동 검증 — **★ 태그 검색 동작은 필수 게이트, 실패 시 이 phase는 미완료로
간주**:
- 모달을 새로 열었을 때(입력값 없음) `#태그명` 힌트가 보이는지
- **★ 실제 존재하는 태그(예: `#backend`, 콘텐츠에 맞게 조정)로 검색 시 해당 태그가 붙은 아티클이 모두,
  랭킹 없이 나타나는지**
- **★ `#` 없이 같은 문자열을 검색했을 때는 제목/본문에만 있고 태그로는 없는 아티클이 나오지 않는지
  (텍스트 모드와 태그 모드가 서로 섞이지 않는지, FR-009/FR-010)**
- 어떤 아티클에도 없는 태그명 검색 시 "No results found."가 표시되는지

**검증 결과 (claude-in-chrome 사용)**: 모두 통과. 모달을 새로 열면 "Type #tag-name to search articles by
tag" 힌트가 노출됨. `#grpc` 검색 시 `architecting-high-concurrency-distributed-systems`(태그만 GRPC —
동일 문자열의 일반 텍스트 검색에서는 제외됐던 아티클)와 `grpc-in-browser-based-applications` 둘 다
랭킹 없이 나타나 태그 모드가 실제로 독립적으로 동작함을 확인. `#`만 입력, 존재하지 않는 태그
(`#nonexistenttag`) 모두 "No results found." 정상 표시.

---

## Phase 5: User Story 3 - 다크/라이트 테마를 따라가는 검색 UI (Priority: P3)

**Goal**: 검색 트리거와 모달이 헤더 토글로 선택된 dark/light 테마를 그대로 따르고, 모달이 열린 채로
테마를 전환해도 즉시 반영되게 한다.

**Independent Test**: 라이트 테마에서 모달을 열어 스타일을 확인하고, 모달이 열린 채로 테마를 다크로
전환했을 때 색상이 다른 페이지 요소와 함께 즉시 바뀌는지 확인한다.

### Implementation for User Story 3

- [X] T017 [US3] `components/search/search-modal.tsx`, `search-results.tsx`의 스타일을 프로젝트의
      기존 CSS 커스텀 프로퍼티/Tailwind 다크 variant(`app/globals.css`의 `--color-*` 토큰, `.dark`
      셀렉터)로 교체한다 — 색상을 하드코딩하지 않는다(FR-005). `cmdk`는 기본적으로 언스타일드이므로
      모든 시각 요소에 이 토큰을 명시적으로 연결해야 한다 (depends on T010, T015). 완료 조건:
      `npm run build` 통과.
- [X] T018 [P] [US3] `components/search/search-trigger.tsx`의 스타일도 동일 테마 토큰을 사용하는지
      확인하고, 하드코딩된 색상이 있으면 제거한다 (depends on T007). 완료 조건: `npm run build` 통과.

**Checkpoint**: (1) `npm run build` 통과. (2) 브라우저(`claude-in-chrome` → `playwright-cli` →
`playwright` MCP)로 아래를 구동 검증:
- 라이트 테마에서 트리거·모달이 라이트 색상 체계를 따르는지
- 다크 테마에서 트리거·모달이 다크 색상 체계를 따르는지
- 모달이 열린 상태에서 헤더 테마 토글을 눌렀을 때, 모달을 닫지 않아도 다른 페이지 요소와 동시에 색상이
  전환되는지(FR-006, SC-007)

**검증 결과 (claude-in-chrome 사용)**: 통과. 모달이 열린 채로 테마 토글을 누르자 모달을 포함해 트리거,
히어로, 카드 등 페이지 전체가 다크→라이트로 동시에 전환됨(닫았다 다시 열 필요 없음).

---

## Phase 6: User Story 4 - 모바일에서 검색 사용하기 (Priority: P4)

**Goal**: 모바일 화면에서도 헤더의 검색 트리거를 동일하게 사용할 수 있고, 트리거를 탭하면 모달이 화면
전체를 채우는 형태로 열리게 한다.

**Independent Test**: 모바일 뷰포트에서 트리거가 보이는지, 탭했을 때 모달이 화면 전체를 채우며 열리는지,
그 안에서 텍스트/태그 검색이 데스크톱과 동일하게 동작하는지 확인한다.

### Implementation for User Story 4

- [X] T019 [US4] `components/search/search-modal.tsx`에 Tailwind 반응형 variant(`sm:`/`md:`)로
      모바일 스타일을 추가해, 좁은 뷰포트에서 모달이 화면 전체(폭/높이)를 채우도록 구현한다(FR-021)
      (depends on T017). 완료 조건: `npm run build` 통과.
- [X] T020 [P] [US4] `components/search/search-trigger.tsx`가 모바일 너비에서도 동일하게 노출되는지
      확인하고 필요하면 반응형 스타일을 보강한다(FR-020) (depends on T018). 완료 조건: `npm run build`
      통과.

**Checkpoint**: (1) `npm run build` 통과. (2) 브라우저(`claude-in-chrome` → `playwright-cli` →
`playwright` MCP, 모바일 뷰포트 에뮬레이션 사용)로 아래를 구동 검증:
- 모바일 폭에서 헤더에 트리거가 동일하게 노출되는지
- 트리거를 탭하면 모달이 화면 전체를 채우며 열리는지
- 그 안에서 텍스트 검색과 `#태그` 검색이 데스크톱과 동일하게 동작하는지(US1·US2 필수 게이트를 모바일
  뷰포트에서도 재확인)

**검증 결과 (claude-in-chrome, 390x844 뷰포트 사용)**: 통과. 트리거가 좁은 폭에서도 placeholder +
Ctrl K 뱃지와 함께 완전히 노출됨(기능 없는 LOGIN 버튼/구분선만 숨김). 탭하면 모달이 화면 전체(입력창
상단 고정, 결과 스크롤 영역, 키보드 힌트 푸터 하단 고정)를 채우며 열리고, "Kafka" 텍스트 검색이 데스크톱과
동일하게 동작함을 확인.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 전체 회귀 검증과 Constitution Principle III 감사

- [X] T021 [P] `specs/005-article-search/quickstart.md`의 10개 시나리오를 처음부터 끝까지 브라우저로
      재검증한다(`claude-in-chrome` → `playwright-cli` → `playwright` MCP 우선순위, 데스크톱·모바일
      뷰포트 모두). 완료 조건: 10개 시나리오 전부 통과.
      결과: 10개 전부 통과 — US1~US4 Checkpoint에서 이미 실제 검증했고(트리거 상시 노출, 클릭/Ctrl+K
      열기, 제목/본문 텍스트 검색 랭킹, `#태그` 검색, No results found., `_syntax-preview` 제외, 방향키+
      Enter 탐색, Esc/바깥 클릭 닫기, 테마 동시 전환, 모바일 전체화면), 추가로 "다른 입력 필드에 포커스가
      있을 때 Ctrl+K 무시" edge case를 `KeyboardEvent` 직접 디스패치로 별도 재확인함(정상 동작).
- [X] T022 [P] `.agents/skills/vercel-react-best-practices/rules/`를 실제로 열어, 이번에 작성한
      `components/search/*`와 `lib/content/search-index.ts`, `lib/data/search.ts`를 규칙 전체와 대조
      감사한다(Constitution Principle III) — 특히 `rerender-use-deferred-value`, `bundle-dynamic-
      imports`, `client-event-listeners` 적용이 실제로 규칙대로 되어 있는지 재확인하고, 위반이
      발견되면 그 자리에서 수정한다. 완료 조건: `npm run build` 통과 + 발견된 위반 모두 수정 완료.
      감사 결과: `js-flatmap-filter`(`.filter().map()` 2회 순회 → `runTagSearch`를 `.flatMap()` 1회
      순회로 수정, 실제 위반 발견 및 수정) 외에는 위반 없음 — `rerender-use-deferred-value`(입력값
      `useDeferredValue` 적용 확인), `bundle-dynamic-imports`(`SearchModal` 최초 오픈 전까지 렌더 트리
      제외로 실제 지연 로드 확인), `client-event-listeners`/`advanced-event-handler-refs`(단축키 리스너
      단일 인스턴스 + ref 기반 안정 구독 확인), `js-early-exit`, `rerender-derived-state-no-effect`,
      `rendering-conditional-render`, `rerender-simple-expression-in-memo`(객체를 반환하는
      `parsedQuery` useMemo는 하위 useMemo 의존성이라 정당함) 모두 준수. `rendering-hoist-jsx`(태그 힌트
      JSX 정적 추출)는 impact가 LOW이고 해당 JSX가 SVG처럼 무거운 요소가 아니라 실익이 없다고 판단해
      적용하지 않음 — 트레이드오프를 여기 기록함.
- [X] T023 최종 `npm run build`와 `npm run lint`를 통과 확인한다(전체 리그레션) (depends on T001-T022).
      완료 조건: 둘 다 에러 없이 통과. 결과: 둘 다 에러/경고 없이 통과.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 의존성 없음 — 즉시 시작 가능
- **Foundational (Phase 2)**: Setup 완료 후 시작 — 모든 User Story를 막는 진짜 차단 요소
- **User Story 1 (Phase 3)**: Foundational 완료 후 시작 가능. 다른 story에 의존하지 않음(MVP)
- **User Story 2 (Phase 4)**: Foundational 완료 후 시작 가능하지만, `search-query.ts`/
  `search-modal.tsx`를 공유하므로 실질적으로 US1 완료 후 진행하는 편이 안전
- **User Story 3 (Phase 5)**: US1(모달 존재)과 US2(최종 검색 로직)가 만든 컴포넌트를 스타일링하므로
  US1·US2 이후 진행
- **User Story 4 (Phase 6)**: US3까지의 스타일 기반 위에 반응형을 얹으므로 US3 이후 진행
- **Polish (Phase 7)**: 모든 User Story 완료 후 진행

### Within Each User Story

- US1: 데이터/로직(T006) → 독립 UI 조각(T007, T008, T009 — 병렬 가능) → 조립(T010) → 통합(T011) →
  정적 목업 동기화(T012, T013 — 병렬 가능)
- US2: 로직 확장(T014) → 모달 교체(T015) → 힌트 문구 확정(T016) — 순차 진행(같은 파일을 연쇄적으로
  수정)
- US3: 모달/결과 스타일(T017) → 트리거 스타일(T018, 병렬 가능)
- US4: 모달 반응형(T019) → 트리거 반응형(T020, 병렬 가능)

### Parallel Opportunities

- Foundational: T002 → (T003) → T004, T005는 T003 이후 병렬 가능
- US1: T006, T007, T008은 서로 다른 신규 파일이라 병렬 가능. T012, T013(정적 목업 4파일)도 서로 병렬
  가능
- US3: T017과 T018 병렬 가능
- US4: T019와 T020 병렬 가능
- Polish: T021과 T022 병렬 가능

---

## Parallel Example: User Story 1

```bash
# 서로 다른 신규 파일이므로 함께 진행 가능:
Task: "components/search/search-query.ts에 runTextSearch 구현 (T006)"
Task: "components/search/search-trigger.tsx 구현 (T007)"
Task: "components/search/use-search-shortcut.ts 구현 (T008)"

# 이후 정적 목업 동기화도 함께 진행 가능:
Task: "core/home-dark.html, core/home-light.html 트리거 마크업 반영 (T012)"
Task: "core/article-detail-dark.html, core/article-detail-light.html 트리거 마크업 반영 (T013)"
```

---

## Implementation Strategy

### MVP First (User Story 1만)

1. Phase 1: Setup 완료
2. Phase 2: Foundational 완료 (필수 — 모든 story를 막음)
3. Phase 3: User Story 1 완료
4. **STOP and VALIDATE**: US1 Checkpoint의 브라우저 검증(제목/본문 검색 필수 게이트 포함)을 통과시킨다
5. 이 시점에서 이미 방문자는 헤더에서 검색을 열고 텍스트로 아티클을 찾을 수 있다(MVP)

### Incremental Delivery

1. Setup + Foundational → 데이터 계층 준비 완료
2. US1 추가 → 독립 검증(텍스트 검색 필수 게이트) → MVP
3. US2 추가 → 독립 검증(태그 검색 필수 게이트)
4. US3 추가 → 독립 검증(테마 동기화)
5. US4 추가 → 독립 검증(모바일 전체화면)
6. Polish → quickstart.md 10개 시나리오 전체 재검증 + vercel-react-best-practices 감사

---

## Notes

- `[P]` task = 다른 파일, 완료되지 않은 task에 대한 의존성 없음
- `[Story]` 라벨은 task를 특정 user story에 매핑해 추적 가능하게 한다
- 각 task는 `npm run build` 통과를 완료 조건으로 갖는다(정적 HTML만 바꾸는 예외 제외)
- 각 phase의 Checkpoint는 `npm run build` + 브라우저 구동 검증(우선순위: `claude-in-chrome` →
  `playwright-cli` → `playwright` MCP) 둘 다 필요하다
- US1의 텍스트 검색, US2의 `#태그` 검색은 다른 항목이 통과해도 이 항목이 실패하면 해당 phase를
  미완료로 간주하는 필수 게이트다
- 각 phase 완료 시점마다 커밋해 story 단위로 독립 검증 가능한 상태를 유지한다
