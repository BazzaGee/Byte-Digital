---
version: "1.0"
name: Byte Digital
description: "Dark-mode, conversion-focused landing page for a local business web design agency. Uses glass morphism, scroll-driven video, animated dot matrix logos, and a dual-accent purple/mint color system."
colors:
  background-deepest: "#030304"
  background-darker: "#050507"
  background-dark: "#0A0A0E"
  surface: "#13131A"
  surface-elevated: "#1A1A24"
  primary: "#8B78E6"
  secondary: "#5EEAD4"
  gradient-start: "#8B78E6"
  gradient-end: "#5EEAD4"
  text-primary: "#E2E8F0"
  text-secondary: "#CBD5E1"
  text-muted: "#94A3B8"
  text-dimmed: "#64748B"
  text-faint: "rgba(255,255,255,0.12)"
  accent-red: "#ff5f57"
  accent-yellow: "#febc2e"
  accent-green: "#28c840"
  heart-red: "#ef4444"
  scrollbar-thumb: "#1f1f2e"
  border-subtle: "rgba(255,255,255,0.04)"
  border-light: "rgba(255,255,255,0.06)"
  border-medium: "rgba(255,255,255,0.08)"
  border-strong: "rgba(255,255,255,0.1)"
typography:
  display:
    fontFamily: Space Grotesk
    fontSize: 80px
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: -0.03em
  h1:
    fontFamily: Space Grotesk
    fontSize: clamp(40px, 7vw, 80px)
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: -0.03em
  h2:
    fontFamily: Space Grotesk
    fontSize: clamp(32px, 5vw, 56px)
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.02em
  h2-scroll:
    fontFamily: Space Grotesk
    fontSize: clamp(28px, 5vw, 56px)
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: -0.02em
  h3:
    fontFamily: Space Grotesk
    fontSize: 20px
    fontWeight: 700
    lineHeight: 1.3
  h3-case:
    fontFamily: Space Grotesk
    fontSize: clamp(24px, 3vw, 32px)
    fontWeight: 700
    lineHeight: 1.3
  h3-process:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: 700
    lineHeight: 1.3
  h4:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: 700
    lineHeight: 1.4
  body-lg:
    fontFamily: Space Grotesk
    fontSize: clamp(16px, 2vw, 20px)
    fontWeight: 400
    lineHeight: 1.7
  body-md:
    fontFamily: Space Grotesk
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.7
  body-sm:
    fontFamily: Space Grotesk
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.65
  body-xs:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.65
  label-pill:
    fontFamily: Space Grotesk
    fontSize: 11px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: 3px
  label-badge:
    fontFamily: Space Grotesk
    fontSize: 11px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: 1px
  stat-large:
    fontFamily: Space Grotesk
    fontSize: clamp(56px, 9vw, 110px)
    fontWeight: 700
    lineHeight: 1
  stat-medium:
    fontFamily: Space Grotesk
    fontSize: clamp(36px, 5vw, 52px)
    fontWeight: 700
    lineHeight: 1
  stat-label:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.4
  nav-link:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.4
  faq-question:
    fontFamily: Space Grotesk
    fontSize: 17px
    fontWeight: 600
    lineHeight: 1.5
  marquee:
    fontFamily: Space Grotesk
    fontSize: 13px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 2px
  preloader-label:
    fontFamily: Space Grotesk
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1
    letterSpacing: 4px
  preloader-pct:
    fontFamily: Space Grotesk
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1
  brand-logo:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: 1px
  brand-footer:
    fontFamily: Space Grotesk
    fontSize: 22px
    fontWeight: 700
    lineHeight: 1
  copyright:
    fontFamily: Space Grotesk
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
  button:
    fontFamily: Space Grotesk
    fontSize: 15px
    fontWeight: 700
    lineHeight: 1
  button-lg:
    fontFamily: Space Grotesk
    fontSize: 16px
    fontWeight: 700
    lineHeight: 1
  button-xl:
    fontFamily: Space Grotesk
    fontSize: 17px
    fontWeight: 700
    lineHeight: 1
rounded:
  none: 0px
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 20px
  card: 24px
  card-lg: 28px
  section: 32px
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  xxxl: 64px
  section: 100px
  container-max: 1200px
  container-px-mobile: 24px
  container-px-desktop: 48px
  nav-gap: 32px
  grid-gap: 24px
  grid-gap-lg: 32px
  grid-gap-xl: 48px
components:
  button-cta:
    backgroundColor: "linear-gradient(135deg, #5EEAD4, #fff)"
    textColor: "#050507"
    fontWeight: 700
    fontSize: 15px
    padding: "14px 32px"
    rounded: "{rounded.full}"
    hoverTransform: "scale(1.05)"
    hoverShadow: "0 0 30px rgba(94,234,212,0.4)"
  button-cta-lg:
    backgroundColor: "linear-gradient(135deg, #5EEAD4, #fff)"
    textColor: "#050507"
    fontWeight: 700
    fontSize: 17px
    padding: "16px 40px"
    rounded: "{rounded.full}"
  button-ghost:
    backgroundColor: transparent
    textColor: "#FFFFFF"
    fontWeight: 600
    fontSize: 15px
    padding: "14px 32px"
    rounded: "{rounded.full}"
    border: "1px solid rgba(139,120,230,0.3)"
    hoverBorder: "#8B78E6"
    hoverBg: "rgba(139,120,230,0.1)"
  glass-panel:
    backgroundColor: "rgba(19,19,26,0.75)"
    backdropFilter: "blur(16px)"
    border: "1px solid rgba(255,255,255,0.08)"
  nav:
    position: fixed
    backgroundColor: "rgba(10,10,14,0.8)"
    backdropFilter: "blur(12px)"
    borderBottom: "1px solid rgba(255,255,255,0.06)"
    padding: "16px 0"
    zIndex: 100
  scroll-card:
    backgroundColor: "rgba(10,10,16,0.82)"
    backdropFilter: "blur(24px)"
    border: "1px solid rgba(255,255,255,0.1)"
    rounded: "{rounded.card}"
    padding: "40px 48px"
    maxWidth: 680px
    boxShadow: "0 0 60px rgba(0,0,0,0.5), 0 0 120px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)"
  service-card:
    padding: 32px
    rounded: "{rounded.card-lg}"
    hoverTransform: "translateY(-6px)"
    hoverShadow: "0 0 40px rgba(139,120,230,0.15)"
    hoverBorder: "rgba(139,120,230,0.3)"
  service-card-mint:
    hoverShadow: "0 20px 60px rgba(94,234,212,0.15)"
    hoverBorder: "rgba(94,234,212,0.3)"
  icon-circle:
    width: 48px
    height: 48px
    rounded: "{rounded.full}"
  icon-rounded:
    width: 56px
    height: 56px
    rounded: "{rounded.xl}"
  stat-card:
    textAlign: center
    padding: "28px 20px"
    rounded: "{rounded.card}"
  testimonial-card:
    padding: 32px
    rounded: "{rounded.card-lg}"
  process-step:
    textAlign: center
    padding: "32px 24px"
    rounded: "{rounded.card-lg}"
  process-number:
    width: 48px
    height: 48px
    rounded: "{rounded.full}"
    fontSize: 18px
    fontWeight: 700
  case-study-visual:
    aspectRatio: "16/10"
    rounded: "{rounded.card-lg}"
  faq-item:
    borderBottom: "1px solid rgba(255,255,255,0.06)"
  faq-answer-max-height: 200px
  section-label:
    fontSize: 11px
    fontWeight: 700
    letterSpacing: 3px
    textTransform: uppercase
    color: "#8B78E6"
    backgroundColor: "rgba(139,120,230,0.08)"
    border: "1px solid rgba(139,120,230,0.2)"
    padding: "6px 16px"
    rounded: "{rounded.full}"
  badge-mint:
    color: "#5EEAD4"
    backgroundColor: "rgba(94,234,212,0.08)"
    border: "1px solid rgba(94,234,212,0.25)"
  badge-purple:
    color: "#8B78E6"
    backgroundColor: "rgba(139,120,230,0.1)"
    border: "1px solid rgba(139,120,230,0.3)"
  cta-box:
    rounded: "{rounded.section}"
    padding: "64px 32px"
    borderTop: "1px solid rgba(94,234,212,0.2)"
    boxShadow: "0 0 80px rgba(94,234,212,0.08)"
---

# Byte Digital Design System

## Overview

Byte Digital is a dark-mode, conversion-focused single-page website for a local business web design agency. The design philosophy is **"Emergent Technology, Human Results"** — using cutting-edge web techniques (scroll-driven video, animated dot matrices, glass morphism) to communicate technological sophistication while keeping the messaging warm, direct, and actionable for local business owners (contractors, clinics, trades, salons).

The emotional response the UI should evoke is **confident premium technology** — the site itself serves as proof-of-concept that Byte Digital can build modern, high-converting websites. Every section is designed to move the visitor toward a single conversion goal: requesting a free proposal.

**Key differentiators of this design:**
- Dual-accent color system (purple for brand identity, mint for action/interaction)
- Animated dot matrix B+D logo in both navigation and footer
- Scroll-driven canvas video with 145 frames and overlaid content cards
- Glass morphism panels with backdrop-filter blur throughout
- Subtle dot-pattern backgrounds on alternating sections
- Animated canvas-based dot matrix backgrounds on key sections (services, testimonials, CTA)
- Reveal-on-scroll animations with IntersectionObserver
- Preloader with loading percentage counter

**Target audience:** Local business owners (roofers, dentists, pool builders, HVAC, plumbers, salons) who need a premium web presence.

## Colors

The palette is built on a near-black foundation with two vibrant accent colors that form the brand identity.

### Primary Palette

- **Primary Purple (#8B78E6):** The BYTE brand color. Used for primary icons, process step numbers, testimonial avatars, FAQ toggle icons, section labels, link hovers, scrollbar thumb hover, preloader ring, and the start of all gradient treatments. Represents trust, technology, and sophistication.
- **Secondary Mint (#5EEAD4):** The DIGITAL brand color. Used for CTA buttons (gradient to white), checkmark icons, badge accents, hero badge dot pulse, scroll card tags, stat number gradients, footer link hovers, and the end of all gradient treatments. Represents action, energy, and conversion.

### Neutral Palette

- **Background Deepest (#030304):** Used exclusively for the footer and brand badge areas. The darkest surface in the system.
- **Background Darker (#050507):** The body background. Used for the hero, scroll-video section, preloader, marquee banner, and scrollbar track. The default page canvas.
- **Background Dark (#0A0A0E):** Used for alternate section backgrounds (stats row, process section, case studies), nav glass overlay, stat card backgrounds, pre-strip, and borders. Creates tonal layer separation between sections.
- **Surface (#13131A):** The base color for glass panels (`rgba(19,19,26,0.75)` with blur). Used for all cards, service panels, testimonials, and elevated surfaces.
- **Surface Elevated (#1A1A24):** Used as the default (inactive) dot color in the animated logo matrices, and as the preloader ring base color.

### Text Hierarchy

- **Text Primary (#E2E8F0):** Body text color. Used for all default readable content.
- **Text Secondary (#CBD5E1):** Used for testimonial quotes, card descriptions in scroll section, and case study list items. Slightly brighter than muted.
- **Text Muted (#94A3B8):** The workhorse secondary text. Used for hero paragraph, section subtitles, stat labels, service card descriptions, process step descriptions, FAQ answers, nav links, footer text, preloader label, and marquee default text.
- **Text Dimmed (#64748B):** Used only for the footer bottom copyright and legal links.
- **Text Faint (rgba(255,255,255,0.12)):** Used for the frame counter in the scroll video section.

### Accent Colors (Contextual)

- **Accent Red (#ff5f57):** macOS-style window dot in hero mockup.
- **Accent Yellow (#febc2e):** macOS-style window dot in hero mockup.
- **Accent Green (#28c840):** macOS-style window dot in hero mockup.
- **Heart Red (#ef4444):** Used for the heart icon in the footer brand badge.

### Gradient Treatments

- **Brand Gradient:** `linear-gradient(135deg, #8B78E6, #5EEAD4)` — Used for all gradient text, the brand's signature visual. Applied via `-webkit-background-clip: text`.
- **CTA Button Gradient:** `linear-gradient(135deg, #5EEAD4, #fff)` — Mint-to-white, used for all primary CTA buttons.
- **Stat Number Gradient:** `linear-gradient(135deg, #8B78E6 0%, #5EEAD4 60%, #fff 100%)` — Three-stop gradient for large stat numbers in scroll cards.
- **Progress Bar Gradient:** `linear-gradient(to right, #8B78E6, #5EEAD4)` — Horizontal gradient for the scroll progress indicator.
- **Divider Lines:** Left fades from transparent to purple; right fades from transparent to mint.

### Border System

- **Border Subtle (rgba(255,255,255,0.04)):** Section divider lines, footer top border.
- **Border Light (rgba(255,255,255,0.06)):** FAQ item separators, mockup bar border, glass panel bottom borders.
- **Border Medium (rgba(255,255,255,0.08)):** Default glass panel border, dot pattern grid, icon items in scroll cards.
- **Border Strong (rgba(255,255,255,0.1)):** Scroll card border, service card hover target.

## Typography

The site uses **Space Grotesk** exclusively across all weights (300, 400, 500, 600, 700). The font is loaded via Google Fonts with all weight variants. Space Grotesk is a geometric sans-serif that conveys technical precision with warmth — fitting for a tech-forward agency serving local businesses.

### Type Scale and Usage

- **Display / H1 (clamp(40px, 7vw, 80px), weight 700, line-height 1.05, tracking -0.03em):** Hero headline only. The tight tracking and massive size create immediate visual impact.
- **H2 Section Titles (clamp(32px, 5vw, 56px), weight 700, line-height 1.1, tracking -0.02em):** Used for all section headings (services, process, testimonials, case studies, FAQ, CTA). Slightly less aggressive tracking than H1.
- **H2 Scroll Cards (clamp(28px, 5vw, 56px), weight 700, line-height 1.1, tracking -0.02em):** Scroll overlay card headings. Uses `text-shadow: 0 2px 20px rgba(0,0,0,0.5)` for readability over video.
- **H3 Cards (20px, weight 700):** Service card titles, process step titles. The workhorse heading.
- **H3 Case Studies (clamp(24px, 3vw, 32px), weight 700):** Case study item titles.
- **H4 (14px, weight 700):** Footer column headings.
- **Body Large (clamp(16px, 2vw, 20px), weight 400, line-height 1.7):** Hero paragraph text. Responsive scaling.
- **Body Medium (16px, weight 400, line-height 1.7):** Case study description paragraphs.
- **Body Small (15px, weight 400, line-height 1.65):** Testimonial quotes, FAQ answers, card descriptions.
- **Body Extra Small (14px, weight 400, line-height 1.65-1.7):** Service descriptions, process descriptions, footer text, hero check items, stat labels, case list items.

### Special Typography

- **Stat Numbers (clamp(56px, 9vw, 110px), weight 700):** Massive stat displays in scroll cards. Uses three-stop gradient text with `drop-shadow` filter.
- **Stat Numbers Medium (clamp(36px, 5vw, 52px), weight 700):** Stats row and stats bar numbers. Uses standard brand gradient text.
- **Section Labels (11px, weight 700, tracking 3px, uppercase):** Pill-shaped labels like "What We Offer", "How We Work", "FAQ", "Case Studies". Always uppercase with generous letter-spacing.
- **Badges (11px, weight 700, tracking 1px, uppercase):** Case study category badges (e.g., "Roofing Contractor", "Dental Clinic").
- **Nav Links (14px, weight 400):** Navigation items. Hover transitions to mint (#5EEAD4).
- **FAQ Questions (17px, weight 600):** Accordion trigger text. White with a plus icon that rotates 45 degrees on open.
- **Brand Logo (18px, weight 700, tracking 1px, uppercase):** Navigation "BYTE DIGITAL" text. BYTE in purple, DIGITAL in mint.
- **Brand Footer (22px, weight 700):** Footer logo text, same color split.
- **Marquee (13px, weight 600, tracking 2px, uppercase):** Scrolling benefit text. Default dim with mint/purple highlights.
- **Preloader Label (13px, tracking 4px, uppercase):** "LOADING EXPERIENCE" text in muted.
- **Preloader Percentage (16px, weight 600):** Loading percentage in mint.
- **Copyright (13px):** Footer bottom text in dimmed (#64748B).
- **Button Text (15px, weight 700):** Standard CTA and ghost button labels.
- **Button Large (16px, weight 700):** Scroll card CTA pill text.
- **Button XL (17px, weight 700):** Footer CTA button text.

### Text Shadow Usage

- **Scroll card headings:** `0 2px 20px rgba(0,0,0,0.5)` — ensures readability over video frames.
- **Scroll card descriptions:** `0 1px 8px rgba(0,0,0,0.4)` — softer shadow for body text over video.
- **All other contexts:** No text shadows. Clean, flat rendering on dark backgrounds.

## Layout

The layout follows a **centered, max-width container** model with responsive grid systems for card layouts.

### Container

- **Max width:** 1200px, centered with `margin: 0 auto`
- **Mobile padding:** 0 24px
- **Desktop padding (768px+):** 0 48px
- Navigation shares the same max-width/padding but is defined separately (`.nav-inner`)

### Grid Systems

- **Hero Grid:** Single column mobile, 1fr 1fr at 1024px+ (text left, mockup right)
- **Stats Row Grid:** 2 columns mobile, 4 columns at 768px+
- **Stats Bar Grid:** 2 columns mobile, 4 columns at 768px+
- **Services Grid:** 1 column mobile, 2 columns at 768px, 3 columns at 1024px
- **Process Grid:** 1 column mobile, 2 columns at 768px, 4 columns at 1024px
- **Testimonials Grid:** 1 column mobile, 3 columns at 768px
- **Case Study Items:** Single column mobile, 1fr 1fr at 768px (alternating image/text sides)
- **Footer Top:** Auto-stacked mobile, 2fr 1fr 1fr 1fr at 768px

### Section Spacing

- **Standard section padding:** 100px vertical (`.section` class)
- **Service row padding:** 80px vertical
- **Stats row padding:** 64px vertical
- **Footer padding:** 64px top, 32px bottom
- **Brand badge padding:** 40px vertical
- **Divider padding:** 40px vertical
- **Marquee padding:** 16px vertical
- **CTA box padding:** 64px 32px mobile, 80px 64px at 768px+

### Responsive Breakpoints

- **640px:** Nav CTA button becomes visible
- **768px:** Container padding increases, nav links appear, grids expand
- **1024px:** Hero becomes two-column, services go to 3 columns, process goes to 4 columns

### Special Layout: Scroll Video Section

The scroll-driven video section uses a **sticky positioning** pattern:
- Outer section is `position: relative` with a `900vh` spacer div (creates scroll distance)
- Inner sticky container is `position: sticky; top: 0; height: 100vh` (pins the viewport)
- Canvas renders at 1920x1080 internal resolution, scaled to fill viewport
- Content cards are absolutely positioned and animated based on scroll progress
- Seven content segments map to scroll progress (0.00-0.13, 0.13-0.27, etc.)

## Elevation & Depth

Depth is achieved through four complementary techniques. The design never uses flat white or light surfaces — all depth is expressed within the dark palette.

### Glass Morphism (Primary Elevation)

The primary method for creating visual hierarchy. Glass panels use:
- **Background:** `rgba(19,19,26,0.75)` — semi-transparent dark surface
- **Backdrop filter:** `blur(16px)` — frosted glass effect, reveals color from content behind
- **Border:** `1px solid rgba(255,255,255,0.08)` — hairline light edge simulates light reflection
- **Applied to:** All service cards, testimonial cards, stat cards, process steps, hero mockup, CTA box, scroll cards (stronger blur)

### Glow Orbs (Atmospheric Depth)

Large, blurred circular gradients placed as absolute-positioned decorative elements:
- **Hero glow 1:** 500x500px, #8B78E6, blur(120px), opacity 0.12, top-left quadrant
- **Hero glow 2:** 500x500px, #5EEAD4, blur(120px), opacity 0.1, bottom-right quadrant
- **Mockup glow purple:** 200x200px, #8B78E6, blur(80px), opacity 0.3
- **Mockup glow mint:** 200x200px, #5EEAD4, blur(80px), opacity 0.3
- **Scroll card stat shadow:** `drop-shadow(0 4px 20px rgba(94,234,212,0.2))` via CSS filter on gradient text

### Box Shadows (Interactive Depth)

- **Scroll card:** `0 0 60px rgba(0,0,0,0.5), 0 0 120px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)` — deep, multi-layer shadow with inner light edge
- **Service card hover:** `0 0 40px rgba(139,120,230,0.15)` — purple glow on hover
- **Service row card hover purple:** `0 20px 60px rgba(139,120,230,0.15)` — deeper purple glow
- **Service row card hover mint:** `0 20px 60px rgba(94,234,212,0.15)` — mint glow
- **CTA button hover:** `0 0 30px rgba(94,234,212,0.4)` — mint glow halo
- **CTA box:** `0 0 80px rgba(94,234,212,0.08)` — subtle ambient mint glow

### Vignette and Overlays

- **Scroll video vignette:** `radial-gradient(ellipse at center, transparent 30%, rgba(5,5,7,0.85) 100%)` — darkens video edges
- **Dark overlay:** `rgba(5,5,7,0.3)` — fades in when scroll cards are visible, dims the video underneath

## Shapes

The shape language is defined by **Generous Roundness** — nearly all containers use large border-radius values (24-32px), creating a soft, approachable aesthetic that contrasts with the hard-edged dark palette.

### Corner Radius Scale

- **4px:** Scrollbar thumb, FAQ answer reveal height
- **6px:** Hero mockup URL bar, scroll wheel indicator
- **8px:** Scrollbar width visual balance
- **12px:** Scroll mouse indicator outline, footer brand dot gaps
- **20px:** Scroll card icon items, service row icon containers
- **24px:** Stat cards, CTA box, design module headers, progress bar track
- **28px:** Service cards, testimonial cards, process steps, case study visuals, service row cards
- **32px:** Hero card outer, CTA box (mobile), design module outer containers
- **9999px (pill):** All buttons (CTA, ghost, nav), section labels, badges, hero badge, scroll card tags, avatar circles, process number circles, dividers, marquee background

### Circular Elements

- **Logo dots:** 5-7px diameter circles in animated grid
- **Avatar circles:** 40px diameter
- **Process numbers:** 48px diameter
- **Service icons (circle variant):** 48px diameter
- **Hero badge pulse dot:** 6px diameter
- **Divider dots:** 6px diameter
- **Case list dots:** 6px diameter
- **Glow orbs:** 200-500px diameter

## Components

### Navigation Bar

Fixed to top of viewport with glass morphism background (`rgba(10,10,14,0.8)` + `blur(12px)`). Contains:
- **Logo area:** Animated dot matrix grid (7 columns x 5 rows) spelling B+D, followed by "BYTE" (purple) + "DIGITAL" (mint) in uppercase, tracking 1px, weight 700.
- **Nav links:** Services, Process, Work, FAQ — hidden on mobile, visible at 768px. Color transitions to mint on hover.
- **CTA button:** "Get Free Quote" pill, hidden below 640px, smaller padding (10px 24px, 13px font).

### Preloader

Full-viewport overlay (z-index 9999) with the deepest background color (#050507):
- **Spinner ring:** 48px, 3px border, purple top color, base `rgba(139,120,230,0.15)`, 0.7s linear rotation
- **Label:** "Loading experience" in muted, uppercase, 4px letter-spacing
- **Percentage counter:** Dynamic number in mint, 16px, weight 600
- **Exit animation:** 0.8s cubic-bezier opacity fade, then `display: none` after 800ms

### Hero Section

Full-viewport height section with dot-pattern background and dual glow orbs:
- **Badge pill:** "Built for Local Contractors & Clinics" — uppercase, mint text, mint border, animated pulse dot
- **Headline:** "We turn local traffic into booked jobs." — "booked jobs." in gradient text
- **Body text:** 2-column layout at 1024px+, text left, browser mockup right
- **CTA row:** Primary CTA button + ghost button side by side
- **Check items:** Three inline items with mint checkmark SVGs (Mobile Optimized, SEO Ready, Lightning Fast)
- **Browser mockup:** Glass panel with macOS window dots (red/yellow/green), gradient URL bar placeholder, dual glow orbs, centered "yourbusiness.com" text with gradient mini bar

### Stats Row

Four stat cards in a grid, each with glass morphism:
- Numbers use gradient text (brand gradient)
- Counter animation triggers on intersection (1.6s duration, cubic ease-out)
- Data attributes drive animation: `data-target`, `data-suffix`, `data-decimals`

### Marquee Banner

Infinite horizontal scroll of benefit phrases:
- Content duplicated for seamless loop
- 30s linear infinite animation
- Mint and purple accent words interspersed
- Separator dots between phrases
- 1px border top and bottom

### Scroll-Driven Video Section

The signature interactive element:
- **Canvas:** 1920x1080 internal resolution, draws JPG frames from `/frames/` directory
- **Frame count:** 145 total frames (frame_0000.jpg through frame_0144.jpg)
- **Scroll distance:** 900vh (creates extended scroll experience)
- **Seven content cards:** Each appears/disappears based on scroll progress with unique enter/exit animations (translate Y, translate X, scale variants)
- **Progress indicator:** 180px wide, 2px tall gradient bar at bottom
- **Scroll hint:** Animated "Scroll to explore" text with breathing opacity animation
- **Mouse indicator:** Scroll wheel SVG with animated wheel dot
- **Frame counter:** Top-right corner, shows current frame (e.g., "042 / 144")
- **Vignette:** Radial gradient darkening edges
- **Dark overlay:** Fades to 0.3 opacity when cards are visible

### Service Cards (Two Variants)

**Standard service cards (6-card grid in services section):**
- Glass morphism with 48px circular icon, 20px title, 14px description
- Hover lifts 6px with purple glow shadow
- Border transitions to purple on hover

**Service row cards (3-card "Why Modern Website" section):**
- Glass morphism with 56px rounded-corner icon containers (20px radius)
- Three icon color variants: purple (purple bg + border), mint (mint bg + border), white (white bg + border)
- Two glow variants: `.purple-glow` and `.mint-glow` for differentiated hover effects
- 0.4s cubic-bezier transition timing (slower, more premium feel)

### Process Steps

Four-step grid with alternating purple/mint step numbers:
- Circular number badges (48px) with tinted background and colored border
- Center-aligned text, 24px internal padding
- Glass morphism panel

### Testimonial Cards

Three-column grid of glass morphism cards:
- Star rating (5 stars) in purple (#8B78E6), 16px, 2px letter-spacing
- Italic blockquote in text secondary (#CBD5E1)
- Author row: 40px avatar circle (alternating purple/mint backgrounds) + name (white, weight 600) + business name (muted, 12px)

### Case Study Items

Alternating left/right layout (image/text swap via CSS `direction: rtl` trick):
- **Visual area:** 16:10 aspect ratio glass panel with gradient overlay and centered placeholder icon + text
- **Category badge:** Pill-shaped, uppercase, color-coded (purple or mint)
- **Description paragraph:** 16px, muted text
- **Feature list:** Bullet items with 6px colored dots, 14px text in text secondary

### FAQ Accordion

Centered layout (max-width 800px):
- Full-width button triggers (17px, weight 600, white text)
- Plus icon (20px, purple) rotates 45 degrees to form X when open
- Answer reveals with `max-height` transition (0.4s ease)
- Items separated by subtle border bottom
- Only one item open at a time (exclusive accordion)

### CTA Section

Glass morphism box with special treatment:
- **Top border:** Mint (rgba(94,234,212,0.2)) instead of standard white — draws eye
- **Ambient shadow:** `0 0 80px rgba(94,234,212,0.08)` — subtle mint glow
- **Background:** Animated dot matrix canvas (via `dm-bg` wrapper)
- Centered text + large CTA button
- Responsive padding increase at 768px

### Footer

Two-part footer:
- **Main footer:** 4-column grid (brand description + 3 link columns) on deepest background (#030304)
- **Brand badge:** Centered section with animated dot matrix logo (15x5 grid at 5px dots), "Made with heart by BYTE DIGITAL" text, and tagline

### Dot Matrix Logo System

The animated B+D logo appears in three sizes:
- **Navigation:** 7-column x 5-row grid, 7px dots, 3px gap. Purple dots form "B", mint dots form "D". Uses `logo-populate` animation (4s infinite).
- **Footer brand badge:** 15-column x 5-row grid, 5px dots, 2px gap. Same letter pattern. Active dots use `logo-populate` animation, faint dots are static at 0.15 opacity.
- **Animation keyframe `logo-populate`:** 0%/10%/100% = dim (#1a1a24, 0.15 opacity, no shadow), 25%/85% = full color (var(--active-color), 1 opacity, 12px glow shadow). Staggered delays via inline `animation-delay`.

### Dot Matrix Canvas Backgrounds

Three sections have animated canvas-based dot matrix backgrounds (services, testimonials, CTA):
- **Dot size:** 5px diameter
- **Gap:** 7px between dots
- **Color distribution:** 40% purple, 40% mint, 20% dim (rgb(61,58,82))
- **Animation:** Per-dot sinusoidal pulse based on `Math.sin(time * speed + offset)`, where speed is 1.5-4.0 and offset is random
- **Alpha range:** 0.12 (dim) to 0.67 (bright) based on pulse position
- **Size range:** 3.5px (dim) to 5px (bright) based on pulse
- **Glow effect:** When purple/mint dots are above 50% pulse, a secondary larger circle renders at 25% alpha for soft glow
- **HiDPI:** Canvas uses `devicePixelRatio` (capped at 2x) for crisp rendering
- **Responsive:** Rebuilds grid on window resize

### Scroll Reveal Animation

Elements with `.reveal` class start at `opacity: 0; transform: translateY(40px)` and transition to visible state when intersecting viewport (10% threshold, -40px root margin). Uses `cubic-bezier(0.4,0,0.2,1)` easing over 0.7s. Each element is observed only once.

### Custom Scrollbar

- **Width:** 8px
- **Track:** #050507 (matches body)
- **Thumb:** #1f1f2e, 4px border-radius
- **Thumb hover:** #8B78E6 (purple)

### Divider

Decorative section separator with:
- Two gradient lines (80px wide each, fading from transparent to purple/mint)
- Three animated dots between them (6px, alternating purple/mint/purple)
- `divider-pulse` animation: 2s infinite, staggered 0.3s delays

## Do's and Don'ts

### Do

- Use the brand gradient (`135deg, #8B78E6, #5EEAD4`) for all accent text highlights — it is the single most recognizable visual signature
- Apply glass morphism (`rgba(19,19,26,0.75)` + `blur(16px)` + subtle border) for all elevated card surfaces
- Use `clamp()` for all headline and stat typography to ensure smooth responsive scaling without breakpoint jumps
- Maintain the purple-for-identity, mint-for-action convention — purple marks "this is Byte Digital", mint marks "do this thing"
- Keep section labels uppercase with 3px letter-spacing — this creates the pill/badge visual language
- Use dot-pattern backgrounds (`radial-gradient(rgba(139,120,230,0.1) 1px, transparent 1px)` at 32px) on alternating sections for subtle texture
- Include the animated dot matrix logo in both navigation and footer for brand cohesion
- Use `cubic-bezier(0.4,0,0.2,1)` for all reveal and interaction transitions — it provides a premium deceleration curve
- Ensure all hover states on cards include a Y-axis translation (typically -6px) for a tactile lift effect
- Use `text-shadow` on any text rendered over video or canvas backgrounds for guaranteed readability

### Don't

- Never use the mint CTA button gradient for anything other than primary conversion actions — it loses impact through overuse
- Never mix warm/cool whites — all text uses the slate family (#E2E8F0, #CBD5E1, #94A3B8, #64748B), never pure #FFF for body text (white is reserved for headlines only)
- Never use border-radius values below 24px for card containers — the design language is consistently soft/rounded
- Never place dark text on dark backgrounds without at least one elevation technique (glass, shadow, or border)
- Never use synchronized/patterned animations on the dot matrix — the organic randomness is intentional
- Never use lowercase for the BYTE DIGITAL brand text — it is always uppercase with the purple/mint color split
- Never use the dot matrix as a standalone hero image or feature element — it is always a background texture or logo element
- Never use Tailwind CSS utility classes in this design system — all styling is vanilla CSS with custom properties
- Never exceed two font weights per visual section (typically 700 for headings + 400 for body) to maintain typographic discipline
- Never use flat solid backgrounds without tonal variation — adjacent sections must alternate between #050507, #0A0A0E, and dot-pattern treatments

---
**Version:** 1.0 | **Standard:** Google DESIGN.md Spec | **Status:** Production
