import { BookOpen, Code, Folder, Palette, Rss } from "lucide-react"
import type { LucideIcon } from "lucide-react"

const ICON_MAP: Record<string, LucideIcon> = {
  code: Code,
  palette: Palette,
  "book-open": BookOpen,
  rss: Rss,
}

export function BookmarkCategoryIcon({
  name,
  className,
}: {
  name?: string
  className?: string
}) {
  const Icon = (name && ICON_MAP[name]) || Folder
  return <Icon className={className} />
}
