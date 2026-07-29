"use client"

import * as React from "react"

const INDICATOR_CLASS = "image-loading-indicator"
const DOT_COUNT = 4

/** article-body는 dangerouslySetInnerHTML로 렌더링되는 정적 HTML이라 이미지마다 React 핸들러를
 * 붙일 수 없다. 마운트 시점에 아직 로드되지 않은 <img>(img.complete가 false인 것)에만
 * 로딩 인디케이터를 형제로 심고, load/error 이벤트가 발생하면 제거한다. remark-images.ts가
 * 심어둔 width/height 덕분에 <img>의 부모 문단은 이미 실제 비율만큼 공간을 예약해두고
 * 있으므로(article-body.css), 인디케이터는 그 예약된 공간 위에 겹쳐 그려질 뿐 추가적인
 * 레이아웃 시프트를 일으키지 않는다. 이미 브라우저 캐시에 있어 즉시 로드되는 이미지는
 * img.complete가 곧바로 true이므로 인디케이터 자체를 건너뛴다. */
export function ImageLoadingIndicatorHandler({ hasImages }: { hasImages: boolean }) {
  React.useEffect(() => {
    if (!hasImages) return

    const images = document.querySelectorAll<HTMLImageElement>(".article-body img")
    const cleanups: Array<() => void> = []

    images.forEach((img) => {
      if (img.complete && img.naturalWidth > 0) return

      const parent = img.parentElement
      if (!parent) return

      const indicator = document.createElement("div")
      indicator.className = INDICATOR_CLASS
      indicator.setAttribute("aria-hidden", "true")
      for (let i = 0; i < DOT_COUNT; i += 1) {
        indicator.appendChild(document.createElement("span"))
      }
      parent.insertBefore(indicator, img.nextSibling)

      const handleSettle = () => indicator.remove()
      img.addEventListener("load", handleSettle)
      img.addEventListener("error", handleSettle)

      cleanups.push(() => {
        img.removeEventListener("load", handleSettle)
        img.removeEventListener("error", handleSettle)
        indicator.remove()
      })
    })

    return () => cleanups.forEach((cleanup) => cleanup())
  }, [hasImages])

  return null
}
