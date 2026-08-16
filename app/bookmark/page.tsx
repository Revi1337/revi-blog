import type { Metadata } from "next"
import * as motion from "motion/react-client"

import { getBookmarkCategories } from "@/lib/data/bookmarks"
import { BookmarkCategorySection } from "@/components/bookmark/bookmark-category-section"
import { VisitorStatsWidget } from "@/components/stats/visitor-stats-widget"
import { TrackVisit } from "@/components/stats/track-visit"
import { SITE_URL, SITE_NAME } from "@/lib/site-config"
import { DEFAULT_WEBSITE_OG_IMAGE } from "@/lib/data/types"

const TITLE = `${SITE_NAME}: Bookmark`
const DESCRIPTION = "Revi가 정리한 개발 관련 북마크 모음"

export const metadata: Metadata = {
  // 문자열 title은 루트 layout의 title.template("%s | Revi's Blog")이 적용돼
  // "Revi's Blog: Bookmark | Revi's Blog"처럼 사이트명이 중복된다 — absolute로
  // template을 우회해 TITLE을 그대로 고정 출력한다.
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: {
    canonical: `${SITE_URL}/bookmark`,
  },
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    siteName: SITE_NAME,
    url: `${SITE_URL}/bookmark`,
    locale: "ko_KR",
    // 이 세그먼트가 자체 openGraph를 정의하면 루트의 opengraph-image.png 컨벤션 이미지가
    // 자동 상속되지 않아 직접 지정해야 한다 (실측: 안 넣으면 og:image 자체가 사라짐)
    images: [DEFAULT_WEBSITE_OG_IMAGE],
  },
}

export default function BookmarkPage() {
  const bookmarkCategories = getBookmarkCategories()

  return (
    <div className="mx-auto max-w-[1200px] px-gutter pb-section-gap">
      <TrackVisit />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <VisitorStatsWidget variant="mobile" />
      </motion.div>

      <div className="flex flex-col gap-12">
        {bookmarkCategories.map((category, index) => (
          <motion.div
            key={category.name}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.08 }}
          >
            <BookmarkCategorySection category={category} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
