---
name: Kinetic Infrastructure
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#b9cbbc'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#849587'
  outline-variant: '#3b4b3f'
  surface-tint: '#00e38a'
  primary: '#f3fff3'
  on-primary: '#00391f'
  primary-container: '#00ff9c'
  on-primary-container: '#007142'
  inverse-primary: '#006d40'
  secondary: '#7bd0ff'
  on-secondary: '#00354a'
  secondary-container: '#00a6e0'
  on-secondary-container: '#00374d'
  tertiary: '#fdfbff'
  on-tertiary: '#263143'
  tertiary-container: '#d5e0f8'
  on-tertiary-container: '#586377'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#56ffa7'
  primary-fixed-dim: '#00e38a'
  on-primary-fixed: '#002110'
  on-primary-fixed-variant: '#00522f'
  secondary-fixed: '#c4e7ff'
  secondary-fixed-dim: '#7bd0ff'
  on-secondary-fixed: '#001e2c'
  on-secondary-fixed-variant: '#004c69'
  tertiary-fixed: '#d8e3fb'
  tertiary-fixed-dim: '#bcc7de'
  on-tertiary-fixed: '#111c2d'
  on-tertiary-fixed-variant: '#3c475a'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1200px
  gutter: 24px
  section-gap: 80px
  stack-sm: 4px
  stack-md: 12px
  stack-lg: 24px
---

## Brand & Style
The design system is engineered for the high-performance backend developer, evoking a sense of reliability, architectural integrity, and technical precision. The aesthetic is a fusion of **Corporate Modern** and **Technical Minimalism**, focusing on the beauty of logic and structure rather than ornamental flair. 

The target audience consists of technical recruiters, engineering managers, and fellow developers who value efficiency and performance. The UI should feel like a premium command-center interface: robust, low-latency, and highly organized. Subtle background grid patterns and thin, precise borders reinforce the "under-the-hood" engineering narrative.

## Colors
The palette is built on a foundation of deep, stable neutrals to ensure a high-performance "dark mode" experience that reduces eye strain during long technical reviews.

- **Primary (Terminal Green):** Used exclusively for high-priority actions, status indicators, and success states. It represents operational health.
- **Secondary (Cyber Blue):** Used for interactive links, information highlights, and accentuating technical logic.
- **Surface Tiers:** The background utilizes a deep slate-gray (`#0F172A`), while containers and cards use a slightly lighter charcoal (`#1E293B`) to create hierarchical depth without relying on heavy shadows.
- **Borders:** A muted slate (`#334155`) is used for structural definition, mimicking the look of a technical schematic.

## Typography
This design system employs a dual-font strategy to balance human readability with technical authenticity.

- **Inter** handles the primary communication. It is utilized for headlines and body copy to maintain a professional, accessible tone.
- **JetBrains Mono** is the "voice of the machine." It is used for all technical metadata, labels, code snippets, and performance metrics. 
- **Scale:** Large headlines should be tightly tracked to feel impactful. Labels should always be monospaced to reinforce the developer-centric nature of the portfolio.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy on desktop, centered to create a focused reading experience. 

- **Grid:** A 12-column grid system with 24px gutters.
- **Breakpoints:** 
  - Desktop: 1200px+
  - Tablet: 768px - 1199px (Fluid margins)
  - Mobile: Under 768px (Single column, 16px horizontal padding)
- **Rhythm:** Use an 8px base unit. All padding and margins must be multiples of 8. Consistent vertical rhythm is crucial to maintaining the "technical" feel.
- **Background Detail:** A subtle 32px x 32px grid pattern is applied to the base background in a low-contrast stroke (`rgba(255,255,255,0.03)`) to provide visual structure.

## Elevation & Depth
Depth is communicated through **Tonal Layering** and **Low-Contrast Outlines** rather than traditional shadows.

- **Base Layer:** Deepest neutral (`#0F172A`).
- **Elevated Layer (Cards/Modals):** Mid-neutral (`#1E293B`) with a 1px solid border (`#334155`).
- **Interactive State:** On hover, borders transition to the Primary Terminal Green at 40% opacity, and a subtle "glow" is achieved via a small 8px blur shadow of the same color.
- **Glassmorphism:** Navigation bars use a 12px backdrop blur with a 70% opacity fill of the base color to keep the background grid visible as the user scrolls.

## Shapes
The shape language is **Soft** but disciplined. 0.25rem (4px) corner radii are the standard for all components (buttons, cards, inputs). This creates a modern look that still feels "engineered" and avoids the playfulness of highly rounded or pill-shaped elements.

## Components
- **Project Cards:** Feature a monospaced "Status" header (e.g., `[DEPLOYED]`) in the top right. Use the secondary color for technical tags.
- **Buttons:** 
  - *Primary:* Solid Green background, black text for maximum contrast.
  - *Secondary:* Ghost style with 1px border and monospaced text.
- **Skill Cloud:** Unlike a typical tag cloud, these should be arranged in a rigid grid or a "dependency tree" visual, using monospaced labels.
- **Performance Optimization Timeline:** A vertical line component using the Secondary Blue color. Each node on the timeline should show a "Before" and "After" metric in monospace (e.g., `800ms -> 120ms`).
- **Input Fields:** Flat dark background with a 1px bottom border. On focus, the border animates to the primary green.
- **Code Snippets:** Use a specific container with "Window Controls" (Red/Yellow/Green dots) to mimic a terminal or IDE environment.
