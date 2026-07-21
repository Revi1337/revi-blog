# Implementation Plan: 홈페이지 QuickSearch 태그 필터

**Branch**: `006-quick-search-filter` | **Date**: 2026-07-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-quick-search-filter/spec.md`

## Summary

홈페이지 히어로 캐러셀과 'Entry Stream' 섹션 사이에 QuickSearch 버튼 그룹을 추가한다. 각 버튼은
1~3개 태그로 구성된 프리셋을 대표하며, 클릭하면 페이지 이동이나 검색 모달 없이 바로 아래
BlogCardGrid가 해당 태그 조합을 모두 가진 아티클만으로 즉시 재필터링된다. 이를 위해 현재 태그
정보가 없는 `BlogCardData`를 확장하고, 기존 검색 모달(`components/search/search-query.ts`)의
다중 태그 AND 매칭 규칙을 공유 순수 함수로 추출해 양쪽에서 재사용한다. 필터 상태는 페이지 전체가
아니라 'Entry Stream' 섹션만 분리한 클라이언트 컴포넌트가 소유해 서버 컴포넌트 비중과 번들 크기를
유지하고, QuickSearch 프리셋은 컴포넌트에 하드코딩하지 않고 확장 가능한 데이터 배열로 정의한다.
`core/home-dark.html`·`core/home-light.html` 정적 목업에도 동일한 버튼 마크업을 동기화한다.

## Technical Context

**Language/Version**: TypeScript 5.x (Next.js 16 기본 설정), Node.js (Next.js 16 요구 버전)

**Primary Dependencies**: Next.js 16 (App Router) · React 19.2 · Tailwind CSS v4 (기존 스택 그대로) ·
신규 외부 의존성 없음 — QuickSearch는 React 로컬 상태와 기존 유틸리티 재사용만으로 구현한다.

**Storage**: N/A — 새 저장소를 두지 않는다. 기존 `content/articles/*.md` → `lib/content/loader.ts` →
`lib/data/articles.ts` 파이프라인을 그대로 재사용하고, `blogCards` 파생 시 `Article.tags`를 함께
매핑하는 것만 추가한다.

**Testing**: Constitution Principle I(Feature-Level Verification)에 따라 `npm run build` +
`playwright-cli`로 버튼 클릭 → 그리드 필터링 → 재클릭/전체 보기로 해제 → 모바일 뷰포트 스크롤/줄바꿈을
실제로 구동해 검증하는 것을 최소 게이트로 삼는다. 다크/라이트 테마에서 버튼의 활성/비활성 시각적
스타일이 올바른지는 DOM 상태만으로 판단하기 어려우므로, `claude-in-chrome`(또는 `playwright` MCP
스크린샷 도구)으로 실제 렌더링 픽셀을 확인하는 단계를 추가한다.

**Target Platform**: 웹 브라우저(데스크톱 + 모바일 뷰포트), 기존 Next.js 배포 환경 그대로

**Project Type**: Web application — 단일 Next.js 앱(프론트/백엔드 분리 없음). 기존 저장소 구조를 그대로 확장한다.

**Performance Goals**: 버튼 클릭 시 UI가 블로킹되지 않고 그리드가 즉시(체감 지연 없이) 갱신되어야
한다(SC-001). 현재 아티클 수(7개) 규모에서 in-memory 배열 필터링은 사실상 즉시 완료되므로, 이 목표를
만족시키는 데 별도의 인덱싱 자료구조나 무거운 메모이제이션이 필요하지 않다. 다만 `useMemo`/불필요한
리렌더 방지 여부는 아래 Constitution Principle III 감사에서 최종 판단한다.

**Constraints**:
- `lib/data/types.ts`의 `BlogCardData`에 `tags` 필드를 추가하되, 이를 소비하는 기존 컴포넌트
  (`HeroCarousel`, `BlogCard` 등)의 기존 동작을 깨서는 안 된다(추가 필드이므로 하위 호환 유지).
- 다중 태그 AND 매칭 로직은 `components/search/search-query.ts`의 `runTagSearch`와 QuickSearch
  필터가 동일한 공유 함수를 호출해야 하며, 같은 규칙을 두 곳에 따로 구현하지 않는다.
- QuickSearch 프리셋(라벨 + 태그 조합)은 컴포넌트에 하드코딩하지 않고 배열 형태의 데이터로 정의해,
  프리셋 추가가 그 데이터 파일 수정만으로 가능해야 한다(개수 고정 금지 — spec FR-015).
- `app/page.tsx`는 서버 컴포넌트로 유지한다. 필터 상태(활성 프리셋)가 필요한 'Entry Stream' 섹션
  (필터 라벨 + `BlogCardGrid` + `HomePagination`)만 별도 클라이언트 컴포넌트로 분리해, 히어로
  캐러셀 등 나머지 서버 컴포넌트 비중과 클라이언트 번들 크기를 유지한다.
- `components/home/pagination.tsx`(`HomePagination`)는 현재 `totalPages=12`가 하드코딩되어 있고
  내부 `useState`로 페이지만 독립 관리한다. 필터가 바뀔 때 최소 1페이지로 리셋되어야 하며(FR-010),
  가능하면 `totalPages`도 필터링된 아티클 개수 기준으로 다시 계산되어야 한다.
- `core/home-dark.html`·`core/home-light.html`(Constitution Principle II 대상)에 QuickSearch
  버튼 그룹 마크업을 동일하게 반영해야 한다 — 한쪽만 수정하고 끝낼 수 없다.
- 새 UI는 Inter/JetBrains Mono/Pretendard 폰트 스택과 기존 dark/light 테마 CSS 커스텀 프로퍼티
  외의 색상·폰트를 하드코딩하지 않는다.

**Scale/Scope**: 현재 아티클 7개(`content/articles/*.md`, 테스트용 1개 제외), QuickSearch 프리셋
초기 3개(각 1~3개 태그). 통합 지점은 홈페이지 1곳(`app/page.tsx`)과 그 안의 'Entry Stream' 섹션,
정적 목업 2개(`core/home-dark.html`, `core/home-light.html`) 동기화.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I — Feature-Level Verification (NON-NEGOTIABLE)**: PASS (조건부). 이 기능은 클릭
  상호작용과 그리드 재렌더링이 핵심이라 코드 리뷰만으로는 검증 불가능하다. 구현 완료 후
  `npm run build` + `playwright-cli`로 버튼 클릭/해제/모바일 줄바꿈을 구동 검증하고, 다크/라이트
  활성 상태 스타일은 `claude-in-chrome`(또는 `playwright` MCP 스크린샷)으로 시각 확인해야 한다.
  세부 항목은 `/speckit-tasks`가 작업으로 분해한다.
- **Principle II — Visual Consistency Across Dark/Light**: PASS (조건부). `app/page.tsx`(및 신규
  Entry Stream 클라이언트 컴포넌트) 변경과 동시에 `core/home-dark.html`, `core/home-light.html`
  양쪽에 QuickSearch 버튼 그룹 마크업(비활성/활성 상태 포함)을 동일 반영해야 한다. 새 UI는
  Inter/JetBrains Mono 외 폰트를 도입하지 않는다.
- **Principle III — Mandatory vercel-react-best-practices Compliance (NON-NEGOTIABLE)**: PASS
  (조건부). 구현 전 `.agents/skills/vercel-react-best-practices/rules/`를 실제로 열어 확인해야
  한다. 이번 설계 단계에서 이미 관련성이 확인된 규칙: 서버/클라이언트 컴포넌트 경계 분리(Entry
  Stream만 클라이언트화), 상태 끌어올리기 시 불필요한 리렌더 방지, 파생 상태 계산에 `useMemo` 필요
  여부. 구현 완료 후 이 목록에 국한하지 않고 전체 규칙 대비 감사를 별도 작업으로 수행해야 한다.

위반 사항 없음 — Complexity Tracking 불필요.

## Project Structure

### Documentation (this feature)

```text
specs/006-quick-search-filter/
├── plan.md              # 이 파일 (/speckit-plan 산출물)
├── research.md          # Phase 0 산출물
├── data-model.md        # Phase 1 산출물
├── quickstart.md        # Phase 1 산출물
└── tasks.md             # Phase 2 산출물 (/speckit-tasks — 이 명령에서는 생성하지 않음)
```

`contracts/`는 생성하지 않는다 — 이 기능은 외부에 노출하는 API/CLI 계약이 없는 순수 내부 UI
기능이다(필터링은 클라이언트에 이미 전달된 `blogCards` 배열을 그 자리에서 재계산하는 방식이며,
별도 HTTP 엔드포인트를 추가하지 않는다).

### Source Code (repository root)

```text
lib/
└── data/
    ├── types.ts                      # 변경 — BlogCardData에 tags: string[] 추가
    ├── articles.ts                   # 변경 — blogCards 매핑 시 article.tags를 함께 포함
    ├── tag-match.ts                  # 신규 — "태그 목록이 주어진 태그를 전부 만족하는지" 판단하는
    │                                 #        공유 순수 함수 (검색 모달과 QuickSearch가 공동 사용)
    └── quick-search-presets.ts       # 신규 — QuickSearch 프리셋 배열 { id, label, tags: string[] }[]

components/
├── search/
│   └── search-query.ts               # 변경 — runTagSearch가 lib/data/tag-match.ts의 공유 함수를
│                                     #        호출하도록 리팩터 (매칭 규칙 중복 제거)
└── home/
    ├── entry-stream.tsx              # 신규 — 'use client'. QuickSearch 활성 프리셋 상태를 소유하고
    │                                 #        필터 라벨 + QuickSearchButtons + BlogCardGrid +
    │                                 #        HomePagination을 오케스트레이션
    ├── quick-search-buttons.tsx       # 신규 — 프리셋 버튼 그룹 UI (활성/비활성 스타일, 재클릭 해제)
    ├── blog-card-grid.tsx            # 변경 없음 — EntryStream이 필터링된 cards를 그대로 전달
    └── pagination.tsx                # 변경 — totalPages를 필터링된 개수 기준으로 받고, 필터 변경 시
                                       #        1페이지로 리셋되도록 상태 관리 방식 조정

app/
└── page.tsx                          # 변경 — 'Entry Stream' 정적 마크업(헤더 라벨 + BlogCardGrid +
                                       #        HomePagination)을 <EntryStream cards={blogCards} />
                                       #        호출로 교체. 히어로 캐러셀 등 나머지는 서버 컴포넌트로 유지

core/
├── home-dark.html                    # 변경 — QuickSearch 버튼 그룹 마크업 동기화
└── home-light.html                   # 변경 — QuickSearch 버튼 그룹 마크업 동기화
```

**Structure Decision**: 별도 백엔드/서비스 프로젝트를 만들지 않고 기존 단일 Next.js 앱 구조를 그대로
확장한다. 페이지(`app/page.tsx`)는 서버 컴포넌트로 유지하고, 클라이언트 상태가 필요한 부분만
`components/home/entry-stream.tsx`라는 새 클라이언트 아일랜드로 분리한다. 태그 매칭 규칙은 UI에
종속되지 않는 도메인 로직이므로 `components/search`가 아니라 `lib/data/tag-match.ts`에 두어, 검색
모달과 홈 QuickSearch 양쪽이 대칭적으로 그 함수를 import하는 구조로 만든다(어느 한쪽이 다른 한쪽의
내부 구현에 의존하지 않도록).

## Complexity Tracking

> 위반 없음 — 이 섹션은 해당 사항 없음.
