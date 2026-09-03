import type { Root, RootContent, Heading } from "mdast"

function isHeading(node: RootContent): node is Heading {
  return node.type === "heading"
}

/**
 * `nodes`(어떤 트리 레벨의 형제 노드 배열)를 순회하며, 헤딩을 만나면 "다음에 나오는 같은 레벨
 * 이상의 헤딩 직전까지"의 형제 노드를 모아 그 헤딩의 하위 콘텐츠로 묶는다. 헤딩이 아닌 노드는
 * 그대로 통과시킨다. 재귀 호출로 넘기는 그룹 내부는 정의상 현재 헤딩보다 깊은 헤딩만 있을 수
 * 있으므로(그렇지 않으면 이미 그룹 경계에서 끊겼을 것), 재귀가 곧 다단계 중첩을 만든다.
 */
function foldHeadings(nodes: RootContent[]): RootContent[] {
  const result: RootContent[] = []
  let i = 0

  while (i < nodes.length) {
    const node = nodes[i]
    if (!isHeading(node)) {
      result.push(node)
      i += 1
      continue
    }

    const depth = node.depth
    const groupChildren: RootContent[] = []
    i += 1
    while (i < nodes.length) {
      const next = nodes[i]
      if (isHeading(next) && next.depth <= depth) break
      groupChildren.push(next)
      i += 1
    }

    const summary = {
      type: "headingFoldSummary",
      data: { hName: "summary" },
      children: [node],
    }

    const details = {
      type: "headingFoldSection",
      data: {
        hName: "details",
        hProperties: {
          open: true,
          className: ["heading-fold"],
          "data-heading-level": depth,
        },
      },
      children: [summary, ...foldHeadings(groupChildren)],
    }

    result.push(details as unknown as RootContent)
  }

  return result
}

/**
 * 헤딩(h1~h6)마다 접기/펼치기 토글을 붙이기 위해, flat하게 나열된 mdast를 헤딩 depth 기준으로
 * 재귀 중첩된 `<details>/<summary>` 트리로 재구성한다(spec.md FR-001/FR-002). 콜아웃
 * (remark-callout.ts)과 동일하게 mdast-util-to-hast의 `data.hName`/`hProperties` 관례로 새
 * hast 태그를 지정하고, 원래 children은 그대로 넘겨 이후 단계(remarkRehype 등)가 평소처럼
 * 계속 변환하게 한다 — `hChildren`은 쓰지 않는다(콘텐츠 자체를 새로 만드는 게 아니라 기존
 * 콘텐츠를 감싸기만 하므로).
 *
 * 문서 최상위 레벨(`tree.children`)의 헤딩만 대상으로 한다 — 콜아웃/리스트 등에 중첩된 헤딩은
 * 이 블로그의 실제 저작 관례상 나타나지 않는 것으로 가정하고 그대로 둔다(research.md §3).
 * remark 체인의 마지막(다른 콘텐츠 변환 플러그인이 모두 끝난 뒤, remarkRehype 직전)에 실행해야
 * 앞선 플러그인들이 원래의 flat한 구조를 전제로 동작해도 깨지지 않는다(research.md §2).
 */
export function remarkHeadingFold() {
  return (tree: Root) => {
    tree.children = foldHeadings(tree.children) as Root["children"]
  }
}
