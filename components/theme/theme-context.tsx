"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

import { THEME_COOKIE_KEY, THEME_COLOR_DARK, THEME_COLOR_LIGHT } from "@/components/theme/theme-constants"

interface ThemeContextValue {
  isDark: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

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
    // iOS Safari는 노치/상태바 색을 CSS 배경이 아니라 이 <meta name="theme-color">의 content를
    // 참조해 결정한다 — class만 토글하고 이 메타를 갱신하지 않으면 노치 영역이 항상 최초 로드
    // 시점 값(SSR 기본값인 다크)으로 고정된 채 이 수동 토글을 전혀 반영하지 못한다(OS의
    // prefers-color-scheme 변경이 아니라 순수 클라이언트 상태 전환이라 Safari가 스스로 감지할
    // 방법이 없음).
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", next ? THEME_COLOR_DARK : THEME_COLOR_LIGHT)
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
