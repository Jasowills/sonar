#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <url> [output-path]"
  echo ""
  echo "Runs a Lighthouse audit on the given URL and outputs a JSON report."
  echo "Requires: Chrome/Chromium, lighthouse (npx)."
  exit 1
fi

URL="$1"
OUTPUT="${2:-/tmp/lighthouse-report-$(date +%s).json}"

CHROME_PATH="${LH_CHROME_PATH:-}"
if [ -z "$CHROME_PATH" ]; then
  for candidate in \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "/Applications/Chromium.app/Contents/MacOS/Chromium" \
    "/usr/bin/google-chrome" \
    "/usr/bin/chromium" \
    "/usr/bin/chromium-browser"; do
    if [ -x "$candidate" ]; then
      CHROME_PATH="$candidate"
      break
    fi
  done
fi

if [ -z "$CHROME_PATH" ]; then
  echo "Error: Chrome/Chromium not found. Set LH_CHROME_PATH or install Chrome."
  exit 1
fi

echo "Running Lighthouse audit on $URL ..." >&2
echo "Chrome: $CHROME_PATH" >&2
echo "Output: $OUTPUT" >&2

npx lighthouse "$URL" \
  --chrome-flags="--headless --no-sandbox --disable-gpu" \
  --output=json \
  --output-path="$OUTPUT" \
  --quiet

echo "$OUTPUT"
