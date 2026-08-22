#!/bin/bash

cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 1

PORT=3000
URL="http://localhost:${PORT}"

(
  sleep 1
  if command -v brave-browser &> /dev/null; then
    brave-browser -incognito "$URL" >/dev/null 2>&1 &
  elif command -v xdg-open &> /dev/null; then
    xdg-open "$URL" >/dev/null 2>&1 &
  fi
) &

echo "Serving HTTP on http://localhost:${PORT} ..."
exec python3 -m http.server "$PORT"