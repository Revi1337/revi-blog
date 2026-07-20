# Research: 아티클 통합 검색

Phase 0 산출물. spec.md에 [NEEDS CLARIFICATION] 마커가 없었으므로, 여기서는 plan 프롬프트가 지정한
기술적 방향을 검증하고 근거를 남기는 데 집중한다.

## 1. 검색 인덱스 생성 시점/위치

**Decision**: 서버 사이드에서 빌드 시 1회 구성한 검색 인덱스를 클라이언트 컴포넌트로 props 전달한다.
API 라우트를 통한 매 요청(키 입력)마다의 서버 필터링은 채택하지 않는다.

**Rationale**: 콘텐츠는 정적 마크다운 파일(`content/articles/*.md`)이라 요청마다 달라지지 않고, 현재
아티클 수(8개)가 작아 인덱스 전체를 클라이언트로 넘겨도 페이로드 부담이 미미하다. 기존
`lib/data/articles.ts`가 이미 모듈 최상위 `await loadArticles()`로 빌드 시 1회 로드하는 패턴을 쓰고
있어, 같은 패턴(`lib/data/search.ts`)으로 일관성을 유지할 수 있다. API 라운드트립이 없으므로
SC-002("입력을 멈춘 뒤 결과가 체감상 즉시 나타남")를 네트워크 지연 걱정 없이 만족시킨다.

**Alternatives considered**:
- `app/api/search/route.ts` + 클라이언트 fetch: 매 키 입력마다 네트워크 왕복이 발생해 체감 지연
  리스크가 생기고, 이 정도 데이터 규모에는 불필요한 인프라다.

## 2. 본문 plain-text 추출 방법

**Decision**: `lib/content/loader.ts`가 이미 갖고 있는 마크다운 AST(remark 파싱 결과)에
`mdast-util-to-string`(기존 의존성, `lib/content/plugins/remark-toc.ts`에서 이미 heading 텍스트 추출용으로
사용 중)을 적용해 검색 전용 plain-text 필드를 만든다.

**Rationale**: 새 의존성을 추가하지 않고, 마크다운 문법 기호(`**`, 헤딩 `#`, 링크 문법 등)를 안전하게
제거한 순수 텍스트를 얻을 수 있다. 이미 검증된 패턴(remark-toc)을 재사용하므로 회귀 리스크가 낮다.

**Alternatives considered**:
- `bodyHtml`(rehype 산출물)을 정규식으로 태그 스트리핑: 코드 블록 하이라이팅(`rehype-pretty-code`)·
  KaTeX 렌더링 산출물 등 구조가 복잡한 HTML이 섞여 있어 노이즈/오탐 위험이 크다.
- `hast-util-to-string`(기존 의존성) 적용: bodyHtml 대신 hast 트리 단계에서 적용 가능하지만, mdast
  단계가 렌더링 플러그인(코드 하이라이팅 등) 개입 이전이라 원문에 더 가깝다.

## 3. 매칭/랭킹 로직

**Decision**: 외부 검색 라이브러리(Fuse.js, MiniSearch 등)를 추가하지 않고, 순수 TypeScript
`string.toLowerCase().includes()` 기반 substring 매칭을 직접 구현한다.

**Rationale**: FR-016이 fuzzy matching·형태소 분석을 명시적으로 범위 밖으로 규정했고, 데이터 규모(10개
미만 아티클)에서 알고리즘 복잡도가 문제되지 않는다. 랭킹 규칙(제목 매치 우선 → 본문 매치)도 매치 위치
플래그만으로 직접 정렬 가능해 라이브러리의 스코어링 모델을 빌릴 필요가 없다.

**Alternatives considered**:
- Fuse.js: fuzzy 매칭이 기본 기능인데 요구사항에 없어 번들 크기만 늘어난다.
- MiniSearch: 대규모 문서 인덱싱에 최적화된 라이브러리로 이 규모에는 과잉 설계다.

## 4. 모달/커맨드 팔레트 구현

**Decision**: `cmdk` 패키지의 `Command.Dialog`를 채택한다. cmdk 내장 fuzzy 필터(`command-score`)는
`shouldFilter={false}`로 비활성화하고, 필터링/랭킹은 2·3번 항목에서 만든 순수 함수로 직접 제어한다.

**Rationale**: 사용자가 명시한 "Algolia DocSearch류" 요구는 방향키 이동, 선택 항목 강조, 키보드 힌트
푸터 같은 표준적인 커맨드 팔레트 UX다. cmdk는 이 인터랙션 패턴(roving 포커스, 방향키 탐색, Enter 선택,
WAI-ARIA combobox role)과 포커스 트랩·Esc 닫기·스크롤 락을 이미 구현하고 있어, 직접 만들 때 발생하는
접근성 디테일(예: 스크린 리더용 aria-activedescendant 관리)을 다시 만들 필요가 없다. 프로젝트가 이미
`@radix-ui/react-slot`을 쓰고 있어 Radix 생태계 의존성 추가에 대한 진입 장벽도 낮다.

**Alternatives considered**:
- `@radix-ui/react-dialog`만 추가하고 리스트 키보드 탐색은 직접 구현: 포커스 관리·ARIA를 손으로 만들어야
  해 범위가 커지고 버그 위험이 높다.
- 완전 수동 구현(라이브러리 없음): 위와 같은 이유로 기각. 포커스 트랩/Esc/스크롤 락까지 전부 새로 구현해야
  한다.

## 5. 실시간 입력 반응성

**Decision**: React 19 `useDeferredValue`로 입력값을 감싸고, 필터링/랭킹 계산은 deferred 값을 기준으로
수행한다. 별도의 `setTimeout` 기반 debounce 유틸은 만들지 않는다.

**Rationale**: `vercel-react-best-practices`의 `rerender-use-deferred-value` 규칙과 정합하며(Constitution
Principle III), React 19 네이티브 API로 충분히 해결되는 문제에 커스텀 debounce를 추가하는 것은 불필요한
복잡도다.

## 6. 번들 영향 최소화

**Decision**: `cmdk`와 검색 모달/결과 컴포넌트는 `next/dynamic`으로 지연 로드한다. 헤더에 상시 노출되는
`search-trigger.tsx`(버튼 역할, 텍스트 입력 없음)만 즉시 로드한다.

**Rationale**: `bundle-dynamic-imports` 규칙(Constitution Principle III)에 따라, 검색을 한 번도 열지
않는 방문자의 초기 헤더 번들에 `cmdk`와 검색 인덱스 데이터가 포함되지 않도록 한다.

## 7. `Ctrl+K`/`Cmd+K` 전역 단축키

**Decision**: `use-search-shortcut.ts` 훅에서 `document`에 `keydown` 리스너를 등록하고, `event.target`이
`input`/`textarea`/`contenteditable` 요소일 때는 무시한다. `useEffect` cleanup으로 리스너를 해제한다
(`client-event-listeners` 규칙 준수).

**Rationale**: 다른 폼 입력 중 방문자가 실수로 `k`를 눌러 모달이 열리는 것을 방지해야 한다(브라우저
기본 동작과의 충돌 방지이기도 함 — 대부분의 커맨드 팔레트 구현이 채택하는 표준 관례).

## 8. `showOnHomepage=false` 아티클의 데이터 유출 방지

**Decision**: `lib/content/search-index.ts`는 `loader.ts`가 반환한 전체 아티클 배열을 받되, 인덱스
엔트리를 만드는 시점에 `showOnHomepage === true`인 것만 남긴다. 이 필터링은 클라이언트 컴포넌트가 아니라
인덱스를 구성하는 서버 사이드 모듈 내부에서 수행한다.

**Rationale**: FR-017 + spec Assumptions("검색으로 우연히 발견되면 안 된다")를 만족시키려면, 숨겨진
아티클의 제목/본문 텍스트 자체가 클라이언트로 전달되는 페이로드(HTML/JS 번들)에 포함되지 않아야 한다.
런타임에 UI에서만 숨기는 방식은 브라우저 개발자 도구로 원본 데이터가 노출될 수 있어 요구사항을
충족하지 못한다.

## 9. `core/*.html` 동기화 범위

**Decision**: 4개 정적 목업 파일에는 검색 트리거의 마크업/스타일(placeholder 문구 + `Ctrl+K` 뱃지)만
반영한다. 검색 모달 자체(입력 상호작용, 결과 리스트, cmdk 등)는 정적 HTML로 재현하지 않는다.

**Rationale**: `core/*.html`은 인터랙션이 없는 정적 디자인 프리뷰이며, 기존 관례(테마 토글 등 다른
인터랙티브 요소도 목업에서는 정적 아이콘으로만 표현됨)와 일치한다. Constitution Principle II가 요구하는
것은 "레이아웃/스타일"의 다크·라이트 동시 반영이지, 동적 기능의 재구현이 아니다.

## 남은 NEEDS CLARIFICATION

없음 — spec.md의 Assumptions 섹션이 이번 기능 범위의 모든 기술 외적 모호함을 이미 해소했고, 위 9개
항목이 기술적 모호함을 모두 해소한다.
