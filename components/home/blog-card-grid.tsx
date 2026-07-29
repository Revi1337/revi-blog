"use client"

import { m } from "motion/react"

import type { BlogCardData } from "@/lib/data/types"
import { BlogCard } from "@/components/home/blog-card"

// 페이지/필터가 바뀌면 카드 key(slug)가 전부 교체돼 카드 세트가 통째로 갈린다.
// 이때 exit 애니메이션 + AnimatePresence popLayout을 쓰면 빠져나가는 카드가
// position:absolute로 빠지면서 그리드 높이가 한 줄로 붕괴 → Footer가 뷰포트로 튀어올랐다
// 카드가 다시 채워지며 내려가는 레이아웃 시프트가 생긴다. 카드 높이는 고정이므로
// exit 없이 새 카드를 그 자리에서 페이드-인만 시키면 그리드는 곧바로 새 높이로 잡힌다.
export function BlogCardGrid({ cards }: { cards: BlogCardData[] }) {
  return (
    <div className="grid grid-cols-1 gap-stack-lg md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card, index) => (
        <m.div
          key={card.slug}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* 첫 카드는 모든 브레이크포인트(1/2/3열)에서 공통으로 좌상단에 오고 실측 LCP
           * 엘리먼트였다 — priority로 프리로드해 lazy 로딩 대기 없이 바로 받아온다. */}
          <BlogCard {...card} priority={index === 0} />
        </m.div>
      ))}
    </div>
  )
}
