import { Index } from "flexsearch"

import { createTagIndex } from "@/lib/data/tag-match"
import type { SearchIndexEntry, SearchQuery, SearchResult } from "@/lib/data/types"

export interface SearchEngine {
  search(query: SearchQuery): SearchResult[]
}

/**
 * entries를 한 번 순회해 title/body 필드별 flexsearch Index를 빌드한다. tokenize: "full"이어야
 * "cript"→"JavaScript" 같은 단어 중간 substring도 후보로 잡힌다(다른 tokenize 값은 후보에서 놓쳐
 * 재검증으로도 복구 불가능한 false negative가 생김 — research.md #1).
 *
 * 텍스트 모드는 flexsearch 후보를 원본 `.includes()`로 재검증해 최종 결과를 만든다. flexsearch의
 * 다중 단어 쿼리는 단어 단위 AND 매칭이라 항상 기존 규칙의 superset이므로(research.md #2), 이
 * 재검증을 거치면 결과가 마이그레이션 이전과 완전히 동일해진다.
 *
 * 태그 모드는 lib/data/tag-match.ts의 공유 TagIndex를 사용한다 — 헤더 태그 검색과 QuickSearch가
 * 동일한 태그 매칭 구현을 공유한다(research.md #3).
 */
export function createSearchEngine(entries: SearchIndexEntry[]): SearchEngine {
  const titleIndex = new Index({ tokenize: "full" })
  const bodyIndex = new Index({ tokenize: "full" })
  const tagIndex = createTagIndex(entries)

  entries.forEach((entry, i) => {
    titleIndex.add(i, entry.title)
    bodyIndex.add(i, entry.plainBody)
  })

  function searchText(rawTerm: string): SearchResult[] {
    const term = rawTerm.trim().toLowerCase()
    if (!term) return []

    const titleCandidates = new Set(titleIndex.search(term, { suggest: false }))
    const bodyCandidates = new Set(bodyIndex.search(term, { suggest: false }))

    const titleMatches: SearchResult[] = []
    const bodyMatches: SearchResult[] = []

    entries.forEach((entry, i) => {
      if (titleCandidates.has(i) && entry.title.toLowerCase().includes(term)) {
        titleMatches.push({ entry, matchedIn: "title" })
      } else if (bodyCandidates.has(i) && entry.plainBody.toLowerCase().includes(term)) {
        bodyMatches.push({ entry, matchedIn: "body" })
      }
    })

    return [...titleMatches, ...bodyMatches]
  }

  function searchTag(rawTerm: string): SearchResult[] {
    const tokens = rawTerm.trim().toLowerCase().split(/\s+/).filter(Boolean)
    if (tokens.length === 0) return []

    const matchIds = tagIndex.matchAll(tokens)
    return entries.flatMap((entry, i) => (matchIds.has(i) ? [{ entry, matchedIn: null }] : []))
  }

  return {
    search(query: SearchQuery): SearchResult[] {
      return query.mode === "tag" ? searchTag(query.term) : searchText(query.term)
    },
  }
}
