"use client"

import { useMemo, useState } from "react"

import type { BlogCardData } from "@/lib/data/types"
import { createTagIndex } from "@/lib/data/tag-match"
import { quickSearchPresets } from "@/lib/data/quick-search-presets"
import { QuickSearchButtons } from "@/components/home/quick-search-buttons"
import { BlogCardGrid } from "@/components/home/blog-card-grid"
import { HomePagination } from "@/components/home/pagination"

const CARDS_PER_PAGE = 9

export function EntryStream({ cards }: { cards: BlogCardData[] }) {
  const [activePresetId, setActivePresetId] = useState<string | null>(null)

  const handleSelectPreset = (id: string) => {
    setActivePresetId((current) => (current === id ? null : id))
  }

  const activePreset = quickSearchPresets.find((preset) => preset.id === activePresetId) ?? null

  const tagIndex = useMemo(() => createTagIndex(cards), [cards])

  const filteredCards = useMemo(() => {
    if (!activePreset) return cards
    const matchIds = tagIndex.matchAll(activePreset.tags)
    return cards.filter((_, i) => matchIds.has(i))
  }, [cards, activePreset, tagIndex])

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
          {activePreset ? (
            <span className="group relative inline-block cursor-default underline decoration-dotted underline-offset-4">
              {activePreset.label}
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded border border-outline-variant bg-surface-container px-1.5 py-0.5 font-label-caps text-label-caps text-on-surface opacity-0 shadow-md transition-opacity duration-150 group-hover:delay-500 group-hover:opacity-100">
                {activePreset.tags.join(" + ")}
              </span>
            </span>
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

      <HomePagination key={activePresetId ?? "all"} totalPages={totalPages} />
    </>
  )
}
