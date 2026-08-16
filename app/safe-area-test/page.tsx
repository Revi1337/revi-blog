"use client"

import { useEffect, useRef, useState } from "react"

/**
 * ⚠️ 임시 진단 페이지 — 원인이 확정되면 삭제한다. 블로그 본체(/)에는 영향이 없다.
 *
 * 1차 진단으로 확정된 사실:
 *   - safe-area-inset-top = 0px  → iOS Safari 일반 탭에서는 웹뷰가 노치 아래로 들어가지 않는다.
 *     즉 nav에 준 pt-[env(safe-area-inset-top)]은 계속 no-op이었다.
 *   - 불투명 단색 헤더로 색을 바꾸면 노치 띠도 **즉시** 따라 바뀐다. 이때 theme-color meta는
 *     전혀 건드리지 않았으므로, Safari는 theme-color가 아니라 **페이지가 그린 픽셀을 샘플링해**
 *     그 띠를 칠한다는 뜻이다.
 *
 * 남은 변수는 실제 nav와 테스트 헤더의 차이인 "반투명"과 "backdrop-blur" 둘뿐이다.
 * 아래 4가지 조합을 각각 켜고 색을 전환해, 어느 조합에서 노치 갱신이 깨지는지 특정한다.
 */

const VARIANTS = [
  { id: "A", label: "A. 불투명 + 블러없음 (1차 진단과 동일)", alpha: false, blur: false },
  { id: "B", label: "B. 반투명 70% + 블러없음", alpha: true, blur: false },
  { id: "C", label: "C. 불투명 + 블러있음", alpha: false, blur: true },
  { id: "D", label: "D. 반투명 70% + 블러있음 (실제 nav와 동일)", alpha: true, blur: true },
  // 아래 둘은 "글래스를 유지한 채" 우회가 가능한지 보는 후보안이다.
  { id: "E", label: "E. D와 같지만, 색 전환 순간에만 블러를 2프레임 끔", alpha: true, blur: true },
  { id: "F", label: "F. D와 같지만, 최상단 4px만 불투명·블러없는 띠", alpha: true, blur: true },
] as const

export default function SafeAreaTestPage() {
  const [red, setRed] = useState(true)
  const [variantId, setVariantId] = useState<string>("A")
  const [blurOff, setBlurOff] = useState(false)
  const probeRef = useRef<HTMLDivElement>(null)
  const [inset, setInset] = useState<number | null>(null)

  useEffect(() => {
    setInset(probeRef.current?.offsetHeight ?? null)
  }, [])

  const variant = VARIANTS.find((v) => v.id === variantId) ?? VARIANTS[0]
  const base = red ? "255, 0, 0" : "0, 200, 0"
  const bg = variant.alpha ? `rgba(${base}, 0.7)` : `rgb(${base})`
  const blurActive = variant.blur && !blurOff

  // E안: 색이 바뀌는 순간에만 블러를 잠깐 끈다 — 블러가 없는 프레임에서 Safari가 상단 색을
  // 다시 샘플링하게 만든 뒤 원래대로 되돌리는 방식. rAF 두 번을 거쳐야 실제로 블러 없는
  // 프레임이 한 번 그려진다(같은 프레임에서 껐다 켜면 그린 적이 없어 무의미).
  function handleToggleColor() {
    setRed((v) => !v)
    if (variant.id !== "E") return
    setBlurOff(true)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setBlurOff(false))
    })
  }

  return (
    <>
      <div
        ref={probeRef}
        aria-hidden
        style={{ height: "env(safe-area-inset-top)", position: "absolute", visibility: "hidden" }}
      />

      {/* 진단 대상 헤더 — 변형만 바뀌고 나머지 조건은 실제 nav와 동일하게 fixed/top:0 */}
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          paddingTop: "env(safe-area-inset-top)",
          backgroundColor: bg,
          ...(blurActive
            ? { backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }
            : {}),
        }}
      >
        <div style={{ padding: "16px", fontFamily: "monospace", color: "#000", fontWeight: 700 }}>
          {variant.id} / {red ? "빨강" : "초록"}
        </div>
      </header>

      {/* F안: 최상단 4px만 블러 없는 불투명 띠로 덮는다 — Safari가 샘플링하는 최상단 영역에서만
       * backdrop-filter를 치워, 글래스 헤더는 그대로 두고 색 갱신만 되살릴 수 있는지 본다. */}
      {variant.id === "F" && (
        <div
          aria-hidden
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            zIndex: 101,
            backgroundColor: `rgb(${base})`,
          }}
        />
      )}

      <div
        style={{
          marginTop: "160px",
          padding: "20px",
          fontFamily: "monospace",
          lineHeight: 1.8,
          fontSize: "14px",
        }}
      >
        <button
          type="button"
          onClick={handleToggleColor}
          style={{
            width: "100%",
            padding: "22px",
            fontSize: "19px",
            fontWeight: 700,
            border: "2px solid currentColor",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          ① 색 전환 (현재 {red ? "빨강" : "초록"})
        </button>

        <div style={{ fontWeight: 700, marginBottom: "8px" }}>② 헤더 조합 선택</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
          {VARIANTS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setVariantId(v.id)}
              style={{
                padding: "14px",
                textAlign: "left",
                fontSize: "14px",
                fontWeight: v.id === variantId ? 700 : 400,
                border: `2px solid ${v.id === variantId ? "currentColor" : "transparent"}`,
                outline: "1px solid currentColor",
                borderRadius: "8px",
              }}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div>safe-area-inset-top = {inset === null ? "측정중" : `${inset}px`}</div>

        <div style={{ marginTop: "20px", fontWeight: 700 }}>확인 방법</div>
        <div>A~D를 하나씩 고른 뒤, 각각에서 ① 색 전환을 눌러</div>
        <div>노치 띠가 헤더와 같이 바뀌는지 보세요.</div>
        <div style={{ marginTop: "8px" }}>→ 어느 조합에서 노치가 안 따라오는지 알려주시면 됩니다.</div>

        <div style={{ height: "900px" }} />
      </div>
    </>
  )
}
