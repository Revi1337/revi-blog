---

description: "Task list for 히어로 캐러셀 제거 및 자기소개 배너 교체"
---

# Tasks: 히어로 캐러셀 제거 및 자기소개 배너 교체

**Input**: Design documents from `/specs/010-hero-intro-banner/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md (모두 존재)

**Tests**: spec.md는 자동화 테스트 코드가 아니라 수동 검증(FR-012 — Phase마다 `npm run build` 재빌드 후 `playwright-cli` 브라우저 확인)을 요구한다. 따라서 각 User Story phase 끝에 "Contract/Integration test" 대신 이 수동 검증 task가 들어간다.

**Organization**: Tasks are grouped by user story (spec.md의 P1/P2/P2)로 독립적으로 구현·검증 가능하게 구성한다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 다른 파일이고 완료되지 않은 task에 의존하지 않아 병렬 실행 가능
- **[Story]**: 해당 task가 속한 user story (US1/US2/US3)
- 모든 task에 정확한 파일 경로 포함

## Path Conventions

이 프로젝트는 단일 Next.js 프로젝트로, 레포 루트 자체가 소스 루트다 (`src/` 분리 없음). 아래 경로는 모두 레포 루트 기준.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 콘텐츠 원본 준비

- [X] T001 `content/home/main.yaml` 생성 — `data-model.md`의 "Initial Content" 블록(`hero:` 키 아래 name/headline/philosophy 3항목, `[KR]` 접두어 제거, 중복 문장 제거 반영)을 그대로 파일에 작성

**Checkpoint**: 콘텐츠 원본 준비 완료 — Foundational phase에서 파싱 가능

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 User Story가 공통으로 필요로 하는 콘텐츠 파이프라인과 아이콘 매핑

**⚠️ CRITICAL**: 이 phase가 끝나기 전에는 어떤 User Story도 시작할 수 없다

- [X] T002 [P] `lib/content/hero.ts` 작성 — `content/home/main.yaml`을 `fs.readFileSync` + `yaml`의 `parse`로 읽어 `hero:` 키를 파싱하고, `data-model.md`의 Validation Rules(name/headline 비어있지 않음, philosophy 비어있지 않은 배열, 각 항목 icon/label/texts 필수)를 검증하는 `loadHeroContent()`를 export (`lib/content/bookmarks.ts`의 `loadBookmarkCategories()` 패턴을 그대로 따름)
- [X] T003 `lib/data/hero.ts` 작성 — `lib/content/hero.ts`의 `loadHeroContent()`를 재노출하는 `getHeroContent()` 얇은 래퍼 (`lib/data/bookmarks.ts`의 `getBookmarkCategories()` 패턴, T002 완료 후 진행)
- [X] T004 [P] `lib/data/types.ts`에 `HeroContent`(`name`, `headline`, `philosophy: PhilosophyItem[]`)와 `PhilosophyItem`(`icon`, `label`, `texts: string[]`) 타입 추가
- [X] T005 [P] `components/home/hero-icon.tsx` 작성 — `icon` 문자열(`visibility`/`settings_suggest`/`layers`)을 lucide-react 아이콘(`Eye`/`Settings2`/`Layers`)에 매핑하고 매핑 안 되는 값은 폴백 아이콘(예: `Sparkles`)을 쓰는 컴포넌트 (`components/bookmark/bookmark-icon.tsx`의 name→LucideIcon 매핑 테이블 + 폴백 패턴을 그대로 따름)

**Checkpoint**: 콘텐츠 파이프라인과 아이콘 매핑 준비 완료 — User Story 구현 시작 가능

---

## Phase 3: User Story 1 - 홈 화면에서 자기소개 배너 확인 (Priority: P1) 🎯 MVP

**Goal**: 히어로 캐러셀을 완전히 제거하고, 같은 자리에 헤드라인+철학 항목+프로필 이미지로 구성된 정적 배너를 표시한다. 자동 재생/좌우 이동/인디케이터 등 어떠한 인터랙션도 없어야 하고, Entry Stream 그리드와 내용이 겹치지 않아야 한다.

**Independent Test**: `quickstart.md`의 "Run & Verify (User Story 1)" 체크리스트 — 홈 화면에 캐러셀 조작 요소가 전혀 없고 헤드라인/철학/이미지만 표시되는지 확인

### Implementation for User Story 1

- [X] T006 [US1] `components/home/hero-intro.tsx` 작성 — `"use client"` 없는 Server Component. `getHeroContent()`로 받은 `HeroContent`를 받아 헤드라인(Pretendard 헤딩 스타일), philosophy 목록(`hero-icon.tsx`로 아이콘 렌더 + JetBrains Mono 라벨 + 설명 텍스트), 프로필 이미지(`next/image`로 `app/icon.png` 사용)를 렌더링. 컨테이너는 기존 캐러셀의 `rounded-xl bg-surface-container` 클래스는 유지하되 `aspect-[2/1]` 없이 padding 기반 콘텐츠 맞춤 높이로 구성 (이 단계에서는 텍스트/이미지를 세로로 쌓는 기본 레이아웃으로 충분 — 좌우 분할은 US2, 모바일 세부 사이징은 US3에서 다듬는다)
- [X] T007 [US1] `app/page.tsx` 수정 — `HeroCarousel` import와 `heroSlides` 파생 로직(`blogCards.slice(0, 3).map(...)`) 제거, `getHeroContent()`로 얻은 데이터를 `HeroIntro`에 전달하도록 교체
- [X] T008 [US1] `components/home/hero-carousel.tsx`, `components/ui/carousel.tsx` 삭제 (T007에서 더 이상 import되지 않음을 확인한 뒤 삭제 — `carousel.tsx`는 레포 전체에서 이 두 파일 외 사용처가 없음이 확인된 상태)
- [X] T009 [US1] `package.json`에서 `embla-carousel-react`, `embla-carousel-autoplay` 의존성 제거 후 `npm install` 실행 (T008에서 두 패키지를 참조하는 파일이 모두 삭제된 뒤 진행)
- [X] T010 [US1] `.agents/skills/vercel-react-best-practices/rules/`를 열람하고 `hero-intro.tsx`/`hero-icon.tsx`를 감사 (Constitution Principle III, NON-NEGOTIABLE) — 불필요한 `"use client"`가 없는지, `lib/content/hero.ts`의 정적 I/O가 모듈 스코프에서 한 번만 실행되는지 확인, 위반 발견 시 즉시 수정
- [X] T011 [US1] `npm run build` 재빌드 후 `playwright-cli`로 홈 화면을 열어 `quickstart.md`의 User Story 1 체크리스트를 확인 (spec FR-012 / Constitution Principle I — 개발 서버 핫리로드만으로 검증 갈음 불가)

**Checkpoint**: User Story 1 완료 — 캐러셀이 사라지고 정적 배너로 대체된 MVP가 독립적으로 동작

---

## Phase 4: User Story 2 - 데스크탑 폭에서 배너의 텍스트/이미지 레이아웃 (Priority: P2)

**Goal**: 데스크탑 폭에서 텍스트가 왼쪽, 프로필 이미지가 오른쪽에 고정 폭으로 배치되고, 창 폭이 넓어져도 이미지 크기는 유지된 채 텍스트 영역만 넓어진다.

**Independent Test**: `quickstart.md`의 "Run & Verify (User Story 2)" 체크리스트 — 데스크탑 폭(1200px 이상)에서 좌우 배치 확인, 창 폭 확장 시 이미지 크기 불변 확인

### Implementation for User Story 2

- [X] T012 [US2] `components/home/hero-intro.tsx` 수정 — `md:` 브레이크포인트 이상에서 `flex-row` 레이아웃 적용: 텍스트 블록은 `md:flex-1`로 남는 공간을 채우고, 프로필 이미지는 `md:shrink-0` + 고정 폭(약 200~240px, 예: `md:w-[220px]`)으로 지정
- [X] T013 [US2] `npm run build` 재빌드 후 `playwright-cli`로 데스크탑 폭(1200px 이상)에서 창 폭을 넓혀가며 `quickstart.md`의 User Story 2 체크리스트를 확인 (spec FR-012)

**Checkpoint**: User Story 1과 2가 함께 독립적으로 동작 — 데스크탑에서 좌우 분할 레이아웃 완성

---

## Phase 5: User Story 3 - 모바일 폭에서 배너 (Priority: P2)

**Goal**: 모바일 폭(375px)에서 프로필 이미지가 작게 위쪽에, 소개 문구가 그 아래에 세로로 쌓인다.

**Independent Test**: `quickstart.md`의 "Run & Verify (User Story 3)" 체크리스트 — 375px 폭에서 세로 스택 확인

### Implementation for User Story 3

- [X] T014 [US3] `components/home/hero-intro.tsx` 수정 — 브레이크포인트 접두어 없는 기본(모바일) 클래스를 `flex-col`로 확정하고 프로필 이미지 크기를 100~140px 범위(예: `w-28`)로 지정, `md:` 이상에서만 T012의 `flex-row`/고정폭이 적용되어 데스크탑 레이아웃과 충돌하지 않는지 확인
- [X] T015 [US3] `npm run build` 재빌드 후 `playwright-cli`로 뷰포트를 375px로 줄여 `quickstart.md`의 User Story 3 체크리스트를 확인 (spec FR-012)

**Checkpoint**: 모든 User Story(US1/US2/US3)가 독립적으로 동작

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 여러 User Story에 걸친 마무리 확인

- [X] T016 [P] `components/theme/theme-toggle.tsx`로 다크/라이트 테마를 전환하며 `hero-intro.tsx`가 동일 레이아웃·내용을 유지하고 색상만 바뀌는지 육안 확인 (spec FR-009/SC-005, Constitution Principle II)
- [X] T017 [P] 레포 전체에서 `embla`, `HeroCarousel`, `HeroSlide` 등 캐러셀 관련 잔여 참조가 없는지 grep으로 확인
- [X] T018 `npm run build` 최종 재빌드 후 `playwright-cli`로 `quickstart.md`의 모든 체크리스트(US1~US3 + Theme Check + Constitution Principle III Audit)를 처음부터 다시 확인

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 의존성 없음 — 즉시 시작 가능
- **Foundational (Phase 2)**: Setup 완료에 의존 — 모든 User Story를 블로킹
- **User Story 1 (Phase 3)**: Foundational 완료 후 시작 가능, 다른 User Story에 의존하지 않음 — MVP
- **User Story 2 (Phase 4)**: Foundational 완료 후 시작 가능하지만, `hero-intro.tsx`가 이미 존재해야 하므로 실질적으로 US1 완료 후 진행 (같은 파일을 다듬는 증분)
- **User Story 3 (Phase 5)**: 마찬가지로 US1(과 이상적으로 US2) 완료 후 `hero-intro.tsx`에 모바일 전용 클래스를 추가하는 증분
- **Polish (Phase 6)**: 모든 User Story 완료에 의존

### Within Each User Story

- Foundational의 데이터 계층(T002~T005) 없이는 US1의 `hero-intro.tsx`(T006)가 렌더링할 데이터가 없으므로 항상 선행
- US1 내부에서는 컴포넌트 작성(T006) → 페이지 교체(T007) → 캐러셀 파일 삭제(T008) → 의존성 제거(T009) → 감사(T010) → 검증(T011) 순서를 지켜야 빌드가 중간에 깨지지 않음
- US2/US3는 US1이 만든 동일한 `hero-intro.tsx` 파일을 그대로 다듬으므로 순차 진행이 자연스러움 (병렬 팀 작업 시 US2/US3를 동시에 진행하려면 `flex-col`/`flex-row` 클래스 충돌을 피하도록 사전 조율 필요)

### Parallel Opportunities

- Foundational의 T002, T004, T005는 서로 다른 파일이며 서로 의존하지 않아 병렬 가능 (T003은 T002의 export에 의존하므로 순차)
- Polish의 T016, T017은 서로 다른 관심사라 병렬 가능

---

## Parallel Example: Foundational Phase

```bash
# T002, T004, T005는 서로 다른 파일이므로 동시 진행 가능:
Task: "lib/content/hero.ts 작성 — main.yaml 파싱 + 검증"
Task: "lib/data/types.ts에 HeroContent/PhilosophyItem 타입 추가"
Task: "components/home/hero-icon.tsx 작성 — icon 매핑 컴포넌트"

# T002가 끝난 뒤 진행:
Task: "lib/data/hero.ts 작성 — lib/content/hero.ts 재노출"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup 완료 (T001)
2. Phase 2: Foundational 완료 (T002~T005) — CRITICAL, 모든 스토리를 블로킹
3. Phase 3: User Story 1 완료 (T006~T011)
4. **STOP and VALIDATE**: `quickstart.md` User Story 1 체크리스트로 독립 검증 — 이 시점에서 이미 "캐러셀 제거 + 중복 정보 제거"라는 이번 기능의 핵심 목적은 달성됨
5. 필요하면 여기서 배포/데모 가능 (레이아웃은 아직 세로 스택 수준)

### Incremental Delivery

1. Setup + Foundational → 파이프라인 준비 완료
2. User Story 1 추가 → 독립 검증 → MVP! (캐러셀 사라짐, 배너 등장, 인터랙션 0개)
3. User Story 2 추가 → 독립 검증 → 데스크탑 좌우 분할 완성
4. User Story 3 추가 → 독립 검증 → 모바일 세로 스택 확정
5. Polish → 다크/라이트 육안 확인 + 잔여 참조 정리 + 최종 재검증

---

## Notes

- [P] task = 서로 다른 파일, 미완료 task에 의존하지 않음
- [Story] 라벨은 spec.md의 User Story(P1/P2/P2)에 대응
- 자동화 테스트 코드는 이번 기능 범위에 없다 — 모든 검증은 `npm run build` 재빌드 + `playwright-cli` 수동 확인으로 대체한다 (spec FR-012)
- 각 Phase의 마지막 task는 반드시 재빌드 후 브라우저 확인이다 — 건너뛰지 않는다
- Constitution Principle III(vercel-react-best-practices 감사)는 T010에서 명시적으로 수행하며, 감사 없이 US1을 완료된 것으로 간주하지 않는다
