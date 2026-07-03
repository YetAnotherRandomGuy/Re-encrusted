#!/bin/bash
set -u
cd "$(dirname "$0")/.."

story="newer/HITCHHIK.DAT"
if [ ! -f "$story" ]; then
  echo "SKIP: $story not present"
  exit 0
fi

out=$(mktemp)
err=$(mktemp)
trap 'rm -f "$out" "$err"' EXIT

printf 'stand up\nfind a light\ni\nscore\n\nquit\ny\n' | timeout 10 ./target/debug/encrusted "$story" >"$out" 2>"$err"
rc=$?

if grep -q 'Opcode not yet implemented' "$err"; then
  echo "FAIL: V5 story hit unimplemented opcode"
  cat "$err"
  exit 1
fi

if grep -qi 'panicked at' "$err"; then
  echo "FAIL: V5 story panicked"
  cat "$err"
  exit 1
fi

if [ "$rc" -ne 0 ]; then
  echo "FAIL: V5 story exited with status $rc"
  echo "--- stdout ---"
  sed -n '1,80p' "$out"
  echo "--- stderr ---"
  sed -n '1,120p' "$err"
  exit 1
fi

if ! grep -qi 'hitchhiker\|hitch hiker\|copyright\|infocom' "$out"; then
  echo "FAIL: expected Hitchhiker/Infocom startup text"
  echo "--- stdout ---"
  sed -n '1,120p' "$out"
  exit 1
fi

if ! grep -q 'You have:' "$out"; then
  echo "FAIL: expected inventory command to run"
  echo "--- stdout ---"
  sed -n '1,120p' "$out"
  exit 1
fi

if ! grep -q 'Your score is' "$out"; then
  echo "FAIL: expected score command to run"
  echo "--- stdout ---"
  sed -n '1,160p' "$out"
  exit 1
fi

echo "V5 Hitchhiker smoke passed"
