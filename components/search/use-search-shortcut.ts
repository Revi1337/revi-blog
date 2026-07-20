import { useEffect, useRef } from "react"

const EDITABLE_TAGS = new Set(["INPUT", "TEXTAREA"])

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return EDITABLE_TAGS.has(target.tagName) || target.isContentEditable
}

/**
 * Ctrl+K(Win/Linux)·Cmd+K(Mac)로 onOpen을 호출한다(FR-004). 다른 입력 필드에 포커스가 가 있을 때는
 * 무시한다. onOpen을 ref에 저장해 콜백이 매 렌더마다 바뀌어도 리스너를 재등록하지 않는다
 * (vercel-react-best-practices의 advanced-event-handler-refs 규칙).
 */
export function useSearchShortcut(onOpen: () => void) {
  const onOpenRef = useRef(onOpen)

  useEffect(() => {
    onOpenRef.current = onOpen
  }, [onOpen])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "k" || !(event.metaKey || event.ctrlKey)) return
      if (isEditableTarget(event.target)) return

      event.preventDefault()
      onOpenRef.current()
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])
}
