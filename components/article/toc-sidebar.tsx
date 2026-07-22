"use client"

import * as React from "react"
import { ListTree } from "lucide-react"
import { AnimatePresence, m } from "motion/react"

import type { TocItem } from "@/lib/data/types"
import { cn } from "@/lib/utils"

// app/globals.css의 --header-offset과 반드시 같은 값을 가리켜야 한다 — 하나만 바뀌면
// 앵커 스크롤 정지 위치와 스크롤스파이 활성 판정 기준이 어긋난다.
const DEFAULT_HEADER_OFFSET = 96

function readHeaderOffset() {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--header-offset")
  const parsed = Number.parseFloat(raw)
  return Number.isFinite(parsed) ? parsed : DEFAULT_HEADER_OFFSET
}

export function TocSidebar({
  items,
  variant = "desktop",
}: {
  items: TocItem[]
  variant?: "desktop" | "mobile"
}) {
  const [activeId, setActiveId] = React.useState<string | undefined>(undefined)
  const itemRefs = React.useRef(new Map<string, HTMLAnchorElement>())

  // 새로고침 시 TOC 활성 헤딩이 URL hash와 다른 곳으로 튀는 문제 대응 —
  // 브라우저의 히스토리 스크롤 복원(scrollRestoration: 'auto')이 hash 앵커 스크롤과
  // 경쟁하며 비결정적으로 최종 위치를 정했다. 복원을 꺼서 hash 스크롤만 남긴다.
  // 두 variant가 한 페이지에 동시에 마운트되므로 한쪽에서만 처리하면 충분하다.
  React.useEffect(() => {
    if (variant !== "desktop") return
    window.history.scrollRestoration = "manual"

    const hash = window.location.hash
    if (!hash) return

    const scrollToHash = () => {
      const target = document.getElementById(decodeURIComponent(hash.slice(1)))
      target?.scrollIntoView()
    }
    scrollToHash()
    // 이미지/폰트 로딩으로 뒤늦게 레이아웃이 밀리는 경우를 대비해 완전 로드 후 한 번 더 보정한다.
    window.addEventListener("load", scrollToHash)
    return () => window.removeEventListener("load", scrollToHash)
  }, [variant])

  React.useEffect(() => {
    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null)

    if (headings.length === 0) return

    const headerOffset = readHeaderOffset()
    let cancelled = false
    let ticking = false

    const updateActiveHeading = () => {
      // 접힌 콜아웃(<details> 미오픈) 안의 헤딩은 offsetParent가 null이라 제외된다.
      const visibleHeadings = headings.filter((heading) => heading.offsetParent !== null)
      if (visibleHeadings.length === 0) return

      let currentId: string | undefined
      for (const heading of visibleHeadings) {
        if (heading.getBoundingClientRect().top <= headerOffset) {
          currentId = heading.id
        } else {
          break
        }
      }
      if (!cancelled) setActiveId(currentId)
    }

    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        updateActiveHeading()
        ticking = false
      })
    }

    updateActiveHeading()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      cancelled = true
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [items])

  // 활성 헤딩이 TOC 자체 스크롤 박스(.toc-nav) 밖으로 밀려나 있으면 안 보이므로,
  // 메인 페이지 스크롤에는 영향 없이(block: "nearest") 그 항목만 보이게 맞춘다.
  React.useEffect(() => {
    if (!activeId) return
    itemRefs.current.get(activeId)?.scrollIntoView({ block: "nearest" })
  }, [activeId])

  if (items.length === 0) return null

  const nav = (
    <nav className="toc-nav max-h-[500px] space-y-1 overflow-y-auto pr-2" aria-label="Table of contents">
      {items.map((item) => {
        const isActive = item.id === activeId
        return (
          <a
            key={item.id}
            ref={(el) => {
              if (el) itemRefs.current.set(item.id, el)
              else itemRefs.current.delete(item.id)
            }}
            href={`#${item.id}`}
            aria-current={isActive ? "location" : undefined}
            className={cn(
              "relative flex items-center gap-2 rounded px-2.5 py-1.5 font-code-sm text-xs text-on-surface-variant transition-colors duration-200 hover:text-primary dark:hover:text-primary-container",
              item.depth === 3 && "ml-4",
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
  )

  if (variant === "mobile") {
    return (
      <details className="group rounded border border-outline-variant/20 bg-surface-container-lowest p-5 lg:hidden">
        <summary className="toc-summary mb-4 flex cursor-pointer list-none items-center gap-2 text-primary dark:text-primary-container">
          <ListTree className="size-4" />
          <h4 className="font-label-caps text-xs tracking-widest">Table Of Contents</h4>
        </summary>
        {nav}
      </details>
    )
  }

  return (
    <div className="sticky top-40 hidden space-y-10 lg:block">
      <div className="rounded border border-outline-variant/20 bg-surface-container-lowest p-5">
        <div className="mb-4 flex items-center gap-2 text-primary dark:text-primary-container">
          <ListTree className="size-4" />
          <h4 className="font-label-caps text-xs tracking-widest">Table Of Contents</h4>
        </div>
        {nav}
      </div>
    </div>
  )
}
