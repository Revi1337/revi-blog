import { NextResponse } from "next/server"

import { articles } from "@/lib/data/articles"
import { redis } from "@/lib/stats/redis"

const PAGEVIEWS_PREFIX = "pageviews:"
const SCAN_COUNT = 100

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const validSlugs = new Set(articles.map((article) => article.slug))

  // proxy.ts가 오타/봇 스캔/삭제된 글의 /article/{slug} 요청에도 존재 검증 없이
  // pageviews:{slug}를 증가시키기 때문에(Edge라 fs 기반 검증 불가), 실제 글 목록에
  // 없는 slug의 키가 TTL 없이 영구히 쌓인다 — 여기서 주기적으로 걷어낸다.
  const orphanedKeys: string[] = []
  let cursor = "0"
  do {
    const [nextCursor, keys] = await redis.scan(cursor, {
      match: `${PAGEVIEWS_PREFIX}*`,
      count: SCAN_COUNT,
    })
    cursor = nextCursor
    for (const key of keys) {
      const slug = key.slice(PAGEVIEWS_PREFIX.length)
      if (!validSlugs.has(slug)) {
        orphanedKeys.push(key)
      }
    }
  } while (cursor !== "0")

  if (orphanedKeys.length > 0) {
    await redis.del(...orphanedKeys)
  }

  return NextResponse.json({ deleted: orphanedKeys.length, keys: orphanedKeys })
}
