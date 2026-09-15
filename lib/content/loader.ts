import fs from "node:fs"
import path from "node:path"

import { parseFrontmatter, type ArticleFrontmatter } from "@/lib/content/frontmatter"
import { renderMarkdown } from "@/lib/content/pipeline"
import { stripComments } from "@/lib/content/strip-comments"
import { computeReadingTimeMinutes } from "@/lib/content/reading-time"
import { attachPrevNext } from "@/lib/content/prev-next"
import { seriesPresets } from "@/lib/data/series-presets"
import type { Article, SeriesMembership } from "@/lib/data/types"

const CONTENT_DIR = path.join(process.cwd(), "content", "articles")

interface ParsedArticleFile {
  filePath: string
  slug: string
  frontmatter: ArticleFrontmatter
  rawBody: string
}

/** 파일명의 공백은 URL에서 %20으로 깨지므로 하이픈으로 치환해 슬러그를 만든다 */
function slugifyFilename(basename: string): string {
  return basename.trim().replace(/\s+/g, "-")
}

function parseArticleFile(filePath: string): ParsedArticleFile {
  const raw = fs.readFileSync(filePath, "utf-8")
  const { frontmatter, rawBody } = parseFrontmatter(filePath, raw)
  const slug = frontmatter.slug ?? slugifyFilename(path.basename(filePath, ".md"))
  return { filePath, slug, frontmatter, rawBody }
}

/** `[[제목]]`/`[[slug]]` wikilink 해석용 — 옵시디언 노트 제목과 slug 둘 다로 찾을 수 있도록 매핑한다 */
function buildTitleToSlugMap(parsed: ParsedArticleFile[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const { frontmatter, slug } of parsed) {
    map.set(slug.toLowerCase(), slug)
    map.set(frontmatter.title.trim().toLowerCase(), slug)
  }
  return map
}

async function loadArticleFile(parsed: ParsedArticleFile, titleToSlug: Map<string, string>): Promise<Article> {
  const { slug, frontmatter, rawBody } = parsed
  const { bodyHtml, toc, plainBody, images } = await renderMarkdown(stripComments(rawBody), titleToSlug)
  const readingTimeMinutes = frontmatter.reading_time_minutes ?? computeReadingTimeMinutes(rawBody)

  return {
    slug,
    title: frontmatter.title,
    date: frontmatter.date,
    updatedAt: frontmatter.updated_at,
    readingTimeMinutes,
    tags: frontmatter.tags,
    description: frontmatter.description,
    thumbnail: frontmatter.thumbnail,
    thumbnailFit: frontmatter.thumbnail_fit,
    audio: frontmatter.audio,
    bodyHtml,
    plainBody,
    toc,
    images,
    // metrics 카드는 remark-metrics가 bodyHtml 안에 직접 렌더링하므로 별도 구조화 데이터로는 노출하지 않는다
    metrics: [],
    showOnHomepage: frontmatter.show_on_homepage ?? true,
  }
}

function assertNoDuplicateSlugs(loaded: Array<{ slug: string; filePath: string }>) {
  const bySlug = new Map<string, string[]>()
  for (const { slug, filePath } of loaded) {
    bySlug.set(slug, [...(bySlug.get(slug) ?? []), filePath])
  }

  const conflicts = [...bySlug.entries()].filter(([, paths]) => paths.length > 1)
  if (conflicts.length > 0) {
    const detail = conflicts.map(([slug, paths]) => `${slug}: ${paths.join(", ")}`).join(" | ")
    throw new Error(`[content/articles] 중복된 slug가 있습니다 — ${detail}`)
  }
}

/**
 * lib/data/series-presets.ts(단일 소스)를 slug → SeriesMembership[] 역인덱스로 뒤집는다.
 * 정렬/그룹핑이 필요 없다 — 레지스트리의 slugs 배열 순서가 이미 시리즈 내 순번이므로 배열
 * 인덱스 조회만으로 O(1)에 index/total/prev/next를 도출한다. 한 slug가 여러 SeriesPreset에
 * 동시 등장할 수 있어(다중 시리즈 소속) 값은 항상 배열이다.
 *
 * assertNoDuplicateSlugs와 동일한 fail-fast 컨벤션 — 오탈자·파일명 변경으로 인한 깨진 참조,
 * id/slug 중복을 조용히 넘기지 않고 빌드를 막는다.
 */
function buildSeriesIndex(loaded: Article[]): Map<string, SeriesMembership[]> {
  const articleBySlug = new Map(loaded.map((article) => [article.slug, article]))
  const seenPresetIds = new Set<string>()
  const index = new Map<string, SeriesMembership[]>()

  for (const preset of seriesPresets) {
    if (seenPresetIds.has(preset.id)) {
      throw new Error(`[series-presets] 중복된 시리즈 id입니다 — ${preset.id}`)
    }
    seenPresetIds.add(preset.id)

    if (preset.slugs.length === 0) {
      throw new Error(`[series-presets] "${preset.id}" 시리즈의 slugs가 비어 있습니다`)
    }

    const seenSlugs = new Set<string>()
    for (const slug of preset.slugs) {
      if (seenSlugs.has(slug)) {
        throw new Error(`[series-presets] "${preset.id}" 시리즈에 slug가 중복 등록됐습니다 — ${slug}`)
      }
      seenSlugs.add(slug)
      if (!articleBySlug.has(slug)) {
        throw new Error(`[series-presets] "${preset.id}" 시리즈가 존재하지 않는 slug를 참조합니다 — ${slug}`)
      }
    }

    const episodes = preset.slugs.map((slug) => {
      const article = articleBySlug.get(slug)!
      return { slug: article.slug, title: article.title }
    })

    preset.slugs.forEach((slug, i) => {
      const membership: SeriesMembership = {
        id: preset.id,
        label: preset.label,
        index: i + 1,
        total: preset.slugs.length,
        episodes,
      }
      index.set(slug, [...(index.get(slug) ?? []), membership])
    })
  }

  return index
}

function attachSeries(loaded: Article[]): Article[] {
  const index = buildSeriesIndex(loaded)
  return loaded.map((article) => {
    const membership = index.get(article.slug)
    return membership ? { ...article, series: membership } : article
  })
}

export interface LoadedContent {
  articles: Article[]
  blogSlugs: string[]
}

export async function loadArticles(): Promise<LoadedContent> {
  const filenames = fs
    .readdirSync(CONTENT_DIR, { recursive: true, encoding: "utf-8" })
    .filter((name) => name.endsWith(".md"))
  const filePaths = filenames.map((name) => path.join(CONTENT_DIR, name))

  // wikilink가 다른 글을 참조할 수 있으므로, 렌더링 전에 전체 글의 frontmatter부터 훑어
  // title/slug → slug 매핑을 먼저 만든다.
  const parsedFiles = filePaths.map((filePath) => parseArticleFile(filePath))
  const titleToSlug = buildTitleToSlugMap(parsedFiles)

  const loaded = await Promise.all(parsedFiles.map((parsed) => loadArticleFile(parsed, titleToSlug)))
  assertNoDuplicateSlugs(loaded.map((article, index) => ({ slug: article.slug, filePath: filePaths[index] })))

  // showOnHomepage 여부와 무관하게 전체 글을 대상으로 시리즈를 attach한다 — 시리즈 상세 페이지
  // 자체는 홈 노출 여부와 무관하게 항상 존재하므로(prev/next 체인과 달리 별도 chain 필터링 없음).
  const withSeries = attachSeries(loaded)

  // 문자열 그대로 비교하면 "2026-7-12"처럼 자릿수가 안 맞는 날짜가 "2026-07-27"보다 사전순으로
  // 커져버려 최신순이 깨지므로, 실제 Date로 파싱한 타임스탬프로 비교한다. date가 완전히 같으면
  // fs.readdirSync의 반환 순서(OS/파일시스템에 따라 달라짐, 보장 없음)에 기대는 대신 slug(파일명
  // 기반이라 assertNoDuplicateSlugs로 이미 유일함이 보장됨)로 tie-break해 항상 같은 순서가 나오게 한다.
  const sortedDesc = [...withSeries].sort((a, b) => {
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime()
    return dateDiff !== 0 ? dateDiff : a.slug < b.slug ? -1 : 1
  })

  // prev/next 체인은 showOnHomepage 아티클끼리만 계산한다 — 홈 그리드에서 제외된 글은 발행일이
  // 아무리 최신이어도 다른 글의 이전/다음 글로 끼어들지 않는다.
  const chain = sortedDesc.filter((article) => article.showOnHomepage)
  const chainWithNav = attachPrevNext(chain)

  const bySlug = new Map(chainWithNav.map((article) => [article.slug, article]))
  const articles = sortedDesc.map((article) => bySlug.get(article.slug) ?? article)
  const blogSlugs = chain.map((article) => article.slug)

  return { articles, blogSlugs }
}
