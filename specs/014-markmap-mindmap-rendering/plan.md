# Implementation Plan: Markmap 마인드맵 렌더링

**Branch**: `014-markmap-mindmap-rendering` | **Date**: 2026-08-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/014-markmap-mindmap-rendering/spec.md`

## Summary

아티클 본문의 ```markmap 코드펜스를 문법 강조된 텍스트가 아니라 실제 인터랙티브 마인드맵으로
렌더링한다. Mermaid([012](../012-mermaid-diagram-rendering/plan.md))/PlantUML([013](../013-plantuml-diagram-rendering/plan.md))와
달리 Markmap은 렌더링 결과 자체가 "그 자리에서 계속 살아있어야 하는" 인터랙티브 컴포넌트다 —
Mermaid의 정적 SVG나 PlantUML의 외부 서버 이미지와 달리, markmap-view가 만든 SVG는 접기/펼치기·
줌/팬 이벤트 핸들러가 SVG 노드 자체에 바인딩된 상태로 남아 있어야 동작한다. 이 차이 때문에
확대 보기도 기존 `MermaidLightboxModal`(정적 `svgMarkup: string` 스냅샷을 받아 매번 새로 그리는
구조)을 그대로 재사용할 수 없고, 원본 소스를 받아 모달 안에서 독립적인 markmap-view 인스턴스를
새로 렌더링하는 신규 컴포넌트가 필요하다(research.md Decision). 본문 인라인 인터랙션(FR-004/FR-005)은
markmap-view가 기본으로 제공하는 d3-zoom 기반 팬/줌과 노드 클릭 토글을 그대로 살려두는 것만으로
충족되므로 별도 UI 구현이 필요 없다. 원본 코드 복사는 Mermaid/PlantUML과 동일하게 기존
`rehype-code-copy-button.ts` 인프라를 그대로 재사용한다(신규 로직 없음).

## Technical Context

**Language/Version**: TypeScript 5 (Next.js 16.2.10, React 19.2.4)

**Primary Dependencies**: 신규 추가 `markmap-lib`(^0.18.12, 마크다운 아웃라인 → 트리 데이터
Transformer)와 `markmap-view`(^0.18.12, D3 기반 인터랙티브 SVG 렌더러 — `Markmap.create()`).
둘 다 Mermaid와 동일하게 클라이언트 전용 동적 import로 열어 초기 번들에서 제외한다(013의
plantuml-encoder처럼 빌드 타임 전용으로 완전히 뺄 수는 없다 — 파싱·렌더링 모두 브라우저 DOM에
의존). `markmap-toolbar`는 도입하지 않는다 — 자체 아이콘/레이아웃을 가진 기본 UI를 쓰면 spec.md
FR-011("UI만으로 종류를 구분할 수 없어야 한다")을 위반하므로, 기존 Mermaid/PlantUML 라이트박스가
쓰는 화살표/리셋/+- 버튼 마크업(`.mermaid-lightbox-*` CSS 클래스)을 그대로 재사용한다(research.md
실측 — `npm view markmap-lib dependencies`로 확인). `markmap-view`가 요구하는 `d3@^7.8.5`는
Mermaid가 이미 설치한 `d3@^7.9.0`(`npm ls d3` 실측)과 semver 호환 범위라 npm이 단일 버전으로
dedupe한다. 기존 `unified`/`remark`/`rehype` 체인, `rehype-pretty-code`,
`rehype-code-copy-button.ts`, `MermaidLightboxModal`/`open-mermaid-lightbox.ts`는 이번 변경으로
한 줄도 손대지 않는다(신규 코드는 전부 별도 파일로 추가 — research.md Decision).

**Storage**: N/A — `content/articles/*.md` 파일 기반. Markmap 소스는 빌드 산출물인 `bodyHtml`에
원본 텍스트로 이미 포함되어 있으므로 별도 저장소 불필요.

**Testing**: 이 저장소에 자동화 테스트 스위트가 없음(constitution.md Principle I이 기본 검증
수단을 `npm run build` + 실제 브라우저 구동으로 명시). 이번 기능도 동일 기준을 따르며
quickstart.md에 스토리별 검증 절차를 기술한다. 브라우저 검증은 `playwright-cli`를 우선 사용하고,
부족한 경우에만 `playwright` MCP로 보강한다. 인터랙티브 컴포넌트(접기/펼치기, 팬/줌)라 실제
클릭·드래그 조작까지 브라우저에서 확인해야 의미가 있다.

**Target Platform**: Web (Next.js SSR/SSG, Node.js 빌드 환경). `markmap-lib`(파싱)과
`markmap-view`(렌더링) 둘 다 브라우저 DOM/SVG API에 의존해 Node.js 빌드 환경에서 실행 불가능하다
— Mermaid([012](../012-mermaid-diagram-rendering/plan.md))와 동일하게 완전히 클라이언트 전용
실행이며, PlantUML처럼 순수 문자열 연산만 빌드 타임으로 분리할 여지가 없다.

**Project Type**: web (single Next.js app)

**Performance Goals**: 명시적 처리량/응답시간 목표 없음. `markmap-lib`+`markmap-view` 동적 import를
초기 번들에서 반드시 제외하는 것이 유일한 성능 제약이지만, 이번엔 그 무게가 상당하다는 점을 실측
확인했다 — `markmap-lib`는 unpacked 기준 약 741KB(`npm view markmap-lib dist.unpackedSize`)로,
마인드맵 노드 안에 리치 마크다운(수식·코드 강조 등)을 지원하기 위해 자체 `markdown-it`/`katex`
(`^0.16.8`, 이 블로그가 이미 쓰는 `katex@^0.18.1`과 별개 버전)/`prismjs`/`highlight.js`를 통째로
번들하기 때문이다. 마인드맵이 실제로 있는 페이지에서만 로드되도록(Mermaid가 이미 따르는 원칙)
철저히 지키는 게 특히 중요하다.

**Constraints**: AGENTS.md의 폰트 규칙(Inter/JetBrains Mono/SUIT/Pretendard 외 폰트 도입 금지),
constitution.md Principle II(신규 client 컴포넌트는 vercel-react-best-practices 감사 대상),
`content/articles/**` 변경 시 `next dev` 재시작 필요 원칙(검증용 아티클 추가/삭제 시 적용,
quickstart.md에 명시). 추가로 이번 기능 고유 제약: 기존 `MermaidLightboxModal`/
`open-mermaid-lightbox.ts`의 `svgMarkup: string` prop 계약과 내부 로직은 변경하지 않는다(Mermaid/
PlantUML 회귀 방지가 최우선 — research.md Decision).

**Scale/Scope**: 아티클당 마인드맵 개수 상한 없음. 지원 문법은 표준 마크다운 아웃라인(헤딩/리스트
계층)으로 한정(spec.md Assumptions) — `markmap-lib`의 리치 마크다운(수식/코드 강조 등) 파싱
기능은 이번 범위에서 의도적으로 활용하지 않지만, 라이브러리 자체에는 포함되어 번들에는 실린다
(Performance Goals 참고). 자체 마크다운 아웃라인 파서를 새로 작성해 이 무게를 줄이는 것은 이번
범위 밖(research.md Alternatives considered).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I (Feature-Level Verification, NON-NEGOTIABLE)**: PASS — `npm run build` 후
  `playwright-cli`로 마인드맵 렌더링/인라인 접기·펼치기(팬·줌은 [amended]로 인라인 비활성화,
  확대 보기 모달에서만 지원)/복사/확대 보기(모달 안 접기·펼치기 포함)를 실제 브라우저에서
  구동해 검증한다(quickstart.md). 검증용 아티클은 013의
  `_plantuml-preview.md`를 `_diagram.md`로 리네임/확장해 재사용하며(tasks.md T003/T004), 리네임/
  수정할 때마다 `next dev` 재시작이 필요함을 quickstart.md에 명시했다. 서버는 반드시 일반
  `npm run dev`(인메모리 Redis 모드)로 띄워 방문자 통계가 `0`에서 시작한 상태로 검증한다.
- **Principle II (vercel-react-best-practices Compliance, NON-NEGOTIABLE)**: PASS(조건부) —
  신규 `MarkmapDiagramHandler`, `MarkmapLightboxModal`을 작성/리뷰하기 전에
  `.agents/skills/vercel-react-best-practices/rules/`를 실제로 열어 규칙(특히 동적 import/번들
  분리, 인터랙티브 DOM 인스턴스를 리렌더 간 유지하는 방법 관련 규칙)을 확인하고, 구현 완료 후
  대조해 명시적으로 감사한다. 이 감사가 `/speckit-tasks`의 완료 조건에 포함되어야 한다.
- **Technology Constraints**: PASS — `app/`/`components/`/`lib/` 아래 기존 구조를 그대로
  따르며, 프레임워크 우회 없음. 신규 디렉토리(`components/markmap/`, `lib/markmap/`)는 012가
  확립한 `components/mermaid/`, `lib/mermaid/` 구조를 그대로 미러링한다.

위반 사항 없음 — Complexity Tracking 섹션 불필요.

## Project Structure

### Documentation (this feature)

```text
specs/014-markmap-mindmap-rendering/
├── plan.md               # This file (/speckit-plan command output)
├── research.md            # Phase 0 output (/speckit-plan command)
├── data-model.md          # Phase 1 output (/speckit-plan command)
├── quickstart.md          # Phase 1 output (/speckit-plan command)
├── contracts/             # Phase 1 output (/speckit-plan command)
└── tasks.md               # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
lib/content/pipeline.ts             # 기존 — 변경 없음. rehype-pretty-code가 이미 모든 코드펜스에
                                     #        언어와 무관하게 data-language를 부여하므로
                                     #        pre[data-language="markmap"]가 바로 선택자로 쓰인다
                                     #        (신규 rehype 플러그인 불필요 — 012/013과 달리 빌드
                                     #        타임에 할 일이 없다)

components/article/
├── code-copy-handler.tsx           # 기존 — 변경 없음, 복사 버튼 인프라 재사용 대상
├── image-lightbox-handler.tsx      # 기존 — 변경 없음, 참조 패턴
├── mermaid-diagram-handler.tsx     # 기존 — 변경 없음
├── plantuml-diagram-handler.tsx    # 기존 — 변경 없음
└── markmap-diagram-handler.tsx     # 신규 — pre[data-language="markmap"] 탐색, markmap-lib
                                     #        Transformer로 파싱, markmap-view Markmap.create(svg,
                                     #        { zoom: false, pan: false, autoFit: true }, root)로
                                     #        그 자리에 렌더링하고 인스턴스를 유지(FR-004용 인라인
                                     #        접기·펼치기는 markmap-view 기본 동작 그대로 충족 —
                                     #        별도 버튼 UI 불필요. 팬·줌은 [amended]로 인라인
                                     #        비활성화, 확대 보기 모달 전용).
                                     #        확대 버튼 클릭 시 원본 소스 텍스트를
                                     #        MarkmapLightboxModal에 전달

components/markmap/                 # 신규 디렉토리 (components/mermaid/ 구조 미러링)
└── markmap-lightbox-modal.tsx      # 신규 — 기존 .mermaid-lightbox-* CSS 클래스를 그대로 쓰는
                                     #        JSX(신규 CSS 없음). source(원본 마크다운 텍스트) prop을
                                     #        받아, 본문 SVG를 clone하지 않고 모달 안에서
                                     #        markmap-lib+markmap-view로 독립된 인스턴스를 새로
                                     #        렌더링(research.md Decision)

lib/markmap/                        # 신규 디렉토리 (lib/mermaid/ 구조 미러링)
└── open-markmap-lightbox.ts        # 신규 — open-mermaid-lightbox.ts의 MermaidPanZoomInstance와
                                     #        동일한 shape(panBy/reset/zoomIn/zoomOut/destroy)를
                                     #        제공하되, 내부는 svg-pan-zoom이 아니라 markmap-view가
                                     #        이미 SVG에 바인딩한 d3-zoom transform API를 직접
                                     #        호출한다(두 줌 엔진 충돌 방지)

components/mermaid/
└── mermaid-lightbox-modal.tsx      # 기존 — 변경 없음(회귀 방지, research.md Decision)

lib/mermaid/
└── open-mermaid-lightbox.ts        # 기존 — 변경 없음

app/article/[slug]/page.tsx         # 기존 — <MarkmapDiagramHandler /> 한 줄 추가
                                     #        (CodeCopyHandler/ImageLightboxHandler/
                                     #         MermaidDiagramHandler/PlantumlDiagramHandler와
                                     #         나란히 마운트)

app/article-body.css                # 기존 — [data-markmap-diagram] 컨테이너 레이아웃 규칙 추가
                                     #        ([data-mermaid-diagram]/[data-plantuml-diagram]과
                                     #        동일하게 맞춤). 모달 컨트롤(화살표/리셋/+-버튼)은
                                     #        기존 .mermaid-lightbox-* 셀렉터를 그대로 재사용하므로
                                     #        신규 CSS 불필요. 다크/라이트 대비를 위한 markmap-view
                                     #        색상 반영 방식은 research.md에서 실측 후 확정.

content/articles/
└── _diagram.md                     # 013의 _plantuml-preview.md를 리네임/확장 — PlantUML(기존) +
                                     #        Mermaid mindmap(신규) + Markmap(신규) 세 다이어그램
                                     #        타입 통합 검증용. 별도 파일 신설 대신 재사용(tasks.md
                                     #        T003/T004), 검증 완료 후에도 삭제하지 않고 유지
```

**Structure Decision**: 012/013이 확립한 "`components/article/*-handler.tsx`는 코드 블록을 훑어
후처리하는 client handler" 패턴을 그대로 따른다. 다만 013과 달리 확대 보기 오픈 로직·모달
컴포넌트는 기존 Mermaid 것을 재사용하지 않는다 — markmap-view의 렌더링 결과는 "완성된 정적
markup"이 아니라 "그 자리에서 계속 살아있어야 하는 인스턴스"라서, `MermaidLightboxModal`의
`svgMarkup: string` 계약에 억지로 맞추면 모달 안 접기/펼치기(FR-010)를 잃는다(research.md
Decision). 그래서 `components/mermaid/`·`lib/mermaid/` 구조를 그대로 미러링한 신규
`components/markmap/`·`lib/markmap/`를 만들되, 기존 Mermaid 파일은 한 줄도 건드리지 않아
Mermaid/PlantUML 회귀 위험이 없다. 단일 Next.js 앱 구조(003 결정 유지)이므로 별도 backend/frontend
분리 없음.
