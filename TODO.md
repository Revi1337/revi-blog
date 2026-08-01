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
