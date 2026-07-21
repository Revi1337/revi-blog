# Phase 0 Research: 홈페이지 QuickSearch 태그 필터

이번 기능은 사용자가 제공한 기술 가이드(plan Input)에서 이미 대부분의 설계 방향이 확정되어 있어,
Technical Context에 별도의 `NEEDS CLARIFICATION` 항목이 남지 않았다. 이 문서는 그 방향을 확정하며
검토한 대안과 근거를 기록한다.

## 1. BlogCardData에 태그를 추가하는 방법

**Decision**: `lib/data/articles.ts`에서 `blogCards`를 만들 때, 이미 로드되어 있는
`article.tags`를 함께 매핑해 `BlogCardData.tags`를 채운다.

**Rationale**: `articles`(전체 `Article[]`)는 이미 빌드 시점에 파싱되어 메모리에 있고 각 아티클의
`tags`도 포함하고 있다. `blogCards`는 이 배열에서 파생되므로, 매핑 시점에 필드 하나를 더 옮기는 것
만으로 충분하다 — 별도 조회 계층이나 런타임 join이 필요 없다.

**Alternatives considered**:
- 그리드 렌더링 시점에 `slug`로 `articles.find()`를 호출해 태그를 조회 — 매 렌더마다 배열 탐색
  비용이 생기고, `BlogCardData`가 이미 `Article`에서 파생된다는 기존 패턴과도 맞지 않는다.
- 별도의 `tagsBySlug` 맵을 만들어 홈페이지에서만 참조 — `BlogCardData`가 필터링에 필요한 정보를
  스스로 갖지 못해, `EntryStream`/`QuickSearchButtons`가 두 개의 자료구조를 함께 다뤄야 하는
  불필요한 결합이 생긴다.

## 2. 태그 AND 매칭 로직의 공유 위치

**Decision**: `lib/data/tag-match.ts`에 "태그 목록이 주어진 태그 집합을 전부 만족하는지" 판단하는
순수 함수를 새로 두고, `components/search/search-query.ts`의 `runTagSearch`와 신규 QuickSearch
필터 로직이 둘 다 이 함수를 import해서 쓴다.

**Rationale**: 이 매칭 규칙(대소문자 무시 + 전체 태그 AND)은 UI에 종속되지 않는 순수 도메인 로직이다.
`lib/data`는 이미 `articles.ts`/`search.ts`처럼 도메인 데이터·로직을 모아두는 위치이므로 대칭이
맞다. 검색 모달(`components/search`)과 홈 QuickSearch(`components/home`)는 서로 다른 UI 모듈이므로,
한쪽이 다른 쪽의 내부 함수를 직접 import하게 만들면 어느 한쪽이 다른 쪽의 세부 구현에 종속되는
잘못된 방향의 결합이 생긴다.

**Alternatives considered**:
- QuickSearch가 `components/search/search-query.ts`의 `runTagSearch`를 그대로 재사용 —
  `runTagSearch`는 `SearchIndexEntry[]`(제목·본문·태그 포함)를 대상으로 하고 랭킹 없는 전체
  아티클 반환을 전제로 짜여 있어, `BlogCardData[]` 기반의 그리드 필터링에 그대로 맞지 않는다.
  또한 `components/search`가 자신을 몰라야 할 홈 화면 로직에 의존성을 노출하게 된다.
- 두 곳에 각각 매칭 로직을 새로 구현 — 사용자가 이미 가이드에서 명시적으로 배제한 방향(규칙이
  바뀔 때 어긋날 위험).

## 3. 필터 상태를 어디서 소유할 것인가

**Decision**: `app/page.tsx`는 서버 컴포넌트로 유지하고, 'Entry Stream' 섹션 전체를
`components/home/entry-stream.tsx`라는 새 클라이언트 컴포넌트로 분리해 그 안에서 활성 프리셋
상태(`activePresetId: string | null`)를 `useState`로 소유한다.

**Rationale**: Constitution Principle III(vercel-react-best-practices 준수)와 일치하는 방향으로,
클라이언트 상태가 필요한 최소 범위만 클라이언트 컴포넌트로 만들어 히어로 캐러셀 등 나머지 서버
컴포넌트 비중과 초기 번들 크기를 유지한다.

**Alternatives considered**:
- `app/page.tsx` 전체를 `'use client'`로 전환 — 히어로 캐러셀 등 상태가 필요 없는 부분까지
  클라이언트 번들에 포함되어 불필요하게 번들 크기가 늘어난다.
- 전역 Context/스토어로 필터 상태 관리 — 이 상태를 참조하는 곳이 'Entry Stream' 섹션 하나뿐이라
  전역화는 과한 추상화이며, prop으로 충분히 전달 가능한 범위다.

## 4. 페이지네이션과 필터 상태 연동

**Decision**: `HomePagination`이 받는 `totalPages`를 `EntryStream`이 필터링된 `cards.length`
기준으로 계산해 내려주고, 필터(활성 프리셋)가 바뀔 때마다 페이지를 1로 리셋한다.

**Rationale**: 현재 `HomePagination`은 `totalPages`를 prop으로 받지만 내부 `page` state는
독립적으로 관리해 필터 변경에 반응하지 않는다. 최소 침습으로 "필터 변경 시 1페이지 리셋"을
보장하려면, 필터 상태가 바뀔 때 `HomePagination`을 다른 `key`로 리마운트하거나(React가 내부
`useState`를 초기화), `page` 상태 자체를 `EntryStream`으로 끌어올려 controlled로 전환하는 두
방법이 있다. 정확한 선택은 구현 단계에서 `vercel-react-best-practices` 규칙(불필요한 상태 중복,
key 기반 리마운트의 적절성)을 확인한 뒤 확정한다 — 이 문서는 "무엇을 보장해야 하는지"만 결정한다.

**Alternatives considered**:
- `HomePagination`을 손대지 않고 필터링만 수행 — FR-010(필터 변경 시 최소 1페이지 리셋)을
  만족하지 못해 스펙 위반이다.

## 5. QuickSearch 프리셋 데이터 정의 위치

**Decision**: `lib/data/quick-search-presets.ts`에 `{ id, label, tags: string[] }[]` 형태의 배열로
정의한다. 초기값은 스펙에서 제안한 3개 예시(`GRPC` 단일 태그, `KAFKA`+`SPARK`, `OAUTH2`+`SECURITY`)를
사용한다.

**Rationale**: spec FR-015가 프리셋 개수를 고정하지 않고 확장 가능해야 한다고 명시했으므로, 컴포넌트
JSX에 하드코딩하지 않고 `lib/data`의 다른 정적 데이터 파일과 동일한 패턴으로 분리한다. 새 프리셋
추가는 이 배열에 항목을 하나 더 추가하는 것만으로 끝난다.

**Alternatives considered**:
- `QuickSearchButtons` 컴포넌트 내부에 상수 배열로 하드코딩 — 프리셋을 추가할 때마다 UI
  컴포넌트 파일을 열어야 해서 "데이터와 UI 분리"라는 확장 요건에 맞지 않는다.

## 6. 검증 전략

**Decision**: `npm run build` + `playwright-cli`로 클릭/재클릭/전체 보기 해제/모바일 뷰포트
줄바꿈 같은 상호작용을 구동 검증하고, 다크/라이트 테마에서 버튼의 활성/비활성 시각 스타일은
`claude-in-chrome`(또는 `playwright` MCP 스크린샷 도구)으로 렌더링 픽셀을 확인한다.

**Rationale**: Constitution Principle I은 `npm run build` + `playwright-cli`를 우선 경로로,
렌더링 픽셀 확인이 필요할 때만 스크린샷 도구로 전환하도록 규정한다. 이 기능은 활성 상태의 시각적
구분(테두리·배경색 등)이 요구사항(FR-012, US3)에 명시되어 있어 DOM 클래스 존재 여부만으로는
"실제로 다르게 보이는지"를 검증할 수 없으므로 스크린샷 확인 단계가 필요하다.

**Alternatives considered**:
- `playwright-cli`만으로 검증 종료 — 활성 상태가 CSS 클래스는 붙었지만 시각적으로 구분되지 않는
  경우를 놓칠 수 있다.
