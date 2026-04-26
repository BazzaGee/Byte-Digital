# Design System: Byte Digital - Local Business Web Design (v3)

## 1. Overview

**Design Philosophy:** "Accessible Technology, Tangible Results"

This design system bridges the gap between cutting-edge web technology and local service businesses. We create high-converting digital experiences that feel premium yet approachable, technical yet human.

**Version 3 Updates:**
- Dot matrix animations are truly random (no visible patterns)
- Dynamic dots blended as background elements, not hero features
- Enhanced footer logo with full grid context
- ALL CAPS header text treatment

## 2. Color System

### Core Palette

| Token | Value | Usage |
|-------|-------|-------|
| `background` | `#0A0A0E` | Primary background (deep space) |
| `background-darker` | `#050507` | Section dividers, footers |
| `surface` | `#13131A` | Card backgrounds, panels |
| `primary-purple` | `#8B78E6` | Primary actions, accents, "BYTE" text |
| `primary-mint` | `#5EEAD4` | Secondary actions, "DIGITAL" text |
| `text-primary` | `#E2E8F0` | Headlines, body text |
| `text-muted` | `#94A3B8` | Secondary text, labels |
| `dot-dim` | `#1a1a24` | Inactive dot state |
| `dot-faint` | `rgba(139, 120, 230, 0.15)` | Background grid dots |

### Gradient System

```
Gradient Text: linear-gradient(to right, #8B78E6, #5EEAD4)
Gradient Button: linear-gradient(135deg, #8B78E6 0%, #5EEAD4 100%)
Glow Primary: radial-gradient(circle, rgba(139, 120, 230, 0.15) 0%, transparent 70%)
Glow Secondary: radial-gradient(circle, rgba(94, 234, 212, 0.15) 0%, transparent 70%)
```

## 3. Typography

### Font Stack

```
Primary: Space Grotesk (Google Fonts)
Weights: 300, 400, 500, 600, 700
```

### Type Scale

| Role | Size | Weight | Letter Spacing | Transform | Usage |
|------|------|--------|----------------|-----------|-------|
| Display | `3.5rem` | 700 | `-0.02em` | none | Hero headlines |
| Heading LG | `2.5rem` | 600 | `-0.01em` | none | Section titles |
| Heading MD | `1.75rem` | 600 | `0` | none | Card titles |
| Brand | `1.25rem` | 700 | `-0.02em` | uppercase | Navigation logo |
| Body | `1rem` | 400 | `0` | none | Paragraphs |
| Label | `0.875rem` | 500 | `0.05em` | uppercase | Tags, badges |
| Small | `0.75rem` | 400 | `0` | none | Fine print |

### Brand Text Treatment

**Navigation Logo:**
- "BYTE" - Color: `#8B78E6` (purple)
- "DIGITAL" - Color: `#5EEAD4` (mint)
- Transform: `uppercase`
- Tracking: `tight`
- Weight: `700`

## 4. Components

### Buttons

**Primary CTA**
- Background: White or Mint gradient
- Text: Dark (#0A0A0E)
- Border Radius: 9999px (fully rounded)
- Padding: 1rem 2rem
- Hover: Scale 1.05 + Glow shadow (mint)
- Transition: 300ms ease-out

**Secondary CTA**
- Background: Glass panel
- Border: 1px solid rgba(255,255,255,0.1)
- Text: White
- Border Radius: 9999px
- Hover: Border color shifts to purple/mint

### Service Cards

- Background: Glass panel (rgba(19, 19, 26, 0.7))
- Border: 1px solid rgba(255,255,255,0.08)
- Border Radius: 1rem
- Padding: 2rem
- Hover: Translate Y -8px + Glow (purple or mint)

### Dot Grid Background

```css
.dot-pattern {
  background-image: radial-gradient(rgba(139, 120, 230, 0.12) 1px, transparent 1px);
  background-size: 32px 32px;
}
```

**Usage:** Hero section (subtle, low opacity - background only), Section backgrounds, CTA overlays

### Random Flashing Dots (Background Element)

- Each dot gets a **random** animation delay via JavaScript
- No visible patterns - truly stochastic
- Used as **background accent**, not hero feature
- Placement: Inside glass panels, section corners, dividers

### Enhanced Footer Logo (Full Grid Context)

**Grid Structure:**
- Total: 5 rows x 15 columns = 75 dots
- B letter: Columns 1-3, Rows 1-5 (15 dots, purple)
- D letter: Columns 5-7, Rows 1-5 (15 dots, mint)
- Faint grid: All other positions (45 dots)
- Gap: 4px between dots

**Animation:**
- Sequential populate effect (staggered delays)
- 4-second infinite loop
- Dots appear to "emerge" from the faint grid

### Marquee Banner

- Height: 3rem minimum
- Background: #050507
- Text: Uppercase, tracking-widest, muted color
- Animation: Continuous scroll (25s loop)
- Separators: 8px dots (alternating purple/mint)

### Logo System

**Header Logo (Static)**
- 'B' Matrix: 3x5 grid, purple dots
- 'D' Matrix: 3x5 grid, mint dots
- Text: "BYTE" (purple) + "DIGITAL" (mint)
- Transform: uppercase

**Footer Logo (Dynamic with Full Grid)**
- Full grid: 5x15 with faint background dots
- B letter dots: Purple, sequential animation
- D letter dots: Mint, sequential animation
- Faint dots: Always visible at 20% opacity
- Animation: 4s infinite loop

## 5. Do's and Don'ts

### Do
- ✅ Use ALL CAPS for "BYTE DIGITAL" brand text
- ✅ Make dot animations truly random (no patterns)
- ✅ Use dot matrix as background/blended element
- ✅ Include full faint grid in footer logo
- ✅ Use rounded-full buttons with glow hover

### Don't
- ❌ Make dot matrix the hero feature image
- ❌ Use patterned/synchronized dot animations
- ❌ Use lowercase "Byte Digital" in header
- ❌ Have footer logo dots appear on empty background

---

**Version:** 3.0  
**Status:** Production Ready
