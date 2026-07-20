# Phase 1 Data Model: 헤더 Nav Dark/Light 토글 버튼 추가

이 기능에는 백엔드/데이터베이스 엔티티가 없다. 유일한 상태는 아래에서 설명하는, 클라이언트가 들고 있는 테마 선택뿐이다.

## Theme Preference

| Field | Type | Notes |
|---|---|---|
| `theme` | `"dark" \| "light"` | 현재 적용된 테마; `document.documentElement`의 `dark` 클래스로 그대로 반영된다(있으면 dark, 없으면 light) |

**Storage**: 브라우저 `localStorage`, 키 `revi-blog-theme` (`components/theme/theme-script.tsx`에 이미 `THEME_STORAGE_KEY`로 정의되어 있음).

**Lifecycle**:
1. **최초 방문, 저장된 값 없음**: 블로킹 스크립트(`theme-script.tsx`)가 `prefers-color-scheme`로부터 테마를 결정한다. `localStorage`도 없고 OS가 light를 선호하지도 않으면 dark를 기본값으로 한다(spec FR-008).
2. **토글 클릭**: 메모리상의 상태가 뒤집히고, `<html>`의 `dark` 클래스가 그에 맞춰 토글되며, 새 값이 `localStorage`에 동기적으로 기록된다(키 하나만 쓰므로 디바운스 불필요).
3. **하드 리프레시 / 새 탭**: 블로킹 스크립트가 첫 페인트 전에 `localStorage`를 다시 읽어 `dark` 클래스를 재적용한다 — 네트워크 요청도, 깜빡임도 없이 사용자가 명시한 하드 리프레시 요구사항을 만족한다.
4. **같은 사이트 내 다른 페이지로 이동**: 값은 `localStorage`에 그대로 남아 있고, 새 페이지 로드 시 블로킹 스크립트가 동일하게 재적용한다.

**Validation rule**: 언제나 `"dark"` 또는 `"light"`만 쓰고 신뢰한다. 그 외/누락된 값에 대해서는 블로킹 스크립트가 이미 계산된 기본값으로 폴백하므로(FR-008), 토글 컴포넌트가 읽을 때 다시 검증할 필요는 없다.

다른 엔티티와의 관계는 없으며, 서버 측 영속화도 없다(spec의 Assumptions에서 저장소를 브라우저로 명시적으로 한정함).
