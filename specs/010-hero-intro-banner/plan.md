# Implementation Plan: 히어로 캐러셀 제거 및 자기소개 배너 교체

**Branch**: `010-hero-intro-banner` | **Date**: 2026-07-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/010-hero-intro-banner/spec.md`

## Summary

홈 화면 최상단의 히어로 캐러셀(`components/home/hero-carousel.tsx`, `embla-carousel-react`/`embla-carousel-autoplay` 기반)을 제거한다. 캐러셀은 `blogCards.slice(0, 3)`으로 최신 글 3개를 슬라이드로 보여주는데, 바로 아래 Entry Stream 그리드에도 동일한 글이 다시 나타나 정보 가치가 없다(spec 010 배경). 같은 위치를 정적 자기소개 배너로 교체한다 — 운영자의 개인 포트폴리오(`~/Desktop/ai/vibe/revi1337`)가 이미 관리 중인 `hero:` 콘텐츠(헤드라인 + 3개 철학 항목)를 이 블로그의 `content/home/main.yaml`로 옮기고, 이 블로그의 북마크 기능과 동일한 3계층 콘텐츠 파이프라인(`content/*.yaml` → `lib/content/*.ts` 파싱 → `lib/data/*.ts` 노출)으로 읽어 렌더링한다. 배너는 인터랙션이 전혀 없는 정적 정보 영역이므로 Server Component로 작성해 캐러셀이 갖고 있던 클라이언트 번들 비용(embla 두 패키지)을 그대로 제거한다.

## Technical Context

**Language/Version**: TypeScript 5, Next.js 16(App Router), React 19

**Primary Dependencies**: `yaml`(콘텐츠 파싱, 이미 `lib/content/bookmarks.ts`에서 사용 중 — 신규 의존성 아님), `lucide-react`(아이콘, 이미 사용 중), `next/image`(프로필 이미지). 신규로 추가되는 라이브러리는 없다. `embla-carousel-react`, `embla-carousel-autoplay`는 이번 기능으로 **제거**한다(레포 전체에서 `components/home/hero-carousel.tsx`, `components/ui/carousel.tsx` 외 다른 참조가 없음을 확인함).

**Storage**: 파일 기반 정적 콘텐츠 — `content/home/main.yaml` (DB 없음)

**Testing**: 자동화 테스트 코드 없음(spec FR-012) — 각 사용자 스토리(Phase) 구현이 끝날 때마다 `npm run build`로 재빌드한 뒤 `playwright-cli`로 실제 브라우저를 구동해 확인한다. Constitution Principle I(Feature-Level Verification)의 표준 절차를 그대로 따른다.

**Target Platform**: 웹 브라우저 (Next.js SSR/RSC, 기존 배포 파이프라인 그대로)

**Project Type**: 웹 애플리케이션 — 단일 Next.js 프로젝트(레포 루트가 곧 프로젝트 루트, `src/` 분리 없음)

**Performance Goals**: 정량적 목표 수치는 없음. 정성적으로 캐러셀의 클라이언트 번들 비용(embla-carousel-react + embla-carousel-autoplay + 관련 클라이언트 컴포넌트 JS)이 제거되어 홈 화면 초기 JS 페이로드가 감소해야 한다.

**Constraints**: 다크/라이트 테마에서 동일 레이아웃·내용 유지(Constitution Principle II, FR-009); 반응형 375px 기준 회귀 없음(spec 001 계승, FR-007); 배너에 인터랙션 요소가 전혀 없어야 함(FR-004); `core/*.html`은 이번 변경 범위에서 완전히 제외(spec Assumptions).

**Scale/Scope**: 화면 1개(홈)의 컴포넌트 1개 교체. 신규 파일: 콘텐츠 1개(`content/home/main.yaml`), lib 모듈 2개(`lib/content/hero.ts`, `lib/data/hero.ts`), 컴포넌트 2개(배너 본체 + 아이콘 매핑). 삭제 파일: 2개(`hero-carousel.tsx`, `ui/carousel.tsx`). 의존성 제거 2개.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I — Feature-Level Verification (NON-NEGOTIABLE)**: PASS. spec FR-012이 "각 사용자 스토리(Phase) 완료 시 재빌드 후 실제 브라우저 확인"을 이미 요구하며, 이는 이 constitution의 기본 절차(`npm` build + `playwright-cli`)와 정확히 일치한다. tasks.md의 각 Phase 마지막에 재빌드+브라우저 확인 task를 명시해야 한다.
- **Principle II — Visual Consistency Across Dark/Light**: PASS. 이 원칙의 "`core/*.html` 변경 시 dark/light 쌍을 함께 수정" 조항은 이번 기능이 `core/*.html`을 아예 건드리지 않으므로(spec Assumptions) 적용 대상이 아니다. 다만 실제 React 구현이 dark/light 모두에서 동일 레이아웃·내용을 유지해야 한다는 원칙의 취지는 FR-009/SC-005로 spec에 이미 반영되어 있다. 폰트 제약(Inter/JetBrains Mono/SUIT/Pretendard 4종)도 새 컴포넌트가 그대로 따른다 — 헤드라인은 헤딩 폰트(Pretendard), 라벨(`[VISUALIZATION]` 등)은 label-caps(JetBrains Mono) 규칙을 준수한다.
- **Principle III — Mandatory vercel-react-best-practices Compliance (NON-NEGOTIABLE)**: GATE — 구현 전/후 `.agents/skills/vercel-react-best-practices/rules/`를 실제로 열람하고 새 컴포넌트를 감사해야 한다. tasks.md에 명시적 감사 task로 반영한다. 이번 컴포넌트는 인터랙션이 전혀 없어(FR-004) `"use client"` 없이 Server Component로 작성 가능하다는 점 자체가 `hero-carousel.tsx`(클라이언트 컴포넌트, embla 훅 사용) 대비 이 스킬의 번들/렌더링 원칙에 부합하는 개선이다. YAML 콘텐츠 로딩은 `server-hoist-static-io.md` 규칙대로 요청마다가 아니라 모듈 스코프에서 한 번만 수행하는 `lib/content/bookmarks.ts` 패턴을 그대로 따른다.

위반 사항 없음 — Complexity Tracking 불필요.

## Project Structure

### Documentation (this feature)

```text
specs/010-hero-intro-banner/
├── plan.md              # 이 파일
├── research.md          # Phase 0 산출물
├── data-model.md        # Phase 1 산출물
├── quickstart.md         # Phase 1 산출물
└── tasks.md              # Phase 2 산출물 (/speckit-tasks — 이 명령에서는 생성하지 않음)
```

`contracts/`는 생성하지 않는다 — 이 기능은 외부에 노출되는 API/CLI/라이브러리 인터페이스가 없는 순수 내부 UI 컴포넌트 + 정적 콘텐츠 파일이다(북마크 기능과 동일한 성격 — 001/005/006/007도 같은 이유로 `contracts/`가 없다).

### Source Code (repository root)

단일 Next.js 프로젝트(Option 1 계열이지만 `src/` 분리 없이 레포 루트를 그대로 사용하는 이 프로젝트의 기존 구조를 따른다):

```text
content/
└── home/
    └── main.yaml                    # 신규 — hero: 키 아래 name/headline/philosophy

lib/
├── content/
│   ├── hero.ts                      # 신규 — main.yaml 파싱 (lib/content/bookmarks.ts 패턴)
│   └── bookmarks.ts                 # 기존, 변경 없음 (참조 패턴)
└── data/
    ├── hero.ts                      # 신규 — lib/content/hero.ts 재노출 (lib/data/bookmarks.ts 패턴)
    └── types.ts                     # 수정 — Hero/PhilosophyItem 타입 추가, HeroSlide 등 캐러셀 전용 타입 제거

components/
├── home/
│   ├── hero-intro.tsx               # 신규 — 배너 본체, Server Component
│   ├── hero-icon.tsx                # 신규 — icon name → LucideIcon 매핑 (components/bookmark/bookmark-icon.tsx 패턴)
│   └── hero-carousel.tsx            # 삭제
└── ui/
    └── carousel.tsx                 # 삭제 (hero-carousel.tsx 외 사용처 없음 확인됨)

app/
└── page.tsx                         # 수정 — HeroCarousel import/heroSlides 파생 로직 제거, HeroIntro로 교체

package.json                         # 수정 — embla-carousel-react, embla-carousel-autoplay 제거
```

**Structure Decision**: 기존 북마크 기능의 콘텐츠 파이프라인(`content/bookmarks/bookmarks.yaml` → `lib/content/bookmarks.ts` → `lib/data/bookmarks.ts`)과 아이콘 매핑(`components/bookmark/bookmark-icon.tsx`)을 그대로 본떠 홈 배너 전용 대응 파일들을 만든다. 파일명은 `hero.yaml`이 아니라 `main.yaml`로 두어(단, `hero:` 키 하위에 배치), 추후 홈 화면에 다른 정적 콘텐츠가 추가되어도 같은 파일에 키만 늘려 담을 수 있게 한다.
