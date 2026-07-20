/** `%%...%%`(및 미종료 시 EOF까지)를 mdast 파싱 이전에 완전히 제거한다(data-model.md CommentSpan) */
export function stripComments(rawBody: string): string {
  if (!rawBody.includes("%%")) return rawBody
  return rawBody.replace(/%%[\s\S]*?%%/g, "").replace(/%%[\s\S]*$/, "")
}
