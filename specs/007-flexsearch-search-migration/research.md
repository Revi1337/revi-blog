# Phase 0 Research: FlexSearch 검색 엔진 마이그레이션

이번 기능은 계획 단계 이전에 flexsearch 0.8.212를 별도 스크래치 환경에 설치해 실제 매칭 동작을
직접 실측 검증했다(저장소는 건드리지 않음). Technical Context에 남은 `NEEDS CLARIFICATION`은 없다.
이 문서는 그 실측 결과를 근거로 확정한 결정과 검토했던 대안을 기록한다.

## 1. tokenize 옵션 선택

**Decision**: 모든 `Index`(title/body/tags)를 `{ tokenize: "full" }`로 생성한다.

**Rationale**: 실측 결과 `tokenize: "full"`은 `"cript"` → `"JavaScript"`처럼 단어 중간에서
시작하는 substring도 후보로 반환했다. 텍스트 검색은 "flexsearch 후보 → 원본 `.includes()` 재검증"
패턴을 쓰는데(결정 #2), 이 패턴이 정확하려면 flexsearch의 후보 집합이 정답 집합의 **superset**
이어야 한다 — 즉 flexsearch가 후보로 내놓지 않은 항목은 재검증 단계에서 되살릴 방법이 없다
(false negative는 복구 불가능, false positive만 재검증으로 걸러낼 수 있음). `strict`/`forward`
등 다른 tokenize 값은 단어 접두사만 인덱싱해 중간 substring 검색어를 후보에서 완전히 누락시키므로
이 요구를 만족하지 못한다.

**Alternatives considered**:
- `tokenize: "forward"`(접두사만 부분 매칭) — 인덱스 크기는 작지만 `"cript"` 같은 중간 substring
  쿼리를 후보에서 놓쳐 재검증으로도 복구 불가능한 결과 누락이 생긴다.
- 기본값(`"strict"`, 완전 단어 일치) — 부분 문자열 검색 자체가 불가능해져 spec FR-001(부분 문자열
  매칭)을 원천적으로 만족하지 못한다.

## 2. 텍스트 검색(title/body) 아키텍처

**Decision**: `titleIndex`/`bodyIndex` 두 개의 `Index`를 필드별로 만들고, 검색 시
`index.search(term)`으로 후보 id 집합을 얻은 뒤 **entries를 원래 순서대로 순회하며** 각 후보에
대해 원본 `entry.title.toLowerCase().includes(term)` / `entry.plainBody...includes(term)`을 다시
적용해 최종 title-match/body-match 그룹으로 분류한다(상호 배타, 기존 `runTextSearch`와 동일 규칙).

**Rationale**: 실측 결과 flexsearch의 다중 단어 쿼리(`"security spring"` 등 공백 포함)는 쿼리를
단어 단위로 쪼개 **AND 매칭**한다 — 원문에 두 단어가 연속해서 등장하지 않아도(예: `"OAuth2
Security Deep Dive for Spring Boot"`에서 "Security"와 "Spring" 사이에 다른 단어가 끼어 있어도)
매치시킨다. 반면 기존 네이티브 구현은 공백을 포함한 전체 쿼리를 하나의 연속된 부분 문자열로만
매칭한다. 즉 flexsearch의 기본 다중 단어 매칭은 항상 기존 규칙의 **superset**이며(연속
부분 문자열이면 각 단어도 당연히 개별적으로 존재하므로 flexsearch가 놓치는 경우는 없음을 실측으로
확인), 공백 없는 단일 단어 쿼리에서는 두 결과가 완전히 일치한다(대소문자, `GRPC`/`grpc`,
`oauth2`, 아포스트로피·하이픈·느낌표·마침표를 포함한 문장 등 실제 콘텐츠 패턴으로 실측 확인).
이 superset 성질 덕분에 "후보 조회 → 원본 규칙으로 재검증"만 추가하면 최종 결과가 항상 기존과
바이트 단위로 동일해진다 — flexsearch가 실제 검색을 수행하면서도(spec FR-011) 결과 동일성(spec
SC-001)을 동시에 만족하는 유일한 조합이다.

**Alternatives considered**:
- flexsearch 검색 결과를 재검증 없이 그대로 노출 — 다중 단어 쿼리에서 기존보다 결과가 더 넓게
  나와(예: "security spring"이 실제로는 매치되지 않아야 할 아티클을 매치시킴) spec SC-001(결과
  100% 동일)을 위반한다. 검색 자체는 더 똑똑해지지만 이번 작업의 명시적 요구사항(신규 기능이
  아니라 동일 동작 보장)에 맞지 않는다.
- 인코더의 단어 분리(`split`)를 끄고 전체 문자열을 하나의 토큰으로 취급 — `full` 토크나이저가 문자열
  전체 길이의 제곱에 비례하는 substring을 생성하게 되어(본문은 수천 자 단위) 인덱스 크기와 빌드
  비용이 비현실적으로 커진다. 실용적이지 않다.

## 3. 태그 검색(`#tag`, QuickSearch) 아키텍처

**Decision**: `tags.join(" ")`로 만든 단일 `Index`를 태그 검색과 QuickSearch가 공유한다. 두 곳
모두 여러 태그 토큰을 **호출부에서 미리 공백 기준으로 분리**한 뒤, 토큰 하나씩 개별적으로
`index.search(token)`을 호출해 얻은 id 집합들을 교집합(AND)한다. flexsearch에는 공백이 포함된
문자열을 통째로 넘기지 않는다.

**Rationale**: 결정 #2에서 확인한 "다중 단어 쿼리의 AND-확장" 문제는 flexsearch가 **쿼리 문자열
자체를 단어 단위로 쪼갤 때만** 발생한다. 태그 검색은 원래부터 호출부(`#react node` →
`["react", "node"]`)가 토큰을 미리 분리하므로, flexsearch에는 항상 공백 없는 단일 토큰만
전달된다 — 이 경우 flexsearch의 결과는 재검증 없이도 원본 `matchesAllTags`(대소문자 무시 부분
문자열)와 완전히 동일하다. 실측으로 `GO_1.21`처럼 밑줄·점이 섞인 실제 태그에 대해
`"go_1"`/`"o_1.2"`/`"1.21"` 같은 경계를 가로지르는 substring 쿼리까지 전부 기존 결과와 일치함을
확인했다. 따라서 이 경로는 텍스트 검색과 달리 재검증 단계가 필요 없다.

**Alternatives considered**:
- 태그도 텍스트 검색과 동일하게 "후보 + 재검증" 패턴 적용 — 정확성은 동일하지만 이미 정확히
  일치한다는 것이 증명된 경로에 불필요한 재검증 비용과 코드 복잡도를 추가하는 것이므로 채택하지
  않는다.
- 태그별로 개별 `Index`를 만들지 않고 아티클/카드 전체를 하나의 "문서"로 취급 — AND 교집합을
  구하는 데 굳이 필드 구분이 필요 없어 단일 인덱스로 충분하다.

## 4. 인덱스를 어디서, 언제 빌드할 것인가

**Decision**: flexsearch `Index` 인스턴스는 client component 내부에서 `useMemo`로 빌드한다 —
헤더 검색은 `search-modal.tsx`가 `searchIndex` prop을, 홈페이지는 `entry-stream.tsx`가 `cards`
prop을 각각 dependency로 사용해 데이터가 바뀌지 않는 한 한 번만 빌드한다. 서버(`lib/data/search.ts`,
`lib/data/articles.ts`)가 만들어 내려주는 데이터 형태는 지금처럼 순수 직렬화 가능한 배열
그대로 유지한다.

**Rationale**: flexsearch `Index`/`Document`는 메서드를 가진 클래스 인스턴스라 React Server
Component 경계를 건널 수 없다(RSC props는 직렬화 가능한 값만 허용). 반면 지금 아키텍처는 서버가
`SearchIndexEntry[]`/`BlogCardData[]`라는 plain data를 client component에 prop으로 넘기고,
매칭 로직은 이미 client 쪽(`search-query.ts`)에 있다 — 이 경계를 그대로 유지한 채 "매칭 로직"만
flexsearch로 바꾸면 되므로, 인덱스는 그 client component 안에서 빌드하는 것이 유일하게 자연스러운
지점이다. `useMemo`로 감싸는 이유는, 인덱스 빌드가 매 키 입력마다 반복되면 flexsearch를 도입한
목적(인덱스 기반 조회) 자체가 무의미해지기 때문이다 — `searchIndex`/`cards`는 이미 안정적인
참조(부모로부터 한 번 내려오는 prop)이므로 `useMemo`의 dependency로 적합하다.

**Alternatives considered**:
- 서버에서 `.export()`로 직렬화한 인덱스 데이터를 내려주고 클라이언트에서 `.import()` — 이번
  콘텐츠 규모(수십 편)에서는 클라이언트 빌드 비용 자체가 무시할 만한 수준이라 왕복 직렬화/역직렬화
  구조를 추가할 이유가 없다. 향후 콘텐츠가 크게 늘어나면 재검토할 수 있는 최적화이지 이번 범위는
  아니다(spec Assumptions).
- 모듈 최상위 스코프(컴포넌트 바깥)에서 전역으로 한 번 빌드 — `lib/content/search-index.ts`처럼
  Node.js `fs`를 쓰는 서버 전용 모듈이 아니므로 client 번들에서도 동작은 하지만, entries/cards가
  prop으로 흘러들어오는 현재 구조에서는 컴포넌트 로컬 `useMemo`가 더 명확하고 테스트하기 쉽다.

## 5. QuickSearch 번들 크기 트레이드오프

**Decision**: QuickSearch(`entry-stream.tsx`)도 flexsearch 기반 `createTagIndex`로 통일한다.
헤더 검색과 마찬가지로 `{ Index }`만 import해 tree-shaking을 활용한다.

**Rationale**: `esbuild`로 `{ Index }`만 import해 번들링한 결과 minify 후 약 49KB, gzip 후 약
17KB였다. 헤더 검색은 이미 `next/dynamic`으로 지연 로딩되므로 이 비용이 문제되지 않지만, 홈페이지
QuickSearch는 eager 렌더라 초기 번들에 이 비용이 그대로 더해진다. 반면 `lib/data/tag-match.ts`가
006 커밋에서부터 "검색 모달과 QuickSearch가 태그 매칭 규칙을 공유해 갈라지지 않게 한다"는 원칙으로
설계되어 있어, 한쪽만 flexsearch로 옮기고 다른 쪽을 네이티브로 남기면 두 개의 서로 다른 태그
매칭 구현을 유지해야 하는 회귀 위험이 다시 생긴다. 사용자가 이 트레이드오프(번들 +17KB vs
구현 통일)를 검토하고 통일하는 쪽을 명시적으로 선택했다.

**Alternatives considered**:
- 헤더 검색만 flexsearch로 옮기고 QuickSearch는 `matchesAllTags`(네이티브)를 유지 — 초기 번들
  비용은 없지만 태그 매칭 구현이 두 곳으로 갈라져 006의 설계 원칙을 되돌리게 된다. 사용자에게
  트레이드오프를 제시한 뒤 기각됨.

## 6. 검증 전략

**Decision**: `npm run build`로 빌드·타입 체크를 통과시킨 뒤, 실제 브라우저 검증은
`claude-in-chrome` → 불가하면 `playwright-cli` → 그것도 불가하면 `playwright` MCP 서버 순으로
시도한다.

**Rationale**: Constitution Principle I은 빌드 후 실제 브라우저 구동을 요구한다. 이번 기능은
매칭 결과의 **정확한 동일성**이 핵심 성공 기준(spec SC-001~003)이므로, 코드 리뷰나 타입체크만으로는
검증할 수 없고 실제 검색어/태그 조합을 입력해 결과를 직접 비교해야 한다. 세 도구를 우선순위
체인으로 둔 것은 어느 하나가 이 환경에서 동작하지 않을 경우를 대비한 폴백이다.

**Alternatives considered**:
- 유닛 테스트만으로 검증 종료 — 이 저장소에는 별도 테스트 러너가 구성되어 있지 않고(005/006도
  동일하게 브라우저 구동 검증을 채택), 실제 cmdk 키보드 상호작용·하이라이트 렌더링까지 확인하려면
  브라우저 구동이 필요하다.
