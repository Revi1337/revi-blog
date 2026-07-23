import { getBookmarkCategories } from "@/lib/data/bookmarks"
import { BookmarkCategorySection } from "@/components/bookmark/bookmark-category-section"

export default function BookmarkPage() {
  const bookmarkCategories = getBookmarkCategories()

  return (
    <div className="mx-auto max-w-[1200px] px-gutter pb-section-gap">
      <div className="flex flex-col gap-12">
        {bookmarkCategories.map((category) => (
          <BookmarkCategorySection key={category.name} category={category} />
        ))}
      </div>
    </div>
  )
}
