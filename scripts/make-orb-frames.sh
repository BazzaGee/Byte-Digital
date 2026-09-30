#!/usr/bin/env bash
# Regenerate the scroll-scrub background sprite sheets from the orbs loop video.
#
#   ffmpeg -i hero-orbs-1080p-loop.mp4 -vf "fps=24,scale=512:288,tile=6x6" sheet_%d.webp
#
# Output layout (6x6 grid = 36 frames per sheet):
#   public/orbs/hd/sheet_00.webp ... sheet_05.webp   24fps, 216 frames
#   public/orbs/ld/sheet_00.webp ... sheet_02.webp   12fps, 108 frames
#
# Tiles are deliberately small (512x288). The layer renders at ~25% opacity
# behind near-opaque panels, so the upscale is invisible but decoded memory
# stays bounded (~21MB per sheet, 3 sheets in flight).
set -euo pipefail

FF="${FFMPEG:-ffmpeg}"
SRC="${1:-C:/Users/barry/OneDrive/Desktop/ByteDigital Design 2/hero-orbs-1080p-loop.mp4}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)/public/orbs"

emit() {
  local fps="$1" tw="$2" th="$3" dir="$4" first="$5"
  rm -rf "$ROOT/$dir"
  mkdir -p "$ROOT/$dir"
  "$FF" -hide_banner -loglevel error -y -i "$SRC" \
    -vf "fps=$fps,scale=$tw:$th:flags=lanczos,tile=6x6" \
    -frames:v "$first" \
    -c:v libwebp -quality 72 -compression_level 6 \
    "$ROOT/$dir/sheet_%02d.webp"
  echo "$dir: $(ls "$ROOT/$dir" | wc -l) sheets, $(du -sh "$ROOT/$dir" | cut -f1)"
}

emit 24 512 288 hd 6
emit 12 384 216 ld 3

# Poster doubles as the LCP image and the no-JS / reduced-motion fallback.
"$FF" -hide_banner -loglevel error -y -i "$SRC" -frames:v 1 \
  -vf "scale=1280:720:flags=lanczos" \
  -q:v 4 "$ROOT/poster.jpg"
echo "poster.jpg: $(du -h "$ROOT/poster.jpg" | cut -f1)"
