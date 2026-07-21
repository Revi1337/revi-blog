# Contract: 이미지 라이트박스 통합 지점

이 기능의 "외부 인터페이스"는 API가 아니라 (1) 렌더링 파이프라인이 DOM에 남기는 속성 계약과
(2) 클라이언트 컴포넌트가 PhotoSwipe에 전달하는 고정 옵션/데이터 형태다. 이 두 가지가 어긋나면
클릭 위치와 실제로 열리는 이미지가 맞지 않게 되므로, 아래 계약을 tasks/구현 단계에서 그대로
지켜야 한다.

## 1. DOM ↔ 데이터 매칭 계약

`remark-images`(신규)가 마크다운 렌더링 시점에 부여하는 속성과, `Article.images` 배열은
항상 인덱스 기준으로 1:1 대응해야 한다.

| 항목 | 값 | 비고 |
|---|---|---|
| DOM 속성 | `data-lightbox-index="{order}"` | `article-body` 안의 모든 `<img>`에 부여 (rehype 단계, hProperty) |
| 데이터 배열 | `Article.images[order]` | `order`는 0부터 시작하는 등장 순서 |

**계약 보장 사항**:

1. `article.images[i].src`는 DOM에서 `[data-lightbox-index="${i}"]`로 찾은 `<img>`의 `src`와
   항상 같은 이미지를 가리킨다. 클릭 핸들러는 클릭된 `<img>`의 `data-lightbox-index`를 읽어
   `article.images`에서 같은 인덱스를 조회하기만 하면 되며, DOM을 순회해 이미지를 다시 세지
   않는다.
2. 본문에 이미지가 없는 게시글은 `article.images`가 빈 배열이며, `ImageLightboxHandler`는
   이 경우 클릭 리스너 등록 자체를 건너뛴다(spec Edge Case: 이미지 없는 게시글은 기능이
   발동하지 않음).

## 2. 본문 이미지 클릭 → PhotoSwipe 오픈 계약

`ImageLightboxHandler`(신규, `components/article/image-lightbox-handler.tsx`)는
`CodeCopyHandler`와 동일하게 페이지당 document 레벨 클릭 리스너 1개만 등록한다.

```text
클릭 대상: event.target.closest('[data-lightbox-index]')
조건: closest("[data-lightbox-index]") 가 null이 아니고, images.length > 0
동작:
  1. const index = Number(target.dataset.lightboxIndex)
  2. images.map(img => {
       const el = document.querySelector(`[data-lightbox-index="${img.order}"]`)
       return { src: img.src, alt: img.alt, width: el?.naturalWidth ?? 0, height: el?.naturalHeight ?? 0 }
     }) 로 dataSource 구성 — naturalWidth/naturalHeight가 필요한 이유는 research.md #4 참조
  3. openImageLightbox({ dataSource, index }) 호출 → 내부에서 PhotoSwipe/lightbox 동적 import
     (아직 로드되지 않았다면) 후 loadAndOpen 실행
```

- **갤러리 범위**: `dataSource`는 오직 본문 이미지(`images` prop)로만 구성한다. 썸네일은
  포함하지 않는다(spec FR-014, research.md #2).
- **이전/다음 경계**: 별도 커스텀 로직 없이 PhotoSwipe의 `loop: false` 옵션으로 처리한다 —
  마지막 이미지에서 "다음"은 비활성화되고 첫 이미지에서 "이전"은 비활성화된다(spec FR-012).
- **RSC 경계 최소화**: 클라이언트 컴포넌트에는 `Article` 전체가 아니라 `images: ArticleImage[]`
  만 prop으로 전달한다(server-serialization) — 상세는 plan.md/tasks.md 참조.

## 3. 썸네일 클릭 → PhotoSwipe 오픈 계약

`ArticleHeader`가 아니라 신규 클라이언트 컴포넌트 `ArticleThumbnail`
(`components/article/article-thumbnail.tsx`)로 분리해 `onClick`을 추가한다 — `article` 전체가
아니라 `src` 문자열 하나만 prop으로 받아 RSC 경계 직렬화를 최소화한다(server-serialization).

```text
클릭 대상: 썸네일 이미지를 감싸는 motion.div (ArticleThumbnail 내부)
동작:
  1. event.currentTarget에서 실제 <img> 엘리먼트를 찾아 naturalWidth/naturalHeight를 읽는다
  2. dataSource = [{ src, alt: "", width, height }]  // 단일 항목
  3. openImageLightbox({ dataSource, index: 0 }) 호출
```

- 본문 갤러리와 별도의 PhotoSwipe `dataSource`/갤러리 인스턴스이므로 이전/다음 탐색 UI는
  표시하지 않는다(spec FR-014).

## 4. PhotoSwipe 공통 옵션 계약 (두 진입점이 공유)

| 옵션 | 값 | 대응 요구사항 |
|---|---|---|
| `bgOpacity` | 기존 기본값 유지 + `.pswp__bg`에 `backdrop-filter: blur()` 커스텀 CSS | FR-004 |
| `paddingFn` | 뷰포트 대비 여백을 반환하는 함수 (뷰포트 전체를 채우지 않도록) | FR-003, SC-004 |
| `showHideAnimationType` | `'zoom'` (PhotoSwipe 내장 트랜지션) | FR-005 |
| `initialZoomLevel` / `secondaryZoomLevel` / `maxZoomLevel` | 프로젝트 커스텀 값으로 상/하한 설정 | FR-007 |
| `loop` | `false` | FR-012 (경계에서 탐색 비활성화) |
| 커스텀 UI 엘리먼트 | `+`/`-` 확대·축소 버튼, 위치 인디케이터("N / M") | FR-006, FR-013 |
| 닫기 방법 | PhotoSwipe 기본 제공(닫기 버튼, 배경 클릭, ESC) 그대로 사용 | FR-008 |
| 배율 초기화 | PhotoSwipe 기본 동작 — 모달을 닫으면 다음에 열 때 `initialZoomLevel`로 리셋됨 | FR-009 |

## 5. 실패 계약

- 이미지 로드가 실패해도(`src` 깨짐) `ImageLightboxHandler`/`ArticleHeader`의 클릭 핸들러는
  예외를 던지지 않는다 — PhotoSwipe는 개별 슬라이드의 로드 실패를 자체적으로 표시하며, 클릭한
  이미지 자체가 깨진 경우에 대한 별도 방어 로직(사전 검증, 재시도)은 두지 않는다
  (spec Assumptions).
