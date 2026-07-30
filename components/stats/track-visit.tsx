"use client"

import { useEffect, useRef } from "react"

// prefetch는 컴포넌트를 마운트하지 않고 데이터만 미리 받아두므로, 이 useEffect는 실제로 화면에
// 렌더된 real visit에서만 실행된다 — 서버 미들웨어에서는 prefetch 요청을 구분할 방법이 없어
// (app/api/track/route.ts 주석 참고) 카운팅 자체를 이 컴포넌트로 옮겼다.
// useRef 가드는 React StrictMode(dev)의 effect 이중 실행으로 인한 중복 집계를 막는다.
export function TrackVisit({ slug }: { slug?: string }) {
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current) return
    tracked.current = true

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(slug ? { slug } : {}),
      keepalive: true,
    }).catch(() => {})
  }, [slug])

  return null
}
