# Research: 방문자 및 게시글 조회수 통계

## 1. Redis 클라이언트 선택

**Decision**: `@upstash/redis` (REST/HTTP 기반 클라이언트)를 사용한다.

**Rationale**: 카운팅 로직은 Next.js Middleware(Edge Runtime)에서 실행되는데, Edge Runtime은 Node.js의 TCP 소켓 API를 지원하지 않아 `ioredis` 같은 전통적 TCP 기반 Redis 클라이언트를 쓸 수 없다. Upstash는 이 문제를 위해 REST API 기반 클라이언트(`@upstash/redis`)를 공식 제공하며, Vercel Marketplace 통합도 이 클라이언트를 전제로 한다.

**Alternatives considered**: `ioredis`(Edge Runtime 미지원으로 제외), Vercel KV 전용 SDK(Vercel KV는 이제 Upstash Marketplace 통합으로 대체되었으므로 `@upstash/redis`를 직접 쓰는 것과 동일).

## 2. 클라이언트 IP 추출 방식

**Decision**: Middleware에서 요청 헤더의 `x-forwarded-for`(첫 번째 IP)를 직접 읽는다.

**Rationale**: Next.js 15부터 `NextRequest.ip`가 제거되어, 이 프로젝트가 쓰는 Next.js 16.2.10에는 존재하지 않는다. Vercel 엣지 네트워크는 `x-forwarded-for` 헤더에 실제 클라이언트 IP를 항상 채워주므로, 별도 의존성 없이 헤더를 직접 읽는 것으로 충분하다.

**Alternatives considered**: `@vercel/functions`의 `ipAddress()` 헬퍼(Vercel 공식 권장 방식이지만, 내부적으로 동일한 헤더를 읽는 얇은 래퍼라 이 기능만을 위해 새 의존성을 추가할 실익이 적음 — 다만 구현 중 헤더 파싱이 예상과 다르게 동작하면 이 헬퍼로 교체 가능하도록 `lib/stats/get-stats.ts`가 아닌 별도 함수로 분리해둔다).

## 3. 봇/크롤러 판별 방식

**Decision**: User-Agent 헤더에 대한 정규식 매칭(`/bot|crawl|spider|googlebot|bingbot|yeti|slurp|facebookexternalhit|kakaotalk-scrap/i` 등)으로 판별한다.

**Rationale**: spec의 Assumptions에 "새롭게 등장하거나 정체를 숨기는 봇까지 완벽히 걸러내는 것은 범위 밖"이라고 명시했으므로, 완벽한 봇 탐지 솔루션(예: 유료 봇 탐지 서비스, 행동 기반 탐지)은 과설계다. 주요 검색엔진·소셜 링크 미리보기 봇은 정직하게 User-Agent를 밝히므로 정규식만으로 충분한 커버리지를 얻는다.

**Alternatives considered**: 전용 봇 탐지 npm 패키지(정확도 개선 대비 번들/의존성 비용이 이 기능의 요구 수준을 넘어섬).

## 4. 데스크탑/모바일 반응형 분기 기준

**Decision**: Tailwind 기본 브레이크포인트 `xl:`(1280px)을 기준으로 데스크탑(고정 좌측 위젯) / 모바일(인라인 삽입)을 나눈다.

**Rationale**: 실제 "좌측 여백이 사라지는" 임계값은 본문 컨테이너 `max-w-[1200px]` + 양쪽 `--spacing-gutter: 24px` = 1248px이다. 프로젝트에 커스텀 Tailwind 브레이크포인트 토큰이 정의되어 있지 않아(Tailwind v4 CSS 기반 설정, `@theme`에 `--breakpoint-*` 없음), 정확히 1248px에 맞는 커스텀 브레이크포인트를 새로 도입하기보다 가장 가까운 기본값인 `xl(1280px)`을 재사용한다. 1248~1279px 사이의 아주 좁은 구간에서만 위젯이 다소 이르게 인라인 모드로 전환되는데, 실제 뷰포트 폭이 그 32px 구간에 정확히 들어갈 확률은 낮고 시각적으로도 위화감이 없다.

**Alternatives considered**: 임의값 브레이크포인트 `min-[1248px]:` 도입(정밀하긴 하나 프로젝트 전체에서 유일하게 쓰이는 매직넘버 브레이크포인트가 되어 유지보수 비용 대비 실익이 적음).

## 5. 데스크탑/모바일 두 위젯 인스턴스의 데이터 공유

**Decision**: `swr`을 도입해 `useVisitorStats(slug?)` 커스텀 훅으로 감싸고, desktop/mobile 두 `VisitorStatsWidget` 인스턴스가 각자 이 훅을 호출하되 실제 네트워크 요청은 SWR의 캐시로 1회만 발생시킨다.

**Rationale**: `components/article/toc-sidebar.tsx`가 이미 이 프로젝트에서 `variant="mobile"`/`variant="desktop"` 두 인스턴스를 나란히 렌더링하는 선례를 만들어뒀다(정적 props라 fetch 중복 문제가 없었음). `VisitorStatsWidget`은 데이터를 fetch해야 하므로 그대로 두 인스턴스를 두면 중복 요청이 발생하는데, 이 프로젝트의 `vercel-react-best-practices` 컨스티튜션 규칙 중 `client-swr-dedup`이 정확히 이 상황(여러 컴포넌트가 같은 데이터를 필요로 함)을 위한 규칙이라 그대로 채택한다.

**Alternatives considered**: 상위 컴포넌트에서 한 번만 fetch해 props로 내려주기(ArticleHeader와 article 페이지의 desktop 위젯이 서로 다른 파일에 위치해 prop drilling이 번거로움 — SWR 캐시가 더 간단함).

## 6. "어제 방문자 수"의 데이터 구조

**Decision**: `visits:daily:{date}` 키를 요일과 무관하게 항상 유지하고, "오늘"은 오늘 날짜 키, "어제"는 어제 날짜 키를 그대로 읽는다. 별도의 자정 스냅샷/배치 작업은 두지 않는다.

**Rationale**: 날짜별로 키가 이미 분리되어 있어, 하루가 지나면 그 날짜의 키에는 더 이상 쓰기가 발생하지 않으므로 자연히 불변값이 된다. 사용자가 이미 이 방식을 지정했고(원본 요구사항), 별도 배치가 필요 없어 무료 인프라 제약과도 부합한다.

**Alternatives considered**: 자정 크론으로 "오늘" 값을 "어제" 필드에 복사(불필요한 크론 인프라 추가, 크론 실패 시 어제 값 누락 리스크).
