import type { SeriesPreset } from "@/lib/data/types"

/**
 * 시리즈 소속/순서의 단일 소스 — 글 원문(frontmatter)은 이 정보를 전혀 모른다.
 * lib/data/quick-search-presets.ts와 동일한 "중앙 정의 파일" 패턴: 글쪽이 아니라 이 배열이
 * 소속 관계를 소유한다. slugs 배열 순서가 곧 시리즈 내 편 순서다.
 *
 * 검증용 더미 데이터(specs/016-article-series/tasks.md T005) — _series-alpha가 두 시리즈에
 * 동시 소속되도록 구성해 다중 소속 시나리오(User Story 3)를 커버한다.
 */
export const seriesPresets: SeriesPreset[] = [
  { id: "test-pair", label: "Test Pair Series", slugs: ["_series-alpha", "_series-beta"] },
  { id: "test-solo", label: "Test Solo Series", slugs: ["_series-alpha"] },
]
