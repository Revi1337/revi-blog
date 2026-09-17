import useSWR from "swr"

import { jsonFetcher } from "@/lib/fetcher"
import type { SearchIndexEntry } from "@/lib/data/types"

interface UseSearchIndexResult {
  searchIndex: SearchIndexEntry[] | undefined
  error: unknown
  retry: () => void
}

/**
 * shouldLoad가 true가 되기 전까지는 SWR key가 null이라 fetch 자체가 발생하지 않는다(server-serialization
 * 회피 — nav-bar.tsx가 idle 시점 또는 검색 오픈 시점에만 shouldLoad를 true로 바꾼다). 로딩 중에는
 * searchIndex가 undefined라 호출부가 "결과 없음"과 "아직 안 불러옴"을 구분할 수 있고, error가 있으면
 * "영원히 로딩 중"으로 착각하지 않고 실패 상태를 별도로 보여줄 수 있다.
 */
export function useSearchIndex(shouldLoad: boolean): UseSearchIndexResult {
  const { data, error, mutate } = useSWR<SearchIndexEntry[]>(
    shouldLoad ? "/search-index.json" : null,
    jsonFetcher
  )
  return { searchIndex: data, error, retry: () => mutate() }
}
