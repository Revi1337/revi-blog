import probe from "probe-image-size"
import { visit } from "unist-util-visit"
import type { Root, Image } from "mdast"
import type { VFile } from "vfile"

import type { ArticleImage } from "@/lib/data/types"

// 모든 글을 통틀어 같은 원격 이미지 URL이 재사용될 수 있고, loadArticles()가 글들을
// Promise.all로 동시에 렌더링하므로 프로세스 생애주기 동안 URL당 한 번만 프로브하도록
// 모듈 스코프에 캐싱한다. 실패(네트워크 에러 등)도 null로 캐싱해 같은 깨진 URL을 반복 재시도하지 않는다.
const dimensionCache = new Map<string, Promise<{ width: number; height: number } | null>>()

// 214개(전체 글 이미지 수)를 한꺼번에 원격으로 프로브하면 R2에 순간적으로 과도한 동시 요청이
// 몰리므로, 전역 세마포어로 동시 프로브 수를 제한한다.
const PROBE_CONCURRENCY = 12
let active = 0
const queue: Array<() => void> = []

async function withLimit<T>(fn: () => Promise<T>): Promise<T> {
  if (active >= PROBE_CONCURRENCY) {
    await new Promise<void>((resolve) => queue.push(resolve))
  }
  active += 1
  try {
    return await fn()
  } finally {
    active -= 1
    queue.shift()?.()
  }
}

function probeDimensions(src: string): Promise<{ width: number; height: number } | null> {
  const cached = dimensionCache.get(src)
  if (cached) return cached

  const promise = withLimit(async () => {
    try {
      const result = await probe(src)
      return { width: result.width, height: result.height }
    } catch {
      return null
    }
  })

  dimensionCache.set(src, promise)
  return promise
}

/**
 * 모든 image 노드를 순서대로 순회해 order/src/alt를 ArticleImage[]로 수집하고, 각 노드에
 * data-lightbox-index hProperty를 부여한다. remark-toc.ts와 동일하게 AST 순회 한 패스로
 * "구조화된 목록 추출"과 "DOM 매칭용 속성 부여"를 함께 처리해, 본문 <img>의
 * data-lightbox-index가 항상 Article.images의 배열 인덱스와 일치하도록 보장한다
 * (research.md #3, contracts/lightbox-integration-contract.md #1).
 *
 * 각 이미지의 실제 width/height도 함께 프로브해 <img width height> 속성으로 심어준다.
 * 브라우저는 이 속성으로 로드 전에도 실제 비율의 공간을 미리 예약하므로, 원격 이미지가
 * 뒤늦게 로드돼도 이미 렌더된 본문 텍스트를 아래로 밀어내는 레이아웃 시프트가 사라진다.
 * 프로브 실패 시(네트워크 오류 등) width/height 없이 기존 동작으로 폴백한다.
 */
export function remarkImages() {
  return async (tree: Root, file: VFile) => {
    const nodes: Image[] = []
    visit(tree, "image", (node: Image) => {
      nodes.push(node)
    })

    const images: ArticleImage[] = []
    const dimensions = await Promise.all(nodes.map((node) => probeDimensions(node.url)))

    nodes.forEach((node, index) => {
      node.data = node.data ?? {}
      node.data.hProperties = {
        ...node.data.hProperties,
        "data-lightbox-index": index,
        ...(dimensions[index] ? { width: dimensions[index].width, height: dimensions[index].height } : {}),
      }

      images.push({ src: node.url, alt: node.alt ?? "", order: index })
    })

    file.data.images = images
  }
}
