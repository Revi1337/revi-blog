# revi-blog

## Development methodology
This project develops with spec-kit (Spec-Driven Development). `specs/<feature>/` holds each feature's spec.md, plan.md, and tasks.md; `.specify/memory/constitution.md` holds the project's non-negotiable development principles and gates. Check these before assuming a feature's requirements or constraints are undocumented.

## Fonts
- **Inter** — headings/titles/body text (`headline-xl`, `headline-lg`, `headline-lg-mobile`, `body-md`)
- **JetBrains Mono** — labels/code/meta info (`label-caps`, `code-sm`): nav, buttons, badges, dates, tags, TOC, code blocks, footer
- **Pretendard** — Hangul-only fallback for both of the above. Inter/JetBrains Mono are Latin-only subsets with no Hangul glyphs, so every `--font-*` stack in `app/globals.css` lists Pretendard second (`Inter, Pretendard, sans-serif` / `JetBrains Mono, Pretendard, monospace`) — Latin characters still resolve to Inter/JetBrains Mono, only Hangul falls through to Pretendard. Loaded via `next/font/local` in `app/layout.tsx` as `--font-pretendard`.

Applies consistently across all 4 screens (`core/home-dark.html`, `core/home-light.html`, `core/article-detail-dark.html`, `core/article-detail-light.html`). Do not mix in other font families beyond Inter/JetBrains Mono/Pretendard (e.g. Geist).

## Editing rule
`core/*.html` files always come in dark/light pairs. Any change to one (layout, copy, spacing, links, etc.) must be applied to its dark/light counterpart in the same edit — never update just one and leave the other stale.

## React / Next.js
This project uses Next.js. Before writing, reviewing, or refactoring any React/Next.js component, page, or data-fetching code, invoke the `vercel-react-best-practices` skill and apply its rules. This is mandatory, not optional — do not skip it even if the change looks small.

## Commit
Before creating any git commit in this repo, invoke the `commit` skill and follow its convention. This is mandatory, not optional — do not skip it even for small commits.

## Testing
By default, verify changes with an npm build and by driving the app in a real browser via `playwright-cli`. When vision (looking at rendered pixels, not just DOM/console output) is needed, use the `playwright` MCP server's screenshot tools instead. If either check turns up an error, fix it before considering the change done.
