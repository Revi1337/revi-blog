"use client"

import * as React from "react"
import { ListTree } from "lucide-react"
import { AnimatePresence, m } from "motion/react"

import type { TocItem } from "@/lib/data/types"
import { cn } from "@/lib/utils"
import { isPlainLeftClick, scrollToHeadingInstant } from "@/components/article/heading-scroll"

// app/globals.css의 --header-offset과 반드시 같은 값을 가리켜야 한다 — 하나만 바뀌면
// 앵커 스크롤 정지 위치와 스크롤스파이 활성 판정 기준이 어긋난다.
const DEFAULT_HEADER_OFFSET = 96

// 앵커 스크롤이 scroll-margin-top 목표 지점에 서브픽셀 단위로 근소하게 못 미치고
// 멈추는 경우(예: top이 96 대신 96.08)를 흡수하기 위한 오차 허용치.
const SCROLL_SPY_EPSILON = 1

function readHeaderOffset() {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--header-offset")
  const parsed = Number.parseFloat(raw)
  return Number.isFinite(parsed) ? parsed : DEFAULT_HEADER_OFFSET
}

function getScrollStorageKey() {
  return `toc:scroll:${window.location.pathname}`
}

function readSavedScroll(key: string) {
  try {
    const raw = sessionStorage.getItem(key)
    if (raw === null) return null
    const parsed = Number(raw)
    return Number.isFinite(parsed) ? parsed : null
  } catch {
    // 프라이빗 모드 등에서 storage 접근이 막혀 있으면 저장된 위치가 없는 것으로 취급한다.
    return null
  }
}

function writeSavedScroll(key: string, value: number) {
  try {
    sessionStorage.setItem(key, String(value))
  } catch {
    // 위와 동일한 이유로 조용히 무시한다.
  }
}

// performance.getEntriesByType("navigation")는 탭이 처음 문서를 로드한 방식(reload/back_forward/
// navigate) 딱 한 번만 기록되고, 이후의 클라이언트 사이드 전환(Link 클릭, router.push, 검색 모달
// 이동 등)으로는 절대 갱신되지 않는다. 이 값을 매 mount마다 다시 읽으면, 세션 중 새로고침이나
// 뒤로가기를 단 한 번이라도 했을 때 그 사실이 그 이후의 모든 방문에도 잘못 적용돼 실제로는 새로
// 들어간 글인데도 이전 스크롤 위치를 복원해버린다 — reload/back_forward 타입은 정의상 문서 전체가
// 다시 로드될 때만 기록되므로(이 플래그가 리셋되는 시점과 정확히 일치), 이 세션에서 딱 한 번만
// 신뢰하고 그 뒤로는 항상 false를 반환해 "이 mount가 진짜 reload/back_forward로 인한 것인가"라는
// 질문에만 답하도록 스코프를 좁힌다.
let historyNavConsumed = false

function isHistoryNavigation() {
  if (historyNavConsumed) return false
  historyNavConsumed = true
  try {
    const [entry] = performance.getEntriesByType("navigation")
    return entry instanceof PerformanceNavigationTiming && (entry.type === "reload" || entry.type === "back_forward")
  } catch {
    return false
  }
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
  const navRef = React.useRef<HTMLElement | null>(null)

  // 새로고침·뒤로가기 시 URL hash와 무관하게 "마지막으로 보던 스크롤 위치"로 복원한다 —
  // 브라우저 기본 스크롤 복원(scrollRestoration: 'auto')이 정확히 이 동작을 제공하지만,
  // hash 앵커 스크롤과 동시에 경쟁하며 비결정적으로 최종 위치를 정하는 문제가 있어 직접 구현한다.
  // reload/back-forward에서만 저장된 위치로 복원하고, 새 진입(링크 클릭 등)에서는 URL hash를 따른다.
  // 두 variant가 한 페이지에 동시에 마운트되므로 한쪽에서만 처리하면 충분하다.
  React.useEffect(() => {
    if (variant !== "desktop") return
    window.history.scrollRestoration = "manual"

    const scrollKey = getScrollStorageKey()
    const savedScroll = isHistoryNavigation() ? readSavedScroll(scrollKey) : null

    const restore = () => {
      if (savedScroll !== null) {
        // 새로고침 복원은 사용자가 의도한 이동이 아니라 "원래 있던 자리로 되돌아가는 것"이라
        // 애니메이션 없이 즉시 이동한다. behavior: "auto"는 CSSOM 스펙상 html의
        // scroll-behavior: smooth를 그대로 따르므로(override가 아님) 반드시 "instant"를 써야 한다.
        window.scrollTo({ top: savedScroll, behavior: "instant" })
        return
      }
      const hash = window.location.hash
      if (!hash) return
      const target = document.getElementById(decodeURIComponent(hash.slice(1)))
      target?.scrollIntoView()
    }

    restore()
    // 이미지/폰트 로딩으로 뒤늦게 레이아웃이 밀리는 경우를 대비해 완전 로드 후 한 번 더 보정한다.
    window.addEventListener("load", restore)

    let ticking = false
    const persistScroll = () => writeSavedScroll(scrollKey, window.scrollY)
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        persistScroll()
        ticking = false
      })
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    // 스크롤 이벤트 없이 탭이 닫히거나 백그라운드로 전환되는 순간을 놓치지 않기 위한 안전망.
    window.addEventListener("pagehide", persistScroll)
    document.addEventListener("visibilitychange", persistScroll)

    return () => {
      window.removeEventListener("load", restore)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("pagehide", persistScroll)
      document.removeEventListener("visibilitychange", persistScroll)
    }
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
        if (heading.getBoundingClientRect().top <= headerOffset + SCROLL_SPY_EPSILON) {
          currentId = heading.id
        } else {
          break
        }
      }

      // 마지막 헤딩 뒤 여백이 headerOffset보다 부족하면 끝까지 스크롤해도 위 조건이
      // 영원히 성립하지 않는다 — 문서 바닥에 도달했다면 그 조건과 무관하게 마지막으로
      // 보이는 헤딩을 active로 간주한다.
      const reachedBottom =
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1
      if (reachedBottom) {
        currentId = visibleHeadings[visibleHeadings.length - 1].id
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

  // 활성 항목이 항상 TOC 스크롤 박스(.toc-nav) 가운데 오도록 맞춘다 — 위/아래에 남은
  // 헤딩이 부족한 경계(맨 처음·맨 끝)에서는 scrollTop이 [0, scrollHeight - clientHeight]로
  // 자동 clamp되어 억지로 가운데 맞추지 않는다.
  // scrollIntoView는 절대 쓰지 않는다: block 값과 무관하게 .toc-nav뿐 아니라 html까지 포함한
  // 모든 스크롤 가능 조상 체인을 함께 움직이려 하는데, html에는 scroll-behavior: smooth가 걸려
  // 있어(globals.css) 스크롤 스파이가 갱신될 때마다 사용자가 하던 본문 스크롤과 충돌해
  // 버벅거림이 발생했다. 대신 .toc-nav의 scrollTop만 직접 계산해서 옮긴다.
  React.useEffect(() => {
    if (!activeId) return
    const container = navRef.current
    const item = itemRefs.current.get(activeId)
    if (!container || !item) return

    const containerRect = container.getBoundingClientRect()
    const itemRect = item.getBoundingClientRect()
    const delta =
      itemRect.top - containerRect.top + itemRect.height / 2 - container.clientHeight / 2
    container.scrollTo({ top: container.scrollTop + delta, behavior: "auto" })
  }, [activeId])

  if (items.length === 0) return null

  const nav = (
    <nav
      ref={navRef}
      className="toc-nav max-h-[500px] space-y-0.5 overflow-y-auto pr-2"
      aria-label="Table of contents"
    >
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
            onClick={(event) => {
              if (!isPlainLeftClick(event)) return
              event.preventDefault()
              setActiveId(item.id)
              scrollToHeadingInstant(item.id)
            }}
            aria-current={isActive ? "location" : undefined}
            className={cn(
              "relative flex items-center gap-2 rounded px-2.5 py-1 font-code-sm text-xs text-on-surface-variant transition-colors duration-200 hover:text-primary dark:hover:text-primary-container",
              item.depth === 3 && "ml-4",
              item.depth === 4 && "ml-8",
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
              {item.order}
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
