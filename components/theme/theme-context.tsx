"use client"

import { createContext, useContext, useRef, useState, type ReactNode } from "react"

import { THEME_COOKIE_KEY, THEME_COLOR_DARK, THEME_COLOR_LIGHT } from "@/components/theme/theme-constants"

interface ThemeContextValue {
  isDark: boolean
  /** NavBar가 backdrop-blur를 잠시 꺼야 하는 구간인지 — 아래 toggleTheme 주석 참고 */
  isBlurSuppressed: boolean
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
  const [isBlurSuppressed, setIsBlurSuppressed] = useState(false)

  // iOS Safari는 상단 상태바(노치) 영역을 "페이지가 그린 픽셀을 샘플링"해서 칠하는데,
  // 그 영역에 backdrop-filter가 걸려 있으면 샘플링이 얼어붙어 회전/새로고침 전까지 이전 색이
  // 그대로 남는다. 실기기 진단으로 확정한 내용(불투명·반투명 무관, 오직 블러 유무가 갈림):
  //     불투명+블러X → 갱신 O | 반투명+블러X → 갱신 O
  //     불투명+블러O → 갱신 X | 반투명+블러O → 갱신 X
  // 그래서 테마가 바뀌는 순간에만 NavBar의 블러를 잠깐 끄고, 블러 없는 프레임이 한 번 그려져
  // Safari가 새 색을 다시 샘플링한 뒤 원래대로 되돌린다. 스크롤 위치가 맨 위면 헤더 뒤에
  // 비칠 내용 자체가 없어 이 짧은 구간은 눈에 띄지 않는다.
  const rafIdsRef = useRef<number[]>([])

  function toggleTheme() {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle("dark", next)
    document.cookie = `${THEME_COOKIE_KEY}=${next ? "dark" : "light"}; path=/; max-age=31536000`
    setThemeColorMeta(next ? THEME_COLOR_DARK : THEME_COLOR_LIGHT)

    // 색 변경과 블러 해제를 같은 이벤트 핸들러에서 처리해야 한다 — React가 두 state를 한 번의
    // 렌더로 묶어주므로 "새 색 + 블러 없음"이 한 프레임에 함께 그려진다. 되돌리는 건 반드시
    // rAF 두 번을 거쳐야 한다(같은 프레임에서 껐다 켜면 블러 없는 프레임이 실제로 그려진 적이
    // 없어 무의미해진다 — 예전 transform 시도가 실패한 이유가 정확히 이것이었다).
    rafIdsRef.current.forEach(cancelAnimationFrame)
    rafIdsRef.current = []
    setIsBlurSuppressed(true)
    const first = requestAnimationFrame(() => {
      rafIdsRef.current.push(requestAnimationFrame(() => setIsBlurSuppressed(false)))
    })
    rafIdsRef.current.push(first)
  }

  return (
    <ThemeContext.Provider value={{ isDark, isBlurSuppressed, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider")
  return ctx
}
