import { unified } from "unified"
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
import { remarkImages } from "@/lib/content/plugins/remark-images"
import { remarkPlainText } from "@/lib/content/plugins/remark-plain-text"
import { rehypeCodeCopyButton } from "@/lib/content/plugins/rehype-code-copy-button"
import { rehypeHeadingAnchor } from "@/lib/content/plugins/rehype-heading-anchor"
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
  .use(remarkCallout)
  .use(remarkCalloutComeau)
  .use(remarkHighlight)
  .use(remarkMetrics)
  .use(remarkImages)
  .use(remarkToc)
  .use(remarkPlainText)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeHeadingAnchor)
  .use(rehypePrettyCode, {
    theme: { dark: "github-dark-default", light: "github-light-default" },
    keepBackground: false,
  })
  .use(rehypeCodeCopyButton)
  .use(rehypeKatex, { throwOnError: false, errorColor: "var(--color-error)" })
  .use(rehypeStringify, { allowDangerousHtml: true })

export async function renderMarkdown(rawBody: string): Promise<RenderResult> {
  const file = await processor.process(rawBody)
  return {
    bodyHtml: String(file),
    toc: (file.data.toc as TocItem[] | undefined) ?? [],
    plainBody: (file.data.plainText as string | undefined) ?? "",
    images: (file.data.images as ArticleImage[] | undefined) ?? [],
  }
}
