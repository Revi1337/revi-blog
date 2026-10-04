# Implementation Plan: 아티클 Copy Page 메뉴

**Branch**: `017-article-copy-page` | **Date**: 2026-10-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/017-article-copy-page/spec.md`

## Summary

아티클 상세 페이지 데스크탑 화면의 TOC 사이드바 바로 위에, "Open in ChatGPT / Open in Claude / Copy Page / View as Markdown" 네 동작을 제공하는 메뉴를 추가한다. 네 동작이 다루는 "원문"은 `lib/data/articles.ts`에 `Article` 타입과 완전히 분리된 slug→원문 캐시로 새로 들고 가고, 전용 Route Handler(`app/article/[slug]/raw`, Node 런타임 고정)만 이를 읽어 `stripComments()`를 통과시킨 뒤 서빙한다 — `Article`에는 필드를 추가하지 않아 기존에 `Article` 전체를 prop으로 받는 클라이언트 컴포넌트(`article-header.tsx` 등)의 RSC payload가 커지지 않는다. TOC 카드를 감싸는 sticky 박스(`app/article/[slug]/page.tsx`가 소유, `top-40` — 원래 `toc-sidebar.tsx`가 쓰던 값 그대로)는 **TOC 카드만으로 구성되고 한 글자도 바뀌지 않는다**. 새 메뉴는 이 박스의 문서 흐름에 전혀 기여하지 않는 `position: absolute`로 박스 바깥 위(`-top-12`)에 얹는다 — 박스의 top/height가 TOC 단독이었을 때와 1바이트도 다르지 않으므로 "스크롤 0부터 이미 고정"이라는 프로덕션 동작과 "끝에서 풀리는 지점" 둘 다 기능 추가 전과 완전히 동일하게 보존된다. (설계 변천사는 research.md §1 참고 — 최초엔 메뉴를 독립된 별도 sticky 요소로 분리했다가 서로 다른 scrollY에 풀리는 데드존을 겪었고, 다음엔 메뉴+TOC를 역산한 top으로 하나의 공유 sticky 박스에 합쳤다가 "스크롤 0~20px에서 따라잡기 움직임"이 프로덕션과 다르다는 게 발견되어, 최종적으로 메뉴를 sticky 박스의 흐름 바깥으로 완전히 빼는 현재 구조로 정착함.)

## Technical Context

**Language/Version**: TypeScript 5 / React 19.2 / Next.js 16.2 (App Router)

**Primary Dependencies**: 기존 스택 재사용 — 새 npm 의존성 추가 없음. `motion/react`(이미 전역 `LazyMotion`/`domAnimation` 프로바이더가 `components/motion-provider.tsx`에 떠 있음 — 새 드롭다운도 `motion/react-client`가 아니라 `toc-sidebar.tsx`와 동일하게 `motion/react`의 `m`/`AnimatePresence`만 import해 이 프로바이더를 재사용한다, 별도 번들 추가 없음), `lucide-react`(기존 아이콘 세트에 ChatGPT/Claude 로고가 없으므로 이 두 개만 작은 인라인 SVG로 추가).

**Storage**: N/A — 마크다운 원문은 `content/articles/**`에 커밋된 파일 그대로이며, `loader.ts`가 빌드/서버 시작 시 top-level await로 한 번 읽어 메모리 캐시(`Map<slug, string>`)로만 들고 있다. 별도 DB/파일 쓰기 없음.

**Testing**: 이 프로젝트에 별도 유닛 테스트 스위트는 없음(constitution Principle I) — `npm run build`로 빌드 타임 검증(특히 Route Handler가 Node 런타임으로 올바르게 빌드되는지), `playwright-cli`로 네 동작의 실제 브라우저 동작과 **TOC 스크롤 회귀 여부**를 검증한다(아래 Constraints/Complexity Tracking 참고).

**Target Platform**: 웹 (Next.js, 기존 `/article/[slug]` 페이지에 대한 추가 — 신규 Route Handler `/article/[slug]/raw`)

**Project Type**: 단일 Next.js 웹 애플리케이션(기존 프로젝트에 대한 기능 추가)

**Performance Goals**: 런타임 성능 목표 없음 — `rawMarkdownBySlug` 조회는 이미 메모리에 있는 `Map`의 O(1) `get()`뿐이라 추가 I/O가 없다. "Copy Page"는 메뉴를 열지 않는 방문자의 초기 페이지 payload에 1바이트도 추가하지 않는 것이 핵심 목표(아래 Constraints 참고) — 원문은 클릭 시점에 `fetch`한다.

**Constraints** (모두 하드 컨스트레인트 — 아래 중 하나라도 어기면 이 기능은 완료로 간주하지 않는다):

- **[TOC 데드존 금지, spec FR-009/SC-004]** `components/article/toc-sidebar.tsx`의 스크롤스파이·활성 헤딩 감지·"+N more"·모바일 드로어 로직은 이 기능을 위해 한 글자도 수정하지 않는다. (수정 이력: 최초에는 "파일 전체 무수정"을 하드 컨스트레인트로 세우고 메뉴를 독립된 별도 `position: sticky` 요소로 구현했으나, 두 개의 독립 sticky 요소는 서로 다른 scrollY에서 풀려버려 — 실측: `/article/Scope`에서 TOC는 15013에 풀리는데 메뉴는 15175까지 고정, 162px 구간 동안 간격이 벌어짐 — 스크롤 중 어긋나는 데드존이 실제 재현됐다. 이에 따라 `toc-sidebar.tsx`의 desktop variant가 소유하던 바깥 `sticky top-40` **포지셔닝 래퍼 한 겹만** `app/article/[slug]/page.tsx`로 이동시켜, 메뉴와 TOC 카드를 하나의 공유 sticky 박스로 합쳤다 — "파일 무수정"이라는 수단보다 "TOC 스크롤 동작이 프로덕션과 100% 동일하다"는 실제 목적을 우선했다.) `top-[112px] = 160 - 32(메뉴 높이) - 16(간격)`로 역산한 공유 top 오프셋 덕분에, 합쳐진 박스의 release 지점은 TOC 단독이었을 때와 모든 글(H_toc 무관)에서 수학적으로 동일하게 보존된다 — 과거 TOC 버그 이력(아래 Complexity Tracking의 리스크 매트릭스) 중 "짧은 글에서 여유 공간 부족으로 깨지는" 계열(`d74f422`)과 같은 근본 원인이 재발하지 않는다.
- **[Article 타입 불변, 효율성]** `lib/data/types.ts`의 `Article` 인터페이스에는 원문 관련 필드를 추가하지 않는다. `app/article/[slug]/page.tsx`가 `article`(전체 `Article` 객체)을 `ArticleHeader` 등 `"use client"` 컴포넌트에 prop으로 그대로 넘기고 있어, RSC가 그 prop을 "클라이언트가 실제로 쓰는 필드"가 아니라 객체 전체로 직렬화하기 때문이다 — 원문을 `Article`에 얹으면 메뉴를 한 번도 안 여는 방문자의 payload까지 전부 커진다.
- **[Node 런타임 고정]** 신규 Route Handler(`app/article/[slug]/raw/route.ts`)는 `export const runtime = "edge"`를 절대 지정하지 않는다(기본값인 Node 런타임 유지). `lib/data/articles.ts` → `lib/content/loader.ts`는 `node:fs` 기반이라 Edge 런타임에서는 이 모듈 그래프를 import하는 것 자체가 빌드에서 깨진다 — `app/api/stats/*`가 edge인 것과 혼동해 edge로 잘못 지정하지 않는다.
- **[비공개 메모 은닉 보장, spec FR-008]** `rawMarkdownBySlug`에 저장되는 원문은 반드시 `lib/content/strip-comments.ts`의 `stripComments()`를 통과한 결과여야 한다 — 지금 렌더링 파이프라인(`loader.ts`의 `loadArticleFile`)이 독자에게 비공개 메모(`%%...%%`)를 숨기는 것과 동일한 보장을 이 네 기능에도 유지한다.

**Scale/Scope**: 발행된 글은 150여 개, 가장 짧은 글(`datastructure/MST.md`, 23줄)부터 가장 긴 글(`language/python/Scope.md`, 534줄)까지 분포 — TOC 회귀 검증은 이 두 극단을 포함해야 한다(Phase 1 quickstart 참고).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status | Notes |
|---|---|---|---|
| I. Feature-Level Verification (NON-NEGOTIABLE) | `npm run build` + `playwright-cli` 브라우저 검증이 tasks.md에 명시적 태스크로 포함되어야 함 | **PASS** (계획됨) | `loader.ts`를 수정하므로(top-level await 캐시) 통합 후 최초 1회 `next dev` 재시작 필요. 추가로 이 기능은 일반 기능 검증을 넘어 **TOC 스크롤 회귀 비교 검증**(가장 짧은 글 `MST.md` / 가장 긴 글 `Scope.md` 양쪽에서 기능 추가 전후 TOC 고정-해제 스크롤 위치가 동일한지)이 반드시 tasks.md에 별도 태스크로 들어가야 한다. |
| II. Mandatory vercel-react-best-practices Compliance (NON-NEGOTIABLE) | 신규 컴포넌트(`copy-page-menu.tsx`) 작성 전 스킬 규칙 확인 + 완료 전 감사가 tasks.md에 포함되어야 함 | **PASS** (계획됨) | 새 client 컴포넌트가 `motion/react-client`(전체 번들)가 아니라 `motion/react`의 `m`/`AnimatePresence`(기존 전역 `LazyMotion` 재사용)만 import하는지가 이 감사의 핵심 체크 포인트. |

위반 없음 — 단, `toc-sidebar.tsx`의 바깥 포지셔닝 래퍼 한 겹을 호출부로 옮긴 결정(스크롤스파이 등 내부 로직은 무수정)의 근거를 아래 Complexity Tracking에 남긴다.

**Post-Phase 1 재확인**: Phase 1 설계(data-model.md/contracts/quickstart.md)에서 새로 드러난 위반 없음 — `RawMarkdownCache`가 `Article`과 분리된 별도 `Map`으로 확정되어 Principle II 감사 범위(신규 client 컴포넌트)도 애초 계획대로 `copy-page-menu.tsx` 하나로 유지됨.

## Project Structure

### Documentation (this feature)

```text
specs/017-article-copy-page/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output
├── data-model.md         # Phase 1 output
├── quickstart.md         # Phase 1 output
├── contracts/
│   └── raw-markdown-route.md   # Phase 1 output — GET /article/[slug]/raw 계약
└── tasks.md              # Phase 2 output (/speckit-tasks — not created here)
```

### Source Code (repository root)

```text
lib/
├── content/
│   └── loader.ts                 # [MODIFIED] parseArticleFile가 버리던 raw(파일 전체)를 유지,
│                                  #   loadArticles()가 rawMarkdownBySlug: Map<string, string>도 반환
│                                  #   (stripComments()를 통과시킨 뒤 저장 — 하드 컨스트레인트)
└── data/
    └── articles.ts                # [MODIFIED] rawMarkdownBySlug export + getArticleRawMarkdown(slug) 추가
                                    #   (Article 타입/articles/blogCards는 무변경 — 하드 컨스트레인트)

app/
└── article/
    └── [slug]/
        ├── page.tsx                # [MODIFIED] <aside> 안, <TocSidebar variant="desktop"/> 바로 앞에
        │                           #   <CopyPageMenu slug={article.slug} /> 추가 (TocSidebar 내부가 아님 —
        │                           #   items.length===0일 때 TOC와 함께 사라지면 안 되므로, spec FR-011)
        └── raw/
            └── route.ts             # [NEW] GET — getArticleRawMarkdown(slug) 조회, 없으면 404,
                                      #   있으면 text/markdown으로 응답. runtime 지정 없음(Node 기본값 유지 — 하드 컨스트레인트)

components/
└── article/
    └── copy-page-menu.tsx          # [NEW] 데스크탑 전용(TocSidebar와 동일한 lg: 브레이크포인트) 독립 sticky
                                     #   드롭다운. toc-sidebar.tsx의 모바일 드로어와 동일한
                                     #   open-state + createPortal 배경 오버레이 + Escape 패턴 재사용.
                                     #   TOC의 sticky top-40 박스와는 별개의 자기 자신의 top 오프셋을 가짐
                                     #   (정확한 px는 구현 후 실측 — contracts/ 참고 불필요, tasks.md에서 확정)

# 이 기능에서 의도적으로 건드리지 않는 부분 (Constraints 참고)
components/article/toc-sidebar.tsx        # [MODIFIED, 최소 범위] desktop variant의 바깥 `sticky top-40
                                           #   space-y-10` 래퍼 한 겹만 제거(그 역할은 page.tsx의 공유
                                           #   sticky 래퍼로 이동). 스크롤스파이/활성 헤딩 감지/
                                           #   "+N more"/모바일 variant는 한 글자도 수정하지 않음.
lib/data/types.ts                         # Article 인터페이스 수정 없음 — 하드 컨스트레인트
content/articles/**                       # 수정 없음
```

**Structure Decision**: 별도 프로젝트/패키지를 만들지 않고 기존 Next.js 앱 안에서 확장한다. 원문 캐시는 `Article`과 분리된 별도 `Map`으로 두는 패턴을 새로 도입하지만(이 프로젝트 최초), 그 자체는 기존 `loader.ts`가 이미 `blogSlugs`(또 다른 slug 기반 보조 산출물)를 `Article[]`과 나란히 반환하는 구조를 그대로 확장한 것뿐이라 새로운 아키텍처가 아니다. Route Handler는 이 프로젝트 첫 사례가 아니다 — `app/api/track`, `app/api/stats/*`와 동일한 Next.js Route Handler 패턴이며, Node 런타임 고정도 `app/api/track`과 동일한 선례를 따른다.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Constitution 위반은 없지만, `toc-sidebar.tsx`의 바깥 포지셔닝 래퍼를 옮기게 된 과거 버그 이력 기반 근거를 명시해둔다 — 이 표는 게이트 위반이 아니라 **설계 결정의 근거 기록**이다.

| 과거 회귀 | 근본 원인 | 이번 기능이 같은 원인을 재도입하지 않는 이유 |
|---|---|---|
| `d74f422` — 짧은 글에서 TOC 스크롤스파이가 active 되지 않던 문제 | 본문 끝 여백이 헤더 오프셋보다 짧아, "sticky/스크롤스파이가 버틸 수 있는 여유 공간"이 애초에 부족했음 | Copy Page 메뉴를 TOC와 같은 sticky 박스에 합치면 그 박스의 높이가 늘어나 정확히 같은 종류의 "여유 공간 부족"을 더 많은 글(특히 짧은 글)에서 재현시킴 → 그래서 메뉴를 별도 sticky 요소로 분리해, TOC 박스 자신의 높이를 원천적으로 바꾸지 않는다 |
| `8382354`/`6402ab3` — 새로고침 스크롤 복원 중 흔들림 / 다이어그램 렌더링 중 TOC가 중간 상태에 멈춤 | 문서 높이가 바뀌는 동안의 타이밍 가정이 깨짐 | 이번 기능은 문서 높이가 동적으로 바뀌는 로직(다이어그램 렌더링, 스크롤 복원)에 전혀 손대지 않음 — 정적으로 한 번 렌더링되는 메뉴를 추가하는 것뿐이라 이 계열의 타이밍 버그가 재발할 표면 자체가 없음 |
| `10af04e` — TOC 스크롤 목적지·스크롤스파이 기준값이 실제 헤더 높이와 다른 매직넘버였던 문제 | `--header-offset`을 실측하지 않고 하드코딩된 값을 썼음 | 이번 기능의 새 sticky `top` 오프셋도 추측값을 하드코딩하지 않고, 구현 후 실제 렌더링된 메뉴 높이를 실측해 반영한다(quickstart.md 참고) — 같은 "매직넘버 추측" 실수를 반복하지 않음 |

**Simpler Alternative Rejected Because**: "TOC 파일을 정말 한 글자도 안 건드리는" 독립 sticky 방식을 먼저 시도했으나, 두 sticky 요소가 서로 다른 scrollY에서 풀려 데드존이 재현됨(위 §TOC 데드존 금지 참고) — spec FR-009/SC-004("추가 전후 100% 동일")를 실제로 만족하지 못해 기각하고, 공유 sticky 래퍼(포지셔닝 래퍼 한 겹만 이동, 내부 로직 무수정)로 교체했다.
