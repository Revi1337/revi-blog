---

description: "Task list template for feature implementation"
---

# Tasks: 방문자 및 게시글 조회수 통계

**Input**: Design documents from `/specs/011-visitor-stats-widget/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md (모두 존재)

**Tests**: spec에 자동화 테스트가 명시적으로 요청되지 않았고, 프로젝트에 테스트 프레임워크가 없음(Constitution Principle I — `npm run build` + `playwright-cli` 실브라우저 검증이 기본). 아래엔 테스트 태스크 대신 각 스토리 체크포인트에 `playwright-cli` 기반 검증 태스크를 둔다. **`claude-in-chrome`은 이 프로젝트의 브라우저 검증에 사용하지 않는다 — 항상 `playwright-cli` 스킬을 사용할 것.**

**Organization**: spec.md의 User Story 우선순위(P1 → P2 → P3)에 따라 그룹화.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능 (다른 파일, 의존성 없음)
- **[Story]**: 어느 User Story에 속하는지 (US1/US2/US3)

## Path Conventions

Next.js 16 App Router 단일 프로젝트 (`app/`, `components/`, `lib/` — repository root 기준). plan.md의 Project Structure 그대로.

---

## Phase 1: Setup

**Purpose**: 신규 의존성 설치 및 환경 준비

- [X] T001 `package.json`에 `@upstash/redis`, `swr` 의존성을 추가하고 `npm install` 실행
- [X] T002 [P] `.env.local`(및 `.env.example`이 있다면 함께)에 Upstash Redis REST URL/토큰 환경변수 placeholder 추가

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 User Story가 의존하는 카운팅 파이프라인(Middleware + Redis 클라이언트 + 봇 필터)

**⚠️ CRITICAL**: 이 phase 완료 전까지 어떤 User Story도 시작할 수 없음

- [X] T003 [P] Upstash Redis 클라이언트 싱글턴을 `lib/stats/redis.ts`에 모듈 레벨로 hoist하여 생성 (server-hoist-static-io 규칙 준수)
- [X] T004 [P] User-Agent 정규식 기반 봇/크롤러 판별 함수를 `lib/stats/bot-detection.ts`에 생성 (research.md §3의 패턴 목록 반영)
- [X] T005 `middleware.ts`에 카운팅 로직 구현: `x-forwarded-for` 헤더로 IP 추출 → 봇이면 아래 로직 스킵(T004 사용) → `visited:{date}:{ip}` dedup 체크(data-model.md) → dedup 통과 시 `visits:total`·`visits:daily:{date}` 증가 → `/article/{slug}` 경로 매칭 시 `pageviews:{slug}` 무조건 증가 (depends on T003, T004)
- [X] T006 [P] 서버 사이드 조회 헬퍼 `getGlobalStats()`(total/today/yesterday)와 `getArticleViews(slug)`를 `lib/stats/get-stats.ts`에 구현 (depends on T003)

**Checkpoint**: `curl`로 페이지를 반복 요청하며 Redis 키(`visits:total`, `visits:daily:{date}`, `pageviews:{slug}`)가 dedup·증가 규칙대로 쌓이는지 직접 확인 가능한 상태.

---

## Phase 3: User Story 1 - 사이트 전역 방문자 수 확인 (Priority: P1) 🎯 MVP

**Goal**: 홈(`/`), 북마크(`/bookmark`) 등 아티클이 아닌 페이지에서 "총 방문자 수 / 오늘 방문자 수 / 어제 방문자 수"를 확인할 수 있다.

**Independent Test**: 서로 다른 IP로 홈/북마크에 접속해 세 지표가 실제 값과 일치하는지, 동일 IP 재방문 시 값이 변하지 않는지 확인.

### Implementation for User Story 1

- [X] T007 [P] [US1] `GET /api/stats` 라우트를 `app/api/stats/route.ts`에 구현 — `getGlobalStats()`를 호출해 `{ total, today, yesterday }` 반환 (depends on T006)
- [X] T008 [US1] `lib/stats/use-visitor-stats.ts`에 `swr` 기반 `useVisitorStats()` 훅 구현 (global-only 모드, `/api/stats` 호출) (depends on T007)
- [X] T009 [US1] `components/stats/visitor-stats-widget.tsx`에 `"use client"` 컴포넌트 구현 — `variant: "desktop" | "mobile"` prop, `useVisitorStats()`로 총/오늘/어제 3개 지표 렌더링, 로딩 중 hydration mismatch 없는 플레이스홀더 처리 (depends on T008)
- [X] T010 [P] [US1] `app/page.tsx`에 데스크탑 `<VisitorStatsWidget variant="desktop" />` 를 `HeroIntro`와 같은 높이로 배치 (fixed, 좌측 여백) (depends on T009)
- [X] T011 [P] [US1] `components/home/hero-intro.tsx`의 "WHOAMI:" 줄 아래에 모바일 `<VisitorStatsWidget variant="mobile" />` 인라인 삽입 (depends on T009)
- [X] T012 [P] [US1] `app/bookmark/page.tsx`에 데스크탑(고정, 홈의 Hero와 동일 높이)·모바일(콘텐츠 최상단 인라인) `<VisitorStatsWidget>` 두 인스턴스 모두 배치 (depends on T009)

**Checkpoint**: `playwright-cli`로 `/`, `/bookmark`를 데스크탑 폭(≥1280px)과 좁은 폭(<1280px) 양쪽에서 열어 3개 지표가 각각 올바른 위치(고정 좌측 / 인라인)에 보이는지, 다크·라이트 테마 양쪽에서 정상 렌더링되는지 확인. User Story 1은 이 시점에 독립적으로 완전히 동작함.

---

## Phase 4: User Story 2 - 게시글 조회수 확인 (Priority: P2)

**Goal**: 아티클 상세 페이지에서 전역 지표(총/오늘/어제 방문자 수)에 더해 "이 게시글의 조회수"까지 네 지표를 확인할 수 있다.

**Independent Test**: 특정 게시글에 여러 번(동일 IP 포함) 접속해 조회수가 접속 횟수만큼 dedup 없이 누적되는지, 같은 화면에 전역 지표 세 가지도 함께 표시되는지 확인.

### Implementation for User Story 2

- [X] T013 [US2] `GET /api/stats/[slug]` 라우트를 `app/api/stats/[slug]/route.ts`에 구현 — `getGlobalStats()` + `getArticleViews(slug)`를 합쳐 `{ total, today, yesterday, views }` 반환, 존재하지 않는 slug는 404 (depends on T006)
- [X] T014 [US2] `lib/stats/use-visitor-stats.ts`의 `useVisitorStats()`가 optional `slug` 인자를 받아 slug가 있으면 `/api/stats/{slug}`를 호출하도록 확장 (depends on T013, T008)
- [X] T015 [US2] `components/stats/visitor-stats-widget.tsx`가 `articleSlug` prop을 받아 4번째 지표("조회수", Eye 아이콘)를 조건부 렌더링하도록 확장 (depends on T009, T014)
- [X] T016 [P] [US2] `app/article/[slug]/page.tsx`에 데스크탑 `<VisitorStatsWidget variant="desktop" articleSlug={article.slug} />`를 `ArticleHeader`와 같은 높이로 배치 (depends on T015)
- [X] T017 [P] [US2] `components/article/article-header.tsx`의 기존 메타 정보 줄(날짜·수정일·읽는시간)에 모바일 `<VisitorStatsWidget variant="mobile" articleSlug={article.slug} />`를 Eye 아이콘 항목으로 같은 패턴으로 추가 (depends on T015)

**Checkpoint**: `playwright-cli`로 아티클 페이지를 양쪽 브레이크포인트에서 열어 네 지표가 모두 보이는지 확인. User Story 1과 2가 함께 독립적으로 동작함.

---

## Phase 5: User Story 3 - 제목 수정에도 끊기지 않는 조회수 (Priority: P3)

**Goal**: 게시글의 제목만 수정해도 누적 조회수가 끊기거나 리셋되지 않는다.

**Independent Test**: 조회수가 누적된 게시글의 마크다운 제목만 수정(slug 유지)하고, 조회수가 수정 전과 동일하게 유지되는지 확인.

### Implementation for User Story 3

- [X] T018 [US3] 이 요구사항은 새 코드가 아니라 T005/T013에서 이미 slug를 키로 쓴 설계(`pageviews:{slug}`)로 자연히 충족됨 — `quickstart.md` 시나리오 3에 따라 임의 게시글의 title만 수정(slug 유지) 후 `next dev` 재시작(AGENTS.md의 `content/articles/**` 캐싱 규칙)하고 `curl`로 `views` 값이 수정 전과 동일한지 수동 검증 — BellmanFord.md title 수정 후 재시작, views가 3→4(검증 curl 자체의 조회 +1)로 유지되어 리셋되지 않음을 확인, 원복 완료

**Checkpoint**: 세 User Story 모두 독립적으로 동작 확인됨.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 여러 스토리에 걸친 검증 및 컨스티튜션 게이트 확인

- [X] T019 [P] `npm run build` 실행 후 빌드 로그에서 `/`, `/bookmark`, `/article/[slug]`가 여전히 `○`/`●`(정적)로 표시되고 `ƒ`(동적)로 전환되지 않았는지 확인 (Constitution Principle I, spec FR-012)
- [X] T020 [P] `.claude/skills/vercel-react-best-practices/rules/`를 열어 `server-hoist-static-io`, `client-swr-dedup`, `rendering-hydration-no-flicker`, `bundle-dynamic-imports` 규칙에 대해 구현을 감사하고 위반 사항 수정 (Constitution Principle III, NON-NEGOTIABLE)
- [X] T021 `playwright-cli`로 `quickstart.md`의 시나리오 1~4(전역 카운터, 게시글 조회수, 제목 수정 안정성, 봇 제외)를 전부 실행해 end-to-end 검증 — **claude-in-chrome은 사용하지 않음** — curl로 시나리오 1/2/4, playwright-cli 재시작 검증으로 시나리오 3 확인, 전부 통과
- [X] T022 [P] `playwright-cli` 스크린샷으로 위젯의 다크/라이트 테마 양쪽 렌더링을 데스크탑·모바일 두 폭에서 확인 (Constitution Principle II 정신 준수) — 홈/북마크/아티클 × 데스크탑(1920)/모바일(390) × 다크/라이트 총 8개 스크린샷 확인, 모두 정상 렌더링

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 의존성 없음, 즉시 시작 가능
- **Foundational (Phase 2)**: Setup 완료 후 시작 — 모든 User Story를 BLOCK함
- **User Story 1 (Phase 3)**: Foundational 완료 후 시작 가능, 다른 스토리에 의존하지 않음 — 🎯 MVP
- **User Story 2 (Phase 4)**: Foundational 완료 후 시작 가능. US1의 `VisitorStatsWidget`(T009)을 확장하므로 T009 완료 후 진행이 자연스러우나, 독립적으로 테스트 가능함
- **User Story 3 (Phase 5)**: Foundational(T005) 완료 시 이미 설계상 충족 — 검증만 필요
- **Polish (Phase 6)**: 원하는 User Story가 모두 완료된 후

### Parallel Opportunities

- Setup: T002는 T001과 병렬 가능
- Foundational: T003, T004는 병렬 가능 (T005가 둘 다 의존)
- US1: T010, T011, T012는 T009 완료 후 서로 다른 파일이라 병렬 가능
- US2: T016, T017은 T015 완료 후 서로 다른 파일이라 병렬 가능
- Polish: T019, T020, T022는 서로 병렬 가능

---

## Parallel Example: User Story 1

```bash
# T009 완료 후 함께 실행 가능:
Task: "app/page.tsx에 데스크탑 VisitorStatsWidget 배치"
Task: "hero-intro.tsx에 모바일 VisitorStatsWidget 삽입"
Task: "bookmark/page.tsx에 데스크탑+모바일 VisitorStatsWidget 배치"
```

---

## Implementation Strategy

### MVP First (User Story 1만)

1. Phase 1(Setup) 완료
2. Phase 2(Foundational) 완료 — 카운팅 파이프라인이 실제로 Redis에 값을 쌓는지 `curl`로 확인
3. Phase 3(US1) 완료 — 홈/북마크에 3개 지표 노출
4. **STOP & VALIDATE**: `playwright-cli`로 US1 독립 검증
5. 이 시점에 배포해도 사이트 전역 방문자 위젯은 완전히 동작함

### Incremental Delivery

1. Setup + Foundational → 카운팅 인프라 준비 완료
2. US1 추가 → 독립 검증 → 배포 (MVP)
3. US2 추가 → 독립 검증 → 배포 (게시글 조회수까지 완성)
4. US3는 새 코드 없이 검증만 추가
5. Polish로 컨스티튜션 게이트(Principle I/III) 및 테마 검증 마무리

---

## Notes

- [P] 태스크 = 다른 파일, 의존성 없음
- 자동화 테스트 프레임워크가 없는 프로젝트이므로 각 체크포인트의 검증은 `playwright-cli` 스킬로 실제 브라우저 구동 — **claude-in-chrome은 사용하지 않는다**
- `content/articles/**`(마크다운) 관련 변경(T018)은 `next dev` 재시작 없이는 검증되지 않음(AGENTS.md/Constitution Principle I NON-NEGOTIABLE 서브룰)
- 커밋은 `commit` 스킬 컨벤션(한국어 subject/body, `-` 불릿, footer 없음)을 따를 것
