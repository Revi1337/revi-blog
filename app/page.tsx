import { HeroCarousel } from "@/components/home/hero-carousel"
import { BlogCardGrid } from "@/components/home/blog-card-grid"
import { HomePagination } from "@/components/home/pagination"
import { blogCards } from "@/lib/data/articles"

export default function HomePage() {
  return (
    <>
      <header className="mx-auto max-w-[1200px] px-gutter pb-12">
        <HeroCarousel />
      </header>

      <div className="mx-auto max-w-[1200px] px-gutter pb-section-gap">
        <div className="mb-stack-lg flex items-end justify-between border-l-4 border-primary-fixed pl-4">
          <h3 className="font-headline-lg text-headline-lg text-on-surface">
            Entry Stream
          </h3>
          <span className="font-code-sm text-code-sm text-on-surface-variant">
            Filter: All
          </span>
        </div>

        <BlogCardGrid cards={blogCards} />

        <HomePagination totalPages={12} />
      </div>
    </>
  )
}
