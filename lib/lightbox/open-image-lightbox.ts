import type PhotoSwipeCore from "photoswipe"
import type PhotoSwipeLightbox from "photoswipe/lightbox"
import type { Point } from "photoswipe"

export interface LightboxImage {
  src: string
  alt: string
  /** PhotoSwipe는 이미지 로드 후 자연 크기를 자동으로 읽지 않고, 확대/축소 배율(zoomLevels)과
   * 초기 표시 크기(FR-003, FR-007)를 이 값으로 미리 계산한다 — 없으면 크기를 알 수 없는
   * 콘텐츠로 취급해 여백 없이 뷰포트를 그대로 채워버린다. 본문 이미지(image-lightbox-handler.tsx)는
   * 이미 렌더링된 순수 <img>의 naturalWidth/naturalHeight를 그대로 읽어 전달한다. 썸네일은
   * `next/image`가 헤더 박스 크기에 맞춰 원본보다 훨씬 작게 최적화한 이미지를 렌더링하므로, 그
   * <img>의 naturalWidth/naturalHeight를 읽으면 원본보다 작은 값이 나온다 — 대신
   * `loadImageNaturalSize`로 원본 파일을 직접 로드해 진짜 치수를 구한다 */
  width: number
  height: number
}

/** naturalWidth/naturalHeight를 아직 읽을 수 없을 때(로드 전 클릭 등)의 안전한 기본값 */
const FALLBACK_WIDTH = 1600
const FALLBACK_HEIGHT = 900

/**
 * 주어진 src의 원본 파일을 직접 로드해 진짜 naturalWidth/naturalHeight를 구한다. `next/image`가
 * 렌더링한 `<img>`는 표시 박스에 맞춰 최적화된(원본보다 작은) 버전을 가리키므로, 그 DOM
 * 엘리먼트의 naturalWidth를 읽으면 원본보다 작은 값이 나온다(실제 브라우저 검증 중 발견 —
 * ArticleThumbnail 참조). 이 함수는 최적화 엔드포인트를 거치지 않는 원본 경로를 새 Image로
 * 다시 로드해 정확한 치수를 얻는다.
 */
export function loadImageNaturalSize(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new window.Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => resolve({ width: 0, height: 0 })
    img.src = src
  })
}

type LightboxWithCore = PhotoSwipeLightbox & { pswp?: PhotoSwipeCore }

const ZOOM_STEP = 1.5
const ZOOM_ANIMATION_DURATION = 250

/* class="pswp__icn"이 있어야 버튼 안 위치(top/left/32x32)가 적용된다. 사이트 전역에서 이미
   쓰는 lucide 아이콘과 같은 스타일(얇은 stroke, 둥근 선끝)로 맞추고, 색은 PhotoSwipe의
   --pswp-icon-color(흰색) CSS 변수를 stroke에 직접 참조한다 — .pswp__icn의 fill/color 상속에
   기대면 currentColor가 --pswp-icon-color-secondary(어두운 회색)로 풀려 어두운 스크림 위에서
   아이콘이 거의 안 보이는 문제가 실제 브라우저 검증 중 발견되었다 */
const ZOOM_IN_ICON =
  '<svg viewBox="0 0 24 24" class="pswp__icn" fill="none" aria-hidden="true"><path d="M5 12h14M12 5v14" stroke="var(--pswp-icon-color)" stroke-width="2" stroke-linecap="round"/></svg>'
const ZOOM_OUT_ICON =
  '<svg viewBox="0 0 24 24" class="pswp__icn" fill="none" aria-hidden="true"><path d="M5 12h14" stroke="var(--pswp-icon-color)" stroke-width="2" stroke-linecap="round"/></svg>'

/** 배율 상/하한(FR-007)은 PhotoSwipe가 이미지 크기 기준으로 계산하는 zoomLevels.min/max로 위임한다 */
function zoomBy(pswp: PhotoSwipeCore, factor: number) {
  const slide = pswp.currSlide
  if (!slide) return

  const { min, max } = slide.zoomLevels
  const next = Math.min(max, Math.max(min, slide.currZoomLevel * factor))
  pswp.zoomTo(next, undefined, ZOOM_ANIMATION_DURATION)
}

/** 뷰포트 전체를 채우지 않도록 여백을 남긴다(FR-003) — 모바일은 여백을 좁게, 데스크톱은 넓게 */
function paddingFn(viewportSize: Point) {
  const isCompact = viewportSize.x < 640
  const ratio = isCompact ? 0.04 : 0.08
  const vertical = Math.round(viewportSize.y * ratio)
  const horizontal = Math.round(viewportSize.x * ratio)
  return { top: vertical, bottom: vertical, left: horizontal, right: horizontal }
}

function registerZoomButtons(lightbox: LightboxWithCore) {
  const pswp = lightbox.pswp
  if (!pswp?.ui) return

  /* PhotoSwipe 기본 줌 토글(돋보기) 버튼의 order는 10 — +/-는 같은 계열(단계별 확대·축소)이라
     서로 붙여두고, 성격이 다른 돋보기 버튼보다 앞에 오도록 둘 다 9보다 작게 잡는다. 값이 같으면
     Array.sort는 안정 정렬이라 등록 순서(+ 먼저, - 나중)가 그대로 유지된다 */
  pswp.ui.registerElement({
    name: "zoom-in-button",
    ariaLabel: "Zoom in",
    order: 8,
    isButton: true,
    className: "pswp__button--zoom-in",
    html: ZOOM_IN_ICON,
    onClick: (_event, _element, instance) => zoomBy(instance, ZOOM_STEP),
  })

  pswp.ui.registerElement({
    name: "zoom-out-button",
    ariaLabel: "Zoom out",
    order: 8,
    isButton: true,
    className: "pswp__button--zoom-out",
    html: ZOOM_OUT_ICON,
    onClick: (_event, _element, instance) => zoomBy(instance, 1 / ZOOM_STEP),
  })
}

/**
 * 본문 이미지 클릭 핸들러(components/article/image-lightbox-handler.tsx)와 썸네일 클릭 핸들러
 * (components/article/article-header.tsx)가 공유하는 PhotoSwipe 오픈 로직. PhotoSwipe/lightbox는
 * 이 함수가 호출되는 시점(클릭 시)에만 동적 import되어 초기 번들에 포함되지 않는다
 * (research.md #8, bundle-dynamic-imports).
 */
export async function openImageLightbox({
  dataSource,
  index,
}: {
  dataSource: LightboxImage[]
  index: number
}) {
  const [{ default: PhotoSwipeLightboxCtor }] = await Promise.all([
    import("photoswipe/lightbox"),
    import("photoswipe/style.css"),
  ])

  const preparedDataSource = dataSource.map((image) => ({
    src: image.src,
    alt: image.alt,
    w: image.width || FALLBACK_WIDTH,
    h: image.height || FALLBACK_HEIGHT,
  }))

  const lightbox: LightboxWithCore = new PhotoSwipeLightboxCtor({
    dataSource: preparedDataSource,
    index,
    pswpModule: () => import("photoswipe"),
    bgOpacity: 0.4,
    paddingFn,
    showHideAnimationType: "zoom",
    loop: false,
    initialZoomLevel: "fit",
    secondaryZoomLevel: 1,
    maxZoomLevel: 2,
  })

  lightbox.on("uiRegister", () => registerZoomButtons(lightbox))

  lightbox.init()
  lightbox.loadAndOpen(index)
}
