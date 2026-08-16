"use client"

import { useEffect, useRef, useState } from "react"

/**
 * ⚠️ 임시 진단 페이지 — 노치(safe area) 색 문제의 원인을 확정하기 위한 용도이며, 원인이
 * 확정되면 삭제한다. 블로그 본체(/)에는 아무 영향이 없다.
 *
 * 확인하려는 것은 단 하나: "노치 뒤 띠를 페이지가 칠하는가, Safari가 칠하는가".
 * 헤더 하나에 padding-top: env(safe-area-inset-top)을 주고 **불투명 단색**(블러/투명도 없음)을
 * 칠한다. 노치 영역과 헤더 본체는 같은 엘리먼트의 같은 배경색이므로:
 *   - 버튼을 눌렀을 때 노치까지 같이 색이 바뀌면  → 페이지가 칠하는 것(= 우리 CSS로 해결 가능)
 *   - 헤더 본체만 바뀌고 노치는 그대로면        → 페이지는 칠하지만 갱신이 안 되는 것
 *   - 노치가 애초에 이 색이 아니면              → Safari가 칠하는 것(= 페이지 CSS로는 불가)
 * 블러/반투명을 일부러 뺀 이유는, 그 두 가지가 원인 판별을 흐리기 때문이다.
 */
export default function SafeAreaTestPage() {
  const [red, setRed] = useState(true)
  const probeRef = useRef<HTMLDivElement>(null)
  const [inset, setInset] = useState<number | null>(null)
  const [themeColor, setThemeColor] = useState<string>("")

  useEffect(() => {
    // env(safe-area-inset-top)의 실제 픽셀값 — 0이면 애초에 노치 영역이 페이지에 안 잡힌 것이다
    setInset(probeRef.current?.offsetHeight ?? null)
    const metas = [...document.querySelectorAll('meta[name="theme-color"]')]
    setThemeColor(metas.map((m) => m.getAttribute("content")).join(" , ") || "(없음)")
  }, [red])

  const bg = red ? "#ff0000" : "#00ff00"

  return (
    <>
      {/* 측정 전용(화면에 안 보임) */}
      <div
        ref={probeRef}
        aria-hidden
        style={{ height: "env(safe-area-inset-top)", position: "absolute", visibility: "hidden" }}
      />

      {/* 진단 대상 헤더 — 불투명 단색, 블러 없음 */}
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          paddingTop: "env(safe-area-inset-top)",
          backgroundColor: bg,
        }}
      >
        <div style={{ padding: "16px", fontFamily: "monospace", color: "#000", fontWeight: 700 }}>
          헤더 본체 (이 색 = {bg})
        </div>
      </header>

      <div
        style={{
          marginTop: "180px",
          padding: "24px",
          fontFamily: "monospace",
          lineHeight: 1.9,
          fontSize: "14px",
        }}
      >
        <button
          type="button"
          onClick={() => setRed((v) => !v)}
          style={{
            padding: "20px 28px",
            fontSize: "18px",
            fontWeight: 700,
            border: "2px solid currentColor",
            borderRadius: "8px",
            marginBottom: "24px",
          }}
        >
          색 전환 (현재: {red ? "빨강" : "초록"})
        </button>

        <div>safe-area-inset-top = {inset === null ? "측정중" : `${inset}px`}</div>
        <div>theme-color meta = {themeColor}</div>
        <div style={{ marginTop: "24px", fontWeight: 700 }}>확인할 것</div>
        <div>1. 지금 노치 뒤 띠가 헤더와 같은 색인가?</div>
        <div>2. 버튼을 누르면 노치 띠도 같이 바뀌는가?</div>
        <div style={{ height: "1500px" }} />
        <div>(스크롤 끝)</div>
      </div>
    </>
  )
}
