import type { Article, SearchIndexEntry } from "@/lib/data/types"

/**
 * showOnHomepage가 false인 아티클은 이 함수를 거치는 순간부터 완전히 제외된다 — 제목/본문 텍스트가
 * 클라이언트로 전달되는 페이로드에 아예 포함되지 않도록, 런타임 UI 필터링이 아니라 인덱스 생성
 * 단계에서부터 걸러낸다 (spec FR-017, research.md #8).
 */
export function buildSearchIndex(articles: Article[]): SearchIndexEntry[] {
  return articles
    .filter((article) => article.showOnHomepage)
    .map((article) => ({
      slug: article.slug,
      title: article.title,
      plainBody: article.plainBody,
      tags: article.tags,
    }))
}
