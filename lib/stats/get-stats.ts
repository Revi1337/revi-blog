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

  const [total, todayCount, yesterdayCount] = await Promise.all([
    redis.get<number>("visits:total"),
    redis.get<number>(`visits:daily:${today}`),
    redis.get<number>(`visits:daily:${yesterday}`),
  ])

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
