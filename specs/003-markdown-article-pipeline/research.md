# Phase 0 Research: Markdown 기반 아티클 콘텐츠 파이프라인

## 기존 코드 조사에서 확인된 사실

- `shiki`는 이미 `package.json` dependencies에 설치되어 있고, `components/article/code-block.tsx`에서
  `codeToHtml(code, { lang, theme: "github-dark-default" })`로 직접 호출 중이다. **단일 테마만
  적용되어 있어 라이트 모드에서도 다크 코드 배경이 그대로 노출되는 상태** — constitution.md
  Principle II(다크/라이트 페어 동시 대응) 기준으로 보면 이미 존재하던 결함이다. 이번 기능이
  코드 렌더링 경로를 교체하는 김에 이 결함도 함께 해소한다.
- `app/article/[slug]/page.tsx`는 `bodyHtml`을 `CODE_BLOCK_PLACEHOLDER`/`METRICS_PLACEHOLDER`
  문자열로 `split()`해서 그 사이에 `<CodeBlock>`, `<MetricCardGrid>` React 컴포넌트를 수동으로
  끼워 넣는다. 아티클 하나만 실제 코드블록/메트릭을 갖고 있고 나머지는 `metrics: []`로 비어있다.
  이 split 기반 조립 방식 자체가 이번 기능으로 제거된다 — 파이프라인이 만든 `bodyHtml`은 코드
  블록과 metrics 카드까지 포함한 완결된 HTML이어야 한다.
- `MetricCardGrid`(components/article/metric-card-grid.tsx)와 `CodeBlock`의 시각 디자인(카드
  테두리, 좌측 accent bar, traffic-light 점, 파일명 라벨)은 순수 마크업+Tailwind 클래스이며 상태나
  이벤트 핸들러가 없다 → React 컴포넌트로 유지할 필요 없이, 렌더 파이프라인이 동일한 HTML 마크업을
  직접 생성해도 시각적으로 동등하다.

## Decision: 콘텐츠 로딩 위치와 처리 시점

- **Decision**: 빌드 타임(모듈 최상위 레벨에서 1회, Next.js 빌드/dev 서버 시작 시 평가)에
  `content/articles/*.md` 전체를 읽어 파싱하고, 결과를 메모리에 캐시한다. 개별 페이지 요청마다
  파일을 다시 읽지 않는다.
- **Rationale**: 기존 `articles` 배열도 모듈 로드 시점에 한 번 평가되는 정적 데이터였다. 이
  패턴을 유지하면 `generateStaticParams`, `getArticleBySlug` 등 기존 소비 코드의 동기(sync) 호출
  방식을 그대로 유지할 수 있다.
- **Alternatives considered**: 페이지 요청마다 `fs`를 읽는 방식은 불필요한 I/O를 반복시키고,
  Article 타입을 비동기로 바꿔야 해서 소비 코드 변경 범위가 커진다 — 기각.

## Decision: 코드 블록 렌더링 및 라인 하이라이트

- **Decision**: `rehype-pretty-code`(Shiki 기반)를 remark/rehype 파이프라인에 꽂고,
  `theme: { dark: "github-dark-default", light: "github-light-default" }`처럼 다크/라이트 테마
  쌍을 동시에 지정한다. rehype-pretty-code는 각 토큰에 `--shiki-dark`/`--shiki-light` CSS 변수를
  함께 출력하므로, 프로젝트가 이미 쓰고 있는 Tailwind `dark:` 클래스 전략과 그대로 맞물린다.
  파일명 표시, traffic-light 점, accent bar 같은 기존 카드 장식은 커스텀 rehype 트랜스포머가
  `rehype-pretty-code`의 `<figure data-rehype-pretty-code-figure>` 출력물을 감싸는 방식으로
  재현한다(코드 펜스 meta 문자열의 `title="..."`을 파일명으로 사용).
- **Rationale**: 이미 설치된 `shiki`를 그대로 재사용하면서(새 하이라이터 엔진 도입 없음), 다크/라이트
  동시 테마 결함까지 이번 기회에 해소한다. 라인 하이라이트는 rehype-pretty-code가 표준으로 지원하는
  ` ```lang {2-3,10} ` meta 문법을 그대로 쓸 수 있어 FR-005·Astro 레퍼런스와 동일한 저자 경험을 준다.
- **Alternatives considered**: 기존 `CodeBlock` React 컴포넌트를 유지하고 마크다운 파서가 코드
  블록을 별도 노드로 남겨 React에서 후처리하는 방식도 검토했으나, 파이프라인이 이미 완결된 HTML을
  만드는 목표(FR-003)와 충돌하고 라인 하이라이트 파싱 로직을 직접 구현해야 해서 기각.

## Decision: 성능 지표(metrics) 커스텀 블록 문법

- **Decision**: 언어 태그가 `metrics`인 펜스드 코드 블록을 예약어로 사용한다.

  ````
  ```metrics
  P99_LATENCY: 120ms
  THROUGHPUT: 2.4M
  ERROR_RATE: 0.004%
  ```
  ````

  커스텀 remark 플러그인이 `code` mdast 노드 중 `node.lang === "metrics"`인 것을 찾아 각 줄을
  `LABEL: VALUE` 형태로 파싱하고, `MetricCardGrid`와 동일한 hast(HTML) 마크업으로 직접 치환한다.
- **Rationale**: 사용자가 확정한 Option A(본문 내 커스텀 블록 문법)를 만족하면서, 별도의 컨테이너
  문법 파서(`:::metrics ... :::`)를 새로 구현하지 않고 마크다운이 기본 제공하는 펜스드 코드 블록
  파싱 규칙에 얹어갈 수 있어 구현이 가장 단순하다. 코드 편집기에서도 문법 강조 없이 일반 텍스트로만
  보이므로 저자가 실수로 다른 마크다운 문법과 헷갈릴 여지가 적다.
- **Alternatives considered**: `:::metrics` 컨테이너 문법(remark-directive 기반)은 더 "마크다운답게"
  보이지만 `remark-directive` 의존성이 추가로 필요하고, 파싱 규칙이 한 단계 더 복잡해진다 — 이번
  범위(4개 아티클 중 1개만 metrics 사용)에는 과한 투자로 판단해 기각.

## Decision: 목차(TOC) 추출 및 heading id 부여

- **Decision**: 커스텀 remark 플러그인 하나가 `unist-util-visit`으로 depth 2/3 `heading` mdast
  노드를 순회하며, `github-slugger`(널리 쓰이는 slug 생성 라이브러리, `rehype-slug`의 내부 의존성과
  동일 패키지)로 각 heading의 텍스트로부터 id를 만들어 `data.hProperties.id`에 심고, 동시에
  `TocItem[]` 배열(순서·위계·id)을 사이드채널로 수집한다.
- **Rationale**: heading id 부여와 TOC 수집을 한 패스에서 처리하면 "TOC의 id"와 "실제 렌더링된
  heading의 anchor id"가 항상 100% 일치함이 구조적으로 보장된다. `rehype-slug`를 rehype 단계에서
  별도로 붙이면 remark 단계에서 수집한 TOC의 id와 값이 어긋날 위험(예: slug 알고리즘 불일치)이
  생긴다.
- **Alternatives considered**: `rehype-slug` + 별도 TOC 추출 스크립트를 두 단계로 분리하는 방식도
  가능하지만, 두 패키지가 서로 다른 slug 알고리즘을 쓸 경우 TOC 클릭 시 스크롤이 어긋나는 회귀를
  낳을 수 있어 기각.

## Decision: 프론트매터 스키마와 필수 필드 검증

- **Decision**: 로더가 각 파일을 읽을 때 `title`, `category`, `publishedAt`, `tags`가 없으면 해당
  파일 경로와 누락 필드명을 포함한 `Error`를 던져 Next.js 빌드/dev 서버 기동을 즉시 실패시킨다.
  `slug`는 프론트매터에 없으면 파일명(확장자 제외)으로 폴백한다. `readingTimeMinutes`는 본문 텍스트
  길이로부터 자동 계산하는 것을 기본으로 하되, 프론트매터에 명시되어 있으면 그 값을 우선한다.
- **Rationale**: FR-006(누락 필드가 조용히 배포되지 않아야 함)을 만족하는 가장 직접적인 방법이며,
  Next.js 빌드 실패는 기존 `constitution.md` Principle I(빌드로 검증)과도 자연스럽게 맞물린다.
- **Alternatives considered**: 스키마 검증 라이브러리(zod 등) 도입도 검토했으나, 필드가 4~5개
  수준으로 적고 프로젝트에 아직 zod가 없어 신규 의존성을 추가하는 비용이 이득보다 크다고 판단 —
  수동 검증 함수로 충분.

## Decision: 읽기 시간(reading time) 계산

- **Decision**: `reading-time` npm 패키지를 mdast에서 추출한 순수 텍스트(`mdast-util-to-string`)에
  적용해 분 단위로 반올림한다.
- **Rationale**: 둘 다 초경량 패키지이고 unified 생태계와 자연스럽게 맞물린다. 직접 word-count
  유틸을 짜는 것보다 CJK/영문 혼합 텍스트에 대한 예외 처리를 검증된 라이브러리에 맡기는 편이 안전.
- **Alternatives considered**: 자체 word-count 유틸 — 한국어/영어 혼용 콘텐츠의 단어 경계 처리를
  직접 구현/검증해야 해서 기각.

## Decision: 이전글/다음글(prev/next) 자동 계산

- **Decision**: 전체 아티클을 `publishedAt` 내림차순(최신순)으로 정렬한 배열 기준, 인덱스 `i`의
  글에서 `next`(더 최신 글)는 `array[i-1]`, `prev`(더 과거 글)는 `array[i+1]`로 계산한다. 배열의
  양 끝(가장 최신/가장 오래된 글)은 해당 방향의 참조가 없다(`undefined`).
- **Rationale**: 홈 페이지("Entry Stream")가 이미 최신순 노출을 전제로 하므로, 상세 페이지 안에서도
  "다음 글 = 더 최신 글" 방향이 사용자의 탐색 흐름과 자연스럽게 일치한다.
- **Alternatives considered**: 파일명/작성 순서 기준 정렬 — `publishedAt`이 이미 명시적 필드로
  존재하는데 별도 순서 개념을 추가로 요구하는 것은 불필요한 모호함을 만들어 기각.

## Decision: `lib/data/articles.ts`의 처리 방식

- **Decision**: `lib/data/articles.ts`는 완전히 새로 작성되어 `lib/content/loader.ts`가 만든 결과를
  그대로 재노출(re-export)하는 얇은 어댑터가 된다. `Article`/`BlogCardData` 타입(`lib/data/types.ts`)
  자체는 변경하지 않는다. 단, `CODE_BLOCK_PLACEHOLDER`/`CODE_BLOCK_SOURCE`/`METRICS_PLACEHOLDER`
  export와 이를 사용하는 `app/article/[slug]/page.tsx`의 `split()` 조립 로직은 제거한다 — 파이프라인
  결과물인 `bodyHtml`이 이미 코드 블록/metrics 카드까지 포함한 완결된 HTML이기 때문이다.
- **Rationale**: 타입 호환을 지키면서도, 플레이스홀더 기반 조립이라는 임시방편을 남겨두면 이번
  기능의 목적(FR-001: 코드에 본문 하드코딩 금지, 실질적으로는 조립 로직도 여기 해당)이 반쪽만
  달성된다.
- **Alternatives considered**: `bodyHtml`에 플레이스홀더를 남기고 React 컴포넌트 조립 방식을 계속
  쓰는 안 — 코드 블록/metrics 렌더링을 리하이프 플러그인으로 통합한다는 이번 기능의 핵심 이득을
  포기하는 것이라 기각.

## 미해결 사항

없음 — 모든 기술적 선택이 위에서 확정됨.
