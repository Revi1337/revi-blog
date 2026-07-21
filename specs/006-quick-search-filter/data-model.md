# Phase 1 Data Model: 홈페이지 QuickSearch 태그 필터

## BlogCardData (확장)

홈 카드 그리드·히어로 캐러셀이 공유하는 기존 엔티티. `tags`를 새로 추가한다.

| 필드 | 타입 | 설명 |
|------|------|------|
| `slug` | `string` | `Article.slug`와 동일 — 식별자로 재사용 (기존) |
| `title` | `string` | 아티클 제목 (기존) |
| `thumbnail` | `string?` | 없으면 기본 썸네일로 폴백 (기존) |
| `publishedAt` | `string` | 발행일 (기존) |
| `tags` | `string[]` | **신규**. `Article.tags`에서 그대로 매핑. QuickSearch 필터 매칭에 사용 |

**Validation / Invariants**:
- `tags`는 `Article.tags`와 항상 동기화되어야 한다(별도로 편집되지 않는 파생 값).
- 기존 소비자(`HeroCarousel`, `BlogCard`)는 `tags` 필드를 몰라도 되며, 필드 추가가 기존 동작을
  깨서는 안 된다(추가 전용 변경).

## QuickSearchPreset (신규)

QuickSearch 버튼 하나가 대표하는 태그 조합 프리셋.

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | `string` | 프리셋 고유 식별자 (활성 상태 비교에 사용) |
| `label` | `string` | 버튼에 표시되는 이름이자, 활성화 시 'Entry Stream' 헤더 필터 라벨에 표시되는 값 |
| `tags` | `string[]` | 1~3개의 태그. 아티클이 이 태그를 전부 가지고 있어야 매치(AND) |

**Validation / Invariants**:
- `tags.length`는 1 이상 3 이하다(spec FR-015).
- 목록 전체의 개수는 코드에서 강제하지 않는다 — 배열에 항목을 추가/삭제하는 것만으로 프리셋 수가
  늘거나 줄어든다(spec FR-015: 고정 금지).
- 초기값(예시) 3개: `GRPC` 단일 태그 / `KAFKA`+`SPARK` / `OAUTH2`+`SECURITY` (근거는 research.md #5).

## FilterState (신규 — Entry Stream 클라이언트 컴포넌트 로컬 상태)

'Entry Stream' 섹션이 소유하는, 현재 활성화된 QuickSearch 프리셋을 나타내는 상태.

| 필드 | 타입 | 설명 |
|------|------|------|
| `activePresetId` | `string \| null` | 활성화된 `QuickSearchPreset.id`. `null`이면 "All"(필터 없음) |

**State transitions**:
- 초기값: `null` (전체 아티클 노출, 헤더 라벨 'All')
- 프리셋 버튼 클릭 (`activePresetId !== 클릭한 id`) → `activePresetId = 클릭한 id` (다른 프리셋이
  활성이었다면 전환, 없었다면 새로 활성화)
- 이미 활성화된 프리셋 버튼 재클릭 (`activePresetId === 클릭한 id`) → `activePresetId = null`
  (해제, 전체 목록으로 복귀)
- `activePresetId`가 바뀔 때마다: 그리드에 표시할 아티클 재계산 + 페이지네이션 1페이지로 리셋

**Invariant**: 동시에 두 개 이상의 프리셋이 활성일 수 없다(단일 값이므로 구조적으로 보장됨).

## 매칭 함수 (lib/data/tag-match.ts)

| 시그니처 | 설명 |
|---|---|
| `matchesAllTags(entryTags: string[], requiredTags: string[]): boolean` | `requiredTags`의 각 태그가 `entryTags` 중 하나 이상과 대소문자 무시 substring으로 일치해야 하며, 모든 `requiredTags`가 이 조건을 만족해야 `true` (기존 `runTagSearch`와 동일 규칙) |

**사용처**:
- `components/search/search-query.ts`의 `runTagSearch` — `SearchIndexEntry.tags`와 사용자가
  입력한 `#태그1 태그2` 토큰들을 비교할 때 이 함수로 위임.
- `components/home/entry-stream.tsx` — `BlogCardData.tags`와 활성화된 `QuickSearchPreset.tags`를
  비교할 때 이 함수로 위임.

## 관계 요약

```
Article (기존)
  └─ tags: string[] ──────────────┐
                                   │ (매핑)
BlogCardData (확장)                │
  └─ tags: string[] ◄─────────────┘
        │
        │ matchesAllTags(BlogCardData.tags, preset.tags)
        ▼
QuickSearchPreset (신규)
  └─ tags: string[]
        ▲
        │ activePresetId로 참조
        │
FilterState (신규, Entry Stream 로컬)
  └─ activePresetId: string | null
```
