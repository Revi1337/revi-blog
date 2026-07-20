---

description: "Task list template for feature implementation"
---

# Tasks: Markdown 기반 아티클 콘텐츠 파이프라인

**Input**: Design documents from `/specs/003-markdown-article-pipeline/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/content-loader.md, quickstart.md

**Tests**: 별도 단위테스트는 요청되지 않음 — constitution.md Principle I에 따라 quickstart.md 시나리오를
`npm run build` + `playwright-cli` 실행으로 검증하는 태스크를 각 스토리/폴리시 단계에 포함한다.

**Organization**: User Story 단위(spec.md 우선순위: P1 콘텐츠 파이프라인 → P2 코드 라인 하이라이트 →
P3 TOC 자동화)로 그룹핑.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능 (다른 파일, 선행 의존 없음)
- **[Story]**: 이 태스크가 속한 user story (US1, US2, US3)

## Path Conventions

Next.js App Router 단일 프로젝트 — `content/`, `lib/`, `app/`, `components/`는 모두 저장소 루트 기준.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 신규 의존성 설치 및 디렉토리 골격 준비

- [X] T001 `npm install gray-matter unified remark-parse remark-gfm remark-rehype rehype-stringify rehype-pretty-code github-slugger reading-time unist-util-visit mdast-util-to-string` 실행 — `package.json`에 반영 (`shiki`는 이미 설치되어 있으므로 재설치하지 않음)
- [X] T002 [P] `content/articles/` 디렉토리 생성
- [X] T003 [P] `lib/content/plugins/` 디렉토리 생성

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 User Story가 공통으로 의존하는 콘텐츠 로딩 파이프라인 기반. 이 단계 완료 전에는
어떤 User Story도 시작할 수 없다.

**⚠️ CRITICAL**: constitution.md Principle III(vercel-react-best-practices 감사)는 신규 서버
컴포넌트/로더 코드를 "작성하기 전" 스킬 규칙 열람을 요구한다 — 반드시 T004를 가장 먼저 완료할 것.

- [X] T004 `.agents/skills/vercel-react-best-practices/rules/` 아래 규칙 파일을 실제로 열람 — 이후 lib/content/*, app/article/[slug]/page.tsx에 적용할 규칙 확인 (Constitution Principle III 선행 게이트)
- [X] T005 [P] `lib/content/frontmatter.ts` 구현 — gray-matter로 프론트매터 파싱, 필수 필드(`title`,`category`,`publishedAt`,`tags`) 누락 시 파일 경로+필드명을 포함한 Error throw, slug 누락 시 파일명 폴백 (data-model.md Validation Rules 1)
- [X] T006 [P] `lib/content/reading-time.ts` 구현 — `reading-time` + `mdast-util-to-string`으로 본문 텍스트 기반 readingTimeMinutes 계산, 프론트매터에 값이 있으면 그 값 우선
- [X] T007 [P] `lib/content/prev-next.ts` 구현 — `publishedAt` 내림차순 정렬 배열에서 인덱스 기준 prev/next(`ArticleNavRef`) 계산 (research.md prev/next 결정). **구현 중 발견**: 원본 데이터의 "홈 그리드 제외" 동작을 보존하려고 스펙 밖에서 `showOnHomepage` 프론트매터 필드(선택, 기본값 true)를 추가함 — 값이 있으면 그 값을, 없으면 true를 따르고, prev/next 체인도 showOnHomepage 아티클끼리만 계산한다. spec/data-model에는 미반영 상태이므로 정식 스펙화가 필요하면 별도 진행
- [X] T008 `lib/content/pipeline.ts` 구현 — unified 기반 base 파이프라인(`remark-parse` → `remark-gfm` → `remark-rehype` → `rehype-stringify`) 골격만 구성, 커스텀 플러그인은 아직 등록하지 않음
- [X] T009 `lib/content/loader.ts` 구현 — `content/articles/*.md` 전체를 읽어 T005/T007/T008을 조합해 `Article[]` 조립, slug 중복 시 충돌 파일 목록을 포함한 Error throw (data-model.md Validation Rules 2), contracts/content-loader.md의 `loadArticles()` 시그니처 준수 (depends on T005, T007, T008)
- [X] T010 `lib/data/articles.ts`를 `loadArticles()` 결과를 재노출하는 얇은 어댑터로 교체 — `getArticleBySlug`/`articles`/`blogCards` export 시그니처 유지, `CODE_BLOCK_PLACEHOLDER`/`CODE_BLOCK_SOURCE`/`METRICS_PLACEHOLDER` export 제거 (depends on T009)
- [X] T011 `app/article/[slug]/page.tsx`에서 `split()` 기반 플레이스홀더 조립 로직 제거, `article.bodyHtml`을 단일 `dangerouslySetInnerHTML` 블록으로 렌더링하도록 단순화 (depends on T010)

**Checkpoint**: 파운데이션 완료 — 이 시점부터는 아직 실제 콘텐츠(4개 아티클)가 없으므로 홈/상세
페이지는 빈 목록 상태일 수 있음. User Story 구현 시작 가능.

---

## Phase 3: User Story 1 - 콘텐츠 작성자가 마크다운 파일만으로 새 아티클을 발행한다 (Priority: P1) 🎯 MVP

**Goal**: `content/articles/*.md`가 유일한 콘텐츠 소스가 되고, 기존 하드코딩 아티클이 유실 없이
마이그레이션되며, 필수 필드 누락 시 빌드가 실패한다.

**Independent Test**: 새 `.md` 파일 추가 후 홈/상세 노출 확인(quickstart.md 1단계), 필수 필드 누락
파일로 빌드 실패 확인(quickstart.md 2단계).

**구현 중 발견**: `lib/data/articles.ts`에 실제로는 계획 수립 시점에 파악한 4개가 아니라 **7개**
아티클이 하드코딩되어 있었음(`serverless-break-the-monolith`, `gc-tuning-jvm-applications`,
`grpc-in-browser-based-applications`가 research/plan 조사에서 누락됨). FR-008(콘텐츠 유실 없음)에
따라 7개 전부 마이그레이션함.

### Implementation for User Story 1

- [X] T012 [P] [US1] `lib/content/plugins/remark-metrics.ts` 구현 — `lang === "metrics"`인 code mdast 노드를 감지해 `LABEL: VALUE` 줄을 파싱하고 `MetricCardGrid`와 동일한 hast 마크업으로 치환 (콜론 없는 줄은 무시, data-model.md MetricsBlockDirective)
- [X] T013 [US1] `lib/content/pipeline.ts`에 `remark-metrics` 플러그인 등록 (depends on T008, T012)
- [X] T014 [P] [US1] `content/articles/architecting-high-concurrency-distributed-systems.md` 마이그레이션 — 기존 `richBodyHtml`(lib/data/articles.ts) 내용을 헤딩/문단/목록 구조 유지한 마크다운으로 역변환, `__METRICS__` 자리는 `metrics` 코드펜스로 치환. **수정**: 원본 HTML에 남아있던 수동 번호("01. ", "02. " 등)는 TOC 자동 생성 순번과 중복되므로 헤딩 텍스트에서 제거
- [X] T015 [P] [US1] `content/articles/optimizing-postgresql-indexing-high-write-loads.md` 마이그레이션
- [X] T016 [P] [US1] `content/articles/kafka-streams-vs-spark.md` 마이그레이션
- [X] T017 [P] [US1] `content/articles/oauth2-from-scratch-security-audit.md` 마이그레이션
- [X] T017a [P] [US1] `content/articles/serverless-break-the-monolith.md` 마이그레이션 (구현 중 발견된 누락분)
- [X] T017b [P] [US1] `content/articles/gc-tuning-jvm-applications.md` 마이그레이션 (구현 중 발견된 누락분)
- [X] T017c [P] [US1] `content/articles/grpc-in-browser-based-applications.md` 마이그레이션 (구현 중 발견된 누락분)
- [X] T018 [US1] `lib/data/articles.ts`에 남아있던 마이그레이션 이전 하드코딩 잔여물(있다면)을 제거하고 어댑터만 남았는지 확인 (depends on T014-T017c) — 파일 전체를 `loadArticles()` 재노출 어댑터로 교체 완료
- [X] T019 [US1] `components/article/metric-card-grid.tsx` 삭제 — 사용처가 `remark-metrics` 출력으로 완전히 대체되었는지 확인 후 삭제 (depends on T013)
- [X] T020 [US1] quickstart.md 1단계 실행 — 임시 `.md` 파일 추가 후 `npm run build`, 홈 카드/상세 페이지 노출 확인, 임시 파일 삭제
- [X] T021 [US1] quickstart.md 2단계 실행 — 필수 프론트매터 필드 누락 파일로 빌드 실패 및 에러 메시지에 파일명+필드명 포함 확인, 임시 파일 삭제

**Checkpoint**: User Story 1 완전 동작 — 코드 수정 없이 `.md` 추가만으로 발행 가능, 기존 4개 아티클
모두 파일 기반으로 노출됨.

---

## Phase 4: User Story 2 - 독자가 코드 블록에서 특정 줄이 강조된 것을 본다 (Priority: P2)

**Goal**: 코드 블록에 `{n,n-n}` 라인 하이라이트가 적용되고, 다크/라이트 테마 양쪽에서 대비가
유지된다.

**Independent Test**: quickstart.md 3단계 — playwright-cli로 다크/라이트 각각 스크린샷 비교.

### Implementation for User Story 2

- [X] T022 [US2] `lib/content/pipeline.ts`에 `rehype-pretty-code` 플러그인 등록, `theme: { dark: "github-dark-default", light: "github-light-default" }` 지정 (depends on T008)
- [X] T023 [US2] `app/globals.css`에 dual-theme CSS 변수 매핑 규칙 추가: `[data-rehype-pretty-code-figure]`/`[data-rehype-pretty-code-title]`/`[data-highlighted-line]` 선택자로 카드 디자인(테두리, accent bar, 파일명 라벨, 라인 하이라이트) 재현 + `--shiki-light`/`--shiki-dark` 변수 매핑 — 기존 `.dark` class 기반 다크모드와 호환되는 선택자 형태 준수
- [X] T024 [US2] `components/article/code-block.tsx` 삭제 — `rehype-pretty-code` 출력이 `bodyHtml`에 이미 포함되어 사용처가 없어졌는지 확인 후 삭제 (depends on T022)
- [X] T025 [P] [US2] `content/articles/architecting-high-concurrency-distributed-systems.md`의 코드 예제(기존 `CODE_BLOCK_SOURCE`)에 라인 하이라이트 지시자(`{4-5}`)와 `title="stream_processor.go"` 메타를 추가해 원본 코드 유실 없이 이관
- [X] T026 [US2] quickstart.md 3단계 실행 — playwright-cli로 코드 블록 포함 아티클을 라이트/다크 각각 스크린샷, 강조 줄과 일반 줄의 대비 확인(둘 다 정상), 콘솔 에러 없음 확인

**Checkpoint**: User Story 1 + 2 모두 독립적으로 동작.

---

## Phase 5: User Story 3 - 독자가 목차(TOC)를 통해 긴 아티클을 탐색한다 (Priority: P3)

**Goal**: 본문 heading으로부터 TOC가 자동 생성되고, 수동 배열 작성이 더 이상 필요 없다.

**Independent Test**: quickstart.md 4단계 — TOC 항목 클릭 시 본문 스크롤 이동 확인.

### Implementation for User Story 3

- [X] T027 [US3] `lib/content/plugins/remark-toc.ts` 구현 — `unist-util-visit`으로 depth 2/3 heading mdast 노드를 순회, `github-slugger`로 id를 생성해 `data.hProperties.id`에 부여하면서 동시에 `TocItem[]`(순서·위계·id) 수집 (data-model.md TOC 결정)
- [X] T028 [US3] `lib/content/pipeline.ts`에 `remark-toc` 등록하고, `renderMarkdown()`이 `file.data.toc`를 반환해 `loader.ts`가 `Article.toc`에 연결 (depends on T009, T027)
- [X] T029 [US3] quickstart.md 4단계 실행 — TocSidebar 스크롤 스파이(active 항목 하이라이트) 동작 확인, `TocSidebar` 컴포넌트 변경 불필요 확인. **수정**: 원본 콘텐츠에 남아있던 수동 번호가 TOC 순번과 중복 표시되는 문제를 발견해 헤딩 텍스트에서 제거(T014 참고)

**Checkpoint**: 3개 User Story 모두 독립적으로 동작.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 전체 스토리를 아우르는 마무리 검증 및 정리

- [X] T030 quickstart.md 5단계 실행 — 홈 페이지 카드 목록에 6개 아티클(홈 노출 대상) 모두 노출, prev/next 네비게이션이 `publishedAt` 순서와 일치 확인(Kafka ← OAuth2 → PostgreSQL 등 원본과 동일 체인)
- [X] T031 vercel-react-best-practices 감사 — `lib/content/*`, `app/article/[slug]/page.tsx` 변경분을 T004에서 열람한 규칙 기준으로 재검토. 적용 확인: `server-hoist-static-io`(콘텐츠는 모듈 로드 시 1회 파싱), `server-no-shared-module-state`(모듈 레벨 캐시는 불변), `bundle-barrel-imports`(전 파일 직접 import, 배럴 없음). 위반 사항 없음
- [X] T032 `npm run build` 최종 실행, 에러 0건 확인 (Constitution Principle I) — 7개 아티클 전부 정적 페이지로 생성됨
- [X] T033 [P] `CODE_BLOCK_PLACEHOLDER`/`CODE_BLOCK_SOURCE`/`METRICS_PLACEHOLDER` 등 제거 대상 식별자가 코드베이스에 잔여 참조로 남아있지 않은지 grep으로 확인 — 잔여 참조 0건

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 의존성 없음 — 즉시 시작 가능
- **Foundational (Phase 2)**: Setup 완료 후 시작 — 모든 User Story를 블로킹
- **User Stories (Phase 3-5)**: Foundational 완료 후 시작 가능
  - US1은 다른 스토리 의존 없음
  - US2는 T008(pipeline.ts 골격)에만 의존 — US1과 병행 가능하나, 코드 마이그레이션 대상(T025)은 US1의 T014가 만든 파일을 편집하므로 실질적으로 T014 이후 진행 권장
  - US3도 T008/T009에만 의존 — US1/US2와 독립적으로 병행 가능
- **Polish (Phase 6)**: 원하는 모든 User Story 완료 후

### User Story Dependencies

- **US1 (P1)**: Foundational 이후 시작 — 다른 스토리 의존 없음, MVP
- **US2 (P2)**: Foundational 이후 시작 가능 — US1이 마이그레이션한 콘텐츠 파일을 편집하는 태스크(T025)가 있어 순서상 US1 이후 진행이 자연스러움
- **US3 (P3)**: Foundational 이후 시작 가능 — US1/US2와 독립적

### Parallel Opportunities

- Setup의 T002, T003은 병렬 가능
- Foundational의 T005, T006, T007은 서로 다른 파일이라 병렬 가능 (T008/T009/T010/T011은 순차)
- US1의 T014-T017(아티클 4개 마이그레이션)은 서로 다른 파일이라 병렬 가능
- US1(T012)과 US3(T027)은 서로 다른 파일이라 Foundational 완료 즉시 병렬 착수 가능

---

## Parallel Example: User Story 1

```bash
# Foundational 완료 후 병렬 착수:
Task: "lib/content/plugins/remark-metrics.ts 구현"
Task: "content/articles/architecting-high-concurrency-distributed-systems.md 마이그레이션"
Task: "content/articles/optimizing-postgresql-indexing-high-write-loads.md 마이그레이션"
Task: "content/articles/kafka-streams-vs-spark.md 마이그레이션"
Task: "content/articles/oauth2-from-scratch-security-audit.md 마이그레이션"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup 완료
2. Phase 2: Foundational 완료 (필수 — 모든 스토리를 블로킹)
3. Phase 3: User Story 1 완료
4. **STOP and VALIDATE**: quickstart.md 1~2단계로 US1 독립 검증
5. 이 시점에 이미 "코드에 아티클 하드코딩 금지"라는 핵심 가치는 달성됨

### Incremental Delivery

1. Setup + Foundational 완료 → 콘텐츠 파이프라인 기반 완성
2. US1 추가 → 독립 검증 → MVP 완성 (마크다운만으로 발행 가능)
3. US2 추가 → 독립 검증 (다크/라이트 코드 하이라이트)
4. US3 추가 → 독립 검증 (TOC 자동화)
5. Polish 단계에서 전체 회귀 확인 + Constitution 게이트(Principle I/III) 마감

---

## Notes

- `[P]` 태스크 = 서로 다른 파일, 선행 의존 없음
- `[Story]` 라벨은 추적성을 위한 것 — Setup/Foundational/Polish 단계에는 라벨을 붙이지 않음
- T004(vercel-react-best-practices 규칙 열람)는 constitution.md Principle III에 따라 반드시
  Foundational 단계 최초 작업으로 선행되어야 하며, T031(완료 전 감사)과 쌍을 이룬다
- 각 태스크 완료 후 커밋 권장 (commit 스킬 컨벤션 준수)
- 체크포인트마다 해당 User Story를 독립적으로 검증한 뒤 다음으로 진행
