import { loadBookmarkCategories } from "@/lib/content/bookmarks"
import type { BookmarkCategory } from "@/lib/data/types"

export function getBookmarkCategories(): BookmarkCategory[] {
  return loadBookmarkCategories()
}
