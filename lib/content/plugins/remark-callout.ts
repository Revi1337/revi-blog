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
  | "collapse"
  | "abstract"
  | "todo"
  | "failure"

/** `[#TYPE]` 원본 문자열(대소문자 무관) → 정규화된 스타일 타입. GitHub Alerts 별칭 + Obsidian
 * 기본 콜아웃 13종의 타입/별칭을 포함(기존에 있던 타입의 아이콘·색은 그대로 두고, Obsidian에는
 * 있지만 우리에게 없던 abstract/todo/failure 타입과 각 타입의 누락된 별칭만 추가함).
 * CAUTION은 Obsidian 기준 danger가 아니라 warning의 별칭이라 그에 맞게 매핑(기존엔 danger로
 * 잘못 매핑돼 있었음). important는 Obsidian에서 tip의 별칭일 뿐이지만, 이 프로젝트는 이미
 * important를 별도 강조색·아이콘을 가진 독립 타입으로 쓰고 있어(기존 로고 유지 요청) tip의
 * 별칭으로는 추가하지 않음 — IMPORTANT 키는 계속 그 자체의 독립 타입을 가리킨다. */
const TYPE_MAP: Record<string, ResolvedType> = {
  NOTE: "note",
  TIP: "tip",
  HINT: "tip",
  WARNING: "warning",
  CAUTION: "warning",
  ATTENTION: "warning",
  DANGER: "danger",
  ERROR: "danger",
  INFO: "info",
  SUCCESS: "success",
  CHECK: "success",
  DONE: "success",
  QUESTION: "question",
  HELP: "question",
  FAQ: "question",
  BUG: "bug",
  EXAMPLE: "example",
  QUOTE: "quote",
  CITE: "quote",
  IMPORTANT: "important",
  /** note/info 같은 특정 의미 없이 그냥 접히는 섹션 전용 — remark-callout-comeau.ts의 COLLAPSE와
   * 동일한 용도. 전용 강조색이 없어 --callout-accent가 정의되지 않고 --color-outline-variant로
   * 자연히 떨어진다(중립 회색) */
  COLLAPSE: "collapse",
  ABSTRACT: "abstract",
  SUMMARY: "abstract",
  TLDR: "abstract",
  TODO: "todo",
  FAILURE: "failure",
  FAIL: "failure",
  MISSING: "failure",
}

interface IconPath {
  tag: "path" | "circle" | "polyline" | "rect"
  attrs: Record<string, string>
}

/** lucide-react(이미 프로젝트 의존성) 아이콘의 path 데이터를 정적 SVG로 재현 — bodyHtml은 순수 HTML이라 React 컴포넌트를 쓸 수 없다(research.md) */
const ICONS: Record<ResolvedType, IconPath[]> = {
  /** lucide Notebook — 기존엔 info와 완전히 동일한 원형 아이콘을 썼는데(구분 불가), 나머지
   * 타입들이 대부분 원/삼각형 등 닫힌 곡선 도형이라 각진 실루엣이 그 사이에서 더 잘 구분되고,
   * "note"라는 의미에도 pencil(edit에 더 가까운 의미)보다 직접적이라 이걸로 교체함
   * (연필 vs 공책 두 후보를 실측 비교한 뒤 결정) */
  note: [
    { tag: "path", attrs: { d: "M2 6h4" } },
    { tag: "path", attrs: { d: "M2 10h4" } },
    { tag: "path", attrs: { d: "M2 14h4" } },
    { tag: "path", attrs: { d: "M2 18h4" } },
    { tag: "rect", attrs: { width: "16", height: "20", x: "4", y: "2", rx: "2" } },
    { tag: "path", attrs: { d: "M16 2v20" } },
  ],
  /** lucide BookOpen — 기존엔 원+세로선+점(느낌표류 아이콘과 실루엣이 거의 같아 헷갈림)이었는데,
   * "정리된 지식/스펙"이라는 의미도 살고 원형 위주 아이콘들 사이에서도 구분되는 펼쳐진 책 모양으로
   * 교체(BookOpen vs MessageSquareText 실측 비교 후 결정) */
  info: [
    { tag: "path", attrs: { d: "M12 7v14" } },
    {
      tag: "path",
      attrs: {
        d: "M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z",
      },
    },
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
  /** lucide MessageSquareText — 기존 코드 괄호(<>) 아이콘 대신 말풍선으로 교체
   * (BookOpen vs MessageSquareText 실측 비교 후 info 아이콘 후보였던 이 모양을 example에 배정) */
  example: [
    { tag: "path", attrs: { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" } },
    { tag: "path", attrs: { d: "M13 8H7" } },
    { tag: "path", attrs: { d: "M17 12H7" } },
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
  /** lucide UnfoldVertical — remark-callout-comeau.ts의 collapse 타입과 동일한 아이콘 */
  collapse: [
    { tag: "path", attrs: { d: "M12 22v-6" } },
    { tag: "path", attrs: { d: "M12 8V2" } },
    { tag: "path", attrs: { d: "M4 12H2" } },
    { tag: "path", attrs: { d: "M10 12H8" } },
    { tag: "path", attrs: { d: "M16 12h-2" } },
    { tag: "path", attrs: { d: "M22 12h-2" } },
    { tag: "path", attrs: { d: "m15 19-3 3-3-3" } },
    { tag: "path", attrs: { d: "m15 5-3-3-3 3" } },
  ],
  /** lucide ScrollText — 처음엔 ClipboardList였는데, note(노트북)/info(펼쳐진 책)/example(말풍선)이
   * 이미 사각 실루엣이라 그 사이에서 묻혀 두루마리 모양으로 교체(실측 비교 후 결정) */
  abstract: [
    { tag: "path", attrs: { d: "M15 12h-5" } },
    { tag: "path", attrs: { d: "M15 8h-5" } },
    { tag: "path", attrs: { d: "M19 17V5a2 2 0 0 0-2-2H4" } },
    {
      tag: "path",
      attrs: {
        d: "M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3",
      },
    },
  ],
  /** lucide ListTodo */
  todo: [
    { tag: "rect", attrs: { x: "3", y: "5", width: "6", height: "6", rx: "1" } },
    { tag: "path", attrs: { d: "m3 17 2 2 4-4" } },
    { tag: "path", attrs: { d: "M13 6h8" } },
    { tag: "path", attrs: { d: "M13 12h8" } },
    { tag: "path", attrs: { d: "M13 18h8" } },
  ],
  /** lucide X — danger(shield-x)와 의미는 가깝지만(둘 다 부정적/실패 상태) 아이콘은 방패 없이
   * 단순 X만 써서 구분함 */
  failure: [
    { tag: "path", attrs: { d: "M18 6 6 18" } },
    { tag: "path", attrs: { d: "m6 6 12 12" } },
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
