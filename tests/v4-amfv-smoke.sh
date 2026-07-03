#!/bin/bash
set -u
cd "$(dirname "$0")/.."

story="newer/_AMFV.DAT"
if [ ! -f "$story" ]; then
  echo "SKIP: $story not present"
  exit 0
fi

out=$(mktemp)
err=$(mktemp)
trap 'rm -f "$out" "$err"' EXIT

# AMFV uses read_char on its opening "Hit any key to continue" screen.
printf ' \nquit\ny\n' | timeout 10 ./target/debug/encrusted "$story" >"$out" 2>"$err"
rc=$?

if grep -q 'Opcode not yet implemented' "$err"; then
  echo "FAIL: AMFV hit unimplemented opcode"
  cat "$err"
  exit 1
fi

if grep -qi 'panicked at' "$err"; then
  echo "FAIL: AMFV panicked"
  cat "$err"
  exit 1
fi

if [ "$rc" -ne 0 ]; then
  echo "FAIL: AMFV exited with status $rc"
  echo "--- stdout ---"
  sed -n '1,120p' "$out"
  echo "--- stderr ---"
  sed -n '1,120p' "$err"
  exit 1
fi

if ! grep -qi 'amfv\|a mind forever voyaging\|part i' "$out"; then
  echo "FAIL: expected AMFV startup text"
  echo "--- stdout ---"
  sed -n '1,160p' "$out"
  exit 1
fi

echo "V4 AMFV smoke passed"
