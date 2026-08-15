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
    destroy: () => {
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
