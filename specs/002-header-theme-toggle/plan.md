# Implementation Plan: 헤더 Nav Dark/Light 토글 버튼 추가

**Branch**: `002-header-theme-toggle` | **Date**: 2026-07-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-header-theme-toggle/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

공유 `NavBar`의 LOGIN 버튼 바로 오른쪽에 dark/light 테마 토글 버튼을 추가한다. me.revi1337.com과 동일한 `|` 구분선으로 분리하며, SVG 아이콘과 호버/클릭 효과는 그 레퍼런스 사이트(`~/Desktop/ai/vibe/revi1337`)와 픽셀 단위로 동일해야 한다. 선택한 테마는 `localStorage`에 영속화하는데, 이 기능을 위해 이미 준비되어 있던 FOUC 방지 블로킹 스크립트(`components/theme/theme-script.tsx`)를 재사용해 하드 리프레시와 페이지 이동에도 깜빡임·네트워크 요청 없이 테마가 유지되도록 한다.

## Technical Context

**Language/Version**: TypeScript, Next.js 16 (App Router), React 19

**Primary Dependencies**: Next.js, React, Tailwind CSS v4 (기존 프로젝트 스택 그대로 — 새 의존성 추가 없음)

**Storage**: 브라우저 `localStorage` (키 `revi-blog-theme`, `components/theme/theme-script.tsx`에 이미 예약됨) — 서버 측 저장 없음

**Testing**: `npm run build` + constitution Principle I에 따른 `playwright-cli` / `playwright` MCP 스크린샷 수동 검증 (이 프로젝트에는 별도 자동화 테스트 러너가 구성되어 있지 않음)

**Target Platform**: 웹(브라우저), Next.js로 서버 렌더링

**Project Type**: Web application (단일 Next.js 프로젝트, frontend/backend 분리 없음)

**Performance Goals**: 테마 전환이 즉시로 체감되어야 함(<0.3초, SC-001); 토글 클릭 시 네트워크 요청 0건(SC-005)

**Constraints**: 로드 시점·하드 리프레시 시점 모두 FOUC 없어야 함; me.revi1337.com의 토글 SVG·호버/클릭 효과·`|` 구분선과 육안 비교 시 구분 불가능해야 함(SC-002); 새 폰트 패밀리나 디자인 토큰 추가 금지(constitution Principle II)

**Scale/Scope**: 새 클라이언트 컴포넌트 1개(`ThemeToggle`) + 최소한의 테마 컨텍스트, 모든 페이지(홈·아티클 상세)가 공유하는 기존 `NavBar`에 연결

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Feature-Level Verification (NON-NEGOTIABLE)** — PASS (계획됨). `quickstart.md`는 `npm run build` 후 `playwright-cli`로 실제 브라우저에서 토글을 구동하도록 요구하며, 픽셀 단위 일치 확인이 필요할 때는 me.revi1337.com과의 스크린샷 비교를 포함한다.
- **II. Visual Consistency Across Dark/Light** — PASS. 이 기능은 `core/*.html` 목업을 건드리지 않고 모든 페이지가 공유하는 실제 Next.js `NavBar`를 대상으로 하므로 dark/light 쌍이 어긋날 여지가 없다. `app/globals.css`에 이미 있는 Inter/JetBrains Mono 토큰만 사용하며 새 폰트는 추가하지 않는다.
- **III. Mandatory vercel-react-best-practices Compliance (NON-NEGOTIABLE)** — PASS (계획됨). `ThemeToggle`/`ThemeProvider`는 새 클라이언트 컴포넌트이므로, 작성 전에 `.agents/skills/vercel-react-best-practices/rules/`의 규칙을 먼저 확인하고, 완료 전에 그 결과를 감사한다(React/Next.js 기능에 대한 constitution 가이드에 따라 `tasks.md`에 명시적 태스크로 반영).

위반 사항 없음 — Complexity Tracking 절은 비워둔다.

## Project Structure

### Documentation (this feature)

```text
specs/002-header-theme-toggle/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── theme-toggle-component.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
components/
├── layout/
│   └── nav-bar.tsx          # 수정: LOGIN 오른쪽에 `|` 구분선 + <ThemeToggle /> 삽입
└── theme/
    ├── theme-script.tsx     # 기존: FOUC 방지 블로킹 스크립트 (localStorage 키 재사용)
    ├── theme-toggle.tsx     # 신규: 토글 버튼 (SVG 아이콘, 호버/클릭 동작)
    └── theme-context.tsx    # 신규: 클라이언트 ThemeProvider/useTheme (dark 클래스 + localStorage 동기화)

app/
└── layout.tsx                # 수정: children을 새 ThemeProvider로 감싼다
```

**Structure Decision**: 단일 Next.js 프로젝트(기존 `app/` + `components/` 구조, frontend/backend 분리 없음). 새 파일들은 기존 `theme-script.tsx`와 나란히 `components/theme/` 아래에 두고, `NavBar`와 루트 레이아웃은 토글을 연결하기 위해 그 자리에서 수정한다.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
