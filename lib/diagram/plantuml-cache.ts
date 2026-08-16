const STORAGE_PREFIX = "plantuml-cache:"

// PlantUML 공개 서버 자체가 응답에 `Cache-Control: public, max-age=432000`(5일)을 실어 보낸다
// (실측 확인) — 굳이 다른 값을 새로 정하지 않고 서버가 이미 선언한 신선도 기준을 그대로 따른다.
const TTL_MS = 432000 * 1000

interface StoredEntry {
  v: string | null
  t: number
}

function isStoredEntry(value: unknown): value is StoredEntry {
  if (typeof value !== "object" || value === null) return false
  const record = value as Record<string, unknown>
  return (typeof record.v === "string" || record.v === null) && typeof record.t === "number"
}

/** encoded 값(다크/라이트별로 다른, 다이어그램 원본 텍스트를 그대로 인코딩한 문자열) 자체가
 * 콘텐츠 해시나 마찬가지라 — 원본이 한 글자라도 바뀌면 이 값도 통째로 달라진다 — 별도의 캐시
 * 무효화 로직이 필요 없다. 글을 수정해 다이어그램이 바뀌면 새 encoded 값이 자동으로 캐시 미스가
 * 되어 새로 받아온다. TTL은 "내용이 낡아서" 있는 게 아니라, 다시는 조회되지 않을 옛 항목이
 * localStorage에 무한정 쌓이는 걸 막기 위한 것 — sweepExpiredPlantumlCache가 실제로 지운다. */
export function readPlantumlCache(encoded: string): string | null | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + encoded)
    if (raw === null) return undefined
    const parsed: unknown = JSON.parse(raw)
    if (!isStoredEntry(parsed)) return undefined
    if (Date.now() - parsed.t > TTL_MS) return undefined
    return parsed.v
  } catch {
    // 시크릿 모드 등에서 접근이 막히거나 저장된 값이 손상된 경우 캐시가 없는 것으로 취급한다 —
    // 아래에서 정상적으로 다시 fetch하면 되므로 페이지가 죽을 이유가 없다.
    return undefined
  }
}

export function writePlantumlCache(encoded: string, value: string | null): void {
  try {
    const entry: StoredEntry = { v: value, t: Date.now() }
    localStorage.setItem(STORAGE_PREFIX + encoded, JSON.stringify(entry))
  } catch {
    // 저장 공간이 꽉 찼거나 접근이 막혀도 방금 받아온 값은 이미 화면에 반영되므로 조용히 넘어간다
    // — 이번 방문에서만 캐싱 이득을 못 볼 뿐, 기능 자체는 정상 동작한다.
  }
}

/** 페이지 방문마다 한 번, 만료된 항목을 실제로 지운다 — TTL 검사만으로는 "다시 조회되는" 키만
 * 갱신될 뿐, 글이 수정되어 다시는 안 쓰이는 옛 encoded 값은 조회 자체가 없어 영원히 안 지워진다.
 * localStorage를 훑어 우리 접두사가 붙은 키 중 오래된 것만 능동적으로 제거한다. */
export function sweepExpiredPlantumlCache(): void {
  try {
    const now = Date.now()
    const staleKeys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key || !key.startsWith(STORAGE_PREFIX)) continue
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const parsed: unknown = JSON.parse(raw)
      if (!isStoredEntry(parsed) || now - parsed.t > TTL_MS) staleKeys.push(key)
    }
    staleKeys.forEach((key) => localStorage.removeItem(key))
  } catch {
    // 스윕은 순수 정리 작업이라 실패해도 렌더링에 영향이 없어야 한다 — 조용히 넘어간다.
  }
}
