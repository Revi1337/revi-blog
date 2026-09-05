# Research: 게시글 오디오 내레이션 재생

## 1. 메타 정보 줄에 재생 버튼을 끼워 넣는 방식

**Decision**: `article-header.tsx`의 기존 조건부 렌더 패턴(값이 있을 때만 렌더 + `Separator` + `useWrapDetection` 트래킹)을 그대로 재사용한다. 트래킹 순서를 `updatedAtIndex → readingTimeIndex → audioIndex(article.audio 있을 때만) → thumbnailIndex(article.thumbnail 있을 때만)`로 재정렬하고, `trackedItemCount` 계산식에 `article.audio ? 1 : 0`을 더한다.

**Rationale**: 이미 동일 파일 안에서 수정일/썸네일 버튼이 똑같은 3요소(조건부 렌더 + 구분자 + 줄바꿈 감지) 패턴을 공유하고 있다. 오디오 버튼만 다른 방식(예: 별도 wrapper, 별도 훅)을 쓰면 같은 줄 안에 두 가지 줄바꿈 처리 방식이 공존하게 되어 향후 항목이 늘어날 때마다 혼란을 만든다.

**Alternatives considered**: 새로운 flex 컨테이너를 하나 더 만들어 오디오 버튼만 독립시키는 방식 — 기각. 메타 줄은 이미 하나의 flex-wrap 행으로 설계돼 있고(gap-x-8/gap-y-4), 항목을 분리하면 줄바꿈 시 시각적으로 부자연스러워진다는 점이 헤더 파일 상단 주석(줄바꿈·구분자 관련 버그 이력)에 이미 기록돼 있다.

## 2. 재생 버튼(트리거)과 하단 고정 플레이어 사이의 상태 공유

**Decision**: 새 Context/Provider를 만들지 않는다. `ArticleHeader` 자신이 재생 상태(열림 여부, 재생 중 여부, 현재 위치, 배속)를 전부 소유하고, 하단 플레이어는 `createPortal(..., document.body)`로 `ArticleHeader` 내부에서 직접 렌더한다.

**Rationale**: 이미 이 코드베이스에 동일한 문제와 해법이 정확히 기록돼 있다 — `components/layout/mobile-nav-menu.tsx`의 주석: "backdrop은 body로 포탈링한다 — nav가 backdrop-blur-md(backdrop-filter)를 쓰는데, filter류 속성이 있는 조상은 후손 fixed 요소의 containing block이 돼버려서 nav 안에 두면 backdrop이 뷰포트 전체가 아니라 nav 높이로 잘려버린다." `ArticleHeader`는 `motion.div`/`motion.h1`(framer motion)로 감싸여 있고 motion은 애니메이션 중 인라인 `transform`을 적용하므로, 플레이어를 그 서브트리 안에 그대로 두면 같은 종류의 containing-block 버그(뷰포트 전체가 아니라 헤더 크기로 잘리는 fixed 요소)가 재현될 위험이 있다. `document.body`로 포탈링하면 이 문제 자체가 발생할 수 없다. `toc-sidebar.tsx`에도 동일한 `createPortal` 사용례가 있어 이 코드베이스의 확립된 관례임을 다시 확인했다.

이 기능은 앱 전역이 아니라 "한 번에 한 게시글 페이지"에만 존재하는 로컬 상태이므로, `ThemeProvider`처럼 앱 전체를 감싸는 Context를 새로 도입할 이유가 없다(소비자가 이 기능 하나뿐).

**Alternatives considered**:
- React Context Provider로 `app/article/[slug]/page.tsx`를 감싸기 — 기각. `page.tsx`는 async Server Component라 그 자체를 클라이언트 컴포넌트로 바꿀 수 없고, 감싸려면 새 클라이언트 Provider 컴포넌트를 끼워 넣어야 하는데, 소비자가 트리거 버튼과 플레이어 단 둘뿐인 상황에서는 불필요한 간접 계층이다.
- 상태를 `page.tsx`로 끌어올려 props로 내리기 — 기각. 위와 같은 이유로 `page.tsx`를 클라이언트화해야 하며, 다른 `*Handler` 컴포넌트들(`CodeCopyHandler` 등)이 이미 "독립적으로 마운트되는 자기완결형 컴포넌트"라는 관례를 따르고 있어 그 관례와도 어긋난다.

## 3. 플레이어 컴포넌트의 번들 분리

**Decision**: 플레이어(진행 막대·배속 메뉴 등 재생 UI 전체)는 `next/dynamic`으로 `{ ssr: false }` 지연 로드한다.

**Rationale**: `components/layout/nav-bar.tsx`가 `SearchModal`에 대해 이미 이 패턴을 쓰고 있다(초기 렌더에 필요 없는 무거운 컴포넌트를 지연 로드). 오디오 재생 UI도 재생 버튼을 누르기 전까지 전혀 필요 없으므로 동일하게 처리한다. `.agents/skills/vercel-react-best-practices/rules/bundle-dynamic-imports.md`(impact: CRITICAL)가 이 상황을 정확히 다룬다.

**Alternatives considered**: 처음부터 번들에 포함 — 기각. 오디오가 없는 글(대다수)에서도 불필요한 JS를 내려받게 된다.

## 4. `<audio>` 엘리먼트 제어 캡슐화

**Decision**: 재생/일시정지, seek(`currentTime` 대입), 배속(`playbackRate` 대입), 메타데이터 로드(`duration`) 등 `HTMLAudioElement` 관련 로직을 플레이어 컴포넌트 전용 커스텀 훅 하나(예: `useAudioPlayback`)로 캡슐화한다. 이 훅은 플레이어 컴포넌트가 언마운트될 때(닫기 버튼 클릭, 또는 페이지 이동으로 `ArticleHeader` 자체가 언마운트될 때) `pause()`를 호출하고 리스너를 정리한다.

**Rationale**: `useWrapDetection`, `useVisitorStats`처럼 이 프로젝트는 이미 "DOM/네트워크와 맞닿는 로직은 컴포넌트 밖 커스텀 훅으로 뺀다"는 관례를 갖고 있다. 언마운트 시 정지·정리는 Constitution Principle II(vercel-react-best-practices 감사) 대상이며, effect cleanup으로 처리하는 것이 표준 패턴이다.

**진행률 표시는 React state로 매 프레임 반영하지 않는다**: `timeupdate` 이벤트는 초당 여러 번 발생한다. 이걸 그대로 `useState`에 반영하면 재생 중 계속 리렌더가 발생한다(`.agents/skills/vercel-react-best-practices/rules/rerender-use-ref-transient-values.md`, impact: MEDIUM, "값이 자주 바뀌고 매 업데이트마다 리렌더를 원하지 않으면 useRef에 저장하라"). `timeupdate` 핸들러 안에서 진행 막대의 채움 너비와 경과 시간 텍스트는 ref로 잡은 DOM 노드에 직접 `style`/`textContent`를 써서 갱신하고, React state는 재생/일시정지 여부·배속·열림 여부처럼 드물게 바뀌는 값에만 사용한다.

재생/일시정지 같은 사용자 액션에 의한 부수효과는 `useEffect`가 아니라 클릭 핸들러 안에서 직접 수행한다(`.agents/skills/vercel-react-best-practices/rules/rerender-move-effect-to-event.md`) — "재생 중" 같은 상태를 만들어 그 상태를 지켜보는 effect로 `audio.play()`를 호출하는 간접 방식을 피한다.

## 5. 배속(재생 속도) 옵션

**Decision**: `1×`, `1.25×`, `1.5×`, `2×` 네 단계를 순환(cycle)하는 단일 버튼으로 구현한다(스크린샷의 `1.0×` pill 버튼 클릭 시 다음 값으로 순환).

**Rationale**: spec은 구체적 배속 값을 정하지 않고 설계 단계에 위임했다(Assumptions). 팟캐스트/동영상 플레이어의 통상적인 배속 구성을 그대로 채택했고, 스크린샷에 드롭다운이 아니라 단일 pill 버튼만 보이므로 별도 메뉴 없이 클릭 시 순환하는 상호작용이 그 UI와 가장 잘 맞는다.

**Alternatives considered**: 드롭다운/팝오버로 전체 목록 노출 — 기각. 스크린샷에 그런 UI가 없고, 항목 4개 정도는 순환 버튼 하나로 충분히 접근 가능하다.

## 6. 하단 고정 위치와 iOS Safari `backdrop-filter` 이슈 재검토

**Decision**: 플레이어 카드 자체에 `backdrop-blur`를 써도 무방하다. 다만 카드 내부에는 별도의 `position: fixed` 자식을 두지 않는다.

**Rationale**: AGENTS.md에 기록된 iOS Safari 이슈는 "상단 상태바 색이 backdrop-filter가 있는 요소의 픽셀 샘플링을 얼어붙게 만든다"는 것으로, 뷰포트 최상단(노치/상태바 뒤)에 있는 요소에 한정된 문제다. 이 플레이어는 뷰포트 하단에 고정되므로 그 문제와는 무관하다. `mobile-nav-menu.tsx` 주석이 지적하는 "filter류 조상이 후손 fixed 요소의 containing block이 된다"는 문제도, 플레이어 내부에 별도의 fixed 자식을 두지 않는 한 발생하지 않는다.

## 7. 렌더링 모드 영향 여부

**Decision**: 이 기능은 `app/article/[slug]/page.tsx`의 정적 생성(`generateStaticParams`) 방식을 전혀 바꾸지 않는다. 새로 추가되는 모든 코드는 클라이언트 컴포넌트(`"use client"`)이며, 서버 쪽 데이터 흐름은 기존 `thumbnail` 필드와 동일하게 build 시점에 마크다운 frontmatter에서 읽어 정적으로 굳혀진다.

**Rationale**: 새 API 라우트나 서버 상태가 전혀 필요 없다(spec 범위 제외 항목과 일치 — 오디오 생성/호스팅은 다루지 않음). 프로젝트 전반의 "기존 정적 페이지를 동적 렌더링으로 전환하지 않는다"는 관례(011 스펙 등에서 반복 확인됨)를 자연히 만족한다.
