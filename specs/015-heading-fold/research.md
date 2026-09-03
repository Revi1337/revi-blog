# Research: 헤딩 접기/펼치기

## 1. 접기 프리미티브: 네이티브 `<details>/<summary>` vs 커스텀 JS 아코디언

**Decision**: 네이티브 `<details>/<summary>`를 재사용한다. 헤딩 자체는 `<summary>` 안에, 그 헤딩부터
다음 동급 이상 헤딩 직전까지의 콘텐츠는 `<details>`의 나머지 자식으로 넣는다. 기본 상태는
`<details open>`(spec.md FR-005 — 항상 펼쳐진 채로 시작).

**Rationale**:
- 이 프로젝트는 콜아웃 접기(`lib/content/plugins/remark-callout.ts:225`, `collapseState`에 따라
  `hName: "details"`)에서 이미 같은 프리미티브를 쓰고 있다 — 새 개념을 도입하지 않는다.
- 키보드 Enter/Space 토글, 클릭 가능한 disclosure triangle, 포커스 이동이 브라우저 기본 제공이라
  FR-008을 커스텀 JS 없이 충족한다.
- Chrome/Edge는 페이지 내 검색(Ctrl+F)이나 URL 프래그먼트로 닫힌 `<details>` 안의 콘텐츠에 도달하면
  자동으로 펼친다(§4 참고) — FR-010을 최소 Chromium 계열에서는 "공짜로" 충족한다.

**Alternatives considered**:
- **커스텀 JS 아코디언(예: `max-height` 트랜지션 + `aria-expanded` 수동 관리)**: 키보드 접근성,
  포커스 관리, ARIA 상태를 전부 직접 구현해야 하고, 페이지 내 검색과의 통합은 아예 불가능(브라우저
  네이티브 검색이 커스텀 DOM 숨김 방식을 이해하지 못함). 콜아웃과 스타일/동작이 미묘하게 달라질
  위험도 있다. 기각.
- **CSS `content-visibility: hidden` + `hidden="until-found"` (신생 웹 표준)**: `<details>` 없이도
  "숨겨진 콘텐츠 + 검색 시 자동 노출"을 일반화한 최신 API지만, 토글 UI(요약 줄, 클릭 영역, 열림
  표시)를 처음부터 직접 만들어야 하고 브라우저 지원이 `<details>`보다 더 제한적이다(§4). `<details>`가
  이미 이 조합(토글 UI + 검색 통합)을 기본 제공하므로 기각.

## 2. 변환 단계: remark(mdast) 플러그인 vs rehype(hast) 플러그인

**Decision**: **remark 단계**에 새 플러그인(`remark-heading-fold.ts`)을 추가하고, 파이프라인에서
`remarkPlainText` 바로 뒤, `.use(remarkRehype, ...)` 바로 앞에 배치한다.

> 이 결정은 처음 제안됐던 "rehype 플러그인(`rehypeHeadingAnchor` 이후)" 방향에서 조사 후 바뀐
> 것이다 — 아래 근거로 remark 단계가 더 적합하다고 판단했다.

**Rationale**:
- `lib/content/pipeline.ts`를 실제로 읽어보면 콜아웃(`remarkCallout`)과 TOC 추출(`remarkToc`) 모두
  이미 remark 단계에서 mdast를 다루며, heading 재구조화는 이들과 같은 "콘텐츠 구조 변환" 범주다 —
  rehype 쪽 플러그인들(`rehypePrettyCode`, `rehypePlantuml`, `rehypeCodeCopyButton`,
  `rehypeCodeLanguageLabel`, `rehypeKatex`)은 전부 특정 태그(코드 블록/수식) 전용이라 성격이 다르다.
- mdast `Heading` 노드는 `depth`(1~6) 필드를 직접 가지고 있어 레벨 비교 로직이 hast의 `tagName`
  문자열 비교("h1".."h6")보다 단순하다.
- `remarkPlainText`(검색 색인용 텍스트 추출, `lib/content/plugins/remark-plain-text.ts`)는
  `visit(tree, ...)`로 전체 트리를 깊이 우선 순회하며 블록 타입만 모아 이어붙인다 — 순회 순서는
  트리가 얼마나 중첩됐는지와 무관하므로, heading-fold를 그 뒤(remarkRehype 직전)에 둬도 순서상
  안전하다. 반대로 heading-fold를 먼저 두면 이후의 다른 remark 플러그인(`remarkHighlight`,
  `remarkMetrics`, `remarkImages` 등)이 애초에 예상하지 않은 중첩 구조를 만나 깨질 위험이 있다 —
  그래서 **remark 체인의 마지막**에 두는 것이 가장 안전하다.
- rehype 단계의 플러그인들(`rehypePrettyCode` 등)은 `visit()` 기반으로 특정 태그를 찾는 방식이라
  트리 중첩 깊이와 무관하게 동작할 것으로 예상되므로, heading-fold가 remark 단계에서 먼저
  `<details>/<summary>` 구조를 만들어놔도 이후 rehype 플러그인들은 영향받지 않는다.

**Alternatives considered**:
- **rehype 단계(rehypeHeadingAnchor 이후)**: 헤딩에 앵커 링크가 이미 삽입된 뒤 재구조화하므로
  순서상 문제는 없지만, hast에서 하는 것보다 mdast에서 하는 게 위 이유로 더 간단하고 안전하다.
  강하게 반대할 이유는 없지만 remark 쪽이 이 프로젝트의 기존 관례(콜아웃/TOC)와 더 일관된다.

## 3. 재구조화 알고리즘

**Decision**: `root.children`(문서 최상위 레벨)만 대상으로, 헤딩의 `depth`를 기준으로 한 스택 기반
그룹핑을 적용한다 — 목차 트리를 만들 때 흔히 쓰는 표준 패턴과 동일한 모양이다. 헤딩을 만나면 그
depth보다 크거나 같은 다음 헤딩이 나올 때까지의 형제 노드를 모아 새 `details`/`summary` 쌍으로
감싸고, 그 안에서 다시 더 깊은 헤딩을 만나면 재귀적으로 중첩한다.

**Rationale**: spec.md FR-002("그 헤딩부터 다음에 나오는 같은 레벨 이상의 헤딩 직전까지")와 정확히
일치하는 정의다.

**Assumption**: 헤딩은 문서 최상위 레벨(blockquote/list 등으로 감싸이지 않은)에만 나타나는 것으로
가정한다 — 이 블로그의 실제 콘텐츠 저작 관례상 헤딩이 콜아웃/리스트 안에 중첩되는 사례는 없다.
만약 발견되면 그 헤딩은 이번 변환 대상에서 제외되는 것으로 처리(no-op, 콜아웃이 마커 없는
blockquote를 그대로 반환하는 것과 동일한 방어적 관례).

## 4. FR-010(브라우저 검색 시 접힌 텍스트 노출) — 브라우저 지원 현황

**Decision**: 커스텀 폴리필 없이 각 브라우저의 네이티브 동작에 맡기고, Firefox/Safari의 제한을
알려진 한계로 문서화한다.

**Rationale**: 실제 조사 결과(WHATWG PR #6466, Chrome Platform Status "Auto-expand details
elements") — **Chrome/Edge(Chromium 계열)는 페이지 내 검색·URL 프래그먼트로 닫힌 `<details>` 안의
콘텐츠에 도달하면 자동으로 펼치는 기능을 이미 구현했다.** 반면 이 기능 표준화 논의 시점 기준
**Firefox와 WebKit(Safari)은 이 기능에 대해 명확한 지원 신호를 주지 않은 상태**다. 즉 FR-10은
Chromium 계열에서는 완전히 충족되지만, Firefox/Safari에서는 "독자가 어떤 섹션을 직접 접어둔 채로
그 안의 텍스트를 페이지 검색으로 찾는" 좁은 경우에 한해 그 매치가 화면에 자동으로 드러나지 않을 수
있다.

JS로 "페이지 내 검색이 매치를 찾았다"는 이벤트를 감지할 표준 API가 없어 신뢰할 만한 폴리필을 만들
수 없다(DEV Community 글 "Thoughts on find-in-page with custom accordion elements"도 동일한
결론). 이 블로그는 개인 기술 블로그로 사용 규모가 크지 않고, 기본 상태가 항상 펼쳐짐(FR-005)이라
이 격차가 발생하려면 독자가 "직접 접은 뒤 + 그 안을 검색"이라는 두 동작을 모두 해야 하는 좁은
경로임을 감안해, 이 한계를 받아들이고 별도 폴리필을 만들지 않는 것으로 결정한다.

**Alternatives considered**:
- **`selectionchange`/`scroll` 이벤트 휴리스틱으로 검색 매치 추정 후 강제 펼침**: 신뢰도가 낮고
  (DEV Community 글에서도 같은 결론) 부작용(의도치 않은 펼침) 위험이 이득보다 크다. 기각.

## 5. 클라이언트 자동 펼침(FR-006, User Story 2) — 통합 지점

**Decision**: 신규 공용 유틸(`components/article/heading-fold-ancestors.ts`, 가칭
`expandFoldAncestors(id: string)` — 주어진 heading id의 모든 조상 `<details>` 엘리먼트를
`closest("details")` 반복으로 찾아 `open = true`로 설정) 하나를 만들어 아래 세 지점 모두에서
스크롤 직전에 호출한다.

| 지점 | 파일 | 현재 코드 | 트리거 |
|---|---|---|---|
| TOC 클릭 | `components/article/toc-sidebar.tsx:340` | `scrollToHeadingInstant(item.id)` | 목차 항목 클릭 |
| 헤딩 퍼머링크 클릭 | `components/article/heading-anchor-scroll-handler.tsx:24` | `scrollToHeadingInstant(id)` | 헤딩 옆 `#` 아이콘 클릭 |
| 초기 로드/뒤로가기 해시 복원 | `components/article/toc-sidebar.tsx:123-126` | `restore()`의 해시 폴백 분기(`target?.scrollIntoView()`) | 앵커 링크로 직접 진입, 또는 세션 스크롤 위치가 없는 뒤로가기 |

앞의 두 지점은 이미 `scrollToHeadingInstant`(`components/article/heading-scroll.ts`) 하나를
공유하므로, 그 함수 내부에서 `scrollIntoView` 호출 직전에 `expandFoldAncestors(id)`를 부르면
두 지점을 한 번에 커버한다. 세 번째 지점(`toc-sidebar.tsx`의 `restore()`)은 별도 함수라 직접
수정이 필요하다.

**Rationale**: 실제 코드를 읽어 확인한 결과, 이 세 지점이 "특정 헤딩으로 점프"가 일어나는 진입점
전부다 — 별도의 새 이벤트 리스너 계층을 만들 필요 없이 기존 진입점에 한 줄씩만 추가하면 된다.

**Known complexity (참고, 이번 범위의 해결 대상 아님)**: `route-scroll-reset.tsx`는 pathname이
바뀔 때만 동작하고 해시만 바뀌는 내비게이션(TOC 클릭 등)은 다루지 않는다 — 그 경우의 뒤로가기
스크롤 복원은 이미 `toc-sidebar.tsx`의 `restore()`(세션 저장 스크롤 위치 우선, 없으면 해시 폴백)가
전담하고 있고, 이번 기능은 그 기존 경로에 자동 펼침만 얹는다. 이 복원 메커니즘 자체를 바꾸지
않는다.

## 6. 다이어그램(Mermaid/PlantUML/Markmap) 핸들러 — 영향 없음 확인

**Decision**: 다이어그램 핸들러 코드는 수정하지 않는다.

**Rationale**: 세 핸들러(`mermaid-diagram-handler.tsx`, `plantuml-diagram-handler.tsx`,
`markmap-diagram-handler.tsx`) 모두 `useEffect`/`useLayoutEffect`(deps `[]`)로 페이지 마운트 시
**1회만** 렌더링하며, 그 시점에 컨테이너 크기(`getBoundingClientRect`)를 측정한다. 헤딩 접기는
기본값이 `<details open>`(FR-005)이라 이 마운트 시점엔 모든 다이어그램이 항상 펼쳐진(보이는) 상태다
— 크기 측정이 깨질 수 있는 "숨겨진 채 마운트" 경로 자체가 생기지 않는다. 이후 독자가 직접 섹션을
접어도, 이미 완성된 SVG(고정 `height` 스타일, `width: 100%` CSS)를 감싼 조상 요소의 표시 여부만
바뀌므로 재계산이 필요 없다.

## 7. TOC 스크롤스파이 — `offsetParent` 필터가 실제로는 통하지 않음 (실측으로 가정 정정)

**[amended, T006 체크포인트 중 실측으로 발견]** 최초 결정은 "수정 불필요"였으나, playwright로
실제 브라우저에서 검증한 결과 그 근거(전제)가 틀렸음이 드러나 결정을 뒤집는다.

**최초 가정(틀림)**: `toc-sidebar.tsx`의 `offsetParent !== null` 필터(`components/article/
toc-sidebar.tsx:242`)가 "닫힌 콜아웃 `<details>` 안의 헤딩"을 걸러내는 것처럼, 헤딩 접기의 닫힌
`<details>` 안 헤딩도 자동으로 걸러질 것으로 가정했다 — 닫힌 `<details>`의 비-summary 자식은
`display: none`으로 렌더링되어 `offsetParent`가 `null`이 될 것이라는 전제였다.

**실측 결과(Chromium, playwright-cli)**: 이 전제가 틀렸다. 닫힌 `<details>` 안의 헤딩은 화면에
실제로 그려지지 않는데도(스크린샷으로 확인) `offsetParent`는 여전히 조상 엘리먼트(예: `<main>`)를
가리키고, `getBoundingClientRect()`도 0이 아닌 실제 좌표/크기를 반환한다 — 순수 `<details>`/
`<summary>`만 있는 최소 재현(data: URL)에서도 동일하게 재현됨을 확인했다. 즉 `offsetParent`
기반 검사만으로는 닫힌 `<details>` 안 콘텐츠를 감지할 수 없다. 이 가정은 콜아웃에 헤딩이 중첩된
사례가 이 블로그에 실제로 없었기 때문에 지금까지 한 번도 실전 검증되지 않은 채 남아 있던 잠재
결함이었다(코드 주석은 있었지만 실측 확인은 없었음).

**Decision(정정)**: `toc-sidebar.tsx`의 필터에 `heading.closest("details:not([open])") === null`
조건을 추가해 조상 체인에 닫힌 `<details>`가 있는지 직접 확인한다(`offsetParent` 체크는 다른 숨김
방식에 대한 방어선으로 그대로 유지). 이 수정은 헤딩 접기뿐 아니라 콜아웃에 헤딩이 중첩되는(현재는
없지만 이론상 가능한) 경우의 잠재 결함도 함께 고친다.

**Rationale**: 스크롤 위치와 무관하게 화면에 없는 헤딩이 TOC의 "현재 위치" 표시에 반영되면
안 되므로(spec.md FR-011 — 헤딩 접기가 기존 목차 기능을 깨뜨리면 안 됨), 실측으로 드러난 이
간극은 방치할 수 없다. `closest()` 기반 조상 탐색은 DOM 구조가 어떻든(콜아웃/헤딩 접기 몇 겹
중첩되든) 정확하다.

## 8. CSS — 콜아웃 박스 스타일과의 충돌 위험 → 실측으로 3단계 정정

**[amended, 실제 배포 화면(blog.revi1337.com)과 직접 비교해 발견]** 최초 결정과 그 이후 최초
구현은 모두 문제가 있었다 — 실제로 코드를 작성하고 playwright로 프로덕션과 나란히 비교한 뒤에야
드러난 문제들이라, 정정 과정 자체를 기록으로 남긴다.

**최초 Decision(1차, 틀림)**: 신규 `<details>`에 `heading-fold` 클래스를 부여하고 콜아웃 규칙에서
스코프를 뺀 뒤, `<summary>`를 `display: flex`로 만들어 왼쪽에 커스텀 쉐브론(`::before`)을 그린다.

**1차 구현의 문제(실측 발견)**: `display: flex`인 `<summary>` 안에서 `<h2>`가 flex item이 되며
content-width로 줄어들어 `h2::after`(전체 폭 밑줄 구분선)가 헤딩 텍스트 길이만큼만 짧아졌고,
flex 컨테이너가 margin collapse를 막아 헤딩 위/아래 여백도 원래와 달라졌다. 또한 콜아웃 공용
규칙(`.article-body summary::after`, `margin-left: auto`로 오른쪽에 그리는 쉐브론)을 무효화하지
않아 쉐브론이 좌우 두 개 겹쳐 보이는 문제도 있었다.

**사용자 피드백으로 요구사항 자체가 바뀜**: 애초에 쉐브론이 필요 없고, 접기 기능이 없던 기존
화면과 **완전히 동일한 시각 결과**를 유지한 채 헤딩 클릭만으로 토글되어야 한다는 것으로
FR-003/User Story 1/Assumptions가 amended됨(spec.md 참고).

**2차 구현**: `<summary>`를 `display: block`(플렉스 아님)으로 바꾸고 커스텀 쉐브론(`::before`)을
완전히 제거, `padding: 0`으로 콜아웃 공용 패딩(`0.75rem 1rem`)을 무효화. `details.heading-fold`
자체도 `margin: 0; border: none; background: none`으로 박스를 없앰. → **여기서 두 번째 버그가
실측으로 드러남**: 콜아웃 공용 규칙 `.article-body details > *:not(summary):first-of-type {
margin-top: 0 }`가 `.heading-fold`에도 그대로 걸려, 헤딩 바로 다음 콘텐츠(예: Mermaid 다이어그램
`figure`)의 원래 `margin-top: 2rem`이 `0`으로 뭉개졌다(실측: 다이어그램 y좌표가 프로덕션 대비
32px 위로 붙음).

**3차 구현(최종, 검증 완료)**: 콜아웃 전용 규칙 두 개(`details > *:not(summary) { padding }`,
`details > *:not(summary):first-of-type { margin-top: 0 }`)를 `details:not(.heading-fold) >
...`로 바꿔 `.heading-fold`를 아예 스코프 밖으로 뺀다 — 이러면 헤딩 접기 쪽에는 별도의
`*:not(summary) { padding: 0 }` 같은 보정 규칙 자체가 필요 없어진다(생략). 최초로 이 보정 규칙을
`.heading-fold` 스코프 안에 별도로 넣었을 때 **세 번째 버그**가 나왔다: 이 규칙이
`.heading-fold > *:not(summary)`처럼 너무 넓게 걸려, 이미 자체 padding을 갖고 있는
`callout-comeau`(중첩된 콜아웃)의 padding까지 `0`으로 덮어써 카드 배경/여백이 통째로 사라지는
회귀가 실측(playwright, Performance-Testing-Concepts.md 프로덕션과 비교)으로 발견됐다 — 이
보정 규칙을 완전히 삭제하는 것으로 해결(원인 규칙 자체를 `:not(.heading-fold)`로 배제했으므로
애초에 필요 없었음).

**최종 Decision(3차 시점)**: `<details class="heading-fold">`/`<summary>` 둘 다 자기 자신의 박스
모델(margin/border/background/padding)을 전혀 갖지 않는 완전히 "투명한" 래퍼로만 동작한다. 콜아웃
전용 규칙들은 `:not(.heading-fold)`로 스코프를 명시적으로 배제해, 헤딩 접기 자식 콘텐츠(문단,
다이어그램, 표, 중첩 콜아웃 등)는 각자 원래 갖고 있던 CSS를 그대로 유지한다. 쉐브론은 없다 —
콜아웃 공용 `summary::after`(쉐브론)만 `content: none`으로 무효화한다.

**[amended, 4차 — 사용자가 실제 배포 화면과 다시 대조해 두 곳을 구체적으로 지적한 뒤 발견]** 3차
검증이 "몇 군데 스크린샷 비교"에 그쳐 놓친 두 가지 버그가 실전(다른 실제 아티클
`Performance-Testing-Concepts`, H3 안에 중첩된 콜아웃 + 중간에 있는 H2)에서 드러났다:

1. **`overflow` 누락**: `.article-body details { overflow: hidden; ... }`(콜아웃 공용 규칙)의
   `overflow`를 `.heading-fold` 쪽에서 한 번도 되돌리지 않았다. `margin`/`border`/`background`만
   초기화하고 `overflow`는 빠뜨림 — `.heading-fold`가 여전히 `overflow: hidden`이라 새 블록
   서식 맥락(BFC)이 생겨 (a) 자식 마진이 조상 밖으로 collapse하지 못하고, (b) `position:
   absolute` + 음수 `transform`으로 박스 밖까지 튀어나오는 `callout-comeau`의 원형 배지 아이콘
   SVG가 잘려 보였다(원 일부가 잘린 채로 렌더링 — H2/H3 두 겹으로 중첩된 `.heading-fold`
   전부에서 발생, 콜아웃이 H3 아래(2단 중첩)에 있을 때 특히 눈에 띔). `overflow: visible`을
   명시적으로 추가해 해결.
2. **`h2:first-child` 오작동**: 기존 `.article-body h2:first-child { margin-top: 0 }`은 "문서의
   진짜 첫 h2"만 겨냥한 규칙이었는데, 이제 모든 h2가 자신만의 `<summary>`의 유일한 자식이 되면서
   **모든 h2가 각자 자기 부모 안에서 `:first-child`를 만족**하게 됐다 — 문서 중간에 있는 h2(예:
   "핵심 지표")도 `margin-top`이 실수로 0이 되어, 프로덕션보다 그 위 여백이 좁아 보였다.
   `.article-body > details.heading-fold:first-child > summary > h2:first-child`처럼 "article-
   body의 실제 첫 자식인 최상위 heading-fold 안의 h2"라는 조건을 명시해 진짜 첫 h2만 다시
   골라내도록 수정.

**교훈 — 왜 3차 검증이 이 둘을 놓쳤는가**: 3차 때는 눈에 띄는 곳(콜아웃 박스, 다이어그램 위치) 몇
군데만 스크린샷으로 대조했지 콜아웃/`details` 공용 규칙이 선언하는 **모든 속성**을
`.heading-fold`가 빠짐없이 되돌리는지 체계적으로 확인하지 않았다. 4차에서는 `.article-body
details`(margin, overflow, border-radius, border, background-color)와 `.article-body summary`
(display, align-items, gap, padding, list-style, cursor, font-family, font-size, font-weight,
color)가 선언하는 **속성을 전부 나열**해 `.heading-fold` 쪽에서 하나하나 명시적으로 되돌렸는지
대조하는 방식으로 감사했다(그 결과 `border-radius`/`font`/`color`도 시각적으로는 무해하지만
방어적으로 함께 리셋). `:first-child` 같은 구조적 셀렉터도 "DOM 계층이 한 단계 깊어지면 의미가
바뀔 수 있다"는 관점으로 전체 CSS 파일에서 `grep`으로 재검색해 확인했다.

**최종 검증(4차, 전수 비교)**: playwright로 `Performance-Testing-Concepts`의 `.article-body` 안
모든 콘텐츠 요소(h1~h6, p, ul, ol, li, blockquote, table, pre, figure, img, callout,
callout-comeau — 205개)의 위치(x/y)·크기(width/height)·margin-top/bottom·padding-top을
`getBoundingClientRect()`/`getComputedStyle()`로 하나하나 추출해 프로덕션과 **완전 자동 diff** —
205개 전부 일치(불일치 0개). `_diagram`도 헤딩/figure/콜아웃 48개 전부 위치·폭·margin-top
일치(SVG 자동생성 id만 다름, 무관). 스크린샷 육안 대조 방식보다 이 전수 비교가 더 신뢰도가 높다고
판단해 이후 회귀 확인에도 이 방법을 우선 사용하기로 함.

## 9. 접근성 — `<summary>` 안에 헤딩을 넣는 것의 시맨틱

**Decision**: `<summary><h2>...</h2></summary>` 형태(헤딩 엘리먼트를 summary의 자식으로)를 채택한다.

**Rationale**: 콜아웃도 동일하게 `<summary>` 안에 제목 텍스트를 넣는 구조를 쓰고 있어 일관되며,
스크린 리더는 `<summary>`를 disclosure 버튼으로, 그 안의 헤딩을 여전히 헤딩으로 인식한다(중첩된
인터랙티브 콘텐츠가 없는 한 유효한 패턴). `<summary>`에 `list-style: none` +
`::-webkit-details-marker { display: none }`로 기본 마커를 숨기는 것은 §8 최종 결정과 동일한
이유(쉐브론이든 기본 브라우저 마커든, 시각적으로 아무것도 추가하지 않는다). 실제 구현 후 스크린
리더(VoiceOver/NVDA 등) 실측으로 최종 확인은 `/speckit-tasks`의 P3(User Story 3) 체크포인트에서
수행한다.
