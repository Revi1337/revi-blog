import { HeroIntro } from "@/components/home/hero-intro"
import { EntryStream } from "@/components/home/entry-stream"
import { TrackVisit } from "@/components/stats/track-visit"
import { blogCards } from "@/lib/data/articles"
import { getHeroContent } from "@/lib/data/hero"

export default function HomePage() {
  const hero = getHeroContent()

  return (
    <>
      <TrackVisit />

      <header className="mx-auto max-w-[1200px] px-gutter pb-12">
        <HeroIntro hero={hero} />
      </header>

      <div className="mx-auto max-w-[1200px] px-gutter pb-section-gap">
        <EntryStream cards={blogCards} />
      </div>
    </>
  )
}
