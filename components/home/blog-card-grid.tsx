import type { BlogCardData } from "@/lib/data/types"
import { BlogCard } from "@/components/home/blog-card"

export function BlogCardGrid({ cards }: { cards: BlogCardData[] }) {
  return (
    <div className="grid grid-cols-1 gap-stack-lg md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <BlogCard key={card.slug} {...card} />
      ))}
    </div>
  )
}
