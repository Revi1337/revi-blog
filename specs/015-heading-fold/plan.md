# Implementation Plan: 헤딩 접기/펼치기

**Branch**: `015-heading-fold` | **Date**: 2026-09-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/015-heading-fold/spec.md`

## Summary

아티클 본문의 H1~H6 헤딩마다 콘텐츠를 접고 펼 수 있는 토글을 추가한다. 핵심 기술 접근은 커스텀 JS
접기 로직 대신 브라우저 네이티브 `<details>/<summary>`를 재사용하는 것이다 — 이 프로젝트가 콜아웃
접기(`remark-callout.ts`)에서 이미 같은 프리미티브를 쓰고 있어 일관된 선택이다. 빌드 타임에 새
remark 플러그인이 flat한 mdast 헤딩 시퀀스를 헤딩 레벨 기준으로 재귀 중첩된 `<details>` 트리로
재구성하고, 클라이언트에서는 별도의 토글 상태 관리 컴포넌트 없이 TOC 클릭/앵커 진입/뒤로가기가
접힌 섹션의 조상 `<details>`를 여는 최소한의 로직만 추가한다(research.md 참고).

## Technical Context

**Language/Version**: TypeScript, Next.js(App Router) — 기존 스택 그대로, 신규 언어/런타임 없음.

**Primary Dependencies**: unified/remark/rehype 생태계(이미 프로젝트 의존성) — `mdast-util-to-hast`의
`hName`/`hProperties`/`hChildren` 관례(콜아웃이 이미 쓰는 패턴)를 그대로 사용. 신규 npm 패키지 불필요.

**Storage**: N/A — 접힘 상태는 영속화하지 않는다(spec.md FR-005, Assumptions).

**Testing**: 이 저장소에 자동화 테스트 스위트가 없음(constitution.md Principle I). `npm run build` +
`playwright-cli`로 각 User Story를 실제 브라우저에서 구동 검증한다. 구체적 검증 시나리오는 이 plan이
아니라 `/speckit-tasks`가 체크포인트 태스크로 작성한다.

**Target Platform**: 데스크톱/모바일 웹 브라우저. `<details>`의 네이티브 동작 중 "페이지 내 검색 시
자동 펼침"은 브라우저마다 지원이 다르다(research.md — Chrome은 지원, Firefox/Safari는 이 조사
시점 기준 미지원) — FR-010은 브라우저별로 지원 수준이 갈리는 것으로 알려진 위험으로 문서화한다.

**Project Type**: 웹 애플리케이션(단일 Next.js 프로젝트) — 기존 구조 그대로.

**Performance Goals**: 별도 수치 목표 없음 — 이 변환은 빌드 타임(마크다운 → HTML 렌더링 시점)에
일어나므로 런타임 렌더링 비용이 사실상 늘지 않아야 한다(FR-014 회귀 없음과 직결).

**Constraints**: `content/articles/**` 변경은 `next dev`를 재시작해야 반영된다(constitution.md
Principle I 경고) — 이 기능을 검증할 때도 동일하게 적용된다.

**Scale/Scope**: 빌드 파이프라인 1곳(`lib/content/pipeline.ts` + 신규 플러그인 1개)과, 그 출력에
의존하는 클라이언트 진입점 3곳(TOC 클릭, 헤딩 퍼머링크 클릭, 초기 해시/뒤로가기 복원)으로 범위가
명확히 한정된다.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I (Feature-Level Verification, NON-NEGOTIABLE)** — PASS. `npm run build` +
  `playwright-cli`로 각 User Story(P1 토글, P2 자동 펼침, P3 접근성)를 실제 브라우저에서 검증할
  계획이다. 검증용 아티클을 `content/articles/**`에 추가/수정하면 `next dev` 재시작이 필요하다는
  점을 quickstart.md에 명시한다.
- **Principle II (vercel-react-best-practices, NON-NEGOTIABLE)** — PASS(조건부). 신규 클라이언트
  로직(조상 `<details>` 자동 펼침)은 순수 유틸 함수로 시작할 수 있어 보이지만(`heading-scroll.ts`가
  이미 이 패턴), 만약 구현 중 React 컴포넌트/훅 형태가 필요해지면 작성 전 반드시
  `.agents/skills/vercel-react-best-practices/rules/`를 열어 감사해야 한다 — `/speckit-tasks`가 이
  감사를 명시적 태스크로 포함해야 한다.
- 위반 없음 — Complexity Tracking 불필요.

## Project Structure

### Documentation (this feature)

```text
specs/015-heading-fold/
├── plan.md                                # 이 파일
├── research.md                            # Phase 0 산출물
├── data-model.md                          # Phase 1 산출물
├── quickstart.md                          # Phase 1 산출물
├── contracts/
│   └── heading-fold-contract.md           # Phase 1 산출물
└── tasks.md                               # Phase 2 산출물 (/speckit-tasks, 이 명령이 만들지 않음)
```

### Source Code (repository root)

```text
lib/content/
├── pipeline.ts                            # 수정 — 신규 remark 플러그인 등록
│                                           # (remarkPlainText 뒤, .use(remarkRehype, ...) 앞)
└── plugins/
    └── remark-heading-fold.ts             # 신규 — flat 헤딩 시퀀스를 중첩 <details> mdast로 재구성

components/article/
├── heading-fold-ancestors.ts              # 신규 — "타겟 heading id의 조상 <details>를 모두
│                                           # open=true로" 만드는 단일 공용 유틸
├── heading-scroll.ts                      # 수정 — scrollToHeadingInstant가 스크롤 직전 위 유틸 호출
└── toc-sidebar.tsx                        # 수정 — restore()의 해시 폴백 경로(초기 로드/뒤로가기)에도
                                            # 동일 유틸 적용

app/
└── article-body.css                       # 수정 — 신규 heading-fold <details>가 기존 콜아웃 박스
                                            # 스타일(border/padding/background)을 상속받지 않도록
                                            # 클래스 스코프 분리, 헤딩 옆 인라인 쉐브론 스타일 추가
```

**Structure Decision**: 기존 콘텐츠 파이프라인(`lib/content/pipeline.ts` + `lib/content/plugins/`)과
기존 클라이언트 핸들러 디렉터리(`components/article/`) 구조를 그대로 따른다 — 신규 최상위 디렉터리
없음.

## Complexity Tracking

*(N/A — Constitution Check 위반 없음)*
