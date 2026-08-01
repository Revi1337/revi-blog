"use client"

import { createContext, useContext, useLayoutEffect, useState, type ReactNode } from "react"

import { THEME_COLORS, THEME_COOKIE_KEY } from "@/components/theme/theme-constants"

interface ThemeContextValue {
  isDark: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  // 서버는 항상 "dark"로 렌더링하므로 초기 state도 일부러 dark로 맞춘다 — layout.tsx의
  // 인라인 스크립트가 hydration 전에 <html>의 class는 쿠키 기준으로 이미 고쳐놨지만, hydration의
  // 첫 렌더에서 곧장 실제 값을 state로 넣으면 React가 이 값을 "이미 일치하는 값"으로 보고
  // 커밋 시 DOM 속성(ThemeToggle의 aria-label/svg path)을 패치하지 않는다 — hydration은 mismatch를
  // 조용히 넘어갈 뿐 실제로 고쳐 쓰지는 않기 때문. 그 결과 라이트 모드 사용자는 토글 버튼이
  // 클릭 전까지 계속 "다크 모드입니다" 아이콘으로 고정돼 보이는 문제가 있었다. 아래
  // useLayoutEffect가 페인트 직전에 실제 값으로 state를 바꿔 진짜 업데이트 경로를 한 번
  // 타게 만들어야 DOM이 올바르게 패치되고, useLayoutEffect라 브라우저가 그리기 전에 끝나
  // 깜빡임도 없다(다크 모드 사용자는 애초에 값이 같아 아무 것도 안 바뀐다).
  const [isDark, setIsDark] = useState(true)

  useLayoutEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"))
  }, [])

  function toggleTheme() {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle("dark", next)
    document.cookie = `${THEME_COOKIE_KEY}=${next ? "dark" : "light"}; path=/; max-age=31536000`
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", next ? THEME_COLORS.dark : THEME_COLORS.light)
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
