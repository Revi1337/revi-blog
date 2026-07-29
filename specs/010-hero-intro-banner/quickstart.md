# Quickstart: 히어로 캐러셀 제거 및 자기소개 배너 교체 검증

이 기능은 `content/home/main.yaml`을 모듈 로드 시점에 읽는 정적 콘텐츠이므로, 편집 후 반드시 `next dev`를 재시작하거나 `npm run build`를 다시 실행해야 변경이 반영된다(이 프로젝트의 `content/articles/**` 캐싱 규칙과 동일한 성격 — Constitution Principle I).

## Prerequisites

- `content/home/main.yaml`, `lib/content/hero.ts`, `lib/data/hero.ts`, `components/home/hero-intro.tsx`, `components/home/hero-icon.tsx`가 구현되어 있고 `app/page.tsx`가 `HeroIntro`를 렌더링하도록 교체되어 있을 것
- `components/home/hero-carousel.tsx`, `components/ui/carousel.tsx`가 삭제되어 있고 `package.json`에 `embla-carousel-react`/`embla-carousel-autoplay`가 남아있지 않을 것

## Setup

```bash
npm install   # embla 의존성 제거를 package-lock.json에 반영
npm run build
```

빌드가 에러 없이 끝나는지 확인한다(특히 `lib/content/hero.ts`의 필드 검증 로직이 `content/home/main.yaml`을 문제없이 파싱하는지).

## Run & Verify (User Story 1 — 배너로 캐러셀 대체)

```bash
npm run start   # 또는 next dev -p 3999 재시작 후 확인
```

`playwright-cli`로 홈(`/`)을 연다.

- [ ] 최상단 배너 영역에 헤드라인 한 줄, 철학 항목 3개(라벨+설명), 프로필 이미지가 보인다
- [ ] 자동 재생 슬라이드, 좌우 화살표, 인디케이터 점 등 캐러셀 조작 요소가 전혀 없다
- [ ] 배너 아래로 스크롤하면 Entry Stream 카드 그리드가 이어지고, 배너 내용과 그리드의 글 목록이 겹치지 않는다(그리드에는 여전히 글 제목/썸네일이 나오지만, 배너에는 글 관련 정보가 전혀 없다)

## Run & Verify (User Story 2 — 데스크탑 레이아웃)

- [ ] 데스크탑 폭(1200px 이상)에서 텍스트가 왼쪽, 프로필 이미지가 오른쪽에 있다
- [ ] 브라우저 창 폭을 늘려도(예: 1600px) 프로필 이미지 크기는 그대로이고 텍스트 영역만 넓어진다
- [ ] 배너의 세로 높이가 기존 캐러셀(480px 상당)보다 뚜렷하게 작다

## Run & Verify (User Story 3 — 모바일 레이아웃)

- [ ] 뷰포트를 375px 폭으로 줄이면 프로필 이미지가 위에 작게, 텍스트가 그 아래에 세로로 쌓인다

## Theme Check

- [ ] 다크 테마와 라이트 테마 양쪽에서 배너를 열어 레이아웃과 텍스트 내용이 동일하고 색상 팔레트만 다른지 확인한다(`components/theme/theme-toggle.tsx`로 전환)

## Constitution Principle III Audit

- [ ] `.agents/skills/vercel-react-best-practices/rules/`를 열어 `hero-intro.tsx`/`hero-icon.tsx`를 감사한다 — 특히 불필요한 `"use client"`가 없는지, 정적 I/O(`lib/content/hero.ts`)가 모듈 스코프에서 한 번만 실행되는지 확인한다

각 User Story 체크리스트를 통과하면 해당 Phase가 완료된 것으로 간주하고, 다음 Phase로 넘어가기 전에 위 Setup의 `npm run build`부터 다시 반복한다(spec FR-012).
