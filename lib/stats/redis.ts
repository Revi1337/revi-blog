import { Redis } from "@upstash/redis"

// Upstash Marketplace 연동이 KV_REST_API_URL/TOKEN 이름으로 환경변수를 생성하므로
// Redis.fromEnv()(UPSTASH_REDIS_REST_URL 계열을 기대함) 대신 명시적으로 구성한다.
export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})
