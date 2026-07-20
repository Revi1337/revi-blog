import { visit } from "unist-util-visit"
import { toString } from "mdast-util-to-string"
import type { Root } from "mdast"
import type { VFile } from "vfile"

const BLOCK_TEXT_TYPES = new Set(["paragraph", "heading", "tableCell"])

/**
 * mdast 트리를 순수 텍스트로 변환해 file.data.plainText에 저장한다. 코드 하이라이팅/KaTeX
 * 렌더링(rehype 단계) 이전의 원문 마크다운 AST에서 추출하므로, 검색 인덱스용 본문 텍스트로 쓰기에
 * 렌더링 산출물보다 노이즈가 적다 (research.md #2 참고).
 *
 * mdast-util-to-string을 트리 전체에 한 번만 적용하면 문단 경계에 아무 구분자도 넣지 않아 "Overview"
 * 헤딩 바로 다음 문단이 "OverviewG1 vs ZGC..."처럼 붙어버린다(검색 결과 발췌문 가독성 저하). 문단/헤딩/
 * 표 셀 단위(BLOCK_TEXT_TYPES)로 나눠 각각 toString한 뒤 공백으로 이어붙여 블록 경계를 보존한다.
 */
export function remarkPlainText() {
  return (tree: Root, file: VFile) => {
    const blocks: string[] = []

    visit(tree, (node) => {
      if (BLOCK_TEXT_TYPES.has(node.type)) {
        const text = toString(node).trim()
        if (text) blocks.push(text)
        return "skip"
      }
    })

    file.data.plainText = blocks.join(" ")
  }
}
