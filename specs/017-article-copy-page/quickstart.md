# Quickstart: 아티클 Copy Page 메뉴

구현 완료 후 이 기능이 end-to-end로 동작하는지, 그리고 (가장 중요하게) **TOC 스크롤 동작이 전혀 회귀하지 않았는지** 확인하는 절차다. 데이터 형태는 [data-model.md](./data-model.md), API 계약은 [contracts/raw-markdown-route.md](./contracts/raw-markdown-route.md)를 참고한다.

## Prerequisites

- `lib/content/loader.ts`, `lib/data/articles.ts`, `app/article/[slug]/raw/route.ts`, `components/article/copy-page-menu.tsx`, `app/article/[slug]/page.tsx` 구현 완료.
- 검증용 글: 가장 짧은 실제 글 `content/articles/datastructure/MST.md`(slug: `MST`, 23줄)와 가장 긴 실제 글 `content/articles/language/python/Scope.md`(slug: `Scope`, 534줄) — 이 둘이 TOC 데드존 회귀 검증의 양 극단이다.

## Setup

```bash
npm run build
```

**Expected**: 빌드가 에러 없이 성공한다. `app/article/[slug]/raw/route.ts`가 Node 런타임으로 빌드되는지(Edge로 잘못 분류되지 않는지) 빌드 출력의 라우트 목록에서 확인한다.

```bash
npm run dev
```

`loader.ts`를 수정했으므로 top-level await 캐시가 걸려 있다 — 이미 떠 있는 `next dev`가 있다면 최초 1회 재시작한다(constitution Principle I).

## TOC 회귀 검증 (spec FR-009/SC-004, 가장 중요 — 다른 모든 검증보다 먼저 수행)

이 검증은 "`toc-sidebar.tsx`를 한 글자도 수정하지 않았다"는 전제를, 숫자로 직접 확인하는 단계다.

1. **기능 추가 전 기준값 측정** (아직 `<CopyPageMenu>`를 `page.tsx`에 연결하기 전, 또는 임시로 주석 처리한 상태): `/article/Scope`(가장 긴 글)에서 끝까지 스크롤하며, TOC 사이드바가 `sticky`로 고정되어 있다가 풀려서 함께 스크롤되기 시작하는 **스크롤 위치(px)**를 기록한다. `/article/MST`(가장 짧은 글)에서도 동일하게 기록한다(짧은 글은 애초에 고정 구간이 거의 없을 수 있다 — 그 자체를 기준값으로 기록).
2. **기능 추가 후 동일 측정**: `<CopyPageMenu>` 연결 후 위 두 글에서 동일한 측정을 반복한다.
3. **비교**: 두 글 모두에서 1번과 2번의 스크롤 위치가 **완전히 동일**해야 한다. 1px이라도 어긋나면 데드존이 생겼다는 뜻이며, `copy-page-menu.tsx`가 TOC의 `sticky top-40` 박스와 분리된 독립 요소로 구현됐는지(plan.md Constraints)부터 다시 확인한다.
4. **시각적 확인**: `/article/Scope`에서 스크롤하며 Copy Page 메뉴와 TOC 박스가 항상 같은 간격을 유지하며 함께 움직이는지(둘 다 각자 sticky로 같은 타이밍에 고정되는지) 눈으로도 확인한다 — 메뉴의 정확한 `top` 오프셋은 이 단계에서 실측해 확정한다(research.md §1, 추측값 하드코딩 금지).
5. **기존 TOC 기능 자체의 회귀 없음 확인**: `/article/Scope`에서 스크롤하며 TOC의 활성(active) 항목 하이라이트가 지금까지와 동일하게 정확히 갱신되는지, TOC 항목 클릭 시 정상적으로 이동하는지 확인(이 기능은 `toc-sidebar.tsx` 내부 로직을 건드리지 않으므로 변화가 없어야 한다).

## Functional Validation (playwright-cli)

6. **Copy Page (User Story 1)**: 데스크탑 뷰포트에서 `/article/{slug}` 방문 → 메뉴에서 "Copy Page" 클릭 → 클립보드 내용을 확인해 제목/날짜/태그 등 메타정보와 본문 전체가 원문 그대로 들어있는지 확인.
7. **비공개 메모 제외 (spec FR-008)**: `%%비공개 메모%%`를 포함한 임시 검증용 글(또는 기존 글에 임시로 추가) → "Copy Page"로 복사한 내용과 `/article/{slug}/raw` 응답 양쪽에 그 메모가 전혀 나타나지 않는지 확인. 검증 후 원상 복구.
8. **View as Markdown (User Story 2)**: 메뉴에서 "View as Markdown" 클릭 → 새 탭에 `/article/{slug}/raw`가 열리고 원문이 그대로 표시되는지 확인.
9. **Open in ChatGPT / Open in Claude (User Story 3·4)**: 각각 클릭 → 새 탭에서 해당 서비스가 열리고, 입력창에 그 글을 읽어달라는 프롬프트가 채워져 있는지(자동 전송되지 않는지) 확인.
10. **모바일 미노출 (spec FR-002/SC-005)**: 모바일 뷰포트로 전환 → 메뉴가 전혀 렌더링되지 않는지 확인.
11. **TOC 없는 글에서도 메뉴 노출 (spec FR-011)**: 헤딩이 없어 TOC가 비는 글(또는 임시로 헤딩을 모두 제거한 글) 방문 → TOC 사이드바는 비어도 메뉴는 정상적으로 보이는지 확인.
12. **Copy Page 실패 피드백 (spec FR-010)**: 브라우저 개발자 도구로 클립보드 권한을 차단하거나 `/article/{slug}/raw` 요청을 오프라인으로 실패시킨 뒤 "Copy Page" 클릭 → 사용자가 실패를 알 수 있는 피드백이 보이는지 확인(조용히 아무 반응 없음이 아니어야 함).

## Route Contract Validation

13. `curl -i http://localhost:3000/article/MST/raw` — `200`, `Content-Type: text/markdown`, 응답 바디가 `MST.md`의 frontmatter+본문과 (비공개 메모 제외하고) 일치하는지 확인.
14. `curl -i http://localhost:3000/article/존재하지않는slug/raw` — `404` 확인.
