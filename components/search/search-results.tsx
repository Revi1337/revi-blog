"use client"

import { Command } from "cmdk"
import { FileText } from "lucide-react"

import type { SearchResult } from "@/lib/data/types"

interface SearchResultsProps {
  results: SearchResult[]
  onSelect: (slug: string) => void
}

/**
 * 개수 제한 없이 스크롤 가능한 리스트로 전체 결과를 보여준다(FR-013). 결과가 0건이면
 * "No results found."를 표시한다(FR-014). 정렬 순서는 호출자(runTextSearch/runTagSearch)가 이미
 * 결정했으므로 여기서는 그대로 렌더링만 한다.
 */
export function SearchResults({ results, onSelect }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <Command.Empty className="px-4 py-8 text-center font-code-sm text-code-sm text-on-surface-variant">
        No results found.
      </Command.Empty>
    )
  }

  return (
    <>
      {results.map(({ entry }) => (
        <Command.Item
          key={entry.slug}
          value={entry.slug}
          onSelect={() => onSelect(entry.slug)}
          className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-on-surface data-[selected=true]:bg-surface-container-highest data-[selected=true]:text-primary"
        >
          <FileText className="h-4 w-4 shrink-0 text-on-surface-variant" aria-hidden="true" />
          <span className="truncate font-body-md text-body-md">{entry.title}</span>
        </Command.Item>
      ))}
    </>
  )
}
