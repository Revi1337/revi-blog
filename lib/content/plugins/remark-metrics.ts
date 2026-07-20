import { visit } from "unist-util-visit"
import type { Root, Code } from "mdast"

const ACCENT_CLASSES = [
  "hover:border-primary/50 dark:hover:border-primary-container/20 group-hover:text-primary dark:group-hover:text-primary-container",
  "hover:border-secondary/20 group-hover:text-secondary",
  "hover:border-error/20 group-hover:text-error",
]

interface HastElement {
  type: "element"
  tagName: string
  properties: Record<string, string>
  children: Array<HastElement | { type: "text"; value: string }>
}

function parseMetricsBlock(value: string): Array<{ label: string; value: string }> {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .flatMap((line) => {
      const separatorIndex = line.indexOf(":")
      if (separatorIndex === -1) return []
      const label = line.slice(0, separatorIndex).trim()
      const rawValue = line.slice(separatorIndex + 1).trim()
      if (!label || !rawValue) return []
      return [{ label, value: rawValue }]
    })
}

function metricCardElement(metric: { label: string; value: string }, index: number): HastElement {
  return {
    type: "element",
    tagName: "div",
    properties: {
      className: [
        "group rounded border border-outline-variant/10 bg-surface-container-low p-8 transition-all",
        ACCENT_CLASSES[index % ACCENT_CLASSES.length],
      ].join(" "),
    },
    children: [
      {
        type: "element",
        tagName: "div",
        properties: {
          className: "mb-3 font-label-caps text-[10px] tracking-[0.2em] text-on-surface-variant transition-colors",
        },
        children: [{ type: "text", value: metric.label }],
      },
      {
        type: "element",
        tagName: "div",
        properties: { className: "mb-1 font-headline-lg text-4xl" },
        children: [{ type: "text", value: metric.value }],
      },
    ],
  }
}

/** ```metrics 코드펜스를 MetricCardGrid와 동등한 hast 마크업으로 치환한다 (data-model.md MetricsBlockDirective) */
export function remarkMetrics() {
  return (tree: Root) => {
    visit(tree, "code", (node: Code, index, parent) => {
      if (node.lang !== "metrics" || !parent || index === undefined) return

      const metrics = parseMetricsBlock(node.value)
      if (metrics.length === 0) return

      const gridElement: HastElement = {
        type: "element",
        tagName: "div",
        properties: { className: "my-12 grid grid-cols-1 gap-6 md:grid-cols-3" },
        children: metrics.map(metricCardElement),
      }

      parent.children[index] = {
        type: "metricsBlock",
        data: { hName: gridElement.tagName, hProperties: gridElement.properties, hChildren: gridElement.children },
      } as unknown as Code
    })
  }
}
