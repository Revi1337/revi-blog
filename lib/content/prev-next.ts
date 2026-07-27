import type { Article, ArticleNavRef } from "@/lib/data/types"

function toNavRef(article: Article): ArticleNavRef {
  return { slug: article.slug, title: article.title }
}

/**
 * articlesDesc는 publishedAt 내림차순(최신순)으로 이미 정렬되어 있다고 가정한다.
 * prev = 더 최신 글(인덱스 -1), next = 더 과거 글(인덱스 +1).
 */
export function attachPrevNext(articlesDesc: Article[]): Article[] {
  return articlesDesc.map((article, index) => ({
    ...article,
    prev: index > 0 ? toNavRef(articlesDesc[index - 1]) : undefined,
    next: index < articlesDesc.length - 1 ? toNavRef(articlesDesc[index + 1]) : undefined,
  }))
}
