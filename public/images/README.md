# Image assets

Subfolders (`team/`, `facilities/`, `projects/`) hold content photography — see
the README in each. This note covers the assets the layout itself needs.

## `hero-poster.jpg` — homepage hero poster

Frame 0 of `public/video/hero.mp4`, 1920 × 1080. It is the page's LCP element
and is what carries the hero on mobile, where the video is not loaded at all.
Encoding instructions live in `public/video/README.md`.

## `peeps.avif` — footer crowd sprite sheet

**Drop the file here, as `public/images/peeps.avif`.** It is served at
`/images/peeps.avif`, which is what `CrowdCanvas.tsx` requests.

Until it exists the footer band renders nothing at all — no empty strip, no
console errors. The site is fully functional without it.

### Format

| | |
|---|---|
| Filename | `peeps.avif` (exactly — the path is a constant in `CrowdCanvas.tsx`) |
| Format | AVIF |
| Grid | **15 columns × 7 rows** = 105 figures |
| Cell size | Every cell identical. Total width divisible by 15, height by 7 |
| Order | Left to right, then top to bottom |
| Background | **Must be transparent.** Not white |
| Artwork | Dark line art — the canvas applies `invert(1)` so it reads light on the maroon footer |
| Framing | One full-body figure per cell, horizontally centred, feet at the bottom edge |

### If the grid differs

`SHEET_COLUMNS` and `SHEET_ROWS` at the top of
`src/components/layout/CrowdCanvas.tsx` are the only two values to change. The
slicing is derived from them and the image's natural dimensions, so any grid
works as long as the cells are uniform.

### Why transparent matters

The canvas is inverted so dark strokes become light. An opaque white background
would invert to a solid black rectangle sitting on the footer.
