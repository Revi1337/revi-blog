# Implementation Plan: PlantUML 다이어그램 렌더링

**Branch**: `013-plantuml-diagram-rendering` | **Date**: 2026-08-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/013-plantuml-diagram-rendering/spec.md`

## Summary

아티클 본문의 ```plantuml 코드펜스를 문법 강조된 텍스트가 아니라 실제 다이어그램으로
렌더링한다. Mermaid([012](../012-mermaid-diagram-rendering/plan.md))와 달리 PlantUML은
레이아웃 계산을 브라우저가 아니라 외부 공개 서버(`www.plantuml.com`)가 대신 해준다 — 그래서
클라이언트가 할 일은 "URL 인코딩 → fetch → DOM에 SVG 삽입"뿐이고, 이 중 URL 인코딩(순수 문자열
연산)은 빌드 타임 rehype 플러그인(`rehype-plantuml.ts`)에서 미리 계산해 클라이언트 번들에서
제외한다. 확대 보기는 신규 컴포넌트를 만들지 않고 Mermaid가 이미 쓰는
`MermaidLightboxModal`/`openMermaidLightbox`(svg-pan-zoom 기반)를 그대로 재사용한다 — 두 다이어그램
타입 모두 최종적으로 DOM에 인라인 `<svg>`를 갖게 되므로 재사용이 성립한다. 원본 코드 복사는
Mermaid와 동일하게 기존 `rehype-code-copy-button.ts` 인프라를 그대로 재사용한다(신규 로직 없음).

## Technical Context

**Language/Version**: TypeScript 5 (Next.js 16.2.10, React 19.2.4)

**Primary Dependencies**: 신규 추가 `plantuml-encoder`(^1.4.0, 빌드 타임 URL 인코딩 전용 —
클라이언트 번들에 포함되지 않음), `@types/plantuml-encoder`(^1.4.2, devDependency). 확대 보기는
신규 의존성 없이 기존 `svg-pan-zoom`(012에서 이미 도입됨)을 그대로 재사용한다. 기존
`unified`/`remark`/`rehype` 체인, `rehype-pretty-code`, `rehype-code-copy-button.ts`는 이번
변경으로 로직을 손대지 않는다(신규 플러그인 삽입 지점만 추가).

**Storage**: N/A — `content/articles/*.md` 파일 기반. PlantUML 소스와 그 인코딩값은 빌드 산출물인
`bodyHtml`에 이미 텍스트/속성으로 포함되어 있으므로 별도 저장소 불필요.

**Testing**: 이 저장소에 자동화 테스트 스위트가 없음(constitution.md Principle I이 기본 검증
수단을 `npm run build` + 실제 브라우저 구동으로 명시). 이번 기능도 동일 기준을 따르며
quickstart.md에 스토리별 검증 절차를 기술한다. 브라우저 검증은 `playwright-cli`를 우선 사용하고,
부족한 경우에만 `playwright` MCP로 보강한다.

**Target Platform**: Web (Next.js SSR/SSG, Node.js 빌드 환경). `rehype-plantuml.ts`는 순수
문자열 변환이라 빌드 타임 Node.js에서 그대로 실행되고, 실제 이미지 `fetch`와 SVG 삽입은
브라우저 전용 DOM API에 의존하므로 클라이언트 전용 실행이다(top-level import 없이 필요 시점에
실행).

**Project Type**: web (single Next.js app)

**Performance Goals**: 명시적 처리량/응답시간 목표 없음. `plantuml-encoder`를 클라이언트
번들에 전혀 포함시키지 않는 것(빌드 타임 전용 사용)이 유일한 성능 관련 제약이다 —
Mermaid가 "초기 번들 제외를 위해 동적 import"하는 것(012)보다 한 단계 더 나아가, 인코딩
로직 자체를 클라이언트에 아예 보내지 않는다.

**Constraints**: AGENTS.md의 폰트 규칙(Inter/JetBrains Mono/SUIT/Pretendard 외 폰트 도입 금지),
constitution.md Principle II(신규 client 컴포넌트는 vercel-react-best-practices 감사 대상),
`content/articles/**` 변경 시 `next dev` 재시작 필요 원칙(검증용 아티클 추가/삭제 시 적용,
quickstart.md에 명시). 추가로 이번 기능 고유 제약: `rehype-plantuml.ts`는 네트워크 호출을
포함해서는 안 된다(빌드 안정성 — contracts/plantuml-rendering-contract.md #1 불변 조건).

**Scale/Scope**: 아티클당 다이어그램 개수 상한 없음. PlantUML 표준 문법 범위로 한정(spec.md
Assumptions), 자체 호스팅 서버 구축은 이번 범위 밖.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I (Feature-Level Verification, NON-NEGOTIABLE)**: PASS — `npm run build` 후
  `playwright-cli`로 다이어그램 렌더링/복사/확대 보기, 렌더링 실패 폴백을 실제 브라우저에서
  구동해 검증한다(quickstart.md). 검증용 아티클(`_plantuml-preview.md`)을 `content/articles/`에
  추가/삭제하므로 그때마다 `next dev` 재시작이 필요함을 quickstart.md에 명시했다. 서버는 반드시
  일반 `npm run dev`(인메모리 Redis 모드)로 띄워 방문자 통계가 `0`에서 시작한 상태로 검증한다.
- **Principle II (vercel-react-best-practices Compliance, NON-NEGOTIABLE)**: PASS(조건부) —
  신규 `PlantumlDiagramHandler`, 신규 rehype 플러그인을 작성/리뷰하기 전에
  `.agents/skills/vercel-react-best-practices/rules/`를 실제로 열어 규칙(특히 동적 import/번들
  분리 관련 규칙)을 확인하고, 구현 완료 후 대조해 명시적으로 감사한다. 이 감사가
  `/speckit-tasks`의 완료 조건에 포함되어야 한다.
- **Technology Constraints**: PASS — `app/`/`components/`/`lib/` 아래 기존 구조를 그대로
  따르며, 프레임워크 우회 없음.

위반 사항 없음 — Complexity Tracking 섹션 불필요.

## Project Structure

### Documentation (this feature)

```text
specs/013-plantuml-diagram-rendering/
├── plan.md               # This file (/speckit-plan command output)
├── research.md            # Phase 0 output (/speckit-plan command)
├── data-model.md          # Phase 1 output (/speckit-plan command)
├── quickstart.md          # Phase 1 output (/speckit-plan command)
├── contracts/             # Phase 1 output (/speckit-plan command)
└── tasks.md               # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
lib/content/plugins/
└── rehype-plantuml.ts              # 신규 — lang === "plantuml" code 노드를 찾아
                                     #        plantuml-encoder로 인코딩, pre에 data-plantuml-encoded 부여
                                     #        (네트워크 호출 없음 — contracts #1 불변 조건)

lib/content/pipeline.ts             # 기존 — remarkRehype 직후, rehypePrettyCode 이전에
                                     #        rehypePlantuml() 한 줄 추가

components/article/
├── code-copy-handler.tsx           # 기존 — 변경 없음, 복사 버튼 인프라 재사용 대상
├── image-lightbox-handler.tsx      # 기존 — 변경 없음, 참조 패턴
├── mermaid-diagram-handler.tsx     # 기존 — 변경 없음
└── plantuml-diagram-handler.tsx    # 신규 — pre[data-language="plantuml"] 탐색, fetch로 SVG 요청,
                                     #        실패 판정(contracts #3), 성공/실패 DOM 치환(contracts #4)

components/mermaid/
└── mermaid-lightbox-modal.tsx      # 기존 — 변경 없음. PlantUML도 그대로 import해서 재사용
                                     #        (research.md Decision — 신규 모달 컴포넌트 없음)

lib/mermaid/
└── open-mermaid-lightbox.ts        # 기존 — 변경 없음. PlantUML도 그대로 import해서 재사용

app/article/[slug]/page.tsx         # 기존 — <PlantumlDiagramHandler /> 한 줄 추가
                                     #        (CodeCopyHandler/ImageLightboxHandler/
                                     #         MermaidDiagramHandler와 나란히 마운트)

app/article-body.css                # 기존 — PlantUML 다이어그램 컨테이너의 고정 라이트 카드
                                     #        스타일 추가(다크 모드 대비 확보, research.md).
                                     #        012에서 실측 확인된 실제 스타일 파일 경로(globals.css 아님)

content/articles/
└── _plantuml-preview.md            # 검증 전용, 임시 — quickstart.md 0단계에서 구현 착수 전에
                                     #        먼저 작성하고, 검증 완료 후 삭제
```

**Structure Decision**: 012에서 확립한 "`components/article/*-handler.tsx`는 코드 블록을 훑어
후처리하는 client handler, `lib/<feature>/`는 동적 import로 여는 오버레이 오픈 로직" 구조를 그대로
따른다. 다만 확대 보기 오픈 로직(`lib/mermaid/`)과 모달 컴포넌트(`components/mermaid/`)는 신규
디렉토리(`lib/plantuml/`, `components/plantuml/`)를 만들지 않고 기존 Mermaid 것을 그대로
import한다(research.md Decision — 두 다이어그램 타입이 최종적으로 동일한 "인라인 SVG" 모양이
되므로 성립하는 재사용). 신규 코드는 인코딩(빌드 타임, `lib/content/plugins/`)과 fetch/DOM 치환
(클라이언트, `components/article/`) 두 곳으로만 좁게 추가된다. 단일 Next.js 앱 구조(003 결정
유지)이므로 별도 backend/frontend 분리 없음.
