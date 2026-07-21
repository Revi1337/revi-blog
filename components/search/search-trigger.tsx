"use client"

import { Search } from "lucide-react"

interface SearchTriggerProps {
  onOpen: () => void
}

/**
 * 실제 입력 필드처럼 보이지만 텍스트를 직접 입력받지 않는다 — 클릭하면 검색 모달을 연다(FR-003).
 * placeholder 문구와 Ctrl+K 뱃지는 항상 함께 노출된다(FR-001, FR-002).
 */
export function SearchTrigger({ onOpen }: SearchTriggerProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Open search"
      className="flex h-8 min-w-0 items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-1.5 text-left transition-colors hover:bg-surface-container-highest/50"
    >
      <Search className="h-4 w-4 shrink-0 text-on-surface-variant" aria-hidden="true" />
      <span className="truncate font-code-sm text-code-sm leading-[18px] text-on-surface-variant">
        Search articles...
      </span>
      <span className="ml-1 flex shrink-0 items-center gap-0.5 rounded border border-outline-variant px-1.5 py-0.5 font-code-sm text-[11px] leading-none text-outline">
        Ctrl K
      </span>
    </button>
  )
}
