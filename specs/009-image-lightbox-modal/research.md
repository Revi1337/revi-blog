# Phase 0 Research: 게시글 이미지 라이트박스 모달

Technical Context에 `NEEDS CLARIFICATION`은 없었다(사전 대화에서 라이브러리 선택과 핵심
기술 결정이 이미 확정됨). 아래는 그 결정들의 근거와 검토했던 대안을 기록한다.

## 1. 라이브러리 선택: PhotoSwipe vs React 전용 라이트박스 vs 커스텀 구현

- **Decision**: PhotoSwipe(v5, MIT 라이선스, vanilla JS)를 사용한다.
- **Rationale**: npm 주간 다운로드 기준(532,388 vs `yet-another-react-lightbox` 480,716,
  `lightgallery` 96,411, `react-image-lightbox` 115,684, `fslightbox-react` 23,437 — 2026-07-14~20
  집계) 동급 라이브러리 중 가장 널리 쓰이고 안정적이다. 이 프로젝트는 게시글 본문
  (`app/article/[slug]/page.tsx`)을 `dangerouslySetInnerHTML`로 렌더링하기 때문에 본문 이미지가
  React가 관리하지 않는 순수 DOM `<img>` 태그다. PhotoSwipe는 vanilla JS라 이 DOM에 클릭 위임으로
  바로 붙일 수 있어, 코드베이스에 이미 있는 `CodeCopyHandler`(document 레벨 이벤트 위임) 패턴을
  그대로 재사용할 수 있다.
- **Alternatives considered**:
  - `yet-another-react-lightbox` — 다운로드 수는 PhotoSwipe와 큰 차이가 없을 만큼 안정적이지만,
    슬라이드 배열을 React state로 사전 구성해야 하는 구조다. 본문 이미지가 `dangerouslySetInnerHTML`
    문자열 안에 있으므로 이를 파싱해 React state와 동기화하는 추가 매핑 계층이 필요해져
    PhotoSwipe보다 통합 비용이 크다.
  - 커스텀 구현 — 확대/축소, pinch 제스처, 포커스 트랩, 접근성(ARIA) 등 엣지케이스가 많아
    직접 만들면 버그 표면이 넓어진다. 두 상위 후보 모두 이 문제를 이미 검증된 형태로 해결하고
    있어 커스텀 구현의 이점이 없다.

## 2. 진입점 두 곳의 DOM 구조 차이 처리

- **Decision**: 본문 이미지는 document 레벨 이벤트 위임(`ImageLightboxHandler`, `CodeCopyHandler`와
  동일 패턴)으로, 썸네일은 `ArticleHeader`의 `next/image` wrapper에 직접 `onClick`을 붙이는
  방식으로 처리한다. 두 진입점은 서로 다른 PhotoSwipe 갤러리(별도 `dataSource`)로 완전히
  분리한다(spec FR-014).
- **Rationale**: 본문 이미지(`app/article/[slug]/page.tsx:32`)는 React가 관리하지 않는 순수
  HTML `<img>`라 이벤트 위임이 유일하게 안정적인 훅 지점이다. 반면 썸네일
  (`components/article/article-header.tsx:86`)은 이미 React 컴포넌트 트리 안에 있으므로
  일반적인 `onClick` prop으로 충분하며, 굳이 이벤트 위임을 쓸 이유가 없다.
- **Alternatives considered**: 두 진입점을 하나의 PhotoSwipe 갤러리(단일 `dataSource`)로 묶어
  썸네일도 갤러리 탐색에 포함시키는 방안 — spec 명확화 단계에서 사용자가 "썸네일은 본문 이미지
  갤러리와 별도 취급"을 선택했으므로(FR-014) 기각.

## 3. 본문 이미지 갤러리 데이터 준비 시점

- **Decision**: 마크다운 렌더링 파이프라인(`lib/content/pipeline.ts`)에 신규 remark 플러그인
  `remark-images`를 추가해, `remark-toc`(`lib/content/plugins/remark-toc.ts`)와 동일한 패턴으로
  mdast의 `image` 노드를 순회하며 순서(order)·`src`·`alt`를 수집하고, 각 노드에
  `data-lightbox-index` hProperty를 부여한다. 결과는 `RenderResult.images`로 노출되어
  `Article.images`에 포함된다. 클라이언트에서 렌더된 DOM을 순회해 런타임에 목록을 구성하지 않는다.
- **Rationale**: `remark-toc`가 이미 이 저장소에서 "빌드 타임에 AST를 순회해 구조화된 목록을
  뽑아내고, 동시에 DOM에 매칭용 속성을 심는다"는 패턴을 heading에 대해 검증해 두었다. 이미지에도
  동일한 패턴을 적용하면, 하이드레이션 타이밍에 의존하지 않고 인디케이터(FR-013, "2 / 5")에
  필요한 순서·개수를 항상 정확히 보장할 수 있다. `data-lightbox-index`를 DOM에 직접 심어 두면
  클릭 핸들러가 "몇 번째 이미지를 클릭했는지"를 추측 없이 바로 읽을 수 있다.
- **Alternatives considered**: 클라이언트에서 `article-body` 컨테이너의 `<img>`를
  `querySelectorAll`로 순회해 런타임에 목록을 구성 — 하이드레이션 이전에는 목록을 알 수 없고,
  rehype 단계에서 이미지가 다른 요소(예: `rehype-pretty-code`의 코드 블록처럼 래핑될 가능성)로
  감싸질 경우 순서 매칭이 깨지기 쉬워 기각.

## 4. 모달 크기 제약 (뷰포트 전체를 덮지 않음, spec FR-003)

- **Decision**: PhotoSwipe의 `paddingFn` 옵션에 뷰포트 크기 비례 여백(데스크톱 8%, 640px 미만
  좁은 뷰포트는 4%)을 계산해 반환하는 순수 함수를 전달한다(`lib/lightbox/open-image-lightbox.ts`).
  CSS 커스텀 속성을 통한 브레이크포인트 노출은 하지 않는다 — 아래 구현 중 수정 사항 참조.
- **Rationale**: PhotoSwipe 기본 동작은 여백 없는 풀스크린 오버레이다. `paddingFn`은 PhotoSwipe
  가 슬라이드 크기를 계산하는 매 단계에서 호출되는 공식 확장 지점이라, CSS만으로 억지로 크기를
  제한하는 것보다 확대/축소 로직과 항상 일관된 결과를 준다. PhotoSwipe 공식 문서가 "`paddingFn`은
  자주 호출되므로 성능에 유의하라"고 명시하므로, `getComputedStyle`로 CSS 변수를 읽는 대신 순수
  산술 연산만 하는 함수로 구현해 리플로우를 유발하지 않는다.
- **Alternatives considered**: 컨테이너에 `max-width`/`max-height` CSS만 적용 — PhotoSwipe의
  내부 확대/축소 배율 계산이 실제 렌더 크기를 기준으로 하므로, CSS로만 크기를 제한하면 확대
  배율 계산과 실제 표시 크기가 어긋날 수 있어 기각. CSS 커스텀 속성으로 여백 값을 노출하고
  `paddingFn`이 `getComputedStyle`로 읽는 방안 — 매 프레임 가깝게 호출되는 함수 안에서
  레이아웃을 강제로 동기화(forced reflow)하게 되어 기각.
- **구현 중 발견한 필수 선행 조건**: `paddingFn`이 여백을 정상적으로 반영하려면 각 이미지의
  `w`/`h`(픽셀 치수)가 PhotoSwipe `dataSource`에 반드시 있어야 한다는 사실이 실제 브라우저
  검증 중 드러났다. PhotoSwipe 코어는 `naturalWidth`/`naturalHeight`를 스스로 읽지 않고
  (`photoswipe.esm.js`에 해당 참조가 전혀 없음을 소스에서 직접 확인), `data.w`/`data.width`가
  없으면 콘텐츠 크기를 0으로 간주해 `fit` 배율 계산이 무의미해지고 결과적으로 이미지가 여백 없이
  뷰포트 전체를 채워버린다(`paddingFn` 자체는 정상 호출되지만 그 결과가 반영될 기준 크기가 0이라
  체감상 "여백이 사라진 것"처럼 보인다). 애초 data-model.md에 "PhotoSwipe는 치수 정보 없이도
  동작하는 동적 크기 모드를 지원한다"고 적었던 가정은 틀렸다 — 자세한 수정 내용은
  data-model.md의 "너비/높이" 항목 참조.

## 5. 배경 블러 (spec FR-004)

- **Decision**: PhotoSwipe 배경 요소(`.pswp__bg`)에 커스텀 CSS로 `backdrop-filter: blur()`를
  추가한다. PhotoSwipe의 `bgOpacity` 옵션은 그대로 유지해 딤(dim) 효과와 블러를 함께 적용한다.
- **Rationale**: PhotoSwipe는 배경 딤 처리만 기본 제공하고 블러는 제공하지 않으므로, 표준 CSS
  프로퍼티로 얹는 것이 가장 단순하고 PhotoSwipe 내부 로직과 충돌하지 않는다.
- **Alternatives considered**: 별도 오버레이 엘리먼트를 추가로 렌더링해 블러 전용 레이어를 두는
  방안 — PhotoSwipe가 이미 전용 배경 엘리먼트(`.pswp__bg`)를 갖고 있어 불필요한 중복이라 기각.
- **구현 중 발견한 빌드 도구 이슈**: `app/globals.css`에 `backdrop-filter`와
  `-webkit-backdrop-filter`를 이 순서(표준 → 벤더 프리픽스)로 작성했더니, Next.js(Turbopack/
  Lightning CSS)가 컴파일한 결과물에서 표준 `backdrop-filter` 선언이 통째로 사라지고
  `-webkit-backdrop-filter`만 남는 현상이 실제 브라우저 검증(`getComputedStyle`) 중 발견되었다
  — Chrome에서 `backdrop-filter`가 `none`으로 계산되어 블러가 전혀 적용되지 않았다. 선언 순서를
  관례대로 **벤더 프리픽스 먼저, 표준 프로퍼티를 나중에** 쓰는 것으로 바꾸자(`-webkit-` →
  `backdrop-filter` 순) 두 선언 모두 컴파일 결과에 정상적으로 남았다. 향후 이 파일의
  `backdrop-filter` 관련 규칙을 수정할 때는 이 순서를 유지해야 한다.

## 6. 등장 모션 (spec FR-005)

- **Decision**: PhotoSwipe 내장 트랜지션(`showHideAnimationType: 'zoom'`, 클릭한 이미지 위치에서
  확대되는 전환)을 그대로 사용한다. 프로젝트에 이미 있는 `motion`(framer-motion, v12)으로 모달을
  감싸지 않는다.
- **Rationale**: PhotoSwipe는 자신의 DOM을 React 트리 밖에서 직접 마운트/언마운트하며 위치·크기
  트랜지션을 자체적으로 계산한다. `motion`으로 같은 오버레이를 다시 감싸면 두 시스템이 동일한
  엘리먼트의 위치/투명도를 이중으로 제어하려다 충돌할 수 있다. PhotoSwipe의 내장 전환은 이미
  "클릭한 썸네일 위치에서 확대되어 나타나는" 모션을 1급으로 지원하므로 별도 구현이 불필요하다.
- **Alternatives considered**: `motion`으로 오버레이 자체를 감싸는 방안 — 위 이유로 기각.
  `showHideAnimationType: 'fade'`(단순 페이드) — "부드러운 등장 모션"이라는 spec 요구를
  더 잘 표현하는 `zoom` 전환이 더 적절하다고 판단해 기각.

## 7. 확대/축소 +/- 버튼과 배율 상/하한 (spec FR-006, FR-007)

- **Decision**: PhotoSwipe의 zoom API(`pswp.zoomTo()`)를 호출하는 커스텀 UI 엘리먼트(`+`, `-`
  버튼)를 PhotoSwipe의 `uiElement` 등록 API로 추가한다. 배율 상/하한은 PhotoSwipe 옵션
  (`initialZoomLevel`, `secondaryZoomLevel`, `maxZoomLevel` 계열)으로 설정한다.
- **Rationale**: PhotoSwipe 기본 UI는 pinch/더블클릭 확대가 중심이라 명시적 +/- 버튼이 없다.
  `uiElement` 등록 API는 PhotoSwipe가 공식적으로 지원하는 커스텀 UI 확장 지점이라, DOM을 직접
  조작하는 것보다 안전하게 버튼을 배치·스타일링할 수 있다. 배율 상/하한을 자체 로직으로 클램프
  하지 않고 PhotoSwipe 옵션에 위임하면, 핀치 제스처 등 다른 확대 경로와도 항상 같은 한도가
  적용된다.
- **Alternatives considered**: 별도 React state로 zoom 배율을 관리하고 커스텀 `transform: scale()`
  로직을 직접 구현 — PhotoSwipe가 이미 배율 계산·경계 클램프·제스처 동기화를 내부적으로
  처리하므로 중복 구현이며, React state와 PhotoSwipe 내부 상태가 어긋날 위험이 있어 기각.
- **구현 중 발견한 이슈 1 (아이콘 색상)**: PhotoSwipe는 버튼 아이콘 색을 `.pswp__button` 자체가
  아니라 `.pswp__icn { fill: var(--pswp-icon-color) }` 클래스로 지정한다. 커스텀 버튼의 `html`에
  `class="pswp__icn"`을 빠뜨리면 아이콘이 `--pswp-icon-color-secondary`(어두운 회색, 기본
  `#4f4f4f`)로 렌더링되어 어두운 스크림 위에서 거의 보이지 않는다 — 실제 브라우저 검증 중
  발견해 아이콘 SVG에 `class="pswp__icn"`을 추가해 해결했다.
- **구현 중 발견한 이슈 2 (hover 배경색 우선순위)**: PhotoSwipe 자체 CSS(`photoswipe/style.css`)는
  클릭 시점에 동적으로 `<link>`가 삽입되어 `app/globals.css`보다 항상 나중에 로드된다. 우리
  hover 규칙(`.pswp__button--zoom-in:hover`)과 PhotoSwipe 기본 규칙(`.pswp__button:hover { background: none }`)
  은 specificity가 동일(클래스 1개 + 가상클래스 1개)하므로, 나중에 로드되는 PhotoSwipe 쪽이
  항상 이겨 우리 hover 배경색이 적용되지 않는 현상이 발견되었다. `background-color`에
  `!important`를 명시해 해결했다(`app/globals.css`).
- **구현 중 사용자 피드백 반영 (디자인 다듬기, 2차례)**:
  1차 — 최초 아이콘은 `M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z` 형태의 두꺼운 사각 bar를 채운
  모양이었고, hover 배경도 사이트 브랜드 그린(`--color-primary`)을 55% 섞어 버튼 전체 사각
  히트박스를 꽉 채우는 방식이었다 — 촌스럽다는 피드백을 받아 아이콘을 사이트가 이미 쓰는 lucide
  아이콘과 같은 얇은 stroke 기반 십자/가로선 모양으로 교체했다(lucide의 Plus/Minus와 동일한
  path), stroke 색은 `var(--pswp-icon-color)`을 직접 참조해 `.pswp__icn`의 fill/color 상속
  문제를 피함.
  2차 — hover 배경을 중립 `rgba(255,255,255,0.16)` + `border-radius: 9999px`(알약 모양)로
  한 차례 더 다듬었으나, 실제로 보니 타원 모양 자체가 어색하다는 피드백을 받았다. 최종적으로는
  hover 배경을 아예 추가하지 않고 PhotoSwipe 기본 `.pswp__button:hover`(배경 변화 없이 opacity만
  0.85→1로 올라가는 것)를 그대로 따르도록 되돌렸다 — 닫기 버튼(X)과 정확히 같은 hover 느낌을
  요구했기 때문이다. `app/globals.css`의 커스텀 hover 규칙은 전부 제거했다.

## 8. 번들 크기 및 로딩 전략 (Constitution III, `bundle-dynamic-imports`)

- **Decision**: PhotoSwipe JS/CSS는 `next/dynamic`이 아니라 일반 동적 `import()`로 지연 로드한다
  — 이미지를 클릭하는 시점(또는 핸들러 마운트 시 `useEffect` 내부)에 `import('photoswipe')`와
  `import('photoswipe/lightbox')`를 호출해 초기 페이지 번들에서 제외한다.
- **Rationale**: `next/dynamic`은 React 컴포넌트를 지연 렌더링하기 위한 도구인데, PhotoSwipe는
  React 컴포넌트가 아니라 임퍼러티브하게 호출하는 라이브러리이므로 일반 동적 `import()`가 더
  직접적인 도구다. 목적(무거운 서드파티 코드를 초기 번들에서 제외)은
  `bundle-dynamic-imports` 규칙과 동일하다.
- **Alternatives considered**: PhotoSwipe를 페이지 최상단에서 정적으로 import — 게시글 상세
  페이지의 최초 로드/LCP에 불필요한 무게를 더해 규칙 위반이므로 기각.
