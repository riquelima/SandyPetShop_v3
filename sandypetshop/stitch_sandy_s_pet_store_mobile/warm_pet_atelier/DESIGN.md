---
name: Warm Pet Atelier
colors:
  surface: '#fff8f7'
  surface-dim: '#ffcdd7'
  surface-bright: '#fff8f7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff0f2'
  surface-container: '#ffe8ec'
  surface-container-high: '#ffe1e6'
  surface-container-highest: '#ffd9e0'
  on-surface: '#3f0019'
  on-surface-variant: '#594045'
  inverse-surface: '#5d132e'
  inverse-on-surface: '#ffecef'
  outline: '#8d7075'
  outline-variant: '#e1bec4'
  surface-tint: '#b80f55'
  primary: '#b50a53'
  on-primary: '#ffffff'
  primary-container: '#d72f6b'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb1c2'
  secondary: '#805062'
  on-secondary: '#ffffff'
  secondary-container: '#fec1d6'
  on-secondary-container: '#7b4c5e'
  tertiary: '#b60653'
  on-tertiary: '#ffffff'
  tertiary-container: '#d82d6b'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffd9df'
  primary-fixed-dim: '#ffb1c2'
  on-primary-fixed: '#3f0018'
  on-primary-fixed-variant: '#8f003f'
  secondary-fixed: '#ffd9e4'
  secondary-fixed-dim: '#f2b6cb'
  on-secondary-fixed: '#330f1f'
  on-secondary-fixed-variant: '#65394b'
  tertiary-fixed: '#ffd9df'
  tertiary-fixed-dim: '#ffb1c2'
  on-tertiary-fixed: '#3f0018'
  on-tertiary-fixed-variant: '#8f003f'
  background: '#fff8f7'
  on-background: '#3f0019'
  surface-variant: '#ffd9e0'
  background-base: '#FFF8F9'
  surface-cream: '#FFF0F5'
  surface-card: '#FFFFFF'
  pastel-blush: '#FCE4EC'
  whatsapp-green: '#25D366'
  whatsapp-green-dark: '#1EBE5D'
  badge-accent: '#FB7185'
  text-muted: '#8A5868'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 2.25rem
    fontWeight: '800'
    lineHeight: 2.75rem
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.75rem
    fontWeight: '800'
    lineHeight: 2.25rem
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.5rem
    fontWeight: '700'
    lineHeight: 2rem
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.25rem
    fontWeight: '700'
    lineHeight: 1.75rem
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.5rem
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.5rem
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.375rem
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: 1.125rem
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.875rem
    fontWeight: '700'
    lineHeight: 1.25rem
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.75rem
    fontWeight: '600'
    lineHeight: 1rem
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.6875rem
    fontWeight: '700'
    lineHeight: 0.875rem
    letterSpacing: 0.04em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1rem
  margin-tablet: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system expresses a nurturing, delightful, and affectionate pet boutique experience tailored for mobile e-commerce. Designed primarily for pet parents seeking quality grooming, daycare, treats, and accessories, the aesthetic balances playful charm with frictionless shopping convenience.

The visual style blends soft minimalism with tactile, rounded surfaces:
- **Playful Softness:** Voluminous rounded containers (`rounded-3xl`), pill badges, and cushioned interactive targets create a gentle, loving environment reminiscent of care and pampering.
- **Warm Comfort Palette:** Layered creamy whites, strawberry milks, and deep berry accents eliminate clinical sterility while ensuring accessibility and visual warmth.
- **Conversion Utility:** High-intent conversion points—such as direct WhatsApp booking, checkout, and instant care consultations—receive vibrant, distinct contrast treatments that stand out cleanly against the pastel atmosphere.

## Colors

The palette establishes an appetizing, affectionate hierarchy rooted in pinks, deep berry neutrals, and a dedicated messaging action color:

- **Primary (`#EC407A`):** Anchors main interactive triggers, active navigation tabs, rating stars, and primary purchase buttons.
- **Secondary (`#F8BBD0`):** Provides soft structural separation, icon bubble backdrops, and secondary selected states.
- **Tertiary (`#C2185B`):** Applied for prominent focal points, sale badges, discount tags, and active stepper indicators.
- **Neutral (`#500724`):** A deep, warm plum-berry hue replacing harsh synthetic blacks. Used for primary typography, titles, and structural glyphs to preserve warmth while exceeding WCAG AA legibility across light backgrounds.
- **Canvas & Surfaces:**
  - Base canvas uses `#FFF8F9` to eliminate cold white glare.
  - `#FFFFFF` is reserved for elevated product cards, modal sheets, and quick-filter chips to provide contrast against the canvas.
  - `#FFF0F5` and `#FCE4EC` build secondary tiers such as grouped service cards, notification ribbons, and promotional hero tiles.
- **Named Action (`whatsapp-green` - `#25D366`):** Dedicated exclusively to WhatsApp service scheduling, instant customer care, and concierge checkout actions.

## Typography

Typography relies on **Plus Jakarta Sans** across all levels. Its contemporary geometric proportions and gentle humanist roundings complement the pet-care identity without sacrificing legibility during mobile browsing.

- **Display & Headings:** Rendered in bold weights (`700` and `800`) with tight negative tracking (`-0.01em` to `-0.02em`) to deliver confident, friendly storefront banners and category titles.
- **Body:** Styled in regular weight (`400`) using relaxed line heights (`1.5rem` on body-lg) to ensure high readability of ingredients, product sizing, and service descriptions.
- **Labels & Micro-copy:** Rendered with medium-to-bold weights (`600` and `700`) paired with subtle positive tracking for badges, tab items, quick-add buttons, and pricing indicators.
- **Color Assignments:** Primary titles and prices use `#500724`, supporting labels use `#8A5868`, and badges leverage inverse white on accent fills.

## Layout & Spacing

The layout is built for mobile-first commerce, utilizing responsive grids that ensure comfortable single-hand interaction:

- **Mobile Viewports (<640px):** Single-column service stacks or 2-column e-commerce product grids. Outer canvas margins default to `1rem` (16px), with `1rem` gutters between product tiles.
- **Tablet & Large Mobile (640px - 1024px):** Expands to 3-column product displays with `1.5rem` outer page margins.
- **Rhythm & Touch Comfort:**
  - Interactive targets (buttons, cart pills, swatch selectors) enforce a minimum height of 48px.
  - Spacing inside cards leverages `space-md` (16px) for compact, clean groupings without visual clutter.
  - Sticky bottom sheets and WhatsApp floating triggers respect a bottom safe-area offset of `space-lg` (24px).

## Elevation & Depth

Visual hierarchy uses soft, tinted ambient diffusion and crisp white surfaces over cream canvases, avoiding harsh drop shadows:

- **Level 0 (Flat Ground):** Canvas background `#FFF8F9` with no elevation.
- **Level 1 (Card & Tile Rest):** Pure `#FFFFFF` surfaces sitting on `#FFF8F9` with a subtle, tinted blur: `box-shadow: 0 4px 16px -2px rgba(80, 7, 36, 0.05)`.
- **Level 2 (Active & Hover Cards):** Elevated product cards on selection or scroll: `box-shadow: 0 10px 24px -4px rgba(236, 64, 122, 0.12)`.
- **Level 3 (Sticky Trays & Bottom Navigation):** Fixed navigation bars and mobile checkout summaries: `box-shadow: 0 -4px 20px 0 rgba(80, 7, 36, 0.06)`.
- **Level 4 (Floating Overlays & WhatsApp Floating Action Button):** High-priority floating action buttons and modal sheets: `box-shadow: 0 12px 32px -4px rgba(37, 211, 102, 0.35)` for WhatsApp triggers, and `0 16px 40px -6px rgba(80, 7, 36, 0.16)` for dialogs.

## Shapes

The shape system embraces ultra-soft pill and pebble silhouettes (`roundedness: 3`), reinforcing a gentle, cuddly, and pet-safe visual aesthetic:

- **Primary Cards & Containers:** Styled with generous `1.5rem` to `1.75rem` (equivalent to `rounded-3xl` / 24–28px) corner radii.
- **Buttons, Badges & Chips:** Fully pill-shaped (`9999px` / `rounded-full`) for tap targets, promotion tags, search bars, and quantity toggles.
- **Product Image Frames:** Contained within soft nested corners (`1.25rem` / 20px) to complement surrounding card borders without awkward edge pinching.

## Components

### Buttons
- **Primary Action:** Solid `#EC407A` background with crisp `#FFFFFF` text. Pill-shaped (`rounded-full`), min-height 48px, horizontal padding `1.5rem`. Subtle scale down (`active:scale-95`) on press.
- **Secondary Action:** Ghost pill with `#FCE4EC` background, `#C2185B` text, and zero border.
- **WhatsApp Direct Action:** Dedicated pill button in `#25D366` with `#FFFFFF` text, featuring the WhatsApp icon on the leading edge. Used for booking groomings, daycare visits, and live customer inquiries.

### Cards & Service Tiles
- **Product & Service Card:** High-radii (`rounded-3xl`), pure white `#FFFFFF` surface, `1rem` internal padding, resting on `#FFF8F9`.
- **Media Presentation:** Product images are housed in warm cream boxes (`#FFF0F5`) with `rounded-2xl` corners.
- **Card Hierarchy:** Top-aligned category tag or badge, centered product/service photography, followed by service title in `#500724`, price in `#C2185B`, and a rounded quick-add/schedule button.

### Badges & Chips
- **Offer Badges:** Pill-shaped tags with `#FB7185` background and bold white label (`label-sm`), positioned at the top right of product cards.
- **Filter Chips:** Horizontal scrolling pills with `#FFFFFF` background and `#8A5868` text in default state; transforms to `#EC407A` background with white text when selected.

### Input Fields & Controls
- **Search & Text Inputs:** Fully rounded pill-style inputs (`rounded-full`), `#FFFFFF` background, inset border using `#F8BBD0`, placeholder text in `#8A5868`. Focus ring switches to `#EC407A` with a 2px soft glow.
- **Radio Buttons & Checkboxes:** Circular selection discs. Unchecked has a 2px `#F8BBD0` border; checked state fills with `#EC407A` containing a centered white paw or checkmark icon.

### Navigation & Bottom App Bar
- **Mobile Tab Bar:** Fixed bottom container, `#FFFFFF` with blur backdrop, rounded top corners (`rounded-t-3xl`), Level 3 shadow. Active tab indicators use `#EC407A` with subtle dot accents beneath the icon.