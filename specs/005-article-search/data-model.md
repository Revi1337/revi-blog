# Data Model: 아티클 통합 검색

Phase 1 산출물. spec.md의 Key Entities를 이 기능이 다루는 구체적인 데이터 형태로 옮긴 것이다. 여기서
정의하는 타입은 모두 파생 데이터이며, 새로운 영속 저장소를 만들지 않는다(기존 `content/articles/*.md`가
유일한 원천).

## SearchIndexEntry (검색 대상 — spec의 "아티클(검색 대상)")

기존 `Article`(`lib/data/types.ts`)에서 검색에 필요한 필드만 추려, plain-text 본문을 추가로 파생시킨
읽기 전용 구조. `lib/content/search-index.ts`가 빌드 시 1회 생성한다.

| Field | Type | 설명 |
|---|---|---|
| `slug` | `string` | 아티클 식별자. 결과 클릭 시 `/article/{slug}` 이동에 사용 |
| `title` | `string` | 텍스트 검색의 1순위 매칭 대상 |
| `plainBody` | `string` | 마크다운 서식 기호를 제거한 순수 본문 텍스트. 텍스트 검색의 2순위 매칭 대상 |
| `tags` | `string[]` | 태그 검색(`#태그명`)의 매칭 대상. 일반 텍스트 검색에는 사용하지 않음 |

**생성 규칙**:
- 원본 `Article[]` 중 `showOnHomepage === true`인 것만 포함한다(FR-017). `showOnHomepage === false`인
  아티클은 이 구조가 만들어지는 시점에 이미 제외되어, 이후 어떤 단계에서도 클라이언트로 전달되지 않는다.
- `plainBody`는 마크다운 원문(mdast)에서 `mdast-util-to-string`으로 추출하며, 코드 블록/수식 등 렌더링
  전용 문법도 텍스트만 남는다.

## SearchQuery (검색어 — spec의 "검색어")

방문자가 입력창에 입력한 문자열을 해석한 결과. 저장되지 않고 매 렌더마다 입력값에서 파생된다.

| Field | Type | 설명 |
|---|---|---|
| `raw` | `string` | 입력창의 원본 문자열 (trim 전) |
| `mode` | `"text" \| "tag"` | `raw.trim()`이 `#`으로 시작하면 `"tag"`, 아니면 `"text"` |
| `term` | `string` | 매칭에 실제로 쓰이는 정규화된 문자열. `mode==="text"`면 `raw.trim().toLowerCase()`, `mode==="tag"`면 `raw.trim().slice(1).toLowerCase()` |

**검증 규칙**:
- `term`이 빈 문자열이면(모달을 막 열었을 때, 또는 `#`만 입력했을 때) 결과 리스트는 비어 있고 `mode`에
  따라 힌트("`#태그명`으로 태그 검색") 또는 빈 상태만 노출한다 — "No results found."는 `term`이
  비어 있지 않은데 매치가 0건일 때만 노출한다(edge case 참고).
- 대소문자는 항상 무시한다(`term`, `title`, `plainBody`, `tags` 비교 시 전부 소문자로 정규화).

## SearchResult (검색 결과 항목 — spec의 "검색 결과 항목")

`SearchIndexEntry`에 매칭 메타데이터를 얹은 파생 값. 매 입력마다 재계산되며 저장되지 않는다.

| Field | Type | 설명 |
|---|---|---|
| `entry` | `SearchIndexEntry` | 매칭된 아티클 |
| `matchedIn` | `"title" \| "body" \| null` | `mode==="text"`일 때만 의미 있음 — 랭킹 정렬 키. `mode==="tag"`일 때는 `null` |

**정렬 규칙**:
- `mode === "text"`: `matchedIn === "title"`인 항목을 모두 `matchedIn === "body"`인 항목보다 앞에
  배치한다(FR-011). 동일 그룹 내 정렬 순서는 spec에 명시가 없으므로 안정 정렬(원본 인덱스 순서, 곧 최신
  발행일 순 — `SearchIndexEntry`가 `articles`의 발행일 내림차순을 그대로 물려받으므로)을 유지한다.
- `mode === "tag"`: 정렬하지 않는다(FR-012) — 인덱스 원본 순서(발행일 내림차순) 그대로 노출한다.

## State transitions

없음 — 이 기능은 영속 상태를 갖지 않는다. 모달의 열림/닫힘, 입력값, 키보드로 선택된 항목의 인덱스는 모두
클라이언트 컴포넌트의 휘발성 UI 상태이며 데이터 모델의 일부가 아니다.
