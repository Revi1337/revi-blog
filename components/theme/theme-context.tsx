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
    // 노치 뒤 safe area 색은 CSS가 아니라 theme-color meta로 결정되므로 함께 갱신한다 —
    // 자세한 배경은 setThemeColorMeta 주석 참고.
    setThemeColorMeta(next ? THEME_COLOR_DARK : THEME_COLOR_LIGHT)
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
