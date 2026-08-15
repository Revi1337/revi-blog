"use client"

import * as React from "react"

import { useTheme } from "@/components/theme/theme-context"
import { MermaidLightboxModal } from "@/components/mermaid/mermaid-lightbox-modal"
import { animateDiagramReveal } from "@/lib/diagram/animate-reveal"

type Mermaid = typeof import("mermaid")["default"]

/** lucide-react의 maximize-2 아이콘을 정적 SVG로 재현 — 이 버튼은 dangerouslySetInnerHTML로
 * 렌더링된 article-body DOM 안에 vanilla DOM API로 직접 삽입되므로(renderBlock), React 컴포넌트를
 * 못 쓴다(rehype-code-copy-button.ts와 동일한 이유). */
const EXPAND_ICON_HTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mermaid-expand-icon" aria-hidden="true"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>`

/** article-body는 dangerouslySetInnerHTML로 렌더링되는 정적 HTML이라 ```mermaid 코드블록마다
 * React 핸들러를 붙일 수 없다. CodeCopyHandler/ImageLightboxHandler와 동일하게, 마운트 시(및
 * 테마 전환 시) DOM을 훑어 mermaid를 동적 import해 그 자리에서 SVG로 치환한다. 원본 pre는
 * 삭제하지 않고 숨기기만 해서 기존 코드 복사 버튼(rehype-code-copy-button.ts, CodeCopyHandler)이
 * 계속 원본 텍스트를 읽을 수 있게 유지한다(contracts/mermaid-rendering-contract.md #2). */
export function MermaidDiagramHandler() {
  const { isDark } = useTheme()
  const [lightboxSvg, setLightboxSvg] = React.useState<string | null>(null)

  React.useEffect(() => {
    const blocks = document.querySelectorAll<HTMLPreElement>('pre[data-language="mermaid"]')
    if (blocks.length === 0) return

    let cancelled = false

    void (async () => {
      const { default: mermaid } = await import("mermaid")
      if (cancelled) return

      // Mermaid 기본 테마는 엣지 라벨(예: "Yes"/"No")마다 회색 배경 박스(edgeLabelBackground)를
      // 깔아 선과 겹침을 방지하는데, 이 색이 사이트 배경과 어긋나 텍스트가 하이라이트/선택된
      // 것처럼 보인다. 라벨 배경을 투명으로 지정해 텍스트만 보이게 한다.
      mermaid.initialize({
        startOnLoad: false,
        theme: isDark ? "dark" : "default",
        themeVariables: { edgeLabelBackground: "transparent" },
      })

      for (const pre of Array.from(blocks)) {
        // 이전 렌더에서 이미 문법 오류로 판정된 블록은 테마가 바뀌어도 다시 시도하지 않는다 —
        // 소스가 그대로인 한 결과도 항상 실패이므로 불필요한 재시도를 피한다(data-model.md).
        if (pre.dataset.mermaidError === "true") continue
        await renderBlock(mermaid, pre)
        if (cancelled) return
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isDark])

  // 확대 버튼 클릭 위임 — CodeCopyHandler/ImageLightboxHandler와 동일하게 document 레벨 리스너
  // 하나로 모든 다이어그램의 확대 버튼을 처리한다(client-event-listeners).
  React.useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return

      const button = target.closest<HTMLButtonElement>("[data-mermaid-expand-button]")
      if (!button) return

      const container = button.closest("[data-rehype-pretty-code-figure]")?.querySelector<HTMLElement>(
        "[data-mermaid-diagram]"
      )
      const svgElement = container?.querySelector("svg")
      if (!svgElement) return

      setLightboxSvg(buildLightboxSvgMarkup(svgElement))
    }

    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [])

  return <MermaidLightboxModal svgMarkup={lightboxSvg} onClose={() => setLightboxSvg(null)} />
}

/** mermaid.render()가 본문 폭에 맞춰 SVG에 직접 굽는 `style="max-width: ...px"`(및 `width="100%"`
 * 단독 지정으로 인한 작은 렌더 크기)는 본문 안에서는 의도한 동작이지만, 확대 보기 모달 안에서는
 * 캔버스 전체를 못 채우고 왼쪽 위에 작게 눌러붙는 원인이 된다. 원본 DOM은 그대로 두고 복제본에서만
 * 그 제약을 지워, svg-pan-zoom이 모달 캔버스 전체 크기를 기준으로 fit/center를 계산하게 한다. */
function buildLightboxSvgMarkup(svgElement: SVGSVGElement): string {
  const clone = svgElement.cloneNode(true) as SVGSVGElement
  clone.removeAttribute("style")
  clone.setAttribute("width", "100%")
  clone.setAttribute("height", "100%")
  return clone.outerHTML
}

async function renderBlock(mermaid: Mermaid, pre: HTMLPreElement) {
  const figure = pre.closest<HTMLElement>("[data-rehype-pretty-code-figure]")
  if (!figure) return

  const source = pre.textContent ?? ""
  const container =
    figure.querySelector<HTMLElement>("[data-mermaid-diagram]") ?? document.createElement("div")

  try {
    // mermaid.render()는 내부적으로 이 id를 가진 임시 DOM 노드를 만들었다 지우므로, 같은 페이지에
    // 다이어그램이 여럿이거나 테마 전환으로 재렌더링될 때 충돌하지 않도록 매 호출마다 새 id를 쓴다.
    const { svg } = await mermaid.render(`mermaid-${crypto.randomUUID()}`, source)
    container.dataset.mermaidDiagram = ""
    container.dataset.mermaidSource = source
    container.innerHTML = svg
    // 테마 전환 시 재렌더링에서는(이미 연결된 컨테이너 재사용) 등장 연출을 다시 재생하지 않는다 —
    // 최초 삽입 때만 macOS 콘텐츠 영역이 펼쳐지는 게 자연스럽고, 토글마다 매번 펼쳐지면 산만하다.
    const isFirstInsert = !container.isConnected
    if (isFirstInsert) figure.insertBefore(container, pre)
    pre.style.display = "none"
    if (isFirstInsert) animateDiagramReveal(container)
    ensureExpandButton(figure)
  } catch {
    container.remove()
    // 기본 상태는 article-body.css가 pre[data-language="mermaid"]를 display:none으로 숨겨둔다
    // (첫 페인트 시 원본 코드가 잠깐 보였다 사라지는 깜빡임 방지) — 렌더링이 실패하면 그 기본값을
    // "block"으로 명시적으로 덮어써야 원본이 다시 보인다("" 로는 CSS 규칙이 그대로 이겨 계속
    // 숨겨진 채로 남는다).
    pre.style.display = "block"
    pre.dataset.mermaidError = "true"
    figure.querySelector("[data-mermaid-expand-button]")?.remove()
  }
}

function ensureExpandButton(figure: HTMLElement) {
  if (figure.querySelector("[data-mermaid-expand-button]")) return

  const button = document.createElement("button")
  button.type = "button"
  button.dataset.mermaidExpandButton = ""
  button.className = "mermaid-expand-button"
  button.setAttribute("aria-label", "다이어그램 확대")
  button.innerHTML = EXPAND_ICON_HTML
  figure.appendChild(button)
}
