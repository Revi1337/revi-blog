import fs from "node:fs"
import path from "node:path"

import { redis } from "@/lib/stats/redis"

const DAILY_VISIT_TTL_SECONDS = 60 * 60 * 24
const PAGEVIEW_COOLDOWN_SECONDS = 60

// Edge Runtime엔 fs가 없지만 이 모듈을 쓰는 /api/track은 getArticleBySlug(fs 기반)에
// 의존해 이미 Node 런타임이므로 안전하다.
const TRACK_VISIT_SCRIPT = fs.readFileSync(
  path.join(process.cwd(), "lib/stats/scripts/track-visit.lua"),
  "utf-8"
)

// 사이트 방문 dedup+집계와, slug가 유효할 때의 쿨다운+조회수 증가를 한 번의 EVAL로 묶어
// 원자적으로 실행한다 — slug가 없을 때 KEYS[4]/[5]는 스크립트에서 아예 참조되지 않으므로
// dedupKey를 자리채움으로 재사용해도 안전하다.
export async function recordVisit(ip: string, today: string, slug: string | undefined): Promise<void> {
  const dedupKey = `visited:${today}:${ip}`
  const hasSlug = slug !== undefined

  await redis.eval(
    TRACK_VISIT_SCRIPT,
    [
      dedupKey,
      "visits:total",
      `visits:daily:${today}`,
      hasSlug ? `track-cooldown:${ip}:${slug}` : dedupKey,
      hasSlug ? `pageviews:${slug}` : dedupKey,
    ],
    [String(DAILY_VISIT_TTL_SECONDS), String(PAGEVIEW_COOLDOWN_SECONDS), hasSlug ? "1" : "0"]
  )
}
