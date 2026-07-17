# Tasks: 정적 HTML 블로그 컴포넌트 재구현

**Input**: Design documents from `/specs/001-component-blog-rewrite/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: 이 feature는 자동화 테스트 스위트를 요청받지 않았으므로 별도 unit/integration 테스트 태스크는 없음. 대신 constitution Principle I(Feature-Level Verification, NON-NEGOTIABLE)에 따라 각 체크포인트와 Polish 단계에 npm 빌드 + playwright-cli 검증 태스크를, 픽셀 단위 비교가 필요한 곳(SC-001, SC-002)은 `playwright` MCP 스크린샷 검증 태스크를 포함한다.

**Organization**: spec.md의 User Story(모두 P1)별로 그룹화. US3(테마 전환), US4(공유 요소 일관성)는 US1/US2가 세운 구조 위에서 성립하는 성질이라, 새 컴포넌트를 만들기보다 그 구조가 실제로 요구사항을 만족하는지 검증하는 태스크 위주로 구성했다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능 (다른 파일, 의존성 없음)
- 파일 경로는 plan.md의 Project Structure를 따름

---

## Phase 1: Setup

**Purpose**: 프로젝트 초기화 및 기본 도구 구성

- [X] T001 Next.js(App Router, TypeScript) 프로젝트 초기화
- [X] T002 [P] Tailwind CSS 설치, class 기반 다크모드(`darkMode: "class"`) 설정 in `tailwind.config.ts`
- [X] T003 [P] shadcn/ui 초기화(`components.json`) 및 Button/Carousel/Pagination 프리미티브 설치 in `components/ui/`
- [X] T004 [P] Motion(motion.dev), `embla-carousel-autoplay`, `shiki` 의존성 설치
- [X] T005 [P] Inter/JetBrains Mono 폰트를 `next/font`로 설정 in `app/layout.tsx` (FR-010)
- [X] T006 [P] ESLint/Prettier 설정 — vercel-react-best-practices 컨벤션 반영

**Checkpoint**: 프로젝트가 빌드되고 기본 도구가 갖춰짐

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 User Story가 공통으로 의존하는 테마 메커니즘·데이터 레이어·공유 레이아웃

**⚠️ CRITICAL**: 이 phase가 끝나기 전엔 어떤 User Story도 시작할 수 없음

- [X] T007 `core/*.html`에서 dark/light 색상 토큰을 추출해 CSS 변수로 `app/globals.css`에 정의
- [X] T008 [P] 32px 그리드 배경 패턴 유틸리티를 `app/globals.css`에 정의 (FR-011, dark: 흰색 미세선 / light: 검정 미세선)
- [X] T009 [P] `lib/utils.ts`에 `cn()` 헬퍼 구현 (shadcn 컨벤션)
- [X] T010 [P] data-model.md 기반 타입 정의(Theme, NavLink, BlogCardData, Article, TocItem, MetricCard) in `lib/data/types.ts`
- [X] T011 [P] 샘플 네비게이션 데이터 작성 in `lib/data/nav.ts`
- [X] T012 [P] 샘플 아티클 데이터 작성 in `lib/data/articles.ts` (`core/article-detail-*.html` 콘텐츠 이관)
- [X] T013 `components/theme/theme-script.tsx` 구현 — `<html>` class 기반 다크모드 적용, FOUC 방지 인라인 스크립트 (research.md #4)
- [X] T014 [P] `components/layout/nav-bar.tsx` 구현 — sticky glassmorphism(FR-006), 스크롤해도 블러/투명 효과 유지(Edge Case), `NavLink[]` 렌더링 (depends on T009, T011)
- [X] T015 [P] `components/layout/footer.tsx` 구현 — "Revi Blog" 텍스트, 동적 저작권 연도, About/GitHub/LinkedIn 링크(FR-012)
- [X] T016 `app/layout.tsx`에서 theme-script, nav-bar, footer, 폰트, 그리드 배경 조립 (depends on T005, T013, T014, T015)

**Checkpoint**: 테마 메커니즘·공유 네비게이션/푸터·데이터 레이어 준비 완료 — User Story 구현 시작 가능

---

## Phase 3: User Story 1 — 홈 화면 열람 (Priority: P1) 🎯 MVP

**Goal**: 히어로 캐러셀과 블로그 카드 그리드가 포함된 홈 화면을 기존 `core/home-*.html`과 시각적·기능적으로 동일하게 제공

**Independent Test**: 홈 화면만 단독 빌드하여 브라우저에서 열고, 기존 HTML과 동일한 레이아웃·색상·인터랙션이 재현되는지 확인

- [X] T017 [P] [US1] `components/home/hero-carousel.tsx` — shadcn Carousel + `embla-carousel-autoplay`(delay: 8000) + Motion 전환, prev/next 버튼, 인디케이터 도트, 마지막 슬라이드 순환
- [X] T018 [P] [US1] `components/home/blog-card.tsx` — 호버 시 썸네일 scale, 제목 색상, 화살표 이동, dark 전용 텍스트 glow(FR-007)
- [X] T019 [US1] `components/home/blog-card-grid.tsx` — 3열 반응형 그리드 (depends on T018)
- [X] T020 [US1] `components/home/pagination.tsx` — shadcn Pagination 기반, 번호(1~12) + prev/next
- [X] T021 [US1] `app/page.tsx`에 NavBar/HeroCarousel/"Entry Stream" 섹션/BlogCardGrid/Pagination/Footer 조립 (depends on T017, T019, T020)
- [X] T022 [US1] 반응형 브레이크포인트(768px/1024px, 모바일 375px 기준 확인) 적용 — 카드 그리드 3→2→1열

**Checkpoint**: 홈 화면이 독립적으로 완성되고 기존 HTML과 대조 검증 가능 (quickstart.md 시나리오 1)

---

## Phase 4: User Story 2 — 아티클 상세 화면 열람 (Priority: P1)

**Goal**: 본문·사이드바·코드 블록·메트릭 카드가 포함된 아티클 상세 화면을 기존 `core/article-detail-*.html`과 동일하게 제공

**Independent Test**: 아티클 상세 화면만 단독 빌드하여 브라우저에서 열고, 기존 HTML과 동일한 레이아웃·컴포넌트·인터랙션이 재현되는지 확인

- [X] T023 [P] [US2] `components/article/article-header.tsx` — 카테고리 배지, 제목(Motion fade-in), 메타 정보
- [X] T024 [P] [US2] `components/article/code-block.tsx` — 터미널 스타일(3색 도트, 파일명 레이블) + Shiki 서버사이드 구문 강조 (research.md #3)
- [X] T025 [P] [US2] `components/article/metric-card-grid.tsx` — 3열 메트릭 카드, 호버 시 보더/레이블 색상 변경
- [X] T026 [P] [US2] `components/article/toc-sidebar.tsx` — sticky, 번호 매김, Motion 활성 상태 하이라이트
- [X] T027 [P] [US2] `components/article/article-nav.tsx` — 이전/다음 글, 호버 시 좌우 액센트 바
- [X] T028 [US2] `app/article/[slug]/page.tsx`에 2열 레이아웃(본문 8열 + 사이드바 4열) 조립 (depends on T023-T027)
- [X] T029 [US2] 피처드 이미지 grayscale→color 호버 전환(FR-008)
- [X] T029a [US2] 아티클 상세 본문에 `::selection` 스타일 정의 — 텍스트 선택 시 녹색 계열 배경/색상 (spec Edge Cases)
- [X] T030 [US2] 반응형(모바일 375px 기준) — 모바일에서 1열로, TOC 사이드바를 본문 아래로 이동

**Checkpoint**: 아티클 상세 화면이 독립적으로 완성되고 기존 HTML과 대조 검증 가능 (quickstart.md 시나리오 2)

---

## Phase 5: User Story 3 — Dark/Light 테마 전환 (Priority: P1)

**Goal**: 동일한 레이아웃·콘텐츠를 유지한 채 색상 팔레트만 전환됨을 보장

**Independent Test**: 테마를 전환한 뒤 동일 화면의 DOM 구조와 콘텐츠가 동일하고, 색상 팔레트만 변경되었는지 확인

- [X] T031 [US3] Foundational 공유 컴포넌트(nav-bar, footer)에 `dark:` Tailwind 변형 적용 — `core/*-dark.html` 팔레트(네온 그린 액센트)와 일치
- [X] T032 [US3] 홈 전용 컴포넌트(hero-carousel, blog-card, pagination)에 dark/light 색상 토큰 적용
- [X] T033 [US3] 아티클 상세 전용 컴포넌트(code-block, toc-sidebar, metric-card-grid)에 dark/light 색상 토큰 적용, dark 전용 터미널 글로우 효과 분기 처리
- [X] T034 [US3] quickstart.md 시나리오 3 수행 — `<html>` class 토글로 두 화면을 렌더링해 DOM 구조 동일성과 색상 전환만 일어나는지 확인

**Checkpoint**: 두 화면 모두 테마 전환 시 레이아웃 불변, 색상 팔레트만 변경됨을 실증 (SC-004)

---

## Phase 6: User Story 4 — 공유 UI 요소 일관성 (Priority: P1)

**Goal**: 공유 UI 요소를 한 곳에서 수정하면 4개 화면(홈 dark/light, 아티클 상세 dark/light) 모두에 반영됨을 보장

**Independent Test**: 공유 UI 요소(네비게이션 바 메뉴 텍스트)를 한 곳에서 수정한 뒤, 4개 화면 모두에서 변경이 반영되었는지 확인

- [X] T035 [US4] quickstart.md 시나리오 4 수행 — `nav-bar.tsx` 메뉴 텍스트를 1곳에서 수정 후 4개 화면 모두 반영 확인, 수정 되돌리기
- [X] T036 [US4] `footer.tsx` 링크 추가 테스트 후 되돌리기 — 모든 화면에 반영되는지 확인 (SC-003)
- [X] T036a [US4] `blog-card.tsx`의 호버 애니메이션을 1곳에서 수정 후 홈 dark/light 2개 화면 모두 반영되는지 확인, 되돌리기 (FR-004 — 카드/캐러셀/페이지네이션 계열 대표 검증)
- [X] T036b [US4] `code-block.tsx`의 터미널 헤더 스타일을 1곳에서 수정 후 아티클 상세 dark/light 2개 화면 모두 반영되는지 확인, 되돌리기 (FR-004 — 코드블록/메트릭카드/TOC 계열 대표 검증)

**Checkpoint**: 공유 컴포넌트가 단일 소스로 관리됨을 실증 완료

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: constitution Principle I(Feature-Level Verification)에 따른 최종 검증과 마무리

- [X] T037 [P] `npm run build` 실행, 경고/에러 0건 확인
- [X] T038 [P] `playwright-cli`로 quickstart.md 시나리오 1·2·5(반응형) 전체 재검증 (DOM/인터랙션 확인)
- [X] T038a [P] `playwright` MCP의 스크린샷 도구로 홈/아티클 상세 dark/light 4개 화면을 각각 캡처해 `core/*.html`과 픽셀 단위로 비교 (SC-001, SC-002 — constitution Principle I의 vision 검증)
- [X] T039 [P] `LazyMotion` + `domAnimation` 적용해 Motion 번들 크기 확인 (research.md #1)
- [X] T040 vercel-react-best-practices 룰 기준 코드 정리 및 재검토

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 의존성 없음 — 즉시 시작
- **Foundational (Phase 2)**: Setup 완료 후 — 모든 User Story를 BLOCK
- **User Story 1 (Phase 3)**: Foundational 완료 후, 다른 스토리 의존 없음
- **User Story 2 (Phase 4)**: Foundational 완료 후, 다른 스토리 의존 없음 (US1과 병렬 가능)
- **User Story 3 (Phase 5)**: US1과 US2의 컴포넌트가 존재해야 그 위에 dark: 변형을 적용/검증할 수 있음 — US1, US2 완료 후 시작
- **User Story 4 (Phase 6)**: 4개 화면(홈/아티클 × dark/light)이 모두 존재해야 검증 가능 — US1, US2, US3 완료 후 시작
- **Polish (Phase 7)**: 모든 User Story 완료 후

### Parallel Opportunities

- Phase 1의 [P] 태스크(T002-T006) 전부 병렬 가능
- Phase 2의 [P] 태스크(T008-T012, T014-T015) 병렬 가능
- Phase 3(US1)과 Phase 4(US2)는 서로 다른 파일을 다루므로 통째로 병렬 진행 가능 — 단, 둘 다 완료돼야 Phase 5(US3)를 시작할 수 있음
- Phase 3 내 T017/T018, Phase 4 내 T023-T027은 각각 병렬 가능

---

## Parallel Example: Phase 3 (User Story 1)

```bash
# Foundational 완료 후, US1 내에서 병렬 실행 가능한 것들:
Task: "components/home/hero-carousel.tsx 구현"
Task: "components/home/blog-card.tsx 구현"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1: Setup 완료
2. Phase 2: Foundational 완료 (필수 — 모든 스토리를 막음)
3. Phase 3: User Story 1 완료
4. **STOP and VALIDATE**: quickstart.md 시나리오 1로 홈 화면 단독 검증
5. 필요 시 이 상태로 데모 가능 (홈 화면 MVP)

### Incremental Delivery

1. Setup + Foundational → 기반 완료
2. User Story 1(홈) 추가 → 독립 검증 → MVP
3. User Story 2(아티클 상세) 추가 → 독립 검증
4. User Story 3(테마 전환) 검증 → US1+US2 위에서 dark/light 무결성 확인
5. User Story 4(공유 요소 일관성) 검증 → 4개 화면 동시 반영 실증
6. Polish → npm 빌드 + playwright-cli(DOM/인터랙션) + playwright MCP(픽셀 비교) 최종 검증(constitution Principle I)

---

## Notes

- US3/US4는 새 컴포넌트를 만들지 않고, Foundational + US1 + US2가 만든 구조가 요구사항(FR-003, FR-004, SC-003, SC-004)을 실제로 만족하는지 검증하는 태스크로 구성했다 — 이 프로젝트가 신규 CRUD 기능이 아니라 기존 화면의 1:1 포팅이라 각 스토리가 완전히 독립적인 새 기능이 아니기 때문이다.
- 자동화 테스트 스위트는 요청되지 않아 생성하지 않았고, 대신 constitution Principle I에 따라 각 체크포인트와 Phase 7에 npm 빌드 + playwright-cli 검증을, 픽셀 비교가 필요한 곳엔 playwright MCP 검증을 명시적으로 배치했다.
- Commit은 각 태스크 또는 논리적 그룹 완료 후 `commit` 스킬 컨벤션에 따라 진행한다.
