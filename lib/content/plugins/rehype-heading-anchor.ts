import { visit } from "unist-util-visit"
import { toString } from "hast-util-to-string"
import type { Root, Element } from "hast"

/** octicon-link(GitHub 헤딩 앵커 아이콘)를 정적 SVG로 재현 — bodyHtml은 순수 HTML이라 React 컴포넌트를 쓸 수 없다(rehype-code-copy-button.ts와 동일한 이유) */
const ANCHOR_ICON: Element = {
  type: "element",
  tagName: "svg",
  properties: {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: ["heading-anchor-icon"],
    "aria-hidden": "true",
  },
  children: [
    {
      type: "element",
      tagName: "path",
      properties: { d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" },
      children: [],
    },
    {
      type: "element",
      tagName: "path",
      properties: { d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" },
      children: [],
    },
  ],
}

function anchorLinkNode(id: string, label: string): Element {
  return {
    type: "element",
    tagName: "a",
    properties: {
      className: ["heading-anchor"],
      href: `#${id}`,
      "aria-label": `${label} 섹션으로 이동`,
    },
    children: [ANCHOR_ICON],
  }
}

const ANCHORED_HEADING_TAGS = new Set(["h2", "h3", "h4"])

/** remarkToc가 h2/h3/h4에 부여한 id를 이용해, hover 시 나타나는 GitHub 스타일 anchor 링크를 heading 끝에 삽입한다.
 * heading 원래 내용을 inline span으로 감싸는 이유는, h2/h3/h4 자체는 block이라 그대로 두면 hover 영역이
 * 텍스트 우측 빈 공간까지 라인 전체로 넓어지기 때문 — 라벨 글자 위에서만 반응하도록 인라인 span으로 hover 영역을 좁힌다. */
export function rehypeHeadingAnchor() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (!ANCHORED_HEADING_TAGS.has(node.tagName)) return
      const id = node.properties?.id
      if (typeof id !== "string" || !id) return
      const label = toString(node)
      const labelSpan: Element = {
        type: "element",
        tagName: "span",
        properties: { className: ["heading-anchor-label"] },
        children: node.children,
      }
      node.children = [labelSpan, anchorLinkNode(id, label)]
    })
  }
}
