"use client"

import { ImageIcon } from "lucide-react"

import { loadImageNaturalSize, openImageLightbox } from "@/lib/lightbox/open-image-lightbox"

/** 날짜/조회수와 같은 메타 줄에 붙는 아이콘 전용 트리거 — 클릭하면 원본 썸네일을 라이트박스로
 * 띄운다. 예전엔 제목 옆 별도 위치에 반응형 구간별로 떠 있었는데, 액션 버튼이 사실 나열 줄과
 * 성격이 다르다는 이유로 분리해뒀던 것보다 조회수 옆에 두는 게 더 자연스럽다는 피드백에 따라
 * 메타 줄로 옮겼다. 같은 줄의 CalendarDays/History/Timer/Eye 아이콘과 동일하게 테두리 없는
 * size-4 아이콘으로 맞춰 시각적으로 한 세트처럼 보이게 한다. `thumbnail`이 없는 글(기본
 * 썸네일로 폴백되는 글)에는 ArticleHeader가 아예 렌더링하지 않는다 — 장식용 기본 이미지를
 * 굳이 확대해서 볼 이유가 없어서다. */
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
      className="flex items-center text-primary transition-colors hover:text-primary/70 dark:text-primary-container dark:hover:text-primary-container/70"
    >
      <ImageIcon className="size-4" />
    </button>
  )
}
