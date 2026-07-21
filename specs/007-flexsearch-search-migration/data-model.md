# Phase 1 Data Model: FlexSearch 검색 엔진 마이그레이션

이번 기능은 서버가 클라이언트에 내려주는 데이터 형태(`SearchIndexEntry`, `BlogCardData`,
`SearchQuery`, `SearchResult`, `QuickSearchPreset`)를 전혀 바꾸지 않는다 — `lib/data/types.ts`는
무변경이다. 바뀌는 것은 그 데이터를 매칭하는 **내부 엔진**이므로, 이 문서는 신규로 도입되는 두
구성 요소(`SearchEngine`, `TagIndex`)와 기존 엔티티가 그 안에서 어떻게 쓰이는지를 기록한다.

## SearchEngine (신규 — `components/search/flexsearch-engine.ts`)

헤더 검색 모달이 소비하는, `SearchIndexEntry[]` 하나로부터 빌드되는 검색 엔진.

| 시그니처 | 설명 |
|---|---|
| `createSearchEngine(entries: SearchIndexEntry[]): SearchEngine` | entries를 한 번 순회해 title/body/tags 필드별 flexsearch `Index`를 빌드한다 |
| `SearchEngine.search(query: SearchQuery): SearchResult[]` | 기존 `runSearch(entries, query)`와 동일한 시그니처의 결과를 반환한다 — 호출부(`search-modal.tsx`)는 entries를 매번 넘기지 않고, 미리 빌드해 둔 엔진에 query만 넘긴다 |

**내부 구조 (공개 API 아님)**:
- `titleIndex`, `bodyIndex`: 각각 `Index({ tokenize: "full" })`. `entries[i]`를 배열 index `i`로
  `add`한다.
- 텍스트 모드(`query.mode === "text"`): `titleIndex.search(term)` / `bodyIndex.search(term)`로
  얻은 후보 id를 `Set`으로 만들고, entries를 원래 순서로 순회하며 `entry.title` /
  `entry.plainBody`에 원본 `.includes(term)`을 다시 적용해 title-match/body-match로 상호 배타
  분류한다(research.md #2).
- 태그 모드(`query.mode === "tag"`): 내부적으로 `createTagIndex(entries)`(아래)를 함께 두고,
  `rawTerm.split(/\s+/)`로 얻은 토큰들을 `matchAll`에 넘겨 얻은 id 집합으로 entries를 원래 순서대로
  필터링한다.

**Validation / Invariants**:
- `search()`는 항상 entries의 원래 순서를 기준으로 결과를 조립한다 — flexsearch가 내부적으로
  반환하는 순서(관련도 등)에 의존하지 않는다(spec FR-003, FR-006).
- 빈 `term`이면 빈 배열을 반환한다(기존 `runTextSearch`/`runTagSearch`와 동일).

## TagIndex (신규 — `lib/data/tag-match.ts`, 기존 `matchesAllTags` 대체)

헤더 태그 검색(`SearchEngine` 내부)과 QuickSearch(`entry-stream.tsx`)가 함께 쓰는, "태그 목록을
가진 아이템 여러 개"로부터 빌드되는 공유 인덱스. 기존 `matchesAllTags(entryTags, requiredTags):
boolean`(아이템 하나씩 호출하는 predicate)을 대체한다.

| 시그니처 | 설명 |
|---|---|
| `createTagIndex(items: { tags: string[] }[]): TagIndex` | items를 한 번 순회해 `tags.join(" ")`를 배열 index로 `add`한 flexsearch `Index({ tokenize: "full" })`를 빌드한다 |
| `TagIndex.matchAll(requiredTags: string[]): Set<number>` | `requiredTags` 각 토큰을 개별 `index.search(token)`으로 조회한 뒤 교집합(AND)한 id `Set`을 반환한다. 반환된 id는 `items` 배열의 index다 |

**Validation / Invariants**:
- `requiredTags`의 각 토큰은 공백을 포함하지 않는 단일 토큰이어야 한다 — 호출부가 미리 분리해서
  넘긴다(research.md #3). `TagIndex` 자체는 공백 포함 문자열이 들어와도 동작은 하지만 그 경우
  결과 동일성이 보장되지 않으므로, 이 계약을 지키는 것은 호출부의 책임이다.
- `matchAll([])`(토큰 없음)은 빈 `Set`을 반환한다.
- 기존 `matchesAllTags`와 대소문자 무시·부분 문자열·AND 규칙이 동치임을 실측으로 검증했다
  (research.md #1, #3).

**사용처**:
- `SearchEngine`(위) 내부에서 헤더 `#tag` 검색에 사용 — `createTagIndex(entries)`.
- `components/home/entry-stream.tsx` — `useMemo(() => createTagIndex(cards), [cards])`로 만든
  인덱스에 `activePreset.tags`를 넘겨 `filteredCards`를 계산.

## 기존 엔티티 (무변경, 참고용)

| 엔티티 | 위치 | 이번 기능에서의 역할 |
|---|---|---|
| `SearchIndexEntry` | `lib/data/types.ts` | `SearchEngine`의 입력. 필드 구성 변경 없음 |
| `SearchQuery` | `lib/data/types.ts` | `SearchEngine.search()`의 입력. `parseSearchQuery`는 무변경 |
| `SearchResult` | `lib/data/types.ts` | `SearchEngine.search()`의 출력. `matchedIn` 의미 무변경 |
| `BlogCardData` | `lib/data/types.ts` | `TagIndex`(QuickSearch 경로)의 입력. 필드 구성 변경 없음 |
| `QuickSearchPreset` | `lib/data/quick-search-presets.ts` | `TagIndex.matchAll(preset.tags)`의 입력. 변경 없음 |

## 관계 요약

```
SearchIndexEntry[] (서버 → search-modal.tsx prop, 무변경)
        │
        │ useMemo
        ▼
createSearchEngine(entries) ──► SearchEngine
        │                            │
        │ (내부)                     │ search(query: SearchQuery)
        ▼                            ▼
createTagIndex(entries)        SearchResult[] (search-results.tsx가 그대로 렌더)
        │
        │ matchAll(tokens)
        ▼
     Set<number>


BlogCardData[] (서버 → entry-stream.tsx prop, 무변경)
        │
        │ useMemo
        ▼
createTagIndex(cards) ──► TagIndex
        │
        │ matchAll(activePreset.tags)
        ▼
     Set<number> ──► filteredCards (cards[i], i ∈ Set)
```
