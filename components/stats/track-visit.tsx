"use client"

import { useEffect, useRef } from "react"
import { mutate } from "swr"

// prefetch는 컴포넌트를 마운트하지 않고 데이터만 미리 받아두므로, 이 useEffect는 실제로 화면에
// 렌더된 real visit에서만 실행된다 — 서버 미들웨어에서는 prefetch 요청을 구분할 방법이 없어
// (app/api/track/route.ts 주석 참고) 카운팅 자체를 이 컴포넌트로 옮겼다.
// useRef 가드는 React StrictMode(dev)의 effect 이중 실행으로 인한 중복 집계를 막는다.
export function TrackVisit({ slug }: { slug?: string }) {
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current) return
    tracked.current = true

    // VisitorStatsWidget(useVisitorStats/SWR)은 이 요청과 별개로 마운트 시점에 한 번만 값을
    // 읽어와 캐싱하므로, 여기서 증가시켜도 SWR이 스스로 다시 읽어오기 전까진(기본적으로는 탭
    // refocus 시점) 위젯에 옛날 값이 그대로 보인다 — 응답이 오면 같은 키를 mutate로 재검증해서
    // 바로 반영되게 한다.
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(slug ? { slug } : {}),
      keepalive: true,
    })
      .then(() => {
        mutate(slug ? `/api/stats/${slug}` : "/api/stats")
      })
      .catch(() => {})
  }, [slug])

  return null
}
