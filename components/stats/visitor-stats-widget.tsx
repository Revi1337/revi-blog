"use client"

import type { ComponentType } from "react"
import { Users, TrendingUp, History, Eye } from "lucide-react"
import { AnimatePresence, m } from "motion/react"

import { useVisitorStats } from "@/lib/stats/use-visitor-stats"
import { cn } from "@/lib/utils"

function StatItem({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: number | undefined
}) {
  const text = value !== undefined ? value.toLocaleString() : ""

  return (
    <div className="flex h-5 items-center gap-1.5">
      <Icon className="size-4 text-primary dark:text-primary-container" />
      <span className="font-label-caps text-[10px] uppercase tracking-wide opacity-70 dark:opacity-50">
        {label}
      </span>
      {/* width를 항상 현재 값의 실제 자릿수(콤마 포함)만큼 잡는다 — 안의 숫자는 애니메이션 중
       * absolute로 빠지므로 부모의 자동 너비 계산에 관여하지 못해, 고정 min-w만 두면 4ch를
       * 넘는 값(예: 10,000)이 overflow-hidden에 잘려나간다. 최소 4ch는 짧은 값(0~999)일 때도
       * 자릿수가 늘어날 때(예: 0 → 127) 위젯 크기가 흔들리지 않게 하기 위한 하한선이다.
       * overflow-hidden은 값이 바뀔 때 이전 숫자가 위로 슬라이드아웃, 새 숫자가 아래에서
       * 슬라이드인하는 걸 이 칸 안에서만 보이게 잘라준다 — 방문 집계처럼 델타가 항상 1인
       * 경우 숫자를 실제로 세어 올리는 카운트업은 두 정수 사이에 보여줄 중간값이 없어
       * 애니메이션이 아니라 그냥 타이밍만 밀린 순간 교체로 보이므로, 대신 값 자체를 하나의
       * 단위로 슬라이드 전환한다. key={value}가 바뀔 때만 AnimatePresence가 exit/enter를
       * 트리거하므로 동일 값으로 리렌더링되는 경우엔 아무 애니메이션도 재생되지 않는다. */}
      <span
        className="relative inline-block h-5 overflow-hidden"
        style={{ width: `${Math.max(text.length, 4)}ch` }}
      >
        <AnimatePresence initial={false}>
          {value !== undefined && (
            <m.span
              key={value}
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="absolute inset-0"
            >
              {text}
            </m.span>
          )}
        </AnimatePresence>
      </span>
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
  // 데이터가 오기 전엔 value를 undefined로 두어 StatItem이 아무 것도 그리지 않게 하고, 위젯
  // 전체는 opacity로 숨겨둔다 — 응답이 도착하는 순간 실제 값과 함께 자연스럽게 페이드인되며,
  // "-"나 스켈레톤 없이 곧바로 최종 숫자로 나타난다.
  const isLoaded = stats !== undefined

  const items = [
    { icon: Users, label: "Total", value: stats?.total },
    { icon: TrendingUp, label: "Today", value: stats?.today },
    { icon: History, label: "Yesterday", value: stats?.yesterday },
    ...(articleSlug
      ? [{ icon: Eye, label: "Views", value: stats && "views" in stats ? stats.views : undefined }]
      : []),
  ]

  if (variant === "mobile") {
    return (
      <div
        className={cn(
          "flex flex-wrap items-center gap-4 font-code-sm text-sm text-on-surface transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0",
          "min-[1600px]:hidden"
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
      // 본문 컨테이너(mx-auto max-w-[1200px])의 왼쪽 여백 폭은 (100vw - 1200px) / 2이다.
      // 여백 한가운데((100vw - 1200px) / 4)에서 16px만큼 본문 쪽으로 당겨 "정중앙보다 살짝
      // 오른쪽"에 두되, -translate-x-1/2로 그 지점에 박스의 좌우 중심을 맞춰 뷰포트 폭이
      // 바뀌어도 같은 상대 위치를 유지한다.
      // 위젯 실측 폭(~152px) + 16px 오프셋이 본문을 안 넘으려면 필요 뷰포트가 약 1568px인데
      // (여백 한가운데 기준 1504px에 오프셋만큼 40px 정도 더 필요), 여유를 두고 1600px에서
      // 전환한다 — Tailwind 2xl(1536px)보다 커서 임의 breakpoint(min-[1600px])를 쓴다.
      className={cn(
        "fixed top-40 left-[calc((100vw-1200px)/4+16px)] hidden w-max -translate-x-1/2 flex-col gap-3 rounded border border-outline-variant/20 bg-surface-container-lowest p-4 font-code-sm text-sm text-on-surface transition-opacity duration-300 min-[1600px]:flex",
        isLoaded ? "opacity-100" : "opacity-0"
      )}
    >
      {items.map((item) => (
        <StatItem key={item.label} {...item} />
      ))}
    </div>
  )
}
