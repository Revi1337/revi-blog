"use client"

import { Play } from "lucide-react"

/** 날짜/조회수와 같은 메타 줄에 붙는 아이콘 전용 트리거 — article-thumbnail-button.tsx와
 * 동일한 스타일(테두리 없는 size-4 아이콘)을 공유해 같은 세트로 보이게 한다. 클릭하면
 * ArticleHeader가 소유한 재생 상태를 열고 재생을 시작한다. `article.audio`가 없는 글에는
 * ArticleHeader가 아예 렌더하지 않는다. */
export function ArticleAudioButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Play audio narration"
      title="Play audio narration"
      onClick={onClick}
      className="flex items-center text-primary transition-colors hover:text-primary/70 dark:text-primary-container dark:hover:text-primary-container/70"
    >
      <Play className="size-4" />
    </button>
  )
}
