# Phase 1 Data Model: Article Series Display

## SeriesPreset (신규 — 레지스트리 원본 데이터)

`lib/data/series-presets.ts`에 정의되는, 운영자가 직접 관리하는 소스 데이터.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | 시리즈 고유 식별자(kebab-case). 레지스트리 전체에서 유일해야 함. |
| `label` | `string` | 독자에게 보이는 시리즈 표시 이름 — 접힌 박스의 `<summary>`에 항상 노출됨. |
| `slugs` | `string[]` | 이 시리즈에 속한 글의 slug를 순서대로 나열한 배열. **배열 순서 = 시리즈 내 편 순서**(별도 order 필드 없음). |

**Validation rules** (빌드 타임, `loader.ts` 통합 단계에서 수행):

- `id`는 레지스트리 전체에서 유일해야 한다 — 중복 시 빌드 실패.
- `slugs`는 최소 1개 이상이어야 한다 — 빈 배열은 설정 오류로 간주, 빌드 실패.
- 같은 `SeriesPreset.slugs` 배열 안에 동일 slug가 두 번 이상 등장할 수 없다 — 빌드 실패.
- `slugs`에 나열된 모든 slug는 `loadArticles()`가 로드한 실제 `Article.slug` 중 하나와 일치해야 한다 — 일치하지 않으면(오탈자, 파일명 변경, 삭제) 빌드 실패(`assertNoDuplicateSlugs`와 동일한 fail-fast 컨벤션).
- 하나의 slug가 **서로 다른 여러** `SeriesPreset`의 `slugs`에 동시에 등장하는 것은 허용된다(글의 다중 시리즈 소속, spec FR-001).

## SeriesMembership (신규 — 빌드 타임 파생 데이터)

`loader.ts`가 `SeriesPreset[]`과 로드된 `Article[]`로부터 계산해 각 `Article`에 attach하는 파생 타입. 저장소에 커밋되지 않고 매 빌드마다 재계산됨.

| Field | Type | Description |
|---|---|---|
| `id` | `string` | 소속 `SeriesPreset.id`를 그대로 전달. |
| `label` | `string` | 소속 `SeriesPreset.label`을 그대로 전달. |
| `index` | `number` | 이 글이 시리즈 안에서 몇 번째인지(1-based) — `slugs` 배열에서 이 글의 위치 + 1. |
| `total` | `number` | 시리즈 전체 편 수 — `slugs.length`. |
| `episodes` | `ArticleNavRef[]` | 시리즈에 속한 **전체** 편을 순서대로 담은 배열(`slugs`와 1:1, `{ slug, title }`로 변환). 펼친 박스가 번호 매긴 목록으로 그대로 렌더링한다. |

**Derivation**: `preset.slugs`를 순서대로 순회하며 이미 로드된 `Article` 맵에서 각 slug를 찾아 `{ slug, title }`(`ArticleNavRef`)로 변환한 배열이 `episodes`다 — 같은 시리즈의 모든 멤버가 동일한 `episodes` 배열을 공유하고, `index`/`total`만 멤버별로 다르다. 정렬이나 그룹핑 연산이 필요 없다 — 배열을 한 번 매핑하는 것만으로 O(N)에 계산된다.

**UI 소비 방식**: `episodes`가 10개를 넘으면 `components/article/series-box.tsx`가 10개 단위로 클라이언트에서 페이지네이션한다(데이터 모델에는 페이지 개념이 없다 — 전체 목록만 내려주고, 몇 번째 페이지를 보여줄지는 순수 클라이언트 상태다). 초기 페이지는 `Math.floor((index - 1) / 10)`으로 계산해 현재 편이 항상 첫 진입 시 보이는 페이지에 오도록 한다.

## Article (기존 타입 확장)

`lib/data/types.ts`의 기존 `Article` 인터페이스에 필드 하나만 추가한다.

```text
Article {
  ...(기존 필드 전부 유지)...
  series?: SeriesMembership[]   // [NEW] 없으면(undefined) 어떤 시리즈에도 속하지 않음 → UI는 박스를 렌더링하지 않음
}
```

- 어떤 시리즈에도 속하지 않는 글은 `series`가 `undefined`이거나 빈 배열이다(spec FR-011).
- 여러 시리즈에 속한 글은 `series` 배열에 항목이 여러 개 있다 — 배열 순서가 화면에 박스가 나열되는 순서를 결정한다(레지스트리에 등록된 순서, 즉 `series-presets.ts`에서 해당 slug가 처음 발견되는 순서를 따른다).

## ArticleNavRef (기존 타입 재사용, 변경 없음)

```text
ArticleNavRef {
  slug: string
  title: string
}
```

이미 `lib/content/prev-next.ts`의 전체 글 기준 prev/next에서 쓰이는 것과 동일한 타입을 `SeriesMembership.episodes`의 각 원소에도 그대로 재사용한다 — 시리즈 전용 별도 참조 타입을 새로 만들지 않는다. (초기 설계에서는 `SeriesMembership`에 `prev`/`next` 단일 참조 필드를 따로 뒀으나, 박스 UI가 "이전/다음 편 이동"이 아니라 "전체 목록 + 목록 자체의 페이지네이션"으로 확정되면서 더 이상 쓰이지 않아 제거했다 — `episodes` 하나로 충분하다.)

## Relationships

```text
SeriesPreset (1) ──slugs[]──> (N) Article.slug        # 레지스트리가 소유하는 소속 관계(단일 소스)
Article (1) ──series[]──> (N) SeriesMembership          # 빌드 타임 파생 — Article 쪽에서 읽기 전용으로 attach됨
SeriesMembership.episodes[] ──> ArticleNavRef            # 시리즈에 속한 전체 편 목록(순서 보존)
```

## State Transitions

없음 — 이 기능이 다루는 서버측 데이터는 전부 빌드 타임에 정적으로 계산되는 값이다. 클라이언트에서 변하는 상태는 두 가지이며 둘 다 애플리케이션 데이터 모델로 관리되지 않고(어디에도 저장/추적하지 않음) 컴포넌트 로컬 상태로만 존재한다:

- 각 `<details>` 엘리먼트의 열림/닫힘 — 브라우저 네이티브 상태(spec FR-007, 새로고침 시 항상 초기화).
- `series-box.tsx`의 목록 페이지 인덱스(`useState`) — 컴포넌트가 마운트될 때마다 현재 편이 속한 페이지로 다시 초기화되고, 어디에도 지속되지 않는다.
