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

## ⚠️ IMPORTANT: `content/articles/**` changes require a `next dev` restart
`lib/data/articles.ts` loads all markdown via a **top-level `await loadArticles()`**, which runs once when the module is first evaluated and caches the parsed result (including the rendered HTML) for the life of the process. `loader.ts` reads `.md` files with `fs.readFileSync`, which is invisible to Turbopack/webpack's import-graph-based file watcher — so editing anything under `content/articles/` does **not** trigger Fast Refresh, unlike component/CSS changes.

**A browser refresh alone will never show the change.** To verify any edit to `content/articles/**` (including nested dirs like `content/articles/algorithm/`), you must kill the running `next dev` process and start it again — only then does the top-level await re-run and re-render the markdown. This applies whether the edit is frontmatter, body text, or a plugin-affecting change (callouts, images, code fences, etc.).
