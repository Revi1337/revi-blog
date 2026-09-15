# Phase 0 Research: Article Series Display

Technical Context에 `NEEDS CLARIFICATION`은 없다 — 아래 결정들은 사전 논의(코드베이스 조사 + git log 조사)를 통해 이미 확정된 방향을 연구 산출물 형식으로 정리한 것이다.

## 1. 시리즈 소속 정보를 어디에 저장할 것인가

**Decision**: 마크다운과 분리된 단일 중앙 레지스트리 파일(`lib/data/series-presets.ts`)에 `{ id, label, slugs: string[] }[]` 형태로 저장한다.

**Rationale**: `lib/data/quick-search-presets.ts`가 이미 동일한 "중앙 정의 파일 + 글 자신은 소속을 모름" 패턴으로 운영되고 있다(글의 `tags`가 아니라 프리셋 쪽이 매칭 조건을 소유). 이 선례를 그대로 따르면 spec FR-009("글 원문 수정 없이 소속 변경")와 FR-010(단일 소스)을 코드 추가 없이 구조적으로 만족한다. 또한 `content/articles/**` 변경은 top-level await 캐시 때문에 `next dev` 재시작이 필요한데(constitution Principle I), 레지스트리를 일반 TS 모듈로 두면 이 제약에서 완전히 벗어나 Fast Refresh로 즉시 반영된다.

**Alternatives considered**:
- **Frontmatter 필드 추가** (`ArticleFrontmatter.series`): 표준적인 방법이지만, 시리즈를 새로 만들거나 재배열할 때마다 여러 마크다운 파일을 열어 편집해야 하고 빌드 캐시 재시작 제약도 그대로 적용됨 — 기각.
- **마크다운 본문 상단 코드블록으로 시리즈명 명시**: 이 프로젝트의 코드블록 플러그인(mermaid/plantuml/markmap)은 전부 "렌더링되는 콘텐츠"용이라 메타데이터 용도로는 성격이 안 맞고, remark 파이프라인이 다 돌아야 알 수 있는 정보를 loader.ts의 빌드 타임 그룹핑에 쓰기엔 구조적으로 늦음 — 기각.

## 2. 시리즈 내 순서를 어떻게 표현할 것인가

**Decision**: 레지스트리의 `slugs` 배열 순서 자체가 시리즈 내 순번이다. 별도 `order` 숫자 필드 없음.

**Rationale**: `attachPrevNext`(`lib/content/prev-next.ts`)처럼 정렬 기준(날짜)이 있고 그로부터 순서를 도출하는 게 아니라, 애초에 운영자가 순서를 직접 정하는 구조이므로 배열 인덱스가 곧 순서인 게 가장 단순하다. 재배열도 배열 하나를 고치는 것으로 끝난다.

**Alternatives considered**:
- **글마다 `series_order: number` 부여**: 순서를 바꿀 때마다 여러 파일을 고쳐야 하고 번호 충돌/공백 관리 부담이 생김 — 기각.

## 3. 한 글이 여러 시리즈에 속하는 경우의 데이터 형태

**Decision**: slug → 시리즈 정보의 역인덱스를 `Map<slug, SeriesMembership[]>`(배열)로 구성한다. `Article.series?: SeriesMembership[]`.

**Rationale**: spec FR-001이 다중 소속을 명시적으로 요구(User Story 3). 레지스트리의 여러 시리즈 항목이 같은 slug를 포함하는 것 자체는 막을 이유가 없다(같은 시리즈 배열 내부의 중복만 무결성 위반).

**Alternatives considered**: 단일 시리즈만 지원(`series?: SeriesMembership`) — spec 요구사항과 직접 충돌하여 기각.

## 4. 접기/펼치기 UI 메커니즘

**Decision**: 네이티브 `<details>/<summary>`를 사용한다(신규 컴포넌트 `series-box.tsx`, 커스텀 JS 토글 상태 없음).

**Rationale**: git 커밋 이력(`3a2dba8` → `6aebeee`)에서, 과거 "아티클 헤딩 접기/펼치기" 기능이 커스텀 트리거 UI(칩/상시노출 아이콘/우클릭 메뉴)를 여러 방식으로 시도했으나 전부 반응형 레이아웃과 충돌(hover 시 레이아웃 출렁임, 안 보이는 요소의 줄바꿈 유발)해 기능 자체가 되돌려진 전례가 있다. 반면 지금도 살아있는 콜아웃 접기 기능(`remark-callout.ts`, `details.css`)은 네이티브 `<details>`로 이 문제 없이 동작 중이다. 같은 네이티브 프리미티브를 재사용하면 과거 실패 패턴(커스텀 hover/아이콘 기반 트리거)을 원천적으로 피할 수 있고, 키보드/스크린리더 접근성도 브라우저가 무료로 제공한다.

**Alternatives considered**: React state + 애니메이션 라이브러리(예: framer-motion height 애니메이션) — heading-fold가 실패한 것과 같은 종류의 커스텀 트리거 UI를 재도입할 위험이 있고, 이 기능엔 필요하지도 않아 기각.

## 5. 접기/펼치기 상태의 영속화 여부

**Decision**: 어디에도 저장하지 않는다. 새로고침/재방문 시 항상 `<details>`의 기본값(닫힘, `open` 속성 없음)으로 시작한다.

**Rationale**: 지금도 콜아웃 접기 상태는 영속화되지 않고 항상 마크다운 저자가 지정한 기본값으로 돌아간다 — 이 프로젝트에 "사용자가 토글한 `<details>` 상태를 저장했다가 복원"하는 선례가 전혀 없다(`localStorage`/`sessionStorage` 사용처는 스크롤 위치 복원과 PlantUML 렌더링 캐시뿐, 목적이 다름). `<details>`의 `open`은 SSR 시점에 HTML에 고정되므로, 영속화하려면 클라이언트에서 mount 후 강제로 값을 덮어써야 해 하이드레이션 불일치/깜빡임이라는 이 프로젝트가 아직 겪은 적 없는 새 비용이 생긴다. spec FR-007이 정확히 "항상 접힌 기본 상태로 시작"을 요구하므로, 영속화 코드를 아예 안 만드는 것이 요구사항을 가장 단순하게 만족한다.

**Alternatives considered**: `sessionStorage`에 시리즈별 펼침 상태 저장 — 스크롤 위치 복원과 성격이 다른("돌아온 자리"가 아니라 "임의 UI 토글") 새로운 영속화 클래스를 도입하게 되어 기각.

## 6. 레지스트리가 존재하지 않는 slug를 참조할 때의 처리

**Decision**: 빌드 타임에 에러를 발생시켜 빌드를 실패시킨다.

**Rationale**: `loader.ts:68-79`의 `assertNoDuplicateSlugs`가 이미 "slug 무결성 문제는 조용히 넘기지 않고 빌드를 막는다"는 컨벤션을 세워뒀다. 같은 컨벤션을 재사용하면 오탈자·파일명 변경으로 인한 깨진 참조를 편집자가 배포 전에 즉시 알아챌 수 있다 — spec Edge Case("독자에게 깨진 이동 경로를 보여주지 않는다")를 런타임에 조용히 숨기는 방식보다 더 강하게 만족한다.

**Alternatives considered**: 런타임에 존재하지 않는 slug를 조용히 무시 — 편집자의 실수가 배포된 뒤에도 한참 발견되지 않을 수 있어 기존 컨벤션(fail-fast)보다 약함, 기각.

## 7. TOC 스크롤스파이와의 상호작용

**Decision**: `components/article/toc-sidebar.tsx`, `components/article/heading-scroll.ts`를 이 기능을 위해 수정하지 않는다.

**Rationale**: 커밋 `6402ab3`("다이어그램 렌더링 중 TOC 활성 항목이 중간 상태에 멈추는 문제 수정")에서 추가된 `new ResizeObserver(onScroll).observe(document.documentElement)`(`toc-sidebar.tsx:296-297`)는 다이어그램 전용이 아니라 문서 높이가 바뀌는 모든 경우에 범용으로 반응하도록 설계되어 있다 — 시리즈 박스를 `<details>`로 펼치는 것도 이 범주에 정확히 포함된다. 또한 커밋 `96ded5b`(콜아웃 접기)에서 추가된 `heading.closest("details:not([open])") === null` 필터(`toc-sidebar.tsx:248-250`)는 닫힌 `<details>` 안의 헤딩을 이미 범용으로 배제하지만, 시리즈 박스는 본문 헤딩을 담지 않으므로 이 필터와 상호작용할 지점 자체가 없다. 즉 기존 아키텍처가 이미 이 케이스를 커버하도록 설계돼 있어, 손대지 않는 것이 spec FR-008/SC-004("기존 동작에 영향 없음")를 가장 확실하게 만족한다.

**Alternatives considered**: 시리즈 박스 전용 resize 콜백/재계산 로직 추가 — 이미 있는 범용 메커니즘과 중복이며, 오히려 두 메커니즘이 경합할 새 위험을 만들 수 있어 기각.

## 8. 펼친 박스의 이동 UI — 이전/다음 편 링크 2개 vs 전체 목록 + 페이지네이션

**Decision**: 펼친 박스는 시리즈에 속한 전체 편 목록을 번호 매긴 `<ol>`로 보여주고, 10편을 초과하면 목록 자체를 10개 단위로 페이지네이션한다(좌우 화살표는 다른 글로 이동하지 않고 목록의 다음/이전 10개 구간만 넘긴다).

**Rationale**: 최초 구현은 velog 실물 UI를 참고하기 전 spec 문구("이전 편·다음 편으로 이동할 수 있는 수단")를 그대로 좁게 해석해 `SeriesMembership.prev`/`next` 두 개 링크만 두는 작은 칩으로 만들었다. 실제 화면을 확인한 사용자가 원본 velog 스크린샷(전체 번호 목록 + 현재 편 강조 + 하단 카운터/화살표)과 다르다고 지적했고, 이어서 "화살표는 시리즈의 다른 글로 이동하는 게 아니라 한 시리즈 안에서 10개씩 보여주는 목록을 넘기는 페이지네이션이어야 한다"는 요구가 추가로 확정됐다. 이에 따라 `SeriesMembership.prev`/`next`는 더 이상 쓰이지 않아 제거하고, 시리즈에 속한 전체 편을 담는 `episodes: ArticleNavRef[]`로 대체했다(data-model.md 참고) — 개별 편으로의 이동은 목록 항목의 링크가 담당하고, 화살표는 순수하게 그 목록을 10개 단위로 넘기는 클라이언트 전용 페이지 상태(`useState`)만 제어한다.

**Alternatives considered**:
- `prev`/`next` 단일 참조 + 링크 2개(최초 구현) — 소속 확인·인접 이동은 되지만 velog처럼 시리즈 전체를 한눈에 보여주지 못하고, 사용자가 실제로 원한 결과물과 달라 기각.
- 화살표를 "인접 편 이동"과 "목록 페이지네이션" 두 가지 역할로 겸용 — 화살표 하나가 상황에 따라 다른 동작을 하게 되어 예측 가능성이 떨어지므로 기각. 화살표는 항상 페이지네이션만 담당하고, 편 이동은 항상 목록 항목 클릭으로 통일했다.
