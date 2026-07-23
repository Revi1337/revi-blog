import { ExternalLink } from "lucide-react"

import type { BookmarkCategory, BookmarkItem } from "@/lib/data/types"
import { BookmarkCategoryIcon } from "@/components/bookmark/bookmark-icon"

function BookmarkItemGrid({ items }: { items: BookmarkItem[] }) {
  return (
    <ul className="grid grid-cols-1 gap-stack-md md:grid-cols-2 lg:grid-cols-3">
      {items.map((item, index) => (
        <li key={`${item.url}-${index}`}>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex h-full flex-col gap-stack-sm rounded-lg border border-outline-variant bg-surface-container p-stack-md transition-colors hover:border-primary dark:border-outline-variant/30 dark:hover:border-primary-fixed"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-body-md text-body-md text-on-surface transition-colors group-hover:text-primary dark:group-hover:text-primary-fixed">
                {item.title}
              </span>
              <ExternalLink className="size-4 shrink-0 text-on-surface-variant transition-transform group-hover:translate-x-0.5 group-hover:text-primary dark:group-hover:text-primary-fixed-dim" />
            </div>
            {item.description ? (
              <p className="line-clamp-2 font-code-sm text-code-sm text-on-surface-variant">
                {item.description}
              </p>
            ) : null}
          </a>
        </li>
      ))}
    </ul>
  )
}

export function BookmarkCategorySection({
  category,
  depth = 0,
}: {
  category: BookmarkCategory
  depth?: number
}) {
  const hasItems = (category.items?.length ?? 0) > 0
  const hasSubCategories = (category.categories?.length ?? 0) > 0

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

      {hasItems ? <BookmarkItemGrid items={category.items!} /> : null}

      {hasSubCategories ? (
        <div className="mt-stack-lg flex flex-col gap-stack-lg border-l border-outline-variant pl-6 dark:border-outline-variant/30">
          {category.categories!.map((subCategory) => (
            <BookmarkCategorySection key={subCategory.name} category={subCategory} depth={depth + 1} />
          ))}
        </div>
      ) : null}

      {!hasItems && !hasSubCategories ? (
        <p className="py-stack-lg text-center font-code-sm text-code-sm text-on-surface-variant">
          아직 등록된 링크가 없습니다.
        </p>
      ) : null}
    </section>
  )
}
