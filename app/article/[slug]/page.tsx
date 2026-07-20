import { notFound } from "next/navigation"

import { articles, getArticleBySlug } from "@/lib/data/articles"
import { ArticleHeader } from "@/components/article/article-header"
import { TocSidebar } from "@/components/article/toc-sidebar"
import { ArticleNav } from "@/components/article/article-nav"
import { CodeCopyHandler } from "@/components/article/code-copy-handler"

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }))
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const article = getArticleBySlug(slug)

  if (!article) {
    notFound()
  }

  return (
    <div className="article-selection mx-auto max-w-[1200px] px-gutter pb-section-gap pt-8">
      <main className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        <article className="space-y-12 lg:col-span-8">
          <ArticleHeader article={article} />

          <div className="article-body space-y-0" dangerouslySetInnerHTML={{ __html: article.bodyHtml }} />
          <CodeCopyHandler />

          <ArticleNav prev={article.prev} next={article.next} />
        </article>

        <aside className="lg:col-span-4">
          <TocSidebar items={article.toc} />
        </aside>
      </main>
    </div>
  )
}
