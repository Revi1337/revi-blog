"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

/** Next.js는 새 페이지의 루트 DOM이 "이미 뷰포트 안에 있다"고 판단되면(layout-router.js의
 * topOfElementInViewport) top으로 스크롤을 리셋하지 않는다. 이 프로젝트는 고정 NavBar + main의
 * pt-24로 페이지 콘텐츠 시작 지점이 항상 문서 y=96 부근에 고정돼 있어서, 이전 페이지의 scrollY가
 * 96 이하였다면 이 조건에 걸려 새 페이지가 이전 스크롤 위치를 그대로 물려받는다 — entry stream에서
 * 홈을 살짝 스크롤한 채로 게시글을 클릭하면 title이 NavBar에 가려 보이는 원인이 여기에 있다.
 * history.scrollRestoration이 이미 "manual"이라 브라우저 자체 복원도 없으므로(TocSidebar 참고),
 * pathname이 바뀌는 모든 내비게이션(링크 클릭, 뒤로/앞으로가기 포함)에서 항상 top으로 리셋한다.
 * 같은 문서를 하드 리프레시하는 경우는 pathname이 "바뀌지" 않으므로 이 로직을 타지 않고, 그 경우의
 * 위치 복원은 TocSidebar의 세션스토리지 기반 복원이 담당한다. */
export function RouteScrollReset() {
  const pathname = usePathname()
  const previousPathnameRef = React.useRef(pathname)

  React.useEffect(() => {
    if (previousPathnameRef.current === pathname) return
    previousPathnameRef.current = pathname
    window.scrollTo({ top: 0, behavior: "instant" })
  }, [pathname])

  return null
}
