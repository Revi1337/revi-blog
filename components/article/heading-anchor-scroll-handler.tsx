"use client"

import * as React from "react"

import { isPlainLeftClick, scrollToHeadingInstant } from "@/components/article/heading-scroll"

/** article-body는 dangerouslySetInnerHTML로 렌더링되는 정적 HTML이라 헤딩 퍼머링크(.heading-anchor)
 * 마다 React 핸들러를 붙일 수 없다. document 레벨 이벤트 위임으로 TOC 클릭과 동일하게 즉시 이동시킨다. */
export function HeadingAnchorScrollHandler() {
  React.useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!isPlainLeftClick(event)) return

      const target = event.target
      if (!(target instanceof Element)) return

      const anchor = target.closest<HTMLAnchorElement>("a.heading-anchor")
      if (!anchor) return

      const id = anchor.getAttribute("href")?.slice(1)
      if (!id) return

      event.preventDefault()
      scrollToHeadingInstant(id)
    }

    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [])

  return null
}
