"use client"

import { Command } from "cmdk"
import { FileText } from "lucide-react"

import { getMatchSnippet, highlightSegments } from "@/components/search/search-query"
import type { SearchResult } from "@/lib/data/types"

interface SearchResultsProps {
  results: SearchResult[]
  term: string
  onSelect: (slug: string) => void
}

function HighlightedText({ text, term }: { text: string; term: string }) {
  const segments = highlightSegments(text, term)
  return (
    <>
      {segments.map((segment, index) =>
        segment.matched ? (
          <mark
            key={index}
            className="bg-primary-container text-on-primary-container rounded-sm"
          >
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        )
      )}
    </>
  )
}

/**
 * 개수 제한 없이 스크롤 가능한 리스트로 전체 결과를 보여준다(FR-013). 결과가 0건이면
 * "No results found."를 표시한다(FR-014). 정렬 순서는 호출자(runTextSearch/runTagSearch)가 이미
 * 결정했으므로 여기서는 그대로 렌더링만 한다. `term`은 제목/본문/태그에서 일치하는 구간을 강조 표시하는
 * 데만 쓰인다 — 매칭 로직 자체는 이미 runTextSearch/runTagSearch가 끝낸 뒤이므로 여기서는 순수 표시용이다.
 * 본문 매치(matchedIn === "body")는 제목만으로는 왜 노출됐는지 알 수 없으므로 일치 지점 주변을 발췌해
 * 보여주고, 태그 매치(matchedIn === null)는 애초에 제목이 검색 대상이 아니었으므로 제목 하이라이트를
 * 끄고 대신 매칭된 tags를 같은 방식으로 보여준다.
 */
export function SearchResults({ results, term, onSelect }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <Command.Empty className="px-4 py-8 text-center font-code-sm text-code-sm text-on-surface-variant">
        No results found.
      </Command.Empty>
    )
  }

  return (
    <>
      {results.map(({ entry, matchedIn }) => {
        const snippet =
          matchedIn === "body"
            ? getMatchSnippet(entry.plainBody, term)
            : matchedIn === null
              ? entry.tags.join(", ")
              : ""

        return (
          <Command.Item
            key={entry.slug}
            value={entry.slug}
            onSelect={() => onSelect(entry.slug)}
            className="flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 text-on-surface data-[selected=true]:bg-surface-container-highest data-[selected=true]:text-primary"
          >
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-on-surface-variant" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-body-md text-body-md">
                {matchedIn === null ? entry.title : <HighlightedText text={entry.title} term={term} />}
              </div>
              {snippet ? (
                <div className="mt-0.5 flex items-start gap-1 truncate font-code-sm text-code-sm text-on-surface-variant">
                  <span aria-hidden="true">↳</span>
                  <span className="truncate">
                    <HighlightedText text={snippet} term={term} />
                  </span>
                </div>
              ) : null}
            </div>
          </Command.Item>
        )
      })}
    </>
  )
}
