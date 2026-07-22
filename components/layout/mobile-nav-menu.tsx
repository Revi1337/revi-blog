"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"

import { cn } from "@/lib/utils"
import type { NavLink } from "@/lib/data/types"

interface MobileNavMenuProps {
  links: NavLink[]
}

/**
 * md 미만에서 숨겨지는 데스크톱 nav 링크(Home/Feeds/Bookmark)를 대체하는 모바일 전용 드롭다운.
 * cmdk 기반 SearchModal과 달리 커맨드 팔레트가 아니라 단순 메뉴라 포커스 트랩은 없다. 바깥 클릭은
 * 투명 backdrop이 가로채 닫기만 하고 아래 콘텐츠로 전파되지 않게 막는다 — document pointerdown
 * 리스너만으로 닫으면 클릭 자체는 그대로 통과해 배경의 카드/링크가 같이 클릭돼버린다.
 * backdrop은 body로 포탈링한다 — nav가 backdrop-blur-md(backdrop-filter)를 쓰는데, filter류
 * 속성이 있는 조상은 후손 fixed 요소의 containing block이 돼버려서 nav 안에 두면 backdrop이
 * 뷰포트 전체가 아니라 nav 높이(약 64px)로 잘려 클릭을 가로채지 못한다.
 */
export function MobileNavMenu({ links }: MobileNavMenuProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open])

  return (
    <div className="relative md:hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="relative z-50 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-highest/50 hover:text-primary dark:hover:text-primary-fixed"
      >
        {open ? (
          <X className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Menu className="h-5 w-5" aria-hidden="true" />
        )}
      </button>

      {open
        ? createPortal(
            <div
              aria-hidden="true"
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40"
            />,
            document.body
          )
        : null}

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-40 rounded-lg border border-outline-variant bg-surface-container-lowest py-1 shadow-lg">
          {links.map((link) => {
            const isActive = link.href === "/" && pathname === "/"
            return (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "block px-4 py-2 font-code-sm text-code-sm transition-colors",
                  isActive
                    ? "text-primary dark:text-primary-fixed"
                    : "text-on-surface-variant hover:bg-surface-container-highest/50 hover:text-primary dark:hover:text-primary-fixed"
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
