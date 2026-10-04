# API Contract: 원문 서빙

`components/article/copy-page-menu.tsx`의 "Copy Page"(클릭 시 `fetch`)와 "View as Markdown"(`<a href>` 직접 이동)이 사용하고, "Open in ChatGPT"/"Open in Claude"의 프롬프트가 참조하는 URL이기도 하다(ChatGPT/Claude가 그 URL을 직접 가져가 읽음). 읽기 전용(GET)이며, 이 라우트를 통해서만 `RawMarkdownCache`(data-model.md 참고)에 접근할 수 있다.

## GET /article/{slug}/raw

**Runtime**: Node (고정 — `runtime: "edge"` 지정 금지, plan.md Constraints 참고)

**Path Parameters**

| 이름 | 타입 | 설명 |
|---|---|---|
| slug | string | 아티클 slug (`lib/data/articles.ts`의 `Article.slug`와 동일, `/article/{slug}` 페이지와 동일한 slug 집합) |

**Response 200**

```text
Content-Type: text/markdown; charset=utf-8

---
title: "..."
date: "..."
tags: ["...", "..."]
...
---

(본문 마크다운, 저자가 작성한 그대로 — 비공개 메모(%%...%%)는 제외됨)
```

본문은 `getArticleRawMarkdown(slug)`가 반환하는 문자열을 그대로, 어떤 가공도 거치지 않고 응답 바디로 돌려준다.

**Response 404**: `getArticleRawMarkdown(slug)`가 `undefined`를 반환할 때(해당 slug의 글이 존재하지 않을 때) — `/article/{slug}` 페이지 자체가 `notFound()`로 처리하는 것과 동일한 slug 판정 기준(`getArticleBySlug`)을 공유한다.

## 캐싱/재검증

서버는 매 요청마다 이미 메모리에 있는 `Map`을 조회할 뿐 디스크 I/O나 외부 호출이 없다(data-model.md의 `RawMarkdownCache` 참고) — 응답 자체에 별도 `Cache-Control`을 지정할 필요는 없다(정적 콘텐츠지만 트래픽 규모상 캐싱 레이어가 필요한 수준이 아님, `stats-api.md`가 Redis 조회에 대해 내린 결론과 동일한 판단).

## 이 계약을 사용하는 쪽

| 사용처 | 사용 방식 |
|---|---|
| "Copy Page" | 클릭 시 `fetch(...)` → 응답 텍스트를 `navigator.clipboard.writeText()`로 복사. 실패(네트워크 에러, 404, 클립보드 거부) 시 에러 피드백 표시(spec FR-010, research.md §6). |
| "View as Markdown" | `<a href="/article/{slug}/raw" target="_blank">` — 브라우저가 직접 GET, 플레인 텍스트로 렌더링됨. |
| "Open in ChatGPT" / "Open in Claude" | 각 서비스의 `?q=` 프롬프트 안에 **절대 URL**(`window.location.origin` 기준, research.md §5)로 이 경로를 포함 — 두 서비스가 그 URL을 직접 가져가 읽는다. |
