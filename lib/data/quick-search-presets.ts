export interface QuickSearchPreset {
  id: string
  /** 버튼 표시 이름이자, 활성화 시 'Entry Stream' 헤더 필터 라벨에도 그대로 노출된다 */
  label: string
  /** 1~3개. TagIndex.matchAll 기준 AND 매칭 대상 */
  tags: string[]
}

/**
 * 개수를 고정하지 않는다(spec FR-015) — 콘텐츠가 늘어나면 이 배열에 항목을 추가하는 것만으로 확장한다.
 * 초기값은 spec.md Assumptions가 제안한 3개 예시를 그대로 사용한다.
 */
export const quickSearchPresets: QuickSearchPreset[] = [
  { id: "algorithm-concept", label: "Algorithm", tags: ["algorithm", "concept"] },
  { id: "grpc", label: "gRPC", tags: ["gRPC"] },
  { id: "kafka", label: "Kafka", tags: ["kafka", "spark"] },
  { id: "spark", label: "Spark", tags: ["spark"] },
  { id: "oauth2-security", label: "OAuth2", tags: ["oauth2", "security"] },
]
