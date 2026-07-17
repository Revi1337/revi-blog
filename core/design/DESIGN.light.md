---
name: Kinetic Infrastructure
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#3d4a41'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#6d7a70'
  outline-variant: '#bccabe'
  surface-tint: '#006d41'
  primary: '#006a40'
  on-primary: '#ffffff'
  primary-container: '#008652'
  on-primary-container: '#f6fff5'
  inverse-primary: '#64dd9b'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#4d5d73'
  on-tertiary: '#ffffff'
  tertiary-container: '#66768d'
  on-tertiary-container: '#fdfcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#82fab5'
  primary-fixed-dim: '#64dd9b'
  on-primary-fixed: '#002110'
  on-primary-fixed-variant: '#005230'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  headline-xl:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 16px
  container-max: 1440px
---

## Brand & Style

The design system embodies a high-performance, precision-engineered aesthetic tailored for infrastructure, cloud computing, and industrial logistics. The brand personality is efficient, reliable, and technologically advanced. It communicates speed and structural integrity through sharp, intentional layouts and a technical visual language.

The style is **Corporate Modern with a Technical Edge**. It utilizes the clarity of Minimalism—heavy use of white space and a rigorous grid—while incorporating subtle "developer-centric" details like monospaced accents and high-visibility indicators. The emotional response should be one of absolute control and systemic clarity.

## Colors

This design system utilizes a high-contrast light mode palette to ensure maximum legibility and professional rigor.

*   **Primary:** A darkened version of the kinetic green (#00995e) is used for interactive elements and brand signaling to ensure WCAG AA compliance against light backgrounds.
*   **Accent:** The signature Kinetic Green (#00ff9c) is reserved for non-text decorative elements, high-energy status indicators, and hover states where it is paired with dark text.
*   **Neutral & Surfaces:** The foundation uses `Slate-50` (#f8fafc) for the base background. Surfaces use pure white (#ffffff) to create a distinct elevation contrast.
*   **Text:** Deep `Slate-950` (#0f172a) is used for headlines to provide a grounded, authoritative feel, while `Slate-600` is used for secondary body text.

## Typography

The typography strategy leverages **Geist** for its precision and neutral, technical character. It provides a highly readable experience in dense data environments. For metadata, code snippets, and system status labels, **JetBrains Mono** is used to reinforce the infrastructure-focused narrative.

Headlines feature tight tracking and heavy weights to create a sense of structural permanence. Body text is optimized for long-form readability with generous line heights. Labels are always set in uppercase when using the monospaced font to differentiate system-generated data from user-generated content.

## Layout & Spacing

The layout is governed by a **12-column fluid grid** on desktop and a **4-column grid** on mobile. The spacing system follows a strict 4px base unit (4, 8, 12, 16, 24, 32, 48, 64) to maintain mathematical harmony.

*   **Desktop:** 24px gutters with 64px outside margins. Large-scale infrastructure dashboards should expand to a maximum width of 1440px.
*   **Mobile:** 16px gutters and margins. Vertical stack patterns are preferred, with horizontal scrolling reserved for data tables.
*   **Alignment:** Elements should favor top-left alignment to reflect a logical, systematic information hierarchy.

## Elevation & Depth

In this light-mode execution, depth is achieved through **Tonal Layering** and **Low-Contrast Outlines** rather than heavy shadows.

*   **Level 0 (Background):** Slate-50 (#f8fafc). Used for the application canvas.
*   **Level 1 (Card/Container):** Pure White (#ffffff) with a 1px solid border in Slate-200. This creates a "sheet" effect.
*   **Level 2 (Dropdowns/Modals):** Pure White with a very soft, diffused Slate-900 shadow at 5% opacity and a 4px blur.
*   **Interactions:** Hover states on interactive cards should shift the border color to the Primary Green (#00995e) rather than increasing shadow depth.

## Shapes

This design system uses a **Soft (0.25rem)** roundedness profile. This subtle rounding maintains the "engineered" feel without being as aggressive as sharp corners. It suggests a modern, high-performance interface that is still accessible.

*   **Small components (Buttons, Inputs):** 4px (0.25rem).
*   **Medium components (Cards, Modals):** 8px (0.5rem).
*   **Large components (Hero sections):** 12px (0.75rem).

## Components

*   **Buttons:** Primary buttons use a solid Slate-950 background with White text for high impact. Secondary buttons use a Slate-200 border with Slate-950 text. The "Kinetic" variant uses the #00ff9c accent background only for critical success actions, paired with Black text.
*   **Chips:** Technical tags use the monospaced label font. They feature a light Slate-100 background and Slate-600 text. Status-specific chips (e.g., "Active") use a low-opacity tint of the status color (e.g., 10% Green) with a high-contrast text label.
*   **Input Fields:** Ghost-style inputs with a 1px Slate-200 border. On focus, the border transitions to Primary Green (#00995e) with a 2px outer "glow" using a 10% opacity version of the same color.
*   **Lists:** Data-heavy lists use subtle Slate-100 dividers. Hovering over a list item triggers a 2px vertical "kinetic strip" of #00ff9c on the far left edge of the row.
*   **Cards:** Minimalist containers with a 1px Slate-200 border. Headers within cards should be separated by a thin horizontal rule.
*   **Progress Indicators:** Linear bars use a Slate-100 track with a #00ff9c fill to represent "kinetic energy" moving through the system.
