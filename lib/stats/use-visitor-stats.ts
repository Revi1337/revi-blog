import useSWR from "swr"

import { jsonFetcher } from "@/lib/fetcher"
import type { GlobalStats } from "@/lib/stats/get-stats"

export interface ArticleStats extends GlobalStats {
  views: number
}

interface UseVisitorStatsResult {
  stats: GlobalStats | ArticleStats | undefined
  error: unknown
}

export function useVisitorStats(slug?: string): UseVisitorStatsResult {
  const key = slug ? `/api/stats/${slug}` : "/api/stats"
  const { data, error } = useSWR<GlobalStats | ArticleStats>(key, jsonFetcher)
  return { stats: data, error }
}
