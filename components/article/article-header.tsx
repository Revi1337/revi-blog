import { CalendarDays, History, Timer } from "lucide-react"
import * as motion from "motion/react-client"

import type { Article } from "@/lib/data/types"
import { DEFAULT_THUMBNAIL } from "@/lib/data/types"
import { ArticleThumbnail } from "@/components/article/article-thumbnail"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  })
}

export function ArticleHeader({ article }: { article: Article }) {
  const updatedAt = article.updatedAt ?? article.publishedAt

  return (
    <header className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-wrap items-center gap-3"
      >
        <span className="rounded border border-outline-variant bg-surface-container px-3 py-1 font-label-caps text-[10px] uppercase tracking-widest text-primary dark:border-outline-variant/30 dark:text-primary-container">
          {article.category}
        </span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="font-headline-xl text-headline-xl leading-[1.1] text-on-surface"
      >
        {article.title}
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="space-y-3 border-y border-outline-variant py-6 font-code-sm text-sm text-on-surface dark:border-outline-variant/10"
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="size-4 text-primary dark:text-primary-container" />
            <span>{formatDate(article.publishedAt)}</span>
          </div>
          <span className="text-outline-variant dark:text-outline-variant/40">|</span>
          <div className="flex items-center gap-1.5">
            <History className="size-4 text-primary dark:text-primary-container" />
            <span>{formatDate(updatedAt)}</span>
          </div>
          <span className="text-outline-variant dark:text-outline-variant/40">|</span>
          <div className="flex items-center gap-1.5">
            <Timer className="size-4 text-primary dark:text-primary-container" />
            <span>{article.readingTimeMinutes} min read</span>
          </div>
        </div>
        {article.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 font-label-caps text-[10px] opacity-70 dark:opacity-50">
              Tags:
            </span>
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="rounded border border-outline-variant bg-surface-container px-2.5 py-0.5 font-code-sm text-[11px] text-on-surface-variant dark:border-secondary/20 dark:text-secondary-fixed-dim"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </motion.div>

      <ArticleThumbnail src={article.thumbnail ?? DEFAULT_THUMBNAIL} />
    </header>
  )
}
