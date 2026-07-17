import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"

import type { ArticleNavRef } from "@/lib/data/types"

export function ArticleNav({
  prev,
  next,
}: {
  prev?: ArticleNavRef
  next?: ArticleNavRef
}) {
  if (!prev && !next) return null

  return (
    <div className="mt-12 grid grid-cols-1 gap-4 border-t border-outline-variant/20 pt-6 md:grid-cols-2">
      {prev ? (
        <Link
          href={`/article/${prev.slug}`}
          className="group relative overflow-hidden rounded border border-outline-variant/20 bg-surface-container-low p-5 transition-all hover:border-primary-container/40"
        >
          <div className="absolute left-0 top-0 h-full w-1 bg-primary-container opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="mb-2 flex items-center gap-2 font-label-caps text-[11px] uppercase tracking-widest text-on-surface-variant">
            <ArrowLeft className="size-4" />
            Previous entry
          </div>
          <div className="font-headline-lg text-base leading-snug text-on-surface transition-colors group-hover:text-primary-container">
            {prev.title}
          </div>
        </Link>
      ) : (
        <div />
      )}
      {next && (
        <Link
          href={`/article/${next.slug}`}
          className="group relative overflow-hidden rounded border border-outline-variant/20 bg-surface-container-low p-5 text-right transition-all hover:border-primary-container/40"
        >
          <div className="absolute right-0 top-0 h-full w-1 bg-primary-container opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="mb-2 flex items-center justify-end gap-2 font-label-caps text-[11px] uppercase tracking-widest text-on-surface-variant">
            Next entry
            <ArrowRight className="size-4" />
          </div>
          <div className="font-headline-lg text-base leading-snug text-on-surface transition-colors group-hover:text-primary-container">
            {next.title}
          </div>
        </Link>
      )}
    </div>
  )
}
