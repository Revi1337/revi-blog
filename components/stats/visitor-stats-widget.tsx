"use client"

import { type ComponentType, useLayoutEffect, useRef, useState } from "react"
import { Users, TrendingUp, History, Eye } from "lucide-react"
import { AnimatePresence, m } from "motion/react"

import { useVisitorStats } from "@/lib/stats/use-visitor-stats"
import { cn } from "@/lib/utils"

const THOUSAND = 1_000
const MILLION = 1_000_000

// 10,000부터 K 단위, 100만부터 M 단위로 축약 표기한다(예: 12,000 → "12K+", 2,300,000 → "2M+")
// — 1,000~9,999는 굳이 축약할 만큼 길지 않아 K 단위 시작점을 10,000으로 둔다. "+"는 정확한
// 값이 아니라 이 이상이라는 뜻이므로 소수점 없이 정수로 버림한다.
function formatStatValue(value: number): string {
  if (value >= MILLION) return `${Math.floor(value / MILLION)}M+`
  if (value >= 10 * THOUSAND) return `${Math.floor(value / THOUSAND)}K+`
  return value.toLocaleString()
}

// 값이 바뀔 때 위/아래로 슬라이드 전환되는 숫자 — StatItem(캡션형)과 inline 렌더링(frontmatter형)이
// 라벨 스타일은 다르게 가져가도 이 애니메이션 로직만큼은 그대로 공유한다.
function AnimatedStatValue({ value }: { value: number | undefined }) {
  const text = value !== undefined ? formatStatValue(value) : ""

  return (
    // 바깥 wrapper는 hover 감지 + 툴팁 포지셔닝 기준점 역할만 한다 — 슬라이드 애니메이션용
    // overflow-hidden은 안쪽 span에만 남겨둔다. 툴팁을 안쪽 span의 자식으로 넣으면 그
    // overflow-hidden에 같이 잘려 안 보이게 되므로, 반드시 이 바깥 span의 형제로 둬야 한다.
    // h-5로 높이를 명시해야 auto 높이(line-height 기반 strut)로 안쪽 h-5(20px)보다 부풀지
    // 않는다 — height는 line-height와 무관하게 박스 크기를 강제하므로 이것만으로 충분하다.
    // leading-none은 절대 추가하면 안 된다: line-height는 상속 속성이라 이 wrapper에 걸면
    // 안쪽 애니메이션 텍스트(.absolute.inset-0)의 line-height까지 덮어써(예: 20px → 14px)
    // 그 텍스트가 20px 박스 안에서 세로로 놓이는 위치 자체가 바뀌어버린다 — 그래서 wrapper
    // 박스의 기하학적 중심은 라벨/아이콘과 일치해도 실제 숫자 잉크는 아래로 치우쳐 보였다.
    <span className="group relative inline-block h-5">
      {/* width를 현재 값의 실제 자릿수(콤마 포함)만큼만 잡는다 — 안의 숫자는 애니메이션 중
       * absolute로 빠지므로 부모의 자동 너비 계산에 관여하지 못해, 폭을 명시하지 않으면 전부
       * 겹쳐 보인다. 자릿수가 늘어나는 순간(예: 9 → 10) 한 글자만큼 폭이 바뀌지만, SWR이
       * 마운트 시 한 번만 값을 가져오고 포커스 복귀 시에나 재검증하므로 실사용 중 자주
       * 발생하지 않는다 — 반대로 최소 폭을 넉넉히 잡아두면 조회수처럼 자릿수가 적은 값이
       * 뒤이은 구분자("|")·썸네일 버튼과 부자연스럽게 멀어져 보이는 게 항상 발생하는 문제라
       * 폭 안정성보다 이쪽을 우선한다. overflow-hidden은 값이 바뀔 때 이전 숫자가 위로
       * 슬라이드아웃, 새 숫자가 아래에서 슬라이드인하는 걸 이 칸 안에서만 보이게 잘라준다 —
       * 방문 집계처럼 델타가 항상 1인 경우 숫자를 실제로 세어 올리는 카운트업은 두 정수
       * 사이에 보여줄 중간값이 없어 애니메이션이 아니라 그냥 타이밍만 밀린 순간 교체로
       * 보이므로, 대신 값 자체를 하나의 단위로 슬라이드 전환한다. key={value}가 바뀔 때만
       * AnimatePresence가 exit/enter를 트리거하므로 동일 값으로 리렌더링되는 경우엔 아무
       * 애니메이션도 재생되지 않는다. */}
      <span
        className="relative inline-block h-5 overflow-hidden"
        style={{ width: `${text.length}ch` }}
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
      {/* K/M으로 축약된 값일 때만 정확한 원래 숫자를 보여준다 — 축약 안 된 값은 이미 화면에
       * 정확한 숫자가 보이므로 툴팁이 중복 정보다. absolute + top-full이라 문서 흐름에서
       * 빠져 기존 레이아웃(위젯 폭·행 높이)에는 전혀 영향을 주지 않는다. */}
      {value !== undefined && value >= 10 * THOUSAND && (
        <span
          className="pointer-events-none absolute top-full left-1/2 z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded border border-outline-variant bg-surface-container px-1.5 py-0.5 font-code-sm text-[10px] text-on-surface-variant opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100 dark:border-outline-variant/20"
        >
          {value.toLocaleString()}
        </span>
      )}
    </span>
  )
}

// flex-wrap 행에서 각 항목이 새 줄의 첫머리로 밀려났는지를 감지한다 — CSS만으로는 "이 flex
// 아이템이 줄바꿈된 줄의 첫 항목인지"를 판별할 선택자가 없어(:first-child는 DOM 순서 기준일 뿐
// 시각적 줄바꿈과 무관), 바로 앞 형제와 offsetTop을 비교하는 방식으로 우회한다.
//
// 항목 하나당 ResizeObserver를 하나씩 붙이면 같은 부모(메타 줄)를 N개의 옵저버가 중복 관찰하게
// 되므로, 행 전체를 옵저버 하나로 관찰하고 모든 항목의 줄바꿈 여부를 한 번에 계산한다.
function useWrapDetection(itemCount: number) {
  const itemRefs = useRef<(HTMLElement | null)[]>([])
  const [wrapped, setWrapped] = useState<boolean[]>(() => Array(itemCount).fill(false))

  useLayoutEffect(() => {
    const parent = itemRefs.current.find(Boolean)?.parentElement
    if (!parent) return

    const update = () => {
      setWrapped((prev) => {
        const next = itemRefs.current.map((el) => {
          const prevSibling = el?.previousElementSibling as HTMLElement | null
          return el !== null && prevSibling !== null && el.offsetTop > prevSibling.offsetTop
        })
        const changed = next.some((value, index) => value !== prev[index])
        return changed ? next : prev
      })
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(parent)
    return () => observer.disconnect()
  }, [])

  return { itemRefs, wrapped }
}

function StatItem({
  icon: Icon,
  label,
  value,
  hideIcon,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: number | undefined
  hideIcon?: boolean
}) {
  return (
    <div className="flex h-5 items-center gap-1.5">
      {/* 좁은 뷰포트에서 이 항목이 개행되면(hideIcon) 아이콘을 아예 렌더링하지 않는다 — 라벨과
       * 값만 남겨 줄바꿈된 항목이 차지하는 폭을 줄인다. */}
      {!hideIcon && <Icon className="size-4 text-primary dark:text-primary-container" />}
      {/* JetBrains Mono/SUIT 조합은 대문자 전용 텍스트(디센더 없음)의 ascent 여유가 커서,
       * 아이콘·숫자와 같은 flex 행에서 items-center로 정렬해도 라벨 텍스트의 잉크(실제 획)가
       * 시각적으로 위로 치우쳐 보인다 — translate-y로 그 폰트 메트릭 오차만큼 보정한다. */}
      <span className="translate-y-px font-label-caps text-[10px] uppercase tracking-wide opacity-70 dark:opacity-50">
        {label}
      </span>
      <AnimatedStatValue value={value} />
    </div>
  )
}

function InlineStatsRow({
  items,
  isLoaded,
}: {
  items: { icon: ComponentType<{ className?: string }>; label: string; value: number | undefined }[]
  isLoaded: boolean
}) {
  const { itemRefs, wrapped } = useWrapDetection(items.length)

  return (
    <>
      {items.map((item, index) => (
        <div
          key={item.label}
          ref={(el) => {
            itemRefs.current[index] = el
          }}
          className={cn(
            "flex items-center gap-4 transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
        >
          {/* 줄바꿈으로 이 항목이 새 줄의 첫머리로 밀려났을 땐 구분자를 감춘다 — 앞선 항목과
           * 같은 줄에 있을 때만 "|"로 이어붙는 게 자연스럽다. */}
          {!wrapped[index] && (
            <span className="text-outline-variant dark:text-outline-variant/40">|</span>
          )}
          <div className="flex items-center gap-1.5">
            <item.icon className="size-4 text-primary dark:text-primary-container" />
            <AnimatedStatValue value={item.value} />
          </div>
        </div>
      ))}
    </>
  )
}

// 홈/북마크의 캡션형(mobile) variant 전용 — 뷰포트가 좁아질수록 "아이콘 숨김 → 구분자 숨김 →
// 개행" 순으로 3단계에 걸쳐 정보를 줄인다. 각 단계가 한 줄에 들어가는지를 미리 측정하기 위해
// 화면엔 안 보이는 두 가지 구성(①아이콘+구분자 모두 있음, ②아이콘만 없음)을 각각 줄바꿈 없이
// 렌더링해두고, scrollWidth가 clientWidth를 넘는지(내용이 자기 폭 안에 다 안 들어가는지)로
// "이 구성이면 한 줄에 들어가는가"를 판단한다.
//
// 측정용 DOM과 실제로 보이는 DOM을 반드시 분리해야 한다 — 예전에 화면에 보이는 행 자체에 직접
// ref를 달아 측정했더니, 실제 아이폰 폭에서 UI가 초당 수십 번 깜빡이는 무한 루프가 발생했다:
// 개행 감지 → 아이콘 숨김 → 항목 폭이 줄어 한 줄에 다시 들어감(컨테이너 높이 감소) → 그 높이
// 변화를 ResizeObserver가 다시 감지 → 이번엔 아이콘 없이 측정하니 "개행 안 됨" → 아이콘 다시
// 보임 → 폭이 늘어나 재개행 → ResizeObserver 재발동 → ...(반복). 즉 아이콘을 껐다 켰다 하는
// 그 DOM을 동시에 측정 기준으로 삼으면 자기 자신이 만든 레이아웃 변화를 자기가 다시 감지하는
// 되먹임 구조가 생긴다. 그래서 각 구성을 항상 고정된 형태로 유지하는 화면에 안 보이는
// 사본(측정 전용)에만 ref/ResizeObserver를 걸고, 실제로 보이는 행은 그 측정 결과(hideIcon/
// hideSeparator)를 구독만 할 뿐 자신의 DOM 변화가 측정에 영향을 주지 않게 완전히 분리했다.
function useCollapseStage() {
  const fullRef = useRef<HTMLDivElement>(null)
  const noIconRef = useRef<HTMLDivElement>(null)
  const [hideIcon, setHideIcon] = useState(false)
  const [hideSeparator, setHideSeparator] = useState(false)

  useLayoutEffect(() => {
    const overflows = (el: HTMLDivElement | null) => !!el && el.scrollWidth > el.clientWidth + 1

    const update = () => {
      const nextHideIcon = overflows(fullRef.current)
      const nextHideSeparator = nextHideIcon && overflows(noIconRef.current)
      setHideIcon((prev) => (prev === nextHideIcon ? prev : nextHideIcon))
      setHideSeparator((prev) => (prev === nextHideSeparator ? prev : nextHideSeparator))
    }

    update()
    const observer = new ResizeObserver(update)
    if (fullRef.current) observer.observe(fullRef.current)
    return () => observer.disconnect()
  }, [])

  return { fullRef, noIconRef, hideIcon, hideSeparator }
}

function MobileStatsRow({
  items,
  isLoaded,
}: {
  items: { icon: ComponentType<{ className?: string }>; label: string; value: number | undefined }[]
  isLoaded: boolean
}) {
  const { fullRef, noIconRef, hideIcon, hideSeparator } = useCollapseStage()

  return (
    <div className="relative">
      <div
        ref={fullRef}
        aria-hidden
        className="invisible absolute inset-x-0 top-0 flex items-center gap-4 overflow-hidden font-code-sm text-sm"
      >
        {items.map((item, index) => (
          <div key={item.label} className="flex shrink-0 items-center gap-4">
            {index > 0 && <span>|</span>}
            <StatItem {...item} />
          </div>
        ))}
      </div>
      <div
        ref={noIconRef}
        aria-hidden
        className="invisible absolute inset-x-0 top-0 flex items-center gap-4 overflow-hidden font-code-sm text-sm"
      >
        {items.map((item, index) => (
          <div key={item.label} className="flex shrink-0 items-center gap-4">
            {index > 0 && <span>|</span>}
            <StatItem {...item} hideIcon />
          </div>
        ))}
      </div>

      <div
        className={cn(
          "flex flex-wrap items-center gap-4 font-code-sm text-sm text-on-surface transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
      >
        {items.map((item, index) => (
          <div key={item.label} className="flex items-center gap-4">
            {index > 0 && !hideSeparator && (
              <span className="text-outline-variant dark:text-outline-variant/40">|</span>
            )}
            <StatItem {...item} hideIcon={hideIcon} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function VisitorStatsWidget({
  variant,
  articleSlug,
}: {
  variant: "mobile" | "inline"
  articleSlug?: string
}) {
  const stats = useVisitorStats(articleSlug)
  // 데이터가 오기 전엔 value를 undefined로 두어 StatItem이 아무 것도 그리지 않게 하고, 위젯
  // 전체는 opacity로 숨겨둔다 — 응답이 도착하는 순간 실제 값과 함께 자연스럽게 페이드인되며,
  // "-"나 스켈레톤 없이 곧바로 최종 숫자로 나타난다.
  const isLoaded = stats !== undefined

  // 아티클 상세는 "이 글의 조회수"만 관심사이므로 Views 하나만 보여준다 — Total/Today/Yesterday는
  // 사이트 전체 지표라 홈/북마크에서만 의미가 있다.
  const items = articleSlug
    ? [{ icon: Eye, label: "Views", value: stats && "views" in stats ? stats.views : undefined }]
    : [
        { icon: Users, label: "Total", value: stats?.total },
        { icon: TrendingUp, label: "Today", value: stats?.today },
        { icon: History, label: "Yesterday", value: stats?.yesterday },
      ]

  // 아티클 상세의 날짜/수정일/읽는시간 메타 줄에 "|" 구분자로 이어붙이기 위한 variant — StatItem의
  // 캡션형 스타일(작은 대문자 라벨) 대신, 그 줄의 다른 항목들(날짜, 읽는시간)과 동일하게 아이콘 +
  // 숫자로만 렌더링해 시각적으로 한 줄처럼 이어지게 한다. 숫자 애니메이션만 AnimatedStatValue로
  // 그대로 공유. 데이터가 도착하기 전엔 항목 자체를 opacity로 숨겨 빈 항목이 먼저 깜빡이지 않게 한다.
  if (variant === "inline") {
    return <InlineStatsRow items={items} isLoaded={isLoaded} />
  }

  return <MobileStatsRow items={items} isLoaded={isLoaded} />
}
