# Phase 0 Research: Mermaid 다이어그램 렌더링

## 기존 코드/환경 조사에서 확인된 사실

- `lib/content/pipeline.ts`는 ```mermaid 코드펜스를 특별 취급하지 않는다 — `rehype-pretty-code`가
  다른 언어와 동일하게 Shiki로 문법 강조만 적용한다. Shiki(`node_modules/shiki/dist/langs.mjs`)에는
  `"mermaid"` 번들 문법이 존재해 에러 없이 하이라이트되며, 이 동작은 이번 변경 이후에도 "렌더링
  실패 시 폴백으로 보여줄 원본 코드 블록"으로 그대로 활용한다(별도 fallback 렌더링 경로를 새로
  만들 필요 없음).
- `rehype-pretty-code`(`node_modules/rehype-pretty-code/dist/index.js:412,417`)는 코드펜스마다
  `pre.properties["data-language"]`와 `code.properties["data-language"]`에 언어 문자열을 그대로
  심는다. 즉 `figure[data-rehype-pretty-code-figure] pre[data-language="mermaid"]`가 본문에서
  Mermaid 블록을 안정적으로 찾는 선택자가 된다.
- `rehype-code-copy-button.ts`는 언어와 무관하게 모든
  `figure[data-rehype-pretty-code-figure]`에 복사 버튼을 삽입하고, `CodeCopyHandler`는 그 버튼
  클릭 시 `figure.querySelector("pre")?.textContent`를 클립보드에 복사한다. Shiki 하이라이트는
  텍스트를 `<span>`으로 감쌀 뿐 텍스트 노드 자체를 바꾸지 않으므로, `pre.textContent`는 항상 원본
  Mermaid 소스와 정확히 일치한다 — 다이어그램 전용 복사 로직을 새로 만들 필요가 없다(spec.md
  FR-004/Assumptions에 이미 반영).
- `components/article/code-copy-handler.tsx`, `components/article/image-lightbox-handler.tsx`
  모두 "정적 `bodyHtml` DOM은 React 핸들러를 못 붙이므로, 마운트 시 `useEffect`에서 `document`
  레벨로 DOM을 훑거나 이벤트 위임한다"는 동일 패턴을 쓴다. 둘 다 `app/article/[slug]/page.tsx`
  86~96행 부근에서 `dangerouslySetInnerHTML` div 바로 다음에 나란히 렌더링된다. 신규
  `MermaidDiagramHandler`도 동일 위치에 추가한다.
- `lib/lightbox/open-image-lightbox.ts`는 PhotoSwipe를 클릭 시점(함수 호출 시점)에 동적
  import한다(`await import("photoswipe/lightbox")`) — 초기 번들에 포함하지 않는 기존 관례
  (research.md #8, bundle-dynamic-imports 원칙)가 이미 이 파일에 실측 사례로 존재한다.
- `components/theme/theme-context.tsx`의 `useTheme()`은 `{ isDark, toggleTheme }`를 반환하는
  React Context 훅이다. `isDark`는 `<html>`의 `dark` 클래스 여부를 그대로 반영하는 boolean이라,
  다이어그램 재렌더링 트리거로 `useEffect`의 의존성 배열에 바로 넣을 수 있다.
- `npm view` 실측 결과: `mermaid@11.16.1`, `svg-pan-zoom@3.6.2` — 두 패키지 모두 자체 타입
  선언(`dist/svg-pan-zoom.d.ts` 등)을 내장하고 있어 `@types/*` 패키지가 별도로 필요 없다(`@types/svg-pan-zoom`은
  3.4.0에 멈춰 있는 구버전이라 오히려 쓰지 않는 편이 낫다).

## Decision: Mermaid 렌더링 시점 — 클라이언트 런타임 vs 빌드타임

- **Decision**: 클라이언트 런타임에 렌더링한다. `MermaidDiagramHandler`("use client")가 마운트 시
  본문 DOM에서 `pre[data-language="mermaid"]`를 모두 찾아, `mermaid` 패키지를 동적 import한 뒤
  `mermaid.render()`로 얻은 SVG 문자열을 코드 블록 옆에 삽입하고 원본 코드 블록은 `display: none`
  처리(삭제하지 않음 — 복사 버튼이 계속 `pre.textContent`를 읽어야 함)한다.
- **Rationale**: KaTeX(003/004 결정)는 순수 함수형 렌더러라 Node.js 빌드 환경에서 그대로 실행
  가능했지만, Mermaid는 브라우저 DOM/SVG API에 의존하는 라이브러리라 Node.js 빌드 타임에 그대로
  실행할 수 없다. 빌드타임 렌더링을 강행하려면 GitHub의 Viewscreen(내부 렌더링 서비스)처럼
  헤드리스 브라우저(Playwright 등)를 빌드 파이프라인에 새로 들여야 하는데, 이 블로그는 콘텐츠가
  전부 본인이 작성하는 신뢰된 글이라 GitHub이 iframe+별도 서비스로 격리하는 이유(불특정 다수의
  공개 저장소 콘텐츠 격리)가 애초에 적용되지 않는다. 이미 있는 client-hydration 패턴을 그대로
  재사용하는 쪽이 새 빌드 의존성을 들이는 것보다 훨씬 단순하다.
- **Alternatives considered**:
  - *GitHub과 동일한 iframe + 헤드리스 렌더링 서비스*: 보안 격리가 필요 없는 단일 저자 블로그에는
    과한 인프라. 기각.
  - *`rehype-mermaid` 같은 빌드타임 rehype 플러그인(Playwright 기반)*: 빌드 시간 증가, CI/Vercel
    빌드 환경에 헤드리스 브라우저 의존성 추가. 다크/라이트 두 버전을 각각 사전 렌더링해야 해서
    KaTeX보다 구현이 복잡함. 기각.

## Decision: 확대 보기 — svg-pan-zoom(신규 의존성) vs 기존 PhotoSwipe 재사용

- **Decision**: `svg-pan-zoom`(GitHub이 실제 사용하는 라이브러리, 3.6.2)을 신규 의존성으로
  도입한다. `lib/lightbox/open-image-lightbox.ts`와 동일한 레벨에 `lib/mermaid/open-mermaid-lightbox.ts`를
  두고, 확대 버튼 클릭 시점에 동적 import한다. 모달의 배경 스크림/열림·닫힘 애니메이션/ESC 닫기 같은
  "껍데기" UI는 `components/mermaid/mermaid-lightbox-modal.tsx`로 별도 구현하되, 기존 이미지
  라이트박스(PhotoSwipe의 `bgOpacity: 0.85`, `paddingFn`으로 계산하는 여백 비율 등)와 시각적으로
  맞춘다.
- **Rationale**: PhotoSwipe(`lib/lightbox/open-image-lightbox.ts`)의 pan/zoom 엔진은
  `zoomTo`/`slide.zoomLevels`처럼 `<img>`의 intrinsic width/height를 전제로 배율을 계산하고,
  상호작용도 드래그/핀치 중심이다(좌우 화살표는 "다음/이전 이미지" 슬라이드 전환용이지 방향
  이동용이 아님). 요구사항(spec.md FR-006~008)이 요구하는 "상하좌우 버튼 클릭 시 일정량 이동"은
  PhotoSwipe 공개 API가 아닌 내부 상태(`slide.pan`)를 직접 조작해야 구현 가능해, 사실상 서드파티
  라이브러리 내부 구현에 의존하는 커스텀 로직이 된다. `svg-pan-zoom`은 반대로 이 정확한 문제
  (임의 크기 SVG + 버튼 기반 이산적 pan/zoom/reset)를 위해 만들어졌고, `panBy()`/`zoomIn()`/`zoomOut()`/`reset()`
  공개 API가 요구사항의 6개 버튼에 1:1로 대응한다. GitHub 자신도 Mermaid 확대에 이 라이브러리를
  쓴다(아래 Sources).
- **Alternatives considered**:
  - *PhotoSwipe 커스텀 확장*: 기각(위 Rationale). 공개 API 밖 내부 상태 의존, 유지보수 리스크.
  - *직접 구현(바닐라 CSS transform + 커스텀 이벤트)*: 배율 상/하한 계산, 드래그 경계 처리 등을
    처음부터 재구현해야 해 svg-pan-zoom 대비 이점이 없음. 기각.
- **Sources**:
  - [Include diagrams in your Markdown files with Mermaid - The GitHub Blog](https://github.blog/developer-skills/github/include-diagrams-markdown-files-mermaid/)
  - [svg-pan-zoom (bumbu/svg-pan-zoom)](https://github.com/bumbu/svg-pan-zoom)

## Decision: 다크/라이트 테마 반영 방식

- **Decision**: `mermaid.initialize({ theme: isDark ? "dark" : "default" })`를 `useTheme()`의
  `isDark` 값에 맞춰 호출한 뒤, 테마가 바뀔 때마다 이미 렌더링된 다이어그램을 `mermaid.render()`로
  다시 그려 교체한다(재렌더링 방식 — CSS 변수만으로 스와핑하는 방식은 채택하지 않음).
- **Rationale**: `rehype-pretty-code`는 빌드타임에 다크/라이트 두 버전을 CSS 변수로 동시에
  구워내는 방식(`theme: { dark, light }`)을 쓰지만, 이는 애초에 두 버전을 미리 만들 수 있는
  빌드타임 렌더러라 가능한 방식이다. Mermaid는 이번 결정에 따라 런타임 렌더러이므로, 테마 전환
  즉시 반영을 위해 그 시점에 다시 렌더링하는 쪽이 자연스럽고, Mermaid 자체가 `theme` 옵션과
  `mermaid.render()` 재호출을 표준 API로 제공한다(라이브러리 설계상 CSS 변수 오버라이드보다
  권장되는 방식).
- **Alternatives considered**: Mermaid SVG 출력색을 CSS 변수로 치환해 재렌더링 없이 클래스
  토글만으로 테마를 바꾸는 방식 — Mermaid가 SVG에 색상을 인라인 `style`/`fill` 속성으로 직접
  굽기 때문에 안정적인 CSS 변수 치환 지점이 공개 API 밖이라 기각.
