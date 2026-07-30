# Implementation Plan: 방문자 및 게시글 조회수 통계

**Branch**: `011-visitor-stats-widget` | **Date**: 2026-07-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/011-visitor-stats-widget/spec.md`

## Summary

홈/북마크 페이지에는 "총 방문자 수 / 오늘 방문자 수 / 어제 방문자 수" 세 지표를, 아티클 상세 페이지에는 여기에 "이 게시글의 조회수"를 더한 네 지표를 노출하는 위젯을 추가한다. 방문자 식별은 IP 기반(로그인 없음)이며 봇/크롤러는 집계에서 제외한다. 카운팅은 Next.js Middleware(Edge Runtime)에서 처리해 기존 페이지의 정적 렌더링을 그대로 유지하고, 데이터는 Vercel Marketplace의 Upstash Redis 무료 티어에 저장한다. 화면 표시는 클라이언트 컴포넌트가 별도 API route를 호출해 렌더링하므로 페이지 자체의 서버 렌더링 방식은 바뀌지 않는다.

## Technical Context

**Language/Version**: TypeScript, Next.js 16.2.10 (App Router)

**Primary Dependencies**:
- `@upstash/redis` (신규) — Upstash의 REST 기반 Redis 클라이언트. Edge Runtime은 TCP 기반 Redis 클라이언트(ioredis 등)를 지원하지 않으므로 필수.
- `swr` (신규) — 동일 데이터를 필요로 하는 데스크탑/모바일 두 위젯 인스턴스가 중복 네트워크 요청을 만들지 않도록 dedup. `vercel-react-best-practices`의 `client-swr-dedup` 규칙이 정확히 이 상황을 위한 규칙임.
- 기존: `lucide-react`(Eye 아이콘 추가), `motion`(기존 컴포넌트들과 동일한 페이드인 연출 유지 시)

**Storage**: Upstash Redis (Vercel Marketplace 연동, 무료 티어 — 월 50만 커맨드, 256MB, 카드 등록 불필요)

**Testing**: 이 프로젝트엔 자동화 테스트 프레임워크가 없음(package.json에 jest/vitest 등 미설치). Constitution Principle I에 따라 `npm run build` + `playwright-cli` 스킬을 이용한 실브라우저 검증이 기본 검증 방식.

**Target Platform**: Vercel (Edge Middleware + Node/Edge 서버리스 함수), 웹 브라우저(데스크탑/태블릿/모바일, 다크/라이트 테마)

**Project Type**: Web (Next.js App Router 단일 프로젝트 — frontend/backend 분리 없음)

**Performance Goals**: 기존 정적 페이지의 최초 로딩 체감 속도에 변화가 없어야 함(spec SC-005). 통계 숫자 자체는 클라이언트 마운트 이후 비동기로 채워져도 무방함.

**Constraints**:
- 기존에 정적으로 프리렌더링되던 페이지가 이 기능 추가로 인해 매 요청마다 동적 렌더링으로 전환되어서는 안 됨(NON-NEGOTIABLE, spec FR-012).
- 무료 인프라로만 운영 가능해야 함(spec FR-013).

**Scale/Scope**: 개인 블로그 규모(낮은 트래픽). 신규 파일: Middleware 1개, API route 2개, 클라이언트 컴포넌트 1개, 서버 유틸 3개. 기존 파일 수정: 5개(`app/page.tsx`, `components/home/hero-intro.tsx`, `app/bookmark/page.tsx`, `app/article/[slug]/page.tsx`, `components/article/article-header.tsx`).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Feature-Level Verification (NON-NEGOTIABLE) | PASS | `npm run build` + `playwright-cli`로 데스크탑/모바일 두 브레이크포인트, 다크/라이트 테마, 방문자 dedup 동작(같은 IP 재방문 시 카운트 불변), 봇 UA 제외까지 실제로 구동해 확인한다. `content/articles/**` 캐싱 재시작 규칙은 이 기능이 마크다운 콘텐츠를 건드리지 않으므로 해당 없음. |
| II. Visual Consistency Across Dark/Light | PASS (범위 밖이지만 정신은 준수) | 이 원칙의 문자 그대로의 범위는 `core/*.html` dark/light 페어인데, 이 기능은 그 정적 목업 파일을 전혀 건드리지 않고 React 컴포넌트로만 구현됨. 다만 기존 `ThemeProvider`/디자인 토큰을 그대로 재사용해 다크/라이트 양쪽에서 동일하게 보이도록 구현한다(별도 색상 하드코딩 금지). |
| III. Mandatory vercel-react-best-practices Compliance (NON-NEGOTIABLE) | PASS (구현 시 감사 필요) | 구현 전 `.claude/skills/vercel-react-best-practices/rules/`를 실제로 열어 확인해야 함. 특히 적용 대상: `server-hoist-static-io`(Redis 클라이언트를 모듈 레벨 싱글턴으로 hoist), `client-swr-dedup`(위 Primary Dependencies 참고), `rendering-hydration-no-flicker`(클라이언트 fetch 완료 전 로딩 상태의 hydration mismatch 방지), `bundle-dynamic-imports`(위젯이 핵심 콘텐츠가 아니므로 동적 임포트 대상인지 검토). |

Complexity Tracking 불필요 — 위 게이트 전부 PASS, 정당화가 필요한 위반 없음.

**Phase 1 설계 완료 후 재확인**: `research.md`/`data-model.md`/`contracts/`/`quickstart.md` 작성 과정에서 새로운 의존성(`@upstash/redis`, `swr`)이나 아키텍처 결정이 추가됐지만, 둘 다 Technical Context에서 이미 정당화됐고 위 세 게이트 판단을 바꾸는 내용은 없음. 전 항목 PASS 유지.

## Project Structure

### Documentation (this feature)

```text
specs/011-visitor-stats-widget/
├── plan.md              # 이 파일
├── research.md          # Phase 0 산출물
├── data-model.md         # Phase 1 산출물
├── quickstart.md         # Phase 1 산출물
├── contracts/            # Phase 1 산출물
│   └── stats-api.md
└── tasks.md              # Phase 2 산출물 (/speckit-tasks, 이 명령에서 생성 안 함)
```

### Source Code (repository root)

```text
middleware.ts                                    # NEW — 봇 필터링, IP dedup 체크, 카운터 증가(visits:total/daily, pageviews)

lib/stats/
├── redis.ts                                      # NEW — Upstash Redis 클라이언트 싱글턴 (모듈 레벨 hoist)
├── bot-detection.ts                               # NEW — User-Agent 정규식 기반 봇/크롤러 판별
├── get-stats.ts                                   # NEW — 서버 사이드 조회 헬퍼: getGlobalStats(), getArticleViews(slug)
└── use-visitor-stats.ts                           # NEW — SWR 기반 클라이언트 훅, /api/stats(/[slug]) 호출을 컴포넌트 간 dedup

app/api/stats/
├── route.ts                                       # NEW — GET → { total, today, yesterday }
└── [slug]/route.ts                                # NEW — GET → { total, today, yesterday, views }

components/stats/
└── visitor-stats-widget.tsx                       # NEW — "use client", variant="desktop"|"mobile" prop, useVisitorStats() 사용

app/page.tsx                                       # MODIFIED — <VisitorStatsWidget variant="desktop" /> 를 Hero와 같은 높이에 배치
components/home/hero-intro.tsx                     # MODIFIED — <VisitorStatsWidget variant="mobile" /> 를 "WHOAMI:" 줄 아래 인라인 삽입
app/bookmark/page.tsx                              # MODIFIED — desktop(고정)·mobile(인라인 최상단) 두 variant 모두 배치 (Hero가 없는 페이지이므로 동일 높이만 맞춤)
app/article/[slug]/page.tsx                        # MODIFIED — <VisitorStatsWidget variant="desktop" articleSlug={slug} /> 를 ArticleHeader와 같은 높이에 배치
components/article/article-header.tsx              # MODIFIED — <VisitorStatsWidget variant="mobile" articleSlug={slug} /> 를 기존 메타 정보 줄(날짜·수정일·읽는시간)에 Eye 아이콘 항목으로 추가

package.json                                       # MODIFIED — @upstash/redis, swr 의존성 추가
```

**Structure Decision**: 단일 Next.js App Router 프로젝트 구조를 그대로 따른다(별도 frontend/backend 분리 없음). `components/article/toc-sidebar.tsx`가 이미 `variant="mobile"`/`variant="desktop"` 두 인스턴스를 각 페이지에서 따로 렌더링하는 선례가 있어(`app/article/[slug]/page.tsx`), `VisitorStatsWidget`도 동일한 컨벤션을 따른다. 데스크탑 인스턴스는 `position: fixed`이므로 DOM상 어디에 위치하든 시각적으로는 좌측 여백에 고정되며, `top` 값만 각 페이지의 Hero/ArticleHeader 높이에 맞춰 계산한다. 두 인스턴스가 각각 `useVisitorStats()`를 호출해도 SWR의 요청 dedup 덕분에 실제 네트워크 요청은 1회로 합쳐진다.

## Complexity Tracking

*(해당 없음 — Constitution Check 전 항목 PASS)*
