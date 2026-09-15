# Tasks: Article Series Display

**Input**: Design documents from `/specs/016-article-series/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: 이 프로젝트엔 별도 유닛 테스트 스위트가 없다(constitution Principle I) — 모든 검증은 `npm run build` + `playwright-cli`(또는 스크린샷이 필요할 때만 playwright MCP)로 수행한다. 각 Phase의 마지막 태스크는 예외 없이 이 두 검증 중 필요한 것을 실행하는 태스크이며, **거기서 발견된 오류는 다음 태스크로 넘어가기 전에 반드시 해결해야 한다.**

**Organization**: spec.md의 User Story(P1/P1/P2/P3)별로 그룹화한다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능(다른 파일, 선행 의존성 없음)
- **[Story]**: 이 태스크가 속한 User Story(US1~US4). Setup/Foundational/Polish 태스크에는 붙이지 않는다.

## Path Conventions

기존 Next.js 앱(`app/`, `components/`, `lib/`, `content/`) 구조를 그대로 사용한다 — 별도 `src/`/`tests/` 트리 없음. `plan.md`의 Project Structure를 따른다.

---

## Phase 1: Setup — 검증용 더미 마크다운 아티클

**Purpose**: 실제 발행 글을 전혀 건드리지 않고 시리즈 기능의 모든 시나리오(2편짜리 시리즈, 1편짜리 시리즈, 다중 소속)를 검증할 수 있는 전용 픽스처를 만든다. `content/articles/_diagram.md`, `content/articles/_callout.md`와 동일한 "언더스코어 접두사 + `tags: [TEST]` + `show_on_homepage: false`" 더미 아티클 컨벤션을 따른다.

- [X] T001 [P] `content/articles/_series-alpha.md` 더미 아티클 생성 — frontmatter는 `title`, `date`, `tags: [TEST]`, `show_on_homepage: false`만 사용(`_callout.md` 형식 그대로). 이후 TOC 비회귀 검증(Phase 6)에 쓸 수 있도록 본문에 H2 헤딩을 5개 이상 포함한 목업 텍스트를 채운다. 시리즈 레지스트리에는 아직 등록하지 않는다.
- [X] T002 [P] `content/articles/_series-beta.md` 더미 아티클 생성 — 위와 동일한 frontmatter 컨벤션, 본문은 H2 헤딩 2~3개 정도의 짧은 목업 텍스트로 충분하다. 시리즈 레지스트리에는 아직 등록하지 않는다.
- [X] T003 Setup 검증: `npm run build` 실행 후 성공 확인, 이어서 `playwright-cli` 스킬로 `/article/_series-alpha`와 `/article/_series-beta`를 방문해 두 더미 아티클이 (아직 시리즈 박스 없이) 정상적으로 렌더링되는지 확인한다. **여기서 발견된 오류는 Phase 2로 넘어가기 전 반드시 해결한다.**

**Checkpoint**: 더미 픽스처 2개가 정상 발행 글과 동일하게 렌더링됨 — 이제 데이터 파이프라인 작업을 시작할 수 있다.

---

## Phase 2: Foundational — 시리즈 데이터 모델 & 빌드 타임 파이프라인 (Blocking Prerequisites)

**Purpose**: 모든 User Story가 공통으로 의존하는 데이터 계층. 이 Phase가 끝나기 전에는 어떤 User Story도 시작할 수 없다.

**⚠️ CRITICAL**: Phase 3 이후 모든 작업은 이 Phase 완료를 전제로 한다.

- [X] T004 [P] `lib/data/types.ts`에 `SeriesPreset`(`{ id, label, slugs: string[] }`), `SeriesMembership`(`{ id, label, index, total, episodes: ArticleNavRef[] }`) 타입을 추가하고, 기존 `Article` 인터페이스에 `series?: SeriesMembership[]` 필드를 추가한다(data-model.md 참고, 기존 `ArticleNavRef` 재사용). *(최초 설계는 `prev`/`next` 단일 참조 필드였으나, US2가 "전체 목록 페이지네이션"으로 바뀌면서 더 이상 쓰이지 않아 제거하고 `episodes`(전체 목록)로 대체했다.)*
- [X] T005 [P] `lib/data/series-presets.ts` 신규 생성 — `lib/data/quick-search-presets.ts`와 동일한 "중앙 정의 파일" 패턴으로 `seriesPresets: SeriesPreset[]`를 export한다. 초기 등록 데이터로 T001/T002의 더미 slug를 사용해 다음 두 시리즈를 등록한다: `{ id: "test-pair", label: "Test Pair Series", slugs: ["_series-alpha", "_series-beta"] }`, `{ id: "test-solo", label: "Test Solo Series", slugs: ["_series-alpha"] }` (alpha가 두 시리즈에 동시 소속되도록 구성 — US3 검증용).
- [X] T006 `lib/content/loader.ts`의 `loadArticles()` 파이프라인에 시리즈 attach 단계를 추가한다(`attachPrevNext` 호출과 같은 위치, 같은 함수형 스타일 — `prev-next.ts` 자체는 수정하지 않음). `seriesPresets`을 순회해 `Map<slug, SeriesMembership[]>` 역인덱스를 만들고(각 시리즈의 `slugs` 배열을 `{slug, title}` 목록으로 변환해 `episodes`로, 배열 인덱스로 `index`/`total`을 O(N)에 도출), 각 `Article`에 `series` 필드로 attach한다. T004, T005에 의존.
- [X] T007 `lib/content/loader.ts`에 시리즈 레지스트리 무결성 검증을 추가한다(`assertNoDuplicateSlugs`, `loader.ts:68-79`와 동일한 fail-fast 컨벤션 재사용) — `id` 중복, 빈 `slugs` 배열, 같은 시리즈 내부의 slug 중복, 로드된 아티클에 존재하지 않는 slug 참조를 빌드 타임 에러로 막는다. T006에 의존.
- [X] T008 Foundational 검증: `npm run build` 실행 후 성공 확인(T005에서 등록한 시리즈가 유효한 상태이므로 정상 통과해야 함), 이어서 `playwright-cli`로 아무 관계없는 기존 발행 글(예: `/article/Prim`) 하나를 방문해 `loader.ts` 변경이 기존 글에 회귀를 일으키지 않았는지 확인한다. **여기서 발견된 오류는 T009로 넘어가기 전 반드시 해결한다.**
- [X] T009 Foundational 무결성 검증(네거티브 케이스): `lib/data/series-presets.ts`의 `test-pair.slugs`에 일시적으로 존재하지 않는 slug(예: `"_series-nope"`)를 추가한 뒤 `npm run build`를 실행해 명확한 에러 메시지와 함께 빌드가 실패하는지 확인하고, 같은 방식으로 `slugs` 배열 안에 `"_series-alpha"`를 중복 기입했을 때도 빌드가 실패하는지 확인한다. 두 케이스 모두 확인 후 `series-presets.ts`를 T005 상태로 원상 복구하고 `npm run build`가 다시 성공하는지 재확인한다. **여기서 검증 로직에 결함이 발견되면(즉, 실패해야 할 케이스가 빌드를 통과하면) Phase 3로 넘어가기 전 T007로 돌아가 반드시 해결한다.**

**Checkpoint**: 시리즈 데이터가 빌드 타임에 정확히 계산되고, 잘못된 레지스트리 데이터는 빌드를 확실히 막는다 — 이제 UI User Story 작업을 시작할 수 있다.

---

## Phase 3: User Story 1 - 시리즈 소속과 순번 확인 (Priority: P1) 🎯 MVP

**Goal**: 독자가 상세 페이지에서 글이 속한 시리즈의 전체 목록과 그 안에서의 현재 위치를 확인할 수 있다.

**Independent Test**: `/article/_series-alpha` 방문 → 태그 아래 "Test Pair Series" 라벨의, 본문 폭을 채우는 접힌 박스 확인 → 클릭해 펼치면 전체 편 목록(1. Alpha, 2. Beta)이 나타나고 현재 편(Alpha)이 강조 표시됨.

- [X] T010 [US1] `vercel-react-best-practices` 스킬을 먼저 열어 신규 컴포넌트 작성 전 규칙을 확인한다(constitution Principle II, 사전 확인 단계).
- [X] T011 [P] [US1] `components/article/series-box.tsx` 신규 생성 — `SeriesMembership` 하나를 props로 받아 네이티브 `<details>/<summary>` 박스 하나를 렌더링한다. 본문(article body)과 동일한 폭을 채우는 카드형(`w-full`)이며, `<summary>`에는 접힌 상태에서도 보이는 `label`을 표시한다. 펼친 본문에는 `episodes` 전체를 번호 매긴 목록(`<ol>`)으로 렌더링하고, `index`와 일치하는 항목만 강조 스타일로 구분(다른 항목은 해당 slug로의 링크)한다. `open` 속성은 절대 지정하지 않는다(항상 기본값=닫힘, spec FR-003/FR-007).
  - *(구현 이력: 최초 버전은 "N / 총 M편" 텍스트 한 줄만 보여주는 작은 칩 형태로 만들었으나, 실제 화면을 확인한 사용자 피드백에 따라 본문 폭을 채우는 카드 + 전체 목록 렌더링으로 다시 작성했다.)*
- [X] T012 [US1] `components/article/article-header.tsx`에서 태그가 있는 `motion.div` 블록이 끝난 바로 다음(형제 위치, 같은 블록 안이 아님)에 `article.series`(배열, 없으면 렌더링 안 함 — spec FR-011)를 순회해 `SeriesMembership.id`를 key로 `series-box.tsx` 인스턴스를 세로로(`flex flex-col`) 렌더링하는 영역을 추가한다. T011에 의존.
- [X] T013 [US1] `vercel-react-best-practices` 스킬 규칙에 대해 T011/T012에서 작성한 코드를 감사하고, 위반이 발견되면 즉시 수정한다(constitution Principle II, 완료 전 감사 — 노트만 남기고 넘어가지 않는다).
- [X] T014 [US1] User Story 1 검증: `npm run build` 성공 확인 후 `playwright-cli`로 `/article/_series-alpha` 방문 → 태그 아래 "Test Pair Series"와 "Test Solo Series" 두 박스가 본문 폭을 채운 채 접혀 보이는지 확인 → "Test Pair Series" 박스를 클릭해 펼치고 "1. Series Preview Alpha"(강조)와 "2. Series Preview Beta"가 목록으로 보이는지 확인. **여기서 발견된 오류는 Phase 4로 넘어가기 전 반드시 해결한다.**

**Checkpoint**: User Story 1 단독으로 완전히 동작·검증 가능 — 이 시점이 MVP다.

---

## Phase 4: User Story 2 - 시리즈 목록에서 다른 편으로 이동 (Priority: P1)

**Goal**: 펼쳐진 시리즈 박스의 전체 목록에서 원하는 편을 선택해 이동할 수 있고, 10편을 초과하는 시리즈는 목록을 10개 단위로 페이지네이션할 수 있다.

**Independent Test**: `/article/_series-alpha`에서 박스를 펼쳐 목록의 "Series Preview Beta" 항목 클릭 → `/article/_series-beta`로 이동. 12편짜리 임시 시리즈에서는 박스를 펼치면 1-10이 보이고, `→` 클릭 시 11-12로 페이지가 넘어가며 다른 글로는 이동하지 않는다.

- [X] T015 [US2] `components/article/series-box.tsx`에 페이지네이션을 추가한다 — `episodes`를 10개씩 `chunk`하고, 현재 편(`index`)이 속한 페이지를 `useState`의 초기값으로 계산해(`Math.floor((index - 1) / PAGE_SIZE)`) 그 페이지부터 보여준다. 페이지가 2개 이상일 때만 "이전 10개 보기"/"다음 10개 보기" 버튼과 "{start}-{end} / {total}" 카운터를 노출하고, 첫/마지막 페이지에서는 해당 방향 버튼을 `disabled` 처리한다(spec FR-006/FR-013). 목록 항목 자체는 항상 `Link`로 해당 글로 이동한다(페이지네이션 버튼은 목록만 넘기고 다른 글로 이동하지 않는다). T011에 의존.
  - *(구현 이력: 최초 버전은 `SeriesMembership.prev`/`next` 단일 참조로 "이전 편 →"/"→ 다음 편" 링크 두 개만 보여줬으나, 사용자 피드백에 따라 "화살표는 다른 글로 이동이 아니라 목록 자체의 페이지네이션이어야 한다"는 요구로 다시 설계했다. `prev`/`next` 필드는 이제 쓰이지 않아 `SeriesMembership`에서 제거했다(data-model.md 참고).)*
- [X] T016 [US2] User Story 2 검증: `npm run build` 성공 확인 후 `playwright-cli`로 (a) `/article/_series-alpha`에서 박스를 펼쳐 목록의 "Series Preview Beta" 항목을 클릭 → `/article/_series-beta`로 정상 이동하는지 확인. (b) 레지스트리에 12개 slug짜리 임시 시리즈를 등록해(기존 real 아티클 slug를 임시로 빌려 쓰고 검증 후 제거) 박스를 펼쳤을 때 "1-10 / 12"가 보이고 좌측 버튼은 비활성, `→` 클릭 시 "11-12 / 12"로 넘어가며 좌측 버튼만 활성화되는지 확인. **여기서 발견된 오류는 Phase 5로 넘어가기 전 반드시 해결한다.**

**Checkpoint**: User Story 1 + 2가 함께 동작 — 시리즈 탐색의 핵심 가치가 완성된다.

---

## Phase 5: User Story 3 - 여러 시리즈에 속한 글의 독립적인 펼침/접힘 (Priority: P2)

**Goal**: 두 개 이상의 시리즈에 속한 글에서, 각 시리즈 박스를 독립적으로 펼치고 접을 수 있다.

**Independent Test**: `/article/_series-alpha`(두 시리즈에 동시 소속)에서 "Test Pair Series" 박스만 펼쳤을 때 "Test Solo Series" 박스는 계속 접힌 채로 유지.

- [X] T017 [US3] `components/article/article-header.tsx`의 시리즈 박스 순회 렌더링(T012)이 각 `series-box.tsx` 인스턴스에 안정적인 고유 key(`SeriesMembership.id`)를 부여하고 있는지 확인·보정한다 — 네이티브 `<details>`는 각 인스턴스가 자체 열림/닫힘 상태를 갖는 것이 기본 동작이므로, key가 올바르면 별도 상태 관리 코드 없이 독립성이 보장된다. 코드 변경이 필요 없다면(이미 T012에서 올바르게 구현됐다면) 이 태스크는 확인만으로 완료된다.
- [X] T018 [US3] User Story 3 검증: `npm run build` 성공 확인 후 `playwright-cli`로 `/article/_series-alpha`에서 두 박스가 모두 접힌 채로 시작하는지 확인 → "Test Pair Series" 박스만 클릭해 펼침 → "Test Solo Series" 박스가 계속 접힌 상태로 유지되는지 확인. **여기서 발견된 오류는 Phase 6으로 넘어가기 전 반드시 해결한다.**

**Checkpoint**: 다중 시리즈 소속 글에서도 시리즈 박스들이 서로 간섭하지 않는다.

---

## Phase 6: User Story 4 - 글 원문과 분리된 시리즈 관리 (Priority: P3)

**Goal**: 운영자가 마크다운 원문을 전혀 수정하지 않고도 `series-presets.ts`만 고쳐서 시리즈 소속/순서를 바꿀 수 있다.

**Independent Test**: `_series-alpha.md`/`_series-beta.md` 파일은 전혀 건드리지 않고 `series-presets.ts`의 `test-pair.slugs` 순서만 뒤집었을 때, 목록에 표시되는 두 글의 순번과 강조 위치가 그대로 뒤바뀐다.

- [X] T019 [US4] `lib/data/series-presets.ts`의 `test-pair.slugs`를 `["_series-alpha", "_series-beta"]`에서 `["_series-beta", "_series-alpha"]`로 일시적으로 바꾼다(마크다운 파일은 건드리지 않는다).
- [X] T020 [US4] User Story 4 검증: `git status`/`git diff`로 `content/articles/**`에 변경이 전혀 없음을 확인한 뒤 `npm run build` 성공 확인 → `playwright-cli`로 `/article/_series-beta`의 박스를 펼쳤을 때 목록이 "1. Beta(강조), 2. Alpha" 순서로 바뀌었는지, `/article/_series-alpha`에서는 "1. Beta, 2. Alpha(강조)" 순서로 바뀌었는지 확인. 확인 후 `series-presets.ts`를 T005/T019 이전 순서(`["_series-alpha", "_series-beta"]`)로 원상 복구하고 다시 빌드가 성공하는지 재확인한다. **여기서 발견된 오류는 Phase 7로 넘어가기 전 반드시 해결한다.**

**Checkpoint**: 모든 User Story(P1~P3)가 독립적으로 동작하며, 시리즈 관리가 글 원문과 완전히 분리되어 있음이 실증됐다.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 전체 기능에 걸친 회귀 검증 — 특히 이번 기능 전체에서 가장 중요한 제약인 TOC 비회귀를 별도로 깊게 확인한다.

- [X] T021 TOC 비회귀 심층 검증(research.md #7, spec FR-008/SC-004): `npm run build` 성공 확인 후 `playwright-cli`로 헤딩 5개 이상인 `/article/_series-alpha`를 방문해, 페이지 중간까지 스크롤한 상태에서 시리즈 박스를 펼쳐 문서 높이를 늘렸을 때 TOC 활성 항목이 엉뚱한 헤딩에 멈추거나 건너뛰지 않고, 이어서 스크롤했을 때 정확한 헤딩으로 계속 갱신되는지 확인한다. 이어서 TOC 항목을 클릭해 정상적으로 헤딩 위치로 이동하는지도 확인한다(시리즈 박스 도입 이전과 동일해야 함). `components/article/toc-sidebar.tsx`, `components/article/heading-scroll.ts`는 이 검증 과정에서도 수정하지 않는다 — 만약 회귀가 발견되면 원인을 series-box/article-header 쪽에서 찾아 해결한다. **여기서 발견된 오류는 T022로 넘어가기 전 반드시 해결한다.**
- [X] T022 새로고침 시 초기화 재확인(spec FR-007/SC-005): `playwright-cli`로 시리즈 박스를 하나 이상 펼친 뒤 페이지를 새로고침하고, 모든 박스가 다시 접힌 상태로 렌더링되는지 확인한다. **여기서 발견된 오류는 T023으로 넘어가기 전 반드시 해결한다.**
- [X] T023 [P] 변경 범위 최종 확인: `git diff`로 `lib/content/frontmatter.ts`, `components/article/toc-sidebar.tsx`, `components/article/heading-scroll.ts`에 변경이 없고, `content/articles/**` 아래 변경 파일이 T001/T002에서 만든 더미 2개뿐임을 확인한다(plan.md Constraints 재확인 — 기존 발행 글은 전혀 건드리지 않았어야 한다).
- [X] T024 `quickstart.md`에 정리된 전체 시나리오(Functional Validation 1~5, Regression Validation 1~3, Build-Time Integrity Validation)를 처음부터 순서대로 한 번 더 실행해 최종 확인한다 — `npm run build` + `playwright-cli`로 진행하며, **여기서 발견된 오류는 기능을 완료 처리하기 전 반드시 해결한다.**

**Checkpoint**: 모든 User Story 통과 + TOC/새로고침 비회귀 확인 + 변경 범위가 계획대로임을 확인 — 기능 완료.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 의존성 없음 — 바로 시작 가능.
- **Foundational (Phase 2)**: Setup 완료(T003) 후 시작 — 모든 User Story를 블로킹한다.
- **User Stories (Phase 3~6)**: 전부 Foundational(Phase 2, 특히 T009) 완료를 전제로 한다.
  - US1(Phase 3)은 다른 스토리에 의존하지 않는다.
  - US2(Phase 4)는 `series-box.tsx`(T011, US1에서 생성)를 확장하므로 US1 완료 후 진행한다.
  - US3(Phase 5)은 US1의 다중 렌더링 구조(T012)를 검증하는 성격이라 US1 완료 후 진행한다.
  - US4(Phase 6)는 Foundational의 레지스트리(T005~T009)만 있으면 되고 UI 코드에 의존하지 않지만, 순번/이동 링크가 화면에 정확히 반영되는지 확인하려면 US1+US2 완료 후 진행하는 것이 안전하다.
- **Polish (Phase 7)**: 모든 User Story 완료 후.

### Parallel Opportunities

- T001, T002 (더미 아티클 2개, 다른 파일) 병렬 가능.
- T004, T005 (타입 추가와 레지스트리 파일, 다른 파일) 병렬 가능 — 단 둘 다 T006의 선행 조건.
- T011은 [P] 표시되어 있지만 T010(스킬 사전 확인) 완료 후 시작한다.
- T023은 다른 Phase 7 태스크와 독립적으로 병렬 실행 가능.

---

## Parallel Example: Setup + Foundational

```bash
# Setup 단계 병렬 실행:
Task: "content/articles/_series-alpha.md 더미 아티클 생성 (T001)"
Task: "content/articles/_series-beta.md 더미 아티클 생성 (T002)"

# Foundational 단계 병렬 실행:
Task: "lib/data/types.ts에 SeriesPreset/SeriesMembership/Article.series 추가 (T004)"
Task: "lib/data/series-presets.ts 신규 생성 (T005)"
```

---

## Implementation Strategy

### MVP First (User Story 1까지)

1. Phase 1: Setup 완료 (T001~T003)
2. Phase 2: Foundational 완료 — 특히 T009 네거티브 케이스까지 (T004~T009)
3. Phase 3: User Story 1 완료 (T010~T014)
4. **STOP and VALIDATE**: T014의 독립 검증으로 시리즈 소속/순번 확인 기능이 단독으로 동작함을 확인
5. 이 시점이 이 기능의 MVP다 — 이동 링크·다중 소속·운영 워크플로우는 아직 없어도 핵심 가치(시리즈 인지)는 전달됨

### Incremental Delivery

1. Setup + Foundational → 데이터 파이프라인 완성
2. US1 추가 → 독립 검증 → MVP
3. US2 추가 → 독립 검증 → 시리즈 탐색 가치 완성
4. US3 추가 → 독립 검증 → 다중 소속 글도 안전
5. US4 추가 → 독립 검증 → 운영 워크플로우 실증
6. Polish → 전체 회귀 재확인 → 완료

## Notes

- [P] 태스크 = 다른 파일, 선행 의존성 없음
- 각 Phase의 마지막 태스크는 항상 `npm run build` + `playwright-cli`(픽셀 검증이 필요한 경우에만 playwright MCP) 검증이며, 여기서 발견된 오류는 다음 태스크/Phase로 넘어가기 전 반드시 해결한다 — 이 규칙에 예외는 없다.
- 실제 발행된 아티클(`content/articles/**`의 기존 파일)과 `lib/content/frontmatter.ts`, `components/article/toc-sidebar.tsx`, `components/article/heading-scroll.ts`는 이 기능의 어떤 태스크에서도 수정하지 않는다.
