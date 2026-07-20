import { visit } from "unist-util-visit"
import type { Root, Text, Parent } from "mdast"

const HIGHLIGHT_RE = /==([^=]+)==/g

/**
 * `text` mdast 노드 안의 `==text==`만 `<mark>` hast로 치환한다. `inlineCode`/`code` 노드는
 * 애초에 `text` 노드 순회 대상이 아니므로 구조적으로 제외된다(data-model.md HighlightSpan).
 */
export function remarkHighlight() {
  return (tree: Root) => {
    visit(tree, "text", (node: Text, index, parent: Parent | undefined) => {
      if (!parent || index === undefined) return
      if (!node.value.includes("==")) return

      HIGHLIGHT_RE.lastIndex = 0
      const matches = [...node.value.matchAll(HIGHLIGHT_RE)]
      if (matches.length === 0) return

      const replacement: Array<Text | ReturnType<typeof markNode>> = []
      let cursor = 0
      for (const match of matches) {
        const start = match.index ?? 0
        if (start > cursor) {
          replacement.push({ type: "text", value: node.value.slice(cursor, start) })
        }
        replacement.push(markNode(match[1]))
        cursor = start + match[0].length
      }
      if (cursor < node.value.length) {
        replacement.push({ type: "text", value: node.value.slice(cursor) })
      }

      parent.children.splice(index, 1, ...(replacement as Parent["children"]))
      return index + replacement.length
    })
  }
}

function markNode(highlighted: string) {
  return {
    type: "highlightSpan",
    data: {
      hName: "mark",
      hChildren: [{ type: "text", value: highlighted }],
    },
  }
}
