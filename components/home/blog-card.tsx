"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, CalendarDays, Timer } from "lucide-react"

import type { BlogCardData } from "@/lib/data/types"
import { resolveDefaultThumbnail } from "@/lib/data/types"
import { useTheme } from "@/components/theme/theme-context"

function formatCardDate(iso: string) {
  return iso.slice(0, 10).replaceAll("-", ".")
}

export function BlogCard({
  slug,
  title,
  thumbnail,
  date,
  readingTimeMinutes,
}: BlogCardData) {
  const { isDark } = useTheme()
  const src = resolveDefaultThumbnail(thumbnail, isDark)

  return (
    <Link
      href={`/article/${slug}`}
      className="group block overflow-hidden rounded-lg bg-surface-container transition-all duration-300"
    >
      <article>
        <div className="relative aspect-[2/1] overflow-hidden bg-surface-container-high">
          <Image src={src} alt="" fill className="object-cover" />
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
            <div className="flex items-center gap-1.5 font-code-sm text-code-sm text-on-surface-variant">
              <div className="flex items-center gap-1">
                <CalendarDays className="size-4 text-primary dark:text-primary-fixed-dim" />
                <span>{formatCardDate(date)}</span>
              </div>
              <span className="text-outline-variant dark:text-outline-variant/40">|</span>
              <div className="flex items-center gap-1">
                <Timer className="size-4 text-primary dark:text-primary-fixed-dim" />
                <span>{readingTimeMinutes} min read</span>
              </div>
            </div>
            <ArrowRight className="size-4 text-primary transition-transform group-hover:translate-x-1 dark:text-primary-fixed-dim" />
          </div>
        </div>
      </article>
    </Link>
  )
}
