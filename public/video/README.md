# Video assets

## `hero.mp4` — homepage scroll hero

**Drop the file here, as `public/video/hero.mp4`.** It is served at
`/video/hero.mp4`, which is the constant `VIDEO_SRC` in
`src/components/sections/VideoHero.tsx`.

A matching poster goes at **`public/images/hero-poster.jpg`**. The poster is the
page's LCP element and is what renders on mobile, so it matters more than the
video — grab it from frame 0 of the final encode so the handoff is invisible.

Until both exist the hero still lays out and the sequence still runs; the panel
is just empty.

### Target

| | |
|---|---|
| Container | MP4, H.264 High profile (`yuv420p`) |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps (24 is fine) |
| Duration | 8–15s, seamless loop |
| Audio | **None — strip the track entirely** |
| `faststart` | Required, so playback starts before the file finishes |
| Size | **Aim under 2 MB.** See the mobile note below |

No audio at all: the video is decorative and muted, the track is dead weight,
and its absence removes any chance of autoplay being blocked.

### Encoding

```sh
ffmpeg -i source.mov \
  -an \
  -vf "scale=1920:-2,fps=30" \
  -c:v libx264 -profile:v high -crf 28 -preset slow \
  -pix_fmt yuv420p \
  -movflags +faststart \
  public/video/hero.mp4
```

`-crf 28` is deliberately soft. This plays behind a scroll transform at reduced
prominence, so detail is wasted bytes — push toward 30 if the file lands heavy,
pull toward 24 only if banding shows in flat areas.

Poster from the first frame of the finished encode:

```sh
ffmpeg -i public/video/hero.mp4 -vframes 1 -q:v 2 public/images/hero-poster.jpg
```

### The mobile switch

`PLAY_VIDEO_ON_MOBILE` at the top of `VideoHero.tsx` is `false`. Below `md` the
poster carries the whole effect and the video is never fetched — it is not in
the markup at all, so there is no request to cancel.

Once the encode is confirmed under ~2 MB, flip that constant to `true` to let
phones have the video too. Leave it `false` if the file comes in heavier.
