<!--
Sync Impact Report
- Version change: 1.2.0 → 2.0.0
- Modified principles:
  - II. Visual Consistency Across Dark/Light — REMOVED (see below)
  - III. Mandatory vercel-react-best-practices Compliance (NON-NEGOTIABLE) — renumbered to II
    (content unchanged, only its internal cross-reference from Technology Constraints was updated)
- Removed principles:
  - II. Visual Consistency Across Dark/Light — the `core/*.html` dark/light mockup pair this principle
    gated has not been the project's source of truth for a long time: real implementation work happens
    entirely in `app/`/`components/` (144 commits touching those paths vs. 7 ever touching `core/`, the
    last of which was 2026-07-21, ten days stale against the live app at the time of this amendment).
    `core/*.html` is retained only as a frozen historical design reference from project bootstrap, not a
    file pair that future changes are obligated to keep in sync. The corresponding "## Editing rule"
    section was already removed from AGENTS.md in the same effort; this amendment brings the
    constitution's gate in line with that decision.
- Added sections: none
- Removed sections: none
- Templates checked for consistency:
  - .specify/templates/plan-template.md ✅ (Constitution Check reads this file dynamically; no
    hardcoded principle text to update)
  - .specify/templates/spec-template.md ✅ (no dark/light or core/*.html references)
  - .specify/templates/tasks-template.md ✅ (no dark/light or core/*.html references)
  - AGENTS.md ✅ (matching "## Editing rule" section already removed in a prior change)
  - No other command/skill files reference "Visual Consistency" or the dark/light pairing rule.
- Deferred items: none
-->

# revi-blog Constitution

## Core Principles

### I. Feature-Level Verification (NON-NEGOTIABLE)
Every feature MUST be verified by actually running it, not by code review or type-checking alone.
The default check is an `npm` build followed by driving the running app in a real browser using the
`playwright-cli` skill. Switch to the `playwright` MCP server's screenshot tools only when vision
(inspecting rendered pixels, not just DOM/console state) is required to confirm the change. Any error
surfaced by any of these checks MUST be fixed before the feature is considered done.

**⚠️ `content/articles/**` changes require a `next dev` restart to verify (NON-NEGOTIABLE).**
`lib/data/articles.ts` loads every file under `content/articles/**` via a top-level
`await loadArticles()` that runs exactly once, when the module is first evaluated, and caches the
rendered result (parsed frontmatter + HTML) for the life of the process. `loader.ts` reads markdown
with `fs.readFileSync`, which is invisible to Turbopack/webpack's import-graph-based file watcher — so
editing anything under `content/articles/**` (any nesting, e.g. `content/articles/algorithm/`) does
**NOT** trigger Fast Refresh, unlike component/CSS edits. A browser refresh alone will **never** show
the change. Before treating any `content/articles/**` edit as verified, the running `next dev` process
MUST be killed and restarted (or `npm run build` re-run) so the top-level await re-executes — refreshing
the browser against a stale process is not verification, it is confirming cached output.

Rationale: this project is worked on by more than one agent (Claude Code and Antigravity) handing
features off to each other mid-pipeline. A feature that "looks correct" in a diff but was never
actually run accumulates silent breakage that is expensive to trace back once another agent has
already built on top of it. The `content/articles/**` caching behavior is a specific, easy-to-miss
instance of this: it was discovered mid-session when a markdown fix appeared unverified against a
process that had cached the pre-fix content, and it is called out explicitly here because it silently
defeats Principle I's browser-verification step in a way that produces false-positive confidence.

### II. Mandatory vercel-react-best-practices Compliance (NON-NEGOTIABLE)
Before writing, reviewing, or refactoring any React/Next.js code, the rule files under
`.agents/skills/vercel-react-best-practices/rules/` MUST actually be opened and consulted — general
React/Next.js knowledge is not a substitute. Before a React/Next.js feature is considered done, its
code MUST be explicitly audited against the applicable rules in that skill, and any violation found
MUST be fixed, not merely noted.

Rationale: this project already shipped a full feature's worth of components once without opening the
skill first, relying on general knowledge instead — a real violation (missing `LazyMotion`/`domAnimation`
bundle-size handling) was only caught by a later, separate audit pass. Naming the skill in `AGENTS.md`
alone did not make it happen; this principle exists so `speckit-plan`/`speckit-analyze` treat skipping
the audit as a gate failure, not a style preference.

## Technology Constraints
The project's live implementation is Next.js/React under `app/`/`components/`. The static `core/*.html`
screens from project bootstrap are a frozen historical design reference, not a maintained artifact —
they are not required to track subsequent implementation changes. Prefer the framework's own primitives
over custom implementations that route around them. See Principle II for the mandatory
vercel-react-best-practices audit this implies.

## Development Workflow
Development follows spec-kit (Spec-Driven Development): `speckit-specify` → `speckit-plan` →
`speckit-tasks` → `speckit-implement`, repeated per feature. This constitution's principles —
particularly Feature-Level Verification — are the gates `speckit-plan` checks against under
"Constitution Check" and that `speckit-tasks` must turn into concrete tasks. Commits follow the
`commit` skill's convention (Korean subject/body, `-` bullets, no footer).

Day-to-day conventions that don't need a plan-time gate (font details, editing habits, which skill to
invoke when) live in `AGENTS.md`, not here. This file holds only what must be checked for every feature.

## Governance
This constitution supersedes ad-hoc practice for anything it explicitly covers. Amendments are made
via `/speckit-constitution` and MUST: (1) update the version below per semantic versioning — MAJOR for
backward-incompatible principle removal/redefinition, MINOR for a new principle or materially expanded
guidance, PATCH for wording/clarification only — and (2) re-check `.specify/templates/plan-template.md`,
`spec-template.md`, and `tasks-template.md` for consistency. Every `speckit-plan` run MUST verify
compliance with these principles before proceeding past Phase 0; violations must be justified in the
plan's Complexity Tracking section or the plan must be revised.

**Version**: 2.0.0 | **Ratified**: 2026-07-17 | **Last Amended**: 2026-08-01
