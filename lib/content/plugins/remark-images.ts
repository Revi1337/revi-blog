import { visit } from "unist-util-visit"
import type { Root, Image } from "mdast"
import type { VFile } from "vfile"

import type { ArticleImage } from "@/lib/data/types"

/**
 * 모든 image 노드를 순서대로 순회해 order/src/alt를 ArticleImage[]로 수집하고, 각 노드에
 * data-lightbox-index hProperty를 부여한다. remark-toc.ts와 동일하게 AST 순회 한 패스로
 * "구조화된 목록 추출"과 "DOM 매칭용 속성 부여"를 함께 처리해, 본문 <img>의
 * data-lightbox-index가 항상 Article.images의 배열 인덱스와 일치하도록 보장한다
 * (research.md #3, contracts/lightbox-integration-contract.md #1).
 */
export function remarkImages() {
  return (tree: Root, file: VFile) => {
    const images: ArticleImage[] = []
    let order = 0

    visit(tree, "image", (node: Image) => {
      const index = order
      order += 1

      node.data = node.data ?? {}
      node.data.hProperties = { ...node.data.hProperties, "data-lightbox-index": index }

      images.push({ src: node.url, alt: node.alt ?? "", order: index })
    })

    file.data.images = images
  }
}
