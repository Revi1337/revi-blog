"use client"

import { useMemo, useState } from "react"

import type { BlogCardData } from "@/lib/data/types"
import { matchesAllTags } from "@/lib/data/tag-match"
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

  const filteredCards = useMemo(() => {
    if (!activePreset) return cards
    return cards.filter((card) => matchesAllTags(card.tags, activePreset.tags))
  }, [cards, activePreset])

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
          Filter: {activePreset ? activePreset.label : "All"}
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
