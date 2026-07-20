# Quickstart: 헤더 Nav Dark/Light 토글 버튼 검증

## Prerequisites

- `plan.md` / `tasks.md`에 따라 기능이 구현되어 있어야 함
- 개발 서버 실행 가능: `npm run dev` (`AGENTS.md`에 따라 이 프로젝트의 dev/start 스크립트는 3999 포트로 고정됨)

## Setup

```bash
npm install
npm run build   # constitution Principle I: 수동 검증 전에 빌드가 통과해야 함
npm run dev
```

브라우저에서 `http://localhost:3999/`를 연다.

## Validation scenarios

1. **리로드 없이 토글로 테마 전환** (User Story 1 / SC-001, SC-005)
   - DevTools의 Network 탭을 열고, LOGIN 옆의 토글 버튼을 클릭한다.
   - 기대 결과: 페이지 색상이 즉시(체감 0.3초 이내) 반전되고, 새로운 네트워크 요청이 0건이다.

2. **레퍼런스와의 시각적 동일성** (User Story 2 / SC-002)
   - `localhost:3999`와 나란히 두 번째 탭에서 `https://me.revi1337.com`을 연다.
   - `LOGIN | 🌙/☀️` 영역을 비교한다: 아이콘 모양/크기, 구분선 스타일/간격, 호버 상태, 클릭 전환이 시각적으로 구분 불가능해야 한다.
   - `playwright-cli`(또는 constitution Principle I에 따라 `playwright` MCP의 스크린샷 도구)로 두 헤더를 캡처해 시각적으로 비교한다.

3. **하드 리프레시에도 테마 유지** (사용자 명시 요구사항 + FR-007/FR-008)
   - light로 전환한 뒤 하드 리프레시(Cmd+Shift+R / DevTools에서 캐시 비활성화)한다.
   - 기대 결과: 페이지가 처음부터 light 테마로 로드되고, 다른 테마가 잠깐이라도 보이는 깜빡임이 없다.
   - dark로 전환한 상태로도 동일하게 반복한다.

4. **페이지 이동 간 테마 유지** (FR-010)
   - 홈 화면에서 light로 전환한 뒤 아티클 상세 페이지로 이동한다.
   - 기대 결과: 아티클 상세 페이지가 이미 light 테마로 로드된다.

5. **최초 방문 시 기본값** (FR-008)
   - 사이트의 `localStorage`를 비우고, OS 테마를 dark(또는 설정 없음)로 둔 채 새로고침한다.
   - 기대 결과: 페이지가 dark 테마를 기본값으로 로드된다.

6. **모든 UI 요소가 토글에 반응** (FR-009 / SC-004)
   - 아티클 상세 페이지에서 테마를 전환하고, 네비게이션·코드 블록·TOC·메트릭 카드·푸터가 모두 팔레트를 전환하며 이전 테마의 색상이 하나도 남지 않는지 확인한다.

7. **빠른 더블/트리플 클릭** (Edge Cases)
   - 토글을 빠르게 3번 클릭한다.
   - 기대 결과: 최종적으로 표시되는 테마가 시작 테마로부터 홀수 번 전환된 결과와 일치하고, 중간에 깨지거나 어중간한 시각 상태가 없다.

## Expected outcome

7개 시나리오가 모두 통과해야 constitution Principle I(실제로 실행해서 검증해야 하며, 빌드/타입체크만으로는 부족함)에 따라 기능을 완료로 표시할 수 있다.
