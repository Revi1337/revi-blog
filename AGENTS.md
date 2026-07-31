# revi-blog

## Development methodology
This project develops with spec-kit (Spec-Driven Development). `specs/<feature>/` holds each feature's spec.md, plan.md, and tasks.md; `.specify/memory/constitution.md` holds the project's non-negotiable development principles and gates. Check these before assuming a feature's requirements or constraints are undocumented.

## Fonts
- **Inter** — body text (`body-md`) only
- **JetBrains Mono** — labels/code/meta info (`label-caps`, `code-sm`): nav, buttons, badges, dates, tags, TOC, code blocks, footer
- **SUIT** — Hangul-only fallback for both of the above. Inter/JetBrains Mono are Latin-only subsets with no Hangul glyphs, so `--font-body-md`/`--font-label-caps`/`--font-code-sm` in `app/globals.css` list SUIT second (`Inter, SUIT, sans-serif` / `JetBrains Mono, SUIT, monospace`) — Latin characters still resolve to Inter/JetBrains Mono, only Hangul falls through to SUIT. Loaded via `next/font/local` in `app/layout.tsx` as `--font-suit`, self-hosted as static woff2 files (400/500/600/700) under `public/fonts/suit/` (sourced from `sunn-us/SUIT`, OFL-licensed — no npm package).
- **Pretendard** — headings only (`headline-xl`, `headline-lg`, `headline-lg-mobile`). Mixing Inter (Latin) + SUIT (Hangul) in one heading (e.g. "Python 코드") produces mismatched visual weight even at the same numeric `font-weight`, because the two typefaces are drawn independently. Pretendard's Latin glyphs are designed to sit naturally alongside its Hangul glyphs, so headings use Pretendard alone instead of the Inter+SUIT pair. Loaded via `next/font/local` as `--font-pretendard`, self-hosted as static woff2 (600/700 only — the two weights headings actually use) under `public/fonts/pretendard/` (sourced from `orioncactus/Pretendard`, OFL-licensed — static files, not the variable-font npm package).

Applies consistently across all 4 screens (`core/home-dark.html`, `core/home-light.html`, `core/article-detail-dark.html`, `core/article-detail-light.html`). Do not mix in other font families beyond Inter/JetBrains Mono/SUIT/Pretendard (e.g. Geist).

## Editing rule
`core/*.html` files always come in dark/light pairs. Any change to one (layout, copy, spacing, links, etc.) must be applied to its dark/light counterpart in the same edit — never update just one and leave the other stale.

## React / Next.js
This project uses Next.js. Before writing, reviewing, or refactoring any React/Next.js component, page, or data-fetching code, invoke the `vercel-react-best-practices` skill and apply its rules. This is mandatory, not optional — do not skip it even if the change looks small.

## Commit
Before creating any git commit in this repo, invoke the `commit` skill and follow its convention. This is mandatory, not optional — do not skip it even for small commits.

## Testing
By default, verify changes with an npm build, then drive the app in a real browser using the `playwright-cli` skill. When vision (looking at rendered pixels, not just DOM/console output) is needed, use the `playwright` MCP server's screenshot tools instead. If any check turns up an error, fix it before considering the change done.

## Upstash Redis (방문자/조회수 통계)
- **환경변수**: `lib/stats/redis.ts`는 `Redis.fromEnv()` 대신 `KV_REST_API_URL`/`KV_REST_API_TOKEN`을 직접 읽는다 — Vercel Marketplace로 연동된 Upstash는 `UPSTASH_REDIS_REST_*`가 아니라 `KV_REST_API_*` 이름으로 env를 생성하기 때문이다. 실제 값은 `vercel env pull .env.local`로만 채운다.
- **카운팅 로직을 미들웨어(`proxy.ts`)로 되돌리지 말 것**: 과거 미들웨어에서 prefetch 요청을 헤더로 걸러내려 했으나, Next가 미들웨어 호출 직전에 `next-router-prefetch` 등 FLIGHT_HEADERS를 전부 제거해버려(`node_modules/next/dist/server/web/adapter.js`) 구조적으로 구분이 불가능했다. 그래서 카운팅은 `app/api/track`(클라이언트 컴포넌트 마운트 시 호출)으로 옮겨져 있다.
- **런타임 분리**: `/api/track`(쓰기)은 Node 런타임 — slug 존재 검증(`getArticleBySlug`, `fs` 기반)이 필요해서다. `/api/stats`, `/api/stats/[slug]`(읽기)는 Edge 런타임(콜드스타트 회피)이라 이 검증이 없고, 존재하지 않는 slug도 조회수 0으로 응답한다.
- **"오늘" 날짜는 항상 KST 기준**: `lib/stats/get-stats.ts`의 `getKstDateString()`/`getKstYesterdayDateString()`을 거칠 것 — 서버 실행 시각은 UTC라 `new Date()`를 직접 비교하면 자정 근처에서 날짜가 하루 밀린다.

## ⚠️ IMPORTANT: `content/articles/**` changes require a `next dev` restart
`lib/data/articles.ts` loads all markdown via a **top-level `await loadArticles()`**, which runs once when the module is first evaluated and caches the parsed result (including the rendered HTML) for the life of the process. `loader.ts` reads `.md` files with `fs.readFileSync`, which is invisible to Turbopack/webpack's import-graph-based file watcher — so editing anything under `content/articles/` does **not** trigger Fast Refresh, unlike component/CSS changes.

**A browser refresh alone will never show the change.** To verify any edit to `content/articles/**` (including nested dirs like `content/articles/algorithm/`), you must kill the running `next dev` process and start it again — only then does the top-level await re-run and re-render the markdown. This applies whether the edit is frontmatter, body text, or a plugin-affecting change (callouts, images, code fences, etc.).
