import useSWR from "swr"

import type { SearchIndexEntry } from "@/lib/data/types"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

/**
 * shouldLoad가 true가 되기 전까지는 SWR key가 null이라 fetch 자체가 발생하지 않는다(server-serialization
 * 회피 — nav-bar.tsx가 idle 시점 또는 검색 오픈 시점에만 shouldLoad를 true로 바꾼다). 로딩 중에는
 * undefined를 반환하므로 호출부가 "결과 없음"과 "아직 안 불러옴"을 구분할 수 있다.
 */
export function useSearchIndex(shouldLoad: boolean): SearchIndexEntry[] | undefined {
  const { data } = useSWR<SearchIndexEntry[]>(shouldLoad ? "/search-index.json" : null, fetcher)
  return data
}
