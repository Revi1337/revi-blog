# Phase 1 Data Model: 게시글 이미지 라이트박스 모달

이 기능은 서버/DB 상태를 도입하지 않는다. 유일한 데이터 변화는 마크다운 렌더링 파이프라인이
빌드/로드 시점에 파생시키는 `Article.images` 목록이며, 나머지는 PhotoSwipe 인스턴스가 내부적으로
관리하는 런타임 UI 상태다.

## 엔티티

### ArticleImage (신규)

본문에 등장하는 이미지 한 장을 나타내며, `remark-images` 플러그인(research.md #3)이 마크다운
렌더링 시점에 mdast `image` 노드를 순회해 생성한다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `src` | `string` | 이미지 원본 경로/URL (mdast `image` 노드의 `url`) |
| `alt` | `string` | 대체 텍스트 (mdast `image` 노드의 `alt`, 없으면 빈 문자열) |
| `order` | `number` | 본문 내 등장 순서(0부터 시작) — PhotoSwipe `dataSource` 배열의 인덱스와 동일 |

- **관계**: `Article.images: ArticleImage[]` — 게시글 1개당 0개 이상의 이미지를 가진다.
- **불변식**: `order`는 배열 인덱스와 항상 일치한다(정렬 없이 등장 순서 그대로 저장). 렌더링된
  본문 HTML 안의 각 `<img>`에는 `remark-images`가 부여한 `data-lightbox-index="{order}"`가
  붙어 있어, 클라이언트 클릭 핸들러가 DOM에서 곧바로 배열 인덱스를 읽을 수 있다(추측/재계산 없음).
- **너비/높이**: 마크다운 이미지 문법(`![alt](src)`)은 명시적 치수를 포함하지 않으므로
  `ArticleImage`(빌드 타임 데이터) 자체에는 `width`/`height`를 포함하지 않는다. **구현 중 수정
  (research.md #4 갱신 참조)**: 애초 "PhotoSwipe는 치수 정보 없이도 동작하는 동적 크기 모드를
  지원한다"고 가정했으나, 실제로는 `w`/`h`가 없으면 콘텐츠 크기를 0으로 간주해 여백 없이
  뷰포트 전체를 채워버리는 것이 실측으로 확인되었다(FR-003 위반). 이미지 파일을 다시 읽어
  치수를 계산하는 빌드 타임 처리를 추가하는 대신, 본문 `<img>`가 이미 페이지에 렌더링되어
  있다는 점을 이용해 **클릭 시점에 DOM의 `naturalWidth`/`naturalHeight`를 읽어 런타임에
  채워 넣는다**(`components/article/image-lightbox-handler.tsx`,
  `components/article/article-thumbnail.tsx`). `ArticleImage` 엔티티 자체는 여전히
  `width`/`height`를 갖지 않고, PhotoSwipe에 전달하는 직전 단계에서만 `width`/`height`가
  채워진 `LightboxImage`(`lib/lightbox/open-image-lightbox.ts`)로 변환된다.
  **2차 수정**: 위 방식을 썸네일에도 그대로 적용했더니(렌더링된 `<img>`의 naturalWidth 읽기),
  실사용 이미지로 테스트하는 과정에서 모달이 원본보다 훨씬 작게 뜨는 문제가 발견되었다 — 원인은
  썸네일이 `next/image`로 렌더링되어 있어 그 `<img>`가 가리키는 실제 파일이 헤더 박스 크기에
  맞춰 최적화된(원본보다 작은) 버전이었기 때문이다(예: 원본 1200×800 사진이 540×360으로
  서빙됨). 본문 이미지는 마크다운이 그대로 출력한 순수 `<img>`라 이 문제가 없지만, 썸네일은
  `next/image`를 거치므로 다르게 처리해야 한다 — `ArticleThumbnail`은 클릭 시 렌더링된
  `<img>`를 읽는 대신 `loadImageNaturalSize(src)`로 원본 경로를 새 `Image`로 다시 로드해 진짜
  치수를 구하도록 수정했다(`lib/lightbox/open-image-lightbox.ts`).

### Article (기존 타입 확장)

`lib/data/types.ts`의 기존 `Article` 인터페이스에 `images: ArticleImage[]` 필드를 추가한다.
그 외 필드(`bodyHtml`, `thumbnail`, `toc` 등)는 변경하지 않는다.

## 이 앱 내부 상태 (UI 파생 값 — 신규 React state 없음)

- **모달 열림/닫힘, 현재 인덱스, 확대 배율**: 전부 PhotoSwipe 인스턴스가 자체적으로 관리한다.
  `ImageLightboxHandler`는 클릭 이벤트를 받아 `lightbox.loadAndOpen(index, { dataSource })`를
  호출할 뿐, 이 값들을 React state로 복제해 들고 있지 않는다(research.md #7 —
  `rerender-use-ref-transient-values` 원칙과 일치, PhotoSwipe와 React state가 어긋날 위험 제거).
- **썸네일 단일 이미지 뷰어**: `ArticleHeader`의 `onClick`이 `article.thumbnail`(또는
  `DEFAULT_THUMBNAIL`) 하나만 담은 별도 `dataSource`로 PhotoSwipe를 연다. `Article.images`와
  합쳐지지 않는다(spec FR-014).

## 결론

`ArticleImage`는 마크다운 렌더링 파이프라인의 파생 데이터일 뿐 별도 스키마·마이그레이션이
필요 없다. 런타임 UI 상태(열림 여부, 현재 인덱스, 배율)는 전부 PhotoSwipe가 소유하므로 이
기능은 새로운 전역/컴포넌트 상태 관리를 추가하지 않는다.
