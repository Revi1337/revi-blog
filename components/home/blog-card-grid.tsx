"use client"

import { AnimatePresence, m } from "motion/react"

import type { BlogCardData } from "@/lib/data/types"
import { BlogCard } from "@/components/home/blog-card"

export function BlogCardGrid({ cards }: { cards: BlogCardData[] }) {
  return (
    <div className="grid grid-cols-1 gap-stack-lg md:grid-cols-2 lg:grid-cols-3">
      <AnimatePresence>
        {cards.map((card) => (
          <m.div
            key={card.slug}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <BlogCard {...card} />
          </m.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
