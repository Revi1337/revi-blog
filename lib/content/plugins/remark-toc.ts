import { visit } from "unist-util-visit"
import { toString } from "mdast-util-to-string"
import GithubSlugger from "github-slugger"
import type { Root, Heading } from "mdast"
import type { VFile } from "vfile"

import type { TocItem } from "@/lib/data/types"

/**
 * H2/H3 heading을 순회하며 github-slugger로 id를 부여하는 동시에 TocItem[]을 수집한다.
 * heading id 부여와 TOC 수집을 한 패스에서 처리해 앵커 id가 항상 일치하도록 보장한다
 * (research.md TOC 추출 결정).
 */
export function remarkToc() {
  return (tree: Root, file: VFile) => {
    const slugger = new GithubSlugger()
    const items: TocItem[] = []
    let order = 0

    visit(tree, "heading", (node: Heading) => {
      if (node.depth !== 2 && node.depth !== 3) return

      const label = toString(node)
      const id = slugger.slug(label)
      order += 1

      node.data = node.data ?? {}
      node.data.hProperties = { ...node.data.hProperties, id }

      items.push({ id, label, order })
    })

    file.data.toc = items
  }
}
