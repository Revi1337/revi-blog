"use client"

import * as React from "react"
import { ListTree } from "lucide-react"
import { AnimatePresence, m } from "motion/react"

import type { TocItem } from "@/lib/data/types"
import { cn } from "@/lib/utils"

export function TocSidebar({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = React.useState<string | undefined>(items[0]?.id)

  React.useEffect(() => {
    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null)

    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting)
        if (visible) setActiveId(visible.target.id)
      },
      { rootMargin: "-96px 0px -70% 0px" }
    )

    headings.forEach((heading) => observer.observe(heading))
    return () => observer.disconnect()
  }, [items])

  if (items.length === 0) return null

  return (
    <div className="sticky top-40 space-y-10">
      <div className="rounded border border-outline-variant/20 bg-surface-container-lowest p-5">
        <div className="mb-4 flex items-center gap-2 text-primary dark:text-primary-container">
          <ListTree className="size-4" />
          <h4 className="font-label-caps text-xs tracking-widest">Table Of Contents</h4>
        </div>
        <nav className="max-h-[500px] space-y-1 overflow-y-auto pr-2">
          {items.map((item) => {
            const isActive = item.id === activeId
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={cn(
                  "relative flex items-center gap-2 rounded px-2.5 py-1.5 font-code-sm text-xs text-on-surface-variant transition-colors duration-200 hover:text-primary dark:hover:text-primary-container",
                  isActive && "bg-primary/10 dark:bg-primary-container/10"
                )}
              >
                <AnimatePresence>
                  {isActive && (
                    <m.span
                      initial={{ opacity: 0, scaleY: 0.3 }}
                      animate={{ opacity: 1, scaleY: 1 }}
                      exit={{ opacity: 0, scaleY: 0.3 }}
                      transition={{ duration: 0.2 }}
                      className="absolute left-0 top-1/2 h-3/5 w-0.5 -translate-y-1/2 rounded-full bg-primary dark:bg-primary-container"
                    />
                  )}
                </AnimatePresence>
                <span
                  className={cn(
                    "relative opacity-30",
                    isActive && "text-primary opacity-100 dark:text-primary-container"
                  )}
                >
                  {String(item.order).padStart(2, "0")}
                </span>
                <span
                  className={cn(
                    "relative",
                    isActive && "text-primary dark:text-primary-container"
                  )}
                >
                  {item.label}
                </span>
              </a>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
