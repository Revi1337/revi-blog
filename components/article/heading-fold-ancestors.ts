/** TOC 클릭·헤딩 퍼머링크 클릭·해시 진입/복원으로 특정 헤딩으로 점프하기 직전에 호출한다.
 * 대상 헤딩이 접힌 `<details>`(콜아웃 또는 헤딩 접기) 안에 있으면 `scrollIntoView`가 실행돼도
 * 숨겨진 위치로 스크롤되거나(콘텐츠가 안 보임) 잘못된 지점에서 멈춘다 — 조상 `<details>`를 전부
 * 펼쳐 목표 지점이 실제로 화면에 나타나게 한다. */
export function expandFoldAncestors(headingId: string) {
  const heading = document.getElementById(headingId)
  if (!heading) return

  let details = heading.closest("details")
  while (details) {
    details.open = true
    details = details.parentElement?.closest("details") ?? null
  }
}
