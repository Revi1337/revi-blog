"use client"

import { useMemo, useRef } from "react"
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
  const presetId = searchParams.get("preset")
  const topRef = useRef<HTMLDivElement>(null)

  // page/필터를 로컬 state 대신 URL 쿼리만으로 관리한다 — 브라우저 뒤로가기는 이 컴포넌트를
  // 새로 마운트시킬 수 있어(Router Cache 미스) 로컬 state는 그 순간 초기값으로 사라지지만,
  // 히스토리 엔트리에 박힌 URL 자체는 뒤로가기로 정확히 복원되므로, URL을 단일 진실 소스로
  // 삼으면 마운트 여부와 무관하게 항상 떠나기 전과 같은 페이지/필터가 렌더링된다.
  const activeFilter = useMemo(() => {
    if (presetId) {
      return quickSearchPresets.find((preset) => preset.id === presetId) ?? null
    }
    if (urlTag) {
      return { id: `tag:${urlTag}`, label: urlTag, tags: [urlTag] }
    }
    return null
  }, [presetId, urlTag])

  const tagIndex = useMemo(() => createTagIndex(cards), [cards])

  const filteredCards = useMemo(() => {
    if (!activeFilter) return cards
    const matchIds = tagIndex.matchAll(activeFilter.tags)
    return cards.filter((_, i) => matchIds.has(i))
  }, [cards, activeFilter, tagIndex])

  const totalPages = Math.max(1, Math.ceil(filteredCards.length / CARDS_PER_PAGE))
  // URL의 page가 범위를 벗어나면(예: 3페이지를 보다가 필터를 걸어 1페이지 분량만 남는 경우)
  // 안전하게 마지막 페이지로 clamp한다 — URL 자체는 건드리지 않고 렌더링 값만 보정한다.
  const rawPage = Number(searchParams.get("page"))
  const page = Number.isInteger(rawPage) && rawPage > 0 ? Math.min(rawPage, totalPages) : 1
  // 앞 페이지부터 CARDS_PER_PAGE만큼 순서대로 채운다 (마지막 페이지에만 나머지가 남는다).
  // 페이지마다 높이가 달라져도 Footer가 튀지 않는 건 아래 goToPage의 스크롤-투-톱과
  // sticky-footer 레이아웃이 보장하므로, 굳이 카드 수를 균등 분배하지 않는다.
  const pagedCards = filteredCards.slice((page - 1) * CARDS_PER_PAGE, page * CARDS_PER_PAGE)

  const handleSelectPreset = (id: string) => {
    const nextPresetId = presetId === id ? null : id
    const query = nextPresetId ? `?preset=${encodeURIComponent(nextPresetId)}` : ""
    router.replace(`/${query}`, { scroll: false })
  }

  const clearFilter = () => {
    router.replace("/", { scroll: false })
  }

  // 페이지를 넘기면 목록 최상단으로 부드럽게 스크롤한다. 카드 수가 페이지마다 달라도
  // 항상 같은 지점에서 목록이 시작되므로, 아래쪽에서 넘길 때 Footer 위치가 흔들려 보이지 않는다.
  // scroll-mt-24는 fixed navbar(main의 pt-24와 동일) 아래로 목록 상단을 맞추기 위한 여백.
  // router.replace 직후 곧바로 스크롤하면 리렌더로 그리드 DOM이 바뀌면서 브라우저 scroll-anchoring이
  // 방금 시작한 smooth 스크롤을 취소해버린다. rAF로 커밋 다음 프레임까지 미뤄 안정적으로 스크롤한다.
  const goToPage = (next: number) => {
    const params = new URLSearchParams()
    if (presetId) params.set("preset", presetId)
    else if (urlTag) params.set("tag", urlTag)
    if (next > 1) params.set("page", String(next))
    const query = params.toString()
    router.replace(`/${query ? `?${query}` : ""}`, { scroll: false })
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
        activePresetId={presetId}
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
