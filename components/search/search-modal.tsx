"use client"

import { useDeferredValue, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Command } from "cmdk"
import { Search } from "lucide-react"

import { parseSearchQuery, runSearch } from "@/components/search/search-query"
import { SearchResults } from "@/components/search/search-results"
import type { SearchIndexEntry } from "@/lib/data/types"

interface SearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  searchIndex: SearchIndexEntry[]
}

/**
 * Algolia DocSearch류의 커맨드 팔레트 UX(cmdk `Command.Dialog`)로 구현한다 — 방향키/Enter 탐색,
 * 포커스 트랩, Esc/바깥 클릭 닫기, 스크롤 락을 cmdk가 기본 제공한다(research.md #4). 입력값은
 * useDeferredValue로 감싸 non-urgent 업데이트로 필터링해 입력 반응성을 유지한다
 * (vercel-react-best-practices의 rerender-use-deferred-value 규칙, SC-002).
 */
export function SearchModal({ open, onOpenChange, searchIndex }: SearchModalProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query)
  const parsedQuery = useMemo(() => parseSearchQuery(deferredQuery), [deferredQuery])
  // "#"만 입력한 경우(태그명 없음)는 힌트가 아니라 "No results found."로 처리해야 하므로(spec edge
  // case), 힌트 노출 여부는 raw 입력이 완전히 비어있는지로만 판단한다 — parsedQuery.term이 아니다.
  const isEmpty = deferredQuery.trim() === ""

  const results = useMemo(
    () => runSearch(searchIndex, parsedQuery),
    [searchIndex, parsedQuery]
  )

  function handleSelect(slug: string) {
    onOpenChange(false)
    setQuery("")
    router.push(`/article/${slug}`)
  }

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      shouldFilter={false}
      label="Search articles"
      className="fixed inset-0 z-[60] flex flex-col overflow-hidden bg-surface-container-lowest sm:inset-auto sm:left-1/2 sm:top-24 sm:h-auto sm:w-full sm:max-w-xl sm:-translate-x-1/2 sm:rounded-xl sm:border sm:border-outline-variant sm:shadow-2xl"
    >
      <div className="flex shrink-0 items-center gap-3 border-b border-outline-variant px-4 py-3">
        <Search className="h-4 w-4 shrink-0 text-on-surface-variant" aria-hidden="true" />
        <Command.Input
          value={query}
          onValueChange={setQuery}
          placeholder="Search articles..."
          className="w-full bg-transparent font-body-md text-body-md text-on-surface outline-none placeholder:text-on-surface-variant"
        />
      </div>

      <Command.List className="flex-1 overflow-y-auto p-2 sm:max-h-[60vh] sm:flex-none">
        {isEmpty ? (
          <div className="px-3 py-6 text-center font-code-sm text-code-sm text-on-surface-variant">
            Type <span className="text-primary">#tag-name</span> to search articles by tag
          </div>
        ) : (
          <SearchResults results={results} onSelect={handleSelect} />
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
