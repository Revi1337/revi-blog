"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export const PLAYBACK_RATES = [1, 1.25, 1.5, 2] as const
export type PlaybackRate = (typeof PLAYBACK_RATES)[number]

interface UseAudioPlaybackOptions {
  initialTime: number
  /** timeupdate는 초당 여러 번 발생하므로 React state로 흘리지 않는다 — 호출부가 ref로 잡은
   * DOM에 직접 write하도록 콜백으로만 넘긴다(진행 막대/경과 시간 표시 전용). */
  onTimeUpdate: (currentTime: number) => void
  onEnded: () => void
}

/** <audio> 엘리먼트 하나를 감싸 재생/일시정지/탐색/배속 순환을 제공하는 훅. */
export function useAudioPlayback({ initialTime, onTimeUpdate, onEnded }: UseAudioPlaybackOptions) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState<PlaybackRate>(1)

  // 콜백을 ref에 담아두면 아래 effect가 매 렌더 재구독하지 않고도 항상 최신 콜백을 호출한다.
  const onTimeUpdateRef = useRef(onTimeUpdate)
  const onEndedRef = useRef(onEnded)
  useEffect(() => {
    onTimeUpdateRef.current = onTimeUpdate
    onEndedRef.current = onEnded
  })

  // 플레이어 인스턴스 하나의 수명 동안 고정값이라 마운트 시점 값만 캡처하면 충분하다.
  const initialTimeRef = useRef(initialTime)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = initialTimeRef.current

    // duration은 일부 mp3(정확한 길이 헤더가 없는 파일 등)에서 loadedmetadata 시점엔 아직
    // NaN/Infinity였다가 이후 durationchange로 뒤늦게 확정되는 경우가 있다 — loadedmetadata
    // 하나만 구독하면 그 순간 NaN이었을 때 0으로 고정된 채 다시는 갱신되지 않는다(진행률
    // 막대의 max도 0에 묶여 탐색 자체가 불가능해짐). 세 이벤트 모두에서 유효한 값일 때만
    // 반영해 언제 확정되든 놓치지 않게 한다.
    const updateDuration = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) setDuration(audio.duration)
    }
    const handleTimeUpdate = () => {
      onTimeUpdateRef.current(audio.currentTime)
      // durationchange/loadedmetadata가 브라우저별로 안 불리는 경우를 대비한 안전망 —
      // 이미 확정된 값이면 setDuration이 같은 값으로 바로 bail-out하므로 매 tick 호출해도
      // 추가 리렌더는 없다.
      updateDuration()
    }
    const handleLoadedMetadata = () => {
      updateDuration()
      // 메타데이터가 로드되기 전에 설정한 currentTime은 브라우저가 조용히 0으로 되돌리는
      // 경우가 있다(로드 타이밍에 따라 간헐적으로 재현) — 로드 완료 시점에 어긋나 있으면
      // 다시 한 번 확정해 이어듣기(FR-012) 위치가 0으로 리셋되지 않게 한다.
      if (Math.abs(audio.currentTime - initialTimeRef.current) > 0.5) {
        audio.currentTime = initialTimeRef.current
      }
    }
    const handleEnded = () => {
      setIsPlaying(false)
      onEndedRef.current()
    }

    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("durationchange", updateDuration)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.pause()
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("durationchange", updateDuration)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [])

  const play = useCallback(() => {
    audioRef.current?.play().catch(() => {})
    setIsPlaying(true)
  }, [])

  const pause = useCallback(() => {
    audioRef.current?.pause()
    setIsPlaying(false)
  }, [])

  const seek = useCallback((time: number) => {
    if (!audioRef.current) return
    audioRef.current.currentTime = time
    onTimeUpdateRef.current(time)
  }, [])

  const cyclePlaybackRate = useCallback(() => {
    setPlaybackRate((prev) => {
      const next = PLAYBACK_RATES[(PLAYBACK_RATES.indexOf(prev) + 1) % PLAYBACK_RATES.length]
      if (audioRef.current) audioRef.current.playbackRate = next
      return next
    })
  }, [])

  return { audioRef, isPlaying, duration, playbackRate, play, pause, seek, cyclePlaybackRate }
}
