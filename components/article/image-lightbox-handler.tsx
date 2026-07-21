"use client"

import * as React from "react"

import type { ArticleImage } from "@/lib/data/types"
import { openImageLightbox } from "@/lib/lightbox/open-image-lightbox"

/** article-body는 dangerouslySetInnerHTML로 렌더링되는 정적 HTML이라 이미지마다 React
 * 핸들러를 붙일 수 없다. CodeCopyHandler와 동일하게 document 레벨 이벤트 위임 하나로
 * 모든 본문 이미지 클릭을 처리한다(client-event-listeners). 본문에 이미지가 없으면
 * 리스너 자체를 등록하지 않는다. Article 전체가 아니라 images만 prop으로 받아 RSC 경계에서
 * 직렬화되는 데이터(bodyHtml 등)를 최소화한다(server-serialization). */
export function ImageLightboxHandler({ images }: { images: ArticleImage[] }) {
  React.useEffect(() => {
    if (images.length === 0) return

    const handleClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return

      const clicked = target.closest<HTMLElement>("[data-lightbox-index]")
      if (!clicked) return

      const index = Number(clicked.dataset.lightboxIndex)
      if (Number.isNaN(index)) return

      const dataSource = images.map((image) => {
        const el = document.querySelector<HTMLImageElement>(
          `[data-lightbox-index="${image.order}"]`,
        )
        return { src: image.src, alt: image.alt, width: el?.naturalWidth ?? 0, height: el?.naturalHeight ?? 0 }
      })

      void openImageLightbox({ dataSource, index })
    }

    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [images])

  return null
}
