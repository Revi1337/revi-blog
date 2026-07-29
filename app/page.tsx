import { Suspense } from "react"

import { HeroIntro } from "@/components/home/hero-intro"
import { EntryStream } from "@/components/home/entry-stream"
import { EntryStreamSkeleton } from "@/components/home/entry-stream-skeleton"
import { blogCards } from "@/lib/data/articles"
import { getHeroContent } from "@/lib/data/hero"

export default function HomePage() {
  const hero = getHeroContent()

  return (
    <>
      <header className="mx-auto max-w-[1200px] px-gutter pb-12">
        <HeroIntro hero={hero} />
      </header>

      <div className="mx-auto max-w-[1200px] px-gutter pb-section-gap">
        <Suspense fallback={<EntryStreamSkeleton />}>
          <EntryStream cards={blogCards} />
        </Suspense>
      </div>
    </>
  )
}
