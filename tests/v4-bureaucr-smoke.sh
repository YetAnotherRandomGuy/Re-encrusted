#!/bin/bash
set -u
cd "$(dirname "$0")/.."

story="newer/_BUREAUCR.DAT"
if [ ! -f "$story" ]; then
  echo "SKIP: $story not present"
  exit 0
fi

out=$(mktemp)
err=$(mktemp)
trap 'rm -f "$out" "$err"' EXIT

# Start a new game and send one key at the licence form. Bureaucracy then
# enters a form editor and may wait for more input, so timeout is acceptable
# as long as the old screen-size rejection and interpreter panics do not occur.
printf 'x\n \n' | timeout 3 ./target/debug/encrusted "$story" >"$out" 2>"$err"
rc=$?

if grep -q '\[Screen too small\.\]' "$out"; then
  echo "FAIL: Bureaucracy rejected interpreter screen size"
  sed -n '1,160p' "$out"
  exit 1
fi

if grep -q 'Opcode not yet implemented' "$err"; then
  echo "FAIL: Bureaucracy hit unimplemented opcode"
  cat "$err"
  exit 1
fi

if grep -qi 'panicked at' "$err"; then
  echo "FAIL: Bureaucracy panicked"
  cat "$err"
  exit 1
fi

if [ "$rc" -ne 0 ] && [ "$rc" -ne 124 ]; then
  echo "FAIL: Bureaucracy exited with status $rc"
  echo "--- stdout ---"
  sed -n '1,160p' "$out"
  echo "--- stderr ---"
  sed -n '1,120p' "$err"
  exit 1
fi

if ! grep -qi 'software licence application\|last name:\|blood pressure\|bureaucracy\|copyright.*infocom' "$out"; then
  echo "FAIL: expected Bureaucracy to progress past startup"
  echo "--- stdout ---"
  sed -n '1,180p' "$out"
  exit 1
fi

echo "V4 Bureaucracy smoke passed"
