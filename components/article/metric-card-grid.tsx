import type { MetricCard } from "@/lib/data/types"

const ACCENT_CLASSES = [
  "hover:border-primary/50 dark:hover:border-primary-container/20 group-hover:text-primary dark:group-hover:text-primary-container",
  "hover:border-secondary/20 group-hover:text-secondary",
  "hover:border-error/20 group-hover:text-error",
]

export function MetricCardGrid({ metrics }: { metrics: MetricCard[] }) {
  if (metrics.length === 0) return null

  return (
    <div className="my-12 grid grid-cols-1 gap-6 md:grid-cols-3">
      {metrics.map((metric, index) => (
        <div
          key={metric.label}
          className={[
            "group rounded border border-outline-variant/10 bg-surface-container-low p-8 transition-all",
            ACCENT_CLASSES[index % ACCENT_CLASSES.length],
          ].join(" ")}
        >
          <div className="mb-3 font-label-caps text-[10px] tracking-[0.2em] text-on-surface-variant transition-colors">
            {metric.label}
          </div>
          <div className="mb-1 font-headline-lg text-4xl">{metric.value}</div>
        </div>
      ))}
    </div>
  )
}
