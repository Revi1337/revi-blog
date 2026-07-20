# Implementation Plan: Markdown Extended Syntax

**Branch**: `004-markdown-extended-syntax` | **Date**: 2026-07-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-markdown-extended-syntax/spec.md`

## Summary

`lib/content/pipeline.ts`의 기존 unified(remark→rehype) 파이프라인에 옵시디언/GitHub 확장 문법
6종(콜아웃, 수식, 하이라이트, 주석, 전헤딩앵커, details 스타일링)을 추가한다. 콜아웃·하이라이트·전헤딩앵커는
기존 `remark-metrics.ts`/`remark-toc.ts`와 동일하게 hand-rolled 커스텀 remark 플러그인으로 구현하고,
수식만 검증된 외부 패키지(`remark-math`+`rehype-katex`)를 신규 도입한다. 주석은 mdast 레벨이 아니라
`rawBody` 문자열 전처리 단계에서 제거해 블록 경계를 넘나드는 케이스를 단순하게 처리한다. details는
코드 변경 없이 CSS만 추가한다.

## Technical Context

**Language/Version**: TypeScript 5 (Next.js 16.2.10, React 19.2.4)

**Primary Dependencies**: 기존 unified/remark/rehype 체인(`remark-parse`, `remark-gfm`, `remark-rehype`,
`rehype-pretty-code`, `rehype-stringify`) 유지. 신규 추가: `remark-math`, `rehype-katex`, `katex`
(수식 전용). 콜아웃/하이라이트/전헤딩앵커/주석은 신규 npm 의존성 없이 기존 `unist-util-visit`,
`mdast-util-to-string`, `github-slugger`만으로 구현.

**Storage**: N/A — `content/articles/*.md` 파일 기반, 빌드 타임 1회 파싱(기존 003 결정 유지)

**Testing**: 이 저장소에 자동화 테스트 스위트가 없음(NEEDS CLARIFICATION 아님 — constitution.md
Principle I이 기본 검증 수단을 이미 `npm run build` + 실제 브라우저 구동으로 명시). 이번 기능도 동일
기준을 따르며 quickstart.md에 스토리별 검증 절차를 기술한다.

**Target Platform**: Web (Next.js SSR/SSG, Node.js 빌드 환경)

**Project Type**: web (single Next.js app)

**Performance Goals**: 명시적 성능 목표 없음. KaTeX CSS(폰트 포함, gzip 후 수십 KB 수준)가
`app/globals.css`를 통해 전역 로드되어 모든 페이지의 초기 CSS 페이로드에 상수 비용으로 추가되는 점을
허용 가능한 트레이드오프로 문서화한다(research.md 참고).

**Constraints**: AGENTS.md/constitution.md의 다크·라이트 페어 원칙(신규 UI 6종 모두 두 테마 동시 대응),
Inter/JetBrains Mono 외 폰트 도입 금지(KaTeX 자체 수식 글리프는 `.katex` 스코프 한정 예외),
`content/articles/*.md` 기존 7개 아티클 렌더링 결과 회귀 없음(SC-004).

**Scale/Scope**: 신규 remark 플러그인 2개(callout, highlight) + 기존 플러그인 수정 1개(toc) + 신규
전처리 유틸 1개(comment strip) + 파이프라인 조립 1개(pipeline.ts) + 전역 CSS 1개(globals.css) +
검증용 콘텐츠 1개 + package.json 의존성 3개 추가. 총 변경 파일 약 8~9개.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I (Feature-Level Verification, NON-NEGOTIABLE)**: PASS (설계 단계) — quickstart.md에
  스토리별 `npm run build` + `claude-in-chrome` 실제 렌더링 확인 절차를 명시할 예정. AGENTS.md가
  기본 검증 도구로 `playwright-cli`를 우선 지정하고 있으나, 이번 피처는 사용자가 명시적으로
  `claude-in-chrome`을 검증 수단으로 지정했으므로 이를 따른다(AGENTS.md 기본값에 대한 사용자
  재지정으로 해석, 상충 아님).
- **Principle II (Visual Consistency Across Dark/Light)**: PASS (설계 단계) — 이 원칙은 문언상
  `core/*.html` 스크린을 대상으로 하지만, 스토리별 dark/light 요구사항(spec.md FR-012)이 동일한
  정신을 `.article-body` CSS에 적용한다. Phase 1 설계 산출물(data-model.md, quickstart.md)에
  콜아웃/하이라이트/수식/details 각각의 dark+light 셀렉터 쌍을 명시해 게이트를 만족시킨다.
- **Principle III (Mandatory vercel-react-best-practices Compliance)**: N/A — 이번 피처는 신규
  React/Next.js 컴포넌트를 작성하지 않는다(remark/rehype 플러그인은 순수 문자열/AST 변환 로직이고,
  유일한 React 접점인 `app/article/[slug]/page.tsx`의 `dangerouslySetInnerHTML` 렌더링 방식은
  변경하지 않음). 따라서 이 게이트는 트리거되지 않는다.

*재확인 (Phase 1 설계 이후)*: 위 판단 변경 없음 — Phase 1 산출물에서도 신규 React 컴포넌트가
생기지 않았고, dark/light 셀렉터 쌍이 모든 신규 CSS 항목에 계획됨.

## Project Structure

### Documentation (this feature)

```text
specs/004-markdown-extended-syntax/
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
├── pipeline.ts                  # 수정 — remark-math/rehype-katex, remark-callout, remark-highlight 등록
├── loader.ts                    # 수정 — renderMarkdown 호출 전 stripComments(rawBody) 적용
├── strip-comments.ts            # 신규 — %%...%% raw 문자열 전처리 유틸
└── plugins/
    ├── remark-metrics.ts        # 변경 없음 (기존)
    ├── remark-toc.ts            # 수정 — id 부여(h1~h6) / TOC 수집(h2~h3) 책임 분리
    ├── remark-callout.ts        # 신규 — > [!TYPE] 블록쿼트 → 콜아웃 hast 변환
    └── remark-highlight.ts      # 신규 — ==text== 텍스트 노드 → <mark> hast 변환

app/globals.css                  # 수정 — .article-body callout/mark/details/katex dark+light 규칙 추가
content/articles/
└── _syntax-preview.md           # 신규 (showOnHomepage: false) — 6개 문법 전수 포함 검증용 아티클

package.json                     # 수정 — remark-math, rehype-katex, katex 추가
```

**Structure Decision**: 기존 `lib/content/plugins/` 디렉토리 패턴을 그대로 확장한다(신규 디렉토리
없음). 주석 제거만 remark 플러그인이 아닌 `lib/content/` 최상위의 순수 문자열 유틸로 분리하는데,
이는 mdast 트리 레벨보다 raw 문자열 레벨에서 처리하는 편이 블록 경계를 넘는 주석과 미종료(EOF까지)
주석 처리를 단순하게 만들기 때문이다(research.md 참고).

## Complexity Tracking

*해당 없음 — Constitution Check 위반 없음.*
