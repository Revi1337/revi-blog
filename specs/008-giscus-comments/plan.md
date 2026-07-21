# Implementation Plan: Giscus 게시글 댓글

**Branch**: `008-giscus-comments` | **Date**: 2026-07-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-giscus-comments/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

게시글 세부 페이지 하단에 `@giscus/react` 기반 GitHub 댓글 위젯을 붙인다. 댓글 데이터는 별도 public 저장소(`Revi1337/revi-blog-comments`)의 Discussions에 저장되며, 위젯은 이 프로젝트가 이미 쓰고 있는 `useTheme()`(다크/라이트 토글) 상태에 실시간으로 동기화되고, `next/dynamic`(`ssr: false`) + giscus 자체 lazy loading으로 초기 페이지 로드에 영향을 주지 않도록 구현한다. `core/article-detail-dark.html`/`core/article-detail-light.html` 정적 목업에도 동일한 구조의 자리표시자 섹션을 함께 반영한다.

## Technical Context

**Language/Version**: TypeScript, Next.js 16 (App Router), React 19

**Primary Dependencies**: `@giscus/react` (신규 추가), `next/dynamic`, 기존 `components/theme/theme-context.tsx`의 `useTheme()`

**Storage**: N/A — 댓글 데이터는 이 앱이 아니라 GitHub Discussions(`Revi1337/revi-blog-comments`)가 저장한다

**Testing**: `npm run build` + `claude-in-chrome` MCP를 통한 실제 브라우저 검증 (프로젝트 Constitution Principle I)

**Target Platform**: 웹 (Next.js SSR/SSG로 빌드되는 브라우저 클라이언트)

**Project Type**: 단일 Next.js 웹 애플리케이션 (frontend/backend 분리 없음)

**Performance Goals**: 댓글 위젯 로드가 게시글 본문의 최초 렌더링을 지연시키지 않을 것 (spec SC-004) — 댓글 영역에 도달하기 전까지 관련 네트워크 요청이 발생하지 않아야 함

**Constraints**: 테마 전환 시 1초 이내 위젯 재마운트 없이 테마 반영(spec SC-003); 다크/라이트 목업 페어 동시 갱신(Constitution Principle II); 신규 React 코드는 vercel-react-best-practices 감사 통과(Constitution Principle III)

**Scale/Scope**: 신규 컴포넌트 1개(`components/article/article-comments.tsx`), 기존 페이지 1곳 통합(`app/article/[slug]/page.tsx`), 정적 목업 2개 파일 동일 반영

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Feature-Level Verification (NON-NEGOTIABLE)** — PASS. `npm run build` 후 `claude-in-chrome` MCP로 (a) 댓글 섹션 노출, (b) 테마 토글 시 위젯 즉시 반영, (c) 초기 로드 네트워크 요청에 giscus 리소스가 없다가 스크롤 시 로드되는지를 실제로 구동해 확인하는 단계를 tasks에 포함한다.
- **II. Visual Consistency Across Dark/Light** — PASS. `core/article-detail-dark.html`과 `core/article-detail-light.html`을 같은 작업 단위로 동시에 수정하고, Inter/JetBrains Mono/Pretendard 외 폰트를 추가하지 않는다.
- **III. Mandatory vercel-react-best-practices Compliance (NON-NEGOTIABLE)** — PASS. 신규 클라이언트 컴포넌트 작성 전 스킬을 재확인했고, `bundle-dynamic-imports`(무거운 서드파티 위젯은 `next/dynamic`으로 분리)와 `rerender-derived-state`(테마 값을 별도 effect로 동기화하지 않고 파생 prop으로 바로 전달)를 명시적으로 적용한다. 구현 완료 후 이 두 규칙 기준으로 재감사한다.

위반 사항 없음 — Complexity Tracking 불필요.

**Post-Phase 1 재확인**: `research.md`/`data-model.md`/`contracts/`/`quickstart.md` 설계 결과에서도 세 원칙 모두 여전히 PASS. 새로운 백엔드나 상태 관리가 추가되지 않았고(data-model.md), 목업 반영과 브라우저 검증 절차가 quickstart.md에 구체화되었으며, dynamic-import/derived-state 적용 지점이 contracts/research 문서에 명시되어 있어 Gate 재위반 없음.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
app/article/[slug]/page.tsx          # 기존 게시글 세부 페이지 — ArticleNav 아래에 ArticleComments 통합

components/article/
├── article-header.tsx                # 기존
├── article-nav.tsx                   # 기존 (이전/다음 글 네비게이션, 댓글 섹션 바로 위)
├── toc-sidebar.tsx                   # 기존 (섹션 헤더 스타일 참조)
├── code-copy-handler.tsx             # 기존
└── article-comments.tsx              # 신규 — giscus 위젯 클라이언트 컴포넌트

components/theme/
├── theme-context.tsx                 # 기존 useTheme()(isDark) — 댓글 위젯 테마 동기화에 그대로 사용
└── theme-toggle.tsx                  # 기존

core/
├── article-detail-dark.html          # 정적 목업 — 댓글 섹션 자리표시자 추가
└── article-detail-light.html         # 정적 목업 — 댓글 섹션 자리표시자 추가 (dark와 동시 반영)
```

**Structure Decision**: 기존 단일 Next.js 앱 구조를 그대로 따른다. 새 라우트나 API, 별도 백엔드를 만들지 않고 `components/article/`에 컴포넌트 하나를 추가해 기존 게시글 페이지에 조립하는 방식이며, `core/*.html` 정적 목업 페어는 Constitution Principle II에 따라 동일 커밋에서 함께 갱신한다.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
