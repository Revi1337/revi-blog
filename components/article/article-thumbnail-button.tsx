"use client"

import { ImageIcon } from "lucide-react"

import { loadImageNaturalSize, openImageLightbox } from "@/lib/lightbox/open-image-lightbox"

/** 아티클 상세 헤더의 메타 정보 줄에 들어가는 작은 트리거 — 클릭하면 원본 썸네일을 라이트박스로
 * 띄운다. `thumbnail`이 없는 글(기본 썸네일로 폴백되는 글)에는 ArticleHeader가 아예 렌더링하지
 * 않는다 — 장식용 기본 이미지를 굳이 확대해서 볼 이유가 없어서다. */
export function ArticleThumbnailButton({ src }: { src: string }) {
  return (
    <button
      type="button"
      onClick={async () => {
        const { width, height } = await loadImageNaturalSize(src)
        void openImageLightbox({ dataSource: [{ src, alt: "", width, height }], index: 0 })
      }}
      className="flex items-center gap-1.5 transition-colors hover:text-primary dark:hover:text-primary-fixed"
    >
      <ImageIcon className="size-4 text-primary dark:text-primary-container" />
      <span>View thumbnail</span>
    </button>
  )
}
