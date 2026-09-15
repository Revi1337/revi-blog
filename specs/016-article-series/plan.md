# Implementation Plan: Article Series Display

**Branch**: `016-article-series` | **Date**: 2026-09-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/016-article-series/spec.md`

## Summary

아티클 상세 페이지에 "시리즈" 박스를 추가한다. 한 글이 속한 각 시리즈를 태그 영역 아래에 기본적으로 접힌 `<details>` 박스로 노출하고, 펼치면 시리즈 이름·순번(N/총 M편)·이전/다음 편 이동 링크를 보여준다. 시리즈 소속/순서는 마크다운 원문과 완전히 분리된 단일 레지스트리 파일(`lib/data/series-presets.ts`)에서만 관리하며, 빌드 타임에 `loader.ts`가 이를 각 `Article`에 attach한다. 펼침/접힘 상태는 어디에도 저장하지 않아 새로고침 시 항상 초기화되고, 기존 TOC 스크롤스파이(`toc-sidebar.tsx`)는 이미 문서 높이 변화에 범용으로 대응하므로 이 기능을 위해 수정하지 않는다.

## Technical Context

**Language/Version**: TypeScript 5 / React 19.2 / Next.js 16.2 (App Router)

**Primary Dependencies**: 기존 스택 재사용 — 새 npm 의존성 추가 없음. 마크다운 파이프라인(`lib/content/loader.ts`, `lib/content/pipeline.ts`)과 기존 React 컴포넌트 트리(`components/article/*`)만 확장한다.

**Storage**: N/A — 시리즈 소속/순서는 데이터베이스가 아니라 저장소에 커밋되는 정적 TypeScript 모듈(`lib/data/series-presets.ts`)이며, 빌드 타임에 한 번 읽힌다. 클라이언트 측 상태(펼침/접힘)는 의도적으로 어디에도 저장하지 않는다(FR-007).

**Testing**: 이 프로젝트에 별도 유닛 테스트 스위트는 없음(constitution Principle I) — `npm run build`로 빌드 타임 검증을 확인하고, `playwright-cli`로 실제 브라우저에서 기능·회귀를 검증한다.

**Target Platform**: 웹 (Next.js SSG, `generateStaticParams` 기반 정적 아티클 상세 페이지)

**Project Type**: 단일 Next.js 웹 애플리케이션(기존 프로젝트에 대한 기능 추가 — 신규 프로젝트/서브패키지 아님)

**Performance Goals**: 런타임 성능 목표 없음 — 시리즈 그룹핑/순번 계산은 전부 빌드 타임(top-level `await loadArticles()`)에 1회 수행되고, 클라이언트에는 이미 계산된 전체 목록(`episodes`)만 전달된다. 신규 클라이언트 상태는 네이티브 `<details>/<summary>` 토글과, 시리즈가 10편을 초과할 때 목록을 10개 단위로 넘겨보는 `useState` 페이지 인덱스뿐이다(별도 상태 관리 라이브러리·애니메이션 불필요).

**Constraints**:
- `content/articles/**` 마크다운 원문과 `lib/content/frontmatter.ts`의 `ArticleFrontmatter`는 이 기능을 위해 절대 수정하지 않는다(spec FR-009/FR-010 — 단일 소스, 글 원문과 분리된 관리).
- `components/article/toc-sidebar.tsx`, `components/article/heading-scroll.ts`는 수정하지 않는다 — 기존 범용 `ResizeObserver(document.documentElement)`(`toc-sidebar.tsx:296-297`)와 닫힌 `<details>` 헤딩 제외 필터(`toc-sidebar.tsx:248-250`)가 이미 이 기능을 커버한다(spec FR-008, SC-004).
- 펼침/접힘 상태를 위한 `localStorage`/`sessionStorage`/전역 상태 등 어떤 영속화 코드도 추가하지 않는다(spec FR-007).

**Scale/Scope**: 시리즈 개수·시리즈당 편 수는 현재 발행된 아티클 규모(150여 개) 내에서 소규모(수 개~수십 개 시리즈, 시리즈당 수 편)로 예상 — 별도 페이지네이션이나 지연 로딩 불필요.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status | Notes |
|---|---|---|---|
| I. Feature-Level Verification (NON-NEGOTIABLE) | `npm run build` + `playwright-cli` 브라우저 검증이 tasks.md에 명시적 태스크로 포함되어야 함 | **PASS** (계획됨) | `content/articles/**`를 건드리지 않으므로 "마크다운 수정 시 `next dev` 재시작 필수" 조항은 이 기능에는 적용되지 않음 — `series-presets.ts`는 일반 TS 모듈이라 Fast Refresh로 즉시 반영됨. 단, `loader.ts` 변경은 여전히 top-level await 캐시에 걸리므로 최초 통합 시 1회 재시작 필요. |
| II. Mandatory vercel-react-best-practices Compliance (NON-NEGOTIABLE) | 신규/수정 컴포넌트(`series-box.tsx`, `article-header.tsx`) 작성 전 스킬 규칙 확인 + 완료 전 감사가 tasks.md에 포함되어야 함 | **PASS** (계획됨) | 신규 클라이언트 상태 없이 네이티브 `<details>`만 쓰므로 위반 표면이 작지만, 감사 자체는 생략하지 않는다. |

위반 없음 — Complexity Tracking 섹션 불필요.

## Project Structure

### Documentation (this feature)

```text
specs/016-article-series/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output
├── data-model.md         # Phase 1 output
├── quickstart.md         # Phase 1 output
└── tasks.md              # Phase 2 output (/speckit-tasks — not created here)
```

(`contracts/`는 생략 — 이 기능은 외부에 노출되는 API/인터페이스가 없는 내부 데이터·UI 기능이다. 동일한 이유로 `contracts/`가 없는 선례: `specs/006-quick-search-filter`.)

### Source Code (repository root)

```text
lib/
├── data/
│   ├── series-presets.ts     # [NEW] 단일 소스 시리즈 레지스트리 — { id, label, slugs: string[] }[]
│   └── types.ts               # [MODIFIED] Article.series?: SeriesMembership[], SeriesMembership 타입 추가
└── content/
    └── loader.ts               # [MODIFIED] loadArticles() 파이프라인에 시리즈 attach 단계 추가
                                 #   (attachPrevNext와 동일한 위치·패턴, prev-next.ts는 참고용 — 수정 없음)

components/
└── article/
    ├── article-header.tsx      # [MODIFIED] 태그 렌더링(147-162행) 아래에 시리즈 박스 영역 추가
    └── series-box.tsx          # [NEW] 시리즈 하나당 <details>/<summary> 렌더링

# 이 기능에서 의도적으로 건드리지 않는 파일 (Constraints 참고)
components/article/toc-sidebar.tsx      # 수정 없음
components/article/heading-scroll.ts    # 수정 없음
content/articles/**                     # 수정 없음
lib/content/frontmatter.ts              # 수정 없음
```

**Structure Decision**: 별도 프로젝트/패키지를 만들지 않고 기존 Next.js 앱(`lib/`, `components/`) 안에서 확장한다. 데이터 레지스트리는 기존 `lib/data/quick-search-presets.ts`와 동일한 "중앙 정의 파일" 패턴을 따르고, 빌드 타임 attach는 기존 `lib/content/prev-next.ts` → `loader.ts` 통합 패턴을 그대로 재사용한다 — 이 기능만을 위한 새로운 아키텍처 패턴을 도입하지 않는다.

## Complexity Tracking

> Constitution Check에 위반이 없으므로 이 섹션은 채우지 않는다.
