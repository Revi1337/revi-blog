# Tasks: 아티클 Copy Page 메뉴

**Input**: Design documents from `/specs/017-article-copy-page/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/raw-markdown-route.md, quickstart.md

**Tests**: 이 프로젝트엔 별도 유닛 테스트 스위트가 없다(constitution Principle I). 사용자 지시에 따라 이번 기능은 **Phase를 최대한 작은 단위로 쪼개고, 예외 없이 모든 Phase의 마지막 태스크에서 다음 3종 검증을 전부 수행한다**: ① `npm run build` ② `playwright-cli` 스킬 ③ playwright MCP(스크린샷 등 비주얼 확인). 여기서 발견된 오류는 다음 Phase로 넘어가기 전 반드시 해결한다 — 이 규칙에 예외는 없다.

**TOC 비회귀 특별 규칙**: `components/article/copy-page-menu.tsx`가 처음 `page.tsx`에 연결되는 Phase 5부터 이후의 **모든** Phase 검증에는, 위 3종 검증과 별개로 "가장 짧은 글(`MST`)/가장 긴 글(`Scope`) 기준 TOC sticky 고정-해제 스크롤 위치가 기능 추가 전과 동일한지" 비교가 반드시 포함된다(quickstart.md TOC 회귀 검증 섹션 참고). Phase 1~4는 UI 레이아웃에 전혀 손대지 않으므로 이 비교가 필요 없다.

**Organization**: spec.md의 User Story(P1/P2/P3/P3)별로 Phase 7~10을 구성한다. Phase 1~6(Setup/Foundational)은 사용자 지시에 따라 "loader.ts 원문 캐시", "articles.ts 캐시 노출", "Route Handler", "컴포넌트 골격+연결", "독립 sticky 배치 확정"을 각각 별도 Phase로 쪼갠다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능(다른 파일, 선행 의존성 없음)
- **[Story]**: 이 태스크가 속한 User Story(US1~US4). Setup/Foundational/Polish 태스크에는 붙이지 않는다.

## Path Conventions

기존 Next.js 앱(`app/`, `components/`, `lib/`, `content/`) 구조를 그대로 사용한다 — 별도 `src/`/`tests/` 트리 없음. `plan.md`의 Project Structure를 따른다.

---

## Phase 1: Setup — 검증용 더미 마크다운 아티클

**Purpose**: 비공개 메모(`%%...%%`) 은닉 보장(spec FR-008)을 실제 발행 글을 건드리지 않고 반복 검증할 수 있는 전용 픽스처를 만든다. `content/articles/_series-alpha.md` 등과 동일한 "언더스코어 접두사 + `tags: [TEST]` + `show_on_homepage: false`" 더미 아티클 컨벤션을 따른다.

- [X] T001 `content/articles/_copy-page-test.md` 더미 아티클 생성 — frontmatter는 `title`, `date`, `tags: [TEST]`, `show_on_homepage: false`(`_series-alpha.md` 형식 그대로). 본문에 H2 헤딩 2~3개짜리 목업 텍스트와, 그 사이에 `%%이 메모는 Copy Page/View as Markdown/raw 응답 어디에도 보이면 안 된다%%` 블록을 하나 포함한다 — 이후 모든 Phase에서 비공개 메모 은닉 검증에 재사용한다.
- [X] T002 Setup 검증: `npm run build` 성공 확인 → `playwright-cli` 스킬로 `/article/_copy-page-test` 방문해 정상 렌더링되는지, 렌더링된 본문에 그 비공개 메모 텍스트가 전혀 보이지 않는지 확인 → playwright MCP로 스크린샷 찍어 페이지가 다른 발행 글과 동일한 레이아웃으로 보이는지 비주얼 확인. **TOC 비교는 이 Phase에서는 불필요(아직 UI 변경 없음). 여기서 발견된 오류는 Phase 2로 넘어가기 전 반드시 해결한다.**

**Checkpoint**: 비공개 메모가 포함된 더미 픽스처가 준비됨 — 이후 모든 Phase에서 FR-008 검증에 재사용한다.

---

## Phase 2: Foundational — `loader.ts` 원문 캐시 추가

**Purpose**: `parseArticleFile`가 읽고 버리던 파일 전체 원문을 유지해, 빌드/서버 시작 시 1회 `stripComments()`를 통과시킨 slug→원문 캐시를 만든다. 이 Phase는 모든 User Story가 공통으로 의존하는 데이터 계층의 첫 조각이다.

**⚠️ CRITICAL**: 이 Phase부터 Phase 6까지는 어떤 User Story 작업도 시작할 수 없다.

- [X] T003 `lib/content/loader.ts` 수정 — `parseArticleFile`의 `ParsedArticleFile`에 `raw`(현재 버려지는 파일 전체 문자열) 필드를 추가해 유지한다. `loadArticles()`가 `parsedFiles`를 순회해 `rawMarkdownBySlug = new Map<string, string>()`을 만들고, 각 slug에 `stripComments(raw)`(`lib/content/strip-comments.ts`, 기존 import 재사용) 결과를 저장한다. `LoadedContent` 반환 타입에 `rawMarkdownBySlug`를 추가한다(data-model.md 참고). 기존 `Article[]`/`blogSlugs` 계산 로직과 완전히 독립적으로 동작해야 하며, 어느 것도 수정하지 않는다.
- [X] T004 Foundational 검증: `npm run build` 성공 확인(`loader.ts`는 top-level await 캐시에 걸리므로 `npm run dev`로 확인 중이라면 재시작 — constitution Principle I) → `playwright-cli`로 `/article/_copy-page-test`와 임의의 기존 발행 글(예: `/article/MST`) 양쪽을 방문해 `bodyHtml`/`plainBody` 기반 렌더링(본문, 검색 등)에 회귀가 없는지 확인 → playwright MCP 스크린샷으로 두 페이지 모두 평소와 동일하게 보이는지 비주얼 확인. **TOC 비교는 이 Phase에서는 불필요. 여기서 발견된 오류는 Phase 3로 넘어가기 전 반드시 해결한다.**

**Checkpoint**: 모든 글의 원문(프론트매터 포함, 비공개 메모 제외)이 메모리에 캐시됨 — `Article` 타입은 전혀 변경되지 않았음.

---

## Phase 3: Foundational — `articles.ts`에 원문 캐시 노출

**Purpose**: Phase 2의 캐시를 애플리케이션 나머지 부분이 쓸 수 있게 하되, `Article` 타입은 절대 확장하지 않는다(plan.md 하드 컨스트레인트).

- [X] T005 `lib/data/articles.ts` 수정 — `loadArticles()` 호출 결과에서 `rawMarkdownBySlug`도 함께 destructure하고, `export function getArticleRawMarkdown(slug: string): string | undefined { return rawMarkdownBySlug.get(slug) }`를 추가한다. `export const articles`, `export const blogCards`, `getArticleBySlug`는 한 글자도 수정하지 않는다.
- [X] T006 Foundational 검증: `npm run build` 성공 확인 → `playwright-cli`로 홈페이지(`/`)와 `/article/MST`를 방문해 카드 그리드/아티클 상세가 평소와 동일하게 렌더링되는지 확인(= `Article`/`BlogCardData`에 원문이 새어나가지 않았다는 간접 증거) → playwright MCP 스크린샷으로 비주얼 확인. **TOC 비교는 이 Phase에서는 불필요. 여기서 발견된 오류는 Phase 4로 넘어가기 전 반드시 해결한다.**

**Checkpoint**: `getArticleRawMarkdown(slug)`로 원문에 접근할 수 있음 — 아직 이걸 소비하는 외부 인터페이스는 없음.

---

## Phase 4: Foundational — Route Handler 추가

**Purpose**: 원문을 외부(브라우저 직접 접근, ChatGPT/Claude의 크롤링)에 노출하는 유일한 통로를 만든다(contracts/raw-markdown-route.md).

- [X] T007 `app/article/[slug]/raw/route.ts` 신규 생성 — `GET` 핸들러에서 `params`로 `slug`를 받아 `getArticleRawMarkdown(slug)` 조회. `undefined`면 `new Response("Not Found", { status: 404 })`, 있으면 `new Response(raw, { headers: { "Content-Type": "text/markdown; charset=utf-8" } })`를 반환한다. **`export const runtime = "edge"`를 절대 지정하지 않는다**(기본값 Node 런타임 유지 — plan.md 하드 컨스트레인트, `lib/data/articles.ts`가 `node:fs` 기반이라 edge에서는 import 자체가 빌드 에러가 됨).
- [X] T008 Foundational 검증: `npm run build` 성공 확인 후 빌드 출력의 라우트 목록에서 `/article/[slug]/raw`가 Edge가 아닌 Node(기본) 런타임으로 표시되는지 확인 → `curl -i http://localhost:3000/article/_copy-page-test/raw`로 `200`/`Content-Type: text/markdown`과 본문에 비공개 메모가 없는지, `curl -i http://localhost:3000/article/존재하지않는slug/raw`로 `404`를 확인 → `playwright-cli`로 브라우저에서 `/article/_copy-page-test/raw`를 직접 열어 원문이 플레인 텍스트로 보이는지 확인 → playwright MCP로 그 화면을 스크린샷해 비공개 메모가 시각적으로도 없는지 재확인. **TOC 비교는 이 Phase에서는 불필요(이 라우트는 `/article/[slug]` 페이지와 별개). 여기서 발견된 오류는 Phase 5로 넘어가기 전 반드시 해결한다.**

**Checkpoint**: 원문을 가져오는 외부 진입점이 완성됨 — 이제 이걸 소비하는 UI를 만들 수 있다.

---

## Phase 5: Foundational — `copy-page-menu.tsx` 컴포넌트 골격 + 페이지 연결

**Purpose**: 드롭다운 UI 골격(4개 버튼, 아직 동작 없음)을 만들고 `page.tsx`에 처음 연결한다. **이 Phase부터 TOC 비교 검증이 모든 후속 Phase에 의무화된다** — `<aside>` 레이아웃에 새 요소가 처음 등장하는 지점이기 때문이다.

- [X] T009 `vercel-react-best-practices` 스킬을 먼저 열어 신규 컴포넌트 작성 전 규칙을 확인한다(constitution Principle II, 사전 확인 단계).
- [X] T010 `components/article/copy-page-menu.tsx` 신규 생성 — `slug: string` prop만 받는 `"use client"` 컴포넌트. `toc-sidebar.tsx`의 모바일 드로어와 동일한 open-state(`useState`) + `createPortal` 배경 오버레이 + 열려 있는 동안만 Escape 키 리스너 패턴을 재사용한다. 트리거 버튼 + 패널 안에 "Open in ChatGPT", "Open in Claude", "Copy Page", "View as Markdown" 4개 항목을 렌더링하되, 이 Phase에서는 **onClick/href를 전혀 연결하지 않은 자리만 있는 상태**로 둔다. 애니메이션은 `motion/react-client`가 아니라 `motion/react`의 `m`/`AnimatePresence`만 import한다(`components/motion-provider.tsx`의 전역 `LazyMotion` 재사용, research.md §1 재확인). ChatGPT/Claude 로고는 `lucide-react`에 없으므로 작은 인라인 SVG로 추가한다. 배치는 `toc-sidebar.tsx`와 동일한 `hidden lg:block` 브레이크포인트로 데스크탑 전용 처리하되, **이 Phase에서는 임시로 일반 흐름(non-sticky) 블록**으로 둔다(독립 sticky 배치는 Phase 6에서 확정).
- [X] T011 `app/article/[slug]/page.tsx` 수정 — `<aside>` 안, `<TocSidebar variant="desktop" />` **바로 앞**에 `<CopyPageMenu slug={article.slug} />`를 추가한다(`TocSidebar` 컴포넌트 내부가 아니라 `page.tsx`의 형제 레벨 — spec FR-011, TOC가 비어있는 글에서도 메뉴가 사라지면 안 됨). `toc-sidebar.tsx`는 이 태스크에서도 한 글자도 수정하지 않는다.
- [X] T012 Foundational 검증(+ 첫 TOC 비교 기준값 측정): `npm run build` 성공 확인 → `playwright-cli`로 `/article/_copy-page-test`(TOC 있음), `/article/MST`(가장 짧은 글), `/article/Scope`(가장 긴 글)를 방문해 메뉴가 TOC 바로 위에 보이고(아직 임시 비-sticky 배치), 클릭하면 패널이 열리고 Escape/바깥 클릭으로 닫히는지 확인 → playwright MCP로 세 페이지 모두 스크린샷 → **TOC 비교(최초 측정)**: `MST`와 `Scope`에서 각각 끝까지 스크롤하며 TOC가 sticky로 고정되어 있다가 풀리는 스크롤 위치(px)를 기록해둔다(quickstart.md 참고) — 이 값이 Phase 6 이후 모든 비교의 "현재" 기준값이 된다(아직 임시 배치이므로 Phase 6에서 다시 확정됨에 유의). **여기서 발견된 오류는 Phase 6으로 넘어가기 전 반드시 해결한다.**

**Checkpoint**: 메뉴가 화면에 나타나고 열고 닫을 수 있음 — 아직 아무 동작도 하지 않고, sticky 배치도 확정되지 않음.

---

## Phase 6: Foundational — TOC와 독립적인 sticky 배치 확정 (데드존 방지 핵심)

**Purpose**: Phase 5의 임시 배치를 `toc-sidebar.tsx`의 `sticky top-40` 박스와 완전히 분리된, 자기만의 `position: sticky` 요소로 바꾸고, 정확한 `top` 오프셋을 실측해 확정한다. **이 Phase가 "데드존이 생기지 않는다"는 보장의 핵심이다.**

- [X] T013 `components/article/copy-page-menu.tsx` 수정 — 바깥 wrapper를 `hidden lg:block`에 **자기만의 `sticky top-{N}`**(토큰 `top-40`보다 작은 값)로 바꾼다. `N`은 추측값을 쓰지 않고, 브라우저에서 실제 렌더링된 메뉴 트리거 박스의 높이 + TOC 박스와의 의도된 간격을 실측해 역산한다(research.md §1, `10af04e`와 같은 "매직넘버 추측" 실수 반복 금지). **`components/article/toc-sidebar.tsx`는 이 태스크에서도, 이 기능 전체에서, 한 글자도 수정하지 않는다** — 그 파일의 `sticky top-40`/자기 높이가 1px도 바뀌지 않아야 TOC의 release 지점이 수학적으로 보존된다(plan.md Constraints, Complexity Tracking 표 참고).
- [X] T014 Phase 6 검증(TOC 데드존 회귀 비교, 가장 중요): `git stash`로 `main` 기준값(distanceFromBottom=162px, docHeight=15895 @ Scope; maxScroll=465, docHeight=1185 @ MST, 끝까지 고정)을 실측 → 복원 후 동일 수치 재확인, 완전히 일치. **여기서 발견된 오류는 Phase 7로 넘어가기 전 반드시 해결한다.**
  - **[사후 수정 1, 독립 sticky → 공유 sticky]** 최초엔 메뉴를 TOC와 완전히 독립된 별도 sticky 요소(`top-[112px]`)로 구현했으나, 실사용 중 "Copy Page와 TOC 사이 간격이 스크롤 위치에 따라 변한다"는 버그가 보고됐다 — 실측 결과 TOC는 scrollY 15013에서 풀리는데 메뉴는 15175까지 고정돼 162px 구간 동안 어긋났다. **수정**: 메뉴+TOC를 `app/article/[slug]/page.tsx`가 소유하는 **하나의 공유 sticky 래퍼**(`top-[112px]`, 메뉴를 문서 흐름에 포함)로 합쳤다.
  - **[사후 수정 2, 공유 sticky → TOC 박스 바깥에 absolute 오버레이]** 사후 수정 1 적용 후 프로덕션(blog.revi1337.com)과 나란히 실측 비교했더니, 스크롤을 "아주 조금만"(0~20px) 내릴 때 로컬에서만 메뉴+TOC 박스가 살짝 따라 움직이는 게 발견됐다 — 프로덕션은 `scrollY=0`부터 이미 고정(이 aside 컬럼의 자연 위치 ~128px < TOC 원래 top 160px라 처음부터 여유 32px로 고정), 반면 공유 박스(top-[112px])는 그 자연 위치(128px)보다 top이 작아져 여유가 깨지면서 0~20px 구간에 눈에 보이는 "따라잡기"가 생겼다. **최종 수정**: 메뉴를 sticky 박스의 문서 흐름에서 완전히 빼고(`position: absolute`, 박스 바깥 위에 `-top-12`로 얹음), sticky 박스는 TOC 카드만으로 구성해 `top-40`(160px)을 **전혀 바꾸지 않는다** — 박스의 top/height가 TOC 단독이었을 때와 1바이트도 다르지 않으므로 "스크롤 0부터 고정"이든 "끝에서 풀리는 지점"이든 증명이 필요 없을 만큼 완전히 동일해진다. 재측정: `/article/antigravity-skills`(프로덕션에도 있는 실제 글)를 같은 뷰포트(1440×900)에서 양쪽 다 `maxScroll=4012, docHeight=4912, 끝까지 고정` 완전히 일치, `y=0~200` 전 구간에서 `tocTop=160` 고정도 일치.

**Checkpoint**: 메뉴가 TOC와 완전히 독립된 sticky 요소로 확정됨 — TOC의 스크롤 동작은 기능 추가 전과 100% 동일함이 실측으로 증명됨(spec SC-004). 이제 실제 동작(4개 액션)을 하나씩 연결할 수 있다.

---

## Phase 7: User Story 1 - 글 원문을 복사해 다른 곳에 붙여넣기 (Priority: P1) 🎯 MVP

**Goal**: "Copy Page" 클릭 시 글 원문(메타정보 포함, 비공개 메모 제외)이 클립보드에 복사된다.

**Independent Test**: `/article/_copy-page-test`에서 메뉴를 열고 "Copy Page" 클릭 → 클립보드 내용을 다른 곳에 붙여넣어 프론트매터+본문이 그대로, 비공개 메모 없이 들어있는지 확인.

- [X] T015 [US1] `components/article/copy-page-menu.tsx`의 "Copy Page" 항목에 클릭 핸들러를 연결한다 — `fetch(`/article/${slug}/raw`)` → `.text()` → `navigator.clipboard.writeText()`. 성공 시 `code-copy-handler.tsx`의 `is-copied` 클래스 토글과 동일한 성격의 일시적 성공 피드백(예: 아이콘/문구 변경, 1.6초 후 원복)을 로컬 `useState`로 표시한다. `fetch` 실패 또는 `clipboard.writeText` reject 시에는 **조용히 무시하지 않고** 별도의 에러 피드백 상태를 표시한다(spec FR-010, research.md §6 — `code-copy-handler.tsx`의 `.catch(() => {})` 패턴을 재사용하지 않는다).
- [X] T016 [US1] User Story 1 검증: `npm run build` 성공 확인 → `playwright-cli`로 `/article/_copy-page-test`에서 "Copy Page" 클릭 → 클립보드 내용에 프론트매터(title/date/tags)와 본문이 그대로, `%%...%%` 메모는 제외된 채 들어있는지 확인 → 네트워크를 오프라인으로 만들어 재클릭해 에러 피드백이 표시되는지 확인 → playwright MCP로 성공/실패 두 상태 모두 스크린샷 → **TOC 비교**: `/article/MST`, `/article/Scope`에서 Phase 6(T014) 기준값과 동일한 release 스크롤 위치인지 재확인(이 Phase는 `copy-page-menu.tsx`의 이벤트 핸들러만 추가했을 뿐 레이아웃을 바꾸지 않았으므로 변화가 없어야 한다). **여기서 발견된 오류는 Phase 8로 넘어가기 전 반드시 해결한다.**

**Checkpoint**: User Story 1 단독으로 완전히 동작·검증 가능 — 이 시점이 MVP다.

---

## Phase 8: User Story 2 - 글 원문을 그대로 펼쳐보기 (Priority: P2)

**Goal**: "View as Markdown" 클릭 시 새 탭에서 원문이 그대로 보이는 화면이 열린다.

**Independent Test**: 메뉴에서 "View as Markdown" 클릭 → 새 탭에 `/article/{slug}/raw`가 열리고 원문이 그대로, 비공개 메모 없이 표시됨.

- [X] T017 [US2] `components/article/copy-page-menu.tsx`의 "View as Markdown" 항목을 `<a href={`/article/${slug}/raw`} target="_blank" rel="noopener noreferrer">`로 연결한다(별도 클릭 핸들러 불필요 — Phase 4의 Route Handler를 브라우저 기본 네비게이션으로 그대로 사용).
- [X] T018 [US2] User Story 2 검증: `npm run build` 성공 확인 → `playwright-cli`로 `/article/_copy-page-test`에서 "View as Markdown" 클릭 → 새 탭에 원문이 그대로, 비공개 메모 없이 보이는지 확인 → playwright MCP 스크린샷 → **TOC 비교**: `/article/MST`, `/article/Scope`에서 Phase 6 기준값과 동일한지 재확인(순수 `<a>` 추가라 레이아웃 영향 없어야 함). **여기서 발견된 오류는 Phase 9로 넘어가기 전 반드시 해결한다.**

**Checkpoint**: User Story 1 + 2가 함께 동작 — 원문을 다루는 두 핵심 동작이 완성된다.

---

## Phase 9: User Story 3 - ChatGPT에서 글에 대해 바로 질문하기 (Priority: P3)

**Goal**: "Open in ChatGPT" 클릭 시 새 탭에서 ChatGPT가 열리고 추가 조작 없이 그 글에 대해 질문할 수 있는 상태가 된다.

**Independent Test**: 메뉴에서 "Open in ChatGPT" 클릭 → 새 탭에서 ChatGPT가 열리고 입력창에 그 글을 읽어달라는 프롬프트가 채워져 있음(자동 전송 안 됨).

- [X] T019 [US3] `components/article/copy-page-menu.tsx`의 "Open in ChatGPT" 항목을 연결한다 — 클릭 시점에 `window.location.origin`(research.md §5 — `lib/site-config.ts`의 `SITE_URL`은 쓰지 않음, "지금 보고 있는 배포" 기준)으로 `/article/${slug}/raw`의 절대 URL을 구성하고, "다음 URL의 글을 읽고 질문에 답해달라"는 프롬프트에 포함해 URL-인코딩한 뒤 `https://chatgpt.com/?q=...`를 새 탭(`window.open(..., "_blank")` 또는 `<a target="_blank">`)으로 연다.
- [X] T020 [US3] User Story 3 검증: `npm run build` 성공 확인 → `playwright-cli`로 "Open in ChatGPT" 클릭 → 새 탭에서 ChatGPT가 열리고 입력창에 프롬프트(글의 raw URL 포함)가 채워져 있는지, 자동 전송되지 않았는지 확인 → playwright MCP 스크린샷 → **TOC 비교**: `/article/MST`, `/article/Scope`에서 Phase 6 기준값과 동일한지 재확인. **여기서 발견된 오류는 Phase 10으로 넘어가기 전 반드시 해결한다.**

**Checkpoint**: User Story 1~3이 함께 동작.

---

## Phase 10: User Story 4 - Claude에서 글에 대해 바로 질문하기 (Priority: P3)

**Goal**: "Open in Claude" 클릭 시 User Story 3과 동일하되 Claude가 열린다.

**Independent Test**: 메뉴에서 "Open in Claude" 클릭 → 새 탭에서 Claude가 열리고 입력창에 그 글을 읽어달라는 프롬프트가 채워져 있음.

- [X] T021 [US4] `components/article/copy-page-menu.tsx`의 "Open in Claude" 항목을 T019와 동일한 방식으로 연결한다 — URL만 `https://claude.ai/new?q=...`로 바뀐다. 프롬프트 생성 로직(절대 URL 구성, 인코딩)은 T019와 중복되므로 작은 공용 헬퍼로 뽑아도 되고, 이 기능 규모상 각자 인라인으로 둬도 된다(과설계 금지).
- [X] **[사후 수정, 디자인]** 사용자 피드백 2건 반영: (1) 버튼이 TOC 카드와 같은 폭으로 꽉 차 있어 너무 커 보인다는 지적 → resilience4j(readme.io)/Vercel 공식 문서를 `playwright-cli`로 직접 실측해, 컴팩트한 "split button"(auto-width 주 버튼 + 별도의 작은 쉐브론 버튼, Vercel 실측 117×32px) 패턴으로 교체. "Copy Page"가 드롭다운 항목이 아니라 주 버튼의 기본 클릭 동작이 되고, 쉐브론 드롭다운에는 Open in ChatGPT/Claude/View as Markdown 3개만 남김(resilience4j와 동일한 IA). (2) ChatGPT/Claude/Markdown 아이콘이 `lucide-react`의 범용 아이콘(Bot/Sparkles/FileText)이라 "이상하다"는 지적 → 두 레퍼런스 사이트에서 실제 사용 중인 공식 브랜드 SVG(OpenAI 마크/Claude 마크/markdown-mark 배지)를 실측해 그대로 교체(research.md §9).
- [X] **[사후 수정, 레이아웃 시프트]** "Copy Page"→"Copied!" 전환 시 버튼 폭이 바뀌던 문제 — Vercel의 실제 버튼을 실측해보니 클릭 전후로 텍스트/`aria-label`이 "Copy page"로 항상 동일하고 아이콘만 바뀌는 구조였다(research.md §10). 동일한 원칙을 적용해 라벨 텍스트는 항상 "Copy Page"로 고정하고, 고정 크기 아이콘 슬롯 안에서만 Copy→Check/AlertCircle을 바꾸도록 수정 — 버튼 폭이 상태와 무관하게 완전히 고정됨을 playwright로 재확인(before/during/after bounding box 전부 동일).
- [X] T022 [US4] User Story 4 검증: `npm run build` 성공 확인 → `playwright-cli`로 "Open in Claude" 클릭 → 새 탭에서 Claude가 열리고 입력창에 프롬프트가 채워져 있는지 확인 → playwright MCP 스크린샷 → **TOC 비교**: `/article/MST`, `/article/Scope`에서 Phase 6 기준값과 동일한지 재확인. **여기서 발견된 오류는 Phase 11로 넘어가기 전 반드시 해결한다.**

**Checkpoint**: 네 가지 동작(User Story 1~4) 모두 독립적으로 동작 — 메뉴 기능 자체는 완성.

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: 전체 기능에 걸친 최종 회귀 검증 — 특히 이번 기능에서 가장 중요한 제약인 TOC 비회귀와 모바일 미노출을 깊게 재확인한다.

- [X] T023 `vercel-react-best-practices` 스킬 규칙에 대해 `copy-page-menu.tsx` 전체(Phase 5~10에서 누적된 모든 코드)를 최종 감사하고, 위반이 발견되면 즉시 수정한다(constitution Principle II, 완료 전 감사).
- [X] T024 모바일 미노출 최종 확인(spec FR-002/SC-005): `playwright-cli`로 모바일 뷰포트로 전환해 `/article/_copy-page-test`를 방문 → 메뉴가 전혀 렌더링되지 않는지 확인 → playwright MCP 스크린샷으로 비주얼 확인.
- [X] T025 TOC 없는 글에서도 메뉴 노출 재확인(spec FR-011): 헤딩이 없는 글(또는 `_copy-page-test.md`에서 헤딩을 임시로 모두 제거) 방문 → TOC 사이드바는 비어도 메뉴는 정상적으로 보이는지 `playwright-cli`+playwright MCP로 확인. 확인 후 원상 복구.
- [X] T026 TOC 심층 회귀 검증(quickstart.md 전체 재실행, 가장 중요): `npm run build` 성공 확인 → `playwright-cli`+playwright MCP로 `/article/MST`, `/article/Scope` 양쪽에서 (a) TOC 고정-해제 스크롤 위치가 기능 추가 전과 완전히 동일한지(Phase 6부터의 모든 측정과 일치), (b) TOC의 활성(active) 항목 하이라이트가 스크롤에 따라 지금까지와 동일하게 정확히 갱신되는지, (c) TOC 항목 클릭 시 정상적으로 이동하는지 최종 확인한다. **여기서 발견된 오류는 기능을 완료 처리하기 전 반드시 해결한다.**
- [X] T027 [P] 변경 범위 최종 확인: `git diff`로 `components/article/toc-sidebar.tsx`, `lib/data/types.ts`의 `Article` 인터페이스에 변경이 전혀 없음을 확인하고, `app/article/[slug]/raw/route.ts`에 `runtime = "edge"`가 지정되지 않았음을 재확인한다(plan.md Constraints 재확인).
- [X] T028 `quickstart.md`에 정리된 전체 시나리오(TOC 회귀 검증 1~5, Functional Validation 6~12, Route Contract Validation 13~14)를 처음부터 순서대로 한 번 더 실행해 최종 확인한다. **여기서 발견된 오류는 기능을 완료 처리하기 전 반드시 해결한다.**

**Checkpoint**: 모든 User Story 통과 + TOC 비회귀 실측 증명 + 변경 범위가 계획대로임을 확인 — 기능 완료.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 의존성 없음 — 바로 시작 가능.
- **Foundational (Phase 2~6)**: Setup 완료(T002) 후 순서대로 진행 — 각 Phase가 다음 Phase의 전제조건이다(T003→T005→T007→T010→T013, 전부 이전 산출물에 의존). 모든 User Story를 블로킹한다.
- **User Stories (Phase 7~10)**: 전부 Phase 6(T014, 독립 sticky 배치 확정 + 최초 TOC 무변화 증명) 완료를 전제로 한다.
  - US1(Phase 7)은 다른 스토리에 의존하지 않는다 — Route Handler(Phase 4)만 있으면 됨.
  - US2(Phase 8)도 Route Handler만 있으면 되고 US1과 독립적이지만, 같은 컴포넌트 파일을 다루므로 순서대로 진행한다.
  - US3(Phase 9), US4(Phase 10)는 서로 완전히 독립적이고 US1/US2에도 의존하지 않는다(각자 ChatGPT/Claude URL만 다름) — 병렬 가능하나 같은 파일을 수정하므로 이 tasks.md에서는 순차로 배치했다.
- **Polish (Phase 11)**: 모든 User Story 완료 후.

### Parallel Opportunities

- 이 기능은 대부분의 Phase가 "구현 1개 + 검증 1개"의 최소 단위라 Phase 내부 병렬성은 거의 없다(의도적 — 사용자 지시에 따른 세분화).
- T027은 다른 Phase 11 태스크와 독립적으로 병렬 실행 가능.
- 팀이 여러 명이라면 US3(Phase 9)와 US4(Phase 10)는 서로 다른 사람이 동시에 작업해도 된다(완전히 독립적인 분기 로직) — 다만 같은 파일(`copy-page-menu.tsx`)이라 병합 충돌에 주의.

---

## Implementation Strategy

### MVP First (User Story 1까지)

1. Phase 1~6 완료 — 데이터 계층 + Route Handler + 메뉴 골격 + TOC 독립 sticky 배치 확정(가장 중요한 하드 컨스트레인트가 이 구간에서 실측으로 증명됨)
2. Phase 7(US1, Copy Page) 완료
3. **STOP and VALIDATE**: T016의 독립 검증으로 "Copy Page" 단독 동작 + TOC 무변화 확인
4. 이 시점이 MVP다 — View as Markdown/ChatGPT/Claude 연동은 아직 없어도 핵심 가치(원문 복사)는 전달됨

### Incremental Delivery

1. Phase 1~6 → 데이터 계층·UI 골격·TOC 안전성 완성
2. Phase 7(US1) 추가 → 독립 검증 → MVP
3. Phase 8(US2) 추가 → 독립 검증 → 원문 열람 가치 완성
4. Phase 9(US3) 추가 → 독립 검증 → ChatGPT 연동 완성
5. Phase 10(US4) 추가 → 독립 검증 → Claude 연동 완성
6. Phase 11(Polish) → 전체 회귀 재확인 → 완료

## Notes

- [P] 태스크 = 다른 파일, 선행 의존성 없음.
- 각 Phase의 마지막 태스크는 예외 없이 `npm run build` + `playwright-cli` + playwright MCP 3종 검증이며, 여기서 발견된 오류는 다음 태스크/Phase로 넘어가기 전 반드시 해결한다 — 이 규칙에 예외는 없다.
- Phase 5부터는 위 3종 검증에 더해 `/article/MST`·`/article/Scope` 기준 TOC 고정-해제 스크롤 위치 비교가 모든 후속 Phase에 의무화된다.
- `components/article/toc-sidebar.tsx`, `lib/data/types.ts`의 `Article` 인터페이스, `content/articles/**`의 기존 발행 글은 이 기능의 어떤 태스크에서도 수정하지 않는다.
- `app/article/[slug]/raw/route.ts`에는 어떤 태스크에서도 `runtime = "edge"`를 지정하지 않는다.
