/**
 * Mermaid/PlantUML/Markmap 다이어그램 컨테이너가 삽입되는 순간, macOS 콘텐츠 영역이 처음엔
 * 접혀(타이틀바만 보이는 상태) 있다가 실제 콘텐츠 높이만큼 펼쳐지는 것처럼 보이게 한다. 세
 * 핸들러(mermaid-diagram-handler.tsx 등)가 공통으로 쓰는 유일한 등장 연출이라 여기 하나로
 * 모아둔다 — CSS만으로는 `height: auto`로의 트랜지션이 불가능해서(auto는 애니메이션 대상이 될 수
 * 없는 값) 실제 높이를 JS로 측정한 뒤 그 값으로 트랜지션해야 한다(사용자 피드백 — 단순 opacity
 * 페이드인은 "빈 박스에서 훅 나타난다"는 인상이 남는다는 지적으로 이 방식으로 교체됨).
 */
export function animateDiagramReveal(container: HTMLElement) {
  const targetHeight = container.scrollHeight
  if (targetHeight === 0) return

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

  container.style.maxHeight = "0px"
  container.style.overflow = "hidden"
  // 강제 리플로우 — max-height: 0을 브라우저가 실제로 반영(paint)하게 만들어야, 바로 이어지는
  // max-height 변경이 트랜지션으로 재생된다. 두 값을 같은 동기 구간에서 연달아 주면 브라우저가
  // 중간 상태 없이 최종 값으로 바로 뛰어버리는, CSS transition의 잘 알려진 타이밍 함정이다.
  void container.offsetHeight

  container.style.transition = "max-height 0.35s ease-out"
  container.style.maxHeight = `${targetHeight}px`

  const cleanup = () => {
    // 트랜지션이 끝나면 인라인 스타일을 전부 지워 원래 CSS(각 다이어그램 타입의 반응형
    // height:auto/overflow-x:auto 등)가 다시 온전히 적용되게 한다 — 고정 픽셀 값을 그대로 두면
    // 창 크기 변경 등으로 콘텐츠 높이가 바뀌어야 할 때 이 값에 발목 잡힌다.
    container.style.transition = ""
    container.style.maxHeight = ""
    container.style.overflow = ""
    container.removeEventListener("transitionend", cleanup)
  }
  container.addEventListener("transitionend", cleanup)
}
