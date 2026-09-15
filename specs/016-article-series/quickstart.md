# Quickstart: Article Series Display

구현 완료 후 이 기능이 end-to-end로 동작하는지 확인하는 절차다. 데이터 형태는 [data-model.md](./data-model.md)를 참고한다.

## Prerequisites

- `lib/data/series-presets.ts`, `lib/content/loader.ts`, `lib/data/types.ts`, `components/article/article-header.tsx`, `components/article/series-box.tsx` 구현 완료.
- 검증용으로 최소 2편 이상 소속된 시리즈 1개, 1편만 소속된 시리즈 1개, 그리고 두 시리즈에 동시에 소속된 글 1개가 레지스트리에 있어야 한다(spec의 모든 User Story/Edge Case를 실제로 밟아보기 위함). 이미 발행된 글만으로 구성 가능 — 예시로 `content/articles/algorithm/Prim.md`(slug: `Prim`)와 `content/articles/algorithm/Kruskal.md`(slug: `Kruskal`)를 "MST 알고리즘" 시리즈로 묶어 검증해도 된다.

```ts
// lib/data/series-presets.ts (검증용 임시 예시)
export const seriesPresets: SeriesPreset[] = [
  { id: "mst-algorithms", label: "MST 알고리즘", slugs: ["Prim", "Kruskal"] },
]
```

## Setup

```bash
npm run build
```

**Expected**: 빌드가 에러 없이 성공한다. (빌드 타임 검증 자체를 확인하려면 아래 "무결성 검증" 섹션 참고.)

```bash
npm run dev
```

`content/articles/**`는 건드리지 않았으므로 이미 떠 있는 `next dev`를 재시작할 필요는 없다 — 단, `loader.ts`를 막 수정했다면 top-level await 캐시가 걸려 있으므로 최초 1회는 재시작한다(constitution Principle I).

## Functional Validation (playwright-cli)

1. **소속·목록 확인 (User Story 1)**: `/article/Prim` 방문 → 태그 영역 아래 "MST 알고리즘" 이름이 보이는, 본문 폭을 채운 접힌 박스 확인 → 박스 클릭 → 전체 편 목록("1. Prim", "2. Kruskal")이 나타나고 현재 편(Prim)이 강조 표시되는지 확인.
2. **시리즈 목록에서 이동 (User Story 2)**: 펼친 목록에서 "Kruskal" 항목 클릭 → `/article/Kruskal`로 이동하는지 확인. 2편뿐이라 페이지네이션 버튼/카운터는 노출되지 않아야 한다(FR-013 — 10편 이하에는 노출 안 함). 10편을 초과하는 임시 시리즈로 별도 확인하려면 아래 "페이지네이션 검증" 참고.
3. **다중 시리즈 독립성 (User Story 3)**: 두 시리즈에 동시 소속된 검증용 글 방문 → 박스 두 개가 각각 접힌 채로 보이는지 확인 → 첫 번째 박스만 클릭해 펼침 → 두 번째 박스는 계속 접혀 있는지 확인.
4. **새로고침 시 초기화 (spec FR-007 / SC-005)**: 박스를 펼친 상태에서 페이지 새로고침 → 모든 박스가 다시 접힌 상태로 렌더링되는지 확인.
5. **시리즈 미소속 글 (spec FR-011)**: 레지스트리에 없는 임의의 글 상세 페이지 방문 → 시리즈 박스가 전혀 렌더링되지 않는지 확인.

## Regression Validation — TOC (spec FR-008 / SC-004, 가장 중요)

이 검증은 `toc-sidebar.tsx`를 전혀 수정하지 않았다는 전제를 실제로 확인하는 단계다.

1. 헤딩이 5개 이상인 긴 글(시리즈에 속한 글)에서 스크롤을 내리며 TOC 사이드바의 활성(active) 항목이 지금까지와 동일하게 정확히 갱신되는지 확인.
2. 페이지 중간까지 스크롤한 상태에서 시리즈 박스를 펼친다(문서 높이가 아래로 늘어남) → TOC 활성 항목이 펼치기 이전과 동일하게 유지되고, 이어서 스크롤했을 때 정확한 헤딩으로 갱신되는지 확인 — 엉뚱한 헤딩이 활성화되거나 멈추는 현상이 없어야 한다.
3. TOC 항목을 클릭해 특정 헤딩으로 이동 → 정상적으로 스크롤 이동하는지 확인(시리즈 박스 도입 전과 동일해야 함).

## 페이지네이션 검증 (spec FR-013, 10편 초과)

`series-presets.ts`에 12개 이상의 slug로 구성된 임시 시리즈를 하나 등록한다(기존 real 아티클 slug를 임시로 빌려 써도 된다 — 검증 후 반드시 제거). 박스를 펼치면 처음부터 1-10이 보이고 좌측 버튼은 비활성 상태여야 한다. `→`를 클릭하면 11번째부터 남은 편이 보이고 카운터가 "11-{총 편수} / {총 편수}"로, 이번엔 우측 버튼이 비활성 상태로 바뀌는지 확인한다. 검증 후 임시 시리즈를 제거한다.

## Build-Time Integrity Validation

`lib/data/series-presets.ts`의 `slugs`에 존재하지 않는 slug(오탈자)를 일부러 넣고 `npm run build` 실행 → 빌드가 명확한 에러 메시지와 함께 실패하는지 확인. 같은 시리즈의 `slugs` 배열에 같은 slug를 두 번 넣었을 때도 마찬가지로 빌드가 실패하는지 확인. 검증 후 원상 복구한다.
