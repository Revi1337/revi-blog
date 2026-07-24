import { visit } from "unist-util-visit"
import type { Root, Blockquote, Paragraph, PhrasingContent, Text } from "mdast"

/** `[#TYPE]` 마커 — 기존 GitHub Alert 스타일 콜아웃(`[!TYPE]`, remark-callout.ts)과
 * 완전히 분리된 별도 문법. 두 시스템은 같은 문서 안에서 공존 가능하다 */
const MARKER_RE = /^\[#(\w+)\](?:\s+(.*))?$/

type ResolvedType = "note" | "info" | "tip" | "success" | "warning" | "danger" | "quote"

const TYPE_MAP: Record<string, ResolvedType> = {
  NOTE: "note",
  INFO: "info",
  TIP: "tip",
  SUCCESS: "success",
  WARNING: "warning",
  DANGER: "danger",
  QUOTE: "quote",
}

interface IconPath {
  tag: "path" | "circle"
  attrs: Record<string, string>
}

/** joshwcomeau.com 콜아웃의 좌측 곡선 장식(SVG 2겹)에 쓰인 좌표(라이브 사이트 실측). path1(cut)은
 * 페이지 배경색으로 박스 틴트 위를 "파내고", path2(stroke)가 그 경계를 accent 색으로 긋는다.
 *
 * Josh의 사이트는 아이콘(뱃지) 종류에 따라 곡선 자체가 다르다 — info/success는 완만한 57×69
 * viewBox 곡선("calm")을, warning은 더 길고 날카로운 75×70 viewBox 곡선("alert")을 쓴다.
 * danger/note/tip/quote 타입의 실물 예시는 참고한 글에 없어서, 위험도가 낮은 쪽은 calm에
 * 묶었다(danger 포함 — 사용자 확인 결과 calm이 맞음), warning만 유일하게 alert를 쓴다.
 * 두 variant 모두 바닥 꼬리가 6 units 폭으로 그려져 있어, 각자의 viewBox를 정확히 0.5배로
 * 렌더하면(28.5×34.5px / 37.5×35px) 꼬리가 3px로 맞아떨어져 아래 직선 바(3px)와 이음새가
 * 매끄럽다 — 이 "viewBox를 렌더 크기의 정확히 2배로 설계" 하는 게 핵심 트릭이다
 * (https://www.joshwcomeau.com/css/anchor-positioning/ 참고) */
type SwooshVariant = "calm" | "alert"

const SWOOSH_VARIANT_BY_TYPE: Record<ResolvedType, SwooshVariant> = {
  note: "calm",
  info: "calm",
  tip: "calm",
  success: "calm",
  quote: "calm",
  danger: "calm",
  warning: "alert",
}

const SWOOSH_GEOMETRY: Record<SwooshVariant, { viewBox: string; width: string; height: string; cut: string; stroke: string }> = {
  calm: {
    viewBox: "0 0 57 69",
    width: "28.5",
    height: "34.5",
    cut: "M54 0V0.716804C54 25.9434 35.0653 47.1517 10 50L0 57V0H54Z",
    stroke:
      "M56.9961 4.15364C57.0809 2.49896 55.8083 1.08879 54.1536 1.00394C52.499 0.919082 51.0888 2.19168 51.0039 3.84636L56.9961 4.15364ZM9.09704 51.7557L8.49716 48.8163L9.09704 51.7557ZM6 69V59.2227H0V69H6ZM9.69692 54.6951L14.3373 53.7481L13.1375 47.8693L8.49716 48.8163L9.69692 54.6951ZM14.3373 53.7481C38.202 48.8777 55.7486 28.4783 56.9961 4.15364L51.0039 3.84636C49.8967 25.4384 34.3213 43.5461 13.1375 47.8693L14.3373 53.7481ZM6 59.2227C6 57.0268 7.54537 55.1342 9.69692 54.6951L8.49716 48.8163C3.55195 49.8255 0 54.1756 0 59.2227H6Z",
  },
  alert: {
    viewBox: "0 0 75 70",
    width: "37.5",
    height: "35",
    cut: "M54.3545 15.0483L46 0.5H0V64L5.42113 56.1695C7.66253 52.9319 11.3497 51 15.2874 51H33.542C51.9925 51 63.5426 31.0483 54.3545 15.0483Z",
    stroke:
      "M52.1101 4.52096C51.2932 3.07946 49.4625 2.57308 48.021 3.38993C46.5795 4.20678 46.0731 6.03754 46.8899 7.47904L52.1101 4.52096ZM15 54H37.2466V48H15V54ZM0 63V69.5H6V63H0ZM46.8899 7.47904L53.777 19.6328L58.9972 16.6747L52.1101 4.52096L46.8899 7.47904ZM37.2466 54C56.4023 54 68.4412 33.3405 58.9972 16.6747L53.777 19.6328C60.9545 32.2988 51.8049 48 37.2466 48V54ZM15 48C6.71573 48 0 54.7157 0 63H6C6 58.0294 10.0294 54 15 54V48Z",
  },
}

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
  success: [
    { tag: "path", attrs: { d: "M21.801 10A10 10 0 1 1 17 3.335" } },
    { tag: "path", attrs: { d: "m9 11 3 3L22 4" } },
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
      width: "32",
      height: "32",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className: "callout-comeau-icon",
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

function railNode(resolvedType: ResolvedType) {
  const variant = SWOOSH_VARIANT_BY_TYPE[resolvedType]
  const geo = SWOOSH_GEOMETRY[variant]
  return {
    type: "calloutComeauRail",
    data: {
      hName: "div",
      hProperties: { className: ["callout-comeau-rail", `callout-comeau-rail--${variant}`], "aria-hidden": "true" },
      hChildren: [
        {
          type: "element",
          tagName: "svg",
          properties: {
            className: ["callout-comeau-swoosh"],
            width: geo.width,
            height: geo.height,
            viewBox: geo.viewBox,
            preserveAspectRatio: "none",
          },
          children: [
            {
              type: "element",
              tagName: "path",
              properties: { className: ["callout-comeau-swoosh-cut"], d: geo.cut },
              children: [],
            },
            {
              type: "element",
              tagName: "path",
              properties: { className: ["callout-comeau-swoosh-stroke"], d: geo.stroke },
              children: [],
            },
          ],
        },
        {
          type: "element",
          tagName: "div",
          properties: { className: ["callout-comeau-bar"] },
          children: [],
        },
      ] satisfies HastNode[],
    },
  }
}

/** 컨테이너 쿼리로 폭이 좁아졌을 때 rail/badge 대신 노출되는 단순 바.
 * `.callout-comeau` 자신은 스스로가 세운 컨테이너를 기준으로 쿼리할 수 없어(자기 참조 금지),
 * border-left 같은 컨테이너 자신의 속성 토글이 아니라 이런 별도 자식 엘리먼트로 구현해야 한다 */
function fallbackBarNode() {
  return {
    type: "calloutComeauFallbackBar",
    data: {
      hName: "div",
      hProperties: { className: ["callout-comeau-fallback-bar"], "aria-hidden": "true" },
    },
  }
}

function badgeNode(resolvedType: ResolvedType) {
  return {
    type: "calloutComeauBadge",
    data: {
      hName: "div",
      hProperties: { className: ["callout-comeau-badge"] },
      hChildren: [iconElement(resolvedType)] satisfies HastNode[],
    },
  }
}

function titleNode(title: string) {
  return {
    type: "calloutComeauTitle",
    data: {
      hName: "strong",
      hProperties: { className: ["callout-comeau-title"] },
      hChildren: [{ type: "text", value: title }] satisfies HastNode[],
    },
  }
}

function isTextNode(node: PhrasingContent | undefined): node is Text {
  return node?.type === "text"
}

/**
 * `> [#TYPE]` blockquote를 joshwcomeau.com 스타일 콜아웃 hast로 치환한다.
 * `[#TYPE]`에 매치하지 않는 blockquote는 그대로 반환한다(no-op).
 */
export function remarkCalloutComeau() {
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

      const [, rawType, customTitle] = match
      const resolvedType = TYPE_MAP[rawType.toUpperCase()] ?? "note"
      const title = customTitle?.trim() ? customTitle.trim() : rawType

      const remainderChildren: PhrasingContent[] = []
      if (restOfLine.length > 0) remainderChildren.push({ type: "text", value: restOfLine })
      remainderChildren.push(...(firstParagraph as Paragraph).children.slice(1))

      const bodyChildren = [
        ...(remainderChildren.length > 0 ? [{ type: "paragraph", children: remainderChildren } as Paragraph] : []),
        ...node.children.slice(1),
      ]

      const body = {
        type: "calloutComeauBody",
        data: { hName: "div", hProperties: { className: ["callout-comeau-body"] } },
        children: bodyChildren,
      }

      node.children = [
        railNode(resolvedType),
        fallbackBarNode(),
        badgeNode(resolvedType),
        titleNode(title),
        body,
      ] as unknown as Blockquote["children"]
      node.data = {
        ...node.data,
        hName: "aside",
        hProperties: { className: ["callout-comeau", `callout-comeau-${resolvedType}`] },
      }
    })
  }
}
