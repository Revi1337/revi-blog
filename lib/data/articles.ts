import { loadArticles } from "@/lib/content/loader"
import type { Article, BlogCardData } from "@/lib/data/types"

const { articles: loadedArticles, blogSlugs } = await loadArticles()

export const articles: Article[] = loadedArticles

export const blogCards: BlogCardData[] = blogSlugs.map((slug) => {
  const article = articles.find((a) => a.slug === slug)!
  return {
    slug: article.slug,
    title: article.title,
    thumbnail: article.thumbnail,
    thumbnailFit: article.thumbnailFit,
    date: article.date,
    tags: article.tags,
  }
})

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((article) => article.slug === slug)
}
