# Phase 0 Research: 헤더 Nav Dark/Light 토글 버튼 추가

## 레퍼런스 구현 (me.revi1337.com)

출처: `~/Desktop/ai/vibe/revi1337` (Next.js 프로젝트, 사용자가 me.revi1337.com의 레퍼런스로 확인해줌).

- `src/components/ui/Nav.tsx` — 우측 nav 그룹은 `LangToggle` → `|` 구분선 → `ThemeToggle` → `|` 구분선 → `PdfExportButton` 순으로 렌더링된다. 구분선 마크업:
  `<span className="text-outline-variant select-none text-code-sm">|</span>`.
- `src/components/ui/ThemeToggle.tsx` — 32×32px(`w-8 h-8`) 버튼, `rounded`,
  `text-on-surface-variant`, 호버 상태 `hover:text-primary hover:bg-surface-container-highest/50`,
  `transition-colors`. 아이콘은 18×18px(`w-[18px] h-[18px]`). 아이콘이 바뀔 때 회전/페이드/스케일 애니메이션은 없고 호버 시 CSS 색상 전환만 있다. `aria-label`은 "다크 모드로 전환" / "라이트 모드로 전환" 사이를 오간다.
- `src/components/ui/Icon.tsx` — 인라인 SVG, `viewBox="0 -960 960 960"`, `fill="currentColor"`,
  단일 `<path>`. 정확한 Material Symbols path 데이터:
  - `light_mode`: `M565-395q35-35 35-85t-35-85q-35-35-85-35t-85 35q-35 35-35 85t35 85q35 35 85 35t85-35Zm-226.5 56.5Q280-397 280-480t58.5-141.5Q397-680 480-680t141.5 58.5Q680-563 680-480t-58.5 141.5Q563-280 480-280t-141.5-58.5ZM200-440H40v-80h160v80Zm720 0H760v-80h160v80ZM440-760v-160h80v160h-80Zm0 720v-160h80v160h-80ZM256-650l-101-97 57-59 96 100-52 56Zm492 496-97-101 53-55 101 97-57 59Zm-98-550 97-101 59 57-100 96-56-52ZM154-212l101-97 55 53-97 101-59-57Zm326-268Z`
  - `dark_mode`: `M480-120q-150 0-255-105T120-480q0-150 105-255t255-105q14 0 27.5 1t26.5 3q-41 29-65.5 75.5T444-660q0 90 63 153t153 63q55 0 101-24.5t75-65.5q2 13 3 26.5t1 27.5q0 150-105 255T480-120Zm0-80q88 0 158-48.5T740-375q-20 5-40 8t-40 3q-123 0-209.5-86.5T364-660q0-20 3-40t8-40q-78 32-126.5 102T200-480q0 116 82 198t198 82Zm-10-270Z`
- `src/lib/ThemeContext.tsx` — `isLight` boolean을 담는 클라이언트 Context. `toggleTheme()`은 상태를 뒤집고, `<html>`의 `light` 클래스를 토글하며, `theme` 쿠키(`max-age=31536000; path=/`)를 기록한다.
- `src/app/layout.tsx` — Next.js 서버 컴포넌트가 `next/headers`의 `cookies()`로 `theme` 쿠키를 읽어, HTML이 클라이언트에 도달하기 전에 `<html>`에 초기 `light` 클래스를 서버에서 찍는다. 그래서 첫 페인트에도, 하드 리프레시에도 깜빡임이 전혀 없다(서버가 항상 쿠키로부터 올바른 클래스를 렌더링하기 때문).

## 결정: 레퍼런스의 쿠키/SSR 방식 대신, 이 프로젝트에 이미 있는 localStorage + 블로킹 스크립트 FOUC 방지 방식을 재사용

**Decision**: 테마 선택을 `revi-blog-theme` 키로 `localStorage`에 저장하고, `components/theme/theme-script.tsx`에 이미 존재하는 동기 블로킹 `<script>`로 계속 적용한다. 레퍼런스의 `ThemeContext.tsx`와 비슷한 형태의 작은 클라이언트 `ThemeProvider`/`useTheme` 컨텍스트를 추가하고, 그 `toggleTheme()`은 `document.documentElement`의 `dark` 클래스를 토글하고 `localStorage.setItem(THEME_STORAGE_KEY, …)`를 기록한다. 토글 버튼은 초기 아이콘을 `document.documentElement.classList`를 검사해서 결정한다(블로킹 스크립트가 하이드레이션 이전에 이미 클래스를 설정해 두었으므로). SSR을 위한 가드를 두고, 아이콘 요소에만 `suppressHydrationWarning`을 붙인다.

**Rationale**:
- `components/theme/theme-script.tsx`는 이미 이 코드베이스에 존재하며, 그 자체 주석이 명시적으로 이 기능을 위한 것임을 밝히고 있다("클릭형 토글 UI는 002(theme-toggle) 범위 — 이 스크립트는 그 토글이 나중에 localStorage에 쓸 수 있도록 동일한 key만 미리 약속해둔다"). 이 스크립트는 이미 `<head>`에서 페인트 이전에 동기적으로 실행되어 `localStorage`(없으면 `prefers-color-scheme`로 폴백)로부터 `dark` 클래스를 설정하므로, "FOUC 없음"과 "하드 리프레시에도 유지"(FR-008, 그리고 사용자가 이번에 명시한 하드 리프레시 요구사항)를 서버 왕복 없이 그대로 만족한다.
- 이 Next.js 앱의 나머지 부분은 `next/headers`의 `cookies()`나 요청 시점 상태에 의존하는 곳이 어디에도 없다. 레퍼런스의 쿠키+SSR 패턴을 그대로 이식하면, 딱 "한 프레임짜리 아이콘(색상이 아니라) 깜빡임" 하나를 없애기 위해 `app/layout.tsx`를 쿠키를 읽는 비동기 서버 컴포넌트로 바꿔야 하는데, 이 프로젝트가 실제로 가진 제약에 비해 과도한 아키텍처 변경이다.
- 이 프로젝트의 기본 테마는 "`.dark`가 없으면 다크"(레퍼런스는 반대로 "`.light`가 있으면 라이트")로, 이미 있는 tailwind 설정(`app/globals.css` 4번째 줄: `@custom-variant dark (&:where(.dark, .dark *))`)과 `theme-script.tsx`가 이미 "기본은 dark, `.dark` 클래스를 추가"하는 방식으로 인코딩되어 있다. 따라서 새 `ThemeProvider`는 `light` 클래스가 아니라 `dark` 클래스를 토글해야 기존에 배포된 것과 일관된다.

**Alternatives considered**:
- *쿠키 + SSR 읽기 패턴을 그대로 이식* — 기각: 오늘 하나도 없는 `next/headers` 쿠키 읽기를 레이아웃에 새로 들여오고, 이 프로젝트가 이미 다른(똑같이 유효한) 방식으로 해결해 둔 FOUC 방지를 중복 구현하게 된다.
- *테마 상태를 React에만 두고 영속화하지 않음* — 기각: FR-007/FR-008과 사용자가 명시한 하드 리프레시 요구사항을 아예 만족하지 못한다.

## 디자인 토큰

`app/globals.css`의 `@theme` 블록에 이미 픽셀 단위로 동일한 토큰이 존재함을 확인했다(레퍼런스 저장소와 같은 Material Design 3 토큰 이름, 예: `--color-on-surface-variant`, `--color-outline-variant`, `--color-surface-container-highest`, `--text-code-sm`). 따라서 토글 버튼과 구분선은 레퍼런스와 완전히 동일한 Tailwind 유틸리티 클래스(`text-on-surface-variant`, `hover:text-primary`, `hover:bg-surface-container-highest/50`, `text-outline-variant`, `text-code-sm`)를 그대로 쓸 수 있고, 새로 정의할 토큰은 없다.

## 아이콘 컴포넌트

이 프로젝트에는 기존 `Icon`/SVG 레지스트리 컴포넌트가 없다(`components/` 아래 `*icon*`으로 grep해도 결과 없음). Decision: 범용 아이콘 레지스트리를 새로 만들지 않고(YAGNI — 이 프로젝트의 다른 어떤 곳도 아직 그런 걸 필요로 하지 않음), 두 Material Symbols path(`light_mode`, `dark_mode`)를 레퍼런스의 `Icon.tsx`와 동일한 `viewBox="0 -960 960 960"` / `fill="currentColor"` SVG 셸 그대로 새 theme-toggle 컴포넌트 안에 인라인으로 둔다.

## 배치

spec에 따라 토글은 `components/layout/nav-bar.tsx`의 `LOGIN` 버튼 바로 오른쪽, 레퍼런스와 동일한 `|` 구분선 마크업으로 분리되어, 버튼 그룹의 기존 `gap-stack-md` flex 컨테이너 항목들 사이에 배치된다.
