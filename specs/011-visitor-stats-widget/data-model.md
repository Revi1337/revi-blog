# Data Model: 방문자 및 게시글 조회수 통계

Redis 키-값 구조로만 표현되며, 관계형 스키마는 없다. 모든 값은 정수(카운터) 또는 존재 여부(dedup 플래그)다.

## 일별 방문 dedup 플래그 (spec: Daily Visit Record)

- **키**: `visited:{date}:{ip}` (예: `visited:2026-07-30:1.2.3.4`)
- **값**: `"1"` (존재 여부만 의미 있음)
- **TTL**: 24시간 (자정 이후 자동 만료, 별도 정리 작업 불필요)
- **용도**: 이 IP가 이 날짜에 이미 전역 방문자 수에 집계됐는지 판단하는 dedup 체크. 이 키가 없을 때만 아래 두 카운터를 증가시키고, 이 키를 새로 생성한다.

## 사이트 전역 방문자 카운터 (spec: 사이트 전역 방문자 카운터)

- **`visits:total`**: 정수. 서비스 시작 이후 누적된 순 방문자 수 총합. dedup 통과 시에만 +1.
- **`visits:daily:{date}`**: 정수, 날짜별로 키가 분리됨(예: `visits:daily:2026-07-30`). dedup 통과 시에만 +1.
  - "오늘 방문자 수" = 오늘 날짜의 `visits:daily:{today}` 값
  - "어제 방문자 수" = 어제 날짜의 `visits:daily:{yesterday}` 값 (날짜가 지나 더 이상 쓰기가 없으므로 자연히 불변)

## 게시글 조회수 카운터 (spec: 게시글 조회수 카운터)

- **`pageviews:{slug}`**: 정수. 해당 slug의 아티클이 열람될 때마다(dedup 없이) +1.
- slug는 아티클의 식별 기준이며, `title` 등 slug 외 frontmatter 속성 변경에는 영향받지 않는다(기존 `lib/content/loader.ts`의 slug 결정 로직 그대로 재사용 — `frontmatter.slug ?? slugifyFilename(...)`).
- slug 자체가 바뀌면 새 키로 조회수가 0부터 시작한다(spec FR-010, 의도된 동작).

## 봇/크롤러 판별 (파생 데이터 아님, 요청 단계 필터)

- Redis에 저장되는 엔티티가 아니라, Middleware가 카운터 증가 로직을 실행하기 **전에** 요청의 `User-Agent` 헤더를 검사해 걸러내는 게이트다.
- 봇으로 판별된 요청은 위 세 종류의 키 중 어느 것도 읽거나 쓰지 않는다(Redis 커맨드 사용량 절약 효과도 있음).
