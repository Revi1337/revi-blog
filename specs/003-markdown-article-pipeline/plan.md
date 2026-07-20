# Implementation Plan: Markdown 기반 아티클 콘텐츠 파이프라인

**Branch**: `003-markdown-article-pipeline` | **Date**: 2026-07-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-markdown-article-pipeline/spec.md`

## Summary

`lib/data/articles.ts`에 하드코딩된 HTML 문자열 배열을 `content/articles/*.md` 파일시스템 기반
콘텐츠로 교체한다. 각 파일은 frontmatter(gray-matter)로 메타데이터를, 본문은 unified(remark →
rehype) 파이프라인으로 파싱해 완결된 HTML로 렌더링한다. 코드 블록은 이미 설치된 `shiki`를
`rehype-pretty-code`로 감싸 다크/라이트 동시 테마 + 라인 하이라이트(`{n,n-n}`)를 지원하고,
`metrics` 언어 태그를 예약한 코드펜스를 커스텀 remark 플러그인이 `MetricCard[]`로 변환한다. TOC는
heading을 순회하며 자동 생성하고, prev/next는 `publishedAt` 내림차순으로 자동 계산한다. 기존
`Article`/`BlogCardData` 타입과 `getArticleBySlug`/`articles`/`blogCards` export 시그니처는
유지하되, `__CODE_BLOCK__`/`__METRICS__` 플레이스홀더 조립 방식은 제거한다.

## Technical Context

**Language/Version**: TypeScript, Next.js 16.2.10, React 19.2.4 (기존 프로젝트 버전 고정, 변경 없음)

**Primary Dependencies** (신규 설치 필요 — `shiki`는 이미 설치되어 있어 재사용):
- `gray-matter` — frontmatter 파싱
- `unified`, `remark-parse`, `remark-gfm`, `remark-rehype`, `rehype-stringify` — 마크다운 → HTML 파이프라인
- `rehype-pretty-code` — Shiki 기반 코드 블록 렌더링 + 라인 하이라이트 (기존 `shiki` 의존성 재사용)
- `github-slugger` — heading id 생성 (TOC ↔ anchor id 일치 보장, 커스텀 remark 플러그인 내부에서 사용)
- `reading-time` — 읽기 시간 자동 계산
- `unist-util-visit`, `mdast-util-to-string` — 커스텀 remark 플러그인(metrics 블록, TOC 추출) 구현에 필요

**Storage**: 로컬 파일시스템, `content/articles/*.md` (Git으로 버전 관리되는 정적 파일)

**Testing**: 별도 단위테스트 프레임워크 도입 없음 — constitution.md Principle I에 따라 `npm run build`
+ `playwright-cli`로 실제 렌더링을 구동해 검증 (quickstart.md 참고)

**Target Platform**: Next.js App Router, 빌드/모듈 로드 시점에 파일시스템을 읽는 정적 처리 (SSG,
기존 `generateStaticParams` 패턴 유지)

**Project Type**: 기존 Next.js 웹 애플리케이션 내 콘텐츠 레이어 교체

**Performance Goals**: 콘텐츠 로딩이 빌드/모듈 초기화 시점에 1회 발생 — 페이지 요청 처리 성능에는
영향 없음. 빌드 시간 증가는 아티클 수에 선형 비례하는 수준을 목표로 한다.

**Constraints**:
- `lib/data/articles.ts`의 `Article`/`BlogCardData` 타입 시그니처(`lib/data/types.ts`)는 변경하지 않는다
- constitution.md Principle II — 코드 하이라이트를 포함한 모든 시각 요소가 다크/라이트 양쪽에서 대비를 유지해야 한다 (기존 `CodeBlock`의 단일 테마 결함도 이번에 해소)
- constitution.md Principle III — 신규 작성하는 React 서버 컴포넌트/로더 코드는 vercel-react-best-practices 감사를 통과해야 한다

**Scale/Scope**: 기존 4개 아티클 마이그레이션 + 향후 추가를 전제로 한 폴더 구조. 다중 저자 동시
편집, CMS 연동은 범위 밖 (spec.md Assumptions)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|---|---|---|
| I. Feature-Level Verification | `npm run build` + `playwright-cli` 실행 계획이 quickstart.md에 명시되어 있는가 | ✅ PASS — quickstart.md 1~5단계에 구체 명령/확인 항목 정의 |
| II. Visual Consistency Across Dark/Light | 코드 하이라이트가 다크/라이트 양쪽에서 대비를 유지하는가; 폰트가 Inter/JetBrains Mono로 유지되는가 | ✅ PASS (조건부) — research.md에서 `rehype-pretty-code` dual-theme(`github-dark-default`/`github-light-default`) 설계로 기존 `CodeBlock` 단일 테마 결함까지 해소하기로 결정. 이 기능은 `core/*.html` 화면 자체를 수정하지 않으므로 Principle II의 "dark/light pair 동시 수정" 요건은 해당 없음(N/A) |
| III. Mandatory vercel-react-best-practices Compliance | 신규 서버 컴포넌트/로더 코드 작성 전 스킬 규칙을 열람하고, 완료 전 감사를 거치는가 | ⚠️ GATE — `/speckit-tasks`가 `.agents/skills/vercel-react-best-practices/rules/` 열람 태스크와 완료 전 감사 태스크를 명시적으로 생성해야 통과. 이 plan 단계에서는 아직 수행되지 않았으므로 tasks.md에 반드시 태스크화할 것 |

**Post-Phase 1 재확인**: data-model.md/contracts/quickstart.md 설계가 위 게이트와 충돌하지 않음을
확인함. Complexity Tracking에 기록할 위반 사항 없음.

## Project Structure

### Documentation (this feature)

```text
specs/003-markdown-article-pipeline/
├── plan.md              # 이 파일 (/speckit-plan 산출물)
├── research.md          # Phase 0 산출물 (/speckit-plan)
├── data-model.md        # Phase 1 산출물 (/speckit-plan)
├── quickstart.md        # Phase 1 산출물 (/speckit-plan)
├── contracts/           # Phase 1 산출물 (/speckit-plan)
└── tasks.md             # Phase 2 산출물 (/speckit-tasks — /speckit-plan에서는 생성하지 않음)
```

### Source Code (repository root)

```text
content/
└── articles/
    ├── architecting-high-concurrency-distributed-systems.md
    ├── optimizing-postgresql-indexing-high-write-loads.md
    ├── kafka-streams-vs-spark.md
    └── oauth2-from-scratch-security-audit.md

lib/
├── content/
│   ├── loader.ts              # content/articles/*.md 전체를 읽어 Article[]로 반환
│   ├── frontmatter.ts          # gray-matter 파싱 + 필수 필드 검증(FR-006)
│   ├── pipeline.ts             # unified(remark→rehype) 파이프라인 구성
│   ├── reading-time.ts         # 본문 텍스트 → readingTimeMinutes 계산
│   ├── prev-next.ts            # publishedAt 내림차순 기준 prev/next 계산
│   └── plugins/
│       ├── remark-metrics.ts   # ```metrics 코드펜스 → MetricCard[] 변환
│       └── remark-toc.ts       # heading 순회 → id 부여 + TocItem[] 수집
└── data/
    ├── articles.ts              # 얇은 어댑터: loadArticles() 결과를 재노출 (export 시그니처 유지)
    └── types.ts                 # 변경 없음 (Article/BlogCardData 등 기존 타입 그대로)

app/
├── page.tsx                     # 변경 없음 — blogCards import 그대로 사용
└── article/
    └── [slug]/
        └── page.tsx             # split() 플레이스홀더 조립 로직 제거, bodyHtml을 그대로 렌더링

components/article/
├── code-block.tsx                # 제거 대상 — rehype-pretty-code 출력이 bodyHtml에 이미 포함됨
└── metric-card-grid.tsx          # 제거 대상 — remark-metrics가 동일 마크업을 bodyHtml에 직접 생성
```

**Structure Decision**: 기존 프로젝트가 이미 Next.js App Router 단일 프로젝트 구조이므로 별도
frontend/backend 분리 없이 그 구조를 그대로 확장한다. 콘텐츠 파일은 `content/articles/`, 파싱
로직은 `lib/content/`에 신설하고, `lib/data/articles.ts`는 기존 소비 코드(`app/page.tsx`,
`app/article/[slug]/page.tsx`)가 깨지지 않도록 같은 export 시그니처를 유지하는 어댑터로만 남긴다.
`components/article/code-block.tsx`와 `metric-card-grid.tsx`는 렌더링 책임이 파이프라인으로
이전되므로 이번 기능 완료 시점에 제거 대상이다(tasks.md에서 별도 태스크로 다룬다).

## Complexity Tracking

해당 없음 — Constitution Check에 정당화가 필요한 위반 사항이 없다(Principle III는 위반이 아니라
tasks.md에서 이행해야 할 게이트로 표시됨).
