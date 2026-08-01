# Tinkerer Lab — Project Foundation

Ahmedabad University Tinkerer Lab website.
This document is the single source of truth for architecture, conventions, and build order.
Read this before writing any code.

---

## 1. Purpose

A public website for the Tinkerer Lab — a maker/fabrication lab for engineering students.

It must:
- Introduce the lab and its team
- Show facilities and equipment available to students
- List workshops and events, and let students sign up
- Showcase student and lab projects
- Provide help, FAQ, and contact

Audience: primarily students of the university, plus faculty, visitors, and prospective students.

---

## 2. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | Handles frontend and all server needs |
| Styling | Tailwind CSS | Design tokens defined in config |
| Components | shadcn/ui | Copied into repo, restyled with our tokens |
| Content | Content-as-code (TS / MDX in repo) | Team, facilities, projects — edited via git |
| Auth | Firebase Auth (Google sign-in) | For event registration |
| Database | Firebase Firestore | Only registrations + contact submissions |
| Events | Google Calendar (embed / API) | Source of truth for event dates |
| Hosting | Vercel | Auto-deploy on git push |
| Package manager | pnpm | |
| Icons | lucide-react | Ships with shadcn |

**There is no separate backend service.** Server work runs in Next.js Server Actions and Route Handlers.

### Performance rule (non-negotiable)

Server Components are the default. Add `"use client"` **only** for components that need
state, effects, or browser APIs. Expected client components in v1:

- Mobile nav toggle
- Auth button / user menu
- Event registration form
- Contact form

Everything else stays server-rendered. This is what keeps the site light.

---

## 3. Site structure

```
/                     Home — hub page, previews every section
/about                About the lab + team members
/workshops            Workshops & events listing + calendar
/workshops/[slug]     Single event detail + registration
/facilities           Equipment catalogue
/facilities/[slug]    Single equipment detail (specs, safety, access)
/portfolio            Project showcase
/portfolio/[slug]     Single project detail
/help                 FAQ, how to access the lab, contact form
/login                Sign in (Google)
/my-registrations     Logged-in user's registered events
```

All pages render inside one shared shell (header + footer + tokens). This is what makes
the site feel like one site rather than stitched-together templates.

### Home page sections (in order)

1. Hero — headline, short intro, primary CTA, rotating slides/video
2. Current news / announcements strip
3. About preview → links to `/about`
4. Team preview (member avatars) → links to `/about`
5. Workshops & events preview (next 3 events) → links to `/workshops`
6. Facilities preview (equipment grid) → links to `/facilities`
7. Portfolio preview (featured projects) → links to `/portfolio`
8. Help / contact CTA → links to `/help`

---

## 4. Folder structure

```
src/
  app/
    layout.tsx              Root layout — header, footer, fonts
    page.tsx                Home
    about/page.tsx
    workshops/page.tsx
    workshops/[slug]/page.tsx
    facilities/page.tsx
    facilities/[slug]/page.tsx
    portfolio/page.tsx
    portfolio/[slug]/page.tsx
    help/page.tsx
    login/page.tsx
    my-registrations/page.tsx
    globals.css
  components/
    layout/                 Header, Footer, MobileNav, Container
    sections/               Hero, SectionHeader, CardGrid, CTA, ...
    cards/                  EventCard, FacilityCard, ProjectCard, TeamCard
    forms/                  RegistrationForm, ContactForm
    feedback/               StatusMessage — the one way state is reported
    media/                  ImagePlaceholder (swapped for next/image in Phase 5)
    ui/                     shadcn components (do not hand-edit casually)
  content/
    team.ts
    facilities.ts
    projects.ts
    faq.ts
    site.ts                 Site name, nav links, socials, contact info
  lib/
    firebase.ts             Client SDK init
    firebase-admin.ts       Admin SDK (server only)
    auth.ts                 Auth helpers
    utils.ts                cn() and helpers
  types/
    index.ts                Shared TypeScript types
```

---

## 5. Data model

Five entities. These drive both the content files and the Firestore collections.

```ts
type TeamMember = {
  id: string
  name: string
  role: string
  photo: string
  bio?: string
  links?: { label: string; url: string }[]
}

type Facility = {
  slug: string
  name: string              // e.g. "Laser Cutter"
  category: string          // e.g. "Fabrication"
  shortDescription: string
  description: string
  specs: { label: string; value: string }[]
  safetyNotes?: string[]
  images: string[]
  requiresTraining: boolean
}

type Project = {
  slug: string
  title: string
  team: string[]
  year: number
  tags: string[]
  shortDescription: string
  description: string
  images: string[]
  featured: boolean
}

type LabEvent = {
  slug: string
  title: string
  startsAt: string          // ISO
  endsAt: string
  location: string
  shortDescription: string
  description: string
  capacity?: number
  registrationOpen: boolean
  image?: string
}

type Registration = {          // Firestore only
  id: string
  eventSlug: string
  userId: string
  name: string
  email: string
  studentId?: string
  department?: string
  phone?: string
  createdAt: Timestamp
}

type ContactSubmission = {     // Firestore only
  id: string
  name: string
  email: string
  subject: string
  message: string
  createdAt: Timestamp
}
```

**Content-as-code:** `TeamMember`, `Facility`, `Project` live in `src/content/*.ts`.
**Firestore:** only `registrations` and `contactSubmissions`.
**Events:** author in `src/content/` or pull from Google Calendar — decide in Phase 4.

---

## 6. Design system

### Rules

1. **Tokens live in `src/app/globals.css`.** Tailwind v4 is CSS-first — there is no
   `tailwind.config.ts`; the palette, radius, and font tokens are declared in `@theme`
   and `:root` in `globals.css`. No arbitrary hex values or one-off spacing anywhere in
   components. If a value isn't a token, it doesn't get used.
2. **One card style, one button style, one heading scale** across the entire site.
3. **Reference sites are for layout inspiration only.** Never copy their CSS, assets, or
   copy. Rebuild the structure with our tokens and our components.
4. All spacing from the Tailwind scale. All colours from the token palette.

### Tokens (defined in Phase 2 — `src/app/globals.css`)

Tailwind's default palette is reset (`--color-*: initial`), so these eleven values are
the only colours that exist. `bg-red-500` and friends do not compile.

```
Colours
  --color-primary        #6E1428   deep maroon — university brand colour
  --color-primary-dark   #3D0B18   near-black maroon — dark sections, footer
  --color-primary-mid    #96253C   hover states
  --color-primary-tint   #F7EAED   subtle backgrounds
  --color-accent         #B8F135   high-vis lime — CTAs, focus rings, active states
  --color-accent-dark    #4A6B00   text-safe green (green text on light backgrounds)
  --color-background     #FAF8F6   warm bone page background
  --color-surface        #FFFFFF   cards
  --color-ink            #1A1113   body text
  --color-muted          #6B6062   secondary text
  --color-border         #E7E2E0   dividers

Typography  Archivo 600/700 (--font-display) · Inter 400/500 (--font-body)
Type scale  text-h1 / text-h2 / text-h3 / text-body / text-small + the `eyebrow` utility
Radius      --radius: 0.5rem — every rounded-* step maps to it
Spacing     Tailwind default scale
```

### Semantic state tokens

```
  --color-destructive        #D93A2B   errors, invalid fields, failed actions
  --color-destructive-tint   #FDEBE8   error message backgrounds
  --color-destructive-dark   #8F1D12   error text on light backgrounds
  --color-success            #0E7A4A   confirmations, successful submissions
  --color-success-tint       #E6F4EC
  --color-warning            #B26A00   cautions, capacity limits, closing-soon
  --color-warning-tint       #FDF1DE
```

1. `destructive` is reserved exclusively for error and destructive states. Never
   decorative — the primary colour is already a red, so casual use of destructive red
   destroys the signal.
2. **State is never carried by colour alone.** Every error and success shows a coloured
   border, an inline icon, and text. `<StatusMessage />` bundles all three (plus a
   visually hidden label); reach for it rather than the tokens directly.
3. `success` is a distinct green from the lime accent. Accent means "interactive",
   success means "it worked". Never substitute one for the other.
4. `destructive` is wired into the shadcn `destructive` variant, so Button and Badge
   pick it up automatically; Input, Textarea and Select respond to `aria-invalid`.

Contrast note: `warning` on `warning-tint` is 3.8:1, under AA for body text, and the
palette has no `warning-dark`. Warning copy is therefore `ink`, with the state carried
by the border and icon. `#8A5200` would work as a `warning-dark` at 5.7:1 if wanted.

### Colour usage rules

1. Maroon is dominant. Lime is an accent only — roughly 10% of any screen: primary CTA
   buttons, focus rings, active states, hover underlines, small graphic accents. Never
   large background areas, never body text.
2. Never place maroon and lime directly adjacent as large blocks. Separate with neutrals.
3. Lime text on white fails contrast — use `accent-dark` for green text on light
   backgrounds. Lime on `primary-dark` is the signature pairing (hero, footer).
4. Dark sections use the `dark-band` utility: `primary-dark` ground, `background` text,
   lime accents.

### Composed utilities

- `eyebrow` — the full eyebrow role in one class (size, family, weight, tracking, case,
  colour). Flips to lime automatically inside `dark-band`.
- `dark-band` — the dark section treatment.
- `hover-underline` — link underline that picks the contrast-correct colour for its ground.

Focus is handled once, globally: `:focus-visible` gets a 2px lime outline at 2px offset,
over a `primary-dark` keyline that reads as three bands (dark, lime, dark). Lime alone is
1.29:1 against the page — under the 3:1 WCAG 2.2 asks of a focus indicator — so the dark
outer boundary carries the contrast at 16.1:1. The shadcn primitives have had their own
`outline-none` and ring utilities stripped so nothing can opt out.

### Core components to build

**Layout:** `Container`, `Header`, `MobileNav`, `Footer`
**Sections:** `Hero`, `SectionHeader`, `CardGrid`, `CTASection`, `NewsStrip`
**Cards:** `EventCard`, `FacilityCard`, `ProjectCard`, `TeamCard`
**Forms:** `RegistrationForm`, `ContactForm`
**shadcn primitives:** `button`, `card`, `input`, `label`, `textarea`, `dialog`, `badge`,
`select`, `sheet`, `accordion` (FAQ), `sonner` (toasts)

Every page is assembled from these. Do not write bespoke layout code inside a page file
when a section component would do — that is how pages drift apart visually.

---

## 7. Build order

### Phase 0 — Foundation
- [x] `create-next-app` with TypeScript, Tailwind, App Router, `src/` dir
- [x] `shadcn init`
- [x] Git repo + push to GitHub — *committed; push pending credentials on the dev machine*
- [ ] Connect Vercel, **deploy the empty app immediately**
- [x] Create folder structure above
- [x] Write `src/types/index.ts` and `src/content/site.ts`

### Phase 1 — Skeleton (structure only, deliberately unstyled)
- [x] Root layout with Header + Footer
- [x] Working nav (desktop + mobile), all links resolve
- [x] Every route in section 3 exists and renders
- [x] Placeholder content files with 3–5 dummy entries each
- [x] Section + card components built with real props and dummy data
- [x] Responsive layout correct at mobile / tablet / desktop

**Exit criteria: every page is reachable and structurally correct. Do not style yet.**

### Phase 2 — Design system
- [x] Define real tokens in `globals.css` (Tailwind v4 is CSS-first — no config file)
- [x] Load fonts via `next/font` — Archivo + Inter
- [x] Restyle shadcn primitives to match tokens
- [x] Apply across all components
- [x] Focus ring given a `primary-dark` keyline so it clears WCAG 3:1 on light surfaces
- [x] Semantic state tokens (destructive / success / warning) wired into the primitives
- [ ] **Open:** add a `warning-dark` if warning text needs to carry colour — `#B26A00`
      is 3.8:1 on its tint, so warning copy is currently `ink`

### Phase 3 — Sections and polish
- [ ] Build reference-inspired layouts section by section
- [ ] Hero, facility grid, team grid, project cards
- [ ] Hover and focus states, empty states
- [ ] Optional: subtle motion (Framer Motion), used sparingly

### Phase 4 — Dynamic features
- [ ] Firebase project + config, env vars in Vercel
- [ ] Google sign-in, auth state in header
- [ ] Event registration form → Firestore (Server Action)
- [ ] `/my-registrations` page, route protection
- [ ] Contact form → Firestore
- [ ] Firestore security rules
- [ ] Google Calendar embed or API

### Phase 5 — Content and launch
- [ ] Real copy, real photos (optimised, `next/image`)
- [ ] Metadata, Open Graph, favicon, sitemap
- [ ] Accessibility pass — keyboard nav, focus visibility, alt text, contrast
- [ ] Lighthouse pass
- [ ] Custom domain

---

## 8. Conventions

- Components: `PascalCase.tsx`. Utilities and content: `kebab-case.ts`
- Named exports for components; default export only for pages
- Every component takes typed props — no `any`
- Images in `/public/images/{team,facilities,projects}/`, always with `alt` text
- Never commit `.env.local`. Firebase Admin credentials are server-only, never in a
  `NEXT_PUBLIC_` variable
- Commit style: `feat:`, `fix:`, `chore:`, `style:`
- Branches: `main` deploys to production; feature branches get Vercel previews

---

## 9. Environment variables

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID

FIREBASE_ADMIN_PROJECT_ID        # server only
FIREBASE_ADMIN_CLIENT_EMAIL      # server only
FIREBASE_ADMIN_PRIVATE_KEY       # server only

GOOGLE_CALENDAR_ID               # Phase 4
```

Not needed until Phase 4. Phase 1 runs with no environment variables at all.

---

## 10. Reference sites

Used for **layout and structure inspiration only** — never for CSS, assets, or copy.

- https://tworks.telangana.gov.in/
- https://iaac.net/about-us/fab-lab-barcelona/
- https://fablabkerala.in/
- https://vigyanashram.com/
- https://the-workshop.in/

Keep a running map of which reference informs which section, so design decisions are made
once up front rather than improvised per page.

| Section | Reference | Notes |
|---|---|---|
| Hero | | |
| Facilities grid | | |
| Team | | |
| Projects | | |
| Footer | | |
