/** rehype-plantuml.ts(빌드 타임, skinparam 주입)와 plantuml-diagram-handler.tsx(클라이언트,
 * 응답 SVG 후처리)가 같은 색을 참조해야 해서 별도 파일로 분리했다 — 둘 중 어느 쪽에도 무거운
 * 의존성이 없는 순수 상수 파일이라 클라이언트 번들에 끼워 넣어도 비용이 없다. Mermaid가 실제로
 * 쓰는 색을 그대로 가져왔다(`getComputedStyle`로 실측, rehype-plantuml.ts 참고). */
export const PLANTUML_LIGHT_BORDER = "#9370db"
export const PLANTUML_DARK_BORDER = "#cccccc"
