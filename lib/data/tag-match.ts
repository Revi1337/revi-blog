import { Index } from "flexsearch"

/**
 * 헤더 검색 모달의 `#태그` 다중 태그 검색(components/search/flexsearch-engine.ts)과 홈페이지
 * QuickSearch 필터가 동일한 태그 매칭 규칙(대소문자 무시 부분 문자열 + AND)을 공유하도록 이 인덱스
 * 하나로 위임한다.
 */
export interface TagIndex {
  /**
   * requiredTags의 각 토큰을 개별 조회해 얻은 id 집합을 교집합(AND)한다. 반환되는 id는 items
   * 배열의 index다. 대소문자 무시 부분 문자열 + AND 규칙(구 matchesAllTags)과 동치임을 실측으로
   * 검증했다(research.md #1, #3).
   */
  matchAll(requiredTags: string[]): Set<number>
}

/**
 * items를 한 번 순회해 tags.join(" ")를 배열 index로 add한 flexsearch Index를 빌드한다.
 * tokenize: "full"이어야 GO_1.21처럼 밑줄·점이 섞인 태그를 경계까지 가로지르는 부분 문자열로도
 * 찾을 수 있다(research.md #1).
 */
export function createTagIndex(items: { tags: string[] }[]): TagIndex {
  const index = new Index({ tokenize: "full" })
  items.forEach((item, i) => index.add(i, item.tags.join(" ")))

  return {
    matchAll(requiredTags: string[]): Set<number> {
      const tokens = requiredTags.map((tag) => tag.trim().toLowerCase()).filter(Boolean)
      if (tokens.length === 0) return new Set()

      return tokens
        .map((token) => new Set(index.search(token, { suggest: false }) as number[]))
        .reduce((acc, ids) => new Set([...acc].filter((id) => ids.has(id))))
    },
  }
}
