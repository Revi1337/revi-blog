import { useLayoutEffect, useRef, useState } from "react"

// flex-wrap 행에서 각 항목이 새 줄의 첫머리로 밀려났는지를 감지한다 — CSS만으로는 "이 flex
// 아이템이 줄바꿈된 줄의 첫 항목인지"를 판별할 선택자가 없어(:first-child는 DOM 순서 기준일 뿐
// 시각적 줄바꿈과 무관), 바로 앞 형제와 offsetTop을 비교하는 방식으로 우회한다.
//
// 항목 하나당 ResizeObserver를 하나씩 붙이면 같은 부모(메타 줄)를 N개의 옵저버가 중복 관찰하게
// 되므로, 행 전체를 옵저버 하나로 관찰하고 모든 항목의 줄바꿈 여부를 한 번에 계산한다.
//
// 각 항목의 ref는 반드시 "구분자 + 내용"을 한 덩어리로 묶은 wrapper에 걸어야 한다 — 구분자를
// wrapper 바깥의 별도 형제로 두면, 구분자와 내용이 함께 다음 줄로 넘어가는 경우(둘 다 한 줄에
// 안 들어가는 경우) wrapper의 previousElementSibling이 그 구분자 자신이 되어버려 "같은 줄"로
// 오판하고, 결국 새 줄이 구분자로 시작하는 상태를 놓친다.
export function useWrapDetection(itemCount: number) {
  const itemRefs = useRef<(HTMLElement | null)[]>([])
  const [wrapped, setWrapped] = useState<boolean[]>(() => Array(itemCount).fill(false))

  useLayoutEffect(() => {
    const parent = itemRefs.current.find(Boolean)?.parentElement
    if (!parent) return

    const update = () => {
      setWrapped((prev) => {
        const next = itemRefs.current.map((el) => {
          const prevSibling = el?.previousElementSibling as HTMLElement | null
          return el !== null && prevSibling !== null && el.offsetTop > prevSibling.offsetTop
        })
        const changed = next.some((value, index) => value !== prev[index])
        return changed ? next : prev
      })
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(parent)
    return () => observer.disconnect()
  }, [])

  return { itemRefs, wrapped }
}
