# Implementation Plan: FlexSearch 검색 엔진 마이그레이션

**Branch**: `007-flexsearch-search-migration` | **Date**: 2026-07-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-flexsearch-search-migration/spec.md`

## Summary

헤더 Ctrl+K 검색(SearchBar)과 홈페이지 QuickSearch 태그 필터의 매칭 엔진을 네이티브
`String.includes()` 루프에서 [flexsearch](https://github.com/nextapps-de/flexsearch)(`Index`,
`tokenize: "full"`) 기반으로 교체한다. flexsearch 인스턴스는 RSC 경계를 넘을 수 없으므로 서버가
내려주는 데이터 형태는 그대로 두고, 클라이언트 컴포넌트 내부에서 `useMemo`로 인덱스를 한 번만
빌드한다. 텍스트 검색(title/body)은 flexsearch가 반환한 후보 집합을 원본 `.includes()`로 재검증해
기존과 100% 동일한 결과를 보장하고(flexsearch의 다중 단어 쿼리는 항상 superset이라는 사전 검증
결과에 근거), 태그 검색(`#tag`, QuickSearch)은 공백 단위로 미리 쪼갠 단일 토큰만 flexsearch에
넘겨 재검증 없이도 기존 `matchesAllTags`와 동치임을 사전에 실측 검증했다. 두 기능이 공유하던
태그 매칭 규칙(`lib/data/tag-match.ts`)은 predicate 함수에서 "한 번 인덱스를 만들고 여러 번
AND 조회하는" `createTagIndex`로 재작성해 계속 하나의 구현을 공유한다.

## Technical Context

**Language/Version**: TypeScript 5.x (Next.js 16 기본 설정), Node.js (Next.js 16 요구 버전)

**Primary Dependencies**: Next.js 16 (App Router) · React 19.2 · 신규 외부 의존성
`flexsearch@^0.8.212`(이미 `package.json`에 설치됨, 공식 `index.d.ts` 타입 제공, CJS/ESM 양쪽 지원).
`Index`/`Document` 인스턴스는 직렬화 불가능한 클래스 인스턴스이므로 RSC 경계를 넘길 수 없다 —
서버는 지금처럼 `SearchIndexEntry[]`/`BlogCardData[]` 같은 순수 데이터만 client component에
prop으로 넘기고, flexsearch 인덱스는 client component 내부에서 `useMemo`로 안정적인 prop을 key로
삼아 한 번만 빌드한다.

**Storage**: N/A — 새 저장소를 두지 않는다. 기존 `content/articles/*.md` →
`lib/content/loader.ts` → `lib/data/{articles,search}.ts` 파이프라인은 변경하지 않는다.

**Testing**: Constitution Principle I(Feature-Level Verification)에 따라 `npm run build`로
Turbopack 빌드·타입 체크를 통과시킨 뒤, 실제 브라우저 검증은 다음 우선순위로 시도한다 — 먼저
`claude-in-chrome`으로 로컬 dev 서버를 구동해 헤더 Ctrl+K 검색(제목/본문 텍스트, `#`태그
단일/다중 AND, `#`만 입력, 하이라이트, No results, 키보드 내비게이션)과 홈페이지 QuickSearch
버튼(활성화/해제, 카드 필터링)을 직접 조작해 확인하고, `claude-in-chrome`을 쓸 수 없으면
`playwright-cli`로, 그것도 여의치 않으면 `playwright` MCP 서버(스크린샷 도구 포함)로 대체한다.

**Target Platform**: 웹 브라우저(데스크톱 + 모바일 뷰포트), 기존 Next.js 배포 환경 그대로

**Project Type**: Web application — 단일 Next.js 앱(프론트/백엔드 분리 없음). 기존 저장소 구조를
그대로 확장한다.

**Performance Goals**: 검색 입력 반응성은 현재와 동일해야 한다(`useDeferredValue`로 이미 non-urgent
업데이트 처리 중, 변경 없음). 현재 아티클 수(수십 편) 규모에서 flexsearch 인덱스 빌드/조회는
체감 지연이 없어야 한다 — 인덱스는 entries/cards가 바뀔 때만(즉 사실상 마운트 시 1회) 재빌드되므로
키 입력마다 재빌드되지 않는 것이 이 목표를 만족시키는 핵심 조건이다.

**Constraints**:
- 텍스트 검색(title/body)은 flexsearch 후보 조회 → 원본 `.includes()` 재검증 2단계로, 최종 결과
  집합·순서가 마이그레이션 이전과 100% 동일해야 한다(spec SC-001, FR-001~003).
- 태그 검색(`#tag`, QuickSearch)은 공백으로 미리 분리한 단일 토큰만 flexsearch에 넘겨야 한다 —
  여러 토큰을 공백 포함 문자열째로 넘기면 flexsearch의 단어 단위 AND 검색이 원문에 연속하지 않는
  경우까지 매치시켜 spec FR-005/FR-009를 위반한다.
- `Index`는 반드시 `tokenize: "full"`로 생성해야 한다 — 다른 tokenize 값은 단어 중간 substring을
  후보에서 놓쳐(false negative) 텍스트 검색의 재검증 단계로도 복구할 수 없다.
- `lib/data/tag-match.ts`의 매칭 규칙은 헤더 태그 검색과 QuickSearch가 계속 하나의 구현을
  공유해야 한다(006 커밋에서 "두 곳이 갈라지지 않게" 의도적으로 분리했던 원칙 유지).
- `components/search/search-modal.tsx`, `search-results.tsx`, `search-trigger.tsx`,
  `use-search-shortcut.ts`의 UI/키보드 상호작용은 변경하지 않는다(spec FR-010).
- 헤더 검색은 이미 `next/dynamic`으로 지연 로딩되어 flexsearch가 즉시 로드되지 않지만, 홈페이지
  QuickSearch(`entry-stream.tsx`)는 eager 렌더라 flexsearch `Index`만 tree-shake돼도 초기 번들에
  gzip 약 17KB가 더해진다 — 사용자가 이미 감수하기로 확정한 트레이드오프다.
- `core/*.html` 4종은 검색 UI 마크업이 바뀌지 않으므로 갱신 대상이 아니다(spec Assumptions).

**Scale/Scope**: 현재 콘텐츠 규모(수십 편)와 동일. 통합 지점은 헤더 검색 모달 1곳과 홈페이지
QuickSearch 1곳, 그리고 양쪽이 공유하는 태그 매칭 모듈 1곳.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I — Feature-Level Verification (NON-NEGOTIABLE)**: PASS (조건부). 매칭 엔진 교체는
  코드 리뷰나 타입체크만으로는 결과 동일성을 확인할 수 없다. 구현 완료 후 `npm run build` +
  (`claude-in-chrome` → `playwright-cli` → `playwright` MCP 순으로) 실제 브라우저 구동 검증을
  거쳐야 "완료"로 간주한다. 세부 항목은 `/speckit-tasks`가 작업으로 분해한다.
- **Principle II — Visual Consistency Across Dark/Light**: PASS. 이번 기능은 매칭 엔진 내부
  교체이며 UI 마크업/스타일을 전혀 바꾸지 않으므로 `core/*.html` 갱신 대상이 아니다(spec
  Assumptions). 다크/라이트 시각적 회귀가 없는지는 Principle I의 브라우저 검증에서 함께 확인한다.
- **Principle III — Mandatory vercel-react-best-practices Compliance (NON-NEGOTIABLE)**: PASS
  (조건부). 구현 전 `.agents/skills/vercel-react-best-practices/rules/`를 실제로 열어 확인해야
  한다. 이번 설계 단계에서 이미 관련성이 확인된 규칙: 비용이 큰 인덱스 빌드를 `useMemo`로 안정적인
  prop을 key 삼아 한 번만 수행(`rerender-*` 계열), 홈페이지 eager 번들에 신규 의존성을 추가할 때의
  번들 크기 트레이드오프 인지(`bundle-*` 계열). 구현 완료 후 이 목록에 국한하지 않고 전체 규칙
  대비 감사를 별도 작업으로 수행해야 한다.

위반 사항 없음 — Complexity Tracking 불필요.

## Project Structure

### Documentation (this feature)

```text
specs/007-flexsearch-search-migration/
├── plan.md              # 이 파일 (/speckit-plan 산출물)
├── research.md          # Phase 0 산출물
├── data-model.md        # Phase 1 산출물
├── quickstart.md        # Phase 1 산출물
└── tasks.md             # Phase 2 산출물 (/speckit-tasks — 이 명령에서는 생성하지 않음)
```

`contracts/`는 생성하지 않는다 — 이 기능은 외부에 노출하는 API/CLI 계약이 없는 순수 내부 클라이언트
모듈 교체다(검색은 이미 클라이언트에 전달된 데이터를 그 자리에서 재계산하는 방식이며, 별도 HTTP
엔드포인트를 추가하지 않는다).

### Source Code (repository root)

```text
package.json                            # 변경 완료 — flexsearch@^0.8.212 의존성 추가

lib/
└── data/
    └── tag-match.ts                    # 변경 — matchesAllTags(predicate) 제거,
                                         #        createTagIndex(items) → { matchAll(tags): Set<number> }
                                         #        로 재작성 (flexsearch Index 기반, 헤더 태그 검색과
                                         #        QuickSearch가 계속 공유)

components/
├── search/
│   ├── flexsearch-engine.ts            # 신규 — createSearchEngine(entries): { search(query) }.
│   │                                    #        title/body 필드별 Index(tokenize:"full") + 후보
│   │                                    #        재검증으로 runTextSearch/runTagSearch를 대체
│   ├── search-query.ts                 # 변경 — runTextSearch/runTagSearch/runSearch 제거.
│   │                                    #        parseSearchQuery/highlightSegments/getMatchSnippet만
│   │                                    #        순수 표시 유틸로 남김
│   ├── search-modal.tsx                # 변경 — useMemo(createSearchEngine)로 엔진을 한 번만 빌드,
│   │                                    #        results useMemo가 engine.search(parsedQuery) 호출
│   ├── search-results.tsx              # 변경 없음
│   ├── search-trigger.tsx              # 변경 없음
│   └── use-search-shortcut.ts          # 변경 없음
└── home/
    └── entry-stream.tsx                # 변경 — useMemo(createTagIndex(cards))로 태그 인덱스를 만들고
                                         #        matchesAllTags 대신 tagIndex.matchAll(preset.tags) 사용

core/
├── home-dark.html                      # 변경 없음
├── home-light.html                     # 변경 없음
├── article-detail-dark.html            # 변경 없음
└── article-detail-light.html           # 변경 없음
```

**Structure Decision**: 별도 프로젝트/서비스를 만들지 않고 기존 단일 Next.js 앱 구조를 그대로
확장한다. 매칭 엔진은 UI에 종속되지 않는 도메인 로직이므로, 헤더 검색 전용 로직은
`components/search/flexsearch-engine.ts`에, 두 기능이 공유하는 태그 매칭 로직은 기존 위치
그대로 `lib/data/tag-match.ts`에 둔다(006에서 확립한 "검색 모달이 QuickSearch의 세부 구현에,
QuickSearch가 검색 모달의 세부 구현에 의존하지 않는다"는 대칭 구조를 유지).

## Complexity Tracking

> 위반 없음 — 이 섹션은 해당 사항 없음.
