# Component Contract: Theme Toggle

이 기능이 노출하는 UI 계약은 하나뿐이다: 공유 `NavBar`에 삽입되는 테마 토글 컨트롤. 네트워크/API 계약은 없다(클라이언트 전용 기능, 서버 엔드포인트 없음).

## `ThemeToggle` (신규 컴포넌트)

**Props**: 없음 (전역 테마 상태를 내부에서 읽고 쓴다).

**Rendered output**:
- 32×32px 클릭 영역을 가진 단일 `<button type="button">` 하나, 그 안에 18×18px 인라인 `<svg>` 아이콘 하나.
- `aria-label`: 현재 테마가 `dark`일 때 `"라이트 모드로 전환"`, `light`일 때 `"다크 모드로 전환"` (FR-011).
- 표시되는 아이콘: 현재 테마가 `dark`일 때 `light_mode` 글리프(라이트로 전환 가능함을 의미), `light`일 때 `dark_mode` 글리프(다크로 전환 가능함을 의미) — FR-003에 따라 `~/Desktop/ai/vibe/revi1337`의 `Icon.tsx` path 데이터와 동일 (`research.md` 참조).

**Behavior contract**:
- `onClick`: `document.documentElement`의 `dark` 클래스를 동기적으로 토글하고, 메모리상의 테마 상태를 갱신하며, 새 값을 `localStorage["revi-blog-theme"]`에 저장한다. 네트워크 요청은 발생하지 않는다(SC-005).
- 호버 상태: 아이콘 색이 `text-primary`로 전환되고 배경에 `bg-surface-container-highest/50`가 더해진다 — 레퍼런스 사이트의 호버 처리와 동일하다(FR-005).
- 빠르게 연속 클릭해도 DOM 클래스, 메모리상의 상태, `localStorage` 값은 항상 서로 일치한다(중간에 끊긴 상태가 없음).

## `NavBar` 배치 계약

- nav의 우측 버튼 그룹은 순서대로 `LOGIN` 버튼 → `|` 구분선
  (`<span className="text-outline-variant select-none text-code-sm">|</span>`) → `ThemeToggle`을 렌더링한다.
- 이 그룹은 `NavBar`가 마운트되는 모든 곳(홈, 아티클 상세 — FR-012)에서 동일하게 렌더링되며, `NavBar`는 토글을 지원하기 위한 새 props가 필요하지 않다.
