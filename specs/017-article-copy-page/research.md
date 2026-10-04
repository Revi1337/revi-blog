# Phase 0 Research: 아티클 Copy Page 메뉴

Technical Context에 `NEEDS CLARIFICATION`은 없다 — 아래 결정들은 사전 논의(코드베이스 조사 + git log 조사 + 실제 레퍼런스 사이트 확인)를 통해 이미 확정된 방향을 연구 산출물 형식으로 정리한 것이다.

## 1. TOC 사이드바와의 관계 — 같은 sticky 박스 안 vs 독립된 sticky 요소 vs 공유 sticky 래퍼

**최초 Decision (구현 후 실측으로 반증됨)**: Copy Page 메뉴를 `toc-sidebar.tsx`의 `sticky top-40` 박스와 완전히 분리된, 자기 자신만의 `position: sticky` 요소(`top-[112px]`)로 구현했다. `toc-sidebar.tsx`는 한 글자도 수정하지 않았다.

**실측으로 발견된 문제**: `position: sticky`의 release 지점은 `containerBottom - top - height`로 결정되는데, 이 값은 TOC(`top=160, height=H_toc`)와 메뉴(`top=112, height=32`)가 서로 다르다 — `160+H_toc`와 `112+32=144`가 같을 수가 없다(H_toc는 항상 양수이므로 TOC가 항상 메뉴보다 먼저 release됨). 실제 사용자가 `/article/Scope`에서 스크롤하며 "Copy Page와 TOC 사이 간격이 스크롤 위치에 따라 변한다"고 보고했고, 실측해보니 TOC는 scrollY 15013에서 풀리는데 메뉴는 15175까지 고정된 채 남아 162px 구간 동안 서로 어긋나는 게 확인됐다 — 두 개의 독립된 sticky 요소는 애초에 "항상 같은 간격 유지"와 "항상 같은 지점에서 release"를 동시에 만족할 수 없다(수학적으로 증명 가능: 전자는 `top_menu+height_menu+gap=top_toc`를, 후자는 `top_menu+height_menu=top_toc+height_toc`를 요구하는데 둘을 연립하면 `gap=-height_toc`가 되어 모순).

**최종 Decision**: Copy Page 메뉴와 TOC 카드를 **하나의 공유 `position: sticky` 래퍼**(`app/article/[slug]/page.tsx`가 소유, `top-[112px]`)로 함께 감싼다. `toc-sidebar.tsx`는 자기 자신의 `sticky top-40 ... space-y-10` 바깥 래퍼 한 겹만 제거하고(스크롤스파이·활성 헤딩 감지·"+N more"·모바일 드로어 등 **내부 로직은 전혀 변경하지 않음**), desktop variant는 카드 자체에 `hidden lg:block`만 남긴 순수 프레젠테이션 컴포넌트가 됐다.

**Rationale**: 합쳐진 박스의 release 조건은 `top_combined + height_combined = top_toc_원래 + height_toc` 하나만 만족하면 된다(간격은 같은 flow 안에 있으므로 자동으로 항상 일정). `top_combined = 160 - 32 - 16 = 112`로 두면 `112 + (32+16+H_toc) = 160 + H_toc`로 정확히 TOC 단독이었을 때와 같아진다 — 메뉴 높이가 보존 등식에 상쇄되어 **모든 글의 TOC 높이(H_toc)와 무관하게 항상 성립**하는 것이 핵심이다(독립 sticky 방식은 H_toc별로 메뉴의 top을 따로 계산해야 하는데 CSS 정적 값으로는 불가능했음). 하나의 DOM 요소이므로 간격이 어긋나는 경로 자체가 구조적으로 없다.

**"TOC는 한 글자도 안 건드린다"는 애초 하드 컨스트레인트에 대한 정정**: 이 제약은 수단이었지 목적이 아니었다 — 진짜 목적은 "TOC의 스크롤 동작이 프로덕션과 100% 동일하다"였다. 독립 sticky 설계는 그 수단(파일 무수정)은 지켰지만 진짜 목적(동일한 동작)은 실패했다. 최종 설계는 수단을 완화(바깥 포지셔닝 래퍼 한 겹만 호출부로 이동)하는 대신 목적을 실제로 달성한다 — 실측(아래 §9)으로 TOC의 release 지점이 프로덕션과 1px 오차 없이 동일함을 확인했다.

**Alternatives considered**:
- **독립 sticky 유지 + 메뉴의 `top`을 글마다 동적으로(JS로 TOC 실측 높이 기반) 계산**: 이론적으로는 가능(ResizeObserver로 TOC 높이를 읽어 매번 재계산)하지만, 이미 완성도 높은 `toc-sidebar.tsx`의 측정 로직과 중복되는 새 관찰자를 추가해야 하고, 레이아웃 스래싱 위험도 생김 — 공유 래퍼 방식이 런타임 계산 없이 정적 CSS만으로 동일한 보장을 주므로 기각.
- **독립 sticky 유지 + TOC `top-40`을 늘려 보정**: `toc-sidebar.tsx`의 `top` 값 자체를 수정해야 해 "파일 무수정"을 어차피 어기게 되고, 그럴 거면 차라리 구조를 통째로 공유 래퍼로 바꾸는 쪽이 더 깔끔함 — 기각.

## 2. 원문을 어디에 들고 갈 것인가 — `Article` 타입 확장 vs 분리된 캐시

**Decision**: `Article` 인터페이스에는 아무 필드도 추가하지 않는다. `lib/data/articles.ts`에 `rawMarkdownBySlug: Map<string, string>`을 별도로 두고, `getArticleRawMarkdown(slug)` 헬퍼로만 접근한다.

**Rationale**: `app/article/[slug]/page.tsx`는 서버 컴포넌트에서 `article`(전체 `Article` 객체)을 `<ArticleHeader article={article} />`(`"use client"`)에 그대로 넘긴다. Next의 RSC는 클라이언트 컴포넌트에 넘기는 prop을 "그 컴포넌트가 실제로 읽는 필드"가 아니라 **객체 전체**를 flight payload로 직렬화한다 — 지금도 `bodyHtml`/`plainBody`가 이 경로로 한 번 더 직렬화되고 있는 상태다. 원문(프론트매터 포함, 본문보다 작지만 결코 작지 않은 텍스트)을 `Article`에 얹으면, Copy Page 메뉴를 한 번도 열지 않는 방문자의 초기 페이지 payload까지 전부 커진다. 분리된 `Map`으로 두고 Route Handler만 접근하게 하면 이 비용이 0이 된다.

**Alternatives considered**:
- **`Article.rawMarkdown?: string` 필드 추가**: 구현이 가장 단순하지만 위 payload 문제를 그대로 얹음 — 기각.
- **매 요청마다 `fs.readFileSync`로 다시 읽기**: `Article` 타입은 안 건드리지만, 이미 메모리에 전체 콘텐츠를 캐시해둔 이 프로젝트의 top-level await 패턴(constitution Principle I 배경)과 다르게 Route Handler가 호출될 때마다 디스크 I/O가 발생 — 느리고, 기존 아키텍처와 일관성이 없어 기각.

## 3. 원문 서빙 경로의 런타임 — Node vs Edge

**Decision**: 신규 Route Handler(`app/article/[slug]/raw/route.ts`)는 `runtime`을 지정하지 않는다(기본값 Node 유지).

**Rationale**: `lib/data/articles.ts` → `lib/content/loader.ts`는 `node:fs`를 직접 import하는 모듈 그래프다. Edge 런타임은 `node:fs`를 지원하지 않아, 이 체인을 import하는 Route Handler에 `runtime: "edge"`를 지정하면 **런타임 에러가 아니라 빌드 자체가 깨진다**. `app/api/track`이 동일한 이유(슬러그 존재 검증에 `getArticleBySlug`, `fs` 기반)로 이미 Node 런타임인 선례를 그대로 따른다. `app/api/stats/*`가 edge인 것은 Redis REST 호출만 하고 이 fs 기반 모듈 그래프를 전혀 import하지 않기 때문이며, 이 둘을 혼동해 새 라우트에 edge를 지정하지 않는다.

**Alternatives considered**: 없음 — `node:fs` 의존 체인을 import하는 이상 Edge는 기술적으로 선택 가능한 옵션이 아니다(선택의 문제가 아니라 제약).

## 4. 비공개 메모 제거 시점 — 매 요청마다 vs 로드 시 1회

**Decision**: `loader.ts`가 `loadArticles()` 시점에 `rawMarkdownBySlug`를 만들 때 `stripComments()`를 한 번만 통과시켜 저장한다. Route Handler는 이미 걸러진 값을 그대로 응답한다.

**Rationale**: `stripComments()`는 입력이 바뀌지 않는 순수 함수이고, 원문은 빌드/서버 시작 시 한 번 로드된 뒤 프로세스 생애주기 동안 불변이다(이 프로젝트의 기존 `bodyHtml`/`plainBody` 계산과 동일한 전제). 매 요청마다 다시 돌리는 건 불필요한 반복 연산이다. 또한 "프론트매터/본문을 나눠서 각각 처리할 필요 없이 파일 전체 문자열에 바로 적용해도 안전한가"는 이미 확인됨 — `%%...%%` 패턴은 정상적인 YAML frontmatter 안에 나타날 일이 없다(현재 전체 글 기준 0건).

**Alternatives considered**: Route Handler가 요청마다 `stripComments(raw)`를 호출 — 매 요청 재연산이라는 불필요한 비용 외에 다른 차이가 없어 로드 시 1회 처리를 택함.

## 5. ChatGPT/Claude로 넘길 URL의 origin — `SITE_URL`(고정 프로덕션 도메인) vs `window.location.origin`

**Decision**: 클라이언트에서 클릭 시점에 `window.location.origin`을 사용해 절대 URL을 구성한다. `lib/site-config.ts`의 `SITE_URL`은 쓰지 않는다.

**Rationale**: `SITE_URL`은 "Vercel Preview 배포 등에서도 sitemap/RSS가 항상 실제 프로덕션 도메인을 가리키게" 하려는 의도로 존재한다(`lib/site-config.ts` 주석) — sitemap/RSS/OG는 외부 크롤러가 어느 배포에서 그 메타데이터를 읽었는지와 무관하게 항상 같은 정식 URL을 가리켜야 하기 때문이다. 이번 기능은 정반대 요구를 갖는다: "Open in ChatGPT/Claude"는 **지금 사용자가 실제로 보고 있는 배포**(프로덕션일 수도, Preview 배포일 수도 있음)에서 원문을 가져올 수 있는 URL이어야 한다 — 만약 Preview 배포에서 `SITE_URL`(프로덕션 도메인)을 그대로 쓰면, 그 프로덕션 환경에는 아직 없는 글이거나 다른 내용일 수 있어 ChatGPT/Claude가 엉뚱한(또는 존재하지 않는) 페이지를 읽게 된다.

**Alternatives considered**: `SITE_URL` 재사용 — sitemap과 같은 값을 쓰는 게 일관적으로 보이지만, 위에서 설명한 "지금 보고 있는 배포"라는 요구와 충돌해 기각.

## 6. "Copy Page" 실패 시 피드백 방식

**Decision**: `fetch` 실패 또는 `navigator.clipboard.writeText` 거부(reject) 시, 버튼에 일시적인 에러 상태(예: 아이콘/문구 변경)를 표시한다. `code-copy-handler.tsx`의 "조용히 무시(`.catch(() => {})`)" 패턴은 재사용하지 않는다.

**Rationale**: `code-copy-handler.tsx`가 실패를 조용히 삼키는 이유는 코드 블록 복사가 부가 기능이라 실패해도 독자가 이미 코드를 눈으로 보고 있어 대체 수단이 바로 앞에 있기 때문이다. Copy Page는 그 자체가 메인 동작이라, 조용히 실패하면 "눌렀는데 아무 일도 안 일어난" 것처럼 보인다 — 오디오 재생 실패를 조용히 삼켜 사용자가 원인을 알 수 없었던 과거 버그(`2982866`)와 같은 교훈이다. spec FR-010이 이를 명시적으로 요구한다.

**Alternatives considered**: `code-copy-handler.tsx`와 동일하게 조용히 무시 — spec FR-010과 직접 충돌해 기각.

## 7. 드롭다운 UI 메커니즘

**Decision**: 외부 라이브러리(Radix 등) 추가 없이, `toc-sidebar.tsx`의 모바일 드로어가 이미 쓰고 있는 패턴(open-state `useState` + `createPortal`로 배경 오버레이 + 열려 있는 동안만 Escape 키 리스너)을 그대로 재사용한다.

**Rationale**: `package.json`에 `@radix-ui/react-slot` 외 드롭다운/메뉴 전용 라이브러리가 없다. 이 프로젝트에 이미 동일한 요구사항(버튼 클릭 → 패널 열림 → 바깥 클릭/Escape로 닫힘)을 구현한 코드가 있으므로, 새 라이브러리를 추가하는 대신 그 패턴을 재사용하는 것이 가장 단순하다.

**Alternatives considered**: Radix `DropdownMenu` 신규 추가 — 포커스 트랩·키보드 네비게이션이 더 견고해지지만, 이 프로젝트 전체에 선례가 없는 새 의존성을 이 기능 하나를 위해 들여오는 건 과함 — 기각.

## 8. ChatGPT/Claude로 전달하는 프롬프트 형식

**Decision**: 각 서비스의 공개된 쿼리 파라미터(`https://chatgpt.com/?q=...`, `https://claude.ai/new?q=...`)로 "다음 URL의 글을 읽고 질문에 답해달라" 형태의 프롬프트를 URL-인코딩해 전달한다. 둘 다 입력창에 프롬프트를 미리 채워줄 뿐 자동 전송은 하지 않는다(사용자가 직접 Enter).

**Rationale**: resilience4j(readme.io)·Vercel 공식 문서가 제공하는 것과 동일한 성격의 동작이며, 두 서비스 모두 이 쿼리 파라미터를 공개적으로 지원한다. 자동 전송하지 않는 이유는 사용자가 프롬프트를 수정할 기회 없이 바로 요청이 나가는 것을 피하기 위함(레퍼런스 사이트들의 동작과 동일).

**Alternatives considered**: 프롬프트 없이 raw markdown URL만 전달 — 사용자가 "이 링크를 읽어달라"는 의도를 직접 타이핑해야 해서 "추가 조작 없이 바로 질문할 수 있는 상태"(spec FR-005/FR-006)를 만족하지 못함, 기각.

## 9. 버튼 크기·아이콘 — 추측 대신 실제 레퍼런스 사이트 실측

**Decision**: resilience4j(readme.io)와 Vercel 공식 문서의 실제 구현을 `playwright-cli`로 직접 방문해 DOM을 실측했다. 버튼은 TOC 카드와 같은 폭을 꽉 채우는 형태가 아니라, 컴팩트한 "split button"(주 버튼 + 별도의 작은 쉐브론 버튼) 패턴이었다(Vercel 실측: 117×32px, auto-width). ChatGPT/Claude/Markdown 아이콘은 `lucide-react`의 범용 아이콘(Bot/Sparkles/FileText)이 아니라, resilience4j가 실제로 쓰고 있는 공식 브랜드 마크(OpenAI 플라워 마크, Claude 별 마크, markdown-mark 프로젝트의 "M↓" 배지, 전부 viewBox와 path data를 그대로 실측)로 교체했다.

**Rationale**: 사용자가 "레퍼런스 사이트 둘을 반드시 참고해서 로고를 같게 하라"고 명시적으로 요구했다 — 추측으로 만든 아이콘은 실제로 "이상해" 보인다는 피드백을 받았다. 외부 서비스로 연결하는 링크에 그 서비스의 실제 브랜드 마크를 쓰는 것은 사칭이 아니라 "이 버튼이 어디로 연결되는지" 알려주는 표준적인 용법(Share to X/Google 로그인 버튼과 동일한 성격)이라 문제가 없다.

**Alternatives considered**: `lucide-react`의 일반 아이콘(Bot/Sparkles)으로 근사 — 빠르지만 사용자가 명시적으로 거부함, 기각.

## 10. "Copy Page" → "Copied!" 전환 시 버튼 크기 변화 금지

**Decision**: 클릭 후에도 버튼의 **보이는 텍스트와 `aria-label`을 "Copy Page"로 고정**하고, 고정 크기 아이콘 슬롯(`size-3.5`) 안에서 아이콘(Copy → Check/AlertCircle)만 바꾼다. 텍스트를 "Copied!"/"Copy failed"로 바꾸는 최초 구현은 폐기했다.

**Rationale**: 사용자가 "Copy Page → Copied로 변할 때 컨테이너 사이즈 자체가 변하면 안 된다, Vercel의 동작을 보라"고 지적했다. Vercel의 실제 "Copy page" 버튼을 `playwright-cli`로 실측한 결과, 클릭 전후로 `aria-label`과 화면에 보이는 텍스트 모두 "Copy page"로 완전히 동일했고(`<span class="invisible">Copy page</span>` + `<span class="absolute inset-0">Copy page</span>` 이중 구조로 레이아웃 폭을 항상 "Copy page" 기준으로 고정), 아이콘만 `scale/opacity` 트랜지션으로 복사 아이콘↔체크 아이콘을 전환하고 있었다. 텍스트가 전혀 바뀌지 않으므로 버튼 폭이 바뀔 수가 없다는 것이 핵심 — 이 프로젝트는 Vercel만큼 정교한 이중 레이어 크로스페이드까지는 구현하지 않았지만(과설계 방지), "텍스트는 절대 안 바꾼다"는 핵심 원칙만 그대로 가져와 동일한 효과(크기 불변)를 더 단순한 코드로 달성했다.

**Alternatives considered**:
- Vercel처럼 두 아이콘을 `absolute`로 겹쳐놓고 opacity/scale로 크로스페이드 — 시각적으로 더 매끄럽지만 이 기능 규모에서는 과한 디테일이라 단순 조건부 렌더링으로 충분하다고 판단, 기각(추후 polish 단계에서 고려 가능).
- 아이콘은 그대로 두고 텍스트만 더 짧게(예: "Copy"→"OK") — 그래도 텍스트 폭이 미세하게 달라져 근본 해결이 아님, 기각.
