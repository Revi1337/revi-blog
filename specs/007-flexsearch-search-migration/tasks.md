---
description: "Task list for feature 007-flexsearch-search-migration"
---

# Tasks: FlexSearch 검색 엔진 마이그레이션

**Input**: Design documents from `/specs/007-flexsearch-search-migration/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: 자동화 테스트 task는 생성하지 않는다 — 이 프로젝트에는 테스트 러너가 없고 spec에도 테스트
요구가 없다(006과 동일한 전제). Constitution Principle I(Feature-Level Verification)이 요구하는
검증 방식은 `npm run build` + 실제 브라우저 구동이며, 이 문서의 모든 검증은 그 방식을 따른다.

**Organization**: Task는 spec.md의 User Story(P1~P3) 기준으로 그룹화되어 있어 각 story를 독립적으로
구현·검증할 수 있다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능(다른 파일, 완료되지 않은 task에 대한 의존성 없음)
- **[Story]**: 이 task가 속한 user story (US1, US2, US3)
- 모든 task 설명은 정확한 파일 경로로 끝나고, 그 뒤에 완료 조건을 명시한다.

## 검증 규칙 (모든 phase 공통)

1. **Task 단위**: 코드를 변경하는 모든 task는 완료 조건에 `npm run build` 통과가 포함된다. 이번
   기능은 `core/*.html`을 전혀 변경하지 않으므로(spec Assumptions, plan.md Constitution Check
   Principle II) 이 규칙에 예외가 없다.
2. **Phase 단위**: 각 phase의 **Checkpoint**는 (1) `npm run build` 통과, (2) 실제 브라우저로 해당
   phase의 사용자 시나리오를 구동 검증하는 두 단계를 모두 요구한다. 브라우저 검증 도구는 항상 다음
   우선순위로 선택한다 — **1순위 `claude-in-chrome`**(`mcp__claude-in-chrome__*` 도구) → 그 도구를
   쓸 수 없는 환경일 때만 **2순위 `playwright-cli`** 스킬 → 그마저 불가능할 때만 **3순위 `playwright`**
   라는 이름의 MCP 서버 도구. 상위 우선순위 도구가 사용 가능한데 임의로 하위 순위를 쓰지 않는다.
3. **결과 동일성 필수 게이트**: spec.md의 Success Criteria(SC-001~003)는 "마이그레이션 이전과 결과가
   100% 동일해야 한다"는 것 자체가 성공 기준이다. 그래서 US1·US2·US3 각 Checkpoint에는 다른 확인
   항목과 별개로 **"마이그레이션 전 결과와 후 결과를 실제로 대조해 하나도 다르지 않음을 확인"**하는
   항목을 **★ 필수 게이트**로 둔다 — 이 항목이 실패하면 그 phase는 나머지 항목이 전부 통과해도
   미완료로 간주한다.

## Path Conventions

plan.md의 Project Structure를 그대로 따른다 — 단일 Next.js 앱(App Router). 매칭 엔진 자체는
`lib/data/tag-match.ts`(공유 태그 인덱스)와 `components/search/flexsearch-engine.ts`(헤더 검색
엔진)에, 호출부 변경은 `components/search/{search-query,search-modal}.tsx`와
`components/home/entry-stream.tsx`에 위치한다.

---

## Phase 1: Setup

**Purpose**: 프로젝트 초기화

- [X] T001 `flexsearch@^0.8.212`를 `package.json`에 의존성으로 추가한다(`npm install flexsearch`).
      완료 조건: `npm run build` 통과.
      상태: 이미 완료됨 — `package.json`/`package-lock.json`에 이미 반영되어 있다(사전 조사
      단계에서 설치, `git status`로 확인 가능).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 세 User Story 전부를 막는 진짜 차단 요소

이번 기능은 Setup(T001) 외에 모든 story를 동시에 막는 공유 차단 요소가 없다 — 텍스트 검색(US1)과
태그 검색/QuickSearch(US2·US3)가 서로 다른 파일(`flexsearch-engine.ts`의 text 모드 vs
`lib/data/tag-match.ts`)에서 독립적으로 시작 가능하다. 별도 Foundational task 없이 바로 Phase 3
(User Story 1)로 진행한다.

---

## Phase 3: User Story 1 - 헤더 텍스트 검색 결과 동일성 (Priority: P1) 🎯 MVP

**Goal**: 헤더 Ctrl+K 검색에서 제목/본문 텍스트 검색이 flexsearch 기반으로 동작하되, 결과 집합과
순서(제목 매치 우선, 그룹 내 원래 순서)가 마이그레이션 이전과 완전히 동일하다.

**Independent Test**: 제목에만 있는 단어, 본문에만 있는 단어, 대소문자를 바꾼 단어를 각각 검색해
결과와 순서가 마이그레이션 전과 같은지 확인한다(태그 검색은 이 phase에서 아직 flexsearch로 바뀌지
않으므로 건드리지 않아도 계속 동작해야 한다).

### Implementation for User Story 1

- [X] T002 [US1] `components/search/flexsearch-engine.ts`를 신규 생성해 `createSearchEngine(entries:
      SearchIndexEntry[]): SearchEngine`을 구현한다(data-model.md — SearchEngine). `titleIndex`,
      `bodyIndex`를 각각 `new Index({ tokenize: "full" })`로 만들고 `entries[i]`를 배열 index `i`로
      `add`한다. `search(query)`의 텍스트 모드(`query.mode === "text"`)는 `titleIndex.search(term)`
      / `bodyIndex.search(term)`로 후보를 얻은 뒤 entries를 원래 순서로 순회하며 원본
      `entry.title.toLowerCase().includes(term)` / `entry.plainBody...includes(term)`으로 재검증해
      title-match/body-match로 상호 배타 분류한다(research.md #2). 태그 모드
      (`query.mode === "tag"`)는 이번 task에서는 기존 `lib/data/tag-match.ts`의 `matchesAllTags`를
      그대로 호출하는, 기존 `runTagSearch`와 동일한 네이티브 로직을 그대로 옮겨와 동작을 유지한다
      (US2에서 flexsearch 기반으로 교체 예정 — 이번 phase에서 태그 검색이 깨지면 안 되므로). 완료
      조건: `npm run build` 통과. 이 시점에는 새 파일만 추가되고 기존 파일은 아직 손대지 않으므로
      항상 빌드가 통과해야 한다.
- [X] T003 [US1] `components/search/search-query.ts`와 `components/search/search-modal.tsx`를 함께
      변경한다 — `search-query.ts`에서 `runTextSearch`/`runTagSearch`/`runSearch`를 제거하고
      `parseSearchQuery`/`highlightSegments`/`getMatchSnippet`만 순수 표시 유틸로 남긴다.
      `search-modal.tsx`는 `const engine = useMemo(() => createSearchEngine(searchIndex),
      [searchIndex])`로 엔진을 한 번만 빌드하고, 기존 `results` useMemo가
      `engine.search(parsedQuery)`를 호출하도록 교체한다(depends on T002). 두 파일은 서로 맞물려
      있다 — `search-modal.tsx`가 옛 `runSearch`를 import하고 있어 `search-query.ts`만 먼저 바꾸면
      빌드가 깨진다 — 그래서 하나의 task로 묶어 항상 두 파일이 함께 갱신된 상태로만 커밋한다.
      `components/search/search-results.tsx`, `search-trigger.tsx`, `use-search-shortcut.ts`는
      건드리지 않는다(spec FR-010, UI 무변경). 완료 조건: `npm run build` 통과.

**Checkpoint**: (1) `npm run build` 통과. (2) 브라우저(우선순위: `claude-in-chrome` →
`playwright-cli` → `playwright` MCP)로 아래를 구동 검증(quickstart.md 시나리오 1) — **★ 결과
동일성 대조는 필수 게이트, 실패 시 이 phase는 미완료로 간주**:
- 제목에 포함된 단어(예: `gRPC`)를 검색하면 제목 매치 아티클이 상단에 나타나는지, 대소문자를
  바꿔도(`grpc`/`GRPC`) 동일하게 매치되는지
- 본문에만 있는 단어를 검색하면 본문 발췌("↳ …")와 하이라이트(`<mark>`)가 정확한 매치 지점에
  나타나는지
- 제목과 본문에 동시에 매치될 수 있는 단어를 검색해, 해당 아티클이 제목 매치 그룹에만 한 번
  나타나고 중복되지 않는지
- 존재하지 않는 단어를 검색하면 "No results found."가 나오는지
- **★ 위 텍스트 검색 시나리오들의 결과(매치된 아티클 slug 집합과 순서)를 마이그레이션 이전 결과와
  직접 대조해 하나도 다르지 않은지**
- 회귀 확인: `#grpc` 같은 태그 검색이 이번 phase에서 아직 손대지 않았음에도 기존과 동일하게
  계속 동작하는지(T002에서 옮긴 네이티브 로직 그대로이므로 당연히 동일해야 함)

---

## Phase 4: User Story 2 - 헤더 태그 검색 결과 동일성 (Priority: P2)

**Goal**: `#태그` 검색(단일/공백 다중 토큰 AND)이 flexsearch 기반으로 동작하되, 결과 집합과 순서가
마이그레이션 이전과 완전히 동일하다.

**Independent Test**: 단일 태그, 서로 다른 아티클에 나뉜 다중 태그 AND, 존재하지 않는 태그 조합,
`#`만 입력한 경우를 각각 검색해 결과가 마이그레이션 전과 같은지 확인한다.

### Implementation for User Story 2

- [X] T004 [US2] `lib/data/tag-match.ts`에 `createTagIndex(items: { tags: string[] }[]): TagIndex`와
      `TagIndex.matchAll(requiredTags: string[]): Set<number>`를 추가한다(data-model.md —
      TagIndex) — `items[i].tags.join(" ")`를 배열 index `i`로 `add`한 `Index({ tokenize: "full"
      })`를 빌드하고, `matchAll`은 각 토큰을 개별 `index.search(token)`으로 조회한 뒤 교집합(AND)한
      `Set`을 반환한다(research.md #3). **기존 `matchesAllTags`는 이번 task에서 지우지 않고 그대로
      남겨둔다** — `components/home/entry-stream.tsx`(US3에서 전환 예정)가 아직 이 함수를 쓰고
      있어 지금 지우면 빌드가 깨진다. 완료 조건: `npm run build` 통과.
- [X] T005 [US2] `components/search/flexsearch-engine.ts`의 태그 모드(T002에서 임시로 옮겨온 네이티브
      로직)를 T004의 `createTagIndex`/`TagIndex.matchAll` 기반으로 교체한다 — 엔진 생성 시
      `createTagIndex(entries)`를 함께 만들어 두고, 태그 모드에서는 `rawTerm.split(/\s+/)`로 얻은
      토큰들을 `matchAll`에 넘겨 얻은 id 집합으로 entries를 원래 순서대로 필터링한다(depends on
      T004, T002). 완료 조건: `npm run build` 통과.

**Checkpoint**: (1) `npm run build` 통과. (2) 브라우저(`claude-in-chrome` → `playwright-cli` →
`playwright` MCP)로 아래를 구동 검증(quickstart.md 시나리오 2) — **★ 결과 동일성 대조는 필수
게이트**:
- `#grpc` 단일 태그 검색 시 `GRPC` 태그를 가진 모든 아티클이 랭킹 없이 원래 순서대로 나타나는지
- `#kafka spark`처럼 공백으로 구분된 다중 토큰을 AND로 매칭해, 두 태그를 모두 가진 아티클만
  나타나는지
- 서로 다른 아티클에만 각각 존재하는 두 태그를 조합하면(AND 미충족) 결과가 비는지
- 태그에 밑줄·점이 섞인 경우(예: `GO_1.21`)를 `#go_1`처럼 경계를 가로지르는 부분 문자열로 검색해도
  매치되는지
- `#`만 입력하면 힌트 대신 "No results found."가 표시되는지
- **★ 위 태그 검색 시나리오들의 결과(매치된 아티클 slug 집합과 순서)를 마이그레이션 이전 결과와
  직접 대조해 하나도 다르지 않은지**

---

## Phase 5: User Story 3 - 홈페이지 QuickSearch 필터 결과 동일성 (Priority: P3)

**Goal**: 홈페이지 QuickSearch 프리셋 버튼(GRPC / KAFKA+SPARK / OAUTH2+SECURITY)이 flexsearch 기반
태그 인덱스로 카드를 필터링하되, 결과가 마이그레이션 이전과 완전히 동일하다.

**Independent Test**: 각 프리셋 버튼을 순서대로 클릭·해제하며 필터링된 카드 집합이 마이그레이션
전과 같은지 확인한다.

### Implementation for User Story 3

- [X] T006 [US3] `components/home/entry-stream.tsx`를 변경한다 — `const tagIndex = useMemo(() =>
      createTagIndex(cards), [cards])`로 태그 인덱스를 만들고, 기존 `matchesAllTags(card.tags,
      activePreset.tags)` 필터링을 `tagIndex.matchAll(activePreset.tags)`로 얻은 id 집합 기준
      `cards.filter((_, i) => matchIds.has(i))`로 교체한다. `matchesAllTags` import를 제거한다
      (depends on T004). 완료 조건: `npm run build` 통과.

**Checkpoint**: (1) `npm run build` 통과. (2) 브라우저(`claude-in-chrome` → `playwright-cli` →
`playwright` MCP)로 아래를 구동 검증(quickstart.md 시나리오 3) — **★ 결과 동일성 대조는 필수
게이트**:
- `GRPC` 버튼 클릭 시 `GRPC` 태그를 가진 카드만 남는지
- `KAFKA + SPARK` 버튼 클릭 시 두 태그를 모두 가진 카드만 남는지
- 활성화된 버튼을 다시 클릭하면 필터가 해제되고 전체 카드로 복귀하는지
- `OAUTH2 + SECURITY` 버튼도 동일한 AND 규칙이 적용되는지
- **★ 위 QuickSearch 필터 시나리오들의 결과(필터링된 카드 slug 집합)를 마이그레이션 이전 결과와
  직접 대조해 하나도 다르지 않은지**

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 임시로 남겨뒀던 구 코드 정리, 전체 회귀 검증, Constitution Principle III 감사

- [X] T007 [P] `lib/data/tag-match.ts`에서 이제 아무도 호출하지 않는 `matchesAllTags`를 제거한다
      (T005, T006이 각각 헤더 태그 검색과 QuickSearch 양쪽을 `createTagIndex`로 전환 완료한 뒤에만
      안전 — depends on T005, T006). 프로젝트 컨벤션상 사용하지 않는 코드에 백워드 호환 shim을
      남기지 않는다. 완료 조건: `npm run build` 통과.
- [X] T008 [P] `specs/007-flexsearch-search-migration/quickstart.md`의 시나리오 1~3 + 엣지 케이스
      전체를 처음부터 끝까지 브라우저로 재검증한다(`claude-in-chrome` → `playwright-cli` →
      `playwright` MCP 우선순위) — 아포스트로피·하이픈·느낌표가 섞인 문장 검색, `showOnHomepage:
      false`인 `_syntax-preview` 아티클이 어디에도 노출되지 않는지, 키보드 내비게이션(↑↓,
      PageUp/PageDown, Home/End, Enter, Esc)이 회귀 없는지, 검색 입력이 끊김 없이 반응하는지까지
      포함한다. 완료 조건: quickstart.md의 모든 시나리오와 엣지 케이스 통과.
- [X] T009 [P] `.agents/skills/vercel-react-best-practices/rules/`를 실제로 열어, 이번에 작성/변경한
      `components/search/flexsearch-engine.ts`, `components/search/search-modal.tsx`,
      `lib/data/tag-match.ts`, `components/home/entry-stream.tsx`를 규칙 전체와 대조 감사한다
      (Constitution Principle III) — 특히 `useMemo`로 인덱스를 안정적인 prop(`searchIndex`/
      `cards`)을 key 삼아 한 번만 빌드하고 있는지(`rerender-*` 계열), `entry-stream.tsx`가 eager
      렌더 컴포넌트로서 flexsearch 신규 의존성을 추가한 것이 번들 크기 규칙(`bundle-*` 계열)에
      비추어 문제가 없는지(plan.md에서 이미 감수하기로 확정한 트레이드오프임을 근거로 판단) 확인하고,
      그 외 위반이 발견되면 그 자리에서 수정한다. 완료 조건: `npm run build` 통과 + 발견된 위반 모두
      수정 완료.
- [X] T010 최종 `npm run build`와 `npm run lint`를 통과 확인한다(전체 리그레션) (depends on
      T001-T009). 완료 조건: 둘 다 에러 없이 통과.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 없음 — 이미 완료됨(T001)
- **Foundational (Phase 2)**: 해당 없음 — Phase 3로 바로 진행
- **User Story 1 (Phase 3)**: Setup 완료 후 시작 가능. 다른 story에 의존하지 않음(MVP)
- **User Story 2 (Phase 4)**: US1이 만든 `flexsearch-engine.ts`(T002)의 태그 모드를 교체하므로
  US1 이후 진행
- **User Story 3 (Phase 5)**: US2가 `lib/data/tag-match.ts`에 추가한 `createTagIndex`(T004)를
  재사용하므로 US2의 T004 완료 후 진행 가능(T005까지 기다릴 필요는 없음 — T004만 있으면 됨)
- **Polish (Phase 6)**: 모든 User Story 완료 후 진행(T007은 US2·US3 둘 다 완료해야 안전)

### Within Each User Story

- US1: 엔진 신설(T002) → search-query.ts/search-modal.tsx 동시 교체(T003, T002 이후)
- US2: 공유 태그 인덱스 추가(T004, 기존 함수는 유지) → 엔진의 태그 모드 교체(T005, T004·T002 이후)
- US3: entry-stream.tsx 전환(T006, T004 이후 — T005는 기다리지 않아도 됨)
- Polish: 구 코드 제거(T007, T005·T006 이후) → 회귀 검증(T008)·감사(T009)는 T007과 병렬 가능 →
  최종 확인(T010, 전부 이후)

### Parallel Opportunities

- US3의 T006은 US2의 T004만 끝나면 시작할 수 있어, T005(엔진 태그 모드 교체)와 병렬로 진행 가능
- Polish: T008과 T009는 서로 다른 파일을 다루므로 T007 완료 후 병렬 가능

---

## Parallel Example: Polish

```bash
# T007(구 코드 제거) 완료 후, 회귀 검증과 규칙 감사를 함께 진행 가능:
Task: "quickstart.md 전체 시나리오 재검증 (T008)"
Task: "vercel-react-best-practices 감사 (T009)"
```

---

## Implementation Strategy

### MVP First (User Story 1만)

1. Phase 1: Setup 완료(이미 완료됨)
2. Phase 2: Foundational (해당 없음, 즉시 통과)
3. Phase 3: User Story 1 완료
4. **STOP and VALIDATE**: US1 Checkpoint의 브라우저 검증(결과 동일성 필수 게이트 포함)을 통과시킨다
5. 이 시점에서 헤더 텍스트 검색은 이미 flexsearch 기반이고 결과는 기존과 동일하다(MVP, 태그 검색과
   QuickSearch는 아직 네이티브 그대로)

### Incremental Delivery

1. Setup → 의존성 준비 완료
2. US1 추가 → 독립 검증(텍스트 검색 결과 동일성 필수 게이트) → MVP
3. US2 추가 → 독립 검증(태그 검색 결과 동일성 필수 게이트)
4. US3 추가 → 독립 검증(QuickSearch 결과 동일성 필수 게이트)
5. Polish → 구 코드 제거 + quickstart.md 전체 재검증 + vercel-react-best-practices 감사

---

## Notes

- `[P]` task = 다른 파일, 완료되지 않은 task에 대한 의존성 없음
- `[Story]` 라벨은 task를 특정 user story에 매핑해 추적 가능하게 한다
- 각 task는 `npm run build` 통과를 완료 조건으로 갖는다(이번 기능은 예외 없음)
- 각 phase의 Checkpoint는 `npm run build` + 브라우저 구동 검증(우선순위: `claude-in-chrome` →
  `playwright-cli` → `playwright` MCP) 둘 다 필요하다
- US1·US2·US3 각각의 "마이그레이션 전/후 결과 대조" 항목은 다른 항목이 통과해도 이 항목이 실패하면
  해당 phase를 미완료로 간주하는 필수 게이트다
- `lib/data/tag-match.ts`의 `matchesAllTags`는 US2~US3 전환 기간 동안 의도적으로 남겨두는 임시
  코드다(T004) — Polish(T007)에서 반드시 제거해 백워드 호환 shim으로 남지 않게 한다
- 각 phase 완료 시점마다 커밋해 story 단위로 독립 검증 가능한 상태를 유지한다
