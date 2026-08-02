# Page hero images

Two per page, consumed by `PageHero` on `/about`, `/workshops`, `/facilities`,
`/portfolio` and `/help`.

| Page | At rest | On hover / focus / tap |
|---|---|---|
| `/about` | `about-a.jpg` | `about-b.jpg` |
| `/workshops` | `workshops-a.jpg` | `workshops-b.jpg` |
| `/facilities` | `facilities-a.jpg` | `facilities-b.jpg` |
| `/portfolio` | `portfolio-a.jpg` | `portfolio-b.jpg` |
| `/help` | `help-a.jpg` | `help-b.jpg` |

**The files here now are flat placeholders** generated so the layout is not
broken while shooting. Overwrite them in place — the paths are hard-coded in
each page and nothing else needs editing.

## Format

| | |
|---|---|
| Format | JPEG (`.jpg`) |
| Aspect | **Portrait, around 7:8** — 1400 × 1600 is the placeholder size |
| Minimum | 1400px wide. The `-a` file is served at up to 45vw on desktop |
| Size | Aim under 300 KB each. Next.js re-encodes and serves WebP/AVIF |

Portrait, not landscape: the panel is roughly 45vw × 80vh on desktop and a
half-screen block on phones. Both are taller than they are wide, and
`object-cover` crops a landscape frame hard.

## Shooting the pair

The two images cross-fade in place over 400ms, so they should be **the same
subject a beat apart** — the same bench from the same angle with the machine
running, a wide shot and then the detail. Two unrelated photos read as a bug.

Keep the subject **centred and inside the middle 70%**. The cut takes a chamfer
off the top-right corner, a notch out of the right edge and a chamfer off the
bottom-right, and the shape changes on hover — anything near those corners will
disappear and reappear.

The left edge bleeds off the screen on desktop, so nothing should matter there.

## Alt text

`imageAlt` on `PageHero` describes the `-a` image and is set per page in
`src/app/<page>/page.tsx`. Update it when the photo changes. The `-b` image is
decorative and is marked `aria-hidden` — it never carries alt text.
