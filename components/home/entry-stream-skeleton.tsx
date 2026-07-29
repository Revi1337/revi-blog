const PLACEHOLDER_CARD_COUNT = 9
const PLACEHOLDER_PRESET_COUNT = 6

export function EntryStreamSkeleton() {
  return (
    <div className="animate-pulse" aria-hidden="true">
      <div className="mb-stack-lg flex items-end justify-between border-l-4 border-outline-variant pl-4">
        <div className="h-10 w-48 rounded bg-surface-container" />
        <div className="h-5 w-24 rounded bg-surface-container" />
      </div>

      <div className="mb-stack-lg flex flex-wrap gap-2">
        {Array.from({ length: PLACEHOLDER_PRESET_COUNT }, (_, i) => (
          <div
            key={i}
            className="h-8 w-24 shrink-0 rounded border border-outline-variant bg-surface-container"
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-stack-lg md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: PLACEHOLDER_CARD_COUNT }, (_, i) => (
          <div key={i} className="overflow-hidden rounded-lg bg-surface-container">
            <div className="h-56 bg-surface-container-high" />
            <div className="h-32 space-y-4 p-stack-md">
              <div className="h-5 w-3/4 rounded bg-surface-container-high" />
              <div className="h-4 w-16 rounded bg-surface-container-high" />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-section-gap h-10 w-full rounded bg-surface-container" />
    </div>
  )
}
