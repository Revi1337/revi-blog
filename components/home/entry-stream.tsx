"use client"

import { useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import type { BlogCardData } from "@/lib/data/types"
import { createTagIndex } from "@/lib/data/tag-match"
import { quickSearchPresets } from "@/lib/data/quick-search-presets"
import { QuickSearchButtons } from "@/components/home/quick-search-buttons"
import { BlogCardGrid } from "@/components/home/blog-card-grid"
import { HomePagination } from "@/components/home/pagination"

// 페이지당 카드 수. 브레이크포인트와 무관한 단일 상수라 데스크탑·태블릿·모바일 모두
// 동일하게 9개씩 나뉜다 — 어느 기기에서 봐도 같은 글이 같은 페이지에 배치된다.
// (그리드 열 수만 반응형: 모바일 1열 / 태블릿 2열 / 데스크탑 3열)
const CARDS_PER_PAGE = 9

export function EntryStream({ cards }: { cards: BlogCardData[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlTag = searchParams.get("tag")
  const topRef = useRef<HTMLDivElement>(null)

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

  const filterKey = activeFilter?.id ?? "all"
  const [page, setPage] = useState(1)
  const [lastFilterKey, setLastFilterKey] = useState(filterKey)
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey)
    setPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(filteredCards.length / CARDS_PER_PAGE))
  // 앞 페이지부터 CARDS_PER_PAGE만큼 순서대로 채운다 (마지막 페이지에만 나머지가 남는다).
  // 페이지마다 높이가 달라져도 Footer가 튀지 않는 건 아래 goToPage의 스크롤-투-톱과
  // sticky-footer 레이아웃이 보장하므로, 굳이 카드 수를 균등 분배하지 않는다.
  const pagedCards = filteredCards.slice((page - 1) * CARDS_PER_PAGE, page * CARDS_PER_PAGE)

  // 페이지를 넘기면 목록 최상단으로 부드럽게 스크롤한다. 카드 수가 페이지마다 달라도
  // 항상 같은 지점에서 목록이 시작되므로, 아래쪽에서 넘길 때 Footer 위치가 흔들려 보이지 않는다.
  // scroll-mt-24는 fixed navbar(main의 pt-24와 동일) 아래로 목록 상단을 맞추기 위한 여백.
  // setPage 직후 곧바로 스크롤하면 리렌더로 그리드 DOM이 바뀌면서 브라우저 scroll-anchoring이
  // 방금 시작한 smooth 스크롤을 취소해버린다. rAF로 커밋 다음 프레임까지 미뤄 안정적으로 스크롤한다.
  const goToPage = (next: number) => {
    setPage(next)
    requestAnimationFrame(() => {
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }

  return (
    <>
      <div ref={topRef} aria-hidden className="scroll-mt-24" />

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

      <QuickSearchButtons
        presets={quickSearchPresets}
        activePresetId={activePresetId}
        onSelect={handleSelectPreset}
      />

      {filteredCards.length > 0 ? (
        <BlogCardGrid cards={pagedCards} />
      ) : (
        <p className="py-section-gap text-center font-code-sm text-code-sm text-on-surface-variant">
          No articles match this filter.
        </p>
      )}

      <HomePagination page={page} totalPages={totalPages} onPageChange={goToPage} />
    </>
  )
}
