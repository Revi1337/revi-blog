import { expandFoldAncestors } from "@/components/article/heading-fold-ancestors"

/** TOC 링크와 헤딩 퍼머링크(.heading-anchor) 둘 다, 같은 페이지 안에서 특정 헤딩으로
 * "점프"한다는 동일한 성격의 동작이라 이동 방식도 동일해야 한다 — globals.css의
 * scroll-behavior: smooth(본문 스크롤용)와 무관하게, 여기서만 애니메이션 없이 즉시 이동한다.
 * 목표 헤딩이 접힌 섹션 안에 있으면 스크롤 전에 먼저 펼쳐야, 숨겨진 위치로 이동하거나 잘못된
 * 지점에서 멈추지 않는다(spec.md FR-006). */
export function scrollToHeadingInstant(id: string) {
  expandFoldAncestors(id)
  document.getElementById(id)?.scrollIntoView({ behavior: "instant", block: "start" })
  window.history.pushState(null, "", `#${id}`)
}

/** 새 탭/창으로 열기 등 브라우저 기본 동작이 기대되는 조작(가운데 클릭, 수정자 키 클릭)은
 * 가로채지 않고 그대로 흘려보내기 위한 판별. */
export function isPlainLeftClick(event: {
  button: number
  metaKey: boolean
  ctrlKey: boolean
  shiftKey: boolean
  altKey: boolean
}) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
}
