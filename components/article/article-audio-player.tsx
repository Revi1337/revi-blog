"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
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

/** frontmatter가 트랙별 라벨을 따로 받지 않으므로(단순 URL 배열), 드롭다운 표시용 라벨은
 * URL의 파일명에서 확장자를 뗀 값으로 자동 유도한다. */
function deriveTrackLabel(url: string, index: number): string {
  const path = url.split("?")[0].split("#")[0]
  const filename = path.split("/").pop()
  const withoutExt = filename?.replace(/\.[^./]+$/, "")
  if (!withoutExt) return `트랙 ${index + 1}`
  try {
    return decodeURIComponent(withoutExt)
  } catch {
    return withoutExt
  }
}

interface AudioTrackPlayerProps {
  src: string
  initialTime: number
  onTimeUpdate: (time: number) => void
  onClose: () => void
  /** 트랙이 여러 개일 때 컨트롤 행 안에 함께 배치할 선택 드롭다운(없으면 단일 트랙). */
  trackPicker?: ReactNode
}

/** 트랙 하나를 재생하는 실제 컨트롤(재생/일시정지/탐색/배속/닫기). 상위(ArticleAudioPlayer)가
 * 트랙을 바꿀 때마다 이 컴포넌트를 key로 통째로 리마운트시켜, 이전 트랙의 재생 상태가 새
 * 트랙으로 새어 들어가지 않게 한다(언마운트 시 useAudioPlayback의 정리 로직이 그대로 pause). */
function AudioTrackPlayer({ src, initialTime, onTimeUpdate, onClose, trackPicker }: AudioTrackPlayerProps) {
  const progressInputRef = useRef<HTMLInputElement>(null)
  const elapsedTextRef = useRef<HTMLSpanElement>(null)
  // 사용자가 진행 막대를 드래그하는 동안에는 timeupdate가 그 값을 실시간 재생 위치로
  // 계속 덮어써 드래그와 서로 충돌한다 — 드래그 중엔 그 덮어쓰기를 멈춘다.
  const isScrubbingRef = useRef(false)

  const { audioRef, isPlaying, duration, playbackRate, playbackError, play, pause, seek, cyclePlaybackRate } =
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

  return (
    <>
      <audio ref={audioRef} src={src} preload="metadata" />

      <div className="relative shrink-0">
        <button
          type="button"
          aria-label={isPlaying ? "Pause" : "Play"}
          onClick={isPlaying ? pause : play}
          className="flex size-9 items-center justify-center rounded-full bg-primary text-on-primary transition-colors hover:brightness-110 dark:bg-primary-container dark:text-on-primary-container"
        >
          {isPlaying ? (
            <Pause className="size-4" fill="currentColor" />
          ) : (
            <Play className="size-4" fill="currentColor" />
          )}
        </button>
        {playbackError ? (
          <span
            role="alert"
            className="absolute bottom-full left-1/2 mb-2 w-max max-w-40 -translate-x-1/2 rounded-md bg-surface-container-highest px-2 py-1 text-center font-code-sm text-[11px] text-on-surface shadow-md"
          >
            {playbackError}
          </span>
        ) : null}
      </div>

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

      {trackPicker}

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
    </>
  )
}

interface ArticleAudioPlayerProps {
  /** 항상 정규화된 배열로 받는다 — 길이 1이면 단일 트랙(자동 재생), 2개 이상이면 드롭다운으로
   * 선택하게 한다(ArticleHeader에서 article.audio(string | string[])를 여기서 이미 배열로
   * 정규화해 넘긴다). */
  tracks: string[]
  initialTime: number
  onTimeUpdate: (time: number) => void
  onClose: () => void
}

/** 뷰포트 하단에 고정되는 재생 컨트롤 — document.body로 포탈링한다. ArticleHeader는
 * framer-motion(motion.div/motion.h1)으로 감싸여 있는데, motion은 애니메이션 중 인라인
 * transform을 적용하고 filter/transform류 조상은 후손 fixed 요소의 containing block이
 * 돼버린다(components/layout/mobile-nav-menu.tsx의 동일 이슈 참고) — 포탈로 그 서브트리를
 * 완전히 벗어나면 이 문제 자체가 발생할 수 없다. */
export function ArticleAudioPlayer({ tracks, initialTime, onTimeUpdate, onClose }: ArticleAudioPlayerProps) {
  const hasMultipleTracks = tracks.length > 1
  // 트랙이 1개면 곧바로 그 트랙을 골라 자동 재생(기존 동작 그대로), 여러 개면 아직 아무것도
  // 선택되지 않은 상태로 시작해 드롭다운에서 고르게 한다.
  const [selectedIndex, setSelectedIndex] = useState<number | null>(hasMultipleTracks ? null : 0)

  const trackPicker = hasMultipleTracks ? (
    <select
      aria-label="오디오 선택"
      value={selectedIndex ?? ""}
      onChange={(event) => {
        const value = event.target.value
        setSelectedIndex(value === "" ? null : Number(value))
      }}
      className="max-w-28 shrink-0 truncate rounded-md border border-outline-variant bg-transparent px-1.5 py-1 font-code-sm text-code-sm text-on-surface-variant transition-colors hover:border-primary hover:text-primary dark:border-outline-variant/20 dark:hover:border-primary-fixed dark:hover:text-primary-fixed"
    >
      <option value="" disabled>
        오디오 선택
      </option>
      {tracks.map((url, index) => (
        <option key={url} value={index}>
          {deriveTrackLabel(url, index)}
        </option>
      ))}
    </select>
  ) : null

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-gutter">
      <m.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 32 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="pointer-events-auto flex w-full max-w-lg items-center gap-3 rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 py-3 shadow-lg dark:border-outline-variant/20"
      >
        {selectedIndex !== null ? (
          <AudioTrackPlayer
            key={selectedIndex}
            src={tracks[selectedIndex]}
            initialTime={initialTime}
            onTimeUpdate={onTimeUpdate}
            onClose={onClose}
            trackPicker={trackPicker}
          />
        ) : (
          <>
            {trackPicker}
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="ml-auto flex shrink-0 items-center text-on-surface-variant transition-colors hover:text-primary dark:hover:text-primary-fixed"
            >
              <X className="size-4" />
            </button>
          </>
        )}
      </m.div>
    </div>,
    document.body
  )
}
