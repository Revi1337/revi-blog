"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

import { THEME_COOKIE_KEY, THEME_COLOR_DARK, THEME_COLOR_LIGHT } from "@/components/theme/theme-constants"

interface ThemeContextValue {
  isDark: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

/** <meta name="theme-color">를 항상 정확히 1개만 남도록 교체한다 — iOS Safari가 노치 뒤 safe
 * area를 칠할 때 참조하는 값이다.
 *
 * content 속성만 고치지 않고 기존 것을 전부 지운 뒤 새로 삽입하는 이유: 예전엔 이 meta를
 * app/layout.tsx의 viewport export가 선언해 React가 소유했는데, hydration 전에 인라인
 * 스크립트가 그 DOM 노드를 직접 고치면 React가 자기 값(다크)으로 meta를 하나 더 삽입해버렸다.
 * 그래서 라이트 사용자에게 [#f7f9fb, #0b1326]이 공존했고, 여기서 querySelector로 첫 번째만
 * 갱신하는 동안 뒤쪽 다크값이 영구히 남아 노치 색이 계속 다크로 고정됐다(프로덕션 실측 확인).
 * 지금은 viewport에서 themeColor를 빼 React의 소유권을 없앴고, 초기 생성(THEME_INIT_SCRIPT)과
 * 이후 전환(여기)이 모두 "전부 제거 후 하나 삽입"으로 통일돼 중복이 생길 수 없다. */
function setThemeColorMeta(themeColor: string) {
  const head = document.head
  head.querySelectorAll('meta[name="theme-color"]').forEach((el) => el.remove())
  const meta = document.createElement("meta")
  meta.setAttribute("name", "theme-color")
  meta.setAttribute("content", themeColor)
  head.appendChild(meta)
}

/** 노치 뒤 safe area를 채우는 색(WebKit의 확장 배경)은 **레이아웃 시점에만** 다시 계산된다 —
 * 실기기에서 스크롤(재합성)로는 갱신되지 않고 회전/새로고침으로만 갱신되는 것을 확인했다.
 * 다크모드 토글은 class만 바꾸는 순수 스타일 변경이라 레이아웃을 유발하지 않으므로, 회전이
 * 하는 일(=실제 레이아웃 무효화)을 눈에 보이지 않는 크기로 재현해준다.
 *
 * 반드시 rAF로 프레임을 넘겨야 한다 — 같은 프레임 안에서 값을 넣었다 빼면 브라우저는 중간
 * 상태를 실제로 그린 적이 없어 사실상 no-op이 된다(예전 transform 시도가 실패한 이유).
 * 문서 요소(html)의 sub-pixel padding이라 화면상 이동은 0.01px로 감지되지 않는다. */
function forceSafeAreaRelayout() {
  const root = document.documentElement
  // 검색 모달의 스크롤 잠금 등 다른 코드가 인라인 스타일을 쓸 수 있으므로 원래 값을 복원한다
  const prev = root.style.paddingTop
  root.style.paddingTop = prev ? `calc(${prev} + 0.01px)` : "0.01px"
  requestAnimationFrame(() => {
    root.style.paddingTop = prev
  })
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // layout.tsx의 인라인 스크립트가 hydration 전에 이미 <html>의 "dark" 클래스를 쿠키 기준으로
  // 맞춰놨으므로, 그 결과를 그대로 읽어 초기 상태로 삼는다 — 서버는 항상 "dark"로 렌더링하지만
  // 이 컴포넌트가 처음 실행되는 시점(hydration)엔 이미 스크립트가 보정을 끝낸 뒤라 실제 사용자
  // 설정과 일치하고, 따로 useEffect로 다시 읽어와 바꿔치기하지 않으므로 토글 아이콘 깜빡임도 없다.
  const [isDark, setIsDark] = useState(() =>
    typeof document === "undefined"
      ? true
      : document.documentElement.classList.contains("dark"),
  )

  function toggleTheme() {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle("dark", next)
    document.cookie = `${THEME_COOKIE_KEY}=${next ? "dark" : "light"}; path=/; max-age=31536000`
    setThemeColorMeta(next ? THEME_COLOR_DARK : THEME_COLOR_LIGHT)
    // theme-color/색상 CSS만으로는 노치 뒤 safe area가 갱신되지 않는다 — 그 색은 레이아웃
    // 시점에만 재계산되므로 여기서 명시적으로 레이아웃을 한 번 무효화한다.
    forceSafeAreaRelayout()
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider")
  return ctx
}
