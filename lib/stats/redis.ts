import { Redis } from "@upstash/redis"

import { localRedis } from "@/lib/stats/local-redis"

// Upstash Marketplace 연동이 KV_REST_API_URL/TOKEN 이름으로 환경변수를 생성하므로
// Redis.fromEnv()(UPSTASH_REDIS_REST_URL 계열을 기대함) 대신 명시적으로 구성한다.
// KV_REST_API_URL이 없으면(로컬 dev) Upstash 계정 없이 in-memory mock으로 대체한다.

// Vercel은 자기 인프라에서 도는 모든 배포에 VERCEL=1을 자동으로 심어준다. 이게 없는데
// localhost/127.0.0.1이 아닌 KV_REST_API_URL이 잡혀 있다는 건, 로컬 머신(예: .env.production.local로
// `npm run build && npm start`)에서 실제 프로덕션 Upstash에 직접 붙었다는 뜻 — TrackVisit이 실제로
// 발동하면(브라우저로 열람 시) 진짜 서비스 통계가 그대로 오염되므로 눈에 띄게 경고해둔다.
if (process.env.KV_REST_API_URL && !process.env.VERCEL) {
  const isLocalRedis = /^https?:\/\/(localhost|127\.0\.0\.1)/.test(process.env.KV_REST_API_URL)
  if (!isLocalRedis) {
    console.warn(
      "⚠️  [lib/stats/redis.ts] Vercel 인프라 밖(로컬)에서 실제 프로덕션 Upstash에 연결됨 — 이 프로세스에서 발생하는 모든 방문/조회 기록이 실제 서비스 통계에 그대로 반영됩니다."
    )
  }
}

export const redis = process.env.KV_REST_API_URL
  ? new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN!,
    })
  : localRedis
