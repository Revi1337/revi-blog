import { loadHeroContent } from "@/lib/content/hero"
import type { HeroContent } from "@/lib/data/types"

export function getHeroContent(): HeroContent {
  return loadHeroContent()
}
