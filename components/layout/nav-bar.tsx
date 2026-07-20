"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { navLinks } from "@/lib/data/nav"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme/theme-toggle"

export function NavBar() {
  const pathname = usePathname()

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
              <a
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
              </a>
            )
          })}
        </div>
        <div className="flex items-center gap-stack-md">
          <button
            type="button"
            className="rounded-lg bg-primary px-6 py-2 font-label-caps text-label-caps text-on-primary transition-all hover:brightness-110 active:scale-95 dark:bg-primary-container dark:text-on-primary-container"
          >
            LOGIN
          </button>
          <div className="flex items-center gap-2">
            <span className="text-outline-variant select-none text-code-sm">
              |
            </span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  )
}
