# API Contract: 통계 조회

두 API route 모두 `VisitorStatsWidget`의 `useVisitorStats()` 훅이 클라이언트에서 호출한다. 두 route 다 읽기 전용(GET)이며, 카운터 증가는 이 route들이 아니라 Middleware에서 발생한다.

## GET /api/stats

사이트 전역 지표만 필요한 페이지(홈, 북마크)에서 사용.

**Response 200**

```json
{
  "total": 12345,
  "today": 42,
  "yesterday": 88
}
```

| 필드 | 타입 | 설명 |
|---|---|---|
| total | number | 서비스 시작 이후 누적 순 방문자 수 |
| today | number | 오늘 순 방문자 수 |
| yesterday | number | 어제 최종 순 방문자 수 (불변값) |

## GET /api/stats/{slug}

아티클 상세 페이지에서 사용. 전역 지표에 그 게시글의 조회수를 더해 반환한다.

**Path Parameters**

| 이름 | 타입 | 설명 |
|---|---|---|
| slug | string | 아티클 slug (`lib/data/articles.ts`의 `Article.slug`와 동일) |

**Response 200**

```json
{
  "total": 12345,
  "today": 42,
  "yesterday": 88,
  "views": 231
}
```

| 필드 | 타입 | 설명 |
|---|---|---|
| total, today, yesterday | number | GET /api/stats와 동일 |
| views | number | 이 slug의 누적 조회수 |

**Response 404**: slug에 해당하는 아티클이 존재하지 않을 때. `views`는 생략하지 않고 `0`으로 반환할지, 404로 응답할지는 구현 시 `getArticleBySlug` 존재 여부로 결정한다(존재하지 않는 slug에 대한 조회수를 굳이 생성/노출할 필요는 없음).

## 캐싱/재검증

두 route 모두 서버에서 매 요청 시 Redis를 직접 조회한다(별도 캐싱 레이어 없음 — Redis 자체가 이미 충분히 빠르고, 요청량이 무료 티어 한도 내에서 여유 있음). 클라이언트 측 dedup은 SWR이 담당한다(연구 문서 §5 참고).
