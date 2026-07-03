#!/bin/bash
set -u
cd "$(dirname "$0")/.."

story="newer/_TRINITY.DAT"
if [ ! -f "$story" ]; then
  echo "SKIP: $story not present"
  exit 0
fi

out=$(mktemp)
err=$(mktemp)
trap 'rm -f "$out" "$err"' EXIT

# Trinity checks the interpreter's V4 screen-width byte immediately on load.
# It should progress to the game prologue / first prompt rather than rejecting
# the interpreter as too narrow. It may wait for input, so timeout is acceptable.
printf 'x\n' | timeout 3 ./target/debug/encrusted "$story" >"$out" 2>"$err"
rc=$?

if grep -qi 'screen too narrow' "$out"; then
  echo "FAIL: Trinity rejected interpreter screen width"
  sed -n '1,160p' "$out"
  exit 1
fi

if grep -q 'Opcode not yet implemented' "$err"; then
  echo "FAIL: Trinity hit unimplemented opcode"
  cat "$err"
  exit 1
fi

if grep -qi 'panicked at' "$err"; then
  echo "FAIL: Trinity panicked"
  cat "$err"
  exit 1
fi

if [ "$rc" -ne 0 ] && [ "$rc" -ne 124 ]; then
  echo "FAIL: Trinity exited with status $rc"
  echo "--- stdout ---"
  sed -n '1,160p' "$out"
  echo "--- stderr ---"
  sed -n '1,120p' "$err"
  exit 1
fi

if ! grep -qi 'trinity\|copyright\|infocom\|press any key\|west of house\|waking up' "$out"; then
  echo "FAIL: expected Trinity startup/progress text"
  echo "--- stdout ---"
  sed -n '1,180p' "$out"
  exit 1
fi

echo "V4 Trinity smoke passed"
