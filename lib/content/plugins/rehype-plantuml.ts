import { visit } from "unist-util-visit"
import { toString as hastToString } from "hast-util-to-string"
import plantumlEncoder from "plantuml-encoder"
import type { Root, Element } from "hast"

/** PlantUML 공개 서버는 렌더링 결과 SVG 루트에 항상 `background:#FFFFFF`를 직접 굽는다(다크 테마
 * 파라미터 없음). 독자가 작성한 원본 코드(복사 버튼이 돌려주는 텍스트)는 건드리지 않고, 서버에
 * 보낼 인코딩 대상 텍스트에만 이 skinparam을 앞에 끼워 넣어 배경을 투명하게 만든다.
 * `!theme <name>`은 텍스트/도형 채우기/선 색을 한 번에 일관되게 바꿔주는 PlantUML 내장 테마다
 * (개별 skinparam을 다이어그램 타입별로 일일이 지정하는 것보다 훨씬 안정적 — research.md 실측:
 * 기본 skinparam만 바꾼 버전은 화살표/생명선 같은 선 색이 그대로 어두워 다크 배경에서 거의 안 보임).
 * `cyborg-outline`은 `font-family`를 `'Verdana'`로 바꾸지만, 브라우저가 Verdana에 없는 글리프
 * (한글 등)는 시스템 폰트로 자동 대체하므로 한글 렌더링에 영향 없음(실측 확인 — 최초 우려는
 * 별도 확인용 HTML에 `<meta charset="utf-8">`을 빠뜨려 생긴 깨짐이었을 뿐, 실제 원인이 아니었음).
 * skinparam/`!theme` 줄은 `@start...` 첫 줄 바로 뒤에 삽입해야 한다(실측 확인). */
function withPlantumlSkin(source: string, skinLines: readonly string[]): string {
  const startTagMatch = /^([^\n]*@start\w+[^\n]*\n)/.exec(source)
  const insertion = skinLines.map((line) => `${line}\n`).join("")
  if (!startTagMatch) return insertion + source
  return source.slice(0, startTagMatch[0].length) + insertion + source.slice(startTagMatch[0].length)
}

/** cyborg-outline(다크)과 짝을 이루는 라이트 버전 — 둘 다 파란 계열 아웃라인 테마라 다크/라이트
 * 전환 시 같은 다이어그램처럼 느껴진다. plain/기본 렌더링은 사용자 확인 결과 다크 버전과 스타일이
 * 너무 달라(무채색 vs 파란 아웃라인) 테마 전환 시 "다른 다이어그램"처럼 보인다는 지적을 받고 교체. */
const LIGHT_SKIN = ["!theme cerulean-outline", "skinparam backgroundColor transparent"] as const
const DARK_SKIN = ["!theme cyborg-outline", "skinparam backgroundColor transparent"] as const

/** ```plantuml 코드펜스의 원본 텍스트를 다크/라이트 각각의 skinparam을 끼워 넣은 뒤 PlantUML
 * 공개 서버 URL 인코딩(deflate + 전용 base64)으로 미리 변환해 `pre`에
 * `data-plantuml-encoded-light`/`data-plantuml-encoded-dark`로 실어둔다. 화면에 보이는 코드
 * 텍스트와 복사 버튼이 돌려주는 텍스트는 원본 그대로다 — skinparam은 인코딩 대상에만 끼워
 * 넣힌다(spec.md Edge Case "원고를 그대로 렌더링해야 한다"는 화면 텍스트에 대한 요구이지 렌더링
 * 요청 자체에 대한 요구가 아니라고 해석).
 *
 * **rehypePrettyCode 이후에 실행해야 한다** — 실측 결과 rehypePrettyCode는 코드펜스마다 `pre`를
 * (기존 속성을 보존하며 데코레이션하는 것이 아니라) 완전히 새 엘리먼트로 교체한다. 그 앞에서
 * 심어둔 커스텀 속성은 전부 사라진다(research.md "신규 rehype 플러그인의 파이프라인 삽입 위치" —
 * 최초 결정은 이 사실을 놓쳐 빌드 이전이었으나, 실제 렌더링 결과로 확인 후 정정). 그 대신
 * `pre[data-language="plantuml"]`는 rehypePrettyCode가 이미 만들어주므로 그걸로 대상을 찾고,
 * 원본 텍스트는 `hast-util-to-string`으로 읽는다 — Shiki가 토큰을 `<span>`으로 감싸도 텍스트
 * 노드 자체는 바꾸지 않으므로(012 research.md와 동일 근거) 항상 원본과 정확히 일치한다.
 *
 * 순수 문자열 변환만 수행하고 네트워크 호출은 하지 않는다 — 이 플러그인이 빌드를 실패시키는
 * 경우는 없어야 한다(contracts/plantuml-rendering-contract.md #1 불변 조건). 실제 이미지 fetch는
 * PlantumlDiagramHandler(클라이언트)가 이 값을 읽어 담당한다. */
export function rehypePlantuml() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "pre" || node.properties["data-language"] !== "plantuml") return

      const source = hastToString(node)
      node.properties = {
        ...node.properties,
        "data-plantuml-encoded-light": plantumlEncoder.encode(withPlantumlSkin(source, LIGHT_SKIN)),
        "data-plantuml-encoded-dark": plantumlEncoder.encode(withPlantumlSkin(source, DARK_SKIN)),
      }
    })
  }
}
