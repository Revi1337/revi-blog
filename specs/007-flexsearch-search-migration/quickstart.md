# Quickstart: FlexSearch 검색 엔진 마이그레이션 검증

이 문서는 구현이 끝난 뒤 검색 결과가 마이그레이션 이전과 동일한지 확인하는 절차다. 구현 코드나
테스트 코드 전체를 담지 않는다 — 세부 작업은 `tasks.md`(`/speckit-tasks`)에서 다룬다.

## 준비

```bash
npm install   # flexsearch@^0.8.212가 이미 package.json에 있어야 함
npm run build
npm run dev   # http://localhost:3999
```

`npm run build`가 타입 에러 없이 끝나야 한다(특히 `lib/data/tag-match.ts`의 시그니처가
`matchesAllTags` → `createTagIndex`로 바뀌므로, 이를 소비하는 모든 지점이 갱신됐는지가 여기서
드러난다).

가능하면 구현 직전에 현재(네이티브) 구현 기준으로 아래 시나리오들의 결과(매치된 아티클 slug
목록과 순서)를 한 번 기록해 두고, 마이그레이션 후 같은 시나리오를 재실행해 두 결과를 직접 대조한다
— spec SC-001~003이 요구하는 "100% 동일"은 이렇게 전/후 스냅샷을 비교해야 확실히 검증된다.

## 시나리오 1 — 헤더 텍스트 검색: 제목/본문 랭킹 (spec US1)

1. `/` 접속 후 Ctrl+K(또는 Cmd+K)로 검색을 연다.
2. 제목에 직접 포함된 단어를 검색한다 — 예: `gRPC`를 입력하면 제목에 "gRPC"가 들어간 아티클(예:
   *The Future of gRPC in Browser-Based Applications*)이 상단에 나타나는지 확인한다.
3. 대소문자를 바꿔(`grpc`, `GRPC`) 같은 결과가 나오는지 확인한다.
4. 본문에만 등장하고 어떤 아티클 제목에도 없는 단어를 하나 골라 검색한다. **기대 결과**: 그 단어가
   포함된 아티클이 본문 발췌("↳ …")와 함께 나타나고, 하이라이트(`<mark>`)가 매치 지점에 정확히
   씌워진다.
5. 제목과 본문에 동시에 매치될 수 있는 단어(예: 아티클 제목의 핵심 키워드)를 검색해, 그 아티클이
   제목 매치 그룹에 한 번만 나타나고(본문 발췌 없이) 목록에 중복되지 않는지 확인한다.
6. 존재하지 않는 단어(`zzzznotfound`)를 검색해 "No results found."가 표시되는지 확인한다.

## 시나리오 2 — 헤더 태그 검색: 단일/다중 AND (spec US2)

1. `#grpc`를 입력한다. **기대 결과**: `GRPC` 태그를 가진 모든 아티클(현재 콘텐츠 기준 *The Future
   of gRPC in Browser-Based Applications*, *Architecting High-Concurrency Distributed Systems*
   2편)이 랭킹 없이 원래 순서대로 나타나고, 발췌 줄에 매칭된 태그가 하이라이트된다.
2. `#kafka spark`처럼 공백으로 두 토큰을 입력한다. **기대 결과**: `KAFKA`와 `SPARK` 태그를 모두
   가진 아티클(*Kafka Streams vs Spark*)만 나타난다.
3. 서로 다른 아티클에만 각각 존재하는 두 태그를 조합해 검색해(예: `#grpc postgresql`), 어느
   아티클도 나타나지 않는지(AND 조건 미충족) 확인한다.
4. `#`만 입력하고 아무 글자도 추가하지 않는다. **기대 결과**: 검색 힌트가 아니라 "No results
   found."가 표시된다.

## 시나리오 3 — 홈페이지 QuickSearch 필터 (spec US3)

1. 홈페이지에서 `GRPC` QuickSearch 버튼을 클릭한다. **기대 결과**: `GRPC` 태그를 가진 카드만
   그리드에 남는다.
2. `KAFKA + SPARK` 버튼을 클릭한다. **기대 결과**: 두 태그를 모두 가진 카드만 남는다.
3. 활성화된 버튼을 다시 클릭해 해제하고, 전체 카드로 복귀하는지 확인한다.
4. `OAUTH2 + SECURITY` 버튼을 클릭해 동일한 AND 규칙이 적용되는지 확인한다.

## 엣지 케이스 확인

- 태그에 언더스코어/점이 섞인 경우(예: `GO_1.21`)를 `#go_1`처럼 경계를 가로지르는 부분 문자열로
  검색해도 매치되는지 확인한다.
- 제목/본문에 아포스트로피·하이픈·느낌표가 포함된 문장을 검색어가 가로지를 때도 매치가 누락되지
  않는지 확인한다(예: 제목에 콜론이나 괄호가 포함된 아티클로 검증).
- `showOnHomepage: false`인 아티클(`content/articles/_syntax-preview.md`, 태그 `TEST`)이 헤더
  검색·태그 검색·QuickSearch 어디에도 노출되지 않는지 확인한다.
- 키보드 내비게이션(↑↓, PageUp/PageDown, Home/End, Enter, Esc)이 매칭 엔진 교체와 무관하게
  기존과 동일하게 동작하는지 확인한다.
- 검색 입력 중 렉·끊김 없이 반응하는지 확인한다(`useDeferredValue` 경로 회귀 여부).

## 검증 도구 우선순위 (spec와 plan Testing 항목 그대로)

1. `npm run build`
2. `claude-in-chrome`으로 위 시나리오를 직접 조작 — 우선 시도
3. 불가하면 `playwright-cli`로 동일 시나리오를 구동
4. 그것도 여의치 않으면 `playwright` MCP 서버(스크린샷 도구 포함)로 대체

## 완료 기준

- 시나리오 1~3과 엣지 케이스 전부가 실제 브라우저 구동으로 확인되어야 "완료"로 간주한다
  (Constitution Principle I — 코드 리뷰/타입체크만으로는 완료 처리하지 않는다).
- 마이그레이션 전/후 스냅샷을 비교했을 때 매치된 아티클 집합과 순서에 차이가 하나라도 있으면
  원인을 규명하고 수정할 때까지 완료로 간주하지 않는다(spec SC-001~003).
