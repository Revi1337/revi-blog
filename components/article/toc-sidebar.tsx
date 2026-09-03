"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { ListTree, X } from "lucide-react"
import { AnimatePresence, m } from "motion/react"

import type { TocItem } from "@/lib/data/types"
import { cn } from "@/lib/utils"
import { isPlainLeftClick, scrollToHeadingInstant } from "@/components/article/heading-scroll"

// nav-bar.tsx가 실측한 헤더 높이로 런타임에 덮어쓰는 CSS 변수를 읽는다 — getComputedStyle
// 파싱이 실패하는 극히 예외적인 경우(변수 자체가 없는 등)에 대한 최후 폴백일 뿐, 정상 동작에서는
// 항상 --header-offset의 실측값을 그대로 따른다.
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
  const [open, setOpen] = React.useState(false)
  const [hiddenBelowCount, setHiddenBelowCount] = React.useState(0)
  const itemRefs = React.useRef(new Map<string, HTMLAnchorElement>())
  const navRef = React.useRef<HTMLElement | null>(null)

  // 모바일 드로어가 열려있는 동안만 Esc로 닫는다 — mobile-nav-menu.tsx와 동일한 컨벤션.
  React.useEffect(() => {
    if (variant !== "mobile" || !open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [variant, open])

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
        // 다이어그램이 아직 안 그려져 문서가 저장된 위치보다 짧으면, scrollTo가 그 위치까지
        // 못 가고 현재 문서 끝(Footer가 보이는 지점)으로 clamp된다 — 그 뒤 ResizeObserver
        // 보정으로 원래 자리로 다시 튀어 오르면서 "Footer가 잠깐 올라왔다 훅 내려가는" 깜빡임이
        // 생겼다(사용자 재현 — 마지막 헤딩 근처에서 새로고침). 아직 도달 불가능한 위치라면 아예
        // 스크롤하지 않고 ResizeObserver가 문서가 다 자란 뒤 한 번에 정확한 위치로 보내게 둔다.
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight
        if (savedScroll > maxScroll) return
        // 새로고침 복원은 사용자가 의도한 이동이 아니라 "원래 있던 자리로 되돌아가는 것"이라
        // 애니메이션 없이 즉시 이동한다. behavior: "auto"는 CSSOM 스펙상 html의
        // scroll-behavior: smooth를 그대로 따르므로(override가 아님) 반드시 "instant"를 써야 한다.
        window.scrollTo({ top: savedScroll, behavior: "instant" })
        return
      }
      const hash = window.location.hash
      if (!hash) return
      const headingId = decodeURIComponent(hash.slice(1))
      const target = document.getElementById(headingId)
      target?.scrollIntoView()
    }

    restore()
    // 이미지/폰트 로딩으로 뒤늦게 레이아웃이 밀리는 경우를 대비해 완전 로드 후 한 번 더 보정한다.
    window.addEventListener("load", restore)

    // Mermaid/PlantUML/Markmap 다이어그램은 window.onload로도 못 잡는다 — 동적 import·파싱(+
    // PlantUML은 네트워크 요청, 게다가 macOS 콘텐츠 영역이 펼쳐지는 애니메이션까지 350ms) 이
    // 전부 끝나야 최종 높이가 확정되는데, 이 시점은 onload보다 한참 뒤일 수 있다. 그래서 새로고침
    // 복원 위치가 다이어그램이 있는 아티클에서 종종 어긋났다(사용자 피드백). 문서 높이가 바뀔
    // 때마다 계속 재보정하다가, 사용자가 실제로 입력하면 멈춘다.
    //
    // "사용자가 직접 스크롤했는지"를 scroll 이벤트로 판단하려 했다가(우리 scrollTo도 scroll
    // 이벤트를 만들어서 isCorrecting 플래그로 구분) 실측에서 수렴하지 않는 걸 확인했다 —
    // 다이어그램이 연속으로 리사이즈되는 동안 브라우저 자체 scroll anchoring(레이아웃이 위에서
    // 바뀌면 보던 콘텐츠가 시야에서 안 벗어나게 브라우저가 알아서 scrollY를 보정하는 기능)까지
    // 겹치면서 scroll 이벤트가 우리 예상보다 훨씬 자주, 여러 원인으로 발생해 플래그 기반 구분이
    // 무너졌다(재현: scrollY가 저장값에서 계속 멀어지며 수렴 안 함). 그래서 scroll 이벤트 자체가
    // 아니라 "이 이벤트를 우리가 절대 스스로 발생시키지 않는" 실제 입력 장치 이벤트(휠/터치/
    // 키보드)로 기준을 바꿨다 — 이러면 우리 scrollTo나 scroll anchoring이 몇 번을 스크롤시키든
    // 재보정을 막지 않고, 사용자가 진짜 손을 대는 순간에만 멈춘다.
    let resizeDebounceTimer: number | undefined
    let resizeGiveUpTimer: number | undefined
    let resizeObserver: ResizeObserver | undefined
    let stopCorrecting = () => {}
    if (savedScroll !== null) {
      // 다이어그램이 렌더링되며 문서가 자라는 동안, 브라우저의 기본 scroll anchoring(화면
      // 위쪽 콘텐츠 크기가 바뀌면 보던 지점이 시야에서 안 벗어나게 scrollY를 자동으로 슬쩍
      // 보정하는 기능)이 우리 ResizeObserver 보정과 동시에 같은 scrollY를 건드려 "저장 위치에서
      // 점점 멀어지다가(브라우저) 한 번에 되돌아오는(우리)" 이중 움직임을 만든다(실측 확인). 이
      // 구간에서만 anchoring을 꺼서 최종 위치로의 점프가 한 번만 일어나게 한다 — behavior:
      // "instant" 자체(애니메이션 없는 즉시 이동 선택)와는 무관하고, 이 보정 구간 밖(사용자가
      // 이미 읽고 있는 동안 뒤늦게 로드되는 이미지 등)의 anchoring은 그대로 유지된다.
      document.documentElement.style.overflowAnchor = "none"

      resizeObserver = new ResizeObserver(() => {
        window.clearTimeout(resizeDebounceTimer)
        // 리사이즈 관찰 직후 바로 보정하지 않고 짧게 기다린다 — 애니메이션(예: 350ms 펼쳐짐)이
        // 진행되는 동안 매 프레임마다 scrollTo를 부르지 않고, 그 애니메이션이 멈춘 뒤 한 번만
        // 보정한다.
        resizeDebounceTimer = window.setTimeout(() => {
          // restore()와 동일한 이유 — 아직 문서가 savedScroll까지 다 안 자랐으면 이번엔
          // 건드리지 않고 다음 리사이즈(다른 다이어그램이 마저 펼쳐질 때) 때 다시 판단한다.
          const maxScroll = document.documentElement.scrollHeight - window.innerHeight
          if (savedScroll > maxScroll) return
          window.scrollTo({ top: savedScroll, behavior: "instant" })
        }, 80)
      })
      resizeObserver.observe(document.documentElement)

      stopCorrecting = () => {
        document.documentElement.style.overflowAnchor = ""
        resizeObserver?.disconnect()
        window.clearTimeout(resizeDebounceTimer)
        window.clearTimeout(resizeGiveUpTimer)
      }
      window.addEventListener("wheel", stopCorrecting, { passive: true, once: true })
      window.addEventListener("touchstart", stopCorrecting, { passive: true, once: true })
      window.addEventListener("keydown", stopCorrecting, { once: true })

      // 안전장치 — 이 시점 이후로는 다이어그램이 남아있어도 재보정을 멈춘다(무한정 감시하지 않음).
      resizeGiveUpTimer = window.setTimeout(stopCorrecting, 6000)
    }

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
      // stopCorrecting이 아직 한 번도 안 불린 채(사용자 입력·6초 타임아웃 이전에) 컴포넌트가
      // 언마운트될 수 있다(예: SPA 전환으로 다른 글로 이동) — document.documentElement는 클라이언트
      // 사이드 네비게이션 동안 재사용되므로, 여기서 명시적으로 되돌리지 않으면 "none"이 다음
      // 페이지까지 새어나간다.
      document.documentElement.style.overflowAnchor = ""
      window.removeEventListener("load", restore)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("pagehide", persistScroll)
      document.removeEventListener("visibilitychange", persistScroll)
      window.removeEventListener("wheel", stopCorrecting)
      window.removeEventListener("touchstart", stopCorrecting)
      window.removeEventListener("keydown", stopCorrecting)
      resizeObserver?.disconnect()
      window.clearTimeout(resizeDebounceTimer)
      window.clearTimeout(resizeGiveUpTimer)
    }
  }, [variant])

  React.useEffect(() => {
    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null)

    if (headings.length === 0) return

    let cancelled = false
    let ticking = false

    const updateActiveHeading = () => {
      // 매 호출마다 새로 읽는다 — 리사이즈 등으로 nav-bar.tsx가 --header-offset을 다시 쓰면
      // (예: 반응형으로 헤더 높이 자체가 바뀌는 경우) effect 시작 시점에 캐싱해둔 값이 낡아버리므로,
      // 스크롤/리사이즈 시점의 최신 실측값을 항상 사용해야 한다.
      const headerOffset = readHeaderOffset()

      // 접힌 콜아웃(<details> 미오픈) 안의 헤딩을 제외한다. 애초엔 offsetParent가 null이 될
      // 것으로 가정했으나, 실측(playwright)으로 이 가정이 틀렸음을 발견했다 — 닫힌 <details>의
      // 자식은 화면에 그려지지 않는데도 offsetParent가 여전히 조상 엘리먼트를 가리킨다(현재
      // Chromium 기준). closest("details:not([open])")로 조상 체인에 닫힌 details가 있는지
      // 직접 확인해야 한다.
      const visibleHeadings = headings.filter(
        (heading) => heading.offsetParent !== null && heading.closest("details:not([open])") === null
      )
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
    // window의 resize 이벤트는 "브라우저 창 크기"가 바뀔 때만 발생하고, "문서 내용이 자라서
    // 문서 자체가 길어지는" 경우는 잡지 못한다 — Mermaid/PlantUML/Markmap이 클라이언트에서
    // 순차적으로 렌더링되며 문서 높이가 계속 바뀌는 동안(toc-sidebar.tsx의 스크롤 복원용
    // ResizeObserver와 별개로, 실사용 중 발견: overflow-anchor:none 적용 이후 스크롤 위치
    // 자체는 목표에 일찍 도달해 scroll 이벤트가 끊기는데, 그 뒤로도 문서는 한참 더 자라서
    // 헤딩들의 실제 위치가 계속 바뀐다 — activeId가 그 중간 상태에 멈춰버렸다), 실제 헤딩
    // 위치가 최종적으로 안정될 때까지 계속 재계산해야 한다. document.documentElement 자체의
    // 크기 변화를 관찰해 scroll 이벤트가 없어도 재계산을 트리거한다 — 고정 딜레이 없이 브라우저가
    // 실제 레이아웃 변화를 감지했을 때만 반응하므로 다이어그램 개수/렌더링 시간과 무관하게 항상
    // 정확하다. 이미 있는 rAF 스로틀(onScroll)을 그대로 재사용해 과도한 재계산을 막는다.
    const resizeObserver = new ResizeObserver(onScroll)
    resizeObserver.observe(document.documentElement)
    return () => {
      cancelled = true
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      resizeObserver.disconnect()
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

  // .toc-nav는 스크롤바 UI를 숨겨놨을 뿐 실제로는 overflow-y-auto라(toc.css), 헤딩이 많은 글에서
  // 박스 아래에 항목이 더 있다는 걸 알아챌 시각적 단서가 없다 — 컨테이너 뷰포트 아래로 잘린 항목
  // 개수를 세어 "+N more"로 보여준다. 휠 스크롤(사용자가 직접 박스 안을 스크롤)과 activeId 변경에
  // 따른 자동 가운데 정렬(위 effect의 container.scrollTo) 둘 다 container에서 "scroll" 이벤트를
  // 만들어내므로, 이 하나의 리스너로 두 경우 모두 커버된다.
  // mobile variant는 드로어가 열릴 때마다 nav 자체가 새로 마운트되므로(open ? <...>{nav}</...> :
  // null), items만 의존성으로 두면 최초 마운트 시점(드로어가 닫혀 navRef가 null)에만 실행되고
  // 이후 재오픈 시 리스너가 다시 붙지 않는다 — open도 의존성에 넣어 열릴 때마다 재부착한다.
  React.useEffect(() => {
    const container = navRef.current
    if (!container) return

    let ticking = false

    const updateHiddenBelowCount = () => {
      const containerRect = container.getBoundingClientRect()
      let count = 0
      for (const item of items) {
        const el = itemRefs.current.get(item.id)
        if (!el) continue
        if (el.getBoundingClientRect().bottom > containerRect.bottom + SCROLL_SPY_EPSILON) count += 1
      }
      setHiddenBelowCount(count)
    }

    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        updateHiddenBelowCount()
        ticking = false
      })
    }

    updateHiddenBelowCount()
    container.addEventListener("scroll", onScroll, { passive: true })
    // 컨테이너 자체는 max-h-[500px]로 고정 높이지만, 항목 라벨이 줄바꿈되는 등 콘텐츠 쪽 높이가
    // 바뀌는 경우(예: 반응형 폭 변화)까지 잡기 위해 스크롤 이벤트만이 아니라 크기 변화도 관찰한다.
    const resizeObserver = new ResizeObserver(onScroll)
    resizeObserver.observe(container)

    return () => {
      container.removeEventListener("scroll", onScroll)
      resizeObserver.disconnect()
    }
  }, [items, open])

  if (items.length === 0) return null

  // key를 hiddenBelowCount 값이 아니라 고정 문자열로 둔다 — count가 13→12처럼 숫자만 바뀔 때는
  // AnimatePresence가 같은 자식으로 보고 텍스트만 조용히 갱신하고, 0 ↔ 0 초과로 넘어가 이 자식 자체가
  // 나타나거나 사라질 때만 enter/exit 모션이 재생된다(사용자 요청 — "더보기" 등장/퇴장에만 모션).
  const moreLabel = (
    <AnimatePresence>
      {hiddenBelowCount > 0 && (
        <m.span
          key="more-label"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          className="ml-auto font-code-sm text-[11px] text-on-surface-variant/60"
          aria-hidden="true"
        >
          +{hiddenBelowCount} more
        </m.span>
      )}
    </AnimatePresence>
  )

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
              setOpen(false)
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
      <div className="fixed top-[calc(var(--header-offset)+1rem)] right-gutter z-40 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-label={open ? "Close table of contents" : "Open table of contents"}
          aria-expanded={open}
          className="flex size-10 items-center justify-center rounded-full border border-outline-variant/20 bg-surface-container-lowest text-primary shadow-lg transition-colors hover:bg-surface-container-highest dark:text-primary-container"
        >
          {open ? <X className="size-4" aria-hidden="true" /> : <ListTree className="size-4" aria-hidden="true" />}
        </button>

        {open
          ? createPortal(
              <div aria-hidden="true" onClick={() => setOpen(false)} className="fixed inset-0 z-30" />,
              document.body
            )
          : null}

        {open ? (
          <div className="absolute top-[calc(100%+0.5rem)] right-0 w-72 rounded border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-xl">
            <div className="mb-4 flex items-center gap-2 text-primary dark:text-primary-container">
              <ListTree className="size-4" />
              <h4 className="font-label-caps text-xs tracking-widest">Table Of Contents</h4>
              {moreLabel}
            </div>
            {nav}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="sticky top-40 hidden space-y-10 lg:block">
      <div className="rounded border border-outline-variant/20 bg-surface-container-lowest p-5">
        <div className="mb-4 flex items-center gap-2 text-primary dark:text-primary-container">
          <ListTree className="size-4" />
          <h4 className="font-label-caps text-xs tracking-widest">Table Of Contents</h4>
          {moreLabel}
        </div>
        {nav}
      </div>
    </div>
  )
}
