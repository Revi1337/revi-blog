# Quickstart: Markdown 기반 아티클 콘텐츠 파이프라인 검증

이 기능이 실제로 동작하는지 로컬에서 확인하는 절차. constitution.md Principle I(빌드 + 실제 브라우저
구동으로 검증)을 따른다.

## Prerequisites

- `content/articles/` 디렉토리와 로더(`lib/content/loader.ts`), 어댑터(`lib/data/articles.ts`)가
  구현되어 있어야 한다.
- 기존 4개 아티클이 `content/articles/*.md`로 마이그레이션되어 있어야 한다.

## 1. 신규 아티클 발행이 코드 수정 없이 되는지 확인 (User Story 1)

```bash
cat > content/articles/quickstart-check.md <<'EOF'
---
title: "Quickstart Check Article"
category: "TEST"
publishedAt: "2026-07-20"
tags: ["TEST"]
---

## First Section

일반 본문 문단.

​```ts {2}
const a = 1
const b = 2 // highlighted
​```

​```metrics
LATENCY: 10ms
EOF

npm run build
```

**Expected**: 빌드 성공. 삭제하지 않으면 홈 카드 목록/상세 페이지에 노출되므로, 확인 후
`rm content/articles/quickstart-check.md`로 정리한다.

## 2. 필수 필드 누락 시 빌드 실패 확인 (FR-006, Edge Case)

```bash
cat > content/articles/broken.md <<'EOF'
---
title: "Missing publishedAt"
category: "TEST"
tags: []
---
본문
EOF

npm run build   # 실패해야 하며, 에러 메시지에 broken.md와 publishedAt이 명시되어야 한다
rm content/articles/broken.md
```

## 3. 실제 브라우저로 다크/라이트 코드 하이라이트 확인 (User Story 2, Principle II)

```bash
npm run dev   # http://localhost:3999
```

`playwright-cli`로:
1. 코드 블록이 있는 아티클 상세 페이지(`/article/architecting-high-concurrency-distributed-systems`
   등 마이그레이션된 slug)로 이동
2. 라이트 테마에서 스크린샷 — 강조된 줄과 일반 줄이 배경 대비로 구분되는지 확인
3. 테마 토글로 다크 전환 후 다시 스크린샷 — 동일하게 구분되는지 확인
4. 콘솔에 하이드레이션/렌더링 에러가 없는지 확인

## 4. 목차(TOC) 클릭 이동 확인 (User Story 3)

같은 페이지에서 TOC 항목 클릭 → 본문의 해당 heading으로 스크롤 이동하는지 확인.

## 5. 회귀 확인

- 홈 페이지(`/`)의 카드 목록에 마이그레이션된 4개 아티클이 모두 제목·발행일·썸네일과 함께 노출되는지
- 이전글/다음글 네비게이션이 `publishedAt` 순서와 일치하는지
