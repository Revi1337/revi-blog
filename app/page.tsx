import { Suspense } from "react"

import { HeroCarousel } from "@/components/home/hero-carousel"
import { EntryStream } from "@/components/home/entry-stream"
import { blogCards } from "@/lib/data/articles"
import { DEFAULT_THUMBNAIL } from "@/lib/data/types"

const heroSlides = blogCards.slice(0, 3).map((card) => ({
  slug: card.slug,
  title: card.title,
  imageUrl: card.thumbnail ?? DEFAULT_THUMBNAIL,
}))

export default function HomePage() {
  return (
    <>
      <header className="mx-auto max-w-[1200px] px-gutter pb-12">
        <HeroCarousel slides={heroSlides} />
      </header>

      <div className="mx-auto max-w-[1200px] px-gutter pb-section-gap">
        <Suspense fallback={null}>
          <EntryStream cards={blogCards} />
        </Suspense>
      </div>
    </>
  )
}
