import { unified } from "unified"
import { VFile } from "vfile"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import remarkRehype from "remark-rehype"
import rehypePrettyCode from "rehype-pretty-code"
import rehypeKatex from "rehype-katex"
import rehypeStringify from "rehype-stringify"

import { remarkMetrics } from "@/lib/content/plugins/remark-metrics"
import { remarkToc } from "@/lib/content/plugins/remark-toc"
import { remarkCallout } from "@/lib/content/plugins/remark-callout"
import { remarkCalloutComeau } from "@/lib/content/plugins/remark-callout-comeau"
import { remarkHighlight } from "@/lib/content/plugins/remark-highlight"
import { remarkObsidianLinks } from "@/lib/content/plugins/remark-obsidian-links"
import { remarkImages } from "@/lib/content/plugins/remark-images"
import { remarkPlainText } from "@/lib/content/plugins/remark-plain-text"
import { remarkHeadingFold } from "@/lib/content/plugins/remark-heading-fold"
import { rehypeCodeCopyButton } from "@/lib/content/plugins/rehype-code-copy-button"
import { rehypeCodeLanguageLabel } from "@/lib/content/plugins/rehype-code-language-label"
import { rehypeHeadingAnchor } from "@/lib/content/plugins/rehype-heading-anchor"
import { rehypePlantuml } from "@/lib/content/plugins/rehype-plantuml"
import type { TocItem, ArticleImage } from "@/lib/data/types"

export interface RenderResult {
  bodyHtml: string
  toc: TocItem[]
  plainBody: string
  images: ArticleImage[]
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkObsidianLinks)
  .use(remarkCallout)
  .use(remarkCalloutComeau)
  .use(remarkHighlight)
  .use(remarkMetrics)
  .use(remarkImages)
  .use(remarkToc)
  .use(remarkPlainText)
  .use(remarkHeadingFold)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeHeadingAnchor)
  .use(rehypePrettyCode, {
    theme: { dark: "github-dark-default", light: "github-light-default" },
    keepBackground: false,
  })
  .use(rehypePlantuml)
  .use(rehypeCodeCopyButton)
  .use(rehypeCodeLanguageLabel)
  .use(rehypeKatex, { throwOnError: false, errorColor: "var(--color-error)" })
  .use(rehypeStringify, { allowDangerousHtml: true })

export async function renderMarkdown(
  rawBody: string,
  titleToSlug: Map<string, string>
): Promise<RenderResult> {
  const input = new VFile({ value: rawBody, data: { titleToSlug } })
  const file = await processor.process(input)
  return {
    bodyHtml: String(file),
    toc: (file.data.toc as TocItem[] | undefined) ?? [],
    plainBody: (file.data.plainText as string | undefined) ?? "",
    images: (file.data.images as ArticleImage[] | undefined) ?? [],
  }
}
