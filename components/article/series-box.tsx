"use client"

import { useState } from "react"
import { Bookmark, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

import type { SeriesMembership } from "@/lib/data/types"

const PAGE_SIZE = 10

function chunk<T>(items: T[], size: number): T[][] {
  const pages: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    pages.push(items.slice(i, i + size))
  }
  return pages
}

/** 시리즈 하나를 나타내는 네이티브 <details>/<summary> 박스. `open` 속성을 절대 지정하지 않아
 * 항상 접힌 기본 상태로 시작하고, 펼침/접힘 상태는 어디에도 저장하지 않는다(spec FR-003/FR-007) —
 * 콜아웃 접기 기능과 동일한 네이티브 프리미티브를 재사용해 heading-fold가 겪었던 커스텀 트리거
 * 레이아웃 충돌을 원천적으로 피한다(research.md #4). 본문 영역과 동일한 폭을 채우는 카드형이며,
 * 한 시리즈가 10편을 넘으면 좌우 화살표로 목록 자체를 10개 단위로 페이지네이션한다(다른 시리즈
 * 글로 이동하는 버튼이 아니다 — 이동은 목록 항목 클릭으로 한다). */
export function SeriesBox({ membership }: { membership: SeriesMembership }) {
  const pages = chunk(membership.episodes, PAGE_SIZE)
  const currentEpisodePage = Math.floor((membership.index - 1) / PAGE_SIZE)
  const [page, setPage] = useState(currentEpisodePage)

  const pageItems = pages[page] ?? []
  const pageStart = page * PAGE_SIZE

  return (
    <details className="group w-full rounded border border-outline-variant bg-surface-container-lowest dark:border-secondary/20">
      <summary className="relative flex cursor-pointer list-none items-center justify-between px-4 py-3 marker:content-none">
        <span className="font-code-sm text-xs font-medium text-on-surface">{membership.label}</span>
        <Bookmark
          className="size-4 text-primary group-open:hidden dark:text-primary-container"
          aria-hidden="true"
        />
      </summary>

      <div className="border-t border-outline-variant px-4 py-3 dark:border-secondary/20">
        <ol className="space-y-1.5 font-code-sm text-[13px]">
          {pageItems.map((episode, i) => {
            const absoluteIndex = pageStart + i + 1
            const isCurrent = absoluteIndex === membership.index
            return (
              <li key={episode.slug} className="flex items-baseline gap-2">
                <span className="text-on-surface-variant/50">{absoluteIndex}.</span>
                {isCurrent ? (
                  <span className="font-medium text-primary dark:text-primary-container">{episode.title}</span>
                ) : (
                  <Link
                    href={`/article/${episode.slug}`}
                    className="text-on-surface-variant hover:text-primary hover:underline dark:hover:text-primary-container"
                  >
                    {episode.title}
                  </Link>
                )}
              </li>
            )
          })}
        </ol>

        {pages.length > 1 && (
          <div className="mt-3 flex items-center justify-end gap-3 border-t border-outline-variant pt-3 font-code-sm text-[11px] text-on-surface-variant dark:border-secondary/20">
            <span>
              {pageStart + 1}-{pageStart + pageItems.length} / {membership.total}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                aria-label="이전 10개 보기"
                className="flex size-6 items-center justify-center rounded hover:bg-surface-container-highest disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                disabled={page === pages.length - 1}
                onClick={() => setPage((p) => p + 1)}
                aria-label="다음 10개 보기"
                className="flex size-6 items-center justify-center rounded hover:bg-surface-container-highest disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>
    </details>
  )
}
