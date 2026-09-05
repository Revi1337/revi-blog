# Implementation Plan: 게시글 오디오 내레이션 재생

**Branch**: `015-audio-narration` | **Date**: 2026-09-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/015-audio-narration/spec.md`

## Summary

게시글에 저자가 미리 준비한 오디오 URL을 frontmatter의 `audio` 필드로 지정하면, 상세 페이지
메타 정보 줄(조회수 다음, 썸네일 버튼 앞)에 재생 버튼이 나타난다. 클릭하면 뷰포트 하단에
고정된 재생 컨트롤(재생/일시정지, 진행 막대 탐색, 배속, 닫기)이 열리고 즉시 재생이 시작된다.
오디오 생성/호스팅은 이 기능의 범위 밖이며, 이미 완성된 URL을 그대로 재생 대상으로 쓴다.

기술적으로는 새 서버 인프라·API·DB가 전혀 필요 없는 순수 클라이언트 UI 기능이다. `audio`
필드는 기존 `thumbnail` 필드가 처리되는 세 지점(`frontmatter.ts`/`types.ts`/`loader.ts`)에
동일한 형태로 추가하고, 메타 줄 버튼은 기존 썸네일 버튼과 동일한 조건부 렌더 + 구분자 +
`useWrapDetection` 패턴을 그대로 재사용한다. 트리거 버튼과 하단 플레이어 사이의 상태는 새
Context 없이 `ArticleHeader`가 직접 소유하고, 플레이어는 이 코드베이스에 이미 확립된 관례대로
`createPortal`로 `document.body`에 렌더해 framer-motion/backdrop-filter 조상으로 인한
fixed-포지션 containing-block 문제를 원천적으로 피한다. 플레이어 자체는 `next/dynamic`으로
지연 로드해 오디오가 없는 대다수 게시글의 번들 크기에 영향을 주지 않는다.

## Technical Context

**Language/Version**: TypeScript, Next.js 16.2.10 (App Router)

**Primary Dependencies**: 신규 npm 의존성 없음. 기존 `lucide-react`(재생/일시정지/닫기 아이콘
추가분), `motion`(선택 — 플레이어 등장/퇴장 트랜지션에 기존 `AnimatePresence` 관례를 따를지는
구현 시 결정), 브라우저 네이티브 `HTMLAudioElement`. 지연 로드는 `next/dynamic`(신규 패키지
아님, 이미 `nav-bar.tsx`의 `SearchModal`에서 쓰는 패턴 재사용).

**Storage**: N/A — 재생 상태는 컴포넌트가 살아있는 동안만 존재하는 휘발성 React 상태이며,
어떤 저장소(DB/localStorage 등)에도 영속화하지 않는다(data-model.md의 PlaybackState 참고).

**Testing**: 이 프로젝트엔 자동화 테스트 프레임워크가 없음(jest/vitest 미설치). Constitution
Principle I에 따라 `npm run build` + `playwright-cli` 스킬을 이용한 실브라우저 검증이 기본
검증 방식(quickstart.md).

**Target Platform**: 웹 브라우저(데스크탑/모바일, 다크/라이트 테마). Vercel 정적 배포 — 이
기능은 `app/article/[slug]/page.tsx`의 `generateStaticParams` 기반 정적 생성 방식을 바꾸지
않는다(research.md §7).

**Project Type**: Web (Next.js App Router 단일 프로젝트 — frontend/backend 분리 없음)

**Performance Goals**: spec SC-001(재생 버튼 클릭 후 1초 이내 재생 시작)은 우리 코드가 추가
지연 없이 즉시 `audio.play()`를 호출하는 것으로 충족한다 — 단, 실제 재생 시작까지 걸리는
시간은 외부 오디오 URL의 네트워크 응답 속도에도 좌우되며 이는 이 기능의 통제 범위 밖이다.

**Constraints**:
- 기존에 정적으로 프리렌더링되던 아티클 페이지가 이 기능 추가로 동적 렌더링(매 요청 서버
  렌더링)으로 전환되어서는 안 됨 — 모든 신규 코드는 클라이언트 컴포넌트로만 구현되므로 위반
  소지 없음.
- `timeupdate`처럼 초당 여러 번 발생하는 이벤트를 React state로 그대로 흘려보내 매 틱마다
  리렌더를 유발하지 않을 것(research.md §4, `rerender-use-ref-transient-values.md`).

**Scale/Scope**: 신규 파일 4개(오디오 버튼 컴포넌트 1, 하단 플레이어 컴포넌트 1, `<audio>`
제어 커스텀 훅 1, 이 문서들) + 기존 파일 수정 4개(`lib/content/frontmatter.ts`,
`lib/data/types.ts`, `lib/content/loader.ts`, `components/article/article-header.tsx`).
새 API 라우트·새 서버 유틸 없음.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Feature-Level Verification (NON-NEGOTIABLE) | PASS | `npm run build` + `playwright-cli`로 quickstart.md의 11단계(재생/일시정지/탐색/배속/닫기/재오픈-이어듣기/오디오 없는 글의 UI 부재/모바일·데스크탑/다크·라이트)를 실제로 구동해 확인한다. 검증용으로 테스트 아티클에 `audio:` frontmatter를 추가하는 순간부터는 `content/articles/**` 변경 규칙이 그대로 적용되므로, **`next dev` 재시작 없이는 절대 반영되지 않는다** — quickstart.md에 이 경고를 명시해뒀다. |
| II. Mandatory vercel-react-best-practices Compliance (NON-NEGOTIABLE) | PASS (구현 시 감사 필요) | 구현 전 `.agents/skills/vercel-react-best-practices/rules/`를 실제로 열어 확인해야 함. 이번 기능에서 이미 식별된 적용 대상: `bundle-dynamic-imports`(플레이어 지연 로드), `rerender-use-ref-transient-values`(`timeupdate` 매 틱 리렌더 방지 — 진행 막대/경과 시간은 ref+직접 DOM write), `rerender-move-effect-to-event`(재생/일시정지는 클릭 핸들러에서 직접 `audio.play()/pause()` 호출, "재생 중" 플래그를 지켜보는 effect로 우회하지 않음). |

Complexity Tracking 불필요 — 위 게이트 전부 PASS, 정당화가 필요한 위반 없음.

**Phase 1 설계 완료 후 재확인**: `research.md`/`data-model.md`/`quickstart.md` 작성 과정에서
새로운 의존성이나 서버 측 아키텍처 결정은 추가되지 않았다. `createPortal`/`next/dynamic` 모두
이미 이 코드베이스에 선례가 있는 기존 관례의 재사용이라 위 두 게이트 판단을 바꾸는 내용은
없다. 전 항목 PASS 유지.

## Project Structure

### Documentation (this feature)

```text
specs/015-audio-narration/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output
├── data-model.md         # Phase 1 output
├── quickstart.md         # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks — not created by this command)
```

`contracts/`는 생성하지 않는다 — 이 기능은 새 API 라우트나 외부에 노출되는 인터페이스가 없는
순수 클라이언트 UI 기능이라 계약(contract) 문서화 대상이 없다(research.md §7).

### Source Code (repository root)

```text
lib/content/frontmatter.ts       # 수정: ArticleFrontmatter에 audio?: string 추가
lib/data/types.ts                # 수정: Article 인터페이스에 audio?: string 추가
lib/content/loader.ts            # 수정: frontmatter.audio → article.audio 매핑 한 줄 추가

components/article/
├── article-header.tsx           # 수정: 메타 줄에 오디오 버튼 삽입, 트래킹 인덱스 재정렬
├── article-audio-button.tsx     # 신규: 재생 버튼(article-thumbnail-button.tsx와 동일 스타일)
├── article-audio-player.tsx     # 신규: 하단 고정 플레이어(next/dynamic으로 지연 로드, createPortal)
└── use-audio-playback.ts        # 신규: <audio> 제어 커스텀 훅(재생/정지/seek/배속/정리)
```

**Structure Decision**: Web(Next.js App Router) 단일 프로젝트 구조를 그대로 따른다. 새 파일은
모두 기존 `components/article/` 디렉터리 안에 위치시켜, `article-thumbnail-button.tsx` 등
이미 있는 아티클 전용 컴포넌트들과 같은 위치·명명 규칙(`article-*`)을 유지한다.

## Complexity Tracking

해당 없음 — Constitution Check 전 항목 PASS.
