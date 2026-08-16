"use client"

import { CalendarDays, History, Timer } from "lucide-react"
import Link from "next/link"
import * as motion from "motion/react-client"

import type { Article } from "@/lib/data/types"
import { useWrapDetection } from "@/lib/hooks/use-wrap-detection"
import { cn } from "@/lib/utils"
import { ArticleThumbnailButton } from "@/components/article/article-thumbnail-button"
import { VisitorStatsWidget } from "@/components/stats/visitor-stats-widget"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  })
}

// pl-8(32px)로 구분자 자리를 wrapper 안에 항상 고정으로 확보해둔다 — 원래(이 리팩터 전)
// 레이아웃은 [이전 항목] -16px(gap-4)- [구분자] -16px(gap-4)- [아이콘] 순서로, 구분자
// 앞뒤에 각각 16px씩 여백이 있었다. 앞쪽 16px은 바깥 flex row의 gap-4가 그대로 담당하므로,
// 이 wrapper는 나머지 절반(구분자 자체 + 구분자 뒤 16px 여백)만 pl-8로 확보한다 — 앞 16px은
// 구분자 zone(w-4), 뒤 16px은 순수 여백이다. 이걸 pl-4로 줄이면 구분자와 아이콘 사이 여백이
// 사실상 사라져(구분자가 그 좁은 zone 안에서 아이콘에 거의 붙어버림) 버린다.
//
// pl-8은 조건과 무관하게 항상 고정이어야 한다 — 조건에 따라 pl-8 자체를 뺐다 붙였다 하면
// 그만큼 wrapper의 레이아웃 폭이 바뀌어 줄바꿈 여부 판정(useWrapDetection이 보는 offsetTop)이
// 요동치고, 그 결과 구분자가 나타났다 사라졌다 하며 줄바꿈도 같이 뒤집히는 무한 루프가 생긴다.
//
// 줄바꿈됐을 땐 그 pl-8 자리가 시각적으로 빈 여백처럼 보이면 안 되므로, translate로 wrapper
// 전체를 pl-8만큼(-32px) 왼쪽으로 밀어 시각적으로만 상쇄한다 — transform은 paint 단계에서만
// 적용되고 offsetTop/레이아웃 계산에는 관여하지 않으므로, 이 상쇄가 위 줄바꿈 판정에 다시
// 영향을 주지 않는다(자기 참조 루프에서 완전히 분리됨). 구분자 자체는 absolute로 그 pl-8
// 자리의 앞쪽 절반에 겹쳐 그리고, 줄바꿈된 항목에서는 렌더링하지 않는다.
function Separator({ hidden }: { hidden: boolean }) {
  if (hidden) return null
  return (
    <span className="absolute top-0 left-0 flex h-5 w-4 items-center justify-center text-outline-variant dark:text-outline-variant/40">
      |
    </span>
  )
}

function metaItemClassName(wrapped: boolean, extra?: string) {
  return cn("relative flex h-5 items-center pl-8", extra, wrapped && "-translate-x-8")
}

export function ArticleHeader({ article }: { article: Article }) {
  // updatedAt/reading-time/thumbnail은 각각 앞에 구분자를 달고 있는데, 이 셋 중 하나라도
  // 줄바꿈으로 새 줄의 첫머리에 놓이면 그 구분자를 감춰야 한다(이전 줄 끝에 구분자만 덩그러니
  // 남거나, 새 줄이 구분자로 시작하는 상태를 막기 위해) — date는 항상 이 줄의 첫 항목이라
  // 구분자가 없으므로 추적 대상에서 제외한다.
  const updatedAtIndex = article.updatedAt ? 0 : -1
  const readingTimeIndex = article.updatedAt ? 1 : 0
  const thumbnailIndex = article.thumbnail ? readingTimeIndex + 1 : -1
  const trackedItemCount = readingTimeIndex + 1 + (article.thumbnail ? 1 : 0)
  const { itemRefs, wrapped } = useWrapDetection(trackedItemCount)

  return (
    <header className="space-y-4">
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
            <span>{formatDate(article.date)}</span>
          </div>
          {article.updatedAt ? (
            <div
              ref={(el) => {
                itemRefs.current[updatedAtIndex] = el
              }}
              className={metaItemClassName(wrapped[updatedAtIndex], "gap-1.5")}
            >
              <Separator hidden={wrapped[updatedAtIndex]} />
              <History className="size-4 text-primary dark:text-primary-container" />
              <span>{formatDate(article.updatedAt)}</span>
            </div>
          ) : null}
          <div
            ref={(el) => {
              itemRefs.current[readingTimeIndex] = el
            }}
            className={metaItemClassName(wrapped[readingTimeIndex], "gap-1.5")}
          >
            <Separator hidden={wrapped[readingTimeIndex]} />
            <Timer className="size-4 text-primary dark:text-primary-container" />
            <span>{article.readingTimeMinutes} min read</span>
          </div>
          <VisitorStatsWidget variant="inline" articleSlug={article.slug} />
          {article.thumbnail ? (
            <div
              ref={(el) => {
                itemRefs.current[thumbnailIndex] = el
              }}
              className={metaItemClassName(wrapped[thumbnailIndex])}
            >
              <Separator hidden={wrapped[thumbnailIndex]} />
              <ArticleThumbnailButton src={article.thumbnail} />
            </div>
          ) : null}
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
