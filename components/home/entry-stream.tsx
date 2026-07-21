"use client"

import { useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import type { BlogCardData } from "@/lib/data/types"
import { createTagIndex } from "@/lib/data/tag-match"
import { quickSearchPresets } from "@/lib/data/quick-search-presets"
import { QuickSearchButtons } from "@/components/home/quick-search-buttons"
import { BlogCardGrid } from "@/components/home/blog-card-grid"
import { HomePagination } from "@/components/home/pagination"

const CARDS_PER_PAGE = 9

export function EntryStream({ cards }: { cards: BlogCardData[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlTag = searchParams.get("tag")

  const [activePresetId, setActivePresetId] = useState<string | null>(null)

  const handleSelectPreset = (id: string) => {
    if (urlTag) router.replace("/", { scroll: false })
    setActivePresetId((current) => (current === id ? null : id))
  }

  const clearFilter = () => {
    setActivePresetId(null)
    if (urlTag) router.replace("/", { scroll: false })
  }

  const activeFilter = useMemo(() => {
    if (activePresetId) {
      return quickSearchPresets.find((preset) => preset.id === activePresetId) ?? null
    }
    if (urlTag) {
      return { id: `tag:${urlTag}`, label: urlTag, tags: [urlTag] }
    }
    return null
  }, [activePresetId, urlTag])

  const tagIndex = useMemo(() => createTagIndex(cards), [cards])

  const filteredCards = useMemo(() => {
    if (!activeFilter) return cards
    const matchIds = tagIndex.matchAll(activeFilter.tags)
    return cards.filter((_, i) => matchIds.has(i))
  }, [cards, activeFilter, tagIndex])

  const totalPages = Math.max(1, Math.ceil(filteredCards.length / CARDS_PER_PAGE))

  return (
    <>
      <QuickSearchButtons
        presets={quickSearchPresets}
        activePresetId={activePresetId}
        onSelect={handleSelectPreset}
      />

      <div className="mb-stack-lg flex items-end justify-between border-l-4 border-primary pl-4 dark:border-primary-fixed">
        <h3 className="font-headline-lg text-headline-lg text-on-surface">
          Entry Stream
        </h3>
        <span className="font-code-sm text-code-sm text-on-surface-variant">
          Filter:{" "}
          {activeFilter ? (
            <>
              <span className="group relative inline-block cursor-default underline decoration-dotted underline-offset-4">
                {activeFilter.label}
                <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded border border-outline-variant bg-surface-container px-1.5 py-0.5 font-label-caps text-label-caps text-on-surface opacity-0 shadow-md transition-opacity duration-150 group-hover:delay-500 group-hover:opacity-100">
                  {activeFilter.tags.join(" + ")}
                </span>
              </span>
              <button
                type="button"
                onClick={clearFilter}
                className="ml-2 text-on-surface-variant underline-offset-4 hover:text-primary hover:underline dark:hover:text-primary-fixed"
              >
                Clear
              </button>
            </>
          ) : (
            "All"
          )}
        </span>
      </div>

      {filteredCards.length > 0 ? (
        <BlogCardGrid cards={filteredCards} />
      ) : (
        <p className="py-section-gap text-center font-code-sm text-code-sm text-on-surface-variant">
          No articles match this filter.
        </p>
      )}

      <HomePagination key={activeFilter?.id ?? "all"} totalPages={totalPages} />
    </>
  )
}
