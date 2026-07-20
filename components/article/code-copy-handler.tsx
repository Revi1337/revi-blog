"use client"

import * as React from "react"

const COPIED_CLASS = "is-copied"
const COPIED_DURATION_MS = 1600

/** article-body는 dangerouslySetInnerHTML로 렌더링되는 정적 HTML이라 버튼마다 React 핸들러를 붙일 수
 * 없다. document 레벨 이벤트 위임 하나로 모든 코드 블록의 복사 버튼 클릭을 처리한다. */
export function CodeCopyHandler() {
  React.useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return

      const button = target.closest<HTMLButtonElement>("[data-code-copy-button]")
      if (!button) return

      const figure = button.closest("[data-rehype-pretty-code-figure]")
      const code = figure?.querySelector("pre")
      if (!code?.textContent) return

      navigator.clipboard
        .writeText(code.textContent)
        .then(() => {
          button.classList.add(COPIED_CLASS)
          window.setTimeout(() => button.classList.remove(COPIED_CLASS), COPIED_DURATION_MS)
        })
        .catch(() => {})
    }

    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [])

  return null
}
