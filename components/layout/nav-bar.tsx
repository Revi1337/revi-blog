"use client"

import { useCallback, useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { navLinks } from "@/lib/data/nav"
import { cn } from "@/lib/utils"
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

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-outline-variant bg-background/70 backdrop-blur-md transition-all duration-200 ease-in-out">
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
