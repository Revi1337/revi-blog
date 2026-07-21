# Quickstart: Giscus 게시글 댓글 검증

이 문서는 구현 완료 후 Constitution Principle I(Feature-Level Verification)에 따라 실제로 기능을 구동해 검증하는 절차다.

## 사전 조건

- `@giscus/react`가 설치되어 있다 (`package.json` dependencies에 포함).
- https://github.com/apps/giscus 앱이 `Revi1337/revi-blog-comments`에 설치되어 있다 (완료됨).
- 댓글이 하나 이상 달린 게시글이 최소 1개 필요하면, 검증 중 직접 하나 작성해도 된다.

## 1. 빌드 검증

```bash
npm run build
```

타입 에러/빌드 에러 없이 통과해야 한다.

## 2. 로컬 서버 기동

```bash
npm run dev
```

`http://localhost:3999/article/<slug>` 형태로 임의의 게시글 상세 페이지에 접속한다.

## 3. 브라우저 검증 (claude-in-chrome MCP 우선, 없으면 playwright-cli)

1. **댓글 섹션 노출(spec User Story 1 / FR-001)**: 페이지 최하단, `ArticleNav`(이전/다음 글) 바로 아래에 "Comments" 섹션 헤더와 giscus 위젯이 보이는지 확인한다.
2. **지연 로딩(spec SC-004)**: 페이지 최초 로드 직후 네트워크 요청 목록(`read_network_requests`)에 `giscus.app` 관련 요청이 없는지 확인한 뒤, 댓글 영역까지 스크롤하고 나서야 관련 요청이 발생하는지 확인한다.
3. **로그인 없이 읽기(spec User Story 1)**: 로그인하지 않은 상태에서 기존 댓글이 달린 게시글에 접속해 댓글/반응이 보이는지 확인한다.
4. **테마 동기화(spec User Story 3 / SC-003)**: 댓글 위젯이 로드된 상태에서 사이트 상단 테마 토글을 클릭하고, 페이지 새로고침 없이 위젯 배경/텍스트가 사이트 테마와 즉시 일치하는지 확인한다. 다크→라이트, 라이트→다크 양방향 모두 확인한다.
5. **다크/라이트 목업 대조(Constitution Principle II)**: `core/article-detail-dark.html`, `core/article-detail-light.html`을 각각 브라우저로 열어 댓글 섹션 자리표시자가 실제 페이지와 동일한 위치/톤으로 보이는지 육안 대조한다.

## 4. vercel-react-best-practices 재감사 (Constitution Principle III)

`components/article/article-comments.tsx`와 `app/article/[slug]/page.tsx` 변경분을 다음 규칙 기준으로 재확인한다:
- `bundle-dynamic-imports`: 댓글 컴포넌트가 `next/dynamic`(`ssr: false`)으로 분리되어 있는가.
- `rerender-derived-state`: 테마 값이 별도 `useEffect` 없이 파생 prop으로 전달되는가.

## 완료 기준

위 1~4단계에서 에러나 시각적 불일치가 발견되면 기능을 완료로 보지 않고 즉시 수정한다.
