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
import { remarkHighlight } from "@/lib/content/plugins/remark-highlight"
import type { TocItem } from "@/lib/data/types"

export interface RenderResult {
  bodyHtml: string
  toc: TocItem[]
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkCallout)
  .use(remarkHighlight)
  .use(remarkMetrics)
  .use(remarkToc)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypePrettyCode, {
    theme: { dark: "github-dark-default", light: "github-light-default" },
    keepBackground: false,
  })
  .use(rehypeKatex, { throwOnError: false, errorColor: "var(--color-error)" })
  .use(rehypeStringify, { allowDangerousHtml: true })

export async function renderMarkdown(rawBody: string): Promise<RenderResult> {
  const file = await processor.process(rawBody)
  return {
    bodyHtml: String(file),
    toc: (file.data.toc as TocItem[] | undefined) ?? [],
  }
}
