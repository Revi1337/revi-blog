"use client"

import { ImageIcon } from "lucide-react"

import { loadImageNaturalSize, openImageLightbox } from "@/lib/lightbox/open-image-lightbox"

/** 아티클 제목 옆에 붙는 아이콘 전용 트리거 — 클릭하면 원본 썸네일을 라이트박스로 띄운다.
 * 날짜/읽는시간처럼 "사실을 나열"하는 메타 줄과 달리 이건 "액션"이라 성격이 달라서, 그 줄에
 * 같이 두면 겉돈다는 피드백에 따라 제목 옆으로 옮겼다. `thumbnail`이 없는 글(기본 썸네일로
 * 폴백되는 글)에는 ArticleHeader가 아예 렌더링하지 않는다 — 장식용 기본 이미지를 굳이 확대해서
 * 볼 이유가 없어서다. */
export function ArticleThumbnailButton({ src }: { src: string }) {
  return (
    <button
      type="button"
      aria-label="View thumbnail"
      title="View thumbnail"
      onClick={async () => {
        const { width, height } = await loadImageNaturalSize(src)
        void openImageLightbox({ dataSource: [{ src, alt: "", width, height }], index: 0 })
      }}
      className="flex size-7 shrink-0 items-center justify-center rounded border border-outline-variant text-primary transition-colors hover:border-primary hover:bg-primary hover:text-on-primary dark:border-secondary/20 dark:text-primary-container dark:hover:border-primary-fixed dark:hover:bg-primary-fixed dark:hover:text-black"
    >
      <ImageIcon className="size-3.5" />
    </button>
  )
}
