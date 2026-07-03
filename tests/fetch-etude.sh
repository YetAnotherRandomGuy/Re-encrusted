#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."

cache_dir="tests/fixtures/etude"
archive="$cache_dir/etude.tar.Z"
url="https://ifarchive.org/if-archive/infocom/interpreters/tools/etude.tar.Z"

mkdir -p "$cache_dir"

if [ ! -f "$cache_dir/etude/etude.z5" ] || [ ! -f "$cache_dir/etude/gntests.z5" ]; then
  echo "Fetching TerpEtude/GNTests from IF Archive..." >&2
  curl -L --fail -o "$archive" "$url" >&2
  tar -xf "$archive" -C "$cache_dir"
fi

printf '%s\n' "$cache_dir/etude"
