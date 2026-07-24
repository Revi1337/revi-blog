import { visit } from "unist-util-visit"
import type { Root, Blockquote, Paragraph, PhrasingContent, Text } from "mdast"

const MARKER_RE = /^\[#(\w+)\]([-+])?(?:\s+(.*))?$/

type ResolvedType =
  | "note"
  | "tip"
  | "warning"
  | "danger"
  | "info"
  | "success"
  | "question"
  | "bug"
  | "example"
  | "quote"
  | "important"

/** `[#TYPE]` 원본 문자열(대소문자 무관) → 정규화된 스타일 타입. GitHub Alerts 별칭 포함 */
const TYPE_MAP: Record<string, ResolvedType> = {
  NOTE: "note",
  TIP: "tip",
  WARNING: "warning",
  DANGER: "danger",
  CAUTION: "danger",
  INFO: "info",
  SUCCESS: "success",
  QUESTION: "question",
  BUG: "bug",
  EXAMPLE: "example",
  QUOTE: "quote",
  IMPORTANT: "important",
}

interface IconPath {
  tag: "path" | "circle" | "polyline"
  attrs: Record<string, string>
}

/** lucide-react(이미 프로젝트 의존성) 아이콘의 path 데이터를 정적 SVG로 재현 — bodyHtml은 순수 HTML이라 React 컴포넌트를 쓸 수 없다(research.md) */
const ICONS: Record<ResolvedType, IconPath[]> = {
  note: [
    { tag: "circle", attrs: { cx: "12", cy: "12", r: "10" } },
    { tag: "path", attrs: { d: "M12 16v-4" } },
    { tag: "path", attrs: { d: "M12 8h.01" } },
  ],
  info: [
    { tag: "circle", attrs: { cx: "12", cy: "12", r: "10" } },
    { tag: "path", attrs: { d: "M12 16v-4" } },
    { tag: "path", attrs: { d: "M12 8h.01" } },
  ],
  tip: [
    {
      tag: "path",
      attrs: {
        d: "M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5",
      },
    },
    { tag: "path", attrs: { d: "M9 18h6" } },
    { tag: "path", attrs: { d: "M10 22h4" } },
  ],
  warning: [
    { tag: "path", attrs: { d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" } },
    { tag: "path", attrs: { d: "M12 9v4" } },
    { tag: "path", attrs: { d: "M12 17h.01" } },
  ],
  danger: [
    { tag: "path", attrs: { d: "m15 9-6 6" } },
    {
      tag: "path",
      attrs: {
        d: "M2.586 16.726A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2h6.624a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586z",
      },
    },
    { tag: "path", attrs: { d: "m9 9 6 6" } },
  ],
  success: [
    { tag: "path", attrs: { d: "M21.801 10A10 10 0 1 1 17 3.335" } },
    { tag: "path", attrs: { d: "m9 11 3 3L22 4" } },
  ],
  question: [
    { tag: "circle", attrs: { cx: "12", cy: "12", r: "10" } },
    { tag: "path", attrs: { d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" } },
    { tag: "path", attrs: { d: "M12 17h.01" } },
  ],
  bug: [
    { tag: "path", attrs: { d: "m8 2 1.88 1.88" } },
    { tag: "path", attrs: { d: "M14.12 3.88 16 2" } },
    { tag: "path", attrs: { d: "M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" } },
    {
      tag: "path",
      attrs: { d: "M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" },
    },
    { tag: "path", attrs: { d: "M12 20v-9" } },
    { tag: "path", attrs: { d: "M6.53 9C4.6 8.8 3 7.1 3 5" } },
    { tag: "path", attrs: { d: "M6 13H2" } },
    { tag: "path", attrs: { d: "M3 21c0-2.1 1.7-3.9 3.8-4" } },
    { tag: "path", attrs: { d: "M20.97 5c0 2.1-1.6 3.8-3.5 4" } },
    { tag: "path", attrs: { d: "M22 13h-4" } },
    { tag: "path", attrs: { d: "M17.2 17c2.1.1 3.8 1.9 3.8 4" } },
  ],
  example: [
    { tag: "polyline", attrs: { points: "16 18 22 12 16 6" } },
    { tag: "polyline", attrs: { points: "8 6 2 12 8 18" } },
  ],
  quote: [
    {
      tag: "path",
      attrs: {
        d: "M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z",
      },
    },
    {
      tag: "path",
      attrs: {
        d: "M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z",
      },
    },
  ],
  important: [
    { tag: "path", attrs: { d: "m3 11 18-5v12L3 14v-3z" } },
    { tag: "path", attrs: { d: "M11.6 16.8a3 3 0 1 1-5.8-1.6" } },
  ],
}

interface HastNode {
  type: "element" | "text"
  tagName?: string
  properties?: Record<string, string | boolean | string[]>
  value?: string
  children?: HastNode[]
}

function iconElement(resolvedType: ResolvedType): HastNode {
  return {
    type: "element",
    tagName: "svg",
    properties: {
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className: "callout-icon",
      "aria-hidden": "true",
    },
    children: ICONS[resolvedType].map((path) => ({
      type: "element",
      tagName: path.tag,
      properties: path.attrs,
      children: [],
    })),
  }
}

function headerNode(resolvedType: ResolvedType, title: string, collapseState: "none" | "collapsed" | "expanded") {
  return {
    type: "calloutHeader",
    data: {
      hName: collapseState === "none" ? "div" : "summary",
      hProperties: { className: ["callout-header"] },
      hChildren: [
        iconElement(resolvedType),
        {
          type: "element",
          tagName: "span",
          properties: { className: "callout-title" },
          children: [{ type: "text", value: title }],
        },
      ] satisfies HastNode[],
    },
  }
}

function isTextNode(node: PhrasingContent | undefined): node is Text {
  return node?.type === "text"
}

/**
 * `> [#TYPE]` blockquote를 콜아웃 hast로 치환한다. `[#TYPE]` 패턴에 매치하지 않는 blockquote는
 * 그대로 반환한다(no-op, data-model.md CalloutDirective).
 */
export function remarkCallout() {
  return (tree: Root) => {
    visit(tree, "blockquote", (node: Blockquote) => {
      const firstParagraph = node.children[0]
      if (!firstParagraph || firstParagraph.type !== "paragraph") return

      const firstChild = (firstParagraph as Paragraph).children[0]
      if (!isTextNode(firstChild)) return

      const newlineIndex = firstChild.value.indexOf("\n")
      const firstLine = newlineIndex === -1 ? firstChild.value : firstChild.value.slice(0, newlineIndex)
      const restOfLine = newlineIndex === -1 ? "" : firstChild.value.slice(newlineIndex + 1)

      const match = firstLine.match(MARKER_RE)
      if (!match) return

      const [, rawType, collapseMarker, customTitle] = match
      const collapseState: "none" | "collapsed" | "expanded" =
        collapseMarker === "-" ? "collapsed" : collapseMarker === "+" ? "expanded" : "none"
      const resolvedType = TYPE_MAP[rawType.toUpperCase()] ?? "note"
      const title = customTitle?.trim() ? customTitle.trim() : rawType

      const remainderChildren: PhrasingContent[] = []
      if (restOfLine.length > 0) remainderChildren.push({ type: "text", value: restOfLine })
      remainderChildren.push(...(firstParagraph as Paragraph).children.slice(1))

      const bodyChildren = [
        ...(remainderChildren.length > 0 ? [{ type: "paragraph", children: remainderChildren } as Paragraph] : []),
        ...node.children.slice(1),
      ]

      const header = headerNode(resolvedType, title, collapseState)
      const body = {
        type: "calloutBody",
        data: { hName: "div", hProperties: { className: ["callout-body"] } },
        children: bodyChildren,
      }

      node.children = [header, body] as unknown as Blockquote["children"]
      node.data = {
        ...node.data,
        hName: collapseState === "none" ? "div" : "details",
        hProperties: {
          className: ["callout", `callout-${resolvedType}`],
          ...(collapseState === "expanded" ? { open: true } : {}),
        },
      }
    })
  }
}
