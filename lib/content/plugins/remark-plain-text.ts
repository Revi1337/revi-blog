import { toString } from "mdast-util-to-string"
import type { Root } from "mdast"
import type { VFile } from "vfile"

/**
 * mdast 트리 전체를 순수 텍스트로 변환해 file.data.plainText에 저장한다. 코드 하이라이팅/KaTeX
 * 렌더링(rehype 단계) 이전의 원문 마크다운 AST에서 추출하므로, 검색 인덱스용 본문 텍스트로 쓰기에
 * 렌더링 산출물보다 노이즈가 적다 (research.md #2 참고).
 */
export function remarkPlainText() {
  return (tree: Root, file: VFile) => {
    file.data.plainText = toString(tree)
  }
}
