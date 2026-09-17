# TODO

## content/articles 증분 빌드 최적화 (보류)

**상태**: 보류 — 글 개수가 충분히 쌓이기 전까지 착수하지 않음

**배경**: `next build`는 `content/articles/**` 하위 모든 마크다운을 매번 처음부터 재렌더링한다
(`lib/data/articles.ts`의 top-level `await loadArticles()` + `lib/content/loader.ts`의
`fs.readdirSync` 전체 스캔 구조 때문). Obsidian Quartz처럼 "변경된 문서만" 재변환하는 캐시
레이어(예: 파일 content hash → 렌더링 결과 캐시)를 만들 수 있는지 검토했음.

**실측 (2026-08-01, 로컬 머신 기준)**: `content/articles/`에 파일을 실제로 늘려가며
`rm -rf .next && npm run build`를 반복 측정 (측정 후 벤치용 파일은 모두 삭제, 원상복구 완료):

| 총 md 파일 수 | static-gen 단계 | build 전체(wall-clock) |
|---|---|---|
| 27 (당시 실제 개수) | 11.5s | 28.1s |
| 100 | 12.2s | 28.5s |
| 227 | 16.7s | 35.6s |
| 627 | 39.1s | 66.0s |

파일당 CPU 비용은 대략 0.5초로 선형이지만, 워커 병렬성(로컬 ~6코어)이 200개대까지는 거의 다
흡수해서 체감(wall-clock)은 300~600개 구간부터 꺾이기 시작한다. 1000개로 외삽해도 로컬 기준
1.5~2분 선이라 아직 "빌드가 못 쓸 정도"는 아님.

**결론**: 지금(2026-08-01) 실제 글 개수는 27개뿐이라 최적화 실익이 없음. 옛 블로그
(revi1337.github.io, Quartz)에 있는 나머지 글(150+)을 다 이관해도 여전히 30초대라 여유 있음.

**재검토 조건**: `find content/articles -name "*.md" | wc -l`로 확인했을 때 글 개수가 대략
500개를 넘어서거나, 체감상 build 시간이 실제로 불편해지는 시점에 다시 실측 후 필요하면 착수.

## wikilink 헤딩 앵커 지원 (`[[Note#Heading]]`, `[[#Heading]]`)

**상태**: 보류 — `feat/wikilink-filename-resolution` 브랜치에서 파일명/경로 기반 wikilink 매칭(옵시디언과
동일하게 `[[Tree]]`/`[[Tree.md]]`/`[[경로/Tree]]`/`[[경로/Tree.md]]` 전부 지원)은 구현·검증 완료했지만,
헤딩 앵커는 그 작업에서 의도적으로 제외함.

**배경**: `lib/content/plugins/remark-obsidian-links.ts`는 지금 `[[Note#Heading]]`,
`[[Note#Heading|별칭]]`, `[[#Heading]]`(같은 문서 내 앵커) 전부 대상 문서/헤딩을 못 찾고 plain
text로 fallback한다. 실제로 `content/articles/language/python/Scope.md`(`[[Scope#주의점|...]]`)와
`content/articles/algorithm/Prefixsum.md`(`[[#Index 0 Base 엣지 케이스]]`)에서 이 문제로 링크가
깨져 있음(둘 다 이미 plain text로 렌더링되는 중이라 당장 회귀 위험은 없음).

**필요 작업**: 지금 `lib/content/loader.ts`는 title/slug만 전체 글 대상으로 사전 수집(2-pass)하는데,
헤딩 앵커를 풀려면 문서별 헤딩 id 목록까지 사전에 수집해야 함(TOC 생성에 쓰는 슬러그화 규칙과
동일하게). 같은 문서 내 앵커(`[[#Heading]]`)는 렌더링 중인 문서 자신의 헤딩을 참조하는 별도
로직이 추가로 필요해서, 파일명 매칭보다 스코프가 큼.

**재검토 조건**: 헤딩 앵커 wikilink를 쓸 실제 수요(예: 옛 블로그 이관 중 앵커 참조가 많이
나온다거나)가 생기면 착수.

## wikilink `aliases:` frontmatter 지원

**상태**: 보류 — 필요성 미확인

**배경**: 옵시디언이 노트 제목(파일명) 외에 공식으로 지원하는 유일한 대체 매칭 필드는
`aliases:` frontmatter인데(임의의 `title` 필드가 아님), 지금 이 블로그엔 이 필드가 없고
와일드카드 매칭 로직도 없음. `feat/wikilink-filename-resolution`에서 wikilink 매칭을 순수
파일명/경로 기반으로 옮기면서 `title` 기반 매칭은 의도적으로 제거했는데(옵시디언 시맨틱과
어긋나서), 그 대체재로 `aliases:`를 지원할지는 아직 미정.

**재검토 조건**: 파일명과 다른 별칭으로 wikilink를 걸고 싶은 실제 케이스가 생기면 착수.
