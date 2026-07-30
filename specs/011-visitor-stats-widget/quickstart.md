# Quickstart: 방문자 및 게시글 조회수 통계 검증

Constitution Principle I(자동화 테스트 없음, `npm run build` + `playwright-cli` 실브라우저 검증이 기본)에 따른 검증 절차.

## 사전 준비

1. Upstash Redis 인스턴스를 Vercel Marketplace로 프로젝트에 연결하고, 로컬 `.env.local`에 발급된 REST URL/토큰 환경변수를 채운다(변수명은 구현 시 `lib/stats/redis.ts`와 함께 확정).
2. `npm install` (신규 의존성 `@upstash/redis`, `swr` 설치 확인)
3. `npm run build` — 정적 페이지들이 여전히 `○ (Static)`으로 표시되는지 확인(빌드 로그의 Route 표에서 `/`, `/bookmark`, `/article/[slug]`가 dynamic(`ƒ`)으로 전환되지 않았는지 체크 — 과거 유사 사고가 있었으므로 이 확인은 필수).

## 시나리오 1 — 사이트 전역 카운터 (spec User Story 1)

1. `npm run start`로 프로덕션 빌드 구동.
2. `curl -s localhost:3999/api/stats`로 초기값 확인.
3. 다른 IP처럼 보이도록(또는 실제로 다른 네트워크에서) 홈페이지에 접속 → `curl -s localhost:3999/api/stats`로 `today`, `total`이 각각 1 증가했는지 확인.
4. 같은 IP로 홈/북마크를 반복 접속 → 값이 더 이상 증가하지 않는지 확인(dedup).
5. Redis 콘솔(Upstash 대시보드)에서 `visits:daily:{어제날짜}` 키를 직접 조회해 `yesterday` 응답값과 일치하는지 확인.

## 시나리오 2 — 게시글 조회수 (spec User Story 2)

1. 임의의 아티클 slug로 `curl -s localhost:3999/api/stats/{slug}`를 여러 번 호출 → 매번 `views`가 증가하는지 확인(전역 `today`/`total`은 최초 1회만 증가).
2. `playwright-cli`로 해당 아티클 페이지를 열어 데스크탑 폭(≥1280px)에서 좌측 여백에 위젯이 4개 지표와 함께 보이는지, 좁은 폭(<1280px)에서는 `ArticleHeader`의 메타 정보 줄에 Eye 아이콘 조회수 항목이 인라인으로 붙어 보이는지 스크린샷으로 확인.
3. 다크/라이트 테마 토글 후 위젯이 양쪽 다 자연스럽게 보이는지 확인(Constitution Principle II의 정신 준수).

## 시나리오 3 — 제목 수정에도 끊기지 않는 조회수 (spec User Story 3)

1. 시나리오 2에서 조회수를 올려둔 아티클의 마크다운 `title`만 수정(slug는 유지).
2. `next dev`를 재시작(AGENTS.md의 `content/articles/**` 캐싱 규칙 — 재시작 없이는 변경이 반영되지 않음).
3. 같은 slug로 `curl -s localhost:3999/api/stats/{slug}`를 호출해 `views`가 수정 전과 동일한지 확인.

## 시나리오 4 — 봇 제외 (spec Edge Case / FR-011)

1. `curl -s -A "Googlebot/2.1" localhost:3999/{임의 페이지 경로}` 로 봇 UA를 흉내 낸 요청을 여러 번 보낸다.
2. `curl -s localhost:3999/api/stats`로 `today`/`total`이 이 요청들로 증가하지 않았는지 확인.

## 완료 기준

- 위 4개 시나리오 모두 기대한 대로 동작
- `npm run build` 로그상 기존 정적 라우트가 dynamic으로 전환되지 않음
- `.claude/skills/vercel-react-best-practices/rules/`의 관련 규칙(plan.md Constitution Check 참고) 위반 없음
