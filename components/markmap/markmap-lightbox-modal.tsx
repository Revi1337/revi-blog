"use client"

import * as React from "react"
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, RotateCcw, ZoomIn, ZoomOut, X } from "lucide-react"

import { useTheme } from "@/components/theme/theme-context"
import { openMarkmapLightbox, type MarkmapPanZoomInstance } from "@/lib/markmap/open-markmap-lightbox"
import { cn } from "@/lib/utils"

const PAN_STEP = 80

/**
 * Mermaid 다이어그램 확대 보기 모달(mermaid-lightbox-modal.tsx)을 재사용하지 않는다
 * (research.md Decision) — 그 모달은 이미 완성된 SVG 마크업 문자열(`svgMarkup: string`)을
 * clone해서 매번 새로 꽂는 구조인데, Markmap은 "그 자리에서 계속 살아있어야 하는 인스턴스"라
 * clone하면 접기/펼치기 인터랙션(이벤트 리스너)이 사라진다. 대신 원본 Markmap 소스 텍스트를
 * 받아 모달 안에서 markmap-lib+markmap-view로 완전히 독립된 인스턴스를 새로 렌더링한다 —
 * 본문에서 접어둔 가지 상태를 이어받지 않고 항상 전체 펼침으로 시작하는 것은, Mermaid/PlantUML
 * 모달이 항상 정규 상태의 새 렌더링을 보여주는 것과 일관된 동작이다(spec.md Assumptions).
 *
 * 화살표/리셋/줌 버튼의 마크업과 CSS 클래스(`.mermaid-lightbox-*`)는 Mermaid 모달 것을 그대로
 * 재사용한다 — 신규 CSS 없이 픽셀 단위로 동일한 모양을 얻어 spec.md FR-011(UI만으로 다이어그램
 * 종류를 구분할 수 없어야 함)을 만족한다.
 */
export function MarkmapLightboxModal({
  source,
  onClose,
}: {
  source: string | null
  onClose: () => void
}) {
  const { isDark } = useTheme()
  const canvasRef = React.useRef<HTMLDivElement>(null)
  const instanceRef = React.useRef<MarkmapPanZoomInstance | null>(null)

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!source || !canvas) return

    let cancelled = false

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    canvas.appendChild(svg)

    void (async () => {
      const [{ Transformer }, { Markmap }] = await Promise.all([
        import("markmap-lib"),
        import("markmap-view"),
      ])
      if (cancelled) return

      const { root } = new Transformer().transform(source)
      const markmap = Markmap.create(svg, undefined, root)
      instanceRef.current = openMarkmapLightbox(markmap)
    })()

    return () => {
      cancelled = true
      instanceRef.current?.destroy()
      instanceRef.current = null
      svg.remove()
    }
  }, [source])

  React.useEffect(() => {
    if (!source) return
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKeydown)
    return () => document.removeEventListener("keydown", handleKeydown)
  }, [source, onClose])

  if (!source) return null

  return (
    <div className="mermaid-lightbox-backdrop" onClick={onClose} role="presentation">
      <div
        className="mermaid-lightbox-panel"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="마인드맵 확대 보기"
      >
        <div ref={canvasRef} className={cn("mermaid-lightbox-canvas", isDark && "markmap-dark")} />

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
