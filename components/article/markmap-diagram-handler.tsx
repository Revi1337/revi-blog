"use client"

import * as React from "react"

import { useTheme } from "@/components/theme/theme-context"
import { MarkmapLightboxModal } from "@/components/markmap/markmap-lightbox-modal"

type Transformer = InstanceType<typeof import("markmap-lib")["Transformer"]>
type MarkmapCtor = typeof import("markmap-view")["Markmap"]
type MarkmapInstance = InstanceType<MarkmapCtor>

/** mermaid-diagram-handler.tsx와 동일한 아이콘/클래스(mermaid-expand-icon)를 재사용해, 신규 CSS
 * 없이 Mermaid/PlantUML과 픽셀 단위로 동일한 확대 버튼을 얻는다(013이 PlantUML에서 쓴 방식과
 * 동일한 이유 — spec.md FR-011). */
const EXPAND_ICON_HTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mermaid-expand-icon" aria-hidden="true"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>`

/** markmap-view는 렌더링 결과 SVG에 `.markmap` 클래스를 직접 붙이고, 다크 모드 색상은
 * `.markmap-dark .markmap`(조상-후손 선택자)로 이미 내장돼 있다(실측 확인,
 * node_modules/markmap-view/dist/index.js의 globalCSS) — Mermaid/PlantUML과 달리 테마 전환 시
 * 재렌더링이 필요 없고, 이 컨테이너에 `markmap-dark` 클래스만 토글하면 된다(research.md
 * "다크/라이트 테마 반영 방식" 확정 — CSS 변수만으로 충분, 별도 skinparam/themeVariables 불필요). */
export function MarkmapDiagramHandler() {
  const { isDark } = useTheme()
  const [lightboxSource, setLightboxSource] = React.useState<string | null>(null)

  // 렌더링 effect(아래)는 markmap-lib/markmap-view를 동적 import하는 비동기 작업이 끝난 뒤에야
  // 컨테이너를 DOM에 만든다. 그 사이 테마 토글 effect가 먼저(컨테이너가 아직 없는 시점에) 실행될
  // 수 있어, 렌더링 effect가 `[]` deps로 캡처한 isDark 클로저 값을 그대로 쓰면 최초 로드가
  // 다크모드일 때 실측으로 경쟁 상태가 발견됐다 — 컨테이너가 markmap-dark 클래스 없이 생성돼
  // 텍스트가 거의 안 보이고, 독자가 테마를 한 번 토글해 isDark가 실제로 바뀌어야만(그때 테마
  // 토글 effect가 다시 실행되며) 뒤늦게 정상화됐다. ref로 항상 최신 isDark를 들고 있다가 컨테이너
  // 생성 시점에 직접 반영해 이 경쟁 상태를 없앤다.
  const isDarkRef = React.useRef(isDark)

  React.useEffect(() => {
    const blocks = document.querySelectorAll<HTMLPreElement>('pre[data-language="markmap"]')
    if (blocks.length === 0) return

    let cancelled = false
    // 살아있는 인스턴스를 유지해야 본문 인라인 접기/펼치기·팬/줌이 동작한다(contracts #3) —
    // 동시에 페이지 이탈(언마운트) 시 markmap-view가 내부적으로 붙이는 ResizeObserver 등을
    // destroy()로 정리하지 않으면, 이 블로그는 클라이언트 라우팅 SPA라 다른 아티클로 이동해도
    // JS 런타임이 계속 살아있어 연결이 끊긴 SVG를 계속 관찰하는 옵저버가 누적된다.
    const instances: MarkmapInstance[] = []

    void (async () => {
      const [{ Transformer }, { Markmap }] = await Promise.all([
        import("markmap-lib"),
        import("markmap-view"),
      ])
      if (cancelled) return

      const transformer = new Transformer()

      for (const pre of Array.from(blocks)) {
        // 이전 렌더에서 이미 파싱/렌더링 오류로 판정된 블록은 다시 시도하지 않는다 — 소스가
        // 그대로인 한 결과도 항상 실패이므로(Mermaid/PlantUML과 동일 관례, data-model.md).
        if (pre.dataset.markmapError === "true") continue
        const instance = renderBlock(transformer, Markmap, pre, isDarkRef.current)
        if (instance) instances.push(instance)
        if (cancelled) return
      }
    })()

    return () => {
      cancelled = true
      instances.forEach((instance) => instance.destroy())
    }
  }, [])

  // 테마 전환은 재렌더링이 아니라 markmap-view의 내장 CSS 변수 오버라이드(.markmap-dark)를
  // 토글하는 것만으로 충분하다(위 주석 근거) — 살아있는 인스턴스(§contracts #3)를 건드리지 않아
  // 본문에서 조작 중이던 접기/펼치기·팬/줌 상태가 테마 전환으로 초기화되지 않는다.
  React.useEffect(() => {
    isDarkRef.current = isDark
    const containers = document.querySelectorAll<HTMLElement>("[data-markmap-diagram]")
    containers.forEach((container) => container.classList.toggle("markmap-dark", isDark))
  }, [isDark])

  // 확대 버튼 클릭 위임 — Mermaid/PlantUML 핸들러와 동일하게 document 레벨 리스너 하나로 모든
  // 마인드맵의 확대 버튼을 처리한다(client-event-listeners).
  React.useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return

      const button = target.closest<HTMLButtonElement>("[data-markmap-expand-button]")
      if (!button) return

      const figure = button.closest<HTMLElement>("[data-rehype-pretty-code-figure]")
      const pre = figure?.querySelector<HTMLPreElement>('pre[data-language="markmap"]')
      if (!pre) return

      setLightboxSource(pre.textContent ?? "")
    }

    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [])

  return <MarkmapLightboxModal source={lightboxSource} onClose={() => setLightboxSource(null)} />
}

function renderBlock(
  transformer: Transformer,
  Markmap: MarkmapCtor,
  pre: HTMLPreElement,
  isDark: boolean
): MarkmapInstance | null {
  const figure = pre.closest<HTMLElement>("[data-rehype-pretty-code-figure]")
  if (!figure) return null
  if (figure.querySelector("[data-markmap-diagram]")) return null

  const source = pre.textContent ?? ""

  const container = document.createElement("div")
  container.dataset.markmapDiagram = ""
  container.classList.toggle("markmap-dark", isDark)

  try {
    const { root } = transformer.transform(source)

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    container.appendChild(svg)
    figure.insertBefore(container, pre)
    pre.style.display = "none"

    // autoFit을 켜지 않는다 — Markmap.create()는 초기 렌더 직후 어차피 한 번 fit()을 호출해
    // 뷰포트에 맞춰준다(node_modules 실측). autoFit: true를 켜면 가지를 접고 펼칠 때마다
    // (toggleNode → renderData → autoFit && fit()) 뷰가 매번 재중심·재조정되어, 독자가 본문에서
    // 직접 조작한 팬/줌 위치가 클릭할 때마다 리셋되는 나쁜 UX가 된다(FR-004/FR-005 취지 위배).
    const instance = Markmap.create(svg, undefined, root)
    ensureExpandButton(figure)
    return instance
  } catch {
    container.remove()
    pre.style.display = ""
    pre.dataset.markmapError = "true"
    return null
  }
}

function ensureExpandButton(figure: HTMLElement) {
  if (figure.querySelector("[data-markmap-expand-button]")) return

  const button = document.createElement("button")
  button.type = "button"
  button.dataset.markmapExpandButton = ""
  button.className = "mermaid-expand-button"
  button.setAttribute("aria-label", "마인드맵 확대")
  button.innerHTML = EXPAND_ICON_HTML
  figure.appendChild(button)
}
