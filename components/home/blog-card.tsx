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
  priority,
}: BlogCardData & { priority?: boolean }) {
  const { isDark } = useTheme()
  const src = resolveDefaultThumbnail(thumbnail, isDark)

  return (
    <Link
      href={`/article/${slug}`}
      className="group block overflow-hidden rounded-lg bg-surface-container transition-all duration-300"
    >
      <article>
        <div className="relative aspect-[2/1] overflow-hidden bg-surface-container-high">
          {/* sizes 없이 fill만 쓰면 Next가 실제 표시 크기(그리드 열 폭)와 무관하게 항상 최대
           * 해상도(deviceSizes 최대값, 3840px)로 원격 썸네일을 요청한다 — R2에서 매번 그만큼
           * 리사이징/전송해야 해서 카드마다 로딩이 끝나는 시점이 들쭉날쭉해 보였다. 그리드
           * 브레이크포인트(1열/2열/3열)에 맞는 sizes를 주면 실제 필요한 크기만 받아온다. */}
          <Image
            src={src}
            alt=""
            fill
            sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
            priority={priority}
            className="object-cover"
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
