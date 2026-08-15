"use client"

import * as React from "react"

import { useTheme } from "@/components/theme/theme-context"
import { MarkmapLightboxModal } from "@/components/markmap/markmap-lightbox-modal"
import { animateDiagramReveal } from "@/lib/diagram/animate-reveal"

type Transformer = InstanceType<typeof import("markmap-lib")["Transformer"]>
type MarkmapCtor = typeof import("markmap-view")["Markmap"]
type MarkmapInstance = InstanceType<MarkmapCtor>

/** mermaid-diagram-handler.tsx와 동일한 아이콘/클래스(mermaid-expand-icon)를 재사용해, 신규 CSS
 * 없이 Mermaid/PlantUML과 픽셀 단위로 동일한 확대 버튼을 얻는다(013이 PlantUML에서 쓴 방식과
 * 동일한 이유 — spec.md FR-011). */
const EXPAND_ICON_HTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mermaid-expand-icon" aria-hidden="true"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>`

/** 인라인 컨테이너 높이를 콘텐츠 기준으로 계산한 뒤 이 범위로 clamp한다(사용자 피드백 — 모든
 * 마인드맵이 콘텐츠 양과 무관하게 동일한 고정 420px였던 문제). 하한은 노드가 1~2개뿐인 극단적으로
 * 작은 트리가 타이틀바만 있는 것처럼 보이지 않게 하는 안전장치, 상한은 형제 노드가 많은 넓은
 * 트리가 본문 스크롤을 과도하게 늘리지 않게 하는 안전장치 — 둘 다 실제 브라우저 렌더링으로 실측해
 * 정한 값이다(research.md). */
const MARKMAP_MIN_HEIGHT = 120
const MARKMAP_MAX_HEIGHT = 800

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

  // 마운트 로직 자체는 비동기(동적 import)라 useEffect/useLayoutEffect 어느 쪽이든 타이밍이
  // 동일하지만, cleanup은 useLayoutEffect를 써야 한다 — useEffect의 cleanup은 React가 paint 이후
  // 비동기로("passive effect") 실행하는데, 클라이언트 라우팅으로 이 페이지를 빠르게 벗어나면(특히
  // 가지 클릭 직후처럼 d3-zoom transition이 막 예약된 직후) d3-timer의 다음 프레임 tick이 React의
  // cleanup보다 먼저 실행돼 아래 svg.interrupt()가 너무 늦게 호출되는 경쟁 상태가 실측으로
  // 확인됐다(실사용 중 발견, playwright로 재현 — home 이동 시 SVGLength 에러). useLayoutEffect의
  // cleanup은 커밋과 동기적으로 실행되어 다음 애니메이션 프레임보다 항상 먼저 실행되므로 이 경쟁을
  // 근본적으로 없앤다.
  React.useLayoutEffect(() => {
    const blocks = document.querySelectorAll<HTMLPreElement>('pre[data-language="markmap"]')
    if (blocks.length === 0) return

    let cancelled = false
    // 살아있는 인스턴스를 유지해야 본문 인라인 가지 접기/펼치기가 동작한다(contracts #3, 팬/줌은
    // 인라인에서 비활성화되어 확대 보기 모달 전용이다 — 아래 renderBlock 참고) —
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
        const instance = await renderBlock(transformer, Markmap, pre, isDarkRef.current)
        if (instance) instances.push(instance)
        if (cancelled) return
      }
    })()

    return () => {
      cancelled = true
      // d3-zoom의 transition 기반 API(fit() 내부의 zoom.transform 등)는 d3-timer 큐에 예약되어
      // 다음 tick에 실행된다 — 클라이언트 라우팅으로 이 페이지를 빠르게 벗어나면(예: 마운트/가지
      // 접기 직후 곧바로 다른 페이지로 이동) 예약된 tick이 destroy()로도 취소되지 않고 그대로
      // 실행되는데, 그 시점에 SVG가 이미 DOM에서 분리되어 있으면 d3-zoom이 gesture의 extent를
      // 구하려고 SVG의 width 속성(백분율 SVGLength)을 읽다가 `NotSupportedError: Could not
      // resolve relative length`를 던진다(실사용 중 발견 — playwright로 재현, home으로 이동
      // 시 콘솔 에러 확인). `svg.interrupt()`로 예약/진행 중인 transition을 먼저 취소해야 이
      // 예약된 콜백 자체가 실행되지 않는다.
      instances.forEach((instance) => {
        instance.svg.interrupt()
        instance.destroy()
      })
    }
  }, [])

  // 테마 전환은 재렌더링이 아니라 markmap-view의 내장 CSS 변수 오버라이드(.markmap-dark)를
  // 토글하는 것만으로 충분하다(위 주석 근거) — 살아있는 인스턴스(§contracts #3)를 건드리지 않아
  // 본문에서 조작 중이던 접기/펼치기 상태가 테마 전환으로 초기화되지 않는다.
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

async function renderBlock(
  transformer: Transformer,
  Markmap: MarkmapCtor,
  pre: HTMLPreElement,
  isDark: boolean
): Promise<MarkmapInstance | null> {
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

    // 본문 인라인에서는 드래그(팬)·휠(줌)을 비활성화한다 — Mermaid/PlantUML macOS 프리뷰가
    // 완전히 정적인 것과 달리 Markmap만 뷰가 바뀔 수 있으면, 확대 모달에만 있는 "원래대로" 리셋
    // 버튼이 인라인에도 필요해지고 다른 두 다이어그램과 일관성도 깨진다(사용자 피드백). `zoom:
    // false, pan: false`는 markmap-view 내부에서 `svg.on(".zoom", null)`/`svg.on("wheel", null)`로
    // 이어져 드래그·휠·더블클릭·핀치 줌을 전부 한 번에 제거한다(node_modules 실측) — 가지 클릭
    // 접기/펼치기(handleClick)는 이 zoom/pan 옵션과 무관한 별도 리스너라 영향받지 않고 그대로
    // 남는다(FR-004는 유지, FR-005의 인라인 팬/줌 요구만 철회 — 확대 보기 모달에서는 그대로 지원).
    // 이제 독자가 인라인에서 직접 조작할 뷰 상태 자체가 없으므로, 가지를 접고 펼칠 때마다 뷰를
    // 다시 프레이밍해주는 autoFit을 켜도 무방하다(오히려 접은 뒤 어색한 여백 없이 다시 잘 맞춰줌).
    //
    // 컨테이너 높이를 콘텐츠 기준으로 정하려면 `Markmap.create()`의 fire-and-forget
    // `setData().then(fit)` 대신 직접 순서를 제어해야 한다 — `setData()`가 끝난 시점에
    // `instance.state.rect`(콘텐츠 바운딩 박스)가 이미 계산되어 있고, 이를 읽어 높이를 정한
    // 뒤에야 그 높이를 기준으로 `fit()`을 호출할 수 있다(node_modules 실측 — `fit()`은
    // `state.rect`를 읽기만 할 뿐 계산하지 않는다).
    const instance = new Markmap(svg, { zoom: false, pan: false, autoFit: true })
    await instance.setData(root)

    // 너비는 본문 폭(article-body.css의 svg { width: 100% })에 이미 고정되어 있으므로, 그 너비에
    // 맞출 때 필요한 스케일을 구해 높이를 역산한다 — 폭 기준으로만 스케일을 구하는 이유는 아직
    // 높이가 정해지지 않았기 때문이다(닭과 달걀 문제: 높이를 구하려면 스케일이 필요하고, 스케일
    // 공식은 원래 폭/높이 둘 다 필요하다). 스케일 상한은 `maxInitialScale`이 아니라 1(원본 크기)로
    // 둔다 — Mermaid/PlantUML이 `max-width:100%; height:auto`로 축소만 하고 확대는 하지 않는 것과
    // 같은 원칙이다. `maxInitialScale`(기본 2)을 그대로 쓰면 "넓은 트리"처럼 세로로는 길지만
    // 가로 폭이 좁은 콘텐츠가 남는 폭을 채우려고 최대 2배까지 확대되어, 다른 마인드맵보다 글자가
    // 눈에 띄게 커 보이는 문제가 실측으로 발견됐다(사용자 피드백). 이렇게 구한 값을
    // MARKMAP_MIN_HEIGHT~MARKMAP_MAX_HEIGHT로 clamp한 뒤 실제 높이로 반영하고, 그 다음 `fit()`을
    // 다시 호출해 최종 (너비, 높이) 둘 다를 기준으로 스케일/중심을 재계산한다 — 이 두 번째 fit()이
    // 상한/하한에 걸린 경우를 자동으로 바로잡아준다: 상한에 걸리면(콘텐츠가 넘칠 정도로 큼)
    // 텍스트가 잘리지 않고 더 작게 축소되어 전부 들어오고, 하한에 걸리면(콘텐츠가 극히 작음) 남는
    // 높이만큼 위아래 여백이 생긴다.
    const { x1, y1, x2, y2 } = instance.state.rect
    const contentWidth = x2 - x1
    const contentHeight = y2 - y1
    const { width: containerWidth } = svg.getBoundingClientRect()
    const { fitRatio, maxInitialScale } = instance.options
    const naturalScale = Math.min((containerWidth / contentWidth) * fitRatio, maxInitialScale, 1)
    const naturalHeight = contentHeight * naturalScale
    const height = Math.min(Math.max(naturalHeight, MARKMAP_MIN_HEIGHT), MARKMAP_MAX_HEIGHT)
    svg.style.height = `${height}px`
    await instance.fit()

    // Mermaid/PlantUML과 달리 markmap 컨테이너는 테마 전환 시 재생성되지 않으므로(내장 CSS 변수
    // 토글만으로 충분, 위 주석 참고) 여기서는 항상 최초 삽입이다 — isConnected 분기가 필요 없다.
    animateDiagramReveal(container)
    ensureExpandButton(figure)
    return instance
  } catch {
    container.remove()
    // 기본 상태는 article-body.css가 pre[data-language="markmap"]를 display:none으로 숨겨둔다
    // (첫 페인트 시 원본 코드가 잠깐 보였다 사라지는 깜빡임 방지) — 렌더링이 실패하면 그 기본값을
    // "block"으로 명시적으로 덮어써야 원본이 다시 보인다("" 로는 CSS 규칙이 그대로 이겨 계속
    // 숨겨진 채로 남는다).
    pre.style.display = "block"
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
