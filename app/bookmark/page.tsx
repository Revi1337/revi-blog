import * as motion from "motion/react-client"

import { getBookmarkCategories } from "@/lib/data/bookmarks"
import { BookmarkCategorySection } from "@/components/bookmark/bookmark-category-section"

export default function BookmarkPage() {
  const bookmarkCategories = getBookmarkCategories()

  return (
    <div className="mx-auto max-w-[1200px] px-gutter pb-section-gap">
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
