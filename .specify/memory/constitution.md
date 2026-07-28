<!--
Sync Impact Report
- Version change: 1.1.2 → 1.1.3
- Modified principles:
  - II. Visual Consistency Across Dark/Light — typography sentence was stale (still said "Inter
    (headings/titles/body) and JetBrains Mono (labels/code/meta); no other font family may be
    introduced"), predating two font changes already shipped in code: SUIT added as a self-hosted
    Hangul-only fallback for Inter/JetBrains Mono, and Pretendard added as a headings-only
    replacement for the Inter+SUIT pair (mixing the two in one heading produced mismatched visual
    weight at the same numeric font-weight). Updated to name all four font families and their scope.
- Added principles: none
- Added sections: none
- Removed sections: none
- Templates checked for consistency:
  - .specify/templates/plan-template.md ✅ (Constitution Check reads this file dynamically; no
    hardcoded principle text to update)
  - .specify/templates/spec-template.md ✅ (no font-related references)
  - .specify/templates/tasks-template.md ✅ (no constitution-specific references to update)
  - AGENTS.md ✅ (Fonts section already updated to the same four-font breakdown in the same change)
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

Rationale: this project is worked on by more than one agent (Claude Code and Antigravity) handing
features off to each other mid-pipeline. A feature that "looks correct" in a diff but was never
actually run accumulates silent breakage that is expensive to trace back once another agent has
already built on top of it.

### II. Visual Consistency Across Dark/Light
Any change to a `core/*.html` screen (layout, copy, spacing, links, or anything else) MUST be applied
to its dark/light counterpart in the same change — a screen MUST NOT exist in only one theme.
Typography is limited to four font families: Inter (body text), JetBrains Mono (labels/code/meta),
SUIT (Hangul-only fallback for both, since Inter/JetBrains Mono are Latin-only subsets), and
Pretendard (headings only — mixing Inter+SUIT in one heading produces mismatched visual weight at the
same numeric font-weight, so headings use Pretendard alone instead of that pair). No other font family
may be introduced.

Rationale: the dark/light pair is the product itself, not a cosmetic variant. Shipping one theme
updated and the other stale is equivalent to shipping a half-broken product.

### III. Mandatory vercel-react-best-practices Compliance (NON-NEGOTIABLE)
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
This project is moving from static `core/*.html` mockups to a Next.js/React implementation. Prefer the
framework's own primitives over custom implementations that route around them. See Principle III for
the mandatory vercel-react-best-practices audit this implies.

## Development Workflow
Development follows spec-kit (Spec-Driven Development): `speckit-specify` → `speckit-plan` →
`speckit-tasks` → `speckit-implement`, repeated per feature. This constitution's principles —
particularly Feature-Level Verification and Visual Consistency — are the gates `speckit-plan` checks
against under "Constitution Check" and that `speckit-tasks` must turn into concrete tasks. Commits
follow the `commit` skill's convention (Korean subject/body, `-` bullets, no footer).

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

**Version**: 1.1.3 | **Ratified**: 2026-07-17 | **Last Amended**: 2026-07-28
