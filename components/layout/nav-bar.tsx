"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { navLinks } from "@/lib/data/nav"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/theme/theme-context"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { MobileNavMenu } from "@/components/layout/mobile-nav-menu"
import { SearchTrigger } from "@/components/search/search-trigger"
import { useSearchShortcut } from "@/components/search/use-search-shortcut"
import { useSearchIndex } from "@/lib/search/use-search-index"

const SearchModal = dynamic(
  () => import("@/components/search/search-modal").then((m) => m.SearchModal),
  { ssr: false }
)

export function NavBar() {
  const pathname = usePathname()
  const [searchOpen, setSearchOpen] = useState(false)
  const [hasOpenedSearch, setHasOpenedSearch] = useState(false)
  const [shouldLoadSearchIndex, setShouldLoadSearchIndex] = useState(false)
  const searchIndex = useSearchIndex(shouldLoadSearchIndex)
  const openSearch = useCallback(() => {
    setHasOpenedSearch(true)
    setShouldLoadSearchIndex(true)
    setSearchOpen(true)
  }, [])
  useSearchShortcut(openSearch)

  // 검색을 열지 않는 방문자의 초기 HTML에는 검색 인덱스가 아예 안 실리지만(server-serialization
  // 회피), 실제로 여는 사람이 매번 fetch 왕복을 느끼지 않도록 idle 시점에 미리 백그라운드로
  // 받아둔다 — 브라우저가 한가할 때 받아오므로 초기 hydration과 경쟁하지 않는다(js-request-idle-
  // callback). openSearch에서도 동일하게 true로 세팅하는 건, idle 콜백이 아직 안 돌았는데
  // 방문자가 그새 Ctrl+K부터 누르는 경우를 위한 안전장치다.
  useEffect(() => {
    const scheduleIdleWork = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 1))
    scheduleIdleWork(() => setShouldLoadSearchIndex(true))
  }, [])

  const navRef = useRef<HTMLElement>(null)
  const { isBlurSuppressed } = useTheme()

  // article-body heading의 scroll-margin-top과 TocSidebar 스크롤스파이가 참조하는
  // --header-offset을 이 nav의 실제 렌더링 높이로 항상 최신화한다 — 고정값을 여기저기
  // 흩어 두면 헤더 레이아웃이 바뀔 때마다 매번 수동으로 맞춰야 하는 문제(11a66d9에서 실제로
  // 발생)가 재발하므로, 유일한 진실 소스인 이 엘리먼트 자신의 높이를 직접 측정해 공유한다.
  // useLayoutEffect로 페인트 전에 반영해 다른 컴포넌트가 낡은 값을 읽는 순간을 없앤다.
  useLayoutEffect(() => {
    const nav = navRef.current
    if (!nav) return

    const setHeaderOffset = () => {
      document.documentElement.style.setProperty("--header-offset", `${nav.getBoundingClientRect().height}px`)
    }

    setHeaderOffset()
    const observer = new ResizeObserver(setHeaderOffset)
    observer.observe(nav)
    return () => observer.disconnect()
  }, [])

  return (
    <nav
      ref={navRef}
      // pt-[env(safe-area-inset-top)]: iOS Safari 일반 탭에서는 웹뷰가 노치 아래로 들어가지
      // 않아 이 값이 0이지만(실기기 확인), 홈 화면에 추가해 standalone으로 실행하면 0이 아니게
      // 되므로 그 경우 콘텐츠가 노치와 겹치지 않도록 남겨둔다.
      //
      // backdrop-blur는 테마 전환 순간에만 잠깐 끈다 — iOS Safari가 상단 상태바 색을 페이지
      // 픽셀 샘플링으로 정하는데 backdrop-filter가 있으면 그 샘플링이 얼어붙기 때문이다.
      // 자세한 근거는 theme-context.tsx의 toggleTheme 주석 참고.
      //
      // 블러를 끈 그 짧은 구간에는 transition도 함께 꺼야 한다. 색 전환이 200ms에 걸쳐
      // 진행되면 블러가 없는 프레임(약 33ms)에서는 배경색이 아직 이전 테마에 가까운 상태라,
      // Safari가 결국 옛 색을 샘플링해 우회가 무력화된다(실측으로 확인). 이 구간에서만
      // transition-none을 줘 새 색이 즉시 확정되게 하면, 검증된 조건(= 새 색 + 블러 없음이
      // 한 프레임에 함께 그려짐)이 그대로 재현된다. 복원 시점엔 색이 이미 최종값이라 다시
      // 애니메이션되지 않는다. transition을 색 계열로 한정한 것도 같은 이유다 — transition-all
      // 이면 backdrop-filter까지 200ms에 걸쳐 사라져 "블러 없는 프레임"이 만들어지지 않는다.
      className={cn(
        "fixed top-0 z-50 w-full border-b border-outline-variant bg-background/70 pt-[env(safe-area-inset-top)]",
        isBlurSuppressed
          ? "transition-none"
          : "backdrop-blur-md transition-colors duration-200 ease-in-out"
      )}
    >
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-gutter py-4">
        <Link
          href="/"
          className="font-label-caps text-base font-semibold tracking-widest text-primary dark:text-primary-container"
        >
          Revi
        </Link>
        <div className="mx-auto hidden items-center gap-2 md:flex">
          {navLinks.map((link) => {
            const isActive = link.href === "/" && pathname === "/"
            return (
              <Link
                key={link.label}
                href={link.href}
                className={cn(
                  "rounded px-2 py-1 font-code-sm text-code-sm transition-colors",
                  isActive
                    ? "bg-surface-container-highest/50 text-primary dark:text-primary-fixed"
                    : "text-on-surface-variant hover:bg-surface-container-highest/50 hover:text-primary dark:hover:text-primary-fixed"
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </div>
        <div className="flex min-w-0 items-center gap-stack-md">
          <MobileNavMenu links={navLinks} />
          <SearchTrigger onOpen={openSearch} />
          {/* 서버가 없어 로그인 기능이 동작하지 않으므로 비활성화. 추후 서버 연동 시 주석 해제 */}
          {/* <button
            type="button"
            className="hidden shrink-0 rounded-lg bg-primary px-6 py-2 font-label-caps text-label-caps text-on-primary transition-all hover:brightness-110 active:scale-95 dark:bg-primary-container dark:text-on-primary-container sm:block"
          >
            LOGIN
          </button> */}
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden text-outline-variant select-none text-code-sm sm:inline">
              |
            </span>
            <ThemeToggle />
          </div>
        </div>
      </div>
      {hasOpenedSearch ? (
        <SearchModal
          open={searchOpen}
          onOpenChange={setSearchOpen}
          searchIndex={searchIndex}
        />
      ) : null}
    </nav>
  )
}
