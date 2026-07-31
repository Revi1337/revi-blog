import { redis } from "@/lib/stats/redis"

const KST_OFFSET_MS = 9 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

// "오늘"의 날짜 경계는 KST(UTC+9) 기준 — Edge Runtime의 서버 시각(UTC)과 무관하게
// 항상 한국 표준시로 자정을 판단해야 한다 (spec Assumptions).
export function getKstDateString(date: Date = new Date()): string {
  return new Date(date.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10)
}

export function getKstYesterdayDateString(date: Date = new Date()): string {
  return getKstDateString(new Date(date.getTime() - DAY_MS))
}

export interface GlobalStats {
  total: number
  today: number
  yesterday: number
}

export async function getGlobalStats(): Promise<GlobalStats> {
  const today = getKstDateString()
  const yesterday = getKstYesterdayDateString()

  // 별개의 GET 3개 대신 MGET 하나로 묶는다 — Upstash는 커맨드 단위로 과금/집계되므로
  // 같은 라운드트립에서 조회 가능한 키를 따로 보낼 이유가 없다.
  const [total, todayCount, yesterdayCount] = await redis.mget<[number | null, number | null, number | null]>(
    "visits:total",
    `visits:daily:${today}`,
    `visits:daily:${yesterday}`
  )

  return {
    total: total ?? 0,
    today: todayCount ?? 0,
    yesterday: yesterdayCount ?? 0,
  }
}

export async function getArticleViews(slug: string): Promise<number> {
  const views = await redis.get<number>(`pageviews:${slug}`)
  return views ?? 0
}
