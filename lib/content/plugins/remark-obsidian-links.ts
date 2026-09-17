import { visit } from "unist-util-visit"
import type { Root, Text, Parent, Image, Link } from "mdast"
import type { VFile } from "vfile"

const WIKI_RE = /(!?)\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g
const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "svg", "webp", "avif", "bmp"])

/**
 * 옵시디언 embed(`![[파일명]]`, `![[파일명|별칭]]`)와 wikilink(`[[노트]]`, `[[노트|별칭]]`)를
 * 표준 mdast image/link 노드로 변환한다. 옵시디언의 embed 문법은 이미지 외에도 PDF·오디오·비디오·
 * 노트 임베드 등에 두루 쓰이는데, 이 블로그는 이미지 표시 UI만 있으므로 확장자가 이미지
 * (IMAGE_EXTENSIONS)일 때만 image 노드로 변환하고 그 외는 미해결 wikilink와 동일하게 평문으로
 * 남긴다. 이미지 embed는 `/attachments/<파일명>`으로 resolve하는데, 이는 옵시디언 vault의
 * attachments 폴더를 public/attachments/에 그대로 복사해두는 컨벤션과 맞물린다(원본 볼트 경로는
 * 배포 환경에 존재하지 않으므로 실물 파일을 리포에 커밋해야 함). public/images/는 이 저장소가
 * 직접 소유·커밋하는 정적 자산(기본 썸네일 등) 전용이라 별개로 유지한다 — vault에서 온 콘텐츠(attachments)와
 * 리포 자체 자산(images)을 출처 기준으로 구분한다.
 * wikilink는 file.data.wikilinkTargets(파일명·경로 → slug 매핑, loader.ts가 전체 글의 파일
 * 경로를 먼저 훑어 생성)로 해석하고, 대상 글을 찾지 못하면 깨진 링크 대신 평문으로 남긴다.
 * 옵시디언처럼 `.md` 확장자를 붙여 쓴 타겟(`[[Tree.md]]`, `[[경로/Tree.md]]`)도 동일하게
 * 해석되도록 lookup 전에 trailing `.md`를 대소문자 구분 없이 제거한다.
 */
export function remarkObsidianLinks() {
  return (tree: Root, file: VFile) => {
    const wikilinkTargets = (file.data.wikilinkTargets as Map<string, string> | undefined) ?? new Map()

    visit(tree, "text", (node: Text, index, parent: Parent | undefined) => {
      if (!parent || index === undefined) return
      if (!node.value.includes("[[")) return

      WIKI_RE.lastIndex = 0
      const matches = [...node.value.matchAll(WIKI_RE)]
      if (matches.length === 0) return

      const replacement: Array<Text | Image | Link> = []
      let cursor = 0
      for (const match of matches) {
        const start = match.index ?? 0
        if (start > cursor) {
          replacement.push({ type: "text", value: node.value.slice(cursor, start) })
        }

        const [, embedMarker, target, alias] = match
        const trimmedTarget = target.trim()
        const label = alias?.trim() || trimmedTarget

        if (embedMarker === "!" && hasImageExtension(trimmedTarget)) {
          replacement.push({ type: "image", url: resolveAttachmentUrl(trimmedTarget), alt: label })
        } else if (embedMarker === "!") {
          // PDF/오디오/비디오/노트 embed 등 이미지가 아닌 첨부 — 이 블로그는 표시 UI가 없으므로
          // 미해결 wikilink와 동일하게 평문으로 남긴다 (섣불리 img로 오인해 깨진 태그를 만들지 않음)
          replacement.push({ type: "text", value: label })
        } else {
          const slug = wikilinkTargets.get(stripMdExtension(trimmedTarget).toLowerCase())
          if (slug) {
            replacement.push({
              type: "link",
              url: `/article/${slug}`,
              children: [{ type: "text", value: label }],
            })
          } else {
            replacement.push({ type: "text", value: label })
          }
        }

        cursor = start + match[0].length
      }
      if (cursor < node.value.length) {
        replacement.push({ type: "text", value: node.value.slice(cursor) })
      }

      parent.children.splice(index, 1, ...(replacement as Parent["children"]))
      return index + replacement.length
    })
  }
}

function stripMdExtension(target: string): string {
  return target.replace(/\.md$/i, "")
}

function resolveAttachmentUrl(filename: string): string {
  return "/attachments/" + filename.split("/").map(encodeURIComponent).join("/")
}

function hasImageExtension(filename: string): boolean {
  const ext = filename.split(".").pop()?.toLowerCase()
  return ext !== undefined && IMAGE_EXTENSIONS.has(ext)
}
