import Image from "next/image"
import { Terminal } from "lucide-react"
import * as motion from "motion/react-client"

import { HeroIcon } from "@/components/home/hero-icon"
import { VisitorStatsWidget } from "@/components/stats/visitor-stats-widget"
import type { HeroContent } from "@/lib/data/types"

export function HeroIntro({ hero }: { hero: HeroContent }) {
  return (
    <div className="flex flex-col gap-stack-lg md:flex-row md:items-center">
      <div className="flex flex-col md:flex-1">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-stack-md flex items-center gap-2 font-code-sm text-code-sm text-primary dark:text-primary-container"
        >
          <Terminal className="size-4" />
          WHOAMI: {hero.name}
          {/* 모바일 전용 미니 아바타 — 아래 큰 히어로 이미지가 모바일에서는 텍스트 밑에 그냥
           * 쌓이면서 실제 콘텐츠(Entry Stream)까지 스크롤을 늘리기만 해서, md 미만에서는 그
           * 이미지를 통째로 숨기고 대신 이 자리에 작은 원형 아바타로만 개성을 남긴다. */}
          <Image
            src="/images/hero.png"
            alt=""
            width={21}
            height={21}
            className="size-[21px] shrink-0 rounded-full object-cover md:hidden"
          />
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-stack-md font-headline-lg-mobile text-headline-lg-mobile text-on-surface md:font-headline-lg md:text-headline-lg"
        >
          {hero.headline}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-stack-lg"
        >
          <VisitorStatsWidget variant="mobile" />
        </motion.div>

        <ul className="flex flex-col gap-stack-md">
          {hero.philosophy.map((item, index) => (
            <motion.li
              key={item.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 + index * 0.1 }}
              className="flex flex-col gap-1"
            >
              <div className="flex items-center gap-2">
                <HeroIcon
                  name={item.icon}
                  className="size-5 shrink-0 text-primary dark:text-primary-fixed"
                />
                <span className="font-label-caps text-label-caps uppercase tracking-wide text-primary dark:text-primary-fixed">
                  {item.label}
                </span>
              </div>
              {item.texts.map((text) => (
                <p key={text} className="font-body-md text-body-md text-on-surface-variant">
                  {text}
                </p>
              ))}
            </motion.li>
          ))}
        </ul>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="hidden shrink-0 self-start md:block md:self-auto"
      >
        {/* md 미만에서는 위 WHOAMI 줄의 미니 아바타가 이 자리를 대신하므로 렌더링 자체를 숨긴다
         * (모바일에서 스크롤만 늘리던 큰 이미지 제거). priority는 데스크톱에서 여전히 이 이미지가
         * LCP 요소라 유지한다 — 다만 preload 힌트는 뷰포트를 가리지 않고 항상 나가므로, 모바일도
         * hidden으로 화면엔 안 그려지지만 이 이미지를 내려받긴 한다(작은 절충). */}
        <Image
          src="/images/hero.png"
          alt={hero.name}
          width={280}
          height={280}
          sizes="280px"
          priority
          fetchPriority="high"
          className="object-contain md:h-[280px] md:w-[280px]"
        />
      </motion.div>
    </div>
  )
}
