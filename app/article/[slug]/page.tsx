import { notFound } from "next/navigation"

import {
  articles,
  getArticleBySlug,
  CODE_BLOCK_PLACEHOLDER,
  CODE_BLOCK_SOURCE,
  METRICS_PLACEHOLDER,
} from "@/lib/data/articles"
import { ArticleHeader } from "@/components/article/article-header"
import { CodeBlock } from "@/components/article/code-block"
import { MetricCardGrid } from "@/components/article/metric-card-grid"
import { TocSidebar } from "@/components/article/toc-sidebar"
import { ArticleNav } from "@/components/article/article-nav"

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

  const [beforeCode, afterCode = ""] = article.bodyHtml.split(CODE_BLOCK_PLACEHOLDER)
  const [beforeMetrics, afterMetrics] = afterCode.split(METRICS_PLACEHOLDER)

  return (
    <div className="article-selection mx-auto max-w-[1200px] px-gutter pb-section-gap pt-8">
      <main className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        <article className="space-y-12 lg:col-span-8">
          <ArticleHeader article={article} />

          <div className="article-body space-y-0">
            <div dangerouslySetInnerHTML={{ __html: beforeCode }} />
            {article.bodyHtml.includes(CODE_BLOCK_PLACEHOLDER) && (
              <CodeBlock
                filename={CODE_BLOCK_SOURCE.filename}
                language={CODE_BLOCK_SOURCE.language}
                code={CODE_BLOCK_SOURCE.code}
              />
            )}
            <div dangerouslySetInnerHTML={{ __html: beforeMetrics }} />
            <MetricCardGrid metrics={article.metrics} />
            {afterMetrics !== undefined && (
              <div dangerouslySetInnerHTML={{ __html: afterMetrics }} />
            )}
          </div>

          <ArticleNav prev={article.prev} next={article.next} />
        </article>

        <aside className="lg:col-span-4">
          <TocSidebar items={article.toc} />
        </aside>
      </main>
    </div>
  )
}
