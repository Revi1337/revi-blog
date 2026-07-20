# Phase 0 Research: Markdown Extended Syntax

## 기존 코드 조사에서 확인된 사실

- `lib/content/pipeline.ts`는 `remark-parse → remark-gfm → remark-metrics → remark-toc →
  remarkRehype({allowDangerousHtml:true}) → rehype-pretty-code → rehype-stringify({allowDangerousHtml:true})`
  순서로 고정되어 있다. 신규 remark 플러그인은 `remarkRehype` 이전, 신규 rehype 플러그인은 그 이후에
  꽂아야 한다.
- `remark-metrics.ts`/`remark-toc.ts` 모두 `unist-util-visit`로 mdast를 순회하며, 변환 결과는
  `node.data = { hName, hProperties, hChildren }`를 직접 구성해 hast로 넘기는 동일한 패턴을 쓴다.
  아이콘이나 색상 같은 프레젠테이션 정보는 플러그인 파일 내부 상수(`ACCENT_CLASSES` 등)로 존재하며
  별도 config 파일을 두지 않는다.
- `lib/data/types.ts`의 `TocItem`은 `{ id, label, order }`만 가진다 — heading 레벨(depth) 정보를
  들고 있지 않다. 즉 h2/h3만 필터링해 넣는 현재 방식이 타입 구조 자체에도 이미 전제되어 있다.
- `package.json`에는 `lucide-react`가 이미 의존성으로 있지만, 이는 React 컴포넌트에서만 쓰이는
  아이콘 라이브러리다. `pipeline.ts`가 만드는 `bodyHtml`은 `rehype-stringify`가 만든 순수 HTML
  문자열이므로, 콜아웃 아이콘을 React 컴포넌트로 끼워 넣을 수 없다 — 정적 SVG 마크업(hast 엘리먼트)
  으로 직접 구성해야 한다.
- `app/globals.css`는 `.article-body` 스코프 아래 `.dark .article-body ...` / (기본, 라이트) 셀렉터
  쌍으로 다크·라이트를 구분하는 기존 관례가 있다(rehype-pretty-code 하이라이트 라인 스타일 참고).

## Decision: 콜아웃(`> [!TYPE]`) 구현 방식

- **Decision**: `remark-directive` 같은 범용 컨테이너 문법 라이브러리를 도입하지 않고,
  `remark-metrics.ts`와 동일한 hand-rolled 플러그인(`remark-callout.ts`)을 새로 작성한다.
  `blockquote` mdast 노드의 첫 자식이 `paragraph`이고, 그 첫 텍스트가 정규식
  `/^\[!(\w+)\]([-+])?(?:\s+(.*))?$/`에 매치하면 해당 blockquote 전체를 콜아웃 hast로 치환한다.
  타입→아이콘/강조색 매핑 테이블은 플러그인 파일 내부 상수로 둔다(기존 `ACCENT_CLASSES` 관례를
  따름, 별도 config 파일 신설 안 함).
- **Rationale**: `> [!TYPE]`은 문법적으로 이미 표준 blockquote이므로 파싱은 remark-parse가 전부
  해준 상태에서 텍스트 매칭만 하면 된다 — `remark-directive`(`:::type` 컨테이너 문법)가 요구하는
  별도 파서 확장이 필요 없다. 003 스펙에서도 비슷한 이유로 metrics 블록에 `remark-directive`
  대신 기존 코드펜스 파싱을 재사용하기로 결정한 전례가 있다(일관성).
- **아이콘 처리**: `lucide-react`의 해당 아이콘(Info, Lightbulb, AlertTriangle, XCircle 등) SVG
  path data를 정적 상수로 플러그인에 복사해, hast `<svg><path d="..."/></svg>` 엘리먼트로 직접
  구성한다. React 컴포넌트를 문자열 HTML 파이프라인에 섞어 쓰는 대신, 이미 앱 전역에서 쓰는
  아이콘 세트와 시각적으로 동일한 결과를 정적 마크업으로 재현하는 방식이다.
- **접기(`-`/`+`)**: 매치된 `-`/`+`에 따라 `<details open={type==='+'}>`/`<summary>` hast 마크업으로
  감싼다. P6(details 스타일링) CSS를 그대로 재사용하도록, 콜아웃 접기 UI와 details 순수 HTML
  접기 UI가 동일한 `.article-body details` 셀렉터를 공유하게 설계한다.
- **미상 타입 폴백**: 타입→스타일 매핑 테이블에 없는 키가 들어오면 `note` 스타일(기본 아이콘/색상)로
  폴백하되, 헤더에 표시되는 타입 라벨 텍스트는 매칭된 원본 문자열(`match[1]`)을 그대로 사용한다
  (FR-014).
- **GitHub Alerts 별칭**: `{ NOTE: "note", TIP: "tip", IMPORTANT: "important", WARNING: "warning",
  CAUTION: "danger" }` 형태의 별칭 테이블을 타입 매핑 앞단에 둬서, 대소문자 구분 없이(`toUpperCase()`
  정규화 후) 동일 컴포넌트로 렌더링되게 한다.
- **Alternatives considered**: `remark-directive` + `remark-directive-rehype` 조합 — `:::note`
  문법까지 지원하려면 유용하지만 이번 스펙 범위(`> [!TYPE]`만)에는 과한 투자이고, blockquote 기반
  파싱만으로 요구사항을 100% 충족할 수 있어 기각.

## Decision: 수식(`$..$` / `$$..$$`) 구현 방식

- **Decision**: `remark-math`(mdast에 `inlineMath`/`math` 노드 추가) + `rehype-katex`(해당 노드를
  KaTeX로 서버사이드 렌더링해 hast로 치환) 조합을 채택한다. `katex` 패키지의 CSS
  (`katex/dist/katex.min.css`)를 `app/globals.css`에 `@import`로 전역 포함한다.
- **Rationale**: 두 패키지 모두 unified/remark 생태계의 사실상 표준이며, `rehype-pretty-code`처럼
  빌드 타임에 이미 완결된 HTML(및 인라인 스타일)을 만들어내므로 기존 "파이프라인이 완결된 `bodyHtml`을
  만든다"는 003의 설계 원칙과 그대로 맞는다. 클라이언트 사이드 JS 렌더링(MathJax 계열)과 달리 KaTeX는
  빌드/요청 시점에 서버에서 최종 HTML을 만들어 하이드레이션이나 런타임 스크립트가 필요 없다.
- **폰트/디자인 규칙 예외 처리**: AGENTS.md는 본문 폰트를 Inter/JetBrains Mono로 제한한다. KaTeX는
  자체 수식 전용 웹폰트(KaTeX_Math 등)를 쓰므로, `.katex` 클래스로 스코프된 요소에만 예외가
  적용됨을 명시적으로 문서화한다(본문 텍스트 폰트 규칙 자체를 바꾸는 것이 아니라 수식 기호 렌더링에
  한정된 예외). `app/globals.css`에 이 예외 범위를 주석으로 남긴다.
- **에러 시 원본 텍스트 폴백(FR-015)**: `rehype-katex`에 `{ throwOnError: false, errorColor: "var(--color-error)" }`
  옵션을 전달한다. `throwOnError: false`일 때 KaTeX는 파이프라인 전체를 중단시키는 대신, 문제가
  된 수식 위치에 원본 TeX 소스 텍스트를 `errorColor`로 스타일링해 그대로 렌더링한다 — 이는
  "페이지 전체가 깨지지 않고 원본 텍스트가 표시된다"는 FR-015 요구를 KaTeX 기본 동작만으로 만족한다.
- **다크/라이트 대비**: `errorColor`와 수식 텍스트 색상 모두 다크/라이트 각각의 디자인 토큰(CSS
  변수)을 참조하도록 `app/globals.css`에서 `.katex { color: ... }` / `.dark .katex { color: ... }`
  쌍을 정의한다.
- **Alternatives considered**: `better-react-mathjax`(클라이언트 사이드 MathJax) — React 컴포넌트
  기반이라 `dangerouslySetInnerHTML` 정적 HTML 파이프라인과 맞지 않고, 클라이언트에서 매 페이지
  로드마다 재계산 비용이 든다(SSR 이점 상실) — 기각. `katex`를 빌드 타임에 직접 호출하는 커스텀
  rehype 플러그인 — `rehype-katex`가 이미 이 작업을 정확히 하고 있어 재발명 불필요 — 기각.

## Decision: 하이라이트(`==text==`) 구현 방식

- **Decision**: 외부 패키지(`remark-flexible-markers` 등)를 도입하지 않고, `text` mdast 노드만
  방문하는 hand-rolled 플러그인(`remark-highlight.ts`)을 작성한다. 정규식
  `/==([^=]+)==/g`로 텍스트 노드의 `value`를 분리해, 매치되지 않은 구간은 그대로 `text` 노드로,
  매치된 구간은 `<mark>` hast로 치환한 새로운 자식 배열로 원래 텍스트 노드를 대체한다.
- **Rationale**: mdast는 인라인 코드(`` `code` ``)를 파싱 단계에서 이미 별도의 `inlineCode`
  노드로, 코드 블록을 `code` 노드로 분리해 두기 때문에, `visit(tree, "text", ...)`로 순회하면
  코드 스팬/코드 블록 내부 텍스트는 애초에 방문 대상에 포함되지 않는다 — 별도의 "코드 안에서는
  제외" 로직을 추가로 짤 필요 없이 mdast 구조 자체가 Edge Case(코드 안 `==a==` 미변환)를 만족시킨다.
  이는 신규 npm 의존성 없이 기존 `remark-metrics.ts`/`remark-toc.ts`와 동일한 "unist-util-visit
  기반 hand-rolled 플러그인" 스타일을 유지한다는 점에서도 일관적이다.
- **Alternatives considered**: `remark-flexible-markers` — 별도 micromark 확장을 직접 작성하지
  않아도 되는 장점은 있지만, 신규 의존성 하나를 추가하는 비용 대비 text-node 정규식 치환만으로
  충분히 해결되는 단순한 문제라 기각. micromark 인라인 확장을 직접 작성하는 안 — 파서 레벨 확장은
  텍스트 노드 후처리보다 구현/검증 비용이 훨씬 크고, 이번 요구사항(단순 `==...==` 매칭)에는
  과한 투자로 판단해 기각.

## Decision: 주석(`%%text%%`) 구현 방식

- **Decision**: mdast 플러그인이 아니라, `renderMarkdown()` 호출 이전 `rawBody` 문자열 자체에
  적용하는 순수 문자열 전처리 유틸(`lib/content/strip-comments.ts`)로 구현한다. 먼저
  `/%%[\s\S]*?%%/g`로 정상적으로 닫힌 쌍을 전부 제거하고, 그 다음 남아 있는 `/%%[\s\S]*$/`
  (닫히지 않고 파일 끝까지 이어지는 나머지)를 제거한다.
- **Rationale**: 주석은 한 문단 중간에서 시작해 다른 문단이나 리스트를 가로질러 끝날 수 있고,
  최악의 경우 파일 끝까지 닫히지 않을 수 있다(Edge Case). mdast 트리는 이미 문단/리스트/헤딩 등으로
  블록 구조가 나뉜 뒤이므로, 트리 레벨에서 "이 위치부터 저 위치까지, 블록 경계를 넘어서" 노드를
  제거하는 로직은 여러 노드 타입을 가로지르는 범용 순회/절단 로직이 필요해 복잡도가 크게 늘어난다.
  반면 원본 텍스트 단계에서는 정규식 두 줄로 정확히 동일한 결과(완전 삭제, 미종료 시 EOF까지 삭제)를
  얻을 수 있다.
- **부작용 검토**: `%%`가 코드 펜스(```` ``` ````) 안에 등장하는 경우도 함께 제거되는 트레이드오프가
  있다 — 그러나 옵시디언 자체도 코드 블록 안의 `%%`는 주석으로 취급하지 않지만, 이번 스펙 범위에서
  이 케이스는 별도 Edge Case로 명시되지 않았고 발생 빈도가 낮다고 판단해 범위에서 제외한다(구현
  단순성 우선). 코드 블록 보호가 필요해지면 추후 별도 이슈로 분리한다.
- **Alternatives considered**: `remark-metrics.ts`와 동일한 mdast visit 후 노드 제거 패턴 — 인라인
  텍스트 중간에 걸친 경우와 여러 블록에 걸친 경우를 모두 다루려면 트리 재구성 로직이 필요해
  프로젝트의 다른 플러그인들보다 훨씬 복잡해진다는 점에서 기각.

## Decision: 전헤딩 앵커(h1~h6) vs TOC(h2~h3) 책임 분리

- **Decision**: 기존 `remark-toc.ts`의 `visit(tree, "heading", ...)` 콜백 내부에서, id 부여
  (`node.data.hProperties.id = slugger.slug(label)`)는 `depth`와 무관하게 모든 heading에 대해
  수행하고, `items.push(...)`(TOC 배열 수집)만 `node.depth === 2 || node.depth === 3` 조건 안으로
  옮긴다. 함수 시그니처와 반환값(`file.data.toc`), `TocItem` 타입은 변경하지 않는다.
- **Rationale**: 003 연구에서 이미 "id 부여와 TOC 수집을 한 패스에서 처리해 앵커 id가 항상
  일치하도록 보장한다"는 결정을 내렸다 — 이번에도 동일한 원칙(단일 패스, 단일 slugger 인스턴스)을
  유지하되 조건문 하나만 분리하면 되므로 기존 결정과 정합적이다. 별도 `rehype-slug` 같은 rehype
  단계 플러그인을 추가로 붙이면 두 알고리즘이 어긋날 위험이 다시 생긴다(003에서 이미 기각한 이유와
  동일).
- **Alternatives considered**: `rehype-slug`를 rehype 단계에 추가해 전체 heading에 id를 부여하고
  `remark-toc`는 그대로 두는 방식 — slug 알고리즘 두 개(하나는 `github-slugger` 직접 호출, 하나는
  `rehype-slug` 내부 구현)가 병존하게 되어 TOC 앵커와 실제 heading id가 어긋날 이론적 위험이 있다.
  003에서 동일한 이유로 이미 기각된 대안이라 재검토하지 않는다.

## Decision: details 스타일링

- **Decision**: 코드 변경 없음. `app/globals.css`의 `.article-body` 스코프에
  `.article-body details` / `.article-body summary`와 그 다크 변형(`.dark .article-body details` 등)
  셀렉터만 추가해, 테두리·패딩·화살표 아이콘 회전 애니메이션을 기존 디자인 토큰(콜아웃과 동일한
  `surface-container`, `outline-variant` 계열 CSS 변수)으로 구성한다.
- **Rationale**: `allowDangerousHtml: true`가 이미 파이프라인 양 끝(`remarkRehype`,
  `rehypeStringify`)에 설정되어 있고 별도 sanitize 단계가 없어, 저자가 본문에 raw `<details>` HTML을
  적어두면 그대로 통과해 브라우저 네이티브 접기/펼치기로 이미 동작한다. 콜아웃(P1)의 접기 UI도 동일한
  `<details>` 마크업으로 구현하므로, 이 CSS 작업을 먼저 해두면 콜아웃 접기 UI가 자동으로 같은 스타일을
  물려받는다.
- **Alternatives considered**: React `<details>` 래퍼 컴포넌트를 만들어 마크다운 파서가 별도
  디렉티브로 인식하게 하는 방식 — 이미 raw HTML 통과로 동작하는 기능을 굳이 새 문법과 React 컴포넌트로
  재구현하는 것은 불필요한 작업이라 기각.

## 검증(Verification) 방식

- **Decision**: `content/articles/_syntax-preview.md`를 `showOnHomepage: false`로 신규 추가해 6개
  문법을 전부 포함시킨다. `npm run build`로 정적 생성 성공을 확인한 뒤, `claude-in-chrome`으로 해당
  아티클 상세 페이지를 다크/라이트 각각 열어 시각적으로 확인한다(사용자가 이번 피처의 검증 수단으로
  `claude-in-chrome`을 명시적으로 지정).
- **회귀(SC-004) 확인**: 기존 7개 아티클은 이번 6개 신규 문법을 전혀 쓰지 않으므로, 이번 변경
  전후로 `npm run build`가 생성하는 정적 HTML 출력이 바뀌지 않아야 한다. `git stash` 전/후로
  `.next/server/app/article/**` 빌드 산출물을 비교하는 대신, 더 실용적으로는 6개 신규 플러그인이
  모두 "해당 패턴이 없으면 트리를 그대로 통과시킨다"는 no-op 보장을 각 플러그인 구현 시 명시적으로
  지키는 것으로 회귀를 원천 차단한다(예: `remark-callout`은 `[!TYPE]` 패턴이 없는 blockquote는
  손대지 않고 그대로 반환).

## 미해결 사항

없음 — 모든 기술적 선택이 위에서 확정됨.
