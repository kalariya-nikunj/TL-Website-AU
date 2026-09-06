# Header — Full Implementation Specification

A complete, portable description of the Tinkerer Lab site header: structure, colours,
type, spacing, motion, state machine, accessibility, and the exact source. Written so
the header can be rebuilt on another site — either by copying the React/Tailwind source
verbatim, or by following the framework-agnostic recipe in §12.

**Source of truth in this repo**

| Concern | File |
| --- | --- |
| Component | `src/components/layout/Header.tsx` |
| Colour/nav config | `src/content/site.ts` (`headerConfig`, `headerNav`, `headerWordmark`) |
| Design tokens | `src/app/globals.css` (`@theme` block) |
| Width gutter | `src/components/layout/Container.tsx` |
| Account slot | `src/components/layout/AuthButton.tsx` |
| Mobile drawer primitive | `src/components/ui/sheet.tsx` (Radix Dialog) |
| Mobile submenu primitive | `src/components/ui/accordion.tsx` (Radix Accordion) |
| Mount point | `src/app/layout.tsx` |

---

## 1. What it is, in one paragraph

A **fixed, full-width header** that starts **transparent over the homepage hero** and
turns into an **opaque surface bar** the moment the page scrolls past 60px. On scroll it
**compacts**: the square logo mark shrinks from 64px to 40px and the three-line wordmark
beside it **collapses to zero width** (not just fades), so the row closes up rather than
leaving a gap. The bar height never changes (80px), so the nav never moves vertically.
Desktop nav items with children open a **mega panel that is part of the header itself** —
the header *grows downward* on one continuous surface instead of dropping a detached
card — and the panel's contents are **left-aligned to the hovered parent item**, measured
at runtime. Every nav item carries a **2px lime underline that wipes in from the left**.
Below `lg` (1024px) the whole tree becomes a **right-side drawer** with the submenus as an
accordion.

---

## 2. Dependencies

| Package | Version | Used for |
| --- | --- | --- |
| `next` | 16.2.12 | `Link`, `usePathname`, `next/font` |
| `react` | 19.2.4 | hooks (`useId`, `useRef`, `useCallback`) |
| `tailwindcss` | ^4 (4.3.3) | all styling; CSS-first `@theme` config |
| `radix-ui` | ^1.6.7 | `Dialog` (drawer), `Accordion` (mobile submenus) |
| `lucide-react` | ^1.28.0 | `MenuIcon`, `XIcon`, `ChevronDownIcon/UpIcon` |
| `clsx` + `tailwind-merge` | — | the `cn()` class merger |
| `class-variance-authority` | ^0.7.1 | `Button` variants |

**Zero animation libraries.** Everything is CSS transitions. GSAP is in the project but
the header does not touch it.

Browser APIs used: `IntersectionObserver`, `getBoundingClientRect`, `inert`.

---

## 3. Colour scheme

### 3.1 Palette tokens (the only colours that exist)

Declared once in `src/app/globals.css` under `@theme`. Tailwind's default palette is
wiped (`--color-*: initial;`) so off-palette colours are impossible.

```css
/* Maroon — the dominant colour */
--color-primary:      #6e1428;
--color-primary-dark: #3d0b18;
--color-primary-mid:  #96253c;
--color-primary-tint: #f7eaed;

/* Lime — accent only, ~10% of any screen */
--color-accent:       #b8f135;
--color-accent-dark:  #4a6b00;

/* Neutrals */
--color-background:   #faf8f6;   /* page ground (bone) */
--color-surface:      #ffffff;   /* the header bar */
--color-ink:          #1a1113;   /* body/nav text */
--color-muted:        #6b6062;
--color-border:       #e7e2e0;
```

### 3.2 Header colour config (the switchboard)

`src/content/site.ts` — these are **token names**, resolved to class names through lookup
maps in `Header.tsx`. Change one value here and the whole nav recolours.

```ts
export const headerConfig = {
  navColor:      "ink",      // nav links once the bar is solid
  topNavColor:   "primary",  // nav links while transparent over the hero
  logoTextColor: "primary",  // the wordmark
  accentColor:   "accent",   // the underline
} as const satisfies Record<string, TextToken>;
```

Allowed token names (`TextToken` in `src/types/index.ts`):
`ink | primary | primary-dark | background | surface | muted | accent | accent-dark`

> **Why lookup maps, not string interpolation.** Tailwind only compiles class names that
> appear *literally* in source. `` `text-${token}` `` produces no CSS. Hence:
>
> ```ts
> const TEXT: Record<TextToken, string> = {
>   ink: "text-ink", primary: "text-primary", "primary-dark": "text-primary-dark",
>   background: "text-background", surface: "text-surface", muted: "text-muted",
>   accent: "text-accent", "accent-dark": "text-accent-dark",
> };
> const UNDERLINE: Record<TextToken, string> = {
>   ink: "after:bg-ink", primary: "after:bg-primary", /* …one entry per token… */
> };
> ```

### 3.3 Colour by element and state

| Element | Transparent (top of home) | Solid / scrolled | Panel open |
| --- | --- | --- | --- |
| Bar background | `transparent` | `#ffffff` at 95% + `backdrop-blur-sm` (4px) | `#ffffff` (100%, no blur) |
| Bottom border | none | 1px `#e7e2e0` | 1px `#e7e2e0` |
| Nav link text | `#6e1428` (primary) | `#1a1113` (ink) | `#1a1113` |
| Wordmark | `#6e1428` | `#6e1428` | `#6e1428` |
| Logo mark ground | `#6e1428` always | `#6e1428` | `#6e1428` |
| Logo mark glyph | `#ffffff` always | `#ffffff` | `#ffffff` |
| Underline | `#b8f135` (accent) | `#b8f135` | `#b8f135` |
| Submenu link | — | `#1a1113`, hover `#6e1428` | same |
| "Sign in" button | maroon fill / white text, hover `#96253c` | same | same |
| Drawer overlay | `#3d0b18` @ 25% + `backdrop-blur-xs` (2px) | — | — |

The panel-open state deliberately drops the transparency **and** the blur: the submenu
has to stay readable over whatever is behind it.

### 3.4 Focus ring (global, header cannot opt out)

Declared in `@layer base` so no component can override it:

```css
:focus-visible {
  outline: 2px solid var(--color-accent);   /* #b8f135 */
  outline-offset: 2px;
  box-shadow: 0 0 0 6px var(--color-primary-dark); /* #3d0b18 */
}
```

Lime alone is 1.29:1 against the page — far under WCAG 2.2's 3:1 for a focus indicator.
The shadow spreads 6px while the outline occupies 2–4px and outlines paint *over*
shadows, so the ring lands as three bands: **dark → lime → dark**. The outer boundary is
16.1:1 against the page and the lime is 12.4:1 against the dark either side of it.

---

## 4. Typography

Fonts are loaded in `src/app/layout.tsx` via `next/font/google` and exposed as CSS vars
on `<html>`:

```ts
const display = Archivo({ variable: "--font-display", weight: ["600","700"], display: "swap" });
const body    = Inter  ({ variable: "--font-body",    weight: ["400","500"], display: "swap" });
```

| Role | Token | Size | Line height | Tracking | Weight | Family |
| --- | --- | --- | --- | --- | --- | --- |
| Nav link | `text-small` | 0.875rem / 14px | 1.5 | — | 500 (`font-medium`) | Inter |
| Wordmark line | `text-wordmark` | 0.95rem | 1.05 | −0.01em | 600 | Inter |
| Logo glyph (expanded) | `text-h3` | 1.5rem | 1.25 | −0.01em | 600 | **Archivo** |
| Logo glyph (compact) | `text-body` | 1rem | 1.65 | — | 400 | **Archivo** |
| Submenu link | `text-body` | 1rem | 1.65 | — | 400 | Inter |
| Drawer title | `text-h3` | 1.5rem | 1.25 | −0.01em | 600 | Archivo |
| Drawer top-level link | `text-base` | 1rem | 1.65 | — | 600 (`font-semibold`) | Archivo |

The wordmark token exists solely for the header:

```css
--text-wordmark: 0.95rem;
--text-wordmark--line-height: 1.05;
--text-wordmark--letter-spacing: -0.01em;
--text-wordmark--font-weight: 600;
```

Wordmark content (three lines, top to bottom), from `site.ts`:

```ts
export const headerWordmark = ["Tinkerer Lab", "Ahmedabad", "University"] as const;
```

---

## 5. Geometry and spacing

| Property | Value | Class |
| --- | --- | --- |
| Position | `fixed`, `inset-x-0`, `top-0` | `fixed inset-x-0 top-0` |
| Stack order | `z-index: 40` | `z-40` |
| Bar height | **80px, constant in both states** | `h-20` |
| Horizontal gutter | `max-width: 72rem` (1152px), centred; padding 1rem → 1.5rem @640px → 2rem @1024px | `Container`: `mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8` |
| Row layout | `flex items-center justify-between gap-4` | — |
| Logo mark, expanded | 64px square @ `lg`+ | `lg:size-16` |
| Logo mark, compact | 40px square | `size-10` |
| Logo corner radius | 0.5rem (`--radius`, one value site-wide) | `rounded-lg` |
| Wordmark gap from mark | 0.75rem logical inline-start | `ps-3` |
| Nav item gap | 1.75rem | `gap-7` |
| Nav ↔ auth button gap | 1.75rem | `gap-7` |
| Underline offset below text | 0.25rem below the box | `after:-bottom-1` |
| Underline thickness | 2px | `after:h-0.5` |
| Submenu row height | 2.75rem / 44px (touch target) | `h-11` |
| Submenu bottom padding | 1.5rem | `pb-6` |
| Scroll trigger depth | **60px** | sentinel at `top-15` |
| Desktop breakpoint | **1024px** (`lg`) | `lg:` |
| Drawer width | 100%, capped at 24rem | `w-full max-w-sm` |
| Drawer overlay z | 50 (above the header's 40) | `z-50` |

**Important:** the logo mark is `size-10` at *all* widths below `lg` and only reaches
`size-16` at `lg`+ when expanded — `compact ? "size-10 text-body" : "size-10 text-body lg:size-16 lg:text-h3"`.

---

## 6. States

Three booleans drive everything:

```ts
const panelOpen  = openIndex !== null;
const compact    = scrolled;                                   // logo shrinks
const transparent = mode === "over-hero" && !scrolled && !panelOpen;
```

`mode` is the `variant` prop, defaulting by route:

```ts
const mode = variant ?? (pathname === "/" ? "over-hero" : "solid");
```

Only the homepage has a full-bleed hero to sit over. Everything else is `"solid"`.

### 6.1 Surface class resolution

```ts
const surface = transparent
  ? "bg-transparent"
  : panelOpen
    ? "border-b border-border bg-surface"                       // opaque, no blur
    : scrolled
      ? "border-b border-border bg-surface/95 backdrop-blur-sm" // 95% + 4px blur
      : "border-b border-border bg-surface";                    // interior pages, top
```

### 6.2 The layout spacer

A fixed header occupies no document space. Solid pages get it back with an 80px shim;
`over-hero` pages deliberately do **not**, so the hero starts at y=0:

```tsx
{mode === "solid" && <div aria-hidden="true" className="h-20" />}
```

---

## 7. Animation and motion — every timing

| # | Animation | Property | Duration | Easing | Delay | Trigger |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Bar transparent → solid | `background-color`, `border-color` | **300ms** | `ease-out` | — | scroll past 60px |
| 2 | Logo mark 64→40px | `all` (size + font-size) | **300ms** | `ease-out` | — | `compact` |
| 3 | Wordmark collapse | `grid-template-columns` `1fr → 0fr` | **300ms** | `ease-out` | — | `compact` |
| 4 | Wordmark fade | `opacity` `1 → 0` | **300ms** | `ease-out` | — | `compact` |
| 5 | Nav underline wipe | `transform: scaleX(0 → 1)` | **250ms** | `ease-out` | — | hover / focus-visible / `data-open` |
| 6 | Mega panel open | `grid-template-rows` `0fr → 1fr` | **250ms** | `ease-out` | — | hover/focus/click a parent |
| 7 | Panel content fade in | `opacity` `0 → 1` | **200ms** | `ease-out` | **100ms** on open, 0 on close | `panelOpen` |
| 8 | Nav/wordmark colour swap | `color` | Tailwind default 150ms | default | — | `transparent` flips |
| 9 | Panel close grace period | `setTimeout` | **150ms** | — | — | `mouseleave` |
| 10 | Drawer slide + fade | `transform` + `opacity` (`slide-in-from-right-10`) | **200ms** | `ease-in-out` | — | menu button |
| 11 | Drawer overlay fade | `opacity` | **100ms** | — | — | menu button |
| 12 | Accordion expand/collapse | `height` via `--radix-accordion-content-height` | tw-animate default | — | — | accordion trigger |

### 7.1 The underline

Shared by every nav item, desktop and submenu:

```
relative
after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full
after:origin-left after:scale-x-0
after:transition-transform after:duration-250 after:ease-out
hover:after:scale-x-100
focus-visible:after:scale-x-100
data-[open=true]:after:scale-x-100
```

Driven by `transform`, not `width`, so it stays on the compositor. `origin-left` is what
makes it *wipe* rather than *grow from centre*. It also lights up for `data-open`, so the
parent of an open panel stays underlined.

### 7.2 The wordmark collapse — why a grid

Hiding with `display:none` would pop; animating `width` requires a magic pixel value.
Instead the wordmark sits in a 1-column grid whose track animates `1fr → 0fr`, with the
child `min-w-0 overflow-hidden`. The row genuinely closes up, at any content length,
with no measurement:

```tsx
<span
  className="hidden overflow-hidden transition-[grid-template-columns] duration-300 ease-out lg:grid"
  style={{ gridTemplateColumns: compact ? "0fr" : "1fr" }}
>
  <span className={cn("min-w-0 overflow-hidden ps-3 whitespace-nowrap transition-opacity duration-300 ease-out", wordmarkColor, compact ? "opacity-0" : "opacity-100")}>
    {headerWordmark.map((line) => <span key={line} className="block text-wordmark">{line}</span>)}
  </span>
</span>
```

### 7.3 The mega panel — same trick, vertical

```tsx
<div
  className="hidden transition-[grid-template-rows] duration-250 ease-out lg:grid"
  style={{ gridTemplateRows: panelOpen ? "1fr" : "0fr" }}
>
  <div className="overflow-hidden">…</div>
</div>
```

The panel is a **sibling inside `<header>`**, below the `Container` that holds the bar —
not a portal, not `position:absolute`. The header's own background therefore extends over
it and the whole thing reads as one surface growing downward.

The list fades on a shorter 200ms with a **100ms delay when opening** so the height
animation is underway before text appears, and **no delay when closing** so text clears
before the box collapses.

### 7.4 Reduced motion

A global escape hatch in `globals.css` neutralises all of the above:

```css
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 8. Behaviour and logic

### 8.1 Scroll detection — no scroll listener

A 1px, zero-height, `pointer-events-none` sentinel is parked 60px down the document and
watched with an `IntersectionObserver`. This keeps scroll state entirely off the main
scroll loop:

```tsx
<div className="relative h-0">
  <div ref={sentinelRef} aria-hidden="true"
       className="pointer-events-none absolute top-15 h-px w-full" />
</div>
```

```ts
useEffect(() => {
  const el = sentinelRef.current;
  if (!el) return;
  const observer = new IntersectionObserver(
    ([entry]) => setScrolled(!entry.isIntersecting),
    { threshold: 0 },
  );
  observer.observe(el);
  return () => observer.disconnect();
}, []);
```

`top-15` = 3.75rem = **60px** (Tailwind v4 spacing scale, `0.25rem × 15`).

### 8.2 Panel open/close

- **One index, not a boolean per item.** `openIndex: number | null`. Moving from one
  parent to another only changes the index, so the panel never closes and reopens —
  no flicker, no re-run of the open animation.
- **Opens on** `mouseenter`, `focus`, and `click` (click on an already-open item closes it).
- **Closes on** `mouseleave` of the whole `<header>` — via a **150ms** timer, so diagonal
  pointer travel toward the submenu doesn't kill it. `mouseenter` on the panel cancels
  the timer.
- Childless nav items and the logo/auth button call `scheduleClose()` on hover/focus, so
  moving sideways to a plain link dismisses the panel.

```ts
const CLOSE_DELAY_MS = 150;

const cancelClose = useCallback(() => {
  if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
}, []);
const openPanel  = useCallback((i: number) => { cancelClose(); setOpenIndex(i); }, [cancelClose]);
const closePanel = useCallback(() => { cancelClose(); setOpenIndex(null); }, [cancelClose]);
const scheduleClose = useCallback(() => {
  cancelClose();
  closeTimer.current = setTimeout(() => setOpenIndex(null), CLOSE_DELAY_MS);
}, [cancelClose]);

useEffect(() => cancelClose, [cancelClose]);  // clear on unmount
```

### 8.3 Submenu alignment — measured, not tokenised

The submenu list starts at the **left edge of the hovered parent item**. That offset is a
runtime measurement (nav item widths depend on label text and font loading), re-taken on
resize, applied as `margin-inline-start`:

```ts
useEffect(() => {
  if (openIndex === null) return;
  const measure = () => {
    const row = rowRef.current;
    const item = itemRefs.current[openIndex];
    if (!row || !item) return;
    setSubmenuOffset(
      item.getBoundingClientRect().left - row.getBoundingClientRect().left,
    );
  };
  measure();
  window.addEventListener("resize", measure);
  return () => window.removeEventListener("resize", measure);
}, [openIndex]);
```

### 8.4 Escape

Closes the panel and returns focus to the parent trigger that opened it:

```ts
useEffect(() => {
  if (openIndex === null) return;
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Escape") return;
    const returnTo = itemRefs.current[openIndex];
    closePanel();
    returnTo?.focus();
  };
  document.addEventListener("keydown", onKeyDown);
  return () => document.removeEventListener("keydown", onKeyDown);
}, [openIndex, closePanel]);
```

---

## 9. Accessibility contract

| Requirement | How |
| --- | --- |
| Parent items are buttons, not links | items with `children` render `<button type="button">` — they open a menu, they do not navigate |
| Expanded state announced | `aria-expanded={isOpen}` + `aria-controls={panelId}` (`useId()`) |
| Panel labelled | `role="region"` + `aria-label={`${activeItem.label} menu`}` |
| Collapsed panel unreachable | **`inert={!panelOpen}`** — removes it from tab order *and* the a11y tree; `overflow:hidden` alone would not |
| Landmarks | `<header>` → `<nav aria-label="Main">` desktop, `<nav aria-label="Mobile">` in the drawer |
| Keyboard opens panels | `onFocus` opens, so Tab alone reveals submenus |
| Escape | closes and restores focus to the trigger |
| Decorative elements hidden | logo glyph `aria-hidden`, sentinel `aria-hidden`, spacer `aria-hidden` |
| Accessible home link name | `<span className="sr-only">Tinkerer Lab — home</span>` inside the logo link |
| Icon buttons named | `<span className="sr-only">Open menu</span>` / `Close` |
| Touch targets | submenu and drawer rows are `h-11` (44px) / `h-12` (48px) |
| Focus visible everywhere | the global 3-band ring in §3.4 |
| Body scroll lock | handled by Radix Dialog while the drawer is open |
| Skip link | in `layout.tsx`, jumps to `#main` past the header |
| Reduced motion | global override, §7.4 |

---

## 10. Mobile (< 1024px)

Touch has no hover, so the same tree becomes a drawer.

- Trigger: ghost icon button, `lg:hidden`, tinted with the *same* `navColor` the desktop
  nav is using — so it is maroon over the hero and ink once solid.
- Drawer: Radix `Dialog` styled as a sheet, `side="right"`, `w-full max-w-sm`,
  slide-in-from-right-10 + fade, 200ms `ease-in-out`.
- Overlay: `bg-primary-dark/25` with `backdrop-blur-xs`, 100ms fade.
- Header of the drawer: site name in `font-display text-h3 text-primary`.
- Body: `Accordion type="single" collapsible`.
  - Items **with** children → `AccordionItem` (chevron-down / chevron-up in `text-primary`).
  - Items **without** children → a plain `Link`, `h-12`, `border-b border-border`,
    `font-display text-base font-semibold text-ink`, `hover:text-primary`.
  - Child links → `h-11 text-body text-muted hover:text-primary`; clicking closes the drawer.
- Footer: `border-t border-border p-4` containing the full-width auth button.

---

## 11. Navigation data

```ts
export const headerNav: NavItem[] = [
  { label: "Home", href: "/" },                                   // no children → plain link
  { label: "About", href: "/about", children: [
      { label: "The lab",   href: "/about" },
      { label: "Our team",  href: "/about#team" },
      { label: "Visit us",  href: "/help#visit" },
  ]},
  { label: "Workshops", href: "/workshops", children: [
      { label: "Upcoming events", href: "/workshops" },
      { label: "Past events",     href: "/workshops#past" },
      { label: "Calendar",        href: "/workshops#calendar" },
  ]},
  { label: "Facilities", href: "/facilities", children: [
      { label: "All equipment",     href: "/facilities" },
      { label: "Safety & training", href: "/facilities#safety" },
      { label: "Book a machine",    href: "/facilities#booking" },
  ]},
  { label: "Portfolio", href: "/portfolio", children: [
      { label: "Student projects", href: "/portfolio" },
      { label: "Lab projects",     href: "/portfolio#lab" },
  ]},
  { label: "Help", href: "/help", children: [
      { label: "FAQ",           href: "/help#faq" },
      { label: "Access & rules", href: "/help#access" },
      { label: "Contact",        href: "/help#contact" },
  ]},
];
```

```ts
type NavLink = { label: string; href: string };
type NavItem = NavLink & { children?: NavLink[] };
```

The account slot on the right has three states — **loading / signed-out / signed-in** —
and `loading` renders a `h-8 w-20` (desktop) or `h-11 w-full` (mobile) pulsing
`bg-primary-tint` placeholder so the row does not reflow when auth resolves.

---

## 12. Porting guide

### 12.1 If the target site is Next.js + Tailwind v4

1. Copy `Header.tsx`, `Container.tsx` and (if you want auth) `AuthButton.tsx`.
2. Copy `sheet.tsx`, `accordion.tsx`, `button.tsx` from `src/components/ui/`.
3. Copy the `@theme` colour block, the `--text-*` scale (at minimum `wordmark`, `small`,
   `body`, `h3`), `--radius`, the `:focus-visible` base rule and the reduced-motion block
   into the target's global CSS.
4. Copy `headerNav`, `headerConfig`, `headerWordmark`, `site` into the target's content
   module, and `NavItem` / `NavLink` / `TextToken` into its types.
5. Install `radix-ui`, `lucide-react`, `clsx`, `tailwind-merge`, `class-variance-authority`.
6. Mount `<Header />` above `<main>` in the root layout.
7. Set `mode`: the default is `pathname === "/" ? "over-hero" : "solid"`. If the target's
   hero lives elsewhere, pass `variant` explicitly.

### 12.2 If the target site is **not** Tailwind

Everything above is plain CSS underneath. Minimal portable version:

```html
<div class="hdr-sentinel-wrap"><div class="hdr-sentinel" aria-hidden="true"></div></div>

<header class="hdr" data-transparent="true" data-compact="false" data-panel="false">
  <div class="hdr-container">
    <div class="hdr-row">
      <a class="hdr-logo" href="/">
        <span class="hdr-mark" aria-hidden="true">TL</span>
        <span class="hdr-wordmark-track">
          <span class="hdr-wordmark">
            <span>Tinkerer Lab</span><span>Ahmedabad</span><span>University</span>
          </span>
        </span>
        <span class="sr-only">Tinkerer Lab — home</span>
      </a>

      <nav class="hdr-nav" aria-label="Main">
        <ul>
          <li><a class="hdr-item" href="/">Home</a></li>
          <li>
            <button class="hdr-item" type="button"
                    aria-expanded="false" aria-controls="hdr-panel" data-open="false">About</button>
          </li>
          <!-- … -->
        </ul>
      </nav>
    </div>
  </div>

  <div class="hdr-panel" id="hdr-panel" role="region" aria-label="Submenu" inert>
    <div class="hdr-panel-clip">
      <div class="hdr-container">
        <ul class="hdr-panel-list"><!-- children of the active item --></ul>
      </div>
    </div>
  </div>
</header>
```

```css
:root {
  --primary:#6e1428; --primary-dark:#3d0b18; --primary-mid:#96253c; --primary-tint:#f7eaed;
  --accent:#b8f135;  --accent-dark:#4a6b00;
  --background:#faf8f6; --surface:#ffffff; --ink:#1a1113; --muted:#6b6062; --border:#e7e2e0;
  --radius:.5rem;
}

.hdr-sentinel-wrap { position:relative; height:0; }
.hdr-sentinel { position:absolute; top:60px; height:1px; width:100%; pointer-events:none; }

.hdr {
  position:fixed; inset-inline:0; top:0; z-index:40;
  background:var(--surface); border-bottom:1px solid var(--border);
  transition: background-color 300ms ease-out, border-color 300ms ease-out;
}
.hdr[data-transparent="true"] { background:transparent; border-bottom-color:transparent; }
.hdr[data-transparent="false"][data-panel="false"][data-compact="true"] {
  background: color-mix(in srgb, var(--surface) 95%, transparent);
  backdrop-filter: blur(4px);
}

.hdr-container { margin-inline:auto; width:100%; max-width:72rem; padding-inline:1rem; }
@media (min-width:640px)  { .hdr-container { padding-inline:1.5rem; } }
@media (min-width:1024px) { .hdr-container { padding-inline:2rem; } }

.hdr-row { display:flex; height:80px; align-items:center; justify-content:space-between; gap:1rem; }

/* Logo mark */
.hdr-logo { display:flex; align-items:center; text-decoration:none; }
.hdr-mark {
  display:grid; place-items:center; flex:none;
  width:40px; height:40px; font-size:1rem;
  border-radius:var(--radius); background:var(--primary); color:var(--surface);
  font-family:"Archivo",system-ui,sans-serif; font-weight:600;
  transition: width 300ms ease-out, height 300ms ease-out, font-size 300ms ease-out;
}
@media (min-width:1024px) {
  .hdr[data-compact="false"] .hdr-mark { width:64px; height:64px; font-size:1.5rem; }
}

/* Wordmark: grid track collapses 1fr → 0fr */
.hdr-wordmark-track {
  display:none; overflow:hidden;
  grid-template-columns:1fr;
  transition: grid-template-columns 300ms ease-out;
}
@media (min-width:1024px) { .hdr-wordmark-track { display:grid; } }
.hdr[data-compact="true"] .hdr-wordmark-track { grid-template-columns:0fr; }
.hdr-wordmark {
  min-width:0; overflow:hidden; padding-inline-start:.75rem; white-space:nowrap;
  color:var(--primary); opacity:1; transition:opacity 300ms ease-out;
  font-size:.95rem; line-height:1.05; letter-spacing:-.01em; font-weight:600;
}
.hdr-wordmark > span { display:block; }
.hdr[data-compact="true"] .hdr-wordmark { opacity:0; }

/* Nav + the wiping underline */
.hdr-nav ul { display:flex; align-items:center; gap:1.75rem; list-style:none; margin:0; padding:0; }
.hdr-item {
  position:relative; background:none; border:0; padding:0; cursor:pointer;
  font:500 .875rem/1.5 "Inter",system-ui,sans-serif;
  color:var(--ink); text-decoration:none; transition:color 150ms;
}
.hdr[data-transparent="true"] .hdr-item { color:var(--primary); }
.hdr-item::after {
  content:""; position:absolute; left:0; bottom:-.25rem; height:2px; width:100%;
  background:var(--accent); transform:scaleX(0); transform-origin:left;
  transition:transform 250ms ease-out;
}
.hdr-item:hover::after,
.hdr-item:focus-visible::after,
.hdr-item[data-open="true"]::after { transform:scaleX(1); }

/* Mega panel: grid rows collapse 1fr → 0fr */
.hdr-panel {
  display:none; grid-template-rows:0fr;
  transition:grid-template-rows 250ms ease-out;
}
@media (min-width:1024px) { .hdr-panel { display:grid; } }
.hdr[data-panel="true"] .hdr-panel { grid-template-rows:1fr; }
.hdr-panel-clip { overflow:hidden; }
.hdr-panel-list {
  display:flex; flex-direction:column; list-style:none; margin:0; padding:0 0 1.5rem;
  opacity:0; transition:opacity 200ms ease-out;
  margin-inline-start:var(--submenu-offset, 0px);   /* set from JS */
}
.hdr[data-panel="true"] .hdr-panel-list { opacity:1; transition-delay:100ms; }
.hdr-panel-list a {
  display:flex; align-items:center; height:2.75rem; width:fit-content;
  position:relative; font-size:1rem; color:var(--ink); text-decoration:none;
  transition:color 150ms;
}
.hdr-panel-list a:hover { color:var(--primary); }

/* Global focus ring */
:focus-visible {
  outline:2px solid var(--accent); outline-offset:2px;
  box-shadow:0 0 0 6px var(--primary-dark);
}

@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration:.01ms !important; animation-iteration-count:1 !important;
    transition-duration:.01ms !important; scroll-behavior:auto !important;
  }
}
```

```js
const hdr = document.querySelector(".hdr");
const row = hdr.querySelector(".hdr-row");
const items = [...hdr.querySelectorAll(".hdr-item[aria-expanded]")];
const panel = hdr.querySelector(".hdr-panel");
const list  = hdr.querySelector(".hdr-panel-list");
const CLOSE_DELAY_MS = 150;
let openIndex = null, closeTimer = null;

// Scroll state — sentinel + IntersectionObserver, no scroll listener.
new IntersectionObserver(
  ([e]) => { hdr.dataset.compact = String(!e.isIntersecting); sync(); },
  { threshold: 0 },
).observe(document.querySelector(".hdr-sentinel"));

const overHero = location.pathname === "/";
function sync() {
  const panelOpen = openIndex !== null;
  hdr.dataset.panel = String(panelOpen);
  hdr.dataset.transparent =
    String(overHero && hdr.dataset.compact === "false" && !panelOpen);
  panel.toggleAttribute("inert", !panelOpen);
  items.forEach((el, i) => {
    const on = i === openIndex;
    el.dataset.open = String(on);
    el.setAttribute("aria-expanded", String(on));
  });
  if (panelOpen) {
    list.style.setProperty("--submenu-offset",
      `${items[openIndex].getBoundingClientRect().left - row.getBoundingClientRect().left}px`);
    renderChildren(openIndex);              // fill `list` from your nav data
  }
}

const cancelClose = () => { clearTimeout(closeTimer); closeTimer = null; };
const openPanel  = (i) => { cancelClose(); openIndex = i;    sync(); };
const closePanel = ()  => { cancelClose(); openIndex = null; sync(); };
const scheduleClose = () => { cancelClose(); closeTimer = setTimeout(closePanel, CLOSE_DELAY_MS); };

items.forEach((el, i) => {
  el.addEventListener("mouseenter", () => openPanel(i));
  el.addEventListener("focus",      () => openPanel(i));
  el.addEventListener("click",      () => (openIndex === i ? closePanel() : openPanel(i)));
});
hdr.addEventListener("mouseleave", scheduleClose);
panel.addEventListener("mouseenter", cancelClose);
window.addEventListener("resize", () => openIndex !== null && sync());
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape" || openIndex === null) return;
  const back = items[openIndex];
  closePanel();
  back.focus();
});
sync();
```

Below 1024px, replace the panel with any drawer + accordion (or `<details>`) — the
constraints that matter are: 44px minimum rows, body scroll lock while open, focus trap,
and closing the drawer on link click.

---

## 13. Gotchas — read before changing anything

1. **Never interpolate token names into Tailwind classes.** `` `text-${token}` `` compiles
   to nothing. Add to the `TEXT` / `UNDERLINE` maps instead.
2. **The bar height is 80px in both states.** Only the logo resizes. If you animate the
   height, every nav item drifts vertically on scroll — this was deliberate.
3. **`transparent` must be false while the panel is open.** Otherwise the submenu renders
   over the hero with no ground behind it.
4. **`inert` is required on the collapsed panel.** `overflow:hidden` still leaves the links
   tabbable and announced.
5. **Keep the 150ms close delay.** Without it the panel dies during the diagonal pointer
   move from the parent item toward the submenu.
6. **Don't portal the panel.** It is a sibling inside `<header>` on purpose — the shared
   background is the whole effect.
7. **The 0fr↔1fr grid trick needs `min-width:0` / `overflow:hidden` on the child**, or the
   content refuses to compress.
8. **Submenu offset must be re-measured on resize** and after web fonts load — item widths
   depend on the rendered text.
9. **The sentinel is at 60px, the bar is 80px.** They are independent numbers: the state
   flips slightly *before* the bar would have scrolled clear of the hero.
10. **The header is `z-40`, the drawer is `z-50`.** Keep that ordering or the overlay
    renders under the bar.
11. **Interior pages need the 80px spacer.** Remove it and content slides under the fixed
    header.
12. **`--radius` is one value site-wide (0.5rem).** All eight radius steps are aliased to
    it, so there is no "slightly rounder" option to reach for.
