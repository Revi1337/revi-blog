"use client"

import { useRef, useState } from "react"
import { CalendarDays, History, Timer } from "lucide-react"
import Link from "next/link"
import dynamic from "next/dynamic"
import * as motion from "motion/react-client"
import { AnimatePresence } from "motion/react"

import type { Article } from "@/lib/data/types"
import { useWrapDetection } from "@/lib/hooks/use-wrap-detection"
import { ArticleThumbnailButton } from "@/components/article/article-thumbnail-button"
import { ArticleAudioButton } from "@/components/article/article-audio-button"
import { SeriesBox } from "@/components/article/series-box"
import { VisitorStatsWidget } from "@/components/stats/visitor-stats-widget"

// 재생 버튼을 누르기 전까지는 전혀 필요 없으므로 지연 로드한다 — nav-bar.tsx의 SearchModal과
// 동일한 패턴(bundle-dynamic-imports).
const ArticleAudioPlayer = dynamic(
  () => import("@/components/article/article-audio-player").then((m) => m.ArticleAudioPlayer),
  { ssr: false }
)

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  })
}

// 바깥 flex row의 가로 gap을 gap-x-8(32px)로 넓혀서, 그 gap 공간 안에 구분자가 겹쳐 그려질
// 자리를 확보한다 — 세로 gap(줄바꿈된 줄 사이 간격)은 원래대로 gap-y-4(16px)를 유지해야 하므로
// gap-x/gap-y를 분리했다. 각 항목(wrapper)에는 별도 padding을 주지 않는다 — 이전엔 pl-8로
// wrapper 안에 구분자 자리를 고정 확보하고 줄바꿈됐을 때 translate로 그 자리를 시각적으로만
// 상쇄했는데, transform은 paint 단계에서만 적용될 뿐 실제 레이아웃(gap 계산)에는 전혀
// 관여하지 않아, 줄바꿈된 항목 뒤에 오는 형제가 "translate 적용 전의, 아직 넓은 채인 박스"를
// 기준으로 배치되면서 그 사이에 원래 폭의 2~3배에 달하는 유령 여백이 생겼다(504px에서 실측
// 재현). 구분자를 각 wrapper의 padding이 아니라 absolute로 통째로 flow 밖에 두면, wrapper의
// 레이아웃 폭이 구분자·줄바꿈 상태와 완전히 무관하게 "아이콘+텍스트"만으로 고정되므로 이
// 문제도, 앞서 겪었던 무한 루프(614px에서 재현)도 원천적으로 발생할 수 없다.
function Separator({ hidden }: { hidden: boolean }) {
  if (hidden) return null
  return (
    <span className="absolute top-0 -left-6 flex h-5 w-4 items-center justify-center text-outline-variant dark:text-outline-variant/40">
      |
    </span>
  )
}

export function ArticleHeader({ article }: { article: Article }) {
  // updatedAt/reading-time/thumbnail은 각각 앞에 구분자를 달고 있는데, 이 셋 중 하나라도
  // 줄바꿈으로 새 줄의 첫머리에 놓이면 그 구분자를 감춰야 한다(이전 줄 끝에 구분자만 덩그러니
  // 남거나, 새 줄이 구분자로 시작하는 상태를 막기 위해) — date는 항상 이 줄의 첫 항목이라
  // 구분자가 없으므로 추적 대상에서 제외한다.
  const updatedAtIndex = article.updatedAt ? 0 : -1
  const readingTimeIndex = article.updatedAt ? 1 : 0
  // frontmatter의 audio는 단일 문자열(트랙 1개)이든 배열(챕터별 여러 트랙)이든 둘 다 받는다 —
  // 이후 로직은 전부 이 정규화된 배열 하나만 보고 판단한다.
  const audioTracks = article.audio
    ? Array.isArray(article.audio)
      ? article.audio
      : [article.audio]
    : []
  const hasAudio = audioTracks.length > 0
  const audioIndex = hasAudio ? readingTimeIndex + 1 : -1
  const thumbnailIndex = article.thumbnail ? readingTimeIndex + 1 + (hasAudio ? 1 : 0) : -1
  const trackedItemCount = readingTimeIndex + 1 + (hasAudio ? 1 : 0) + (article.thumbnail ? 1 : 0)
  const { setItemRef, wrapped } = useWrapDetection(trackedItemCount)

  // 재생 상태는 새 Context 없이 ArticleHeader가 직접 소유한다(research.md §2) — 소비자가
  // 트리거 버튼과 하단 플레이어 단 둘뿐이라 앱 전역 Provider를 둘 이유가 없다. lastPositionRef는
  // 닫기(X) 후 같은 페이지에 머무는 동안 이어듣기(FR-012)를 위한 마지막 재생 위치 보존용 —
  // 플레이어가 언마운트돼도(닫기) 이 값은 ArticleHeader에 남아있고, 페이지를 벗어나면
  // ArticleHeader 자체가 언마운트되며 함께 소멸한다.
  const [isAudioOpen, setIsAudioOpen] = useState(false)
  // 렌더 중에 ref.current를 직접 읽지 않도록, 열 때(이벤트 핸들러 안에서) 그 순간의 값을
  // openInitialTime state로 한 번 캡처해 플레이어에 넘긴다 — lastPositionRef 자체는 그대로
  // 재생 위치 갱신용 트랜지언트 저장소로 유지한다.
  const [openInitialTime, setOpenInitialTime] = useState(0)
  const lastPositionRef = useRef(0)

  return (
    <header className="space-y-4">
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="font-headline-xl text-headline-xl leading-[1.1] text-on-surface"
      >
        {article.title}
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="space-y-3 border-y border-outline-variant py-6 font-code-sm text-sm text-on-surface dark:border-outline-variant/10"
      >
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="size-4 text-primary dark:text-primary-container" />
            <span>{formatDate(article.date)}</span>
          </div>
          {article.updatedAt ? (
            <div
              ref={setItemRef(updatedAtIndex)}
              className="relative flex h-5 items-center gap-1.5"
            >
              <Separator hidden={wrapped[updatedAtIndex]} />
              <History className="size-4 text-primary dark:text-primary-container" />
              <span>{formatDate(article.updatedAt)}</span>
            </div>
          ) : null}
          <div
            ref={setItemRef(readingTimeIndex)}
            className="relative flex h-5 items-center gap-1.5"
          >
            <Separator hidden={wrapped[readingTimeIndex]} />
            <Timer className="size-4 text-primary dark:text-primary-container" />
            <span>{article.readingTimeMinutes} min read</span>
          </div>
          <VisitorStatsWidget variant="inline" articleSlug={article.slug} />
          {hasAudio ? (
            <div
              ref={setItemRef(audioIndex)}
              className="relative flex h-5 items-center"
            >
              <Separator hidden={wrapped[audioIndex]} />
              <ArticleAudioButton
                onClick={() => {
                  setOpenInitialTime(lastPositionRef.current)
                  setIsAudioOpen(true)
                }}
              />
            </div>
          ) : null}
          {article.thumbnail ? (
            <div
              ref={setItemRef(thumbnailIndex)}
              className="relative flex h-5 items-center"
            >
              <Separator hidden={wrapped[thumbnailIndex]} />
              <ArticleThumbnailButton src={article.thumbnail} />
            </div>
          ) : null}
        </div>
        {article.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 font-label-caps text-[10px] opacity-70 dark:opacity-50">
              Tags:
            </span>
            {article.tags.map((tag) => (
              <Link
                key={tag}
                href={`/?tag=${encodeURIComponent(tag)}`}
                className="rounded border border-outline-variant bg-surface-container px-2.5 py-0.5 font-code-sm text-[11px] text-on-surface-variant transition-colors hover:border-primary hover:text-primary dark:border-secondary/20 dark:text-secondary-fixed-dim dark:hover:border-primary-fixed dark:hover:text-primary-fixed"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}
      </motion.div>

      {article.series && article.series.length > 0 && (
        <div className="flex flex-col gap-3">
          {article.series.map((membership) => (
            <SeriesBox key={membership.id} membership={membership} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {isAudioOpen && hasAudio ? (
          <ArticleAudioPlayer
            key="audio-player"
            tracks={audioTracks}
            initialTime={openInitialTime}
            onTimeUpdate={(time) => {
              lastPositionRef.current = time
            }}
            onClose={() => setIsAudioOpen(false)}
          />
        ) : null}
      </AnimatePresence>
    </header>
  )
}
