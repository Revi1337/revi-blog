/**
 * 확대 버튼 클릭(모달이 열리는) 시점에만 svg-pan-zoom을 동적 import해 대상 SVG에 인스턴스를
 * 초기화한다. lib/lightbox/open-image-lightbox.ts와 동일한 역할 분담 — "실제 라이브러리
 * 초기화는 lib/의 open 함수가" 담당한다(research.md, contracts/mermaid-rendering-contract.md #4).
 *
 * PhotoSwipe의 zoomTo 등 자체 API를 대신 GitHub이 실제 쓰는 svg-pan-zoom을 쓰는 이유는
 * research.md "확대 보기" Decision 참고 — 임의 크기 SVG + 버튼 기반 이산적 pan/zoom/reset을
 * 위해 만들어진 라이브러리라 요구사항의 6개 버튼에 공개 API가 1:1로 대응한다.
 */
export async function openMermaidLightbox(svgElement: SVGSVGElement) {
  const { default: svgPanZoom } = await import("svg-pan-zoom")

  return svgPanZoom(svgElement, {
    zoomEnabled: true,
    panEnabled: true,
    controlIconsEnabled: false, // 라이브러리 기본 컨트롤 대신 mermaid-lightbox-modal.tsx의 버튼 UI를 쓴다
    dblClickZoomEnabled: true,
    mouseWheelZoomEnabled: true,
    fit: true,
    center: true,
    minZoom: 0.5,
    maxZoom: 10,
  })
}

export type MermaidPanZoomInstance = Awaited<ReturnType<typeof openMermaidLightbox>>
