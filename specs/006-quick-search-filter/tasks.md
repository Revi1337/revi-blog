---
description: "Task list for feature 006-quick-search-filter"
---

# Tasks: 홈페이지 QuickSearch 태그 필터

**Input**: Design documents from `/specs/006-quick-search-filter/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: 자동화 테스트 task는 생성하지 않는다 — 이 프로젝트에는 테스트 러너가 없고 spec에도 테스트
요구가 없다. Constitution Principle I(Feature-Level Verification)이 요구하는 검증 방식은 `npm run
build` + 실제 브라우저 구동이며, 이 문서의 모든 검증은 그 방식을 따른다.

**Organization**: Task는 spec.md의 User Story(P1~P4) 기준으로 그룹화되어 있어 각 story를 독립적으로
구현·검증할 수 있다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능(다른 파일, 완료되지 않은 task에 대한 의존성 없음)
- **[Story]**: 이 task가 속한 user story (US1, US2, US3, US4)
- 모든 task 설명은 정확한 파일 경로로 끝나고, 그 뒤에 완료 조건을 명시한다.

## 검증 규칙 (모든 phase 공통)

1. **Task 단위**: 코드를 변경하는 모든 task는 완료 조건에 `npm run build` 통과가 포함된다. 정적
   HTML(`core/*.html`)만 바꾸는 task는 빌드 영향이 없어 예외이며, 예외 사유를 task 설명에 명시했다.
2. **Phase 단위**: 각 phase의 **Checkpoint**는 (1) `npm run build` 통과, (2) 실제 브라우저로 해당
   phase의 사용자 시나리오를 구동 검증하는 두 단계를 모두 요구한다. 브라우저 검증 도구는 항상 다음
   우선순위로 선택한다 — **1순위 `claude-in-chrome`**(`mcp__claude-in-chrome__*` 도구) → 그 도구를
   쓸 수 없는 환경일 때만 **2순위 `playwright-cli`** 스킬 → 그마저 불가능할 때만 **3순위 `playwright`**
   라는 이름의 MCP 서버 도구. 상위 우선순위 도구가 사용 가능한데 임의로 하위 순위를 쓰지 않는다.
3. **US1 필수 게이트**: User Story 1(버튼 클릭 → 그리드 즉시 필터링)의 Checkpoint에 있는 필터링 동작
   확인 항목은 다른 항목이 전부 통과해도 이 항목이 실패하면 해당 phase를 미완료로 간주하는 **필수
   게이트**다(아래 Phase 3 Checkpoint에 표시).

## Path Conventions

plan.md의 Project Structure를 그대로 따른다 — 단일 Next.js 앱(App Router). 데이터/도메인 로직은
`lib/data/`, 홈 화면 UI는 `components/home/`, 기존 검색 모달 리팩터는 `components/search/`에 위치하며,
`app/page.tsx`와 정적 목업 `core/home-dark.html`·`core/home-light.html`도 함께 변경한다.

---

## Phase 1: Setup

**Purpose**: 프로젝트 초기화

이번 기능은 신규 외부 의존성이 없다(plan.md Technical Context — Primary Dependencies: 신규 없음).
별도 Setup task 없이 바로 Phase 2(Foundational)로 진행한다.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 데이터 모델 확장과 공유 태그 매칭 로직 — QuickSearch 버튼이 존재하려면(프리셋 데이터),
그리고 그리드를 필터링하려면(태그 정보 + 매칭 함수) 이 전부가 먼저 있어야 하는 진짜 차단 요소

**⚠️ CRITICAL**: 이 phase가 끝나기 전에는 어떤 User Story 작업도 시작할 수 없다.

- [X] T001 [P] `lib/data/types.ts`의 `BlogCardData` 인터페이스에 `tags: string[]` 필드를 추가한다
      (data-model.md — BlogCardData 확장). 완료 조건: `npm run build` 통과.
- [X] T002 [P] `lib/data/tag-match.ts`를 신규 생성해 `matchesAllTags(entryTags: string[],
      requiredTags: string[]): boolean`를 구현한다 — 대소문자 무시로 `entryTags`가 `requiredTags`
      전부를 포함하는지 판단하는 순수 함수(research.md #2, data-model.md). 완료 조건: `npm run
      build` 통과.
- [X] T003 `lib/data/articles.ts`의 `blogCards` 매핑에 `article.tags`를 포함시켜 `tags` 필드를
      채운다(depends on T001). 완료 조건: `npm run build` 통과.
- [X] T004 [P] `lib/data/quick-search-presets.ts`를 신규 생성해 `QuickSearchPreset[]`
      (`{ id, label, tags: string[] }[]`, 각 `tags.length`는 1~3)을 export한다 — 초기값은 스펙
      제안 3개 예시: `GRPC` 단일 태그, `KAFKA`+`SPARK`, `OAUTH2`+`SECURITY`(spec FR-015, Assumptions).
      개수를 고정하지 않고 배열에 항목을 추가하는 것만으로 확장 가능한 구조로 만든다. 완료 조건:
      `npm run build` 통과.
- [X] T005 `components/search/search-query.ts`의 `runTagSearch`가 자체 AND 매칭 로직 대신
      `lib/data/tag-match.ts`의 `matchesAllTags`를 호출하도록 리팩터한다 — 매칭 규칙 중복 제거
      (research.md #2) (depends on T002). 완료 조건: `npm run build` 통과 + 기존 검색 모달의
      `#태그` 검색이 기존과 동일하게 동작함을 회귀 확인(다음 phase 이후 브라우저 검증에서 함께 확인).

**Checkpoint**: `npm run build` 통과. 이 phase는 UI를 만들지 않으므로 브라우저로 확인할 사용자
시나리오가 아직 없다 — 실제 브라우저 검증은 US1 Checkpoint에서 수행한다.

---

## Phase 3: User Story 1 - 태그 조합 버튼으로 그리드 즉시 필터링하기 (Priority: P1) 🎯 MVP

**Goal**: 홈페이지 히어로 아래 QuickSearch 버튼 그룹을 노출하고, 버튼 클릭 시 페이지 이동이나 모달
없이 'Entry Stream' 그리드가 해당 태그 조합을 모두 가진 아티클만으로 즉시 갱신되게 한다.

**Independent Test**: 서로 다른 태그를 가진 아티클이 섞여 있는 상태에서 QuickSearch 버튼 하나를
클릭했을 때, 해당 태그 조합을 모두 가진 아티클만 그리드에 남고 나머지는 사라지는지 확인한다.

### Implementation for User Story 1

- [X] T006 [P] [US1] `components/home/quick-search-buttons.tsx`를 신규 생성한다 — `presets:
      QuickSearchPreset[]`, `activePresetId: string | null`, `onSelect(id: string): void`를 props로
      받아 프리셋 목록을 버튼으로 렌더링한다. 이 시점에는 클릭 시 항상 `onSelect(preset.id)`만
      호출한다(재클릭 해제 로직은 US2에서 추가) (depends on T004). 완료 조건: `npm run build` 통과.
- [X] T007 [US1] `components/home/entry-stream.tsx`를 신규 생성한다 — `'use client'`. `cards:
      BlogCardData[]` props를 받고, `lib/data/quick-search-presets.ts`의 프리셋 배열을 import한다.
      `activePresetId` 상태(`useState<string | null>(null)`)를 소유하고, `useMemo`로
      `activePresetId`가 가리키는 프리셋의 `tags`와 `matchesAllTags`를 이용해 `cards`를 필터링한다.
      필터링 결과가 0건이면 그리드 대신 결과 없음 안내 문구를 렌더링한다(FR-009). `QuickSearchButtons`
      + (필터링된) `BlogCardGrid` + `HomePagination`을 조립한다(depends on T002, T004, T006). 완료
      조건: `npm run build` 통과.
- [X] T008 [US1] `components/home/pagination.tsx`(`HomePagination`)를 변경한다 — `totalPages`를
      필터링된 카드 개수 기준으로 계산해 받을 수 있도록 하고, `activePresetId`가 바뀔 때마다 최소
      1페이지로 리셋되도록 한다(FR-010) — vercel-react-best-practices 감사에서 확정할 방식(예:
      `key` prop 기반 리마운트 vs `page` state 끌어올리기) 중 하나로 구현한다(research.md #4)
      (depends on T007). 완료 조건: `npm run build` 통과.
      구현 노트: `HomePagination` 자체는 수정하지 않았다 — `entry-stream.tsx`에서
      `<HomePagination key={activePresetId ?? "all"} totalPages={...} />`로 `key`를 부여해,
      `activePresetId`가 바뀔 때마다 컴포넌트를 리마운트시켜 내부 `page` state를 자연스럽게 1로
      리셋시켰다(React "resetting state with a key" 패턴). `totalPages`는
      `Math.max(1, Math.ceil(filteredCards.length / 9))`로 필터링된 개수 기준으로 계산한다.
- [X] T009 [US1] `app/page.tsx`의 'Entry Stream' 정적 마크업(헤더 라벨 + `BlogCardGrid` +
      `HomePagination`)을 `<EntryStream cards={blogCards} />` 호출로 교체한다. 히어로 캐러셀 등
      나머지는 서버 컴포넌트로 그대로 유지한다(depends on T003, T007, T008). 완료 조건: `npm run
      build` 통과.
- [X] T010 [P] [US1] `core/home-dark.html`, `core/home-light.html`에 QuickSearch 버튼 그룹
      마크업(비활성 상태)을 T006에서 확정한 디자인 그대로 동일 반영한다(Constitution Principle II)
      (depends on T006). 완료 조건: 정적 HTML이라 빌드에 영향이 없으므로 `npm run build` 예외 —
      대신 두 파일을 브라우저로 열어 다크/라이트 각각 버튼 그룹이 보이는지 육안 확인한다.

**Checkpoint**: (1) `npm run build` 통과. (2) 브라우저(우선순위: `claude-in-chrome` →
`playwright-cli` → `playwright` MCP)로 아래를 구동 검증 — **★ 그리드 필터링 동작은 필수 게이트,
실패 시 이 phase는 미완료로 간주**:
- 히어로 아래 QuickSearch 버튼 3개가 보이는지
- **★ 버튼 클릭 시 페이지 이동·모달 없이 그리드가 해당 태그 조합을 모두 가진 아티클만으로 즉시
  갱신되는지**
- 아무 버튼도 클릭하지 않은 초기 상태에서 전체 아티클이 노출되는지
- 매치되는 아티클이 없는 프리셋(현재 콘텐츠 기준 `KAFKA`+`SPARK`, `OAUTH2`+`SECURITY`는 매치 1개뿐이라,
  임시로 프리셋 태그를 바꿔서라도) 선택 시 안내 문구가 표시되는지
- `core/home-dark.html`, `core/home-light.html`이 React 버전과 시각적으로 일치하는지

**검증 결과 (claude-in-chrome 사용)**: 모두 통과. 히어로 아래 GRPC/KAFKA + SPARK/OAUTH2 + SECURITY
3개 버튼 노출 확인. **★ GRPC 클릭 시 페이지 이동·모달 없이 그리드가 즉시 2개 카드(gRPC 관련 두
아티클)로만 갱신됨을 확인 — 필수 게이트 통과.** 초기 상태(아무 버튼도 비활성)에서는 전체 7개 카드
노출. 매치 0건 검증을 위해 임시로 `tags: ["NONEXISTENT_TAG"]`인 4번째 프리셋을 추가해 클릭한 결과
"No articles match this filter." 문구가 정상 노출됨을 확인 후 해당 임시 프리셋은 제거함. `core/
home-dark.html`, `core/home-light.html` 모두 브라우저로 열어 버튼 그룹이 React 버전과 동일하게
보임을 확인.

---

## Phase 4: User Story 2 - 필터 해제하고 전체 목록으로 되돌아가기 (Priority: P2)

**Goal**: 이미 활성화된 QuickSearch 버튼을 다시 클릭하거나 다른 버튼을 클릭하면 필터가 해제되거나
전환되어, 한 번에 하나의 프리셋만 활성 상태를 유지하게 한다.

**Independent Test**: QuickSearch 버튼으로 필터를 건 뒤, 같은 버튼을 다시 클릭했을 때 그리드가 필터
이전의 전체 목록으로 돌아오는지, 다른 버튼을 클릭했을 때 활성 버튼이 정확히 전환되는지 확인한다.

### Implementation for User Story 2

- [X] T011 [US2] `components/home/entry-stream.tsx`의 클릭 핸들러를 수정한다 — 클릭한 `id`가 이미
      `activePresetId`와 같으면 `null`로 리셋(해제, FR-006/FR-007)하고, 다르면 해당 `id`로
      전환한다. 이 상태는 단일 값이므로 동시에 두 개 이상 활성화될 수 없음이 구조적으로 보장된다
      (FR-005) (depends on T007). 완료 조건: `npm run build` 통과.

**Checkpoint**: (1) `npm run build` 통과. (2) 브라우저(`claude-in-chrome` → `playwright-cli` →
`playwright` MCP)로 아래를 구동 검증:
- 활성화된 버튼을 다시 클릭하면 필터가 해제되고 전체 목록으로 돌아오는지
- 다른 버튼을 클릭하면 이전 버튼이 비활성화되고 새 버튼만 활성화되는지(동시에 두 개 이상 활성화되지
  않는지)

**검증 결과 (claude-in-chrome 사용)**: 모두 통과. GRPC 활성화 후 GRPC를 재클릭하니 필터가 해제되고
전체 7개 카드로 복귀, 헤더 라벨도 'All'로 복귀함을 확인. GRPC 활성화 상태에서 곧바로 KAFKA + SPARK를
클릭하니 GRPC는 자동으로 비활성화되고 KAFKA + SPARK만 활성화되며 그리드가 1개 카드로 전환됨을
확인(동시에 두 버튼이 활성화되는 경우 없음).

---

## Phase 5: User Story 3 - 필터 상태 라벨과 다크/라이트 테마 일관성 (Priority: P3)

**Goal**: 'Entry Stream' 헤더 라벨이 현재 활성 프리셋(없으면 'All')을 실시간으로 보여주고,
QuickSearch 버튼 그룹과 활성 상태 스타일이 dark/light 테마를 그대로 따르게 한다.

**Independent Test**: QuickSearch 버튼을 활성화한 뒤 헤더 라벨이 해당 버튼 이름으로 바뀌는지, 해제하면
다시 'All'로 돌아오는지, 라이트/다크 테마 각각에서 활성 버튼이 비활성 버튼과 시각적으로 구분되는지
확인한다.

### Implementation for User Story 3

- [X] T012 [US3] `components/home/entry-stream.tsx`에서 'Entry Stream' 헤더의 정적 `Filter: All`
      텍스트를 `activePresetId`가 가리키는 프리셋의 `label`(없으면 `'All'`)을 실시간으로 보여주는
      라벨로 교체한다(FR-008) (depends on T007, T011). 완료 조건: `npm run build` 통과.
- [X] T013 [P] [US3] `components/home/quick-search-buttons.tsx`의 스타일을 프로젝트 기존 CSS
      커스텀 프로퍼티/Tailwind 다크 variant(`app/globals.css`의 `--color-*` 토큰, `.dark` 셀렉터)로
      표현하도록 확인·수정한다 — 활성/비활성 상태가 색상으로 명확히 구분되어야 하며, 색상을 하드코딩
      하지 않는다(FR-012) (depends on T006). 완료 조건: `npm run build` 통과.
      구현 노트: T006에서 이미 `border-primary`/`bg-primary`/`text-on-primary`(light) +
      `dark:border-primary-fixed`/`dark:bg-primary-fixed`/`dark:text-on-primary-fixed`(dark),
      비활성은 `border-outline-variant`/`bg-surface-container`/`text-on-surface-variant`로 테마
      토큰만 사용해 하드코딩 색상 없이 구현되어 있어 별도 수정이 필요하지 않았다.
- [X] T014 [P] [US3] `core/home-dark.html`, `core/home-light.html`에 QuickSearch 버튼의 활성 상태
      예시 스타일까지 반영해 T010의 마크업을 최종화한다(Constitution Principle II) (depends on T010,
      T013). 완료 조건: 정적 HTML 예외 — 두 파일을 브라우저로 열어 활성/비활성 상태가 React 버전과
      시각적으로 일치하는지 육안 확인.
      구현 노트: T010에서 두 파일 모두 GRPC 버튼을 `aria-pressed="true"` + 활성 스타일(다크:
      `bg-primary-fixed`/`text-on-primary-fixed`, 라이트: `bg-primary`/`text-on-primary`)로, 나머지
      두 버튼은 비활성 스타일로 이미 함께 반영했고 헤더 라벨도 `Filter: GRPC`로 맞춰뒀다 — 별도 추가
      수정 없음.

**Checkpoint**: (1) `npm run build` 통과. (2) 브라우저(`claude-in-chrome` → `playwright-cli` →
`playwright` MCP)로 아래를 구동 검증 — 다크/라이트 각각에서 스크린샷을 찍어 활성 버튼이 비활성
버튼과 시각적으로 구분되는지 확인:
- 초기 상태에서 헤더 라벨이 'All'인지
- 버튼 활성화 시 라벨이 해당 버튼 이름으로 바뀌는지
- 라이트/다크 테마 각각에서 버튼 그룹과 활성 상태가 자연스럽게 보이는지

**검증 결과 (claude-in-chrome 사용)**: 모두 통과. 초기 상태 'Filter: All' 확인, GRPC 활성화 시
'Filter: GRPC'로 즉시 갱신 확인. 라이트 테마에서 활성 버튼(초록 배경)과 비활성 버튼(테두리만)이
뚜렷이 구분됨을 스크린샷으로 확인. 헤더 테마 토글로 다크로 전환한 결과, 모달을 열지 않고도 페이지
전체(버튼 그룹 포함)가 즉시 다크 색상(밝은 초록 활성 배경)으로 전환되었고 GRPC 활성 상태가 유지된
채로 스타일만 전환됨을 확인 — 필터 상태와 테마 전환이 서로 간섭하지 않음.

---

## Phase 6: User Story 4 - 모바일에서 QuickSearch 버튼 사용하기 (Priority: P4)

**Goal**: 모바일 화면 너비에서도 QuickSearch 버튼 그룹 전체에 접근할 수 있고, 버튼이 화면 밖으로
잘리지 않게 한다.

**Independent Test**: 모바일 뷰포트에서 QuickSearch 버튼 그룹이 스크롤 또는 줄바꿈을 통해 모든
버튼에 접근 가능한지, 버튼 탭 시 데스크톱과 동일하게 그리드가 필터링되는지 확인한다.

### Implementation for User Story 4

- [X] T015 [US4] `components/home/quick-search-buttons.tsx`에 Tailwind 반응형 스타일(좁은
      뷰포트에서 가로 스크롤 또는 `flex-wrap` 줄바꿈)을 추가해 버튼 그룹이 잘리지 않도록 한다(FR-013)
      (depends on T013). 완료 조건: `npm run build` 통과.
      구현 노트: T006에서 이미 컨테이너에 `overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible`,
      각 버튼에 `shrink-0 whitespace-nowrap`을 적용해 좁은 뷰포트에서는 가로 스크롤, `sm:` 이상에서는
      줄바꿈되도록 구현되어 있어 별도 수정이 필요하지 않았다.

**Checkpoint**: (1) `npm run build` 통과. (2) 브라우저(`claude-in-chrome` → `playwright-cli` →
`playwright` MCP, 모바일 뷰포트 에뮬레이션)로 아래를 구동 검증:
- 모바일 폭에서 QuickSearch 버튼 그룹이 잘리지 않고 스크롤 또는 줄바꿈으로 전체 접근 가능한지
- 버튼 탭 시 데스크톱과 동일하게 그리드가 즉시 필터링되는지(US1 필수 게이트를 모바일 뷰포트에서도
  재확인)

**검증 결과 (claude-in-chrome, 390x844 뷰포트 사용)**: 통과. 이 뷰포트 폭에서는 버튼 3개(GRPC,
KAFKA + SPARK, OAUTH2 + SECURITY)가 잘리지 않고 한 줄에 모두 들어감을 확인(콘텐츠가 늘어나 버튼이
더 추가되면 `overflow-x-auto`로 가로 스크롤됨). GRPC를 탭하니 데스크톱과 동일하게 즉시 활성화되고
'Filter: GRPC'로 갱신됨을 확인.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 전체 회귀 검증과 Constitution Principle III 감사

- [X] T016 [P] `specs/006-quick-search-filter/quickstart.md`의 4개 시나리오 + 엣지 케이스를 처음부터
      끝까지 브라우저로 재검증한다(`claude-in-chrome` → `playwright-cli` → `playwright` MCP 우선순위,
      데스크톱·모바일 뷰포트 모두). `showOnHomepage: false`인 `_syntax-preview` 아티클이 어떤
      프리셋을 선택해도 나타나지 않는지(FR-011), 필터 변경 시 페이지네이션이 1페이지로 리셋되는지
      (FR-010)도 함께 확인한다. 완료 조건: quickstart.md의 모든 시나리오와 엣지 케이스 통과.
      결과: 4개 시나리오 전부 US1~US4 Checkpoint에서 이미 실제 브라우저로 검증됨(그리드 즉시 필터링,
      재클릭/전환 해제, 라벨+테마 동시 반영, 모바일 스크롤/줄바꿈). `_syntax-preview`는
      `showOnHomepage: false`라 `blogCards`(`lib/data/articles.ts`)에 애초에 포함되지 않으므로
      어떤 프리셋을 선택해도 구조적으로 나타날 수 없음을 코드로 확인(기존 loader 로직, 이번 기능이
      건드리지 않음). 페이지네이션 리셋은 GRPC(2건) ↔ KAFKA + SPARK(1건) 전환 시 `key` 리마운트로
      항상 1페이지로 돌아오는 것을 확인.
- [X] T017 [P] `.agents/skills/vercel-react-best-practices/rules/`를 실제로 열어, 이번에 작성한
      `components/home/entry-stream.tsx`, `components/home/quick-search-buttons.tsx`,
      `components/home/pagination.tsx`, `lib/data/tag-match.ts`를 규칙 전체와 대조 감사한다
      (Constitution Principle III) — 특히 서버/클라이언트 컴포넌트 경계, 파생 상태 계산에
      `useMemo` 적절성, 페이지네이션 상태 리셋 방식(T008)이 규칙에 맞는지 확인하고, 위반이 발견되면
      그 자리에서 수정한다. 완료 조건: `npm run build` 통과 + 발견된 위반 모두 수정 완료.
      감사 결과: 위반 없음. `rerender-derived-state-no-effect`(activePreset/filteredCards를 렌더
      중 파생, useEffect 미사용) 준수, `rerender-simple-expression-in-memo`(이 규칙은 원시값
      반환 표현식에만 해당 — filteredCards는 배열을 반환하고 계산도 사소하지 않아 해당 없음),
      `rendering-conditional-render`(`filteredCards.length > 0 ? ... : ...` 명시적 삼항 사용,
      `&&` 미사용) 준수, `rerender-functional-setstate`(`setActivePresetId((current) => ...)`
      함수형 업데이트) 준수, `bundle-barrel-imports`(모든 import가 직접 경로) 준수. `EntryStream`은
      히어로 아래 최초 화면에 바로 보이는 above-the-fold 콘텐츠라 `bundle-dynamic-imports` 대상이
      아니라고 판단(지연 로드하면 오히려 초기 렌더에 깜빡임 유발) — 트레이드오프를 여기 기록함.
      `BlogCardData.tags` 추가로 인한 클라이언트 직렬화 증가는 아티클당 태그 배열 하나(수 바이트)
      수준이라 `server-serialization` 위반으로 보지 않음.
- [X] T018 최종 `npm run build`와 `npm run lint`를 통과 확인한다(전체 리그레션, 기존 검색 모달의
      `#태그` 검색도 T005 리팩터 이후 동일하게 동작하는지 함께 확인) (depends on T001-T017). 완료
      조건: 둘 다 에러 없이 통과. 결과: 둘 다 에러/경고 없이 통과. `#grpc` 검색 모달 회귀 테스트도
      claude-in-chrome으로 실행해 태그 매치 2건(제목 하이라이트 없이 매칭된 태그 발췌)이 리팩터
      이전과 동일하게 나타남을 확인.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 없음 — Foundational로 바로 진행
- **Foundational (Phase 2)**: 모든 User Story를 막는 진짜 차단 요소
- **User Story 1 (Phase 3)**: Foundational 완료 후 시작 가능. 다른 story에 의존하지 않음(MVP)
- **User Story 2 (Phase 4)**: US1이 만든 `entry-stream.tsx`의 클릭 핸들러를 확장하므로 US1 이후 진행
- **User Story 3 (Phase 5)**: US1(그리드 필터링)·US2(최종 클릭 로직)가 만든 컴포넌트를 스타일링/
  라벨링하므로 US1·US2 이후 진행
- **User Story 4 (Phase 6)**: US3까지의 스타일 기반 위에 반응형을 얹으므로 US3 이후 진행
- **Polish (Phase 7)**: 모든 User Story 완료 후 진행

### Within Each User Story

- Foundational: T001, T002, T004는 서로 다른 신규/독립 파일이라 병렬 가능. T003은 T001 이후, T005는
  T002 이후
- US1: 독립 UI 조각(T006) → 조립(T007) → 페이지네이션 연동(T008) → 페이지 통합(T009) → 정적 목업
  동기화(T010, T006 이후 병렬 가능)
- US2: T011 단독(같은 파일 연쇄 수정)
- US3: 라벨 교체(T012) → 스타일 확정(T013, T012와 병렬 가능) → 정적 목업 최종화(T014)
- US4: T015 단독(T013 이후)
- Polish: T016과 T017 병렬 가능

### Parallel Opportunities

- Foundational: T001, T002, T004 병렬 가능
- US1: T006 완료 후 T010은 T007~T009와 병렬 진행 가능(서로 다른 파일)
- US3: T012와 T013 병렬 가능
- Polish: T016과 T017 병렬 가능

---

## Parallel Example: Foundational

```bash
# 서로 다른 신규 파일이므로 함께 진행 가능:
Task: "lib/data/types.ts BlogCardData에 tags 추가 (T001)"
Task: "lib/data/tag-match.ts matchesAllTags 구현 (T002)"
Task: "lib/data/quick-search-presets.ts 프리셋 배열 정의 (T004)"
```

## Parallel Example: User Story 1

```bash
# T006(버튼 컴포넌트) 완료 후, 조립/통합과 정적 목업 동기화를 함께 진행 가능:
Task: "components/home/entry-stream.tsx 조립 (T007)"
Task: "core/home-dark.html, core/home-light.html 버튼 마크업 동기화 (T010)"
```

---

## Implementation Strategy

### MVP First (User Story 1만)

1. Phase 1: Setup (해당 없음, 즉시 통과)
2. Phase 2: Foundational 완료 (필수 — 모든 story를 막음)
3. Phase 3: User Story 1 완료
4. **STOP and VALIDATE**: US1 Checkpoint의 브라우저 검증(그리드 필터링 필수 게이트 포함)을 통과시킨다
5. 이 시점에서 이미 방문자는 QuickSearch 버튼으로 그리드를 필터링할 수 있다(MVP, 단 해제/라벨/모바일
   대응은 아직 없음)

### Incremental Delivery

1. Setup + Foundational → 데이터 계층 준비 완료
2. US1 추가 → 독립 검증(그리드 필터링 필수 게이트) → MVP
3. US2 추가 → 독립 검증(재클릭 해제·전환)
4. US3 추가 → 독립 검증(라벨 갱신·테마 일관성)
5. US4 추가 → 독립 검증(모바일 스크롤/줄바꿈)
6. Polish → quickstart.md 전체 재검증 + vercel-react-best-practices 감사

---

## Notes

- `[P]` task = 다른 파일, 완료되지 않은 task에 대한 의존성 없음
- `[Story]` 라벨은 task를 특정 user story에 매핑해 추적 가능하게 한다
- 각 task는 `npm run build` 통과를 완료 조건으로 갖는다(정적 HTML만 바꾸는 예외 제외)
- 각 phase의 Checkpoint는 `npm run build` + 브라우저 구동 검증(우선순위: `claude-in-chrome` →
  `playwright-cli` → `playwright` MCP) 둘 다 필요하다
- US1의 그리드 필터링 동작은 다른 항목이 통과해도 이 항목이 실패하면 해당 phase를 미완료로 간주하는
  필수 게이트다
- 각 phase 완료 시점마다 커밋해 story 단위로 독립 검증 가능한 상태를 유지한다
