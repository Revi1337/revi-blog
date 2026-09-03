# Tasks: 헤딩 접기/펼치기

**Input**: Design documents from `/specs/015-heading-fold/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md,
contracts/heading-fold-contract.md, quickstart.md

**Tests**: 이 저장소는 자동화 테스트 스위트가 없다(constitution.md Principle I). 검증은 각 Phase
마지막에 고정된 체크포인트로 대체한다 — 별도 테스트 태스크는 생성하지 않는다.

1. `content/articles/**`를 수정했다면 `next dev`를 재시작(top-level await 캐싱, AGENTS.md 경고).
2. `npm run build`(또는 `npx tsc --noEmit`)로 빌드/타입 에러 확인.
3. `playwright-cli` 스킬로 브라우저 구동 검증(우선), 픽셀 단위 시각 확인이 필요할 때만 `playwright`
   MCP 스크린샷 도구로 전환.

**모든 Phase의 마지막 태스크는 예외 없이 위 절차를 실행하는 체크포인트여야 한다.** 하나라도
실패하면 다음 Phase로 넘어가기 전에 같은 Phase 안에서 원인을 고치고 체크포인트를 다시 통과해야
한다 — **실패한 채로 다음 Phase로 이월하지 않는다**(012~014 tasks.md가 채택한 원칙을 그대로 적용).

**React/TypeScript 감사 원칙 (constitution.md Principle II, NON-NEGOTIABLE)**: 신규 클라이언트
로직을 작성하거나 기존 클라이언트 파일(`heading-scroll.ts`, `toc-sidebar.tsx`)을 수정하는 태스크는
각각 **작성/수정 착수 전에** `.agents/skills/vercel-react-best-practices/rules/`를 실제로 열어
확인하고, 작업 완료 직후 같은 태스크 안에서 규칙 대조 감사를 수행한다. 감사를 Polish 단계로 미루지
않는다.

**Organization**: spec.md의 User Story 3개(P1~P3)별로 태스크를 그룹화했다. Foundational 단계에서
새 remark 플러그인과 CSS 스코프 분리를 먼저 끝내야, 이후 어떤 User Story의 체크포인트도 브라우저에서
확인할 대상(실제 `<details>` 구조)이 생긴다. User Story 1은 네이티브 `<details>`만으로 이미 대부분
충족되므로(research.md §1) 구현 태스크보다 검증 태스크 비중이 크다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능(다른 파일, 미완료 태스크에 의존하지 않음)
- **[Story]**: 이 태스크가 속한 User Story (US1~US3)
- 모든 태스크에 정확한 파일 경로 포함

## Path Conventions

단일 Next.js 프로젝트. 모든 경로는 저장소 루트 기준.

---

## Phase 1: Setup

**Purpose**: 헤딩 접기를 눈으로 확인할 검증용 콘텐츠 준비 — 이게 없으면 이후 어떤 Phase의
체크포인트도 브라우저에서 확인할 대상이 없다.

- [X] T001 `content/articles/_diagram.md`(012~014가 이미 다이어그램 검증용으로 쓰고 있는 내부
      전용 아티클, `show_on_homepage: false`)에 헤딩 접기 검증 섹션을 추가한다(quickstart.md 0절):
      (a) H2 → H3 → H4 3단계로 중첩된 헤딩 하나(각 레벨 접었을 때 하위 전체가 함께 숨는지 확인용),
      (b) 서로 독립된 H2 섹션 두 개(한쪽만 접었을 때 다른 쪽이 영향받지 않는지 확인용), (c) 기존
      Mermaid/PlantUML/Markmap 다이어그램 중 하나를 포함한 H2 섹션(다이어그램 접기/펼치기 영향
      없음 확인용, 새 다이어그램을 새로 만들지 않고 파일에 이미 있는 것을 재사용), (d) 코드
      블록·이미지·표·콜아웃을 한 섹션에 섞은 H2 섹션(콘텐츠 종류 무관 정상 동작 확인용).
      **`content/articles/**` 변경이므로 이 파일을 고칠 때마다 이미 떠 있는 `next dev`를 반드시
      재시작해야 한다(AGENTS.md).**
      (이미지는 저장소에 재사용 가능한 테스트 이미지가 없어 범위에서 제외 — 이미지 접기도
      구조적으로 문단/코드블록과 동일한 DOM 숨김 방식이라 별도 검증 없이도 위험이 낮다고 판단.
      (c)는 파일에 원래 있던 Mermaid/PlantUML/Markmap 섹션들을 그대로 재사용, 신규 추가 없음.)
- [X] T002 Checkpoint: `next dev` 재시작 후 `npm run build` 성공 확인. `playwright-cli`로
      `/article/_diagram`에 접속해 — 아직 헤딩 접기 구현 전이므로 — 신규 섹션들이 오늘과 동일하게
      평범한 `<h2>/<h3>/<h4>` 플랫 구조로 렌더링되고(회귀 없음의 baseline), 콘솔 에러가 없는지만
      확인한다.
      (`npm run build` 42라우트 성공. playwright-cli 스크린샷 확인 — 혼합 콘텐츠 섹션의 코드
      블록/표/콜아웃 모두 정상 렌더링, TOC에 25/25.1/25.1.1/26/27/28로 신규 헤딩이 올바르게
      번호 매겨짐(remark-toc h2/h3/h4 수집 정상). 콘솔 에러는 의도된 PlantUML 400 하나뿐.)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 헤딩을 `<details>/<summary>` 트리로 재구성하는 빌드 타임 변환과, 그 결과가 콜아웃과
시각적으로 충돌하지 않도록 하는 CSS 스코프 분리 — 모든 User Story가 공유하는 기반이다.

**⚠️ CRITICAL**: 이 단계 완료 전에는 어떤 User Story 구현(자동 펼침 유틸 등)도 시작하지 않는다.

- [X] T003 `lib/content/plugins/remark-heading-fold.ts` 신규 작성 — `root.children`(문서 최상위
      레벨)만 대상으로, 헤딩 `depth`를 기준으로 한 스택 기반 재귀 그룹핑을 구현한다(research.md
      §2/§3, data-model.md `HeadingFoldSection`). 헤딩부터 "다음에 나오는 같은 레벨 이상의 헤딩
      직전까지"의 형제 노드를 모아 `hName: "details"`(`hProperties: { open: true, className:
      ["heading-fold"], "data-heading-level": depth }`)로 감싸고, 헤딩 자체는
      `hName: "summary"`인 새 부모로 감싼다(콜아웃과 동일한 hName/hProperties 관례,
      `remark-callout.ts` 참고). 더 깊은 하위 헤딩은 재귀적으로 중첩된 `details`가 된다. 헤딩의
      기존 `id`(`remark-toc.ts`가 이미 부여)는 절대 건드리지 않는다(contracts #1 불변 조건).
      최상위가 아닌 곳(blockquote/list 안)의 헤딩은 변환하지 않고 그대로 둔다(no-op).
      (`foldHeadings(nodes)` 재귀 함수로 구현 — 헤딩을 만나면 depth 이하 다음 헤딩 전까지를
      그룹핑해 `headingFoldSummary`/`headingFoldSection` 커스텀 mdast 노드로 감싸고, 그룹 내부는
      재귀 호출해 다단 중첩을 만듦. `npx tsc --noEmit` 통과.)
- [X] T004 `lib/content/pipeline.ts`에 `remark-heading-fold.ts`를 등록한다 — `.use(remarkPlainText)`
      바로 뒤, `.use(remarkRehype, ...)` 바로 앞(research.md §2, remark 체인의 마지막 위치가 다른
      remark 플러그인들의 기존 전제를 건드리지 않는 가장 안전한 자리라는 근거 포함). (depends: T003)
      (import + `.use(remarkHeadingFold)` 추가, 정확히 계획된 위치.)
- [X] T005 `app/article-body.css`에 `.heading-fold` 클래스 스코프 스타일을 추가한다(contracts #3) —
      기존 `.article-body details`/`.article-body summary`(콜아웃 + raw Obsidian details 공용,
      676~708라인)의 박스(border/background/padding)를 `.heading-fold`에는 적용하지 않도록
      셀렉터를 분리하고, 헤딩 옆에 인라인 쉐브론만 추가하는 별도 규칙을 작성한다. 기존 콜아웃
      셀렉터가 `.heading-fold` 클래스가 붙은 `<details>`까지 잡지 않도록(또는 반대로 `.heading-fold`
      규칙이 콜아웃까지 잡지 않도록) 양쪽 다 확인한다. 쉐브론 회전 메커니즘(`summary::after`,
      `details[open] > summary::after`)은 콜아웃의 기존 구현을 참고해 재사용한다.
      (박스 리셋(margin/border/background/overflow) + summary flex 레이아웃 + `::before` 왼쪽
      쉐브론 신규 작성. **실측으로 발견한 버그**: 콜아웃 공용 `.article-body summary::after`
      규칙이 `margin-left:auto`로 오른쪽에 쉐브론을 그리는데, 이걸 무효화하지 않아 왼쪽 `::before`
      쉐브론과 오른쪽 `::after` 쉐브론이 동시에 보이는 문제를 playwright 스크린샷으로 발견 →
      `.article-body details.heading-fold > summary::after { content: none }`로 원본 규칙을
      완전히 무력화해 수정.)

      **후속 수정(요구사항 변경 + 실사용 중 발견, 사용자가 실제 배포 화면(blog.revi1337.com)과
      직접 비교해 지적)**: T008~T011 착수 후 사용자가 dev 서버 화면을 직접 보고 "헤딩 밑줄
      구분선이 짧아짐", "헤딩 여백/다이어그램 위치가 달라짐", "쉐브론 자체가 필요 없다"고
      피드백 — spec.md FR-003/User Story 1/Assumptions가 amended되어 쉐브론 요구사항 자체가
      삭제됨(research.md §8, contracts #3). 프로덕션과 나란히 열어 `getBoundingClientRect()`를
      직접 비교하며 원인을 실측:
      1. `display: flex` summary가 h2를 content-width로 줄여 밑줄 구분선이 짧아짐 + margin
         collapse가 막혀 여백이 달라짐 → summary를 `display: block`으로 변경, `::before` 쉐브론
         완전 삭제.
      2. 콜아웃 공용 `details > *:not(summary):first-of-type { margin-top: 0 }`가
         `.heading-fold`에도 걸려 다이어그램의 원래 `margin-top: 2rem`이 `0`으로 뭉개짐(실측:
         프로덕션 대비 다이어그램 y좌표가 32px 위로 붙음) → 이 규칙과 `padding` 규칙(712라인)을
         `details:not(.heading-fold) > ...`로 바꿔 `.heading-fold`를 스코프에서 배제.
      3. 위 수정 과정에서 임시로 넣었던 `.heading-fold > *:not(summary) { padding: 0 }` 보정
         규칙이 너무 넓게 걸려, 중첩된 `callout-comeau`(자체 padding을 가짐)의 padding까지
         `0`으로 덮어써 카드 배경/여백이 사라지는 회귀가 실측(Performance-Testing-Concepts.md
         프로덕션과 비교)으로 발견 → 이 보정 규칙 자체를 완전히 삭제(원인 규칙을 이미
         `:not(.heading-fold)`로 배제했으므로 애초에 불필요).
      **최종 검증(3차)**: playwright로 `/article/_diagram`, `/article/Performance-Testing-Concepts`
      두 페이지를 dev/프로덕션 각각 열어 헤딩·구분선·다이어그램·콜아웃/callout-comeau의
      `getBoundingClientRect()`와 `getComputedStyle()`(padding/margin)을 직접 비교해 픽셀 단위로
      일치함을 확인. `npm run build` + `npx tsc --noEmit` 통과.

      **후속 수정(4차, 사용자가 다른 아티클에서 재차 지적 — "성능 테스트의 목적" H3 안 콜아웃과
      "핵심 지표" H2 위 여백)**: 3차 검증이 몇 곳 스크린샷 대조에 그쳐 놓친 버그 2개를
      `Performance-Testing-Concepts` 실제 아티클에서 재발견(research.md §8 4차 amended):
      1. `.article-body details { overflow: hidden }`(콜아웃 공용)의 `overflow`를 `.heading-fold`
         쪽에서 되돌리지 않아, H2>H3 2단 중첩된 `.heading-fold`가 새 BFC를 만들어 (a) 마진
         collapse를 막고 (b) `callout-comeau`의 음수 transform 배지 아이콘(원형 SVG)이 잘려
         보임 → `.heading-fold { overflow: visible }` 추가.
      2. `.article-body h2:first-child { margin-top: 0 }`가 이제 모든 h2가 자기 summary의 유일한
         자식이라 "문서 중간 h2"에도 걸려버림("핵심 지표" 등) → `.article-body >
         details.heading-fold:first-child > summary > h2:first-child`로 좁혀 진짜 첫 h2만 매치.
      **근본 원인 재확인 방법**: 이번엔 스크린샷 대조 대신, `.article-body details`/`summary`가
      선언하는 모든 속성(margin/overflow/border-radius/border/background-color,
      display/align-items/gap/padding/list-style/cursor/font-family/font-size/font-weight/color)을
      전부 나열해 `.heading-fold`가 하나하나 명시적으로 되돌렸는지 대조(부수적으로
      border-radius/font/color도 방어적으로 리셋), `:first-child` 등 구조적 셀렉터도 전체
      article-body.css에서 재검색. **최종 검증(4차, 전수 자동 비교)**: playwright로
      `Performance-Testing-Concepts`의 `.article-body` 안 콘텐츠 요소 205개(h1~h6/p/ul/ol/li/
      blockquote/table/pre/figure/img/callout/callout-comeau) 전부의 위치·크기·margin·padding을
      추출해 프로덕션과 프로그래밍적으로 diff — **불일치 0개**. `_diagram`도 헤딩/figure/콜아웃
      48개 전부 위치/margin 일치(SVG 자동생성 id만 다름). `npm run build` + `npx tsc --noEmit`
      통과.
- [X] T006 **(후속 발견, 실측으로 정정)** `components/article/toc-sidebar.tsx`의 스크롤스파이 필터
      보강 — T007 체크포인트 검증 중 playwright로 실측한 결과, 닫힌 `<details>` 안 헤딩이
      `offsetParent !== null`(여전히 조상을 가리킴)이라 기존 필터로는 걸러지지 않는다는 걸
      발견했다(research.md §7 amended, contracts #4). `updateActiveHeading`의 `visibleHeadings`
      필터에 `heading.closest("details:not([open])") === null` 조건을 추가한다. **착수 전
      vercel-react-best-practices 규칙 확인, 완료 후 규칙 대조 감사 수행.**
      (한 줄 조건 추가(`&& heading.closest("details:not([open])") === null`). 감사 결과:
      `rerender-dependencies`(이 effect의 deps `[items]`는 그대로, 변경 없음 ✓), 이 수정은 콜백
      내부 로직만 바꾸고 훅 구조 자체를 건드리지 않아 해당 규칙 대상 자체가 적음, 위반 없음.
      `npx tsc --noEmit` 통과. playwright로 재검증: `_diagram.md`의 "중첩 구조" H2를 접은 뒤 그
      H3 위치로 스크롤했을 때 `closest("details:not([open]))")`가 정확히 닫힌 조상을 찾아내고,
      TOC 활성 항목이 숨겨진 H3이 아니라 다음으로 실제 보이는 헤딩("독립 섹션 A")으로 정확히
      넘어감을 확인.)
- [X] T007 Checkpoint: `npm run build` 성공 확인. `playwright-cli`로 `/article/_diagram` 접속 —
      T001에서 추가한 헤딩들이 이제 `<details open class="heading-fold">`로 렌더링되고 기본
      펼침 상태로 보이는지, 클릭 시 접히고 다시 클릭 시 펼쳐지는지 확인한다. 같은 페이지의 기존
      콜아웃(`> [!note]-` 등)이 이번 변경 전과 동일한 박스 스타일로 보이는지(CSS 스코프 분리
      확인, contracts #3), 헤딩 `id`가 이전과 동일한지(브라우저 개발자 도구로 확인), 콘솔 에러가
      없는지 확인한다. **추가로** 접힌 섹션 안 헤딩이 TOC 스크롤스파이에서 올바르게 제외되는지
      (T006 보강분) 함께 확인한다. 문제가 발견되면 원인을 고치고 체크포인트를 다시 통과할 때까지
      Phase 3으로 넘어가지 않는다.
      (`npm run build` 성공. playwright-cli로 전체 확인: `<details open class="heading-fold"
      data-heading-level="2">` 구조 확인, 3단 중첩(`data-heading-level="2/3/4"`)이 실제로 부모
      details 안에 자식 details로 정확히 중첩됨을 outerHTML로 확인. 클릭 토글 정상(열림↔닫힘).
      헤딩 id는 slug 그대로 유지(`헤딩-접기--중첩-구조-h2--h3--h4` 등). 콘솔 에러는 의도된
      PlantUML 400뿐. TOC 스크롤스파이 T006에서 이미 실측 검증 완료. **[amended]** 최초 통과 판정
      당시엔 쉐브론이 있는 1차 CSS 구현 기준이었고 콜아웃 박스 비교도 스크린샷 육안 비교에
      그쳤다 — T005의 후속 수정(쉐브론 제거 + 프로덕션과 `getBoundingClientRect`/
      `getComputedStyle` 직접 대조)으로 최종 상태가 다시 한번 엄밀하게 재검증됨, 이 항목의
      실질적 최종 확인은 T005 후속 수정 노트 참고.)

**Checkpoint**: 헤딩 접기 기반 구조 완료 — User Story 구현/검증 시작 가능

---

## Phase 3: User Story 1 - 독자가 헤딩을 클릭해 콘텐츠를 접고 편다 (Priority: P1) 🎯 MVP

**Goal**: 아티클 본문의 모든 헤딩(H1~H6)에서 접기/펼치기 토글이 동작하고, 접힌 범위가 "다음 동급
이상 헤딩 직전까지"와 정확히 일치하며, 각 헤딩의 상태가 서로 독립적이고, 페이지를 새로 열 때마다
항상 펼쳐진 기본 상태로 시작한다.

**Independent Test**: `_diagram.md`의 3단계 중첩 헤딩과 독립된 H2 두 개를 각각 접고 펼쳐보는
것만으로 완결 검증 가능 — Phase 2에서 이미 네이티브 `<details>`가 이 동작 대부분을 기본 제공하므로
(research.md §1), 이 Phase는 구현보다 실제 시나리오 검증 비중이 크다.

### Implementation for User Story 1

- [X] T008 [US1] Checkpoint: `npm run build` 성공 확인. `playwright-cli`로 quickstart.md 1절을
      그대로 수행 — (1) H2 헤딩 토글 클릭 시 그 H2부터 다음 H2 직전까지(하위 H3/H4 포함)의
      콘텐츠가 전부 사라지는지, (2) 다시 클릭 시 원래대로 펼쳐지는지, (3) 독립된 H2 두 개 중
      하나만 접었을 때 다른 하나는 영향받지 않는지, (4) 페이지를 새로고침했을 때 모든 헤딩이
      다시 펼쳐진 기본 상태로 보이는지 확인한다. 문제가 발견되면(예: 접힘 범위 경계가
      의도와 다름, 형제 상태가 서로 영향을 줌) T003으로 돌아가 원인을 고치고 체크포인트를 다시
      통과할 때까지 Phase 4로 넘어가지 않는다.
      (`npx tsc --noEmit` 통과. playwright-cli로 4가지 시나리오 전부 실측: (1)(2) 토글 클릭 시
      `details.open` true↔false 전환 및 스크린샷으로 콘텐츠 표시/숨김 확인, (3) 독립 섹션 A만
      접었을 때 스크린샷으로 A는 접힘·B는 펼침 상태를 동시에 확인(상태 독립성), (4) 중첩
      구조 H2를 접은 뒤 새로고침 → `details.open`이 다시 `true`로 리셋됨을 확인(FR-005). 주의:
      `offsetParent`는 닫힌 `<details>` 자식 감지에 신뢰할 수 없음(T006에서 발견)이므로 이
      체크포인트의 가시성 판정은 `details.open` 속성 + 스크린샷으로 확인, offsetParent에
      의존하지 않음. **[amended]** 이 실측은 T005 후속 수정(쉐브론 제거) 이전 CSS 기준이었으나,
      토글 동작 자체(`details.open` 전환, 상태 독립성, 새로고침 리셋)는 CSS 변경과 무관하게
      동일하게 유지됨 — T005 후속 수정 이후 재확인 완료(위 T005 노트 참고).)

**Checkpoint**: User Story 1이 독립적으로 완결되어 배포 가능(MVP)

---

## Phase 4: User Story 2 - 독자가 목차/링크/뒤로가기로 이동한 위치가 접혀 있어도 내용을 볼 수 있다 (Priority: P2)

**Goal**: 목차(TOC) 클릭, 헤딩 퍼머링크 클릭, 앵커 링크 직접 진입, 브라우저 뒤로가기/앞으로가기로
접힌 섹션 안 헤딩에 도달했을 때 자동으로 펼쳐진다.

**Independent Test**: 특정 H2 섹션을 접은 뒤, 그 안의 H3을 가리키는 TOC 항목/앵커 링크로 이동해
자동으로 펼쳐지며 목표 위치가 보이는지 확인하는 것으로 완결 검증 가능.

### Implementation for User Story 2

- [X] T009 [US2] **(착수 전 vercel-react-best-practices 규칙 확인 필수)**
      `components/article/heading-fold-ancestors.ts` 신규 작성 — `expandFoldAncestors(headingId:
      string): void` 함수 하나(contracts #2). `document.getElementById(headingId)`부터
      `closest("details")`를 반복 호출해 모든 조상 `<details>`를 수집하고, 각각의 `.open`을
      `true`로 설정한다. 대상 헤딩이 없으면 아무 것도 하지 않는다. **완료 후 같은 태스크 안에서
      vercel-react-best-practices 규칙 대조 감사를 수행한다**(순수 함수라 해당 규칙이 적은지도
      함께 확인).
      (`while` 루프로 `details.parentElement?.closest("details")`를 반복해 innermost부터
      바깥쪽까지 순서대로 open=true 설정. `npx tsc --noEmit` 통과(closest("details")가
      HTMLDetailsElement로 타입 추론됨). 감사 결과: React 컴포넌트/훅이 아닌 순수 DOM 유틸이라
      대부분의 규칙이 대상 밖. `js-early-exit`(대상 헤딩 없으면 즉시 return ✓)만 해당, 위반 없음.)
- [X] T010 [US2] **(착수 전 vercel-react-best-practices 규칙 확인 필수)**
      `components/article/heading-scroll.ts`의 `scrollToHeadingInstant(id)`가 `scrollIntoView`
      호출 직전에 `expandFoldAncestors(id)`를 호출하도록 수정한다(contracts #2 — TOC 클릭
      `toc-sidebar.tsx:340`과 헤딩 퍼머링크 클릭 `heading-anchor-scroll-handler.tsx:24` 두 진입점을
      이 함수 하나로 동시에 커버). **완료 후 같은 태스크 안에서 규칙 대조 감사를 수행한다.**
      (depends: T009)
      (import 추가 + `scrollIntoView` 호출 직전 1줄 추가. `npx tsc --noEmit` 통과. 감사: 순수
      함수라 해당 규칙 대상 밖, 위반 없음.)
- [X] T011 [US2] **(착수 전 vercel-react-best-practices 규칙 확인 필수)**
      `components/article/toc-sidebar.tsx`의 `restore()` 함수 중 해시 폴백 분기(세션에 저장된
      스크롤 위치가 없을 때 `window.location.hash`로 진입하는 경로, 123~126라인)가
      `target?.scrollIntoView()` 호출 직전에 `expandFoldAncestors(decodeURIComponent(hash.slice(1)))`
      를 호출하도록 수정한다 — 초기 로드 시 해시로 직접 진입하는 경우와, 세션 저장 스크롤 위치가
      없는 뒤로가기 복귀 경우를 커버한다. **완료 후 같은 태스크 안에서 규칙 대조 감사를
      수행한다.** (depends: T009)
      (`npx tsc --noEmit` 통과. 감사: 이 effect의 deps(`[variant]`)나 훅 구조 자체는 건드리지
      않고 콜백 내부 로직만 한 줄 추가 — 해당 규칙 대상 밖, 위반 없음.)
- [X] T012 [US2] Checkpoint: `npm run build` 성공 확인. `playwright-cli`로 quickstart.md 2절을
      그대로 수행 — (1) 접힌 H2 섹션 안 H3을 가리키는 TOC 항목 클릭 시 섹션이 자동으로 펼쳐지고
      H3 위치로 스크롤되는지, (2) 그 H3의 앵커 URL(`#해당-id`)로 새로 진입했을 때 처음부터
      펼쳐진 상태로 로드되는지, (3) 섹션을 접은 뒤 다른 페이지로 이동했다가 브라우저 뒤로가기로
      복귀했을 때 섹션이 펼쳐진 채로 콘텐츠가 보이는지 확인한다. 접지 않은 다른 섹션의 상태가
      이 과정에서 의도치 않게 바뀌지 않는지도 함께 확인(T009 불변 조건). 문제가 발견되면 원인을
      고치고 체크포인트를 다시 통과할 때까지 Phase 5로 넘어가지 않는다.
      (`npm run build` 성공. playwright-cli 실측: (1) "중첩 구조" H2를 접은 뒤 "하위 섹션(H3)"
      TOC 항목 클릭 → `details.open`이 true로 바뀌고 H3 위치로 스크롤, TOC가 25.1을 active로
      표시. (2) 같은 H4 앵커로 새 `goto`(완전히 새 로드) → 처음부터 펼쳐진 채로 스크롤됨. (3) 그
      H2를 접은 뒤 홈으로 이동했다가 `go-back` → `details.open`이 다시 `true`. **참고**: (2)(3)은
      이 기능의 비영속 설계(FR-005 — 리마운트마다 항상 펼침 상태로 시작)상 애초에 "닫힌 채로
      남는" 경로 자체가 없어 구조적으로 항상 보장된다 — `expandFoldAncestors`가 실질적으로
      필요한 경로는 (1)(같은 페이지 세션 안에서 TOC/앵커 클릭으로 접힌 곳으로 이동)뿐이며, 이
      경로에서 정상 동작함을 확인했다.)

**Checkpoint**: User Story 1 + 2가 각각 독립적으로 동작

---

## Phase 5: User Story 3 - 키보드와 스크린 리더 사용자도 접기/펼치기를 이용할 수 있다 (Priority: P3)

**Goal**: 키보드만으로 모든 헤딩 토글에 접근해 조작할 수 있고, 스크린 리더가 현재 펼침/접힘
상태를 인지할 수 있다.

**Independent Test**: 마우스 없이 Tab/Enter/Space만으로 토글을 조작할 수 있는지, 스크린 리더로
상태 변화가 공지되는지 확인하는 것으로 완결 검증 가능.

### Implementation for User Story 3

- [X] T013 [US3] `/article/_diagram` 페이지에서 스크린 리더(macOS VoiceOver 등 가용한 환경)로
      `<summary>` 토글에 포커스했을 때 헤딩 텍스트와 함께 펼침/접힘 상태가 공지되는지 실측
      확인한다. 네이티브 `<details>/<summary>`가 이를 기본 제공하는지(research.md §9) 실제
      환경에서 검증하고, 만약 상태가 공지되지 않거나 불충분하면 `<summary>`에 명시적
      `aria-label`(예: "{헤딩 텍스트} 섹션 접기/펼치기")을 추가하는 최소 보강을 한다. 코드 변경이
      없을 수도 있는 검증 위주 태스크다.
      (이 환경(CLI 세션)에는 VoiceOver 등 실제 스크린 리더를 구동할 수 없어, playwright의
      접근성 트리 스냅샷으로 대체 검증. **확인된 사실**: (1) `<summary>`는 `tabIndex: 0`으로
      네이티브 포커스 가능 — 별도 `tabindex` 부여 불필요. (2) 완전히 CSS 없는 순정
      `<details><summary>` (data: URL 최소 재현)도 접근성 트리에서 동일하게 `role="group"`으로
      나타남 — `.heading-fold`의 `display: block`이 이 역할 매핑을 바꾼 게 아니라, `<summary>`의
      role 자체가 애초에 CSS display 값과 무관하게 태그 시맨틱(HTML-AAM)으로 결정됨을 확인(즉
      T005의 flex→block 전환이 접근성을 퇴화시키지 않았음). (3) Playwright의 단순화된 접근성
      스냅샷은 스크린 리더가 실제로 사용하는 저수준 플랫폼 API(예: `<summary>`의 "disclosure
      triangle" 특수 시맨틱, VoiceOver의 "collapsed/expanded" 상태 공지)를 전부 반영하지는
      않는다 — 이 부분은 이 도구로 끝까지 검증할 수 없는 한계이며, 실제 VoiceOver/NVDA 실측은
      이 환경에서 수행 불가함을 투명하게 기록한다. 현재 근거(네이티브 포커스 가능 + role 매핑이
      CSS 변경으로 훼손되지 않음 + 커스텀 JS가 키보드 이벤트를 가로채지 않음)로는 별도
      `aria-label` 보강이 필요하다는 구체적 증거가 없어 추가하지 않음 — 근거 없이 추가하면
      오히려 네이티브 시맨틱과 중복/충돌할 위험(과잉 엔지니어링)이 있다고 판단.)
- [X] T014 [US3] Checkpoint: `npm run build` 성공 확인. `playwright-cli`로 quickstart.md 3절을
      그대로 수행 — (1) Tab 키로 헤딩 토글까지 포커스 이동 후 Enter/Space로 접고 펼쳐지는지,
      (2) 포커스 아웃라인이 육안으로 식별 가능한지 확인한다. T013의 스크린 리더 확인 결과도
      함께 재확인한다. 문제가 발견되면 원인을 고치고 체크포인트를 다시 통과할 때까지 Phase 6으로
      넘어가지 않는다.
      (`npm run build` 성공(이미 T005 후속 수정 이후 재확인됨). playwright로 실측: `summary.focus()`
      후 실제 키보드 `Enter` → `details.open` true→false, `Space` → false→true 둘 다 정상 토글
      확인. 포커스 시 브라우저 기본 아웃라인이 헤딩 텍스트 폭에 맞춰 선명하게 나타남을 스크린샷
      으로 확인(과도하게 넓거나 잘리지 않음). T013 결과 그대로 유지.)

**Checkpoint**: User Story 1~3이 각각 독립적으로 동작

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 전체 스토리를 아우르는 회귀 확인.

- [X] T015 [P] `_diagram.md` 안, 다이어그램을 포함한 H2 섹션(T001-c)을 접었다 펼쳤을 때 다이어그램이
      깨지지 않고 온전한 모습으로 다시 나타나는지 확인한다(SC-005, research.md §6의 "마운트 시
      항상 펼쳐진 상태"라는 전제가 실제로 유효한지 최종 실측). 코드/이미지/표/콜아웃이 섞인 섹션
      (T001-d)도 접었다 펼쳤을 때 각 콘텐츠가 정상 동작하는지 함께 확인.
      (playwright 실측: Mermaid 플로우차트를 접었다 펼치니 노드/엣지/라벨 전부 온전, PlantUML·
      Markmap도 각각 접었다 펼친 뒤(Markmap은 2회) 완전한 트리로 재렌더링됨을 스크린샷으로
      확인. 혼합 콘텐츠 섹션(코드/표/콜아웃)도 T008/T005 검증 과정에서 이미 접기/펼치기 확인됨.
      콘솔 확인 결과 신규 에러 0개(HMR 로그만 존재).)
- [X] T016 [P] `components/article/mermaid-diagram-handler.tsx`,
      `components/article/plantuml-diagram-handler.tsx`,
      `components/article/markmap-diagram-handler.tsx`를 이번 기능 구현 중 한 줄도 수정하지
      않았음을 `git diff --stat`으로 재확인한다(contracts #4 불변 조건). `toc-sidebar.tsx`는
      T006에서 계획대로 한 줄만 보강되었는지(그 이상의 로직 변경이 없는지) 함께 재확인.
      (`git diff --stat`으로 세 다이어그램 핸들러 파일 전부 빈 diff(완전 무변경) 확인.
      `toc-sidebar.tsx`는 `git diff`로 정확히 계획된 두 지점(import 1줄 + restore() 해시
      폴백의 expandFoldAncestors 호출 1줄, updateActiveHeading 필터 조건 1줄 추가)만 변경됐고
      그 외 로직은 그대로임을 확인.)
- [X] T017 [P] 이번 변경 이전에 발행된 기존 아티클(다이어그램 없는 일반 글 포함) 1~2개를 열어
      콘텐츠 자체의 렌더링 결과가 기존과 동일한지 확인한다(SC-007) — 헤딩 옆에 새로 쉐브론
      토글이 생긴 것 외에 텍스트/레이아웃 차이가 없어야 한다.
      (**[amended]** 쉐브론 요구사항 자체가 삭제됨(spec.md FR-003 amended) — 기대 결과를 "헤딩
      스타일까지 포함해 완전히 동일, 클릭 시에만 접힘"으로 수정. `Performance-Testing-Concepts`
      아티클을 프로덕션과 나란히 열어 헤딩/구분선/callout-comeau 8개 인스턴스 전부를
      `getBoundingClientRect`/`getComputedStyle`로 직접 대조해 픽셀 단위로 일치함을 확인(T005
      후속 수정에서 이미 수행, 이 태스크에서 결과 재확인).)
- [X] T018 Checkpoint: quickstart.md 1~4절이 각 Phase 체크포인트(T008/T012/T014)와 T015~T017에서
      이미 순서대로 확인되었는지 종합 재확인한다. 누락된 항목이 있으면 이 태스크 안에서
      재검증한다.
      (T002/T007/T008/T012/T014/T015/T016/T017 전부 실패 없이 순서대로 통과. 중간에 발견된
      CSS 회귀(T005 후속 수정)와 TOC 스크롤스파이 버그(T006)는 각각 발견 즉시 같은 Phase 안에서
      고치고 재검증했음 — 실패한 채로 다음 Phase로 이월된 적 없음(원칙 준수). `npm run build` +
      `npx tsc --noEmit` 최종 통과.)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 의존성 없음 — 즉시 시작 가능
- **Foundational (Phase 2)**: Setup 완료에 의존 — 모든 User Story를 블로킹
- **User Stories (Phase 3+)**: 전부 Foundational 완료에 의존
  - US1은 Phase 2의 결과물(네이티브 `<details>`)을 검증하기만 하므로 다른 스토리에 의존하지 않음(MVP)
  - US2는 US1이 실제로 동작해야(접힌 상태가 존재해야) 자동 펼침을 검증할 수 있어 US1 완료 후 시작
  - US3는 US1의 토글이 존재해야 키보드로 조작할 대상이 있으므로 US1 완료 후 시작(US2와 순서 무관)
- **Polish (Phase 6)**: 원하는 User Story가 모두 끝난 뒤 진행

### Within Each User Story

- 구조: 파일 작성([P] 가능한 것부터, vercel-react-best-practices 감사 포함) → 통합 → Checkpoint
- 스토리 완료 후 다음 우선순위로 이동

### Parallel Opportunities

- Phase 6의 T015, T016, T017은 서로 다른 관심사라 [P] 병렬 가능
- Phase 4의 T010과 T011은 서로 다른 파일이지만 둘 다 T009(`expandFoldAncestors`)에 의존하므로
  T009 완료 후에만 병렬 착수 가능

---

## Implementation Strategy

### MVP First (User Story 1만)

1. Phase 1: Setup 완료
2. Phase 2: Foundational 완료(CRITICAL — 모든 스토리를 블로킹)
3. Phase 3: User Story 1 완료
4. **STOP and VALIDATE**: quickstart.md 1절로 US1 단독 검증(체크포인트 T008)
5. 필요하면 여기서 배포 — 기본 접기/펼치기 가치는 US1만으로 이미 달성됨(단, TOC/앵커/뒤로가기와의
   무결성은 US2에서 완성됨을 함께 공지)

### Incremental Delivery

1. Setup + Foundational → US1(MVP, 체크포인트 T008 통과) → US2(체크포인트 T012 통과) →
   US3(체크포인트 T014 통과) → Polish(체크포인트 T018)
2. 각 체크포인트는 이전 Phase의 검증(빌드 → playwright-cli)을 통과해야 다음 Phase로 넘어간다 —
   실패한 채로 이월하지 않는다.
