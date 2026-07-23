import { ExternalLink } from "lucide-react"

import type { BookmarkCategory, BookmarkItem } from "@/lib/data/types"
import { BookmarkCategoryIcon } from "@/components/bookmark/bookmark-icon"
import { cn } from "@/lib/utils"

// item 카드 한 줄(border+padding+본문) 높이의 세로 중앙 — tree 가지선이 카드 중앙에 닿도록 고정값 사용
const ITEM_TIE_OFFSET = "top-[17px]"
const ITEM_TIE_STUB = "h-[17px]"

function BookmarkItemRow({
  item,
  isLast,
  gapClassName,
}: {
  item: BookmarkItem
  isLast: boolean
  gapClassName: string
}) {
  return (
    <li className={cn("relative pl-6", gapClassName)}>
      <span
        aria-hidden
        className={cn(
          "absolute left-0 top-0 w-px bg-primary dark:bg-primary-fixed",
          isLast ? ITEM_TIE_STUB : "h-full"
        )}
      />
      <span
        aria-hidden
        className={cn("absolute left-0 h-px w-6 bg-primary dark:bg-primary-fixed", ITEM_TIE_OFFSET)}
      />
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center justify-between gap-2 rounded-lg border border-outline-variant bg-surface-container px-stack-md py-stack-sm transition-colors hover:border-primary dark:border-outline-variant/30 dark:hover:border-primary-fixed"
      >
        <div className="flex min-w-0 items-baseline gap-2">
          <span className="truncate font-body-md text-body-md text-on-surface transition-colors group-hover:text-primary dark:group-hover:text-primary-fixed">
            {item.title}
          </span>
          {item.description ? (
            <span className="truncate font-code-sm text-code-sm text-on-surface-variant">
              {item.description}
            </span>
          ) : null}
        </div>
        <ExternalLink className="size-4 shrink-0 text-on-surface-variant transition-transform group-hover:translate-x-0.5 group-hover:text-primary dark:group-hover:text-primary-fixed-dim" />
      </a>
    </li>
  )
}

function BookmarkSubCategoryRow({
  category,
  depth,
  isLast,
}: {
  category: BookmarkCategory
  depth: number
  isLast: boolean
}) {
  return (
    <li className={cn("relative pl-6", !isLast && "pb-stack-lg")}>
      <span
        aria-hidden
        className={cn(
          "absolute left-0 top-0 w-px bg-primary dark:bg-primary-fixed",
          isLast ? "h-2" : "h-full"
        )}
      />
      <span
        aria-hidden
        className="absolute left-0 top-2 h-px w-6 bg-primary dark:bg-primary-fixed"
      />
      <BookmarkCategorySection category={category} depth={depth} />
    </li>
  )
}

export function BookmarkCategorySection({
  category,
  depth = 0,
}: {
  category: BookmarkCategory
  depth?: number
}) {
  const items = category.items ?? []
  const subCategories = category.categories ?? []
  const hasItems = items.length > 0
  const hasSubCategories = subCategories.length > 0

  return (
    <section>
      {depth === 0 ? (
        <div className="mb-stack-md flex items-center gap-2">
          <BookmarkCategoryIcon
            name={category.icon}
            className="size-4 shrink-0 text-primary dark:text-primary-fixed"
          />
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
            {category.name}
          </h2>
        </div>
      ) : (
        <div className="mb-stack-sm flex items-center gap-1.5">
          <BookmarkCategoryIcon
            name={category.icon}
            className="size-3.5 shrink-0 text-primary dark:text-primary-fixed"
          />
          <h3 className="font-label-caps text-label-caps uppercase tracking-wide text-on-surface-variant">
            {category.name}
          </h3>
        </div>
      )}

      {hasItems || hasSubCategories ? (
        <ul className="flex flex-col">
          {items.map((item, index) => {
            const isVeryLastChild = !hasSubCategories && index === items.length - 1
            const isLastItemOfGroup = hasSubCategories && index === items.length - 1
            return (
              <BookmarkItemRow
                key={`${item.url}-${index}`}
                item={item}
                isLast={isVeryLastChild}
                gapClassName={isVeryLastChild ? "" : isLastItemOfGroup ? "pb-stack-lg" : "pb-stack-sm"}
              />
            )
          })}
          {subCategories.map((subCategory, index) => (
            <BookmarkSubCategoryRow
              key={subCategory.name}
              category={subCategory}
              depth={depth + 1}
              isLast={index === subCategories.length - 1}
            />
          ))}
        </ul>
      ) : (
        <p className="py-stack-lg text-center font-code-sm text-code-sm text-on-surface-variant">
          아직 등록된 링크가 없습니다.
        </p>
      )}
    </section>
  )
}
