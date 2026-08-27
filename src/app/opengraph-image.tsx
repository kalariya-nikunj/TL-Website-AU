import { ImageResponse } from "next/og";

import { site } from "@/content/site";

/**
 * The card shown when a link to this site is shared.
 *
 * Generated rather than a checked-in PNG, so it cannot drift from the brand
 * tokens or the tagline. Colours are copied from `globals.css` as literals
 * because `next/og` renders outside the app's CSS — it has no access to
 * custom properties.
 */
export const alt = `${site.name} — ${site.university}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PRIMARY_DARK = "#3d0b18";
const PRIMARY_MID = "#96253c";
const ACCENT = "#b8f135";
const SURFACE = "#ffffff";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: `linear-gradient(135deg, ${PRIMARY_DARK} 0%, ${PRIMARY_MID} 100%)`,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 20,
              height: 56,
              background: ACCENT,
              display: "flex",
            }}
          />
          <div
            style={{
              color: SURFACE,
              fontSize: 30,
              letterSpacing: 4,
              textTransform: "uppercase",
              display: "flex",
            }}
          >
            {site.university}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              color: SURFACE,
              fontSize: 104,
              fontWeight: 700,
              lineHeight: 1.05,
              display: "flex",
            }}
          >
            {site.name}
          </div>
          <div
            style={{
              color: ACCENT,
              fontSize: 40,
              fontWeight: 600,
              display: "flex",
            }}
          >
            {site.tagline}
          </div>
        </div>

        <div
          style={{
            color: "rgba(255,255,255,0.75)",
            fontSize: 26,
            display: "flex",
          }}
        >
          Machines, workshops and space for every student.
        </div>
      </div>
    ),
    size,
  );
}
