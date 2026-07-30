import useSWR from "swr"

import type { GlobalStats } from "@/lib/stats/get-stats"

export interface ArticleStats extends GlobalStats {
  views: number
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function useVisitorStats(slug?: string): GlobalStats | ArticleStats | undefined {
  const key = slug ? `/api/stats/${slug}` : "/api/stats"
  const { data } = useSWR<GlobalStats | ArticleStats>(key, fetcher)
  return data
}
