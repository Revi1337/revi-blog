"use client"

import * as React from "react"

import { useTheme } from "@/components/theme/theme-context"
import { MermaidLightboxModal } from "@/components/mermaid/mermaid-lightbox-modal"
import { PLANTUML_LIGHT_BORDER, PLANTUML_DARK_BORDER } from "@/lib/content/plantuml-colors"
import { animateDiagramReveal } from "@/lib/diagram/animate-reveal"
import { readPlantumlCache, writePlantumlCache, sweepExpiredPlantumlCache } from "@/lib/diagram/plantuml-cache"

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

  // 다크/라이트 각각 다른 encoded 값을 쓰므로(스킨이 섞인 소스 자체가 다름), 이 값 자체가
  // 테마별로 고유한 캐시 키가 된다 — 같은 방문 세션에서 이미 본 적 있는 테마로 다시 토글하면
  // PlantUML 공개 서버에 재요청하지 않고 이 캐시에서 즉시 꺼내 쓴다(사용자 실측 — 정상
  // 다이어그램도 150~540ms, 렌더링 실패 판정은 1.8~2.3초까지 걸려 테마 토글마다 체감 지연이
  // 있었음). 값이 string이면 성공한 최종 SVG 마크업(패치까지 끝난 것), null이면 이미 실패로
  // 판정된 적 있는 encoded 값 — 두 경우 다 재요청을 건너뛴다.
  //
  // 이 Map은 컴포넌트 인스턴스(이 아티클 방문) 생명주기에만 묶인 "1차 캐시"다 — 같은 값을
  // 반복 조회할 때마다 lib/diagram/plantuml-cache.ts의 localStorage 읽기(JSON.parse 포함)를
  // 매번 다시 하지 않도록(vercel-react-best-practices의 js-cache-storage) 세션 안에서는 항상
  // 이 Map을 먼저 본다. 실제로 새로고침에도 살아남는 "2차 캐시"는 localStorage 쪽이다 — 이
  // Map은 그 결과를 그때그때 미러링해둘 뿐, 모듈 전역으로 두지 않는 이유(다른 글의 다이어그램까지
  // 무한정 쌓임)는 이전과 동일하다.
  const cacheRef = React.useRef<Map<string, string | null>>(new Map())

  // 페이지 방문마다 한 번만 — 오래돼서 다시는 안 쓰일 localStorage 캐시 항목을 정리한다
  // (테마 토글마다 다시 훑을 필요는 없어서 별도 effect로 분리, deps 없음).
  React.useEffect(() => {
    sweepExpiredPlantumlCache()
  }, [])

  React.useEffect(() => {
    const blocks = document.querySelectorAll<HTMLPreElement>('pre[data-language="plantuml"]')
    if (blocks.length === 0) return

    const cancelledRef = { current: false }

    // 블록마다 fetch가 서로 독립적이므로(공유 렌더 상태에 의존하는 mermaid.render()와 달리)
    // 순차 await 대신 Promise.all로 병렬 요청한다 — 다이어그램이 여럿인 페이지에서 불필요한
    // 워터폴을 만들지 않는다(vercel-react-best-practices의 async-parallel).
    void Promise.all(
      Array.from(blocks).map((pre) => renderBlock(pre, isDark, cancelledRef, cacheRef.current))
    )

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
 * encoded 값(다크/라이트별로 다름) 단위로 캐시를 먼저 확인한다 — 히트하면 네트워크 요청 자체를
 * 건너뛰고 캐시된 결과(성공 시 SVG 마크업, 실패 시 null)를 그대로 재적용한다. 캐시 미스일 때만
 * 아래에서 실제로 fetch한다. Map(세션 한정)에서 먼저 찾고, 없으면 localStorage(새로고침·재방문에도
 * 유지)를 본다 — 이 순서 덕에 새로고침해도 이전에 본 적 있는 다이어그램은 네트워크 요청 없이
 * 즉시 렌더링된다(lib/diagram/plantuml-cache.ts). */
async function renderBlock(
  pre: HTMLPreElement,
  isDark: boolean,
  cancelledRef: { current: boolean },
  cache: Map<string, string | null>
) {
  const figure = pre.closest<HTMLElement>("[data-rehype-pretty-code-figure]")
  const encoded = isDark ? pre.dataset.plantumlEncodedDark : pre.dataset.plantumlEncodedLight
  if (!figure || !encoded) return

  const container =
    figure.querySelector<HTMLElement>("[data-plantuml-diagram]") ?? document.createElement("div")

  const memoryHit = cache.get(encoded)
  const cached = memoryHit !== undefined ? memoryHit : readPlantumlCache(encoded)
  if (cached !== undefined) {
    // localStorage 히트는 이 Map에도 미러링해서, 같은 페이지 안에서 또 조회할 때(예: 다른
    // 테마로 갔다가 돌아옴) localStorage를 다시 안 읽는다.
    if (memoryHit === undefined) cache.set(encoded, cached)
    if (cached === null) {
      applyFailureState(pre, figure)
      container.remove()
    } else {
      applySuccessState(pre, figure, container, cached)
    }
    return
  }

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

    // fetch가 이미 끝난 이상, 이 effect 실행이 그사이 취소됐어도(예: 토글을 연달아 눌러 다음
    // 테마로 곧바로 넘어감) 결과 자체는 여전히 유효하다 — DOM은 안 건드리되 캐시에는 남겨서
    // 나중에 이 encoded 값으로 다시 돌아왔을 때 재사용한다.
    const svgMarkup = svgRoot.outerHTML
    cache.set(encoded, svgMarkup)
    writePlantumlCache(encoded, svgMarkup)
    if (cancelledRef.current) return
    applySuccessState(pre, figure, container, svgMarkup)
  } catch {
    cache.set(encoded, null)
    writePlantumlCache(encoded, null)
    if (cancelledRef.current) return
    applyFailureState(pre, figure)
    container.remove()
  }
}

function applySuccessState(pre: HTMLPreElement, figure: HTMLElement, container: HTMLElement, svgMarkup: string) {
  container.dataset.plantumlDiagram = ""
  container.innerHTML = svgMarkup
  // 테마 전환 시 재렌더링에서는(이미 연결된 컨테이너 재사용) 등장 연출을 다시 재생하지 않는다 —
  // 최초 삽입 때만 macOS 콘텐츠 영역이 펼쳐지는 게 자연스럽고, 토글마다 매번 펼쳐지면 산만하다.
  const isFirstInsert = !container.isConnected
  if (isFirstInsert) figure.insertBefore(container, pre)
  pre.style.display = "none"
  if (isFirstInsert) animateDiagramReveal(container)
  ensureExpandButton(figure)
}

function applyFailureState(pre: HTMLPreElement, figure: HTMLElement) {
  // 기본 상태는 article-body.css가 pre[data-language="plantuml"]를 display:none으로 숨겨둔다
  // (첫 페인트 시 원본 코드가 잠깐 보였다 사라지는 깜빡임 방지) — 렌더링이 실패하면 그 기본값을
  // "block"으로 명시적으로 덮어써야 원본이 다시 보인다("" 로는 CSS 규칙이 그대로 이겨 계속
  // 숨겨진 채로 남는다).
  pre.style.display = "block"
  pre.dataset.plantumlError = "true"
  figure.querySelector("[data-plantuml-expand-button]")?.remove()
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
