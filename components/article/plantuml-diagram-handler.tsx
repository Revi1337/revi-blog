"use client"

import * as React from "react"

import { useTheme } from "@/components/theme/theme-context"
import { MermaidLightboxModal } from "@/components/mermaid/mermaid-lightbox-modal"
import { PLANTUML_LIGHT_BORDER, PLANTUML_DARK_BORDER } from "@/lib/content/plantuml-colors"

const PLANTUML_SERVER_BASE = "https://www.plantuml.com/plantuml/svg"

/** lucide-react의 maximize-2 아이콘을 정적 SVG로 재현 — mermaid-diagram-handler.tsx와 동일한
 * 이유로 vanilla DOM API를 쓴다. 클래스명(mermaid-expand-button 등)도 그대로 재사용해 별도
 * CSS 없이 Mermaid 다이어그램과 픽셀 단위로 동일한 확대 버튼을 얻는다(research.md — 확대 보기
 * 재사용 Decision, FR-007). */
const EXPAND_ICON_HTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mermaid-expand-icon" aria-hidden="true"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>`

/** article-body는 dangerouslySetInnerHTML로 렌더링되는 정적 HTML이라 ```plantuml 코드블록마다
 * React 핸들러를 붙일 수 없다. mermaid-diagram-handler.tsx와 동일하게, 마운트 시(및 테마 전환
 * 시) DOM을 훑어 rehype-plantuml.ts가 빌드 타임에 미리 인코딩해둔 값(다크/라이트 각각 다른
 * skinparam이 이미 섞여 있음)으로 PlantUML 공개 서버에 fetch해 SVG로 치환한다. PlantUML
 * 공개 서버는 Mermaid의 `theme` 옵션 같은 파라미터가 없어 소스 자체에 `!theme`/`skinparam`을
 * 섞어 보내는 방식으로 다크 모드 대비를 확보한다(research.md "다크/라이트 테마 반영 방식" —
 * 최초에는 컨테이너를 고정 라이트 카드로 감싸는 방식이었으나, 이게 Mermaid와 달리 macOS
 * 창 프레임 안에 사진이 하나 더 얹힌 것처럼 보인다는 지적을 받고 이 방식으로 교체). 원본 pre는
 * 삭제하지 않고 숨기기만 해서 기존 코드 복사 버튼이 계속 원본 텍스트를 읽을 수 있게 유지한다
 * (contracts/plantuml-rendering-contract.md #4). */
export function PlantumlDiagramHandler() {
  const { isDark } = useTheme()
  const [lightboxSvg, setLightboxSvg] = React.useState<string | null>(null)

  React.useEffect(() => {
    const blocks = document.querySelectorAll<HTMLPreElement>('pre[data-language="plantuml"]')
    if (blocks.length === 0) return

    const cancelledRef = { current: false }

    // 블록마다 fetch가 서로 독립적이므로(공유 렌더 상태에 의존하는 mermaid.render()와 달리)
    // 순차 await 대신 Promise.all로 병렬 요청한다 — 다이어그램이 여럿인 페이지에서 불필요한
    // 워터폴을 만들지 않는다(vercel-react-best-practices의 async-parallel).
    void Promise.all(Array.from(blocks).map((pre) => renderBlock(pre, isDark, cancelledRef)))

    return () => {
      cancelledRef.current = true
    }
  }, [isDark])

  // 확대 버튼 클릭 위임 — mermaid-diagram-handler.tsx와 동일하게 document 레벨 리스너 하나로
  // 모든 다이어그램의 확대 버튼을 처리한다.
  React.useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return

      const button = target.closest<HTMLButtonElement>("[data-plantuml-expand-button]")
      if (!button) return

      const container = button
        .closest("[data-rehype-pretty-code-figure]")
        ?.querySelector<HTMLElement>("[data-plantuml-diagram]")
      const svgElement = container?.querySelector("svg")
      if (!svgElement) return

      setLightboxSvg(buildLightboxSvgMarkup(svgElement))
    }

    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [])

  // 신규 컴포넌트를 만들지 않고 Mermaid가 쓰는 라이트박스를 그대로 재사용한다 — 두 다이어그램
  // 타입 모두 최종적으로 인라인 <svg> DOM 노드를 갖게 되므로 재사용이 성립한다(research.md).
  return <MermaidLightboxModal svgMarkup={lightboxSvg} onClose={() => setLightboxSvg(null)} />
}

function buildLightboxSvgMarkup(svgElement: SVGSVGElement): string {
  const clone = svgElement.cloneNode(true) as SVGSVGElement
  clone.removeAttribute("style")
  clone.setAttribute("width", "100%")
  clone.setAttribute("height", "100%")
  return clone.outerHTML
}

/** PlantUML 서버는 렌더링 실패 시에도 HTTP 200 + image/svg+xml을 반환하므로 상태 코드만으로는
 * 판별할 수 없다. 응답 루트 <svg>에 data-diagram-type 속성이 있는지로 판별한다 — 실측 결과
 * 이 속성은 PlantUML이 요청을 다이어그램으로 인식했을 때만 존재한다
 * (research.md "렌더링 실패 판별 기준", contracts/plantuml-rendering-contract.md #3).
 *
 * 다크/라이트는 rehype-plantuml.ts가 미리 인코딩해둔 서로 다른 값(스킨이 다르므로 소스 자체가
 * 다름)을 쓰므로, 테마가 바뀔 때마다 재요청한다 — Mermaid처럼 "이미 성공한 블록은 건너뛴다"는
 * 캐싱을 하지 않는다. 실패도 테마마다 다시 시도한다(같은 스킨 안에서 재시도하는 게 아니라 아예
 * 다른 요청이므로 Mermaid의 "재시도 안 함" 정책과 모순되지 않음). */
async function renderBlock(pre: HTMLPreElement, isDark: boolean, cancelledRef: { current: boolean }) {
  const figure = pre.closest<HTMLElement>("[data-rehype-pretty-code-figure]")
  const encoded = isDark ? pre.dataset.plantumlEncodedDark : pre.dataset.plantumlEncodedLight
  if (!figure || !encoded) return

  const container =
    figure.querySelector<HTMLElement>("[data-plantuml-diagram]") ?? document.createElement("div")

  try {
    const response = await fetch(`${PLANTUML_SERVER_BASE}/${encoded}`)
    const contentType = response.headers.get("content-type") ?? ""
    if (!response.ok || !contentType.includes("image/svg+xml")) {
      throw new Error(`PlantUML server responded ${response.status} ${contentType}`)
    }

    const svgText = await response.text()
    const svgRoot = new DOMParser().parseFromString(svgText, "image/svg+xml").documentElement
    if (svgRoot.tagName !== "svg" || !svgRoot.hasAttribute("data-diagram-type")) {
      throw new Error("PlantUML server did not recognize the diagram")
    }
    patchHardcodedDarkColor(svgRoot, isDark ? PLANTUML_DARK_BORDER : PLANTUML_LIGHT_BORDER)

    if (cancelledRef.current) return
    container.dataset.plantumlDiagram = ""
    container.innerHTML = svgRoot.outerHTML
    if (!container.isConnected) figure.insertBefore(container, pre)
    pre.style.display = "none"
    ensureExpandButton(figure)
  } catch {
    container.remove()
    pre.style.display = ""
    pre.dataset.plantumlError = "true"
    figure.querySelector("[data-plantuml-expand-button]")?.remove()
  }
}

/** 상태 다이어그램 종료(◎) 표시의 안쪽 작은 점은 어떤 skinparam 조합으로도 닿지 않는 PlantUML
 * 엔진 하드코딩 색 `#222`로 나온다(rehype-plantuml.ts 실측 기록). 서버에 보내는 텍스트로는
 * 고칠 수 없으니, 받은 SVG를 DOM으로 파싱한 김에 남은 `#222`만 골라 우리 테두리색으로 바꾼다 —
 * `fill="#222"` 속성과 `style="...stroke:#222..."` 인라인 스타일 둘 다 대상. 이 스킨에서
 * `#222`는 이 하드코딩된 경우 외에는 등장하지 않으므로(실측 확인) 다른 요소를 잘못 건드릴
 * 위험이 없다. */
function patchHardcodedDarkColor(svgRoot: Element, border: string) {
  svgRoot.querySelectorAll('[fill="#222"]').forEach((el) => el.setAttribute("fill", border))
  svgRoot.querySelectorAll('[style*="#222"]').forEach((el) => {
    const style = el.getAttribute("style")
    if (style) el.setAttribute("style", style.replaceAll("#222", border))
  })
}

function ensureExpandButton(figure: HTMLElement) {
  if (figure.querySelector("[data-plantuml-expand-button]")) return

  const button = document.createElement("button")
  button.type = "button"
  button.dataset.plantumlExpandButton = ""
  button.className = "mermaid-expand-button"
  button.setAttribute("aria-label", "다이어그램 확대")
  button.innerHTML = EXPAND_ICON_HTML
  figure.appendChild(button)
}
