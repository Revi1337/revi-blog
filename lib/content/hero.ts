import fs from "node:fs"
import path from "node:path"
import { parse } from "yaml"

import type { HeroContent } from "@/lib/data/types"

const HOME_CONTENT_FILE = path.join(process.cwd(), "content", "home", "main.yaml")

interface HomeContentFile {
  hero: HeroContent
}

function assertValidHeroContent(hero: HeroContent) {
  if (!hero.name) {
    throw new Error("[content/home] hero.name: 필드 누락")
  }

  if (!hero.headline) {
    throw new Error("[content/home] hero.headline: 필드 누락")
  }

  if (!hero.philosophy || hero.philosophy.length === 0) {
    throw new Error("[content/home] hero.philosophy: 필드 누락 또는 빈 배열")
  }

  hero.philosophy.forEach((item, index) => {
    const location = `hero.philosophy[${index}]`

    if (!item.icon || !item.label) {
      throw new Error(`[content/home] ${location}: icon/label 필드 누락`)
    }

    if (!item.texts || item.texts.length === 0) {
      throw new Error(`[content/home] ${location}.texts: 필드 누락 또는 빈 배열`)
    }
  })
}

export function loadHeroContent(): HeroContent {
  const raw = fs.readFileSync(HOME_CONTENT_FILE, "utf-8")
  const { hero } = parse(raw) as HomeContentFile

  assertValidHeroContent(hero)

  return hero
}
