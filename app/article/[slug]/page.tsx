import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { articles, getArticleBySlug } from "@/lib/data/articles"
import { DEFAULT_ARTICLE_OG_IMAGE } from "@/lib/data/types"
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, SITE_AUTHOR } from "@/lib/site-config"
import { ArticleHeader } from "@/components/article/article-header"
import { TocSidebar } from "@/components/article/toc-sidebar"
import { TrackVisit } from "@/components/stats/track-visit"
import { ArticleNav } from "@/components/article/article-nav"
import { CodeCopyHandler } from "@/components/article/code-copy-handler"
import { ImageLightboxHandler } from "@/components/article/image-lightbox-handler"
import { MermaidDiagramHandler } from "@/components/article/mermaid-diagram-handler"
import { PlantumlDiagramHandler } from "@/components/article/plantuml-diagram-handler"
import { MarkmapDiagramHandler } from "@/components/article/markmap-diagram-handler"
import { ImageLoadingIndicatorHandler } from "@/components/article/image-loading-indicator-handler"
import { HeadingAnchorScrollHandler } from "@/components/article/heading-anchor-scroll-handler"
import { ArticleComments } from "@/components/article/article-comments"

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }))
}

// 콘텐츠가 빌드 타임에 완전히 확정되는 구조(content/articles 변경도 재빌드 전엔 반영 안 됨)라,
// generateStaticParams()에 없는 slug는 런타임에 서버 함수를 한 번 실행해 notFound()로 판정할
// 필요 없이 라우팅 단계에서 바로 정적 404로 끝내도 된다.
export const dynamicParams = false

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const article = getArticleBySlug(slug)

  if (!article) {
    return {}
  }

  const description = article.description ?? SITE_DESCRIPTION
  const url = `${SITE_URL}/article/${article.slug}`

  return {
    title: article.title,
    description,
    alternates: {
      canonical: url,
    },
    // showOnHomepage: false인 아티클(_callout.md 등 내부 검증용)은 sitemap/RSS/검색 인덱스에서는
    // 이미 제외되지만, generateStaticParams는 articles 전체를 대상으로 해 URL 자체는 여전히
    // 빌드된다 — 외부에서 URL이 알려지는 경로(직접 공유, 우연한 링크 등)로 크롤러가 발견해
    // 인덱싱하는 것까지 막으려면 robots noindex를 명시해야 한다.
    robots: {
      index: article.showOnHomepage,
      follow: article.showOnHomepage,
    },
    openGraph: {
      type: "article",
      title: article.title,
      description,
      siteName: SITE_NAME,
      url,
      locale: "ko_KR",
      images: [article.thumbnail ?? DEFAULT_ARTICLE_OG_IMAGE],
      publishedTime: article.date,
      modifiedTime: article.updatedAt ?? article.date,
      authors: [SITE_AUTHOR],
    },
  }
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

  const thumbnail = article.thumbnail ?? DEFAULT_ARTICLE_OG_IMAGE
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.description ?? SITE_DESCRIPTION,
    datePublished: article.date,
    dateModified: article.updatedAt ?? article.date,
    // article.thumbnail은 R2 CDN 절대 URL일 수도, DEFAULT_ARTICLE_OG_IMAGE처럼 사이트 내 상대 경로일 수도 있음
    image: thumbnail.startsWith("http") ? thumbnail : `${SITE_URL}${thumbnail}`,
    author: { "@type": "Person", name: SITE_AUTHOR },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/article/${article.slug}` },
  }

  return (
    <div className="article-selection mx-auto max-w-[1200px] px-gutter pb-section-gap pt-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <TrackVisit slug={article.slug} />
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        <article className="space-y-12 lg:col-span-8">
          <ArticleHeader article={article} />

          <TocSidebar items={article.toc} variant="mobile" />

          <div className="article-body space-y-0" dangerouslySetInnerHTML={{ __html: article.bodyHtml }} />
          <CodeCopyHandler />
          <ImageLightboxHandler images={article.images} />
          <MermaidDiagramHandler />
          <PlantumlDiagramHandler />
          <MarkmapDiagramHandler />
          <ImageLoadingIndicatorHandler hasImages={article.images.length > 0} />
          <HeadingAnchorScrollHandler />

          <ArticleNav prev={article.prev} next={article.next} />
          <ArticleComments />
        </article>

        <aside className="lg:col-span-4">
          <TocSidebar items={article.toc} variant="desktop" />
        </aside>
      </div>
    </div>
  )
}
