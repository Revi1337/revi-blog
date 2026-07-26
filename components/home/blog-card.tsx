import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import type { BlogCardData } from "@/lib/data/types"
import { DEFAULT_THUMBNAIL } from "@/lib/data/types"

function formatCardDate(iso: string) {
  return iso.replaceAll("-", ".")
}

export function BlogCard({ slug, title, thumbnail, thumbnailFit, date }: BlogCardData) {
  const src = thumbnail ?? DEFAULT_THUMBNAIL
  const isContain = thumbnailFit === "contain"

  return (
    <Link
      href={`/article/${slug}`}
      className="group block overflow-hidden rounded-lg bg-surface-container transition-all duration-300"
    >
      <article>
        <div className="relative h-56 overflow-hidden bg-surface-container-high">
          <Image
            src={src}
            alt=""
            fill
            className={
              isContain
                ? "object-contain"
                : "object-cover transition-transform duration-500 group-hover:scale-105"
            }
          />
        </div>
        <div className="flex h-32 flex-col justify-between p-stack-md">
          <h4
            className={[
              "line-clamp-2 font-headline-lg-mobile text-headline-lg-mobile text-on-surface transition-colors",
              "group-hover:text-primary dark:group-hover:text-primary-fixed",
              "dark:[text-shadow:0_0_0_transparent] dark:group-hover:[text-shadow:0_0_8px_rgba(86,255,167,0.4)]",
            ].join(" ")}
          >
            {title}
          </h4>
          <div className="mt-auto flex items-center justify-between">
            <span className="font-code-sm text-code-sm text-on-surface-variant">
              {formatCardDate(date)}
            </span>
            <ArrowRight className="size-4 text-primary transition-transform group-hover:translate-x-1 dark:text-primary-fixed-dim" />
          </div>
        </div>
      </article>
    </Link>
  )
}
