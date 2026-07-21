/**
 * 대소문자 무시 substring 매칭으로 "entryTags가 requiredTags를 전부 만족하는지" 판단하는 AND 매칭 규칙.
 * 헤더 검색 모달의 `#태그` 다중 태그 검색(components/search/search-query.ts)과 홈페이지 QuickSearch
 * 필터가 동일한 규칙을 공유하도록 이 함수 하나로 위임한다.
 */
export function matchesAllTags(entryTags: string[], requiredTags: string[]): boolean {
  const lowerEntryTags = entryTags.map((tag) => tag.toLowerCase())
  return requiredTags.every((required) => {
    const lowerRequired = required.toLowerCase()
    return lowerEntryTags.some((tag) => tag.includes(lowerRequired))
  })
}
