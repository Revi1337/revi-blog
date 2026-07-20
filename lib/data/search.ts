import { buildSearchIndex } from "@/lib/content/search-index"
import { articles } from "@/lib/data/articles"
import type { SearchIndexEntry } from "@/lib/data/types"

export const searchIndex: SearchIndexEntry[] = buildSearchIndex(articles)
