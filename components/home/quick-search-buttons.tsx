import type { QuickSearchPreset } from "@/lib/data/quick-search-presets"

export function QuickSearchButtons({
  presets,
  activePresetId,
  onSelect,
}: {
  presets: QuickSearchPreset[]
  activePresetId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <div className="mb-stack-lg flex flex-wrap gap-2">
      {presets.map((preset) => {
        const isActive = preset.id === activePresetId
        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => onSelect(preset.id)}
            aria-pressed={isActive}
            className={[
              "shrink-0 rounded border px-3 py-1.5 font-code-sm text-code-sm whitespace-nowrap transition-colors",
              isActive
                ? "border-primary bg-primary text-on-primary dark:border-primary-fixed dark:bg-primary-fixed dark:text-on-primary-fixed"
                : "border-outline-variant bg-surface-container text-on-surface-variant hover:border-primary hover:text-primary dark:hover:border-primary-fixed dark:hover:text-primary-fixed",
            ].join(" ")}
          >
            {preset.label}
          </button>
        )
      })}
    </div>
  )
}
