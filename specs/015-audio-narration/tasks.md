# Tasks: 게시글 오디오 내레이션 재생

**Input**: Design documents from `/specs/015-audio-narration/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: 이 프로젝트엔 jest/vitest 같은 자동화 테스트 프레임워크가 없다(plan.md Technical
Context의 Testing 항목). 아래 "Tests are OPTIONAL"은 자동화 테스트 코드 작성 지시가 아니다 —
**Phase Verification Protocol**(바로 아래)이 이 프로젝트의 유일한 테스트 역할을 한다.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3) — Setup/Foundational/Polish는 라벨 없음
- Include exact file paths in descriptions

## Phase Verification Protocol (모든 Phase 말미 검증 태스크에 공통 적용)

각 Phase의 마지막 태스크는 그 Phase의 모든 선행 태스크에 의존하며, **다음 Phase의 어떤
태스크도 이 검증을 통과하기 전에는 시작하지 않는다**.

1. `npm run build` 실행 — 타입 에러/빌드 에러 없이 통과하는지 확인.
2. `playwright-cli` 스킬로 실제 브라우저를 띄워 그 Phase 범위의 Acceptance Scenario를
   수행한다. 렌더링된 픽셀을 눈으로 봐야 판단 가능한 경우(하단 플레이어의 시각적 배치,
   다크/라이트 테마 스타일 등)에는 `playwright-cli` 대신 `playwright` MCP 서버의 스크린샷
   도구를 쓴다.

**버그/이슈 발견 시 회귀 프로토콜**: 이 Phase 검증에서 버그가 발견되면 다음 Phase로
진행하지 않는다. 문제를 일으킨 것으로 보이는 태스크가 변경한 파일들을 그 태스크 구현
이전 상태로 되돌리고, 원인을 파악해 그 태스크를 다시 구현한 뒤, 이 Phase의 npm build +
브라우저 검증 전체를 처음부터 다시 통과해야 다음 Phase로 넘어갈 수 있다. 검증을 통과하지
못한 코드 위에 땜질식으로 다음 기능을 계속 쌓지 않는다.

---

## Phase 1: Setup

**Purpose**: 변경 전 기준선(baseline) 확정 — 이 기능은 신규 npm 의존성이 없으므로(research.md
§3, §4) 별도 스캐폴딩 없이 baseline만 세운다.

- [X] T001 신규 의존성 없음 확인: `package.json` 변경 불필요함을 research.md §3(`next/dynamic`
      지연 로드)·§4(`<audio>` 네이티브 제어) 결정과 대조해 재확인한다.

### Phase 1 검증 게이트

- [X] T002 **[Setup 검증]** Phase Verification Protocol 수행 — 범위: 아직 아무 코드도 바뀌지
      않았으므로 (1) `npm run build`가 현재 상태에서 깨끗하게 통과하는지, (2) `playwright-cli`로
      썸네일이 있는 아티클 상세 페이지 하나를 열어 메타 줄(날짜/수정일/읽는시간/조회수/썸네일
      버튼)이 기존 그대로 정상 렌더되는지만 확인한다. 이 결과가 이후 모든 Phase의 회귀 판단
      기준선이 된다.

**Checkpoint**: 변경 전 baseline 확정.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 User Story가 의존하는 `article.audio` 데이터 배관 — `thumbnail` 필드가
처리되는 세 지점과 동일한 형태로 확장한다(data-model.md).

**⚠️ CRITICAL**: 이 Phase가 끝나기 전에는 어떤 User Story 작업도 시작하지 않는다.

- [X] T003 [P] `lib/content/frontmatter.ts`의 `ArticleFrontmatter` 인터페이스에
      `audio?: string` 필드 추가 (기존 `thumbnail?: string` 옆, 별도 검증 스키마 없음).
- [X] T004 [P] `lib/data/types.ts`의 `Article` 인터페이스에 `audio?: string` 필드 추가
      (`BlogCardData`에는 추가하지 않음 — data-model.md 참고).
- [X] T005 `lib/content/loader.ts`에 `audio: frontmatter.audio` 매핑 한 줄 추가(기존
      `thumbnail: frontmatter.thumbnail` 옆). *(depends on T003, T004)*

### Phase 2 검증 게이트

- [X] T006 **[Foundational 검증]** Phase Verification Protocol 수행 — 범위: 아직 UI 소비
      코드가 없으므로 (1) `npm run build` 타입 통과(새 필드가 `Article`/`ArticleFrontmatter`
      양쪽에 일관되게 반영됐는지), (2) `playwright-cli`로 임의 아티클 상세 페이지가 T002와
      동일하게 정상 로드되는지(회귀 없음)만 확인한다. *(depends on T003, T004, T005)*

**Checkpoint**: `article.audio` 데이터가 프론트매터 → Article 객체까지 안전하게 흐름.

---

## Phase 3: User Story 1 - 오디오로 게시글 청취하기 (Priority: P1) 🎯 MVP

**Goal**: 내레이션 오디오가 지정된 게시글에서 재생 버튼을 눌러 재생을 시작하고, 하단 고정
컨트롤로 일시정지·탐색·배속 조절·닫기를 수행할 수 있다.

**Independent Test**: 오디오가 지정된 아티클 상세 페이지에서 재생 버튼 클릭 → 하단 플레이어
등장·재생 → 일시정지/재개·탐색·배속 변경·닫기가 모두 의도대로 동작하는지 확인.

### Implementation for User Story 1

- [X] T007 [P] [US1] `components/article/use-audio-playback.ts` 커스텀 훅 작성 —
      `HTMLAudioElement` ref를 받아 재생/일시정지, `currentTime` seek, `playbackRate` 순환
      (1× → 1.25× → 1.5× → 2× → 1×), `loadedmetadata`로 `duration` 확정을 제공한다.
      `timeupdate`는 React state로 흘리지 않고 콜백으로 노출해 호출부가 직접 DOM에 반영하게
      한다(research.md §4, `rerender-use-ref-transient-values.md`). 언마운트 시 `pause()` +
      리스너 정리를 반환 cleanup에서 수행한다.
- [X] T008 [P] [US1] `components/article/article-audio-button.tsx` 작성 — `article-thumbnail-button.tsx`와
      동일한 스타일(아이콘만, `size-4`, `text-primary dark:text-primary-container`, 테두리
      없음)의 재생 트리거 버튼. `onClick` prop만 받는 순수 프레젠테이션 컴포넌트.
- [X] T009 [US1] `components/article/article-audio-player.tsx` 작성 — 뷰포트 하단 고정
      플레이어. 재생/일시정지 토글, 경과 시간(ref로 직접 DOM write), 총 시간, 탐색 가능한
      진행 막대, 배속 순환 버튼, 닫기 버튼을 포함한다. T007의 훅을 사용하고,
      `createPortal(..., document.body)`로 렌더해 `ArticleHeader`의 framer-motion
      애니메이션 조상으로 인한 fixed-포지션 containing-block 문제를 피한다(research.md §2, §6).
      *(depends on T007)*
- [X] T010 [US1] `components/article/article-header.tsx` 통합:
      - `PlaybackState`(`isOpen`, `isPlaying`, `playbackRate` 등, data-model.md)를
        `ArticleHeader`가 직접 소유(새 Context 없음, research.md §2).
      - 메타 줄에 `ArticleAudioButton`을 `article.audio` 있을 때만 조건부 렌더 — 기존
        `updatedAtIndex → readingTimeIndex → thumbnailIndex` 트래킹 순서를
        `updatedAtIndex → readingTimeIndex → audioIndex(article.audio 있을 때) →
        thumbnailIndex(article.thumbnail 있을 때)`로 재정렬하고 `trackedItemCount`에
        `article.audio ? 1 : 0`을 더한다(기존 `Separator` + `useWrapDetection` 패턴 재사용,
        새 패턴 고안 금지).
      - `ArticleAudioPlayer`(T009)를 `next/dynamic({ ssr: false })`로 지연 로드하고
        `isOpen`일 때만 렌더 — `nav-bar.tsx`의 `SearchModal` 지연 로드 패턴과 동일
        (`bundle-dynamic-imports.md`).
      - 닫기 시 `currentTime`은 보존(같은 페이지에 머무는 동안 이어듣기, FR-012), 컴포넌트
        언마운트 시에는 자연히 소멸.
      *(depends on T007, T008, T009, T005)*

### Phase 3 검증 게이트

- [X] T011 **[US1 검증]** Phase Verification Protocol 수행 — 범위: quickstart.md의 사전 준비
      (`thumbnail`이 있는 테스트 아티클 하나에 `audio:` frontmatter 추가 + **`next dev` 재시작
      필수**, `content/articles/**` 캐싱 규칙)를 먼저 수행한 뒤, spec.md User Story 1의
      Acceptance Scenarios 1~6(재생 시작, 스크롤 중 고정, 일시정지/재개, 진행 막대 탐색,
      배속 변경, 닫기)을 전부 `playwright-cli`로 실제 수행한다. 하단 플레이어의 시각적
      배치는 `playwright` MCP 스크린샷으로 눈으로 확인한다. *(depends on T010)*

**Checkpoint**: User Story 1이 독립적으로 완전히 동작·검증 가능.

---

## Phase 4: User Story 2 - 게시글 단위로 오디오 제공 여부 결정하기 (Priority: P2)

**Goal**: 오디오를 지정한 게시글에만 재생 버튼이 나타나고, 지정하지 않은 게시글에는 재생
관련 UI가 전혀 노출되지 않는다.

**Independent Test**: 오디오가 지정된 글과 지정되지 않은 글을 나란히 열어 후자에는 어떤
재생 UI도 없는지 확인.

### Implementation for User Story 2

이 요구사항(FR-001/FR-002 조건부 노출)은 T010에서 `article.audio` 유무에 따른 조건부 렌더로
이미 구현되어 있다 — 별도 구현 태스크 없음. 아래 검증 게이트로 그 사실을 공식 확인한다.

### Phase 4 검증 게이트

- [X] T012 **[US2 검증]** Phase Verification Protocol 수행 — 범위: spec.md User Story 2의
      Acceptance Scenarios를 `playwright-cli`로 수행 — (1) `audio`가 있는 글에서 버튼 노출,
      (2) `audio`가 없는 글에서는 메타 줄뿐 아니라 페이지 어디에도 재생 버튼/플레이어 DOM이
      전혀 존재하지 않음(단순히 안 보이는 게 아니라 마운트조차 안 됨)을 확인한다.
      *(depends on T011)*

**Checkpoint**: User Story 1과 2가 모두 독립적으로 동작.

---

## Phase 5: User Story 3 - 기존 메타 정보와 일관된 위치에 재생 버튼 배치 (Priority: P3)

**Goal**: 재생 버튼이 조회수 다음, 썸네일 버튼보다 앞에 위치한다.

**Independent Test**: 오디오와 썸네일이 모두 있는 글의 메타 줄에서 "조회수 → 재생 버튼 →
썸네일 버튼" 순서를 확인.

### Implementation for User Story 3

이 요구사항(FR-003 배치 순서)은 T010의 트래킹 인덱스 재정렬에서 이미 구현되어 있다 — 별도
구현 태스크 없음. 아래 검증 게이트로 그 사실을 공식 확인한다.

### Phase 5 검증 게이트

- [X] T013 **[US3 검증]** Phase Verification Protocol 수행 — 범위: 오디오와 썸네일이 모두
      지정된 글의 메타 정보 줄을 `playwright-cli`(필요 시 `playwright` MCP 스크린샷)로 확인해
      항목이 "조회수 → 재생 버튼 → 썸네일 버튼" 순서로 나열되는지, 줄바꿈 시에도 순서/구분자가
      깨지지 않는지 확인한다. *(depends on T012)*

**Checkpoint**: 모든 User Story가 독립적으로 동작.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 전체 회귀 스윕과 마무리.

- [X] T014 [P] 코드 정리: `article.audio`/`ArticleFrontmatter.audio` 필드에 `thumbnail`
      옆의 것과 같은 스타일의 짧은 JSDoc 주석 추가("없으면 재생 UI 노출 안 함" 등), 신규
      파일(`use-audio-playback.ts`, `article-audio-button.tsx`, `article-audio-player.tsx`)에
      불필요한 주석/미사용 import 없는지 점검.
- [X] T015 quickstart.md의 "되돌리기" 단계 수행 — 검증용으로 추가한 테스트 아티클의
      `audio:` frontmatter를 실사용 목적이 아니라면 제거하고 `next dev` 재시작.
      *(depends on T013)*

### Phase 6 검증 게이트

- [X] T016 **[Polish 최종 검증]** Phase Verification Protocol 수행 — 범위: spec.md 전체
      Acceptance Scenario 재확인 + Edge Cases(깨진 오디오 URL, 재생 중 다른 페이지 이동,
      재생 종료 후 상태, 좁은 모바일 화면에서의 겹침) 전부, 데스크탑/모바일 두 브레이크포인트 ×
      다크/라이트 테마 조합을 모두 훑는다. `playwright` MCP 스크린샷으로 각 조합의 시각적
      스타일이 기존 메타 줄 아이콘들과 일관되는지 확인한다. *(depends on T014, T015)*

**Checkpoint**: 기능 완료, 배포 가능.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 의존성 없음 — 즉시 시작 가능.
- **Foundational (Phase 2)**: Setup 완료(T002)에 의존 — 모든 User Story를 막는다.
- **User Story 1 (Phase 3)**: Foundational(T006) 완료 후 시작.
- **User Story 2 (Phase 4)**: US1 검증(T011) 완료 후 — 별도 구현 없이 검증만 하므로 US1 완료를 전제.
- **User Story 3 (Phase 5)**: US2 검증(T012) 완료 후 — 마찬가지로 검증만.
- **Polish (Phase 6)**: US3 검증(T013) 완료 후.

이 기능은 세 User Story가 전부 동일한 통합 지점(T010, `article-header.tsx`)에서 구현되므로
스펙의 우선순위(P1→P2→P3)를 그대로 반영해 **순차 진행**을 권장한다(팀을 나눠 병렬로 작업할
실익이 없음 — Parallel Team Strategy 해당 없음).

### Within Each Phase

- Foundational: T003([P])과 T004([P])는 병렬, T005는 둘 다 끝난 뒤.
- User Story 1: T007([P] 훅)과 T008([P] 버튼)은 병렬, T009는 T007 완료 후, T010은 T007·T008·T009
  전부 완료 후.
- 각 Phase의 검증 게이트(T002/T006/T011/T012/T013/T016)는 항상 그 Phase의 마지막 태스크이며 병렬 불가.

### Parallel Opportunities

- Phase 2: T003, T004 동시 진행 가능.
- Phase 3: T007, T008 동시 진행 가능.
- 그 외 모든 태스크는 선행 태스크 완료를 전제로 순차 진행.

---

## Parallel Example: Phase 2 / Phase 3

```bash
# Phase 2 — 서로 다른 파일, 의존성 없음:
Task: "lib/content/frontmatter.ts에 audio?: string 추가"
Task: "lib/data/types.ts에 audio?: string 추가"

# Phase 3 — 서로 다른 파일, 의존성 없음:
Task: "components/article/use-audio-playback.ts 훅 작성"
Task: "components/article/article-audio-button.tsx 작성"
```

---

## Implementation Strategy

### MVP First (User Story 1만)

1. Phase 1: Setup 완료
2. Phase 2: Foundational 완료 (CRITICAL — 모든 스토리를 막음)
3. Phase 3: User Story 1 완료 및 T011 검증 통과
4. **여기서 멈춰 검증**: 오디오가 지정된 글에서 재생 전체 흐름이 실제로 동작하면 MVP로
   충분히 배포 가능 — User Story 2/3은 이미 부수적으로 충족돼 있으나(T010), 공식 검증
   게이트(T012/T013)를 통과해야 "완료"로 간주한다.

### Incremental Delivery

1. Setup + Foundational → 데이터 배관 완성
2. User Story 1 → 검증 → MVP 배포 가능
3. User Story 2 검증 → 조건부 노출 공식 확인
4. User Story 3 검증 → 배치 순서 공식 확인
5. Polish → 전체 회귀 스윕 → 최종 배포

---

## Notes

- [P] tasks = 서로 다른 파일, 의존성 없음.
- [Story] 라벨은 추적을 위한 것 — Setup/Foundational/Polish 태스크에는 라벨 없음.
- 이 기능은 자동화 테스트가 없으므로 "Verify tests fail before implementing" 규칙은 해당 없음 —
  대신 각 Phase 말미의 Phase Verification Protocol이 그 역할을 대체한다.
- 각 Phase 검증 게이트를 통과하지 못하면 절대 다음 Phase로 진행하지 않는다(회귀 프로토콜 참고).
- 태스크 하나 또는 논리적 그룹 완료 후 커밋(커밋 시 `commit` 스킬 사용, AGENTS.md).
