"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

import { THEME_COOKIE_KEY } from "@/components/theme/theme-constants"

interface ThemeContextValue {
  isDark: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({
  initialIsDark,
  children,
}: {
  initialIsDark: boolean
  children: ReactNode
}) {
  // 서버(layout.tsx)가 쿠키로 읽어온 값을 그대로 초기 상태로 사용한다.
  // 마운트 후 다시 읽어와 바꿔치기하지 않으므로 하드 리프레시 시 토글 아이콘 깜빡임이 없다.
  const [isDark, setIsDark] = useState(initialIsDark)

  function toggleTheme() {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle("dark", next)
    document.cookie = `${THEME_COOKIE_KEY}=${next ? "dark" : "light"}; path=/; max-age=31536000`
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
