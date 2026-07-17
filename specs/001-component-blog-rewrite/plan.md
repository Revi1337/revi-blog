# Implementation Plan: 정적 HTML 블로그 컴포넌트 재구현

**Branch**: `001-component-blog-rewrite` | **Date**: 2026-07-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-component-blog-rewrite/spec.md`

## Summary

`core/*.html`로 존재하는 정적 블로그 화면(홈, 아티클 상세 — 각각 dark/light)을 Next.js 컴포넌트 기반으로 재구현한다. 시각적/기능적 결과는 기존 HTML과 동일하게 유지하되, 네비게이션·푸터·카드·캐러셀·코드 블록·TOC·메트릭 카드 같은 반복 UI 요소를 공유 컴포넌트로 추출해 단일 소스에서 관리한다. dark/light는 Tailwind의 class 기반 다크모드로 구현하고, 이 feature에서는 두 테마의 시각적 재현과 프로그래밍적 전환 메커니즘까지만 다룬다 — 헤더의 클릭형 토글 버튼과 선택 기억은 002(theme-toggle)의 범위다.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19 (Next.js 15, App Router)

**Primary Dependencies**: Next.js(App Router), Tailwind CSS(class 기반 다크모드), shadcn/ui(Radix 기반 — Button/Carousel/Pagination 프리미티브만 사용, 전면 재스타일링), Motion(motion.dev, 캐러셀 전환·카드 호버·타이틀 fade-in·TOC 활성 상태 애니메이션), Shiki(코드 블록 서버사이드 구문 강조)

**Storage**: N/A — 블로그 카드/아티클 콘텐츠는 `core/*.html`에 하드코딩된 샘플 데이터를 그대로 옮긴 정적 데이터(TS 객체)로 관리 (spec Assumptions)

**Testing**: npm 빌드 + `playwright-cli`로 실제 브라우저 구동 검증(우선), 픽셀 단위 비교가 필요한 SC-001/SC-002는 `playwright` MCP의 스크린샷 도구로 vision 검증 (constitution Principle I). 정적 페이지라 별도 단위 테스트 스위트는 두지 않고, `quickstart.md`의 시나리오로 매 feature 검증

**Target Platform**: 모던 에버그린 브라우저, 반응형(데스크탑/태블릿/모바일)

**Project Type**: Web application — 프론트엔드 전용 (백엔드/외부 API 없음, 정적 생성)

**Performance Goals**: 명시적 수치가 spec에 없어 Next.js 기본 권장치를 채택 — Core Web Vitals(LCP < 2.5s, CLS < 0.1) 유지. Shiki를 서버 컴포넌트에서 실행해 코드 하이라이팅에 클라이언트 JS를 추가로 배송하지 않음

**Constraints**: 재구현 화면은 기존 `core/*.html` 4개와 픽셀 수준으로 동일해야 함(SC-001, SC-002); 테마 전환 시 DOM 구조·레이아웃은 100% 동일하고 색상 팔레트만 변경(SC-004)

**Scale/Scope**: 화면 2개(홈, 아티클 상세) × 테마 2개, 공유 컴포넌트 약 8개(NavBar, Footer, BlogCard, HeroCarousel, Pagination, CodeBlock, TocSidebar, MetricCardGrid)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|---|---|---|
| I. Feature-Level Verification (NON-NEGOTIABLE) | Testing 필드에 npm 빌드 + playwright-cli 지정, quickstart.md가 실행 가능한 검증 시나리오 제공 | ✅ PASS |
| II. Visual Consistency Across Dark/Light | 모든 공유 컴포넌트는 Tailwind class 기반 다크모드 토큰만으로 색을 분기하고 DOM 구조는 테마와 무관하게 동일; 폰트는 Inter/JetBrains Mono만 사용(FR-010) | ✅ PASS |

위반 없음 — Complexity Tracking 불필요.

## Project Structure

### Documentation (this feature)

```text
specs/001-component-blog-rewrite/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md         # Phase 1 output
├── quickstart.md         # Phase 1 output
└── tasks.md              # Phase 2 output (/speckit-tasks, 이 명령으로 생성되지 않음)
```

`contracts/`는 생성하지 않음 — 이 feature는 순수 프론트엔드 정적 화면이라 외부에 노출하는 API/계약이 없음(plan 템플릿의 "purely internal" 예외에 해당).

### Source Code (repository root)

```text
app/
├── layout.tsx                  # 루트 레이아웃 — 폰트(Inter/JetBrains Mono), 다크모드 class 스크립트, 32px 그리드 배경
├── globals.css                 # Tailwind 베이스 + dark/light 색상 토큰(CSS 변수)
├── page.tsx                     # 홈 화면 (User Story 1)
└── article/
    └── [slug]/
        └── page.tsx              # 아티클 상세 화면 (User Story 2)

components/
├── layout/
│   ├── nav-bar.tsx               # 공유 네비게이션 (User Story 4, FR-006 sticky glassmorphism)
│   └── footer.tsx                 # 공유 푸터 (User Story 4, FR-012)
├── home/
│   ├── hero-carousel.tsx          # shadcn Carousel + embla-carousel-autoplay(8s) + Motion 전환
│   ├── blog-card.tsx               # 공유 카드 (호버 scale/glow, dark 전용 텍스트 glow FR-007)
│   ├── blog-card-grid.tsx
│   └── pagination.tsx              # shadcn Pagination 기반, 1~12 + prev/next
├── article/
│   ├── article-header.tsx          # 카테고리 배지, 제목(Motion fade-in), 메타 정보
│   ├── code-block.tsx               # 터미널 스타일(3색 도트, 파일명) + Shiki 서버 렌더링, 직접 구현
│   ├── metric-card-grid.tsx         # 메트릭 카드 3열, 직접 구현
│   ├── toc-sidebar.tsx               # sticky TOC, 활성 상태 Motion 전환, 직접 구현
│   └── article-nav.tsx                # 이전/다음 글 네비게이션
├── theme/
│   └── theme-script.tsx              # class 기반 다크모드 적용 스크립트 (토글 버튼은 002 범위, 여기선 메커니즘만)
└── ui/                                # shadcn/ui가 생성하는 프리미티브(button, carousel, pagination 등) — 이 저장소 소유 코드

lib/
├── data/
│   ├── articles.ts                    # 아티클 샘플 데이터
│   └── nav.ts                          # 네비게이션 메뉴 항목
└── utils.ts                            # cn() 등 shadcn 컨벤션 유틸
```

**Structure Decision**: Next.js App Router 단일 프론트엔드 프로젝트. 백엔드/API가 없으므로 plan 템플릿의 Option 2(frontend+backend 분리)는 쓰지 않음. `components/`를 화면 전용(`home/`, `article/`)과 공유(`layout/`, `theme/`, `ui/`)로 나눠 FR-004(공유 요소 단일 소스 관리)를 구조적으로 강제한다.

## Complexity Tracking

*Constitution Check 위반 없음 — 해당 없음.*
