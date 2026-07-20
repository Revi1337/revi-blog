"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"

import { THEME_STORAGE_KEY } from "@/components/theme/theme-script"

interface ThemeContextValue {
  isDark: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  // 서버와 최초 클라이언트 렌더는 항상 dark로 통일해 하이드레이션 불일치를 아예 만들지 않는다.
  // (React는 하이드레이션 시점의 속성 불일치를 DOM에 실제로 반영하지 않고 내부 상태만
  // 맞는 값으로 넘어가는 경우가 있어, 그 시점에 곧바로 실제 값을 읽으면 아이콘이 영구적으로
  // 어긋난 채 남는다.) 마운트 후 theme-script.tsx가 이미 <html>에 반영해 둔 실제 값으로
  // 한 번 더 갱신하면, 이건 하이드레이션이 아니라 일반적인 리렌더라 DOM에 정상 반영된다.
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"))
  }, [])

  function toggleTheme() {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle("dark", next)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next ? "dark" : "light")
    } catch {
      // 시크릿 모드 등에서 localStorage 접근이 막혀도 현재 세션의 테마 전환 자체는 계속 동작해야 한다
    }
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
