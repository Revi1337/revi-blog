# Phase 0 Research: 정적 HTML 블로그 컴포넌트 재구현

## 1. Motion(motion.dev)과 Next.js App Router 통합 방식

**Decision**: 애니메이션이 필요한 컴포넌트(HeroCarousel, BlogCard 호버, ArticleHeader 타이틀, TocSidebar 활성 상태)는 `"use client"`를 붙인 클라이언트 컴포넌트로 분리하고, `motion/react`를 임포트한다. 번들 크기를 줄이기 위해 `LazyMotion` + `domAnimation` 프리셋을 루트에서 한 번만 로드한다.

**Rationale**: Motion 컴포넌트 자체는 클라이언트 전용이라 App Router의 서버 컴포넌트 안에서 직접 쓸 수 없다. 애니메이션이 없는 정적 마크업(NavBar, Footer 등)은 서버 컴포넌트로 유지해 vercel-react-best-practices의 "클라이언트 JS 최소화" 원칙을 지킨다. `LazyMotion(domAnimation)` 적용 시 번들이 약 34KB → 4.6KB로 줄어든다는 공식 가이드 근거가 있다.

**Alternatives considered**: CSS-only 애니메이션(Tailwind `transition`/`animate-*`) — 카드 호버·글로우 같은 단순 트랜지션엔 충분하지만, 캐러셀 슬라이드 전환처럼 시퀀스/제스처 제어가 필요한 곳은 CSS만으로 구현하면 코드가 장황해져 Motion을 그 부분에 한정해 쓰는 것으로 결정.

## 2. 히어로 캐러셀 — shadcn Carousel + 자동재생

**Decision**: shadcn/ui의 Carousel 컴포넌트(embla-carousel 래퍼)를 설치하고, `embla-carousel-autoplay` 플러그인을 `Autoplay({ delay: 8000, stopOnInteraction: false })`로 설정해 spec의 "8초 간격 자동 재생" 요구사항(FR-001)을 그대로 구현한다.

**Rationale**: embla-carousel-autoplay는 delay·hover/focus 시 일시정지·상호작용 후 정지 등을 기본 제공해, prev/next 버튼과 인디케이터 도트를 직접 접근성 있게 구현하는 것보다 훨씬 적은 코드로 동일 요구사항(Edge Case: 마지막 슬라이드에서 순환)을 만족한다. shadcn 컴포넌트는 소스가 그대로 리포지토리에 복사되므로, 기존 HTML의 인디케이터 도트/버튼 스타일을 그대로 덮어써도 무방하다.

**Alternatives considered**: Swiper.js — 기능은 더 풍부하지만 이 프로젝트는 이미 shadcn/Radix 생태계를 쓰기로 했고, 캐러셀 요구사항(자동재생·순환·인디케이터)이 embla로 충분히 커버되므로 추가 의존성을 늘릴 이유가 없음.

## 3. 코드 블록 구문 강조

**Decision**: Shiki를 서버 컴포넌트에서 `codeToHtml()`로 직접 호출해 정적 HTML 문자열을 생성하고, `CodeBlock` 컴포넌트는 이를 감싸는 서버 컴포넌트로 구현한다 (터미널 스타일 3색 도트·파일명 레이블은 별도 순수 마크업).

**Rationale**: 이 feature는 하드코딩된 샘플 콘텐츠만 다루므로(Assumptions), 클라이언트에서 동적으로 하이라이팅할 필요가 없다. `codeToHtml()`을 서버에서 실행하면 하이라이팅에 클라이언트 JS를 전혀 배송하지 않아 Performance Goals(클라이언트 JS 최소화)에도 부합한다.

**Alternatives considered**: `react-shiki`(클라이언트 훅/컴포넌트) — 콘텐츠가 런타임에 동적으로 바뀌는 경우(예: 사용자 입력)에 적합하지만, 이 feature엔 해당하지 않아 서버 전용 API로 충분.

## 4. Dark/Light 테마 전환 메커니즘 (버튼 없이)

**Decision**: `<html>` 요소에 Tailwind의 class 기반 다크모드(`class="dark"`)를 적용하고, 초기 렌더링 시 FOUC(테마 깜빡임) 방지를 위한 인라인 스크립트를 `layout.tsx`의 `<head>`에 최소한으로 둔다. 이 feature에서는 이 class를 프로그래밍적으로(개발자 도구/코드 레벨에서) 전환 가능한 상태까지만 만들고, 사용자가 클릭할 UI 버튼은 만들지 않는다.

**Rationale**: 기존 정적 HTML은 dark/light가 별도 파일이었으므로, "버튼으로 전환"은 spec 001의 범위가 아니다(002 assumption). 다만 SC-004(테마 전환 시 DOM 동일)를 검증하려면 최소한 class를 바꿔서 두 상태를 렌더링할 수 있어야 하므로, 메커니즘 자체는 이 feature에서 마련한다.

**Alternatives considered**: `next-themes` 라이브러리 도입 — 토글 버튼·localStorage 영속화까지 포함된 패키지라 002 범위까지 앞당겨 설치하게 됨. 이 feature는 메커니즘만 필요하므로 지금은 순수 class 전략만 두고, 002에서 필요 시 `next-themes` 도입 여부를 다시 판단하는 편이 스코프를 깨끗하게 유지한다.

## 5. Performance Goals 기본값

**Decision**: 명시적 성능 목표가 spec에 없어 Next.js/Core Web Vitals 기본 권장치(LCP < 2.5s, CLS < 0.1)를 채택.

**Rationale**: 정적 콘텐츠 위주 블로그라 이 기준을 넘기기 어렵지 않고, 별도 협상이 필요한 특수 성능 요구사항이 spec에 없다.

**Alternatives considered**: 없음 — 별도 목표가 필요해지면 이후 feature에서 구체화.

## Outstanding NEEDS CLARIFICATION

없음 — 위 5개 항목으로 Technical Context의 모든 불확실성 해소.
