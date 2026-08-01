import type { Redis } from "@upstash/redis"

interface StoredEntry {
  value: unknown
  expiresAt: number | null
}

// KV_REST_API_URL이 없는 로컬 dev에서 Upstash 계정 없이 방문자 통계를 테스트하기 위한
// in-memory 대체 구현. eval()은 실제 Lua를 실행하는 대신 track-visit.lua와 동일한
// GET/SET EX/INCR/SET EX NX 로직을 그대로 옮긴 것이므로, 스크립트가 바뀌면 여기도 같이
// 고쳐야 한다. 사용하는 메서드(get/mget/eval/scan/del)만 구현하고 Redis로 단언한다.
class LocalRedis {
  private store = new Map<string, StoredEntry>()

  private read(key: string): unknown {
    const entry = this.store.get(key)
    if (!entry) return null
    if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
      this.store.delete(key)
      return null
    }
    return entry.value
  }

  private write(key: string, value: unknown, ttlSeconds?: number): void {
    this.store.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    })
  }

  private incr(key: string): void {
    this.write(key, Number(this.read(key) ?? 0) + 1)
  }

  async get<TData>(key: string): Promise<TData | null> {
    return (this.read(key) as TData) ?? null
  }

  async mget<TData extends unknown[]>(...keys: string[]): Promise<TData> {
    return keys.map((key) => this.read(key)) as TData
  }

  async eval<TArgs extends unknown[], TData = unknown>(_script: string, keys: string[], args: TArgs): Promise<TData> {
    const [dedupKey, totalKey, dailyKey, cooldownKey, pageviewKey] = keys
    const [dedupTtl, cooldownTtl, hasSlug] = args as unknown as [string, string, string]

    if (this.read(dedupKey) === null) {
      this.write(dedupKey, "1", Number(dedupTtl))
      this.incr(totalKey)
      this.incr(dailyKey)
    }

    if (hasSlug === "1" && this.read(cooldownKey) === null) {
      this.write(cooldownKey, "1", Number(cooldownTtl))
      this.incr(pageviewKey)
    }

    return 1 as TData
  }

  async scan(_cursor: string | number, opts?: { match?: string; count?: number }): Promise<[string, string[]]> {
    const prefix = opts?.match?.replace(/\*$/, "") ?? ""
    const keys = [...this.store.keys()].filter((key) => key.startsWith(prefix) && this.read(key) !== null)
    return ["0", keys]
  }

  async del(...keys: string[]): Promise<number> {
    return keys.filter((key) => this.store.delete(key)).length
  }
}

export const localRedis = new LocalRedis() as unknown as Redis
