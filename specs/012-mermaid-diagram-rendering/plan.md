# Implementation Plan: Mermaid 다이어그램 렌더링

**Branch**: `012-mermaid-diagram-rendering` | **Date**: 2026-08-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/012-mermaid-diagram-rendering/spec.md`

## Summary

아티클 본문의 ```mermaid 코드펜스를 문법 강조된 텍스트가 아니라 실제 다이어그램으로 렌더링한다.
이 프로젝트가 KaTeX 수식에 쓰는 빌드타임 방식(`lib/content/pipeline.ts`의 rehype 체인에서 미리
그림으로 구워둠)과 달리, Mermaid는 클라이언트 런타임에 렌더링한다 — 별도 헤드리스 브라우저/렌더링
서비스 의존성을 새로 들이지 않기 위함이다. 기존 `CodeCopyHandler`/`ImageLightboxHandler`와 동일한
"정적 `bodyHtml` DOM을 마운트 후 훑어 후처리하는 client handler" 패턴을 그대로 따르는 새
`MermaidDiagramHandler` 컴포넌트를 추가하고, `mermaid` 패키지를 동적 import해 렌더링한다. 확대
보기는 기존 PhotoSwipe 기반 이미지 라이트박스를 재사용하지 않고, GitHub이 실제 쓰는
`svg-pan-zoom`을 신규 의존성으로 도입해 별도의 가벼운 모달로 구현한다. 원본 코드 복사는
`rehype-pretty-code`가 이미 생성하는 코드 블록/복사 버튼 인프라를 그대로 재사용한다(신규 복사
로직 없음).

## Technical Context

**Language/Version**: TypeScript 5 (Next.js 16.2.10, React 19.2.4)

**Primary Dependencies**: 신규 추가 `mermaid`(^11.16.1, 다이어그램 렌더링), `svg-pan-zoom`(^3.6.2,
확대 보기 창의 pan/zoom). 기존 `unified`/`remark`/`rehype` 체인과 `rehype-pretty-code`(코드 블록
구조/복사 버튼 재사용 대상)는 이번 변경으로 손대지 않는다.

**Storage**: N/A — `content/articles/*.md` 파일 기반, 빌드 타임 1회 파싱(003 결정 유지). 렌더링
대상(Mermaid 소스)은 빌드 산출물인 `bodyHtml`에 이미 텍스트로 포함되어 있으므로 별도 저장소 불필요.

**Testing**: 이 저장소에 자동화 테스트 스위트가 없음(constitution.md Principle I이 기본 검증 수단을
`npm run build` + 실제 브라우저 구동으로 명시). 이번 기능도 동일 기준을 따르며 quickstart.md에
스토리별 검증 절차를 기술한다.

**Target Platform**: Web (Next.js SSR/SSG, Node.js 빌드 환경). `mermaid`/`svg-pan-zoom` 모두
DOM(브라우저 canvas/SVG API)에 의존하므로 클라이언트 전용 실행이며, 두 패키지 모두 top-level에서
import하지 않고 필요 시점에 동적 import한다(아래 Performance Goals 참고).

**Project Type**: web (single Next.js app)

**Performance Goals**: 명시적 처리량/응답시간 목표 없음. `mermaid`/`svg-pan-zoom`을 초기 페이지
번들에 포함시키지 않는 것을 유일한 성능 관련 제약으로 삼는다 — `mermaid`는 본문에 실제
```mermaid 블록이 존재하는 아티클 페이지에서만, `svg-pan-zoom`은 확대 버튼 클릭 시점에만 동적
import한다. `ImageLightboxHandler`가 PhotoSwipe를 클릭 시점에만 동적 import하는 기존 관례와
동일한 패턴(research.md #8, bundle-dynamic-imports)을 따른다.

**Constraints**: AGENTS.md의 폰트 규칙(Inter/JetBrains Mono/SUIT/Pretendard 외 폰트 도입 금지 —
Mermaid 다이어그램 텍스트도 이 규칙을 따름), constitution.md Principle II(신규 client 컴포넌트는
vercel-react-best-practices 감사 대상), `content/articles/**` 변경 시 `next dev` 재시작 필요
원칙(이번 기능은 콘텐츠 파일을 변경하지 않으므로 해당 없음, 다만 검증용 아티클을 추가한다면 적용).

**Scale/Scope**: 아티클당 다이어그램 개수 상한 없음(전제: 일반적인 기술 블로그 글 기준 소수).
Mermaid 표준 문법 범위(순서도/시퀀스 다이어그램 등)로 한정, Markmap/Excalidraw는 이번 범위 밖(spec.md
Assumptions).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I (Feature-Level Verification, NON-NEGOTIABLE)**: PASS — `npm run build` 후
  `playwright-cli`로 다이어그램 렌더링/복사/확대 보기(이동·리셋·확대축소)를 실제 브라우저에서
  구동해 검증한다(quickstart.md에 시나리오별 절차 기술). 이번 기능은 `content/articles/**`를
  수정하지 않으므로 `next dev` 재시작 요건은 해당 없음 — 단, 검증을 위해 Mermaid 예시가 포함된
  아티클을 추가할 경우 재시작이 필요함을 quickstart.md에 명시한다.
- **Principle II (vercel-react-best-practices Compliance, NON-NEGOTIABLE)**: PASS(조건부) —
  신규 `MermaidDiagramHandler`, 확대 보기 모달 컴포넌트를 작성/리뷰하기 전에
  `.agents/skills/vercel-react-best-practices/rules/`를 실제로 열어 규칙(특히
  `bundle-conditional.md` 등 동적 import 관련 규칙)을 확인하고, 구현 완료 후 그 규칙에 대조해
  명시적으로 감사한다. 이 감사가 Phase 2(`/speckit-tasks`)의 완료 조건에 포함되어야 함.
- **Technology Constraints**: PASS — `app/`/`components/` 아래 React/Next.js 구현을 그대로
  따르며, 프레임워크 우회 없음.

위반 사항 없음 — Complexity Tracking 섹션 불필요.

## Project Structure

### Documentation (this feature)

```text
specs/012-mermaid-diagram-rendering/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md         # Phase 1 output (/speckit-plan command)
├── contracts/            # Phase 1 output (/speckit-plan command)
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
components/article/
├── code-copy-handler.tsx           # 기존 — 변경 없음, 복사 버튼 인프라 재사용 대상
├── image-lightbox-handler.tsx      # 기존 — 변경 없음, 참조 패턴
└── mermaid-diagram-handler.tsx     # 신규 — mermaid 동적 import, 코드블록 탐색 및 렌더링, 테마 반영

lib/mermaid/
└── open-mermaid-lightbox.ts        # 신규 — svg-pan-zoom 동적 import, 확대 보기 모달 오픈 로직
                                     #        (lib/lightbox/open-image-lightbox.ts와 동일한 레벨의 파일)

components/mermaid/
└── mermaid-lightbox-modal.tsx      # 신규 — 확대 보기 모달의 배경 스크림/애니메이션/버튼 UI
                                     #        (PhotoSwipe 내부 재사용 없이 별도 구현, 기존 라이트박스와
                                     #         시각적으로만 맞춤)

app/article/[slug]/page.tsx         # 기존 — <MermaidDiagramHandler /> 한 줄 추가
                                     #        (CodeCopyHandler/ImageLightboxHandler와 나란히 마운트)

app/globals.css                     # 기존 — 다이어그램/확대 보기 모달 다크·라이트 스타일 추가
```

**Structure Decision**: 기존 `components/article/*-handler.tsx` client-hydration 패턴과
`lib/lightbox/*` 구조를 그대로 미러링한다 — 새 디렉토리 개념을 만들지 않고, "코드 블록을 훑어
후처리하는 handler"는 `components/article/`에, "동적 import로 여는 오버레이 오픈 로직"은 최상위
`lib/<feature>/`에 둔다. 단일 Next.js 앱 구조(003 결정 유지)이므로 별도 backend/frontend 분리 없음.
