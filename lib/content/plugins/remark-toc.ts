import { visit } from "unist-util-visit"
import { toString } from "mdast-util-to-string"
import GithubSlugger from "github-slugger"
import type { Root, Heading } from "mdast"
import type { VFile } from "vfile"

import type { TocItem } from "@/lib/data/types"

/**
 * 모든 heading(h1~h6)을 순회하며 github-slugger로 id를 부여하고, h2/h3/h4만 TocItem[]으로 수집한다.
 * heading id 부여와 TOC 수집을 한 패스·단일 slugger 인스턴스로 처리해 앵커 id가 항상 일치하도록
 * 보장한다(research.md TOC 추출 결정). h1/h5/h6은 딥링크용 id만 가지고 TOC 목록에는 노출되지
 * 않는다(spec.md FR-004).
 */
export function remarkToc() {
  return (tree: Root, file: VFile) => {
    const slugger = new GithubSlugger()
    const items: TocItem[] = []
    let h2Order = 0
    let h3Order = 0
    let h4Order = 0

    visit(tree, "heading", (node: Heading) => {
      const label = toString(node)
      const id = slugger.slug(label)

      node.data = node.data ?? {}
      node.data.hProperties = { ...node.data.hProperties, id }

      if (node.depth !== 2 && node.depth !== 3 && node.depth !== 4) return

      let order: string
      if (node.depth === 2) {
        h2Order += 1
        h3Order = 0
        h4Order = 0
        order = String(h2Order).padStart(2, "0")
      } else if (node.depth === 3) {
        h3Order += 1
        h4Order = 0
        order = `${String(h2Order).padStart(2, "0")}.${h3Order}`
      } else {
        h4Order += 1
        order = `${String(h2Order).padStart(2, "0")}.${h3Order}.${h4Order}`
      }

      items.push({ id, label, order, depth: node.depth })
    })

    file.data.toc = items
  }
}
