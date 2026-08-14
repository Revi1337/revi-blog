"use client"

import * as React from "react"
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, RotateCcw, ZoomIn, ZoomOut, X } from "lucide-react"

import { openMermaidLightbox, type MermaidPanZoomInstance } from "@/lib/mermaid/open-mermaid-lightbox"

const PAN_STEP = 80

/**
 * Mermaid 다이어그램 확대 보기 모달. 기존 이미지 라이트박스(PhotoSwipe 기반,
 * lib/lightbox/open-image-lightbox.ts)의 pan/zoom 엔진은 <img> intrinsic 크기를 전제로 하고
 * 상하좌우 버튼 pan을 지원하지 않아 재사용하지 않는다(research.md 결정) — 배경 스크림/열림·닫힘
 * 느낌만 시각적으로 맞추고, pan/zoom은 svg-pan-zoom에 위임한다.
 */
export function MermaidLightboxModal({
  svgMarkup,
  onClose,
}: {
  svgMarkup: string | null
  onClose: () => void
}) {
  const canvasRef = React.useRef<HTMLDivElement>(null)
  const instanceRef = React.useRef<MermaidPanZoomInstance | null>(null)

  React.useEffect(() => {
    if (!svgMarkup) return

    const svgElement = canvasRef.current?.querySelector("svg")
    if (!svgElement) return

    let cancelled = false
    void openMermaidLightbox(svgElement).then((instance) => {
      if (cancelled) {
        instance.destroy()
        return
      }
      instanceRef.current = instance
    })

    return () => {
      cancelled = true
      instanceRef.current?.destroy()
      instanceRef.current = null
    }
  }, [svgMarkup])

  React.useEffect(() => {
    if (!svgMarkup) return
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKeydown)
    return () => document.removeEventListener("keydown", handleKeydown)
  }, [svgMarkup, onClose])

  if (!svgMarkup) return null

  return (
    <div className="mermaid-lightbox-backdrop" onClick={onClose} role="presentation">
      <div
        className="mermaid-lightbox-panel"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="다이어그램 확대 보기"
      >
        <div ref={canvasRef} className="mermaid-lightbox-canvas" dangerouslySetInnerHTML={{ __html: svgMarkup }} />

        <button type="button" className="mermaid-lightbox-close" aria-label="닫기" onClick={onClose}>
          <X className="mermaid-lightbox-icon" aria-hidden="true" />
        </button>

        <div className="mermaid-lightbox-controls">
          <button
            type="button"
            className="mermaid-lightbox-pan-up"
            aria-label="위로 이동"
            onClick={() => instanceRef.current?.panBy({ x: 0, y: PAN_STEP })}
          >
            <ChevronUp className="mermaid-lightbox-icon" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="mermaid-lightbox-pan-left"
            aria-label="왼쪽으로 이동"
            onClick={() => instanceRef.current?.panBy({ x: PAN_STEP, y: 0 })}
          >
            <ChevronLeft className="mermaid-lightbox-icon" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="mermaid-lightbox-reset"
            aria-label="원래대로"
            onClick={() => instanceRef.current?.reset()}
          >
            <RotateCcw className="mermaid-lightbox-icon" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="mermaid-lightbox-pan-right"
            aria-label="오른쪽으로 이동"
            onClick={() => instanceRef.current?.panBy({ x: -PAN_STEP, y: 0 })}
          >
            <ChevronRight className="mermaid-lightbox-icon" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="mermaid-lightbox-pan-down"
            aria-label="아래로 이동"
            onClick={() => instanceRef.current?.panBy({ x: 0, y: -PAN_STEP })}
          >
            <ChevronDown className="mermaid-lightbox-icon" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="mermaid-lightbox-zoom-out"
            aria-label="축소"
            onClick={() => instanceRef.current?.zoomOut()}
          >
            <ZoomOut className="mermaid-lightbox-icon" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="mermaid-lightbox-zoom-in"
            aria-label="확대"
            onClick={() => instanceRef.current?.zoomIn()}
          >
            <ZoomIn className="mermaid-lightbox-icon" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}
