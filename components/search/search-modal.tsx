"use client"

import { useDeferredValue, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Command } from "cmdk"
import { Search, X } from "lucide-react"

import { createSearchEngine } from "@/components/search/flexsearch-engine"
import { parseSearchQuery } from "@/components/search/search-query"
import { SearchResults } from "@/components/search/search-results"
import type { SearchIndexEntry } from "@/lib/data/types"

interface SearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  // nav-bar.tsx가 idle/오픈 시점에 fetch로 받아오는 중이면 아직 undefined다 — 검색어를 입력한
  // 상태에서 이 구간에 걸리면 "결과 없음"이 아니라 로딩 중임을 구분해서 보여줘야 한다.
  searchIndex: SearchIndexEntry[] | undefined
  // fetch가 실패했을 때 true — 이걸 구분 안 하면 searchIndex가 계속 undefined인 것만 보고
  // "로딩 중" 문구가 영원히 떠있게 된다(실제로는 다시는 안 온다).
  searchIndexError: boolean
  onRetrySearchIndex: () => void
}

/**
 * Algolia DocSearch류의 커맨드 팔레트 UX(cmdk `Command.Dialog`)로 구현한다 — 방향키/Enter 탐색,
 * 포커스 트랩, Esc/바깥 클릭 닫기, 스크롤 락을 cmdk가 기본 제공한다(research.md #4). 입력값은
 * useDeferredValue로 감싸 non-urgent 업데이트로 필터링해 입력 반응성을 유지한다
 * (vercel-react-best-practices의 rerender-use-deferred-value 규칙, SC-002).
 */
export function SearchModal({
  open,
  onOpenChange,
  searchIndex,
  searchIndexError,
  onRetrySearchIndex,
}: SearchModalProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query)
  const parsedQuery = useMemo(() => parseSearchQuery(deferredQuery), [deferredQuery])
  // "#"만 입력한 경우(태그명 없음)는 힌트가 아니라 "No results found."로 처리해야 하므로(spec edge
  // case), 힌트 노출 여부는 raw 입력이 완전히 비어있는지로만 판단한다 — parsedQuery.term이 아니다.
  const isEmpty = deferredQuery.trim() === ""

  const isIndexLoading = searchIndex === undefined
  const engine = useMemo(() => createSearchEngine(searchIndex ?? []), [searchIndex])
  const results = useMemo(() => engine.search(parsedQuery), [engine, parsedQuery])

  function handleSelect(slug: string) {
    onOpenChange(false)
    setQuery("")
    router.push(`/article/${slug}`)
  }

  // cmdk는 ArrowUp/Down·Home/End·Enter만 기본 처리하고 PageUp/PageDown은 다루지 않는다. cmdk 내부
  // 이동 로직(스크롤/래핑 포함)을 재구현하는 대신, 같은 노드에 ArrowUp/Down keydown을 PAGE_SIZE번
  // 합성 디스패치해 cmdk 자신의 핸들러가 그대로 처리하게 한다. cmdk는 현재 선택 항목을 매번 DOM의
  // aria-selected 속성으로 다시 조회하므로, 디스패치 사이에 프레임을 하나씩 넘겨 리렌더가 실제로
  // 반영된 뒤 다음 디스패치가 최신 선택 상태를 읽도록 한다 — 한 번에 연속 디스패치하면 전부 같은
  // stale DOM을 읽어 결과적으로 1칸만 이동한다.
  const PAGE_SIZE = 5

  async function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "PageDown" && event.key !== "PageUp") return
    event.preventDefault()

    const step = event.key === "PageDown" ? "ArrowDown" : "ArrowUp"
    const target = event.currentTarget
    for (let i = 0; i < PAGE_SIZE; i++) {
      target.dispatchEvent(
        new KeyboardEvent("keydown", { key: step, bubbles: true, cancelable: true })
      )
      await new Promise((resolve) => requestAnimationFrame(resolve))
    }
  }

  // cmdk는 Home/End를 "리스트 맨 위/아래로 점프"로 가로채며 preventDefault까지 호출한다 — 그 결과
  // 입력창 안에서 커서를 문장 처음/끝으로 옮기거나(Shift+Home/End로 그 구간을 선택하는) 표준 텍스트
  // 편집 동작이 완전히 막힌다. capture 단계에서 cmdk의 bubble 핸들러(onKeyDown)에 도달하기 전에
  // stopPropagation으로 전파를 끊어 cmdk의 가로채기 자체를 무효화한다 — preventDefault는 호출하지
  // 않으므로 브라우저 기본 텍스트 편집 동작은 그대로 살아남는다.
  function handleKeyDownCapture(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Home" || event.key === "End") {
      event.stopPropagation()
    }
  }

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      shouldFilter={false}
      label="Search articles"
      onKeyDown={handleKeyDown}
      onKeyDownCapture={handleKeyDownCapture}
      overlayClassName="fixed inset-0 z-[59] bg-black/40"
      className="fixed left-1/2 top-20 z-[60] flex max-h-[75vh] w-[calc(100%-2rem)] -translate-x-1/2 flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-2xl sm:top-24 sm:w-full sm:max-w-xl"
    >
      <div className="flex shrink-0 items-center gap-3 border-b border-outline-variant px-4 py-3">
        <Search className="h-4 w-4 shrink-0 text-on-surface-variant" aria-hidden="true" />
        <Command.Input
          value={query}
          onValueChange={setQuery}
          placeholder="Search articles..."
          className="w-full bg-transparent font-body-md text-body-md text-on-surface outline-none placeholder:text-on-surface-variant"
        />
        {/* 모달이 바운딩 박스라 바깥 영역을 탭해도 닫히지만(overlayClassName의 scrim), 스크롤 잠금 중
        스와이프 등으로 바깥을 탭하기 애매한 경우를 위해 명시적 닫기 버튼도 유지한다 — 데스크톱은
        esc/바깥 클릭으로 이미 닫을 수 있으므로 sm 이상에서는 숨긴다. */}
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          aria-label="Close search"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface sm:hidden"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <Command.List className="max-h-[70vh] overflow-y-auto p-2">
        {searchIndexError ? (
          <div className="flex flex-col items-center gap-3 px-4 py-8 text-center font-code-sm text-code-sm text-on-surface-variant">
            <p>검색 인덱스를 불러오지 못했습니다.</p>
            <button
              type="button"
              onClick={onRetrySearchIndex}
              className="rounded-md border border-outline-variant px-3 py-1.5 text-on-surface transition-colors hover:border-primary hover:text-primary dark:hover:border-primary-fixed dark:hover:text-primary-fixed"
            >
              다시 시도
            </button>
          </div>
        ) : isEmpty ? (
          <div className="space-y-1 px-3 py-6 text-center font-code-sm text-code-sm text-on-surface-variant">
            <p>
              Type <span className="text-primary">#tag-name</span> to search articles by tag
            </p>
            <p>
              Add more tags separated by spaces (e.g. <span className="text-primary">#react node</span>) to narrow
              results
            </p>
          </div>
        ) : isIndexLoading ? (
          <div className="px-4 py-8 text-center font-code-sm text-code-sm text-on-surface-variant">
            Loading search index...
          </div>
        ) : (
          <SearchResults results={results} term={parsedQuery.term} onSelect={handleSelect} />
        )}
      </Command.List>

      <div className="flex shrink-0 items-center justify-end gap-4 border-t border-outline-variant px-4 py-2 font-code-sm text-[11px] text-on-surface-variant">
        <span>↑↓ Navigate</span>
        <span>↵ Select</span>
        <span>esc Close</span>
      </div>
    </Command.Dialog>
  )
}
