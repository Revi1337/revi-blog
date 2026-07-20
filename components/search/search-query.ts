import type { SearchIndexEntry, SearchQuery, SearchResult } from "@/lib/data/types"

/**
 * 대소문자 무시 substring 매칭(FR-015). 태그는 대상에 포함하지 않는다(FR-009). 제목 매치를 본문 매치보다
 * 항상 위로 정렬한다(FR-011) — 같은 그룹 안에서는 entries의 원래 순서(발행일 내림차순)를 유지한다.
 */
export function runTextSearch(entries: SearchIndexEntry[], rawTerm: string): SearchResult[] {
  const term = rawTerm.trim().toLowerCase()
  if (!term) return []

  const titleMatches: SearchResult[] = []
  const bodyMatches: SearchResult[] = []

  for (const entry of entries) {
    if (entry.title.toLowerCase().includes(term)) {
      titleMatches.push({ entry, matchedIn: "title" })
    } else if (entry.plainBody.toLowerCase().includes(term)) {
      bodyMatches.push({ entry, matchedIn: "body" })
    }
  }

  return [...titleMatches, ...bodyMatches]
}

/**
 * 태그만 대상으로 대소문자 무시 substring 매칭한다. 랭킹 없이 entries의 원래 순서를 유지한다(FR-012).
 */
export function runTagSearch(entries: SearchIndexEntry[], rawTerm: string): SearchResult[] {
  const term = rawTerm.trim().toLowerCase()
  if (!term) return []

  return entries.flatMap((entry) =>
    entry.tags.some((tag) => tag.toLowerCase().includes(term)) ? [{ entry, matchedIn: null }] : []
  )
}

/**
 * 입력값 전체가 `#`으로 시작하면 태그 검색 모드, 아니면 텍스트 검색 모드로 판별한다(FR-008, FR-010).
 */
export function parseSearchQuery(raw: string): SearchQuery {
  const trimmed = raw.trim()

  if (trimmed.startsWith("#")) {
    return { raw, mode: "tag", term: trimmed.slice(1) }
  }

  return { raw, mode: "text", term: trimmed }
}

export function runSearch(entries: SearchIndexEntry[], query: SearchQuery): SearchResult[] {
  return query.mode === "tag" ? runTagSearch(entries, query.term) : runTextSearch(entries, query.term)
}
