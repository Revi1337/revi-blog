import { visit } from "unist-util-visit"
import type { Root, Element } from "hast"

/** lucide-react의 copy/check 아이콘을 정적 SVG로 재현 — bodyHtml은 순수 HTML이라 React 컴포넌트를 쓸 수 없다(remark-callout.ts와 동일한 이유) */
const COPY_ICON: Element = {
  type: "element",
  tagName: "svg",
  properties: {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: ["code-copy-icon"],
    "aria-hidden": "true",
  },
  children: [
    { type: "element", tagName: "rect", properties: { width: "14", height: "14", x: "8", y: "8", rx: "2" }, children: [] },
    {
      type: "element",
      tagName: "path",
      properties: { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" },
      children: [],
    },
  ],
}

const CHECK_ICON: Element = {
  type: "element",
  tagName: "svg",
  properties: {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: ["code-copy-check-icon"],
    "aria-hidden": "true",
  },
  children: [{ type: "element", tagName: "path", properties: { d: "M20 6 9 17l-5-5" }, children: [] }],
}

function copyButtonNode(): Element {
  return {
    type: "element",
    tagName: "button",
    properties: {
      type: "button",
      className: ["code-copy-button"],
      "data-code-copy-button": "",
      "aria-label": "코드 복사",
    },
    children: [COPY_ICON, CHECK_ICON],
  }
}

/** rehype-pretty-code가 생성한 `<figure data-rehype-pretty-code-figure>`마다 복사 버튼을 삽입한다.
 * 클릭 처리는 정적 HTML 바깥의 클라이언트 컴포넌트(CodeCopyHandler)가 이벤트 위임으로 담당한다. */
export function rehypeCodeCopyButton() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "figure" || !("data-rehype-pretty-code-figure" in node.properties)) return
      node.children.push(copyButtonNode())
    })
  }
}
