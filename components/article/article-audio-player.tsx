"use client"

import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { m } from "motion/react"
import { Pause, Play, X } from "lucide-react"

import { useAudioPlayback } from "@/components/article/use-audio-playback"

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00"
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

interface ArticleAudioPlayerProps {
  src: string
  initialTime: number
  onTimeUpdate: (time: number) => void
  onClose: () => void
}

/** 뷰포트 하단에 고정되는 재생 컨트롤 — document.body로 포탈링한다. ArticleHeader는
 * framer-motion(motion.div/motion.h1)으로 감싸여 있는데, motion은 애니메이션 중 인라인
 * transform을 적용하고 filter/transform류 조상은 후손 fixed 요소의 containing block이
 * 돼버린다(components/layout/mobile-nav-menu.tsx의 동일 이슈 참고) — 포탈로 그 서브트리를
 * 완전히 벗어나면 이 문제 자체가 발생할 수 없다. */
export function ArticleAudioPlayer({ src, initialTime, onTimeUpdate, onClose }: ArticleAudioPlayerProps) {
  const progressInputRef = useRef<HTMLInputElement>(null)
  const elapsedTextRef = useRef<HTMLSpanElement>(null)
  // 사용자가 진행 막대를 드래그하는 동안에는 timeupdate가 그 값을 실시간 재생 위치로
  // 계속 덮어써 드래그와 서로 충돌한다 — 드래그 중엔 그 덮어쓰기를 멈춘다.
  const isScrubbingRef = useRef(false)

  const { audioRef, isPlaying, duration, playbackRate, play, pause, seek, cyclePlaybackRate } =
    useAudioPlayback({
      initialTime,
      onTimeUpdate: (currentTime) => {
        onTimeUpdate(currentTime)
        if (elapsedTextRef.current) elapsedTextRef.current.textContent = formatTime(currentTime)
        if (progressInputRef.current && !isScrubbingRef.current) {
          progressInputRef.current.value = String(currentTime)
        }
      },
      onEnded: () => {},
    })

  useEffect(() => {
    play()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-gutter">
      <m.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 32 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="pointer-events-auto flex w-full max-w-lg items-center gap-3 rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 py-3 shadow-lg dark:border-outline-variant/20"
      >
        <audio ref={audioRef} src={src} preload="metadata" />

        <button
          type="button"
          aria-label={isPlaying ? "Pause" : "Play"}
          onClick={isPlaying ? pause : play}
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary transition-colors hover:brightness-110 dark:bg-primary-container dark:text-on-primary-container"
        >
          {isPlaying ? (
            <Pause className="size-4" fill="currentColor" />
          ) : (
            <Play className="size-4" fill="currentColor" />
          )}
        </button>

        <span
          ref={elapsedTextRef}
          className="w-10 shrink-0 font-code-sm text-code-sm text-on-surface-variant"
        >
          0:00
        </span>

        <input
          ref={progressInputRef}
          type="range"
          aria-label="Seek"
          min={0}
          max={duration || 0}
          step="any"
          defaultValue={initialTime}
          onPointerDown={() => {
            isScrubbingRef.current = true
          }}
          onPointerUp={() => {
            isScrubbingRef.current = false
          }}
          onChange={(event) => seek(Number(event.target.value))}
          className="h-1.5 flex-1 cursor-pointer accent-primary dark:accent-primary-container"
        />

        <span className="w-10 shrink-0 font-code-sm text-code-sm text-on-surface-variant">
          {formatTime(duration)}
        </span>

        <button
          type="button"
          aria-label="Playback speed"
          onClick={cyclePlaybackRate}
          className="shrink-0 rounded-md border border-outline-variant px-1.5 py-0.5 font-code-sm text-code-sm text-on-surface-variant transition-colors hover:border-primary hover:text-primary dark:border-outline-variant/20 dark:hover:border-primary-fixed dark:hover:text-primary-fixed"
        >
          {playbackRate}×
        </button>

        <button
          type="button"
          aria-label="Close"
          onClick={() => {
            pause()
            onClose()
          }}
          className="flex shrink-0 items-center text-on-surface-variant transition-colors hover:text-primary dark:hover:text-primary-fixed"
        >
          <X className="size-4" />
        </button>
      </m.div>
    </div>,
    document.body
  )
}
