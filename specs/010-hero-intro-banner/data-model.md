# Data Model: 히어로 캐러셀 제거 및 자기소개 배너 교체

## Entities

### HeroContent

`content/home/main.yaml`의 `hero:` 키가 파싱된 결과. 홈 배너 전체를 구성하는 최상위 엔티티.

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | `string` | Yes | 운영자 이름/핸들. 현재 값 `"Revi"` |
| `headline` | `string` | Yes | 정체성을 드러내는 한 줄 문구. `[KR]` 접두어 없이 저장 |
| `philosophy` | `PhilosophyItem[]` | Yes, non-empty | 핵심 가치/철학 항목 목록 |

### PhilosophyItem

`philosophy` 배열의 각 원소.

| Field | Type | Required | Notes |
|---|---|---|---|
| `icon` | `string` | Yes | 아이콘 식별자 — 원본은 Material Symbols 이름(`visibility`/`settings_suggest`/`layers`), `components/home/hero-icon.tsx`가 lucide 아이콘으로 매핑. 매핑에 없는 값은 폴백 아이콘 사용 |
| `label` | `string` | Yes | 대괄호로 감싼 짧은 라벨, 예: `"[VISUALIZATION]"` |
| `texts` | `string[]` | Yes, non-empty | 설명 문장 목록(현재는 항목당 1문장) |

## Validation Rules

- `lib/content/hero.ts`는 `lib/content/bookmarks.ts`의 `assertValidCategories`와 동일한 방식으로, 파싱 직후 다음을 검증하고 누락 시 `[content/home] ...: 필드 누락` 형태의 에러를 던진다:
  - `name`, `headline`이 빈 문자열이 아님
  - `philosophy`가 빈 배열이 아님
  - `philosophy[]`의 각 원소가 `icon`, `label`, `texts`(비어있지 않은 배열)를 모두 가짐

## Initial Content (`content/home/main.yaml`)

원본은 `~/Desktop/ai/vibe/revi1337/src/data/content-kr.yaml`의 `hero:` 블록이며, `"[KR]"` 접두어 제거 및 `philosophy[0].texts`의 중복 문장 제거(복붙 아티팩트로 판단, [research.md](./research.md) 참고)를 반영한 값이다:

```yaml
hero:
  name: "Revi"
  headline: "확장 가능하고 고성능인 백엔드 시스템을 구축합니다."
  philosophy:
    - icon: "visibility"
      label: "[VISUALIZATION]"
      texts:
        - "시스템을 읽는 것만으로는 부족합니다. 직접 눈으로 봐야 깊이 이해할 수 있습니다."
    - icon: "settings_suggest"
      label: "[INTERNALS]"
      texts:
        - "내부 동작 원리를 아는 것이 핵심 역량입니다."
    - icon: "layers"
      label: "[SCALABILITY]"
      texts:
        - "확장성은 사고방식입니다. 저는 항상 성장 가능성을 고민합니다."
```

## Icon Mapping (`components/home/hero-icon.tsx`)

`components/bookmark/bookmark-icon.tsx`의 `name → LucideIcon` 테이블 + 폴백 패턴을 그대로 따른다:

| YAML `icon` value | lucide-react component |
|---|---|
| `visibility` | `Eye` |
| `settings_suggest` | `Settings2` |
| `layers` | `Layers` |
| (매핑에 없는 값) | 폴백 아이콘 (예: `Sparkles` — `bookmark-icon.tsx`의 `Folder` 폴백과 같은 역할) |

## Relationships / State

- `HeroContent`는 빌드/모듈 로드 시점에 파일에서 한 번 읽혀 캐시되는 정적 데이터다(요청마다 다시 읽지 않음 — `server-hoist-static-io.md` 원칙, `lib/content/bookmarks.ts`와 동일한 모듈 스코프 로딩).
- 상태 전이 없음 — 이번 기능 범위에서 `HeroContent`는 읽기 전용이며 사용자 인터랙션으로 값이 바뀌지 않는다(spec FR-004).
