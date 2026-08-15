# Phase 0 Research: Markmap 마인드맵 렌더링

## 기존 코드/환경 조사에서 확인된 사실

- [012](../012-mermaid-diagram-rendering/research.md)/[013](../013-plantuml-diagram-rendering/research.md)에서
  이미 확인된 사실이 그대로 재사용된다: `rehype-pretty-code`가 모든 코드펜스에 언어와 무관하게
  `pre.properties["data-language"]`를 심어주므로 `pre[data-language="markmap"]`가 Markmap 블록을
  찾는 선택자로 바로 쓰인다. `rehype-code-copy-button.ts`도 언어 무관하게 모든
  `figure[data-rehype-pretty-code-figure]`에 복사 버튼을 삽입하므로, 원본 `pre`를 삭제하지 않고
  숨기기만 하면 복사 버튼 기능은 **추가 구현 없이 그대로 동작**한다.
- `npm view markmap-lib version dependencies`: 최신 `0.18.12`. 의존성에 `markdown-it`,
  `@vscode/markdown-it-katex`, `katex@^0.16.8`, `markdown-it-mark`/`-ins`/`-sub`/`-sup`,
  `highlight.js`, `prismjs`, `yaml`, `markmap-html-parser`, `markmap-view`가 포함되어 있다 —
  마인드맵 노드 안에 리치 마크다운(수식/코드 강조/밑줄 등)을 지원하기 위한 자체 markdown 파서
  스택을 통째로 갖고 있다.
- `npm view markmap-lib dist.unpackedSize`: 741061 bytes(약 741KB, unpacked/gzip 전).
  `npm view markmap-view dist.unpackedSize`: 86454 bytes(약 86KB) — 렌더러 자체는 상대적으로
  가볍고, 무게는 대부분 `markmap-lib`의 파서 스택에서 온다.
- `npm view markmap-view peerDependencies`(→ `markmap-common`) / `npm view markmap-view
  dependencies`: `d3@^7.8.5`. `npm ls d3`로 확인한 결과 이 리포는 이미 `mermaid@11.16.1`을 통해
  `d3@7.9.0`을 설치하고 있다 — semver 범위가 겹쳐 npm이 단일 `d3` 인스턴스로 dedupe한다(별도
  번들 중복 없음).
- `npm view markmap-toolbar dependencies`: `@gera2ld/jsx-dom` 기반의 자체 버튼 UI(줌 인/아웃/리셋/
  fit 아이콘 포함)를 제공한다. 이 UI는 이 블로그의 기존 Mermaid/PlantUML 라이트박스 버튼과
  디자인이 다르므로 spec.md FR-011("확대/복사 버튼의 위치·스타일·인터랙션이 동일해 UI만으로
  구분할 수 없어야 한다")을 위반한다.
- `components/mermaid/mermaid-lightbox-modal.tsx` 실측: `svgMarkup: string | null` prop을 받아
  `canvasRef`에 `dangerouslySetInnerHTML`로 매번 새로 삽입한 뒤, `openMermaidLightbox(svgElement)`
  (`lib/mermaid/open-mermaid-lightbox.ts`, 내부적으로 `svg-pan-zoom` 동적 import)로 그 위에
  pan/zoom 엔진을 새로 부착하는 구조다. 화살표(↑↓←→)/리셋/줌 인·아웃 버튼은
  `instanceRef.current?.panBy/reset/zoomIn/zoomOut`을 호출한다 — "매번 새로 렌더링해서 새로
  부착"이 이 모달의 근본 계약이다.

## Decision: markmap-view 렌더링 결과를 "살아있는 인스턴스"로 유지해야 한다

- **Decision**: `MarkmapDiagramHandler`는 `markmap.render()` 같은 1회성 정적 SVG 문자열을 얻는 게
  아니라, `markmap-view`의 `Markmap.create(svgElement, options, root)`를 호출해 SVG 엘리먼트에
  d3-zoom과 노드 클릭 토글 핸들러를 직접 바인딩한다. 이 SVG 노드가 DOM에서 제거되지 않는 한
  핸들러는 계속 동작한다 — 인라인 접기/펼치기(FR-004)는 이 기본 동작을 그대로 살려두는 것만으로
  충족되고, 별도 버튼 UI를 새로 만들 필요가 없다. **[amended]** 최초엔 팬/줌(FR-005)도 이 방식
  그대로 인라인에서 살려뒀으나, 이후 "인라인 팬/줌 비활성화" Decision(아래)으로 `zoom: false,
  pan: false` 옵션을 추가해 철회했다 — 이 Decision 자체(살아있는 인스턴스 유지)는 접기/펼치기가
  여전히 그 인스턴스에 의존하므로 그대로 유효하다.
- **Rationale**: Mermaid는 `mermaid.render()`가 반환한 SVG 텍스트를 `innerHTML`로 꽂고 나면 그
  결과가 완전히 정적이라(012), 렌더링 후 JS 참조를 버려도 무방했다. Markmap은 반대다 —
  `markmap-view`가 반환하는 것은 "그림"이 아니라 "그 SVG에 이벤트 리스너가 바인딩된 상태"이므로,
  DOM에서 지우거나 clone하면(리스너는 복제되지 않음) 인터랙션이 죽는다.
- **Alternatives considered**: Mermaid처럼 정적 렌더링 결과만 받아서 꽂고 끝내기 — 기각. spec.md가
  "확대 보기 창을 열지 않고도 본문에서 곧바로 접기/펼치기·확대/축소·이동이 가능해야 한다"(FR-004/
  FR-005, User Story 2)를 명시적으로 요구하므로, 정적 렌더링으로는 요구사항을 충족할 수 없다.

## Decision: 확대 보기 모달은 기존 MermaidLightboxModal을 재사용하지 않고 신규 컴포넌트를 만든다

- **Decision**: 기존 `MermaidLightboxModal`/`open-mermaid-lightbox.ts`는 **변경하지 않는다**.
  대신 `components/markmap/markmap-lightbox-modal.tsx`(신규)와
  `lib/markmap/open-markmap-lightbox.ts`(신규)를 만든다. 신규 모달은 `source: string | null`
  (렌더링된 SVG가 아니라 **원본 Markmap 소스 텍스트**) prop을 받아, 모달이 열릴 때 그 소스로
  `markmap-lib`+`markmap-view`를 이용해 **본문과 별개인 새 인스턴스**를 모달 안에서 렌더링한다
  (본문에서 접어둔 가지 상태는 이어받지 않고, 항상 전체 펼침 기본 상태로 시작 — Mermaid/PlantUML
  모달이 항상 정규 상태의 새 렌더링을 보여주는 것과 일관된 동작). `open-markmap-lightbox.ts`는
  `MermaidPanZoomInstance`와 동일한 shape(`panBy`/`reset`/`zoomIn`/`zoomOut`/`destroy`)를
  제공하되, 내부는 `svg-pan-zoom`이 아니라 `markmap-view`가 이미 SVG에 바인딩한 d3-zoom의
  transform API를 직접 호출한다(같은 SVG에 두 개의 서로 다른 줌 엔진을 얹으면 포인터 이벤트가
  충돌하므로 `svg-pan-zoom`을 추가로 부착할 수 없다). 화살표/리셋/+-버튼의 JSX는 기존
  `.mermaid-lightbox-*` CSS 클래스를 그대로 사용해 신규 CSS 없이 픽셀 단위로 동일한 모양을
  얻는다(013이 `.mermaid-expand-button` 등을 재사용한 것과 같은 방식).
- **Rationale**: 013은 "최종적으로 인라인 `<svg>`라는 동일한 모양"이라는 전제 하에
  `MermaidLightboxModal`을 그대로 재사용했다. Markmap은 이 전제가 깨진다 — SVG 모양은 같아도,
  013/012는 "이미 완성된 markup 문자열이면 충분"했던 반면 Markmap은 "그 자리에서 계속 살아있는
  인스턴스"가 필요하다. `svgMarkup: string` 계약에 억지로 끼워 맞추면(예: 본문 SVG를 clone해서
  전달) clone은 이벤트 리스너를 복제하지 않으므로 모달 안 접기/펼치기(FR-010)가 깨진다. 신규
  컴포넌트로 분리하면 기존 Mermaid/PlantUML 코드를 한 줄도 안 건드려도 되므로 회귀 위험이 없다.
- **Alternatives considered**:
  - *본문의 살아있는 SVG DOM 노드를 모달로 재부모화(reparent)*: 기각(대화 중 검토 후 정정) —
    `MermaidLightboxModal`의 `svgMarkup: string` prop 계약 자체를 "살아있는 노드/ref"로 바꿔야
    해서 Mermaid·PlantUML 둘 다 의존하는 공유 컴포넌트의 계약을 건드리게 되고, 모달을 닫을 때
    노드를 본문 원래 위치로 되돌리는 placeholder 관리까지 추가로 필요해 지금 "매번 새로 그리고
    끝내는" 구조보다 훨씬 큰 변경이 된다.
  - *`MermaidLightboxModal`의 prop을 유니온으로 확장(`{svgMarkup} | {markmapSource}`)해 한
    컴포넌트로 3종 다이어그램을 전부 처리*: 기각. 컴포넌트가 다이어그램 종류를 아는 상태가 되어
    이름·책임이 어긋나고, Mermaid/PlantUML 경로를 건드릴 필요가 없는데도 변경 범위에 들어가
    회귀 위험이 생긴다.
  - *`markmap-toolbar` 라이브러리의 기본 버튼 UI 사용*: 기각(위 "기존 코드/환경 조사" 참고) —
    자체 아이콘/레이아웃이 FR-011을 정면으로 위반한다.

## Decision: markmap-lib의 무거운 기본 의존성을 그대로 수용한다

- **Decision**: `markmap-lib`가 부수적으로 번들하는 `markdown-it`/`katex`/`prismjs`/
  `highlight.js`(unpacked 약 741KB)를 줄이기 위한 별도 경량 파서를 직접 작성하지 않는다. 있는
  그대로 쓰되, 동적 import로 마인드맵이 실제로 있는 페이지에서만 로드되도록 하는 원칙(Mermaid가
  이미 따르는 원칙)을 철저히 지킨다.
- **Rationale**: 마크다운 헤딩/리스트 아웃라인 → 트리 데이터 변환 자체는 remark AST에서 몇 줄로
  구현 가능하지만, `markmap-view`가 기대하는 정확한 노드 스키마(`content`/`children`/`payload`
  등)와 `markmap-lib`의 옵션 처리(최대 depth, 색상 등)를 함께 재구현하려면 `markmap-view` 내부
  구현에 종속된 유지보수 부담이 생긴다. 741KB는 gzip 전 unpacked 크기라 실제 전송량은 더 작고,
  동적 import 원칙만 지키면(다른 코드펜스 없는 페이지의 초기 로드에는 영향 없음) 감내 가능한
  트레이드오프로 판단한다.
- **Alternatives considered**: remark AST에서 헤딩/리스트만 직접 순회해 `markmap-view`가 기대하는
  트리로 변환하는 자체 파서 작성 — 기각(위 이유). `markmap-html-parser`(markmap-lib의 하위
  의존성) 등 더 가벼운 하위 패키지를 직접 import하는 방안도 검토했으나, 공식적으로 안정된
  공개 API가 아니라 버전업 시 깨질 위험이 있어 기각.

## Decision: 다크/라이트 테마 반영 방식 (실측 후 확정, tasks.md T008/T009)

- **실측 결과**: `node_modules/markmap-view/dist/index.js`를 직접 읽어 확인 — `Markmap.updateStyle()`이
  렌더링 결과 SVG에 `.markmap` 클래스를 직접 붙이고, 내장 CSS(`globalCSS`)에
  `.markmap-dark .markmap { --markmap-text-color: #eee; --markmap-code-bg: #1a1b26; ... }`가
  이미 정의되어 있다(조상-후손 선택자). 즉 SVG를 감싸는 컨테이너에 `markmap-dark` 클래스 하나만
  토글하면 다크 모드 색상이 자동으로 적용된다.
- **Decision**: `MarkmapDiagramHandler`가 `useTheme().isDark`를 구독해 `[data-markmap-diagram]`
  컨테이너에 `markmap-dark` 클래스를 토글하는 것으로 확정한다. `Markmap.create()`의 `color`
  옵션(기본값 그대로 사용 — 경로 기반 해시 색상, 가지마다 다른 색)이나 별도 CSS 보강은
  필요하지 않았다 — 013(PlantUML)의 "이중 레이어" 이슈나 Mermaid의 "테마 전환 시 재렌더링
  필요" 문제 둘 다 해당하지 않는다. 실제 다크/라이트 스크린샷으로 명도 대비를 확인했고 둘 다
  충분했다(tasks.md T009).
- **Rationale**: PlantUML(013)은 외부 서버가 반환한 완성된 SVG라 옵션이 없어 CSS/skinparam
  주입으로 우회해야 했지만, Markmap은 클라이언트에서 직접 `Markmap.create()`를 호출하고 게다가
  라이브러리 자체가 다크 모드 CSS 변수 오버라이드를 이미 내장하고 있어, 이 프로젝트가 별도로
  구현할 게 거의 없었다.
- **살아있는 인스턴스 유지와의 관계**: CSS 클래스 토글은 DOM/JS 상태를 전혀 건드리지 않으므로,
  Mermaid처럼 테마 전환 시 인스턴스를 다시 만들 필요가 없다 — §"markmap-view 렌더링 결과를
  '살아있는 인스턴스'로 유지해야 한다" Decision과 자연스럽게 맞물려, 테마 전환이 본문에서
  조작 중이던 접기/펼치기·팬/줌 상태를 초기화하지 않는다는 이점도 함께 얻는다.
- **Alternatives considered**: `Markmap.create()`의 `color` 옵션을 이 블로그 팔레트로 직접
  오버라이드 — 불필요로 판정(기각). 기본 경로 기반 색상이 이미 다크/라이트 모두에서 읽기
  충분했고, 옵션으로 고정하면 오히려 가지 구분이 안 되는 단조로운 색이 됨.

## Decision: 신규 rehype 플러그인은 필요 없다

- **Decision**: 012(Mermaid)와 동일하게, Markmap도 빌드 타임 rehype 플러그인을 신규로 추가하지
  않는다. `rehype-pretty-code`가 모든 코드펜스에 `data-language`를 이미 부여하므로
  `pre[data-language="markmap"]`를 클라이언트 핸들러의 탐색 선택자로 그대로 쓴다.
- **Rationale**: 013(PlantUML)이 신규 rehype 플러그인을 만든 이유는 "URL 인코딩"이라는, 브라우저
  전용 API 없이도 빌드 타임(Node.js)에서 미리 계산 가능한 순수 문자열 연산이 있었기 때문이다.
  Markmap은 파싱(`markmap-lib`)과 렌더링(`markmap-view`) 둘 다 브라우저 DOM에 의존해 빌드
  타임으로 옮길 수 있는 부분이 없다 — Mermaid와 같은 처지다.
- **Alternatives considered**: `markmap-lib`의 `Transformer`가 Node.js에서도 실행 가능한지
  검토 — 파싱 자체는 이론적으로 Node.js에서 실행 가능할 수 있으나, 최종 렌더링(`markmap-view`,
  SVG/DOM 생성)이 어차피 브라우저 전용이라 파싱만 미리 분리해도 얻는 이득이 크지 않고, 013처럼
  결과를 데이터 속성 하나로 요약할 수 없어(트리 전체를 직렬화해야 함) 오히려 복잡도만
  올라간다고 판단해 기각.

## Decision: 인라인 팬/줌 비활성화 (실사용 중 발견, spec.md FR-005 amended)

- **최초 결정**: `Markmap.create(svg, undefined, root)`(옵션 없음, 기본값 `zoom: true, pan: true`)로
  본문 인라인에서도 드래그(팬)·휠(줌)이 전부 동작하도록 구현했다(User Story 2 최초 범위).
- **실사용 중 발견된 문제**: (1) Mermaid/PlantUML의 macOS 프리뷰는 완전히 정적인데 Markmap만
  인라인에서 뷰(위치/배율)가 바뀔 수 있어 세 다이어그램 간 인터랙션 일관성이 깨졌다. 게다가
  뷰가 바뀔 수 있다는 건 "원래대로" 되돌릴 방법도 있어야 한다는 뜻인데, 그 리셋 버튼은 확대
  보기 창에만 있어 인라인에서 실수로 흐트러진 뷰를 되돌릴 방법이 없었다. (2) 독자가 트랙패드로
  페이지를 스크롤하다 커서가 마인드맵 위를 지나가면, wheel 이벤트를 markmap-view의 d3-zoom이
  가로채 페이지 스크롤이 멈추고 다이어그램이 대신 팬/줌되는 스크롤 하이재킹이 실측 확인됐다 —
  구글 지도 임베드가 페이지 스크롤을 가로채는 것과 동일한 잘 알려진 안티패턴이다.
- **Decision(정정)**: `Markmap.create(svg, { zoom: false, pan: false, autoFit: true }, root)`로
  변경한다. `markmap-view` 소스(`node_modules/markmap-view/dist/index.js`, `setOptions()`) 실측
  결과, `options.zoom`은 `svg.on(".zoom", null)`로 d3-zoom이 바인딩한 드래그·휠·더블클릭·핀치
  줌 리스너를 전부 한 번에 제거하고, `options.pan`은 별도의 트랙패드 전용 wheel-pan 핸들러
  (`handlePan`)를 제거한다 — 두 옵션을 함께 꺼야 완전히 정적으로 만들 수 있다. 노드 클릭 접기/
  펼치기(`handleClick`)는 이 두 옵션과 무관한 별도 리스너라 영향을 받지 않고 그대로 남는다.
  이제 독자가 인라인에서 스스로 바꿀 수 있는 뷰 상태가 없으므로, 애초에 이 옵션을 껐던 이유
  (§"살아있는 인스턴스" Decision — 매 fold마다 뷰가 재중심되어 사용자가 조작한 팬/줌 위치가
  리셋되는 문제)도 사라져, `autoFit: true`를 다시 켜서 접은 뒤 어색한 여백 없이 뷰가 자동으로
  재조정되게 했다.
- **범위**: 확대 보기 창(`markmap-lightbox-modal.tsx`)은 이 결정과 무관하다 — 고정 오버레이라
  페이지 스크롤과 부딪힐 일이 없고, 팬/줌은 원래도 화살표/돋보기 버튼으로만 조작해 wheel
  이벤트에 의존하지 않는다. 그대로 `zoom:true, pan:true`(기본값) 유지.
- **Rationale**: 사용자가 직접 "일관성"과 "리셋 버튼 부재"를 근거로 제안한 방향에 동의했다.
  가지 접기/펼치기는 뷰 상태를 바꾸지 않아(같은 노드를 다시 클릭하면 바로 복구됨) "실수로
  망가뜨릴" 위험이 없으므로, 리셋 버튼 없이도 인라인에 남겨도 안전하다는 게 fold만 예외로 둔
  근거다.
- **Alternatives considered**:
  - *wheel 이벤트만 필터링하고 드래그는 유지*: 처음 검토했으나 기각 — 이러면 인라인에서 여전히
    뷰가 바뀔 수 있어(드래그로) "리셋 버튼 필요" 문제가 남고, Mermaid/PlantUML과의 일관성도
    완전히 회복되지 않는다.
  - `instance.zoom.filter()`를 직접 커스터마이즈해 wheel만 걸러내기: 위와 동일한 이유로 기각,
    게다가 `options.zoom: false`가 이미 공식적으로 지원되는 더 단순한 방법이라 우회할 필요가
    없었다.

## Sources

- `npm view markmap-lib version dependencies dist.unpackedSize`
- `npm view markmap-view version dependencies peerDependencies dist.unpackedSize`
- `npm view markmap-toolbar dependencies`
- `npm ls d3` (이 리포의 실제 설치 상태)
- `components/mermaid/mermaid-lightbox-modal.tsx`, `lib/mermaid/open-mermaid-lightbox.ts` 실측
  (기존 계약 확인)
- [012-mermaid-diagram-rendering/research.md](../012-mermaid-diagram-rendering/research.md),
  [013-plantuml-diagram-rendering/research.md](../013-plantuml-diagram-rendering/research.md)
