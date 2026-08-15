# Phase 0 Research: PlantUML 다이어그램 렌더링

## 기존 코드/환경 조사에서 확인된 사실

- [012-mermaid-diagram-rendering](../012-mermaid-diagram-rendering/research.md)에서 이미 확인된
  사실이 대부분 그대로 재사용된다: `rehype-pretty-code`가 모든 코드펜스에 언어와 무관하게
  `pre.properties["data-language"]`를 심어주므로 `pre[data-language="plantuml"]`가 PlantUML
  블록을 찾는 선택자로 바로 쓰인다. `rehype-code-copy-button.ts`도 언어 무관하게 모든
  `figure[data-rehype-pretty-code-figure]`에 복사 버튼을 삽입하므로, 원본 `pre`를 삭제하지 않고
  숨기기만 하면 복사 버튼 기능은 **추가 구현 없이 그대로 동작**한다.
- Shiki(`node_modules/shiki/dist/langs.mjs`)에는 `"plantuml"` 전용 문법 번들이 없다 —
  알 수 없는 언어는 `rehype-pretty-code`가 일반 텍스트로 처리해 하이라이트 없이 렌더링한다.
  다이어그램 렌더링 실패 시 폴백으로 노출되는 원본 코드 블록은 문법 강조 없는 평문이 되며,
  이는 기능 요구사항(FR-008)에는 영향 없다(원본 텍스트가 그대로 보이기만 하면 됨).
- `npm view plantuml-encoder`: 최신 `1.4.0`, 의존성 없음(deps: none), 브라우저/Node.js 양쪽에서
  동작하도록 만들어진 순수 함수형 패키지. 자체 타입 선언은 없지만 `@types/plantuml-encoder@1.4.2`가
  DefinitelyTyped에 존재해 별도 타입 작성 없이 그대로 쓸 수 있다.
- `curl`로 공개 서버(`www.plantuml.com/plantuml/svg/{encoded}`)에 실제 요청해 확인:
  `content-type: image/svg+xml`, `access-control-allow-origin: *`(CORS 완전 개방),
  `cache-control: public, max-age=432000`(5일 캐시) — 클라이언트에서 직접 `fetch()`해도 CORS
  문제가 없고, 동일 다이어그램 반복 요청은 PlantUML 측 CDN 캐시로 흡수된다.

## Decision: 인코딩 시점 — 빌드 타임 vs 클라이언트 런타임

- **Decision**: PlantUML 소스 → URL 인코딩(deflate + PlantUML 전용 base64) 변환은 **빌드
  타임**(신규 rehype 플러그인 `lib/content/plugins/rehype-plantuml.ts`)에서 수행하고, 결과를
  `pre`의 `data-plantuml-encoded` 속성에 실어둔다. 실제 이미지 요청(`fetch`)만 클라이언트
  런타임에 수행한다.
- **Rationale**: Mermaid는 브라우저 DOM/SVG API에 의존하는 레이아웃 엔진이라 Node.js 빌드
  환경에서 실행 불가능했지만(012/research.md), PlantUML의 레이아웃 계산은 공개 서버가 대신
  해주므로 클라이언트가 할 일은 "URL 만들기 → fetch → DOM에 꽂기"뿐이다. 이 중 URL 인코딩은
  브라우저 전용 API에 의존하지 않는 순수 문자열 연산(`plantuml-encoder`가 Node.js에서도 동일하게
  동작)이므로 빌드 타임에 미리 계산해둘 수 있다. 이렇게 하면 (1) 페이지를 열 때마다 모든 독자의
  브라우저에서 반복되는 동일한 인코딩 연산을 제거하고, (2) `plantuml-encoder`가 클라이언트 번들에
  전혀 포함되지 않는다(빌드 전용 의존성으로 격리) — Mermaid가 "초기 번들에 포함시키지 않기 위해
  동적 import한다"는 원칙(012/Performance Goals)보다 한 단계 더 나아가, 아예 클라이언트에
  보내지 않는 것이 가능하다.
- **Alternatives considered**:
  - *인코딩도 클라이언트에서 매 마운트마다 계산*: 기각. 위 두 이점을 모두 포기해야 하고,
    Mermaid의 `mermaid` 패키지처럼 "레이아웃까지 client가 담당해야 해서 어쩔 수 없이 client
    전용"인 경우와 달리 PlantUML은 그럴 필요가 없다.
  - *빌드 타임에 실제 SVG까지 통째로 `fetch`해 `bodyHtml`에 인라인*: 기각(대화 중 이미 결정) —
    `content/articles/**`를 빌드/재시작 시점마다 외부 서비스에 의존하게 되어 constitution.md
    Principle I이 요구하는 "content 변경 시 재시작으로 검증 가능"이라는 전제와
    AGENTS.md의 빌드 안정성 원칙(외부 서비스 장애가 빌드 실패로 전파되면 안 됨)에 위배된다.
  - *PlantUML 서버 자체 호스팅*: 이번 범위 밖(spec.md Assumptions). Vercel 서버리스 배포와
    상시 구동 Java 프로세스가 구조적으로 맞지 않는다(대화 중 확인).

## Decision: 확대 보기 — Mermaid의 라이트박스 재사용 vs 신규 구현

- **Decision**: `components/mermaid/mermaid-lightbox-modal.tsx` +
  `lib/mermaid/open-mermaid-lightbox.ts`를 **그대로 import해서 재사용**한다. 신규 컴포넌트를
  만들지 않는다.
- **Rationale**: `MermaidLightboxModal`이 받는 prop은 `svgMarkup: string | null`이며, 내부
  로직(`canvasRef.current?.querySelector("svg")`에 `svg-pan-zoom` 초기화)은 그 SVG가 어떤
  라이브러리에서 왔는지 전혀 구분하지 않는다. PlantUML도 `fetch`로 받은 SVG 텍스트를 Mermaid의
  `mermaid.render()` 결과와 동일하게 `container.innerHTML = svg`로 DOM에 인라인 삽입하므로,
  최종적으로 "인라인 `<svg>` DOM 노드"라는 동일한 모양이 되어 기존 클론(`buildLightboxSvgMarkup`)·
  팬줌 로직을 코드 변경 없이 그대로 탈 수 있다. 이는 spec.md FR-007(확대/복사 버튼이 Mermaid와
  100% 동일해야 함)을 가장 확실하게 만족하는 방법이기도 하다 — 같은 컴포넌트를 쓰면 "다르게
  보일 여지" 자체가 없다.
- **파일/컴포넌트 이름의 "mermaid" 고유명사 처리**: 리네이밍하지 않는다. FR-007은 "보이는
  결과와 인터랙션이 같아야 한다"는 요구이지 파일명 요구가 아니며, 이번 스펙이 요구하지 않는
  리팩터링(이름 변경에 따른 import 경로 전수 수정)을 추가하는 것은 불필요한 변경 확대다.
  이름과 실제 쓰임(PlantUML 포함)이 어긋난다는 점은 인지하되, 필요해지면 별도 리팩터링으로
  다룬다.
- **Alternatives considered**: 이름이 정확한 신규 `diagram-lightbox-modal.tsx`로 리네이밍 후
  Mermaid 쪽도 그 이름을 쓰도록 함께 옮기기 — 기각(위 이유, 순수 리팩터링이라 이번 범위 아님).

## Decision: 렌더링 실패 판별 기준

`curl`로 공개 서버에 세 가지 케이스를 실제로 요청해 응답을 실측했다(HTTP 상태 코드만으로는
성공/실패를 구분할 수 없다는 점부터 확인 필요했음 — 세 경우 모두 `HTTP 200` +
`content-type: image/svg+xml`을 반환한다):

| 케이스 | 응답 |
|---|---|
| 정상 다이어그램(`Bob -> Alice`) | 루트 `<svg>`에 `data-diagram-type="SEQUENCE"` 속성 존재 |
| 인코딩 자체가 깨진 요청(우리 파이프라인에서는 발생 안 함 — `plantuml-encoder`가 항상 유효한
  인코딩을 생성하므로 참고용) | 루트 `<svg>`에 `data-diagram-type="CLASS"`가 붙어 있지만, 본문에
  "This URL does not look like DEFLATE data" 오류 카드가 그려짐 |
| 유효하게 인코딩됐지만 PlantUML이 다이어그램으로 인식할 수 없는 내용(예: 인식 불가한 임의
  텍스트) | 루트 `<svg>`에 `data-diagram-type` 속성이 **아예 없음**. 대신 "Welcome to
  PlantUML!" 플레이스홀더 안내 화면이 그려짐 |

또한 실측 중 PlantUML 파서가 매우 관대하다는 점도 확인했다 — 괄호 불일치나 알 수 없는 토큰이
섞여도(`Bob -> Alice : broken (((( unclosed`, 깨진 `class` 메서드 시그니처 등) 상당수는 "그럴듯
하게" 해석해 다이어그램을 그려버린다. 즉 이번 기능이 실제로 마주칠 실패 모드는 "완전히 깨진
렌더링"보다 "저자 의도와 다르게 그려짐"이 더 흔하지만, 후자는 시스템 입장에서는 유효한 SVG
응답이므로 spec.md FR-008/FR-009 기준(페이지가 안 깨지면 됨)에서 실패로 취급할 필요가 없다.

- **Decision**: 다음 중 하나라도 해당하면 렌더링 실패로 간주하고 Mermaid의 catch 블록과 동일한
  폴백 경로(원본 `pre` 노출, 재시도 안 함, `data-plantuml-error="true"` 마킹)를 탄다.
  1. `fetch` 자체의 네트워크 오류, 또는 응답이 4xx/5xx
  2. 응답 `Content-Type`이 `image/svg+xml`이 아님
  3. 응답 루트 `<svg>` 엘리먼트에 `data-diagram-type` 속성이 없음
- **Rationale**: 3번 기준이 핵심이다 — "PlantUML이 이 요청을 다이어그램으로 전혀 인식하지
  못했다"는 가장 신뢰할 수 있는 구조적 신호이고, 실제로 "Welcome to PlantUML!" 케이스를 정확히
  잡아낸다.
- **Alternatives considered**: 응답 SVG 안의 특정 오류 문구("Syntax Error", "bad URL" 등)를
  문자열로 매칭 — 기각. PlantUML 버전이 올라가며 문구가 바뀌거나 다국어화될 수 있어 깨지기 쉬운
  기준이다. `data-diagram-type` 속성 존재 여부는 PlantUML이 SVG를 생성할 때 다이어그램 타입을
  구조적으로 표시하는 것이라 문구보다 훨씬 안정적이다.

## Decision: 다크/라이트 테마 반영 방식

- **최초 결정(정정됨)**: 다이어그램을 감싸는 컨테이너에 고정 라이트 카드(흰 배경, 둥근 모서리,
  테두리)를 씌워 다크 모드에서도 대비를 확보하기로 했었다.
- **실제 렌더링 확인 결과 정정**: 사용자가 브라우저로 직접 확인한 결과, 이 카드가 이미 코드
  블록을 감싸는 macOS 창 프레임(`[data-rehype-pretty-code-figure]`) **위에 또 하나의 둥근
  테두리 박스가 얹힌 이중 레이어**로 보인다는 문제를 지적받았다. Mermaid 컨테이너
  (`[data-mermaid-diagram]`)는 배경/테두리가 전혀 없어 macOS 창 프레임에 다이어그램이 직접
  얹힌 것처럼 보이는데, PlantUML만 그 안에 별도의 둥근 흰 카드가 하나 더 있어 FR-007(확대/복사
  버튼뿐 아니라 전체적인 UI가 Mermaid와 구분 불가능해야 함의 취지)과 어긋났다. 다크 모드에서는
  "흰 카드 안의 흰 카드"처럼, 라이트 모드에서는 카드 경계선이 미묘하게 배경과 어긋나 보이는
  이중 테두리로 나타났다.
- **Decision(최종)**: 컨테이너의 배경/테두리/모서리 스타일을 전부 제거하고, Mermaid 컨테이너와
  레이아웃 규칙(flex/justify-center/overflow-x/padding)을 완전히 동일하게 맞춘다. 다이어그램의
  흰 배경은 컨테이너가 아니라 PlantUML 서버가 응답 SVG 루트에 직접 굽는 것
  (`style="background:#FFFFFF"`)이므로 컨테이너 쪽에서 감쌀 필요가 없다 — 그 자체가 이미
  충분한 대비를 제공하며, 감싸는 카드를 없애면 프레임이 macOS 창 하나로 줄어 Mermaid와 구조가
  같아진다.
- **여전히 남는 제약**: PlantUML 서버가 다크 테마 파라미터를 제공하지 않는 것은 사실이라
  (공식 서버 문서에 그런 파라미터 없음), 다이어그램 내용 자체(도형/텍스트 색)는 다크 모드에서도
  항상 라이트 배경을 전제로 한 색으로 나온다. 이는 여전히 구조적 제약이지만, 최소한 "박스 안에
  또 다른 박스"라는 불필요한 이중 레이어는 만들지 않는 것으로 개선했다.
- **Alternatives considered**: `skinparam` 주입으로 다크 버전 별도 요청 — 여전히 기각(요청 2배,
  저자가 작성하지 않은 스타일 지시문을 시스템이 임의로 소스에 끼워 넣는 문제, spec.md Edge
  Case와 충돌).

## Decision: 신규 rehype 플러그인의 파이프라인 삽입 위치

- **최초 결정(정정됨)**: 처음에는 `remarkRehype` 직후, `rehypePrettyCode` **이전**에
  `rehypePlantuml`을 끼워넣기로 했었다 — 텍스트 노드가 아직 Shiki로 쪼개지지 않은 시점에 원본을
  읽는 쪽이 `hast-util-to-string` 없이 `code.children[0].value`를 직접 읽을 수 있어 더 단순하다는
  이유였다.
- **실제 렌더링 확인 결과 정정**: 구현 후 브라우저에서 실제로 확인해보니 `data-plantuml-encoded`
  속성이 최종 DOM에 존재하지 않았다. 원인은 `rehypePrettyCode`가 코드펜스마다 `pre`를 기존
  속성을 보존한 채 데코레이션하는 것이 아니라, **완전히 새 엘리먼트로 교체**하기 때문이었다 —
  그 앞에서 심어둔 커스텀 속성은 전부 사라진다. (012의 "rehypePrettyCode가 `data-language`를
  부여한다"는 관찰은 사실이지만, 그것이 "기존 pre 객체를 그대로 데코레이션한다"는 뜻은
  아니었다 — 다른 프로퍼티의 존재를 근거로 지나치게 일반화한 최초 가정이 원인.)
- **Decision(최종)**: `rehypePlantuml`을 `rehypePrettyCode` **이후**(`rehypeCodeCopyButton`
  이전)로 옮긴다. 대상은 `rehypePrettyCode`가 이미 부여한 `pre[data-language="plantuml"]`로
  찾고, 원본 텍스트는 `hast-util-to-string`(이미 프로젝트 의존성)으로 읽는다 — Shiki가 토큰을
  `<span>`으로 감싸도 텍스트 노드 자체는 바꾸지 않으므로(012 research.md와 동일 근거) 원본과
  항상 정확히 일치한다.
- **교훈**: 파이프라인 삽입 위치 같은, 실행해봐야 확실히 알 수 있는 가정은 문서만으로 결정하지
  말고 실제 렌더링 결과로 검증한 뒤 확정해야 한다.

## Sources

- [PlantUML Server](https://plantuml.com/en/server) — URL 포맷, 공개 무료 서비스 여부
- [plantuml/plantuml-server (GitHub)](https://github.com/plantuml/plantuml-server) — 자체 호스팅
  가능 여부(참고, 이번 범위 밖)
- `curl` 실측 (`www.plantuml.com/plantuml/svg/...`) — 응답 헤더, 성공/실패 케이스별 SVG 구조
