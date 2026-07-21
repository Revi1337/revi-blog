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
 * 공백으로 구분된 여러 토큰을 AND로 매칭한다 — "narrowing filter"에 가까운 태그 검색의 통상적인
 * 사용 패턴(예: `#react node`)에 맞춰, 토큰 각각은 태그 목록 중 하나 이상과 substring으로 일치해야
 * 하지만 모든 토큰이 (서로 다른 태그여도 상관없이) 만족돼야 결과에 포함한다. 랭킹 없이 entries의
 * 원래 순서를 유지한다(FR-012).
 */
export function runTagSearch(entries: SearchIndexEntry[], rawTerm: string): SearchResult[] {
  const tokens = rawTerm.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return []

  return entries.flatMap((entry) => {
    const lowerTags = entry.tags.map((tag) => tag.toLowerCase())
    const matchesAll = tokens.every((token) => lowerTags.some((tag) => tag.includes(token)))
    return matchesAll ? [{ entry, matchedIn: null }] : []
  })
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

export interface HighlightSegment {
  text: string
  matched: boolean
}

/**
 * 검색어(들)와 일치하는 구간을 대소문자 무시로 찾아 매치/비매치 구간으로 나눈다 — 결과 리스트에서
 * 일치 부분을 시각적으로 강조하기 위한 순수 함수. 정규식 대신 indexOf 루프를 사용해 검색어에 포함된
 * 정규식 특수문자를 이스케이프할 필요가 없게 한다. 배열을 넘기면(다중 태그 검색의 `↳ tag1, tag2, ...`
 * 발췌처럼 토큰이 여러 개인 경우) 각 토큰의 매치 구간을 문자 단위 마스크로 합쳐 겹치거나 인접한 구간도
 * 하나의 <mark>로 자연스럽게 이어지게 한다.
 */
export function highlightSegments(text: string, term: string | string[]): HighlightSegment[] {
  const terms = (Array.isArray(term) ? term : [term]).map((t) => t.trim()).filter(Boolean)
  if (terms.length === 0) return [{ text, matched: false }]

  const lowerText = text.toLowerCase()
  const matchMask = new Array<boolean>(text.length).fill(false)

  for (const rawTerm of terms) {
    const lowerTerm = rawTerm.toLowerCase()
    let cursor = 0
    while (cursor <= lowerText.length) {
      const matchIndex = lowerText.indexOf(lowerTerm, cursor)
      if (matchIndex === -1) break
      matchMask.fill(true, matchIndex, matchIndex + lowerTerm.length)
      cursor = matchIndex + lowerTerm.length
    }
  }

  const segments: HighlightSegment[] = []
  let cursor = 0
  while (cursor < text.length) {
    const matched = matchMask[cursor]
    let end = cursor
    while (end < text.length && matchMask[end] === matched) end++
    segments.push({ text: text.slice(cursor, end), matched })
    cursor = end
  }

  return segments
}

const SNIPPET_CONTEXT_CHARS = 40

/**
 * 본문 매치 결과에서 "어느 부분이 일치했는지" 보여줄 발췌문을 만든다 — 매치 지점 앞뒤로 일정 길이만
 * 잘라내고, 잘린 경계에는 말줄임표를 붙인다. 매치가 없으면 빈 문자열을 반환한다(제목 매치 결과에는
 * 발췌문을 보여주지 않으므로 호출하지 않는 것이 정상 경로).
 */
export function getMatchSnippet(text: string, term: string): string {
  const trimmedTerm = term.trim()
  if (!trimmedTerm) return ""

  const normalized = text.replace(/\s+/g, " ").trim()
  const matchIndex = normalized.toLowerCase().indexOf(trimmedTerm.toLowerCase())
  if (matchIndex === -1) return ""

  const start = Math.max(0, matchIndex - SNIPPET_CONTEXT_CHARS)
  const end = Math.min(normalized.length, matchIndex + trimmedTerm.length + SNIPPET_CONTEXT_CHARS)

  const prefix = start > 0 ? "…" : ""
  const suffix = end < normalized.length ? "…" : ""

  return prefix + normalized.slice(start, end) + suffix
}
