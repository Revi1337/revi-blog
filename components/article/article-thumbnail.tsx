"use client"

import Image from "next/image"
import * as motion from "motion/react-client"

import { loadImageNaturalSize, openImageLightbox } from "@/lib/lightbox/open-image-lightbox"

/** 썸네일 클릭 시 라이트박스를 여는 부분만 별도 클라이언트 컴포넌트로 분리한다 — ArticleHeader
 * 전체를 클라이언트 컴포넌트로 만들지 않기 위함이며, article 전체가 아니라 src 문자열 하나만
 * prop으로 받아 RSC 경계에서 직렬화되는 데이터를 최소화한다(server-serialization). 이 모달은
 * 본문 이미지 갤러리와 완전히 분리된 단일 이미지 진입점이다(spec FR-014). */
export function ArticleThumbnail({ src }: { src: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.35 }}
      className="group relative aspect-[21/9] w-full cursor-zoom-in overflow-hidden rounded border border-outline-variant/30"
      onClick={async () => {
        const { width, height } = await loadImageNaturalSize(src)
        void openImageLightbox({ dataSource: [{ src, alt: "", width, height }], index: 0 })
      }}
    >
      <Image
        src={src}
        alt=""
        fill
        className="scale-105 object-cover grayscale-[40%] transition-all duration-1000 group-hover:scale-100 group-hover:grayscale-0"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-surface-dim/80 via-transparent to-transparent" />
    </motion.div>
  )
}
