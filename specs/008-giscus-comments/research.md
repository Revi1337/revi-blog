# Phase 0 Research: Giscus 게시글 댓글

Technical Context에 `NEEDS CLARIFICATION`은 없었다(사전 대화에서 giscus 설정값과 통합 방식이 이미 확정됨). 아래는 그 결정들의 근거와 검토했던 대안을 기록한다.

## 1. 위젯 통합 방식: `@giscus/react` vs 원본 `<script>` 태그

- **Decision**: 공식 `@giscus/react` 패키지의 `<Giscus>` 컴포넌트를 사용한다.
- **Rationale**: giscus.app이 제공하는 원본 `<script src="https://giscus.app/client.js" ...>` 태그는 정적 HTML에는 적합하지만, React 컴포넌트 트리 안에서 props 변경(테마 전환)에 반응시키려면 직접 `postMessage`를 다루거나 DOM을 수동 조작해야 한다. `@giscus/react`는 이 postMessage 동기화를 내부적으로 캡슐화하고 있어, `theme` prop이 바뀌면 위젯을 재마운트하지 않고 iframe에 즉시 반영한다.
- **Alternatives considered**: 원본 `<script>` 태그를 `dangerouslySetInnerHTML`이나 `useEffect`로 직접 주입 — 테마 전환 시 위젯 전체를 재마운트해야 하므로 spec SC-003(1초 이내, 재마운트 없이 반영)을 만족하지 못해 기각.

## 2. 초기 로드 성능: 지연 로딩 전략

- **Decision**: 컴포넌트 레벨에서 `next/dynamic`(`ssr: false`)으로 댓글 컴포넌트를 분리하고, `@giscus/react`가 지원하는 `loading="lazy"` prop을 함께 사용한다.
- **Rationale**: giscus 위젯은 iframe + 외부 스크립트를 포함하는 무거운 서드파티 임베드다. `ssr: false` 동적 임포트로 서버 번들/최초 HTML에서 제외하고, `loading="lazy"`로 실제 iframe 로드 시점을 사용자가 댓글 영역 근처로 스크롤할 때까지 미뤄 게시글 본문의 최초 렌더링(spec SC-004)에 영향을 주지 않는다. 이는 vercel-react-best-practices의 `bundle-dynamic-imports` 규칙과 일치한다.
- **Alternatives considered**: `IntersectionObserver`를 직접 구현해 마운트 시점을 제어하는 방법 — giscus가 이미 동일한 목적의 `loading="lazy"` prop을 1급으로 지원하므로 직접 구현은 불필요한 중복이라 기각.

## 3. 테마 동기화

- **Decision**: `components/theme/theme-context.tsx`의 `useTheme()`가 반환하는 `isDark`를 그대로 `<Giscus theme={isDark ? "dark" : "light"} />`에 파생 값으로 전달한다. 별도의 `useEffect`로 giscus에 수동으로 postMessage를 보내지 않는다.
- **Rationale**: `@giscus/react`가 이미 prop 변경을 감지해 postMessage 동기화를 처리하므로, 별도 effect를 추가하면 상태를 두 곳에서 관리하는 것과 같아진다. vercel-react-best-practices의 `rerender-derived-state`(파생 상태는 effect가 아니라 렌더 중 계산된 값으로 전달) 원칙과도 일치한다.
- **Alternatives considered**: `data-theme="preferred_color_scheme"`(OS 다크모드 설정을 따름) — 이 프로젝트는 `useTheme()`으로 OS 설정과 무관하게 사이트 자체 토글을 갖고 있으므로, OS 설정 기반 테마는 사이트 토글과 어긋날 수 있어 기각.

## 4. giscus 설정값

- **Decision**: `repo="Revi1337/revi-blog-comments"`, `repoId="R_kgDOTfKNMg"`, `category="Announcements"`, `categoryId="DIC_kwDOTfKNMs4DBqAj"`, `mapping="pathname"`, `strict="0"`, `reactionsEnabled="1"`, `emitMetadata="0"`, `inputPosition="bottom"`, `lang="ko"`를 컴포넌트 내부 상수로 고정한다.
- **Rationale**: 이 값들은 giscus.app에서 저장소 소유자가 직접 발급받은 값으로, 사용자별/환경별로 달라지지 않으며 클라이언트에 노출되어도 무방한 공개 식별자다(비밀값 아님). 환경 변수로 분리할 이유가 없다.
- **Alternatives considered**: `.env`를 통한 환경 변수 주입 — 여러 배포 환경(스테이징/프로덕션)에서 다른 댓글 저장소를 쓸 계획이 없고, 값 자체가 비밀이 아니므로 불필요한 간접화로 판단해 기각.

## 5. 정적 목업(`core/*.html`) 반영 방식

- **Decision**: 실제 giscus 스크립트나 iframe은 목업에 넣지 않고, 기존 TOC/ArticleNav와 동일한 섹션 헤더 + 위젯이 들어갈 자리표시자 컨테이너만 다크/라이트 각 파일의 기존 컬러 토큰 컨벤션에 맞춰 추가한다.
- **Rationale**: `core/*.html`은 정적 디자인 참조 목업이며 실제 동작하는 프로덕션 코드가 아니다(Constitution 기술 제약: "This project is moving from static core/*.html mockups to a Next.js/React implementation"). 목업의 목적은 레이아웃/톤 확인이므로 자리표시자로 충분하고, 실제 스크립트 삽입은 목업의 성격에 맞지 않는다.
- **Alternatives considered**: 목업에도 giscus 스크립트를 그대로 삽입 — 정적 파일을 브라우저에서 단독으로 열 때 실제 GitHub 인증 흐름이 발생해 목업의 "디자인 참조" 목적과 어긋나 기각.
