/** Vercel Preview 배포(PR별 *.vercel.app) 등 SITE_URL 미설정 환경에서도 sitemap/RSS가 항상
 * 실제 프로덕션 도메인을 가리키도록 하는 안전한 기본값 — 프로덕션에서는 반드시 환경변수로 override */
export const SITE_URL = process.env.SITE_URL ?? "https://blog.revi1337.com"

export const SITE_NAME = "Revi Blog"

/** 아티클 JSON-LD(BlogPosting) author 필드 전용 — 필자가 항상 본인 한 명인 개인 블로그라
 * frontmatter에 별도 author 필드를 두지 않고 고정값으로 사용 */
export const SITE_AUTHOR = "Revi"

/** 아티클에 description 프론트매터가 없을 때 OG/메타 description 폴백으로 쓰는 사이트 기본 설명 */
export const SITE_DESCRIPTION = "Revi's engineering blog"
