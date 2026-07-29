"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

const SCROLL_STORAGE_PREFIX = "route:scroll:"

function currentScrollKey() {
  return `${SCROLL_STORAGE_PREFIX}${window.location.pathname}${window.location.search}`
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

/** Next.js는 새 페이지의 루트 DOM이 "이미 뷰포트 안에 있다"고 판단되면(layout-router.js의
 * topOfElementInViewport) top으로 스크롤을 리셋하지 않는다. 이 프로젝트는 고정 NavBar + main의
 * pt-24로 페이지 콘텐츠 시작 지점이 항상 문서 y=96 부근에 고정돼 있어서, 이전 페이지의 scrollY가
 * 96 이하였다면 이 조건에 걸려 새 페이지가 이전 스크롤 위치를 그대로 물려받는다 — entry stream에서
 * 홈을 살짝 스크롤한 채로 게시글을 클릭하면 title이 NavBar에 가려 보이는 원인이 여기에 있다.
 * 링크 클릭 등 "새로 들어가는" 내비게이션에서는 pathname이 바뀔 때마다 항상 top으로 리셋해 이 문제를
 * 막는다.
 *
 * 뒤/앞으로가기(popstate)는 예외다 — "떠나기 전 있던 자리로 돌아온다"가 일반적인 기대이지만, 브라우저
 * 네이티브 scrollRestoration(auto)은 App Router의 popstate 소프트 전환(진짜 문서 리로드가 아닌
 * client-side 전환)에서 비결정적으로 어긋난 위치로 복원되는 걸 실측으로 확인했다(TocSidebar가 게시글
 * 페이지에서 이미 같은 이유로 native 복원을 포기하고 직접 구현한 것과 동일한 문제). 그래서 이 컴포넌트가
 * scrollY를 URL(경로+쿼리)별로 sessionStorage에 직접 저장해두고, popstate로 그 URL에 돌아오면 저장된
 * 값을 우리가 직접 복원한다 — history.scrollRestoration은 항상 "manual"로 고정해 브라우저의 자체 복원이
 * 끼어들어 이 값과 경쟁하지 못하게 막는다. */
export function RouteScrollReset() {
  const pathname = usePathname()
  const previousPathnameRef = React.useRef(pathname)
  const isPopStateRef = React.useRef(false)

  React.useEffect(() => {
    // pushState/replaceState(Link 클릭, router.push/replace)는 popstate를 발생시키지 않으므로,
    // 이 이벤트가 잡히는 경우는 오직 실제 브라우저 뒤/앞으로가기(버튼, Alt+←, history.back 등)뿐이다.
    const onPopState = () => {
      isPopStateRef.current = true
    }
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [])

  React.useEffect(() => {
    window.history.scrollRestoration = "manual"

    if (previousPathnameRef.current === pathname) return
    previousPathnameRef.current = pathname
    const wasPopState = isPopStateRef.current
    isPopStateRef.current = false

    if (wasPopState) {
      const saved = readSavedScroll(currentScrollKey())
      window.scrollTo({ top: saved ?? 0, behavior: "instant" })
      return
    }

    window.scrollTo({ top: 0, behavior: "instant" })
  }, [pathname])

  // 현재 URL의 스크롤 위치를 계속 저장해서, 나중에 이 URL로 popstate 복귀했을 때 정확히 되돌릴 수
  // 있게 한다. page/필터가 쿼리스트링에 반영되므로(EntryStream 참고) 키에 search까지 포함해야
  // "/?page=2"와 "/?page=1"의 스크롤 위치가 서로 덮어쓰지 않고 분리된다.
  React.useEffect(() => {
    let ticking = false
    const persist = () => writeSavedScroll(currentScrollKey(), window.scrollY)
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        persist()
        ticking = false
      })
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    // 스크롤 이벤트 없이 탭이 닫히거나 백그라운드로 전환되는 순간을 놓치지 않기 위한 안전망.
    window.addEventListener("pagehide", persist)
    document.addEventListener("visibilitychange", persist)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("pagehide", persist)
      document.removeEventListener("visibilitychange", persist)
    }
  }, [])

  return null
}
