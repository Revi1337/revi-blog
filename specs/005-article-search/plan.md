# Implementation Plan: 아티클 통합 검색

**Branch**: `005-article-search` | **Date**: 2026-07-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-article-search/spec.md`

## Summary

헤더 nav에 입력창 모양의 검색 트리거(placeholder + `Ctrl+K` 뱃지)를 추가하고, 클릭 또는 `Ctrl+K`/`Cmd+K`로
여는 검색 모달을 구현한다. 모달은 일반 텍스트로 제목/본문(plain-text)을 검색하고 `#태그명`으로 태그를
검색하는 두 모드를 지원하며, 텍스트 검색은 제목 매치를 본문 매치보다 우선 정렬하고 태그 검색은 랭킹 없이
전부 노출한다. `showOnHomepage`가 꺼진 아티클은 검색 인덱스 생성 단계에서부터 완전히 제외해 클라이언트에
데이터 자체가 전달되지 않도록 한다. 모달은 Algolia DocSearch류의 커맨드 팔레트 UX(방향키 이동 + Enter
선택, 키보드 힌트 푸터)를 따르며, 이를 위해 `cmdk`를 새 의존성으로 도입한다. 검색 인덱스는 기존
`lib/content`/`lib/data` 파이프라인과 동일한 패턴으로 서버 사이드에서 1회 구성해 클라이언트로 전달하고,
매칭/랭킹은 외부 검색 라이브러리 없이 순수 TypeScript substring 비교로 구현한다. 헤더 변경이므로
`core/*.html` 4개 정적 목업의 트리거 마크업도 함께 동기화한다.

## Technical Context

**Language/Version**: TypeScript 5.x (Next.js 16 기본 설정), Node.js (Next.js 16 요구 버전)

**Primary Dependencies**: Next.js 16 (App Router) · React 19.2 · Tailwind CSS v4 (기존 스택 그대로) ·
`cmdk`(신규 — Command.Dialog 기반 커맨드 팔레트, 포커스 트랩/Esc/스크롤 락/ARIA 내장) ·
`mdast-util-to-string`(기존 의존성 재사용 — 마크다운 본문에서 검색용 plain text 추출)

**Storage**: N/A — 새 저장소를 두지 않는다. 기존 `content/articles/*.md` 파일을 `lib/content/loader.ts`가
빌드 시 파싱한 결과(`lib/data/articles.ts`)를 그대로 재사용해 검색 인덱스를 파생시킨다.

**Testing**: 이 plan은 테스트 전략의 세부 항목을 설계하지 않는다(`/speckit-tasks`에서 별도 명시). Constitution
Principle I(Feature-Level Verification)에 따라 `npm run build` + `playwright-cli`로 구동 검증하는 것을
최소 게이트로 삼는다.

**Target Platform**: 웹 브라우저(데스크톱 + 모바일 뷰포트), 기존 Next.js 배포 환경 그대로

**Project Type**: Web application — 단일 Next.js 앱(프론트/백엔드 분리 없음). 기존 저장소 구조를 그대로 확장한다.

**Performance Goals**: 키 입력마다 UI가 블로킹되지 않아야 한다(React 19 `useDeferredValue`로 필터링을
non-urgent 업데이트로 분리). 현재 아티클 수(10개 미만) 규모에서 in-memory substring 스캔은 사실상 즉시
완료되므로, SC-002("체감 지연 없음")를 만족시키는 데 별도의 색인 알고리즘이 필요하지 않다.

**Constraints**:
- `showOnHomepage=false` 아티클의 제목/본문/태그는 어떤 경로로도 클라이언트 번들·네트워크 응답에 포함되지
  않아야 한다(FR-017 — 런타임에 숨기는 방식이 아니라 인덱스 생성 단계에서부터 제외).
- 검색 모달/결과 리스트 컴포넌트(`cmdk` 포함)는 `next/dynamic`으로 지연 로드해, 검색을 열지 않는 방문자의
  초기 헤더 번들 크기에 영향을 주지 않는다.
- 새로 추가하는 UI는 Inter/JetBrains Mono/Pretendard 폰트 스택과 기존 CSS 커스텀 프로퍼티(dark/light 테마
  토큰) 외의 색상·폰트를 하드코딩하지 않는다.

**Scale/Scope**: 현재 아티클 8개(`content/articles/*.md`), 통합 지점은 헤더 nav 1곳(`components/layout/
nav-bar.tsx`) + 기존 아티클 상세 라우트(`app/article/[slug]/page.tsx`)로의 이동, 정적 목업 4개
(`core/home-dark.html`, `core/home-light.html`, `core/article-detail-dark.html`,
`core/article-detail-light.html`) 동기화.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I — Feature-Level Verification (NON-NEGOTIABLE)**: PASS (조건부). 이 기능은 헤더 UI +
  클라이언트 상호작용이 핵심이라 코드 리뷰만으로는 검증 불가능하다. 구현 완료 후 `npm run build`와
  `playwright-cli`로 실제 검색 트리거 클릭/`Ctrl+K`/텍스트·태그 검색/테마 전환/모바일 뷰포트를 구동
  검증해야 한다. 세부 항목은 `/speckit-tasks`가 작업으로 분해한다.
- **Principle II — Visual Consistency Across Dark/Light**: PASS (조건부). `components/layout/nav-bar.tsx`
  변경과 동시에 `core/home-dark.html`, `core/home-light.html`, `core/article-detail-dark.html`,
  `core/article-detail-light.html` 4개 파일에 검색 트리거 마크업을 동일 반영해야 한다(모달까지 정적
  HTML로 재현할 필요는 없음 — Project Structure 참고). 새 UI는 Inter/JetBrains Mono 외 폰트를 도입하지
  않는다.
- **Principle III — Mandatory vercel-react-best-practices Compliance (NON-NEGOTIABLE)**: PASS (조건부).
  구현 전 `.agents/skills/vercel-react-best-practices/rules/`를 실제로 열어 확인해야 한다. 이번 설계
  단계에서 이미 관련성이 확인된 규칙: `rerender-use-deferred-value`(실시간 필터링), `bundle-dynamic-
  imports`(cmdk/검색 모달 지연 로드), `client-event-listeners`(Ctrl+K 전역 keydown 리스너의 등록/해제).
  구현 완료 후 이 목록에 국한하지 않고 전체 규칙 대비 감사를 별도 작업으로 수행해야 한다.

위반 사항 없음 — Complexity Tracking 불필요.

## Project Structure

### Documentation (this feature)

```text
specs/005-article-search/
├── plan.md              # 이 파일 (/speckit-plan 산출물)
├── research.md          # Phase 0 산출물
├── data-model.md        # Phase 1 산출물
├── quickstart.md        # Phase 1 산출물
└── tasks.md             # Phase 2 산출물 (/speckit-tasks — 이 명령에서는 생성하지 않음)
```

`contracts/`는 생성하지 않는다 — 이 기능은 외부에 노출하는 API/CLI 계약이 없는 순수 내부 UI 기능이다
(검색은 서버 사이드에서 구성한 인덱스를 클라이언트 컴포넌트로 props 전달하는 방식이며, 별도 HTTP 엔드포인트를
추가하지 않는다).

### Source Code (repository root)

```text
components/
├── layout/
│   └── nav-bar.tsx                 # 기존 — 검색 트리거를 이 안에 삽입
└── search/
    ├── search-trigger.tsx          # 헤더에 상시 노출되는 입력창 모양 버튼(placeholder + Ctrl+K 뱃지)
    ├── search-modal.tsx            # cmdk Command.Dialog 래퍼 — next/dynamic으로 지연 로드
    ├── search-results.tsx          # 텍스트 랭킹 리스트 / 태그 리스트 / "No results found." 상태
    ├── use-search-shortcut.ts      # Ctrl+K·Cmd+K 전역 keydown 리스너 훅 (열림 상태 관리)
    └── search-query.ts             # 입력값 → {mode, term} 파싱 + substring 매칭/랭킹 순수 함수

lib/
├── content/
│   ├── loader.ts                   # 기존 — plain-text 본문 추출을 위한 훅 지점
│   └── search-index.ts             # 신규 — showOnHomepage=true 아티클만으로 검색 인덱스 구성
└── data/
    └── search.ts                   # 신규 — 빌드된 검색 인덱스를 export (articles.ts와 동일 패턴)

app/
├── layout.tsx                      # 변경 없음 — NavBar가 검색 트리거를 포함하게 됨
└── article/[slug]/page.tsx         # 변경 없음 — 검색 결과 선택 시 이 라우트로 이동

core/
├── home-dark.html                  # 검색 트리거 마크업 동기화 (Principle II)
├── home-light.html                 # 검색 트리거 마크업 동기화
├── article-detail-dark.html        # 검색 트리거 마크업 동기화
└── article-detail-light.html       # 검색 트리거 마크업 동기화
```

**Structure Decision**: 별도 백엔드/서비스 프로젝트를 만들지 않고 기존 단일 Next.js 앱 구조를 그대로
확장한다. 검색 전용 로직은 `components/search/`(UI)와 `lib/content` · `lib/data`(인덱스 생성/노출)로 나눠,
기존 `lib/content/loader.ts` → `lib/data/articles.ts` 로딩 패턴과 대칭을 이루도록 한다.

## Complexity Tracking

> 위반 없음 — 이 섹션은 해당 사항 없음.
