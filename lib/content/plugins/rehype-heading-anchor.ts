import { visit } from "unist-util-visit"
import { toString } from "hast-util-to-string"
import type { Root, Element, ElementContent } from "hast"

/** 헤딩 라벨 전체를 감싸는 링크 — href="#id"라 우클릭 "링크 주소 복사"/가운데 클릭 새 탭 열기/
 * 스크린 리더의 링크 인식이 전부 네이티브로 유지된다. 클릭 시 실제 이동은
 * heading-anchor-scroll-handler.tsx(document 레벨 delegated 클릭)가 TOC 클릭과 동일한
 * scrollToHeadingInstant를 호출해 처리한다 — 이 노드 자체엔 onClick이 없다(정적 HTML이라 React
 * 핸들러를 못 붙임, rehype-code-copy-button.ts와 동일한 제약). 별도의 hover-reveal 아이콘은 두지
 * 않는다 — 헤딩 영역은 이 앵커 역할만 하면 된다(사용자 요청). */
function anchorLinkNode(id: string, label: string, children: ElementContent[]): Element {
  return {
    type: "element",
    tagName: "a",
    properties: {
      className: ["heading-anchor"],
      href: `#${id}`,
      "aria-label": `${label} 섹션으로 이동`,
    },
    children,
  }
}

const ANCHORED_HEADING_TAGS = new Set(["h2", "h3", "h4"])

/** remarkToc가 h2/h3/h4에 부여한 id를 이용해, 헤딩 라벨 전체를 `<a href="#id">`로 감싼다. */
export function rehypeHeadingAnchor() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (!ANCHORED_HEADING_TAGS.has(node.tagName)) return
      const id = node.properties?.id
      if (typeof id !== "string" || !id) return
      const label = toString(node)
      node.children = [anchorLinkNode(id, label, node.children)]
    })
  }
}
