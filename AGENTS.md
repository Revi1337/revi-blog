# revi-blog

## Fonts
- **Inter** — headings/titles/body text (`headline-xl`, `headline-lg`, `headline-lg-mobile`, `body-md`)
- **JetBrains Mono** — labels/code/meta info (`label-caps`, `code-sm`): nav, buttons, badges, dates, tags, TOC, code blocks, footer

Applies consistently across all 4 screens (`core/home-dark.html`, `core/home-light.html`, `core/article-detail-dark.html`, `core/article-detail-light.html`). Do not mix in other font families (e.g. Geist).

## Editing rule
`core/*.html` files always come in dark/light pairs. Any change to one (layout, copy, spacing, links, etc.) must be applied to its dark/light counterpart in the same edit — never update just one and leave the other stale.

## React / Next.js
This project uses Next.js. Before writing, reviewing, or refactoring any React/Next.js component, page, or data-fetching code, invoke the `vercel-react-best-practices` skill and apply its rules. This is mandatory, not optional — do not skip it even if the change looks small.

## Commit
Before creating any git commit in this repo, invoke the `commit` skill and follow its convention. This is mandatory, not optional — do not skip it even for small commits.
