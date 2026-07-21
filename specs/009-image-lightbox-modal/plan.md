# Implementation Plan: 게시글 이미지 라이트박스 모달

**Branch**: `009-image-lightbox-modal` | **Date**: 2026-07-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/009-image-lightbox-modal/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

게시글 상세 페이지의 본문 이미지와 상단 썸네일 이미지를 클릭하면 PhotoSwipe(v5, vanilla JS)
기반 라이트박스 모달이 뜬다. 본문 이미지는 `dangerouslySetInnerHTML`로 삽입되는 순수 HTML이라
`CodeCopyHandler`와 동일한 document 레벨 이벤트 위임으로 클릭을 처리하고, 썸네일은
`next/image`로 렌더링되는 React 컴포넌트라 별도 `onClick`으로 직접 연결한다. 두 진입점은
spec FR-014에 따라 서로 다른 PhotoSwipe 갤러리로 완전히 분리된다. 본문 이미지 갤러리 데이터는
클라이언트에서 DOM을 순회해 런타임에 구성하지 않고, `remark-toc`와 동일한 패턴의 신규 remark
플러그인(`remark-images`)이 마크다운 렌더링 파이프라인에서 빌드/로드 시점에 `Article.images`로
미리 추출한다. 모달은 PhotoSwipe 기본 풀스크린 동작을 오버라이드해 여백을 둔 크기로 표시하고,
배경에 `backdrop-filter: blur()`를 얹으며, +/- 확대·축소 버튼을 커스텀 UI 엘리먼트로 추가하고,
등장 모션은 PhotoSwipe 내장 트랜지션만 사용한다(기존 `motion` 라이브러리로 감싸지 않음).

## Technical Context

**Language/Version**: TypeScript, Next.js 16 (App Router), React 19

**Primary Dependencies**: `photoswipe`(신규 추가, v5 core + lightbox 모듈), 기존
`unified`/`remark-*` 렌더링 파이프라인(`lib/content/pipeline.ts`), `CodeCopyHandler`와 동일한
document 레벨 이벤트 위임 패턴

**Storage**: N/A — 이미지 목록은 마크다운 렌더링 시 파생되는 값이며 별도 저장소나 DB가 없다

**Testing**: `npm run build` + `claude-in-chrome` MCP를 통한 실제 브라우저 검증 (Constitution
Principle I)

**Target Platform**: 웹 (Next.js SSR/SSG로 빌드되는 브라우저 클라이언트, 데스크톱/모바일 뷰포트)

**Project Type**: 단일 Next.js 웹 애플리케이션 (frontend/backend 분리 없음)

**Performance Goals**: 클릭 시점부터 1초 이내 모달 표시(spec SC-001), 갤러리 내 이전/다음 전환
1초 이내(spec SC-005)

**Constraints**: 모달이 뷰포트 전체를 덮지 않음(FR-003); 배경 블러(FR-004); 확대 배율 상/하한
(FR-007); 다크/라이트 두 테마 모두에서 PhotoSwipe UI 스타일링 일관성; 신규 클라이언트 코드는
vercel-react-best-practices 감사 통과(Constitution III); PhotoSwipe JS/CSS는 이미지를 클릭하기
전까지 로드하지 않음(동적 import, `bundle-dynamic-imports` 규칙)

**Scale/Scope**: 신규 remark 플러그인 1개(`remark-images`), `Article`/`RenderResult` 타입 확장
(`images` 필드), 신규 클라이언트 컴포넌트 1개(본문 이미지 라이트박스 핸들러), 기존
`ArticleHeader`에 썸네일 클릭 핸들러 추가, PhotoSwipe 커스텀 스타일(다크/라이트 대응) 추가

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Feature-Level Verification (NON-NEGOTIABLE)** — PASS. `npm run build` 후
  `claude-in-chrome` MCP로 (a) 본문 이미지 클릭 시 모달 오픈, (b) 썸네일 클릭 시 모달 오픈,
  (c) 여러 이미지 게시글에서 이전/다음 탐색과 경계 처리, (d) +/- 버튼 확대·축소, (e) 모달 크기/
  배경 블러/등장 모션, (f) 다크·라이트 테마 전환을 실제로 구동해 확인하는 단계를 tasks에 포함한다.
- **II. Visual Consistency Across Dark/Light** — PASS. 이 기능은 `core/*.html` 정적 목업의
  레이아웃·카피·간격을 변경하지 않는다(라이트박스는 클릭 시에만 나타나는 런타임 오버레이이며
  정적 목업이 표현하는 페이지 구조 자체에는 변화가 없음). 대신 PhotoSwipe UI(화살표, 인디케이터,
  +/- 버튼, 닫기 버튼, 배경 블러)를 실제 Next.js 앱의 다크/라이트 테마 토큰에 맞춰 스타일링하고,
  두 테마 모두에서 브라우저로 직접 확인해 원칙의 취지(다크/라이트 페어의 시각적 일관성)를
  충족한다. Inter/JetBrains Mono/Pretendard 외 폰트는 추가하지 않는다.
- **III. Mandatory vercel-react-best-practices Compliance (NON-NEGOTIABLE)** — PASS. 신규
  클라이언트 컴포넌트 작성 전 스킬을 재확인했고, `bundle-dynamic-imports`(PhotoSwipe JS/CSS는
  이미지 클릭 시점에만 동적 `import()`로 로드)와 `client-event-listeners`(본문 이미지 클릭
  핸들러는 `CodeCopyHandler`와 동일하게 페이지당 단일 document 레벨 리스너 1개만 사용)를
  명시적으로 적용한다. 구현 완료 후 이 규칙 기준으로 재감사한다.

**Complexity Tracking에 1건 기록** — vanilla JS 라이브러리(PhotoSwipe) 사용은 "Technology
Constraints"(프레임워크 자체 프리미티브 우선)에서 벗어나는 것처럼 보일 수 있어 정당화가
필요하다. 상세 내용은 아래 Complexity Tracking 참조.

**Post-Phase 1 재확인**: `research.md`/`data-model.md`/`contracts/`/`quickstart.md` 설계
결과에서도 세 원칙 모두 여전히 PASS. 새로운 서버 상태나 DB가 추가되지 않았고(data-model.md),
동적 import·이벤트 위임 적용 지점이 research.md/contracts에 구체적으로 명시되어 있으며,
브라우저 검증 절차가 quickstart.md에 상세화되어 있어 Gate 재위반 없음.

## Project Structure

### Documentation (this feature)

```text
specs/009-image-lightbox-modal/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
lib/content/
├── pipeline.ts                        # 기존 — remarkImages 플러그인을 파이프라인에 등록,
│                                       #   RenderResult에 images 필드 추가
├── plugins/
│   ├── remark-toc.ts                  # 기존 — 신규 remark-images.ts가 따르는 참조 패턴
│   └── remark-images.ts               # 신규 — 본문 image 노드를 order/src/alt로 수집하고
│                                       #   data-lightbox-index hProperty를 부여
└── loader.ts                          # 기존 — renderMarkdown 결과의 images를 Article에 포함

lib/data/
└── types.ts                            # 기존 — ArticleImage 인터페이스 추가, Article.images: ArticleImage[]

app/article/[slug]/page.tsx              # 기존 — ImageLightboxHandler를 article-body와 나란히 마운트

components/article/
├── article-header.tsx                  # 기존 — 썸네일 wrapper에 onClick 추가 (단일 이미지 라이트박스)
├── code-copy-handler.tsx               # 기존 — image-lightbox-handler.tsx가 따르는 이벤트 위임 참조 패턴
└── image-lightbox-handler.tsx          # 신규 — 본문 이미지 클릭 위임 + PhotoSwipe 동적 로드/초기화

app/globals.css                         # 기존 — PhotoSwipe 오버레이 커스텀 스타일(여백 크기, 배경 블러,
                                         #   다크/라이트 토큰, +/- 버튼·인디케이터 스타일) 추가

package.json                            # 기존 — photoswipe 의존성 추가
```

**Structure Decision**: 기존 단일 Next.js 앱 구조를 그대로 따른다. 새 라우트나 API, 별도
백엔드를 만들지 않는다. 마크다운 렌더링 파이프라인(`lib/content/`)에 이미지 목록 추출 단계를
한 곳 추가하고, `components/article/`에 본문 이미지 전용 클라이언트 컴포넌트 하나를 추가해
기존 게시글 페이지에 조립하며, 썸네일은 기존 `article-header.tsx`에 핸들러만 얹는다.
`core/*.html` 정적 목업은 이 기능으로 인한 레이아웃 변경이 없으므로 수정하지 않는다.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Vanilla JS 라이브러리(PhotoSwipe) 사용 — React 전용 라이트박스 대신 | 본문 이미지가 `dangerouslySetInnerHTML`로 삽입되는 React가 관리하지 않는 순수 HTML이라, DOM에 이미 존재하는 `<img>`에 이벤트 위임으로 바로 붙는 vanilla 라이브러리가 통합 비용이 가장 적다(`CodeCopyHandler`가 이미 이 패턴을 코드베이스에 확립해 둠) | `yet-another-react-lightbox` 등 React 전용 라이트박스는 슬라이드 배열을 React state로 사전 구성해야 하므로, 본문 HTML 문자열을 파싱해 React 트리 밖의 DOM과 별도로 동기화하는 추가 매핑 계층이 필요해져 오히려 복잡도가 늘어난다 |
