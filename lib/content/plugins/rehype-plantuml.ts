import { visit } from "unist-util-visit"
import { toString as hastToString } from "hast-util-to-string"
import plantumlEncoder from "plantuml-encoder"
import type { Root, Element } from "hast"

import { PLANTUML_LIGHT_BORDER, PLANTUML_DARK_BORDER } from "@/lib/content/plantuml-colors"

/** PlantUML 공개 서버는 렌더링 결과 SVG 루트에 항상 `background:#FFFFFF`를 직접 굽는다(다크 테마
 * 파라미터 없음). 독자가 작성한 원본 코드(복사 버튼이 돌려주는 텍스트)는 건드리지 않고, 서버에
 * 보낼 인코딩 대상 텍스트에만 이 skinparam을 앞에 끼워 넣어 배경을 투명하게 만든다 — 이건 어떤
 * `!theme`을 쓰든(심지어 `_none_`이어도) 항상 필요하다. `!theme <name>`을 쓰면 텍스트/도형
 * 채우기/선 색을 한 번에 일관되게 바꿀 수 있지만(개별 skinparam을 다이어그램 타입별로 일일이
 * 지정하는 것보다 안정적), 사용자가 PlantUML 테마 갤러리(38종)를 직접 비교해보고 `_none_`(테마
 * 없음)을 선택했다 — 아래 LIGHT_SKIN/DARK_SKIN 참고. skinparam/`!theme` 줄은 `@start...` 첫
 * 줄 바로 뒤에 삽입해야 한다(실측 확인). */
function withPlantumlSkin(source: string, skinLines: readonly string[]): string {
  const startTagMatch = /^([^\n]*@start\w+[^\n]*\n)/.exec(source)
  const insertion = skinLines.map((line) => `${line}\n`).join("")
  if (!startTagMatch) return insertion + source
  return source.slice(0, startTagMatch[0].length) + insertion + source.slice(startTagMatch[0].length)
}

/** 내장 `!theme`(38종, 갤러리로 직접 비교함)을 하나씩 시도했지만 다크 모드에서 텍스트가 고정
 * 어두운 색이라 안 보이거나(`_none_`/`plain`/`lightgray`/`carbon-gray`), Mermaid와 톤이 전혀
 * 안 맞는 문제(cyborg-outline 등)가 반복됐다. 대신 Mermaid가 실제로 쓰는 색을
 * (`getComputedStyle`로 실측) 개별 skinparam으로 직접 지정한다 — Mermaid는 다크 박스
 * `#1f2020`/테두리·선·텍스트 `#cccccc`, 라이트는 박스 `#ececff`/테두리·선 `#9370db`/텍스트
 * `#333333`을 쓴다. PlantUML은 다이어그램 타입(시퀀스/클래스/유스케이스/액티비티/상태/컴포넌트)
 * 마다 skinparam 키 이름이 달라 하나씩 나열해야 하지만, 대신 이 블로그가 실제로 쓰는 색과
 * 픽셀 단위로 맞출 수 있다(named 테마로는 불가능했던 정밀도). */
function buildMonochromeSkin(fill: string, border: string, text: string): readonly string[] {
  return [
    "skinparam backgroundColor transparent",
    `skinparam DefaultFontColor ${text}`,
    `skinparam ArrowColor ${border}`,
    `skinparam ClassBackgroundColor ${fill}`,
    `skinparam ClassBorderColor ${border}`,
    `skinparam SequenceParticipantBackgroundColor ${fill}`,
    `skinparam SequenceParticipantBorderColor ${border}`,
    `skinparam SequenceLifeLineBorderColor ${border}`,
    `skinparam SequenceActorBackgroundColor ${fill}`,
    `skinparam SequenceActorBorderColor ${border}`,
    `skinparam ActorBackgroundColor ${fill}`,
    `skinparam ActorBorderColor ${border}`,
    `skinparam UsecaseBackgroundColor ${fill}`,
    `skinparam UsecaseBorderColor ${border}`,
    `skinparam ActivityBackgroundColor ${fill}`,
    `skinparam ActivityBorderColor ${border}`,
    `skinparam ActivityDiamondBackgroundColor ${fill}`,
    `skinparam ActivityDiamondBorderColor ${border}`,
    `skinparam StateBackgroundColor ${fill}`,
    `skinparam StateBorderColor ${border}`,
    `skinparam ComponentBackgroundColor ${fill}`,
    `skinparam ComponentBorderColor ${border}`,
    `skinparam DatabaseBackgroundColor ${fill}`,
    `skinparam DatabaseBorderColor ${border}`,
    // package { ... } 컨테이너(예: "웹 서버")는 Component와 별개 키를 쓴다 — 안 넣으면 테두리가
    // 기본값(#181818, 다크 모드에서 안 보임)으로 남는다(실측 확인).
    `skinparam PackageBackgroundColor ${fill}`,
    `skinparam PackageBorderColor ${border}`,
    `skinparam PackageFontColor ${text}`,
    // 상태 다이어그램의 시작(●)/종료(◎) 표시는 State가 아니라 Activity 네임스페이스 skinparam이
    // 담당한다(실측 확인 — StateStartColor/StateEndColor는 존재하지 않음). 다만 ActivityEndColor는
    // 바깥 링만 바꾸고 안쪽 점은 어떤 skinparam 조합으로도(activity 블록 형태, CircleColor 등
    // 10가지 넘게 실측) 항상 #222로 고정된다 — PlantUML 엔진에 하드코딩된 값으로 보임. 이 안쪽
    // 점은 plantuml-diagram-handler.tsx가 응답 SVG를 받은 뒤 문자열 치환으로 마저 고친다.
    `skinparam ActivityStartColor ${border}`,
    `skinparam ActivityEndColor ${border}`,
  ]
}

const LIGHT_SKIN = buildMonochromeSkin("#ececff", PLANTUML_LIGHT_BORDER, "#333333")
const DARK_SKIN = buildMonochromeSkin("#1f2020", PLANTUML_DARK_BORDER, PLANTUML_DARK_BORDER)

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
