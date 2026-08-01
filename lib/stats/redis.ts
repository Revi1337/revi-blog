import { Redis } from "@upstash/redis"

import { localRedis } from "@/lib/stats/local-redis"

// Upstash Marketplace 연동이 KV_REST_API_URL/TOKEN 이름으로 환경변수를 생성하므로
// Redis.fromEnv()(UPSTASH_REDIS_REST_URL 계열을 기대함) 대신 명시적으로 구성한다.
// KV_REST_API_URL이 없으면(로컬 dev) Upstash 계정 없이 in-memory mock으로 대체한다.
export const redis = process.env.KV_REST_API_URL
  ? new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN!,
    })
  : localRedis
