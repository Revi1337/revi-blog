import fs from "node:fs"
import path from "node:path"
import { parse } from "yaml"

import type { BookmarkCategory } from "@/lib/data/types"

const BOOKMARKS_FILE = path.join(process.cwd(), "content", "bookmarks", "bookmarks.yaml")

interface BookmarksFile {
  categories: BookmarkCategory[]
}

function assertValidCategories(categories: BookmarkCategory[], parentPath = "categories") {
  categories.forEach((category, index) => {
    const location = `${parentPath}[${index}]`

    if (!category.name) {
      throw new Error(`[content/bookmarks] ${location}: name 필드 누락`)
    }

    category.items?.forEach((item, itemIndex) => {
      if (!item.title || !item.url) {
        throw new Error(
          `[content/bookmarks] ${location}(${category.name}).items[${itemIndex}]: title/url 필드 누락`
        )
      }
    })

    if (category.categories) {
      assertValidCategories(category.categories, `${location}(${category.name}).categories`)
    }
  })
}

export function loadBookmarkCategories(): BookmarkCategory[] {
  const raw = fs.readFileSync(BOOKMARKS_FILE, "utf-8")
  const { categories } = parse(raw) as BookmarksFile

  assertValidCategories(categories)

  return categories
}
