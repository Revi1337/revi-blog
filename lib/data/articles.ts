import { loadArticles } from "@/lib/content/loader"
import type { Article, BlogCardData } from "@/lib/data/types"

const { articles: loadedArticles, blogSlugs, rawMarkdownBySlug } = await loadArticles()

export const articles: Article[] = loadedArticles

export const blogCards: BlogCardData[] = blogSlugs.map((slug) => {
  const article = articles.find((a) => a.slug === slug)!
  return {
    slug: article.slug,
    title: article.title,
    thumbnail: article.thumbnail,
    thumbnailFit: article.thumbnailFit,
    date: article.date,
    readingTimeMinutes: article.readingTimeMinutes,
    tags: article.tags,
  }
})

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((article) => article.slug === slug)
}

/** Copy Page 메뉴(017) 전용 — Article에는 원문 필드를 추가하지 않고, 이 함수를 통해서만 접근한다
 * (RSC가 서버→클라이언트 prop을 객체 전체로 직렬화해 article-header.tsx 등의 payload가
 * 커지는 것을 막기 위함, plan.md Constraints). 신규 Route Handler에서만 호출된다. */
export function getArticleRawMarkdown(slug: string): string | undefined {
  return rawMarkdownBySlug.get(slug)
}
