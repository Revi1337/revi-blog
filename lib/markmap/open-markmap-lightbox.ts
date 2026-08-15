import type { Markmap } from "markmap-view"

/**
 * open-mermaid-lightbox.ts와 달리 SVG 엘리먼트를 받아 pan/zoom 라이브러리를 새로 초기화하지
 * 않는다 — Markmap은 이미 살아있는 인스턴스 자체가 pan/zoom 엔진(d3-zoom)을 갖고 있으므로
 * (contracts/markmap-rendering-contract.md #3), 이 함수는 그 기존 인스턴스를 감싸 Mermaid
 * 모달과 동일한 버튼 API(panBy/reset/zoomIn/zoomOut/destroy)로 노출하기만 한다. 같은 SVG에
 * svg-pan-zoom을 추가로 얹으면 markmap-view가 이미 붙인 d3-zoom과 포인터 이벤트가 충돌하므로
 * 이 방식은 필수다(research.md Decision).
 */
export function openMarkmapLightbox(instance: Markmap): MarkmapPanZoomInstance {
  const selection = instance.svg

  return {
    panBy: ({ x, y }: { x: number; y: number }) => {
      selection.transition().duration(200).call(instance.zoom.translateBy, x, y)
    },
    zoomIn: () => {
      selection.transition().duration(200).call(instance.zoom.scaleBy, 1.25)
    },
    zoomOut: () => {
      selection.transition().duration(200).call(instance.zoom.scaleBy, 1 / 1.25)
    },
    // markmap-view의 fit()은 콘텐츠를 뷰포트에 맞춰 재중심·재조정한다 — Markmap.create()가
    // 최초 렌더 직후 호출하는 것과 동일한 연산이라(node_modules 실측), "최초 상태로 되돌리기"
    // 의미의 리셋으로 그대로 쓸 수 있다.
    reset: () => {
      void instance.fit()
    },
    // d3-zoom의 transition 기반 API(zoom.transform 등)는 d3-timer 큐에 예약되어 다음 tick에
    // 실행된다 — panBy/zoomIn/zoomOut/reset 클릭 직후 곧바로 destroy()가 불려도(모달 닫기 +
    // 페이지 이동 등) 예약된 tick은 취소되지 않고 나중에 그대로 실행되는데, 그 시점에 SVG가 이미
    // DOM에서 분리되어 있으면 d3-zoom이 gesture의 extent를 구하려고 SVG의 width 속성(백분율
    // SVGLength)을 읽다가 `NotSupportedError: Could not resolve relative length`를 던진다(실사용
    // 중 발견 — playwright로 재현). `svg.interrupt()`로 예약/진행 중인 transition을 먼저
    // 취소해야 이 예약된 콜백 자체가 실행되지 않는다.
    destroy: () => {
      instance.svg.interrupt()
      instance.destroy()
    },
  }
}

export interface MarkmapPanZoomInstance {
  panBy: (delta: { x: number; y: number }) => void
  zoomIn: () => void
  zoomOut: () => void
  reset: () => void
  destroy: () => void
}
