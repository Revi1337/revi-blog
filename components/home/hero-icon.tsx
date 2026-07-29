import { Eye, Layers, PenLine, Settings2, Sparkles } from "lucide-react"
import type { LucideIcon } from "lucide-react"

const ICON_MAP: Record<string, LucideIcon> = {
  visibility: Eye,
  settings_suggest: Settings2,
  layers: Layers,
  edit_note: PenLine,
}

export function HeroIcon({ name, className }: { name?: string; className?: string }) {
  const Icon = (name && ICON_MAP[name]) || Sparkles
  return <Icon className={className} />
}
