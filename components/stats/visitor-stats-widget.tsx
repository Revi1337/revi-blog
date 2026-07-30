"use client"

import type { ComponentType } from "react"
import { Users, TrendingUp, History, Eye } from "lucide-react"

import { useVisitorStats } from "@/lib/stats/use-visitor-stats"
import { cn } from "@/lib/utils"

function StatItem({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: number
}) {
  return (
    <div className="flex h-5 items-center gap-1.5">
      <Icon className="size-4 text-primary dark:text-primary-container" />
      <span className="font-label-caps text-[10px] uppercase tracking-wide opacity-70 dark:opacity-50">
        {label}
      </span>
      {/* min-w-[4ch]가 없으면 이전 값과 새로 받아온 값의 자릿수가 달라질 때(예: 0 → 127)
       * 이 자리의 폭이 바뀌면서 위젯 전체 크기가 흔들리는 layout shift가 생긴다. */}
      <span className="inline-block min-w-[4ch]">{value.toLocaleString()}</span>
    </div>
  )
}

export function VisitorStatsWidget({
  variant,
  articleSlug,
}: {
  variant: "desktop" | "mobile"
  articleSlug?: string
}) {
  const stats = useVisitorStats(articleSlug)
  // 데이터가 오기 전엔 값 자리를 0으로 채워 레이아웃(칸 수·높이·폭)을 먼저 확정해두고, 실제로는
  // opacity로 숨겨둔다 — 응답이 도착하는 순간 실제 값과 함께 자연스럽게 페이드인되며, "-"나
  // 스켈레톤, 혹은 이전 값이 잠깐 보였다가 바뀌는 어색한 전환 없이 곧바로 최종 숫자로 나타난다.
  const isLoaded = stats !== undefined

  const items = [
    { icon: Users, label: "Total", value: stats?.total ?? 0 },
    { icon: TrendingUp, label: "Today", value: stats?.today ?? 0 },
    { icon: History, label: "Yesterday", value: stats?.yesterday ?? 0 },
    ...(articleSlug
      ? [{ icon: Eye, label: "Views", value: stats && "views" in stats ? stats.views : 0 }]
      : []),
  ]

  if (variant === "mobile") {
    return (
      <div
        className={cn(
          "flex flex-wrap items-center gap-4 font-code-sm text-sm text-on-surface transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0",
          "2xl:hidden"
        )}
      >
        {items.map((item, index) => (
          <div key={item.label} className="flex items-center gap-4">
            {index > 0 && (
              <span className="text-outline-variant dark:text-outline-variant/40">|</span>
            )}
            <StatItem {...item} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      // 본문 컨테이너(mx-auto max-w-[1200px])의 왼쪽 여백 폭은 (100vw - 1200px) / 2이고,
      // 그 여백의 가로 중앙은 그 절반인 (100vw - 1200px) / 4 지점이다. -translate-x-1/2로
      // 그 지점에 박스의 좌우 중심을 맞춰, 뷰포트 폭이 바뀌어도 항상 여백 한가운데에 고정된다.
      // 위젯 실측 폭(~152px)이 안 겹치려면 여백이 그 폭 이상이어야 하는데(중심이 여백의 절반
      // 지점에 있으므로 필요 뷰포트는 1200 + 4*76 ≈ 1504px), xl(1280px)에서 전환하면 그 사이
      // 구간에서 desktop 위젯이 hero 텍스트를 침범한다 — 여유를 두고 2xl(1536px)에서 전환한다.
      className={cn(
        "fixed top-40 left-[calc((100vw-1200px)/4)] hidden w-max -translate-x-1/2 flex-col gap-3 rounded border border-outline-variant/20 bg-surface-container-lowest p-4 font-code-sm text-sm text-on-surface transition-opacity duration-300 2xl:flex",
        isLoaded ? "opacity-100" : "opacity-0"
      )}
    >
      {items.map((item) => (
        <StatItem key={item.label} {...item} />
      ))}
    </div>
  )
}
