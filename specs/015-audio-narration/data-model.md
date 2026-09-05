# Data Model: 게시글 오디오 내레이션 재생

## Article.audio (기존 `Article`/`BlogCardData` 엔티티 확장)

기존 `thumbnail?: string`과 동일한 형태로 프론트매터에서 읽어오는 선택적 필드.

| 필드 | 타입 | 값이 있을 때 | 값이 없을 때 |
|---|---|---|---|
| `audio` | `string \| undefined` | 브라우저가 바로 재생 가능한 오디오 리소스의 URL | 해당 게시글에는 재생 버튼/컨트롤이 전혀 렌더되지 않음(FR-002) |

**적용 파일** (모두 `thumbnail` 필드가 처리되는 세 지점과 동일):

- `lib/content/frontmatter.ts` — `ArticleFrontmatter` 인터페이스에 `audio?: string` 추가. 별도 검증 스키마(zod 등)가 없는 기존 관례를 그대로 따르며, 새 검증 계층을 만들지 않는다.
- `lib/data/types.ts` — `Article` 인터페이스에 `audio?: string` 추가. `BlogCardData`(카드/캐러셀용 요약 타입)에는 추가하지 않는다 — spec 범위가 게시글 "상세 페이지" 메타 줄로 한정되어 있고, 홈 카드 등에는 오디오 UI가 필요 없기 때문.
- `lib/content/loader.ts` — `frontmatter.audio → article.audio` 매핑 한 줄 추가(`thumbnail: frontmatter.thumbnail` 옆).

**검증 규칙**: 없음. URL 형식 검증이나 오디오 파일 유효성 검사는 이 기능의 범위 밖이다(spec "범위 제외" — 오디오 생성/호스팅은 다루지 않으며, 저자가 이미 재생 가능한 URL을 넣는다고 가정한다). 로드 실패(깨진 URL) 시 동작은 `<audio>` 엘리먼트의 표준 `error` 이벤트로만 감지하고, UI 차원의 별도 폴백은 이번 기능에서 구현하지 않는다(spec Edge Cases에 열거됐으나 FR로 승격되지 않음 — 추후 필요 시 별도 개선 대상).

## PlaybackState (클라이언트 전용 휘발성 상태, 영속화하지 않음)

DB/스토리지 엔티티가 아니라 `ArticleHeader`(트리거 버튼 소유)와 플레이어 컴포넌트 내부에서만 존재하는 React 상태. 페이지를 벗어나거나 새로고침하면 전부 소멸한다(spec Assumptions와 일치).

| 필드 | 타입 | 설명 | 상태 저장 방식 |
|---|---|---|---|
| `isOpen` | `boolean` | 하단 플레이어 표시 여부 | `useState` (드물게 바뀜) |
| `isPlaying` | `boolean` | 재생/일시정지 여부 | `useState` (드물게 바뀜) |
| `currentTime` | `number` (초) | 마지막 재생 위치 — 닫기(FR-012) 시 이 값을 보존해 재오픈 시 이어서 재생 | `useRef` + 진행 막대/시간 텍스트는 DOM에 직접 write (매 `timeupdate`마다 리렌더 방지, research.md §4) |
| `duration` | `number` (초) | 오디오 총 길이 (`loadedmetadata` 시점에 확정) | `useState` (한 번만 바뀜) |
| `playbackRate` | `number` | 배속 (1 / 1.25 / 1.5 / 2 순환) | `useState` (드물게 바뀜) |

**상태 전이**:

- 최초 렌더 → `isOpen: false`. 재생 버튼 클릭 → `isOpen: true`, `isPlaying: true`, `currentTime`은 직전에 닫았던 값(없으면 0)부터 재생 시작(FR-004, FR-012).
- 일시정지 클릭 → `isPlaying: false`, `isOpen`은 유지(FR-007).
- 닫기 클릭 → `isOpen: false`. `currentTime`은 리셋하지 않고 컴포넌트가 살아있는 동안 보존(FR-012). `ArticleHeader` 자체가 언마운트되면(다른 게시글 이동/새로고침) 이 값도 함께 소멸한다(spec Assumptions).
- 오디오 종료(`ended` 이벤트) → `isPlaying: false`, `isOpen`은 유지, `currentTime`은 끝 지점에 남는다(spec Assumptions — 자동으로 닫히지 않음).
