---

description: "Task list template for feature implementation"
---

# Tasks: 게시글 이미지 라이트박스 모달

**Input**: Design documents from `/specs/009-image-lightbox-modal/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/lightbox-integration-contract.md, quickstart.md

**Tests**: 이 프로젝트에는 자동화 테스트 스위트가 없다. 대신 AGENTS.md의 Testing 섹션과 Constitution Principle I(Feature-Level Verification, NON-NEGOTIABLE)에 따라 `npm run build` + 실제 브라우저 구동 검증이 **필수 게이트**다. 아래 T015는 선택 사항이 아니며 생략할 수 없다 — 통과 없이는 이 기능을 완료로 간주하지 않는다.

**Organization**: Tasks are grouped by user story (spec.md 기준 P1/P2/P3/P4) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

기존 단일 Next.js 앱 구조를 그대로 따른다 (plan.md Project Structure 참조): `app/`, `components/`, `lib/`가 저장소 루트에 위치.

---

## Phase 1: Setup

**Purpose**: 라이트박스 구현에 필요한 의존성 설치

- [X] T001 `npm install photoswipe`를 실행해 `package.json`/`package-lock.json`에 의존성을 추가한다

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 User Story가 공유하는 PhotoSwipe 통합 레이어(공통 옵션, 커스텀 UI, 스타일)를 만든다 — 이 레이어가 없으면 어떤 User Story도 spec의 크기/블러/모션/확대축소 요구사항을 충족한 채 검증할 수 없다

**⚠️ CRITICAL**: 이 Phase가 끝나기 전에는 어떤 User Story 작업도 시작하지 않는다

- [X] T002 [P] `.claude/skills/vercel-react-best-practices/rules/bundle-dynamic-imports.md`와 `.claude/skills/vercel-react-best-practices/rules/client-event-listeners.md`를 실제로 열어서 확인한다 — 이번 컴포넌트에 바로 적용할 두 규칙이므로 일반 지식으로 대체하지 않는다 (Constitution Principle III)
- [X] T003 `lib/lightbox/open-image-lightbox.ts`를 신규 생성한다: `photoswipe`/`photoswipe/lightbox`를 함수 내부에서 동적 `import()`로 로드하고(초기 번들 제외, bundle-dynamic-imports), 다음을 공유 옵션으로 설정한 `PhotoSwipeLightbox` 인스턴스를 만들어 `loadAndOpen(index, { dataSource })`를 호출하는 `openImageLightbox({ dataSource, index }: { dataSource: { src: string; alt: string }[]; index: number })` 함수를 export한다: `paddingFn`(뷰포트 대비 여백을 반환해 풀스크린을 채우지 않도록, FR-003), `bgOpacity`(기존 dim 유지), `showHideAnimationType: 'zoom'`(FR-005, research.md #6), `initialZoomLevel`/`secondaryZoomLevel`/`maxZoomLevel`(FR-007 상/하한), `loop: false`(FR-012 경계 처리), `uiElement`로 등록하는 `+`/`-` 확대·축소 버튼(각각 `pswp.zoomTo()` 호출, FR-006)과 "N / M" 위치 인디케이터(FR-013, `dataSource.length > 1`일 때만 표시)
- [X] T004 `app/globals.css`에 PhotoSwipe 커스텀 스타일을 추가한다: `.pswp__bg`에 `backdrop-filter: blur()`(FR-004), T003에서 등록한 `+`/`-` 버튼·인디케이터·기본 화살표·닫기 버튼을 기존 다크/라이트 컬러 토큰(`--color-surface-*`, `--color-on-surface*`, `--color-outline-variant` 등)에 맞춰 스타일링한다 (Constitution Principle II — 다크/라이트 두 테마 모두 확인)

**Checkpoint**: `openImageLightbox` 헬퍼가 독립적으로 존재하며 컴파일된다 — 이제 User Story별 진입점 연결을 시작할 수 있다

---

## Phase 3: User Story 1 - 본문 이미지 확대 보기 (Priority: P1) 🎯 MVP

**Goal**: 방문자가 게시글 본문에 삽입된 이미지를 클릭하면 크게 확대된 모달로 볼 수 있다

**Independent Test**: 본문에 이미지가 하나 이상 포함된 게시글에 접속해 이미지를 클릭했을 때 모달이 뜨고, 이미지가 확대되어 표시되는지 확인한다

### Implementation for User Story 1

- [X] T005 [US1] `lib/data/types.ts`에 `ArticleImage` 인터페이스(`src: string`, `alt: string`, `order: number`)를 추가하고, 기존 `Article` 인터페이스에 `images: ArticleImage[]` 필드를 추가한다 (data-model.md)
- [X] T006 [US1] `lib/content/plugins/remark-images.ts`를 신규 생성한다: `lib/content/plugins/remark-toc.ts`의 `visit` 패턴을 참고해 mdast `image` 노드를 순회하며 등장 순서대로 `order`/`src`/`alt`를 수집해 `file.data.images`(`ArticleImage[]`)에 담고, 각 노드에 `data-lightbox-index` hProperty를 부여한다 (research.md #3, contracts #1). depends on T005
- [X] T007 [US1] `lib/content/pipeline.ts`의 `processor`에 `remarkImages`를 등록하고, `RenderResult` 인터페이스에 `images: ArticleImage[]` 필드를 추가해 `renderMarkdown`이 `file.data.images`(없으면 빈 배열)를 반환하도록 수정한다. depends on T006
- [X] T008 [US1] `lib/content/loader.ts`의 `loadArticleFile`에서 `renderMarkdown` 결과의 `images`를 반환 객체에 포함시켜 `Article.images`로 노출한다. depends on T007
- [X] T009 [US1] `components/article/image-lightbox-handler.tsx`를 신규 생성한다: `components/article/code-copy-handler.tsx`와 동일한 `"use client"` + document 레벨 `click` 이벤트 위임 패턴으로, `event.target.closest('[data-lightbox-index]')`를 감지해 `Number(target.dataset.lightboxIndex)`로 인덱스를 읽고, `article.images.map(img => ({ src: img.src, alt: img.alt }))`를 `dataSource`로 T003의 `openImageLightbox`를 호출한다. `article.images.length === 0`이면 클릭 리스너 자체를 등록하지 않는다 (contracts #2, client-event-listeners, spec Edge Case: 이미지 없는 게시글)
- [X] T010 [US1] `app/article/[slug]/page.tsx`에서 `ImageLightboxHandler`를 import해 `article` prop과 함께 `article-body` 옆에 마운트한다. depends on T009

**Checkpoint**: 이 시점에서 User Story 1은 완전히 동작하며 독립적으로 테스트 가능하다 — 본문 이미지 클릭 시 모달이 열리고 크기/블러/모션 요구사항을 만족한다 (MVP 완료)

---

## Phase 4: User Story 2 - 여러 이미지 사이 갤러리 탐색 (Priority: P2)

**Goal**: 본문에 이미지가 여러 장 있는 게시글에서, 모달을 닫지 않고 이전/다음으로 다른 이미지를 볼 수 있다

**Independent Test**: 본문에 이미지가 3장 이상 포함된 게시글에서 모달을 열고, 다음/이전 탐색 조작으로 각 이미지로 순서대로 이동되는지, 첫 번째/마지막 이미지에서 경계 처리가 올바른지 확인한다

### Implementation for User Story 2

- [X] T011 [US2] 검증 전용 태스크(구현 변경 없음): 본문 이미지가 3장 이상인 게시글에서 T003의 `loop: false` 옵션과 T006의 `data-lightbox-index`/`order` 매핑이 이전/다음 탐색, 첫/마지막 경계에서의 비활성화(FR-011, FR-012), "N / M" 인디케이터의 정확한 갱신(FR-013)을 만족하는지 확인한다. 부족하면 T003의 옵션이나 커스텀 counter UI 엘리먼트 로직을 조정한다

**Checkpoint**: 이 시점에서 User Story 1과 2가 함께 독립적으로 동작한다

---

## Phase 5: User Story 3 - 썸네일 이미지 확대 보기 (Priority: P3)

**Goal**: 방문자가 게시글 상단 썸네일 이미지를 클릭해도 본문 이미지와 동일한 방식으로 확대된 모달을 볼 수 있다

**Independent Test**: 게시글 상단 썸네일 이미지를 클릭했을 때 본문 이미지와 동일한 모달 UI(크기, 블러, 모션)가 뜨는지, 이전/다음 탐색 UI는 없는지 확인한다

### Implementation for User Story 3

- [X] T012 [US3] (구현 중 조정) `article-header.tsx`에 직접 `onClick`을 추가하는 대신, 신규
  `components/article/article-thumbnail.tsx` 클라이언트 컴포넌트로 썸네일 `motion.div`를 분리해
  `onClick`을 붙였다 — `ArticleHeader`는 서버 컴포넌트로 유지하고 `article` 전체가 아니라 `src`
  문자열 하나만 prop으로 넘겨 RSC 경계 직렬화를 최소화하기 위함(server-serialization, T014에서
  발견). 클릭 시 `event.currentTarget`의 실제 `<img>`에서 `naturalWidth`/`naturalHeight`를 읽어
  `[{ src, alt: "", width, height }]` 단일 항목 배열을 `dataSource`로 T003의 `openImageLightbox`를
  `index: 0`으로 호출한다. `Article.images`와 합치지 않는다 (contracts #3, FR-002, FR-014)

**Checkpoint**: 이 시점에서 User Story 1, 2, 3이 함께 독립적으로 동작한다

---

## Phase 6: User Story 4 - 모달 내 이미지 확대·축소 조작 (Priority: P4)

**Goal**: 방문자가 모달이 열린 상태에서 +/- 버튼을 눌러 이미지를 확대·축소할 수 있다

**Independent Test**: 모달이 열린 상태에서 + 버튼을 눌러 이미지가 확대되는지, - 버튼을 눌러 다시 축소되는지 확인한다

### Implementation for User Story 4

- [X] T013 [US4] 검증 전용 태스크(구현 변경 없음): T003에서 등록한 `+`/`-` 버튼이 `pswp.zoomTo()`를 정확히 호출해 확대/축소되는지, `maxZoomLevel` 등 상/하한에서 버튼을 계속 눌러도 더 이상 변화가 없는지(FR-007), 확대한 상태로 모달을 닫았다가 같은 이미지를 다시 열면 배율이 초기화되는지(FR-009) 확인한다. 부족하면 T003의 zoom 옵션이나 버튼 클릭 핸들러를 조정한다

**Checkpoint**: 4개 User Story 모두 독립적으로 동작한다

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: best-practices 재감사, 그리고 필수 브라우저 검증

- [X] T014 `lib/lightbox/open-image-lightbox.ts`, `components/article/image-lightbox-handler.tsx`, `components/article/article-thumbnail.tsx`를 `.claude/skills/vercel-react-best-practices/rules/bundle-dynamic-imports.md`, `.claude/skills/vercel-react-best-practices/rules/client-event-listeners.md`, `server-serialization.md` 기준으로 재감사했다. 발견 및 수정: (1) `ImageLightboxHandler`에 `Article` 전체를 넘기던 것을 `images: ArticleImage[]`만 받도록 수정, (2) 썸네일 클릭을 `ArticleHeader`(서버 컴포넌트) 안에 두지 않고 `ArticleThumbnail`(신규 클라이언트 컴포넌트, `src` 문자열만 prop)로 분리 — `bundle-dynamic-imports`/`client-event-listeners`는 최초 설계대로 위반 없음 (Constitution Principle III)
- [X] T015 **[필수, 스킵 불가]** `npm run build` + `claude-in-chrome` MCP로 실제 브라우저 검증을 완료했다. `specs/009-image-lightbox-modal/quickstart.md`의 12개 시나리오를 모두 실행해 통과 확인. **검증 중 실제로 3건의 버그를 발견해 수정함**: (1) PhotoSwipe는 `naturalWidth`/`naturalHeight`를 자동으로 읽지 않아 `w`/`h` 없이는 이미지가 여백 없이 뷰포트 전체를 채워버림 → `image-lightbox-handler.tsx`/`article-thumbnail.tsx`에서 클릭 시점에 DOM `<img>`의 `naturalWidth`/`naturalHeight`를 읽어 전달하도록 수정(FR-003, research.md #4, data-model.md 갱신). (2) `app/globals.css`에서 `backdrop-filter`를 `-webkit-backdrop-filter`보다 먼저 쓰면 Next.js(Lightning CSS)가 표준 프로퍼티를 컴파일 결과에서 제거해버려 블러가 전혀 적용되지 않음 → 선언 순서를 뒤집어 해결(FR-004, research.md #5). (3) 커스텀 `+`/`-` 버튼 아이콘에 `class="pswp__icn"`이 없으면 PhotoSwipe 기본 흰색이 아니라 어두운 회색(`--pswp-icon-color-secondary`)으로 렌더링되어 어두운 스크림 위에서 거의 안 보임 → 아이콘 SVG에 `class="pswp__icn"` 추가, hover 배경색은 PhotoSwipe 자체 CSS가 나중에 로드되어 동일 specificity로 덮어써서 `!important` 추가(FR-006, research.md #7). Constitution Principle I 게이트 통과.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 의존성 없음 — 바로 시작 가능
- **Foundational (Phase 2)**: Setup 완료 후 시작 — 모든 User Story를 BLOCK한다
- **User Stories (Phase 3~6)**: 모두 Foundational 완료를 전제로 하며, 우선순위 순서(P1 → P2 → P3 → P4)로 순차 진행을 권장한다. US2/US4는 US1이 만든 데이터/컴포넌트를 검증하는 성격이 강해 병렬보다 순차가 자연스럽다
- **Polish (Phase 7)**: 원하는 User Story가 모두 끝난 뒤 진행. T015(필수 테스트)는 모든 진입점(US1, US3)과 데이터 파이프라인(US1)이 구현된 뒤 실행해야 quickstart.md의 12개 시나리오를 전부 검증할 수 있다

### User Story Dependencies

- **User Story 1 (P1)**: Foundational 완료 후 시작 — 다른 Story에 의존하지 않는다 (신규 데이터 파이프라인 + 신규 컴포넌트)
- **User Story 2 (P2)**: Foundational + US1(데이터 파이프라인, 갤러리 dataSource) 완료 후 검증만 진행한다 — PhotoSwipe의 `loop: false`/counter가 이미 Foundational에서 구현되어 있어 별도 신규 코드가 필요 없다
- **User Story 3 (P3)**: Foundational 완료 후 시작 — US1의 데이터 파이프라인과 무관한 독립 진입점(썸네일)이라 US1 없이도 구현 가능하지만, 회귀 확인을 위해 US1 이후 진행을 권장한다
- **User Story 4 (P4)**: Foundational + (US1 또는 US3로 모달이 열려 있는 상태) 완료 후 검증만 진행한다 — 확대/축소 버튼이 이미 Foundational에서 구현되어 있어 별도 신규 코드가 필요 없다

### Within Each User Story

- US1은 신규 코드(T005~T010)가 필요하지만, US2/US4는 Foundational(T003)에서 이미 구현된 것을 검증만 한다 — PhotoSwipe 공통 옵션 하나가 탐색/확대축소를 모두 내장하고 있기 때문
- Story 완료 후 다음 우선순위로 이동

---

## Parallel Example: Setup + Foundational

```bash
# T001과 T002는 서로 다른 파일(package.json vs 스킬 문서)이며 서로 의존하지 않으므로 병렬 가능:
Task: "npm install photoswipe 실행"
Task: "vercel-react-best-practices의 bundle-dynamic-imports, client-event-listeners 규칙 문서 검토"

# T003, T004는 T002(규칙 검토)가 끝난 뒤 시작 — 병렬 아님 (T003의 결과를 T004가 스타일링 대상으로 참조)
```

---

## Implementation Strategy

### MVP First (User Story 1까지만)

1. Phase 1: Setup 완료
2. Phase 2: Foundational 완료 (CRITICAL — 모든 Story를 막는다)
3. Phase 3: User Story 1 완료
4. **STOP and VALIDATE**: 본문에 이미지가 있는 게시글에서 클릭 → 모달 오픈 확인
5. 필요하면 여기서 데모/배포 가능 (MVP)

### Incremental Delivery

1. Setup + Foundational 완료 → PhotoSwipe 통합 레이어 준비 완료
2. User Story 1 추가 → 독립 테스트 → MVP 데모 가능
3. User Story 2 추가 → 독립 테스트 (다중 이미지 갤러리 탐색 검증)
4. User Story 3 추가 → 독립 테스트 (썸네일 진입점 검증)
5. User Story 4 추가 → 독립 테스트 (확대/축소 검증)
6. Phase 7: best-practices 재감사 + **필수** 브라우저 검증(T015)까지 마쳐야 기능이 완료된 것으로 간주한다

---

## Notes

- [P] tasks = 서로 다른 파일, 의존성 없음
- [Story] 라벨은 각 태스크가 어떤 User Story에 속하는지 추적성을 위해 표시한다
- T011, T013은 "검증 전용" 태스크다 — Foundational(T003)에서 이미 구현한 PhotoSwipe 공통 옵션이 갤러리 탐색과 확대/축소를 모두 내장하므로, 별도 구현 없이 동작을 확인만 하면 된다. 확인 중 문제가 발견되면 그때 코드를 수정한다
- `core/article-detail-dark.html`/`core/article-detail-light.html` 정적 목업은 이 기능으로 인한 레이아웃 변경이 없어(라이트박스는 클릭 시에만 나타나는 런타임 오버레이) 별도 태스크를 두지 않는다 (plan.md Constitution Check 참조)
- T015(필수 테스트)는 절대 생략하지 않는다 — AGENTS.md Testing 섹션과 Constitution Principle I이 이를 게이트로 못박고 있다
