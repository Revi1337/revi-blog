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
        </motion.p>

        {/* 위젯 자체가 2xl:hidden으로 숨는 지점과 동일한 breakpoint에서 wrapper도 같이 숨어야
         * 마진이 안 남는다 — wrapper만 항상 렌더되면 자식이 안 보여도 mb-stack-md가 그대로 남아
         * WHOAMI와 헤드라인 사이가 넓어진다. */}
        <div className="mb-stack-md 2xl:hidden 2xl:mb-0">
          <VisitorStatsWidget variant="mobile" />
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-stack-lg font-headline-lg-mobile text-headline-lg-mobile text-on-surface md:font-headline-lg md:text-headline-lg"
        >
          {hero.headline}
        </motion.h1>

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
        className="shrink-0 self-start md:self-auto"
      >
        <Image
          src="/images/hero.png"
          alt={hero.name}
          width={1024}
          height={1024}
          priority
          className="size-40 object-contain md:h-[280px] md:w-[280px]"
        />
      </motion.div>
    </div>
  )
}
