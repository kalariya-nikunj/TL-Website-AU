# Tinkerer Lab — Website

Public website for the Ahmedabad University Tinkerer Lab. Next.js (App Router) +
TypeScript + Tailwind v4 + shadcn/ui.

---

## Getting started

Follow these in order. Every step is listed, including the obvious ones.

### 1. Install Node.js 22

Check what you have:

```bash
node -v
```

If the command is missing or the version is below 22, install it with
[nvm](https://github.com/nvm-sh/nvm):

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
```

Close and reopen your terminal, then:

```bash
nvm install 22
nvm use 22
node -v          # should print v22.x
```

> **Note:** nvm only applies to the shell you ran it in. If `node` is "not found"
> in a new terminal, run `nvm use 22` again, or add it to your `~/.bashrc`.

### 2. Enable pnpm

This project uses **pnpm**, not npm. Node 22 ships with Corepack, which installs it
for you:

```bash
corepack enable
pnpm -v          # should print 10.x or newer
```

If `corepack` is unavailable, install pnpm directly:

```bash
npm install -g pnpm
```

### 3. Clone the repository

```bash
git clone https://github.com/hellKing-Diablo/TL-Website-AU.git
cd TL-Website-AU
```

### 4. Install dependencies

```bash
pnpm install
```

This creates `node_modules/` from `pnpm-lock.yaml`. It takes a minute on a first run.

> Do not run `npm install` — it generates a `package-lock.json` that conflicts with
> the pnpm lockfile. If you did it by accident, delete `package-lock.json` and
> `node_modules/`, then run `pnpm install`.

### 5. Environment variables

**None are needed right now.** The site currently runs entirely on content files in
`src/content/`, with no database and no auth.

Firebase and Google Calendar keys arrive in Phase 4. When they do, they go in a
`.env.local` file at the project root — which is gitignored and must **never** be
committed.

### 6. Start the dev server

```bash
pnpm dev
```

Open <http://localhost:3000>. The page reloads as you edit files.

To stop it, press `Ctrl+C`.

### 7. Check it builds before you push

```bash
pnpm build
```

A failing build is a failing deploy. Run this before opening a pull request.

---

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Dev server at `localhost:3000`, with hot reload |
| `pnpm build` | Production build — also the type check |
| `pnpm start` | Serve the production build (run `pnpm build` first) |
| `pnpm lint` | ESLint |

---

## Where things live

```
src/
  app/          Routes. One folder per URL, [slug] for detail pages
  components/
    layout/     Header, Footer, Container
    sections/   Page-level blocks — Hero, CardGrid, CTASection, ...
    cards/      EventCard, FacilityCard, ProjectCard, TeamCard
    forms/      RegistrationForm, ContactForm
    media/      ImageGallery, ImagePlaceholder
    ui/         shadcn primitives — avoid hand-editing
  content/      The site's data: team, facilities, projects, events, faq, site
  lib/          Helpers — cn(), date formatting
  types/        Shared TypeScript types
public/images/  Team, facility and project photos
```

**Editing content does not require touching code.** Team members, equipment,
projects, events and FAQ entries are plain TypeScript objects in `src/content/`.
Add an entry there and the page picks it up.

---

## Rules worth knowing before your first commit

1. **Colours and spacing come from tokens only.** The palette is defined in
   `src/app/globals.css`. Tailwind's default colours are switched off, so
   `bg-red-500` will not compile. Use `bg-primary`, `text-muted`, and so on.
2. **Server Components are the default.** Add `"use client"` only when a component
   genuinely needs state, effects, or browser APIs.
3. **No `any`.** Every component takes typed props.
4. **Naming:** components are `PascalCase.tsx`, everything else is `kebab-case.ts`.
   Named exports for components; `default` export only for pages.
5. **Commits:** `feat:`, `fix:`, `chore:`, `style:`.
6. **Branches:** `main` is production. Work on a feature branch and open a PR.

---

## Full spec

[`PROJECT_FOUNDATION.md`](./PROJECT_FOUNDATION.md) is the source of truth for the
architecture, data model, design system and build order. Read it before writing
anything substantial.

**Current status:** Phase 3 complete — every page is built and styled on placeholder
content. Phase 4 (Firebase auth, registration, contact form, calendar) is next.
