import { CalendarDays, History, Timer } from "lucide-react"
import Link from "next/link"
import * as motion from "motion/react-client"

import type { Article } from "@/lib/data/types"
import { ArticleThumbnailButton } from "@/components/article/article-thumbnail-button"
import { VisitorStatsWidget } from "@/components/stats/visitor-stats-widget"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  })
}

export function ArticleHeader({ article }: { article: Article }) {
  return (
    <header className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-headline-xl text-headline-xl leading-[1.1] text-on-surface"
        >
          {article.title}
        </motion.h1>
        {article.thumbnail ? (
          <>
            {/* md~lg: TocSidebar의 모바일 플로팅 토글(toc-sidebar.tsx) 바로 아래, 같은
                가로 중심축에 떠 있는 버튼으로 표시한다 — 이 구간에서는 h1 옆 인라인 배치가
                타이틀 줄바꿈에 따라 위치가 흔들려 TOC 버튼과 정렬이 어긋나 보였다.
                TOC 토글은 원형(size-10=40px), 이 버튼은 사각형(size-7=28px)이라 오른쪽
                테두리를 그대로 맞추면(right-gutter) 각진 모서리가 원의 곡선보다 오른쪽으로
                튀어나와 보인다 — 폭 차이의 절반(6px)만큼 안쪽으로 밀어 중심을 맞춘다. */}
            <div className="fixed top-[calc(var(--header-offset)+4.25rem)] right-[calc(var(--spacing-gutter)+6px)] z-40 hidden md:block lg:hidden">
              <ArticleThumbnailButton src={article.thumbnail} />
            </div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="hidden lg:block"
            >
              <ArticleThumbnailButton src={article.thumbnail} />
            </motion.div>
          </>
        ) : null}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="space-y-3 border-y border-outline-variant py-6 font-code-sm text-sm text-on-surface dark:border-outline-variant/10"
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="size-4 text-primary dark:text-primary-container" />
            <span>{formatDate(article.date)}</span>
          </div>
          {article.updatedAt ? (
            <>
              <span className="text-outline-variant dark:text-outline-variant/40">|</span>
              <div className="flex items-center gap-1.5">
                <History className="size-4 text-primary dark:text-primary-container" />
                <span>{formatDate(article.updatedAt)}</span>
              </div>
            </>
          ) : null}
          <span className="text-outline-variant dark:text-outline-variant/40">|</span>
          <div className="flex items-center gap-1.5">
            <Timer className="size-4 text-primary dark:text-primary-container" />
            <span>{article.readingTimeMinutes} min read</span>
          </div>
          <VisitorStatsWidget variant="inline" articleSlug={article.slug} />
        </div>
        {article.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 font-label-caps text-[10px] opacity-70 dark:opacity-50">
              Tags:
            </span>
            {article.tags.map((tag) => (
              <Link
                key={tag}
                href={`/?tag=${encodeURIComponent(tag)}`}
                className="rounded border border-outline-variant bg-surface-container px-2.5 py-0.5 font-code-sm text-[11px] text-on-surface-variant transition-colors hover:border-primary hover:text-primary dark:border-secondary/20 dark:text-secondary-fixed-dim dark:hover:border-primary-fixed dark:hover:text-primary-fixed"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}
      </motion.div>
    </header>
  )
}
