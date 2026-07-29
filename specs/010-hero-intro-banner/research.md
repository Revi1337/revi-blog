# Phase 0 Research: 히어로 캐러셀 제거 및 자기소개 배너 교체

이 기능은 `/speckit-plan` 입력 프롬프트 자체가 구현 방향을 상세히 지정한 상태로 시작되어(사전 grill-me 세션에서 범위/레이아웃/콘텐츠 출처를 모두 결정), Technical Context에 `NEEDS CLARIFICATION`이 남지 않았다. 아래는 그 결정들의 근거를 기록한다.

## 콘텐츠 파이프라인 구조

- **Decision**: `content/home/main.yaml`(원본) → `lib/content/hero.ts`(파싱) → `lib/data/hero.ts`(재노출)의 3계층 구조를 채택한다.
- **Rationale**: 이 프로젝트의 북마크 기능이 정확히 이 구조다(`lib/content/bookmarks.ts`가 `fs.readFileSync` + `yaml`의 `parse`로 읽고 필수 필드를 검증, `lib/data/bookmarks.ts`는 그 결과를 그대로 재노출하는 얇은 래퍼). 새 파이프라인을 처음부터 설계하는 대신 이미 검증된 패턴을 재사용하면 유지보수 방식이 프로젝트 전역에서 일관된다.
- **Alternatives considered**: 컴포넌트 안에 하드코딩(거부 — 콘텐츠 변경 시 코드를 건드려야 하고, 운영자가 실제로 관리하는 소스(포트폴리오 YAML)와 형태가 달라져 동기화가 더 어려워짐). frontmatter 기반 마크다운 파일(거부 — `hero:` 데이터는 목록형 구조 항목이라 YAML이 더 자연스럽고, 마크다운 파이프라인(`lib/content/pipeline.ts`)은 아티클 렌더링 전용이라 과함).

## 파일명: `main.yaml` (not `hero.yaml`)

- **Decision**: 파일명은 `main.yaml`, 콘텐츠는 그 안의 `hero:` 최상위 키 아래 배치한다.
- **Rationale**: 사용자 지시. 추후 홈 화면에 다른 정적 콘텐츠 섹션이 추가되더라도 파일을 새로 만들지 않고 `main.yaml`에 키를 추가하는 것으로 확장할 수 있게 하기 위함.
- **Alternatives considered**: `hero.yaml`(기능 범위와 1:1로 대응해 이름은 더 명확하지만, 향후 확장성을 고려한 사용자 지시에 따라 채택하지 않음).

## 콘텐츠 값(hero 텍스트)

- **Decision**: `~/Desktop/ai/vibe/revi1337/src/data/content-kr.yaml`의 `hero:` 블록 값을 그대로 가져오되, `headline`과 각 `texts` 항목의 `"[KR]"` 접두어는 제거한다. `philosophy[0].texts`에 동일 문장이 두 번 중복되어 있던 것은 원본의 복붙 아티팩트로 판단해 한 줄만 남긴다.
- **Rationale**: `[KR]` 접두어는 포트폴리오 사이트의 EN/KR 언어 토글 때문에 존재하는 태그이며, 이 블로그는 단일 언어라 의미가 없다(사용자 확인). 중복 문장은 명백한 복붙 실수로, 그대로 가져오면 화면에 같은 문장이 두 번 표시되어 이번 기능의 존재 이유(정보 중복 제거)와 정면으로 모순된다.
- **입력 프롬프트 관련 참고**: `/speckit-plan` 커맨드 인자로 전달된 YAML 스니펫 중 `philosophy` 세 번째 항목(`layers`/`[SCALABILITY]`) 부분이 들여쓰기가 깨지고 `[INTERNALS]` 텍스트 줄이 한 번 더 중복 삽입되는 등 명백한 붙여넣기 손상이 있었다. 이는 이전 턴에서 사용자와 함께 확정한 3개 항목(VISUALIZATION/INTERNALS/SCALABILITY, 각 1문장)과 명백히 어긋나므로, 손상된 스니펫이 아니라 이전 턴에서 검증된 올바른 버전을 `data-model.md`/`content/home/main.yaml`에 반영했다.

## 아이콘 매핑

- **Decision**: `philosophy[].icon` 값(원본은 Material Symbols 이름: `visibility`, `settings_suggest`, `layers`)을 `components/bookmark/bookmark-icon.tsx`와 동일한 `name → LucideIcon` 매핑 테이블 + 폴백 아이콘 패턴으로 lucide-react 아이콘에 대응시킨다. `visibility → Eye`, `settings_suggest → Settings2`, `layers → Layers`.
- **Rationale**: 이 프로젝트는 Material Symbols가 아니라 lucide-react를 아이콘 세트로 쓰고 있고(북마크 기능에서 이미 name→컴포넌트 매핑 패턴이 검증됨), 새 매핑도 동일한 관례를 따르는 것이 일관성 있다.
- **Alternatives considered**: Material Symbols 웹폰트를 그대로 도입(거부 — 이 프로젝트의 폰트/아이콘 제약에 새 의존성을 추가하게 되어 범위를 벗어남).

## 컴포넌트 유형: Server Component

- **Decision**: 새 배너 컴포넌트(`hero-intro.tsx`)는 `"use client"` 없이 Server Component로 작성한다.
- **Rationale**: spec FR-004가 배너에 어떠한 인터랙션도 없어야 한다고 명시하므로 클라이언트 상태(`useState`, 이벤트 핸들러)가 필요 없다. 기존 `hero-carousel.tsx`는 embla 훅(`useEmblaCarousel`, `useState`)이 필요해 클라이언트 컴포넌트였고, 이번 교체로 그 클라이언트 번들 비용이 그대로 사라진다 — Constitution Principle III(vercel-react-best-practices) 감사에서도 유리한 지점이다.

## 레이아웃 구현 전략

- **Decision**: flex 컨테이너에서 텍스트 블록은 `flex-1`, 프로필 이미지는 `shrink-0` + 고정 폭(데스크탑 약 200~240px, 모바일 약 100~140px). 모바일 브레이크포인트 미만에서 세로 스택(이미지 위, 텍스트 아래)으로 전환.
- **Rationale**: 사전 grill-me 세션에서 확정된 결정 — 이미지가 화면 폭에 비례해 커지면 정사각형 일러스트가 넓은 화면에서 과도하게 커져 시선을 뺏는 문제를 방지.

## 컨테이너 스타일

- **Decision**: 기존 캐러셀의 `rounded-xl bg-surface-container` 클래스는 유지하되 `aspect-[2/1]` 고정 비율은 제거하고 padding 기반의 콘텐츠 맞춤 높이로 바꾼다.
- **Rationale**: 카드형 경계는 이 자리의 기존 시각 언어를 유지하되(다른 카드형 섹션들과 일관), 배너는 캐러셀보다 정보량이 적으므로 억지로 큰 높이를 채울 필요가 없다(spec FR-008/SC-006).

## 제거 범위 확정

- **Decision**: `components/home/hero-carousel.tsx`, `components/ui/carousel.tsx` 삭제. `package.json`에서 `embla-carousel-react`, `embla-carousel-autoplay` 제거. `lib/data/types.ts`의 `HeroSlide` 등 캐러셀 전용 타입 제거.
- **Rationale**: 레포 전체 검색으로 두 파일 외에 `embla` 참조가 없음을 확인했다(패키지 선언 자체 제외). 죽은 코드/의존성을 남기지 않는다.

## 검증 방식

- **Decision**: 자동화 테스트 코드 없이, 각 사용자 스토리(Phase) 구현이 끝날 때마다 `npm run build` 재빌드 후 `playwright-cli`로 실제 브라우저 확인(spec FR-012, Constitution Principle I).
- **Rationale**: 이 프로젝트의 표준 검증 절차이며, 사용자가 이번 기능에 한해 별도로 "Phase마다" 명시적으로 재확인했다.
