# Contract: Giscus Embed Configuration

이 기능이 갖는 유일한 "외부 인터페이스"는 `ArticleComments` 컴포넌트가 `@giscus/react`의 `<Giscus>` 컴포넌트에 전달하는 고정 prop 집합이다. 이 값들은 https://giscus.app 에서 저장소 소유자가 발급받은 확정값이며, 컴포넌트 내부 상수로 하드코딩된다 (research.md #4 참조).

## 고정 Props (변경 시 giscus.app에서 재발급 필요)

| Prop | Value | 비고 |
|---|---|---|
| `repo` | `Revi1337/revi-blog-comments` | `owner/name` 형식, public repo |
| `repoId` | `R_kgDOTfKNMg` | GraphQL node id |
| `category` | `Announcements` | giscus/관리자만 새 Discussion 생성 가능 |
| `categoryId` | `DIC_kwDOTfKNMs4DBqAj` | |
| `mapping` | `pathname` | 게시글 URL 경로 기준 매핑 |
| `strict` | `"0"` | 퍼지 매칭 허용 |
| `reactionsEnabled` | `"1"` | 메인 포스트 반응 표시 |
| `emitMetadata` | `"0"` | 부모 페이지로 메타데이터 전송 안 함 |
| `inputPosition` | `"bottom"` | 댓글 입력창을 목록 아래에 배치 |
| `lang` | `"ko"` | 위젯 UI 언어 |
| `loading` | `"lazy"` | 댓글 컨테이너 근처 스크롤 전까지 iframe 로드 지연 |

## 런타임 Prop (페이지별로 달라짐)

| Prop | Value | 비고 |
|---|---|---|
| `theme` | `isDark ? "dark" : "light"` | `useTheme()`의 `isDark`에서 파생. 값이 바뀌면 `@giscus/react`가 재마운트 없이 postMessage로 iframe에 반영 |

## 계약 보장 사항

1. `mapping="pathname"` + `strict="0"`이 유지되는 한, 서로 다른 게시글 경로는 서로 다른 Discussion에 매핑되며 giscus가 이를 자동으로 생성/탐색한다 — 이 앱은 매핑 로직을 직접 구현하지 않는다.
2. `theme` prop 외의 고정 props가 런타임에 바뀌는 경우는 없다(사용자 입력이나 URL에 의존하지 않음).
3. 이 컴포넌트는 giscus 위젯이 실패(네트워크 차단, 스크립트 로드 실패 등)하더라도 예외를 던지지 않고 페이지의 나머지 부분(본문, 네비게이션)에 영향을 주지 않는다 — giscus 위젯 자체가 iframe으로 격리되어 있어 부모 페이지 렌더링에 영향을 주지 않는 특성을 그대로 활용한다.
