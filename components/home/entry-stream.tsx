"use client"

import { useMemo, useRef, useSyncExternalStore } from "react"
import { m } from "motion/react"

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

interface EntryStreamUrlState {
  tag: string | null
  presetId: string | null
  rawPage: string | null
}

function readUrlState(search: string): EntryStreamUrlState {
  const params = new URLSearchParams(search)
  return {
    tag: params.get("tag"),
    presetId: params.get("preset"),
    rawPage: params.get("page"),
  }
}

// history.replaceState는 popstate를 발생시키지 않으므로, replace() 직후 useSyncExternalStore
// 구독자들에게 값이 바뀌었음을 직접 알리기 위한 로컬 커스텀 이벤트.
const URL_CHANGE_EVENT = "entry-stream-url-change"

function subscribeToLocationSearch(callback: () => void) {
  window.addEventListener("popstate", callback)
  window.addEventListener(URL_CHANGE_EVENT, callback)
  return () => {
    window.removeEventListener("popstate", callback)
    window.removeEventListener(URL_CHANGE_EVENT, callback)
  }
}

const getLocationSearch = () => window.location.search
const getServerLocationSearch = () => ""

/** page/preset/tag를 URL에 쓰고 읽는 걸 Next 라우터(router.replace) 대신 history.replaceState +
 * useSyncExternalStore로 직접 처리한다. 루트 레이아웃이 theme 쿠키를 읽으려고 cookies()를 쓰는 탓에
 * 이 라우트 전체가 dynamic 렌더링 대상이 되고, 그 결과 router.replace는 검색 파라미터만 바뀌어도
 * 매번 서버에 RSC 페이로드를 새로 요청한다 — 로컬 dev 서버는 항상 warm하고 왕복이 사실상 0ms라 안
 * 느껴지지만, Vercel 서버리스 프로덕션에서는 실제 네트워크 왕복(+ 콜드스타트)이 클릭마다 끼어들어
 * 눈에 띄게 느려진다(실측: DataStructure 프리셋 클릭 시 `GET /?preset=...&_rsc=...` 요청 발생).
 * 필터링/페이지 분할은 이미 클라이언트에서 cards를 슬라이싱해 끝내고 있어 이 요청은 애초에 새로
 * 가져올 데이터가 없으므로, URL 동기화를 순수 클라이언트에서 끝내 서버 왕복 자체를 없앤다.
 *
 * next/navigation의 useSearchParams() 대신 useSyncExternalStore로 window.location.search를 직접
 * 구독한다. useSearchParams()는 정적 프리렌더 라우트에서 Suspense boundary를 강제로 CSR-only
 * 취급해 fallback(스켈레톤)이 빌드된 정적 HTML에 그대로 구워지게 만든다 — 로컬 dev는 매 요청을
 * 그 자리에서 SSR하니 실제 search params를 이미 갖고 있어 안 보이지만, 프로덕션은 빌드 타임에
 * fallback이 박제된 정적 HTML을 그대로 서빙해 새로고침마다 스켈레톤이 잠깐 보였다 사라진다.
 * useSyncExternalStore는 getServerSnapshot(빈 문자열, 필터 없음)으로 SSR·첫 hydration 렌더를
 * 맞춰 mismatch 없이 정적 생성을 그대로 유지하면서, 커밋 직후 실제 getSnapshot 값으로 자동
 * 전환한다(React 내장 동작이라 setState-in-effect 없이 처리됨).
 */
function useEntryStreamUrlState() {
  const search = useSyncExternalStore(
    subscribeToLocationSearch,
    getLocationSearch,
    getServerLocationSearch,
  )
  const state = useMemo(() => readUrlState(search), [search])

  const replace = (query: string) => {
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${query}`,
    )
    window.dispatchEvent(new Event(URL_CHANGE_EVENT))
  }

  return { ...state, replace }
}

export function EntryStream({ cards }: { cards: BlogCardData[] }) {
  const { tag: urlTag, presetId, rawPage, replace } = useEntryStreamUrlState()
  const topRef = useRef<HTMLDivElement>(null)

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
  const rawPageNum = Number(rawPage)
  const page = Number.isInteger(rawPageNum) && rawPageNum > 0 ? Math.min(rawPageNum, totalPages) : 1
  // 앞 페이지부터 CARDS_PER_PAGE만큼 순서대로 채운다 (마지막 페이지에만 나머지가 남는다).
  // 페이지마다 높이가 달라져도 Footer가 튀지 않는 건 아래 goToPage의 스크롤-투-톱과
  // sticky-footer 레이아웃이 보장하므로, 굳이 카드 수를 균등 분배하지 않는다.
  const pagedCards = filteredCards.slice((page - 1) * CARDS_PER_PAGE, page * CARDS_PER_PAGE)

  const handleSelectPreset = (id: string) => {
    const nextPresetId = presetId === id ? null : id
    const query = nextPresetId ? `?preset=${encodeURIComponent(nextPresetId)}` : ""
    replace(query)
  }

  const clearFilter = () => {
    replace("")
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
    replace(query ? `?${query}` : "")
    requestAnimationFrame(() => {
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }

  return (
    <>
      <div ref={topRef} aria-hidden className="scroll-mt-24" />

      <m.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-stack-lg flex items-center justify-between border-l-4 border-primary pl-4 dark:border-primary-fixed"
      >
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
      </m.div>

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
