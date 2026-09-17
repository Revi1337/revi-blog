/**
 * res.ok를 확인하지 않고 res.json()만 하면, 서버가 4xx/5xx여도 응답 본문이 유효한 JSON이면
 * SWR이 이를 정상 데이터로 착각한다 — 실패를 실패로 인식시키기 위해 명시적으로 던진다.
 */
export async function jsonFetcher<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Request to ${url} failed with status ${res.status}`)
  }
  return res.json()
}
