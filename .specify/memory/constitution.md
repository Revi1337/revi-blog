<!--
Sync Impact Report
- Version change: TEMPLATE (unratified) → 1.0.0
- Modified principles: none (first ratification, no prior named principles)
- Added principles:
  - I. Feature-Level Verification (NON-NEGOTIABLE)
  - II. Visual Consistency Across Dark/Light
- Added sections: Technology Constraints, Development Workflow, Governance
- Removed sections: unfilled template placeholders ([PRINCIPLE_3_NAME] through [PRINCIPLE_5_NAME] were
  intentionally not used — see deferred items below)
- Templates checked for consistency:
  - .specify/templates/plan-template.md ✅ (Constitution Check section reads this file dynamically at
    plan-generation time; no hardcoded principle text to update)
  - .specify/templates/spec-template.md ✅ (no constitution-specific references to update)
  - .specify/templates/tasks-template.md ✅ (no constitution-specific references to update; note for
    future /speckit-tasks runs: Principle I requires a verification task even though this template
    marks test tasks as optional by default)
  - AGENTS.md ✅ (already points to this file under "Development methodology"; no change needed)
- Deferred items: TODO(RATIFICATION_DATE) not applicable — ratified below as the date of first fill.
  Only two principles are defined; this project is small enough that a fixed count of five was not
  forced. Additional principles can be added later via /speckit-constitution as real needs surface.
-->

# revi-blog Constitution

## Core Principles

### I. Feature-Level Verification (NON-NEGOTIABLE)
Every feature MUST be verified by actually running it, not by code review or type-checking alone.
The default check is an `npm` build followed by driving the running app in a real browser via
`playwright-cli` — this is the priority path and MUST be attempted first. Switch to `playwright-mcp`
only when vision (inspecting rendered pixels, not just DOM/console state) is required to confirm the
change. Any error surfaced by either check MUST be fixed before the feature is considered done.

Rationale: this project is worked on by more than one agent (Claude Code and Antigravity) handing
features off to each other mid-pipeline. A feature that "looks correct" in a diff but was never
actually run accumulates silent breakage that is expensive to trace back once another agent has
already built on top of it.

### II. Visual Consistency Across Dark/Light
Any change to a `core/*.html` screen (layout, copy, spacing, links, or anything else) MUST be applied
to its dark/light counterpart in the same change — a screen MUST NOT exist in only one theme.
Typography is limited to Inter (headings/titles/body) and JetBrains Mono (labels/code/meta); no other
font family may be introduced.

Rationale: the dark/light pair is the product itself, not a cosmetic variant. Shipping one theme
updated and the other stale is equivalent to shipping a half-broken product.

## Technology Constraints
This project is moving from static `core/*.html` mockups to a Next.js/React implementation. When
writing, reviewing, or refactoring React/Next.js code, the `vercel-react-best-practices` skill's rules
apply. Prefer the framework's own primitives over custom implementations that route around them.

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

**Version**: 1.0.0 | **Ratified**: 2026-07-17 | **Last Amended**: 2026-07-17
