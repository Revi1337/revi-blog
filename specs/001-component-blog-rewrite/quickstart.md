# Quickstart: 정적 HTML 블로그 컴포넌트 재구현 검증

constitution Principle I(Feature-Level Verification)에 따라, 이 feature는 아래 시나리오를 **npm 빌드 + `playwright-cli`로 실제 브라우저 구동**하여 검증하고, 픽셀 단위 비교가 필요한 부분(SC-001, SC-002)은 **`playwright` MCP의 스크린샷 도구**로 추가 검증한다. 오류가 발견되면 완료로 간주하지 않고 수정한다.

## 사전 준비

```bash
npm install
npm run build
npm run start   # 또는 npm run dev
```

## 검증 시나리오

### 1. 홈 화면 — 기존 HTML과 대조 (SC-001, SC-005)
1. `playwright-cli`로 `/`와 기존 `core/home-dark.html` / `core/home-light.html`을 각각 연다.
2. 고정 네비게이션, 히어로 캐러셀(3장, 8초 자동 재생, prev/next, 인디케이터), "Entry Stream" 카드 그리드(3열), 페이지네이션(1~12 + prev/next)이 레이아웃·색상 수준에서 일치하는지 비교한다.
3. 카드 호버 시 썸네일 확대·제목 색상 변경·화살표 이동을 확인한다.
4. 페이지를 스크롤한 뒤에도 네비게이션 바의 반투명 블러(glassmorphism) 효과가 유지되는지 확인한다 (Edge Case).
5. `playwright` MCP의 스크린샷 도구로 `/`와 `core/home-*.html`을 각각 캡처해 픽셀 단위로 비교한다 (SC-001).
6. **기대 결과**: 레이아웃/색상/인터랙션이 기존 정적 HTML과 시각적으로 동일.

### 2. 아티클 상세 화면 — 기존 HTML과 대조 (SC-002, SC-006)
1. `/article/[slug]`와 기존 `core/article-detail-dark.html` / `core/article-detail-light.html`을 비교한다.
2. 2열 레이아웃(본문 8열 + 사이드바 4열), 카테고리 배지, 제목 fade-in, 코드 블록(3색 도트 + 구문 강조), sticky TOC(활성 상태 하이라이트), 메트릭 카드 3열, 이전/다음 글 네비게이션을 확인한다.
3. 본문 텍스트를 드래그해 선택했을 때 선택 영역 색상이 녹색 계열인지 확인한다 (Edge Case).
4. `playwright` MCP의 스크린샷 도구로 `/article/[slug]`와 `core/article-detail-*.html`을 각각 캡처해 픽셀 단위로 비교한다 (SC-002).
5. **기대 결과**: 모든 요소가 기존 HTML과 동일하게 재현됨.

### 3. Dark/Light 전환 시 DOM 동일성 (SC-004)
1. `<html>`의 class를 `dark` ↔ 제거(light)로 바꿔가며 같은 페이지를 렌더링한다.
2. 색상(배경/텍스트/액센트)만 바뀌고 레이아웃·콘텐츠·DOM 구조는 동일한지 확인한다.
3. dark 전용 효과(카드 텍스트 glow, 터미널 글로우)가 light에서는 비활성화되는지 확인한다.
4. **기대 결과**: 두 테마 간 시각적 차이는 색상 팔레트뿐.

### 4. 공유 컴포넌트 단일 소스 반영 (SC-003)
1. `components/layout/nav-bar.tsx`의 메뉴 텍스트를 하나 임시로 수정한다.
2. 홈(dark/light)과 아티클 상세(dark/light) 4개 화면 모두에서 변경이 반영되는지 확인한다.
3. 수정을 되돌린다.
4. **기대 결과**: 수정 지점 1곳으로 4개 화면 전부 갱신.

### 5. 반응형 (Edge Cases)
1. 뷰포트를 375px(모바일)로 줄여 홈의 카드 그리드가 1열로, 아티클 상세의 2열 레이아웃이 1열(TOC가 본문 아래로 이동)로 바뀌는지 확인한다.

## 완료 기준

- 위 5개 시나리오 모두 오류 없이 통과
- `npm run build`가 경고/에러 없이 성공
- 위 과정에서 발견된 오류는 모두 수정 완료 상태
