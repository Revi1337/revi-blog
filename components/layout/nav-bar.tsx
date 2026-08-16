"use client"

import { useCallback, useLayoutEffect, useRef, useState } from "react"
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
import type { SearchIndexEntry } from "@/lib/data/types"

const SearchModal = dynamic(
  () => import("@/components/search/search-modal").then((m) => m.SearchModal),
  { ssr: false }
)

interface NavBarProps {
  searchIndex: SearchIndexEntry[]
}

export function NavBar({ searchIndex }: NavBarProps) {
  const pathname = usePathname()
  const [searchOpen, setSearchOpen] = useState(false)
  const [hasOpenedSearch, setHasOpenedSearch] = useState(false)
  const openSearch = useCallback(() => {
    setHasOpenedSearch(true)
    setSearchOpen(true)
  }, [])
  useSearchShortcut(openSearch)

  const navRef = useRef<HTMLElement>(null)
  const { isDark } = useTheme()

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
      // pt-[env(safe-area-inset-top)]: 이 padding이 nav 박스 안쪽이라 아래 배경 레이어가 그
      // 위까지 함께 칠해진다 — 노치 아래 safe area도 같은 글래스로 이어지고, 실제 로고/버튼
      // 같은 콘텐츠는 그 padding만큼 자연히 밀려나 노치와 겹치지 않는다. viewport-fit=cover가
      // app/layout.tsx에 없으면 이 env() 값이 항상 0이라 아무 효과가 없다.
      className="fixed top-0 z-50 w-full border-b border-outline-variant pt-[env(safe-area-inset-top)] transition-all duration-200 ease-in-out"
    >
      {/* 배경(반투명)+블러 전용 레이어 — nav 본체에 직접 걸지 않고 분리한 이유는 오직 하나,
       * 테마가 바뀔 때 key로 이 노드를 통째로 remount하기 위해서다.
       *
       * iOS Safari는 backdrop-filter가 걸린 fixed 요소를 별도 합성 레이어로 올리는데, 노치
       * 뒤 safe area에 해당하는 부분은 "색만 바뀌는" 변경(다크모드 토글처럼 지오메트리 변화가
       * 없는 경우)에서 다시 합성하지 않고 이전 프레임을 그대로 재사용한다 — 그래서 헤더 본체는
       * 새 테마로 갱신되는데 노치 영역만 이전 테마 색으로 남았다. 기기를 회전시키면(=전체
       * 재레이아웃이 강제되면) 그제서야 정상 색으로 돌아오는 것으로 이 원인을 확정했다.
       *
       * style/transform을 흔들어 리페인트를 "부탁"하는 방식은 통하지 않았다(같은 프레임 안에서
       * 값을 넣었다 빼면 브라우저는 중간 상태를 실제로 그린 적이 없어 사실상 no-op이다).
       * 반면 key를 바꾸면 React가 이 노드를 언마운트하고 새 노드를 마운트하므로, 낡은 합성
       * 레이어를 물려받을 대상 자체가 사라진다 — 재합성을 유도하는 게 아니라 구조적으로 강제한다.
       *
       * absolute inset-0은 위치 기준이 nav의 padding box라 pt-[env(...)]로 확보한 safe area
       * 영역까지 그대로 덮는다. -z-10은 nav(fixed+z-50)가 만든 스택 컨텍스트 안에서만 유효해
       * 바깥에 영향을 주지 않으면서 로고/버튼 등 in-flow 콘텐츠 아래에 깔린다. */}
      <div
        key={isDark ? "dark" : "light"}
        aria-hidden
        className="absolute inset-0 -z-10 bg-background/70 backdrop-blur-md"
      />
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
