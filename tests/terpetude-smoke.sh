#!/bin/bash
set -u
cd "$(dirname "$0")/.."

fixture_dir=$(./tests/fetch-etude.sh)
etude="$fixture_dir/etude.z5"
gntests="$fixture_dir/gntests.z5"

run_case() {
  local name="$1"
  local story="$2"
  local input="$3"
  local expect="$4"
  local out err rc
  out=$(mktemp)
  err=$(mktemp)
  printf '%b' "$input" | timeout 8 ./target/debug/encrusted "$story" >"$out" 2>"$err"
  rc=$?

  if grep -q 'Opcode not yet implemented' "$err"; then
    echo "FAIL: $name hit unimplemented opcode"
    cat "$err"
    rm -f "$out" "$err"
    exit 1
  fi

  if grep -qi 'panicked at' "$err"; then
    echo "FAIL: $name panicked"
    cat "$err"
    rm -f "$out" "$err"
    exit 1
  fi

  if [ "$rc" -ne 0 ] && [ "$rc" -ne 124 ]; then
    echo "FAIL: $name exited with status $rc"
    echo "--- stdout ---"
    sed -n '1,180p' "$out"
    echo "--- stderr ---"
    sed -n '1,120p' "$err"
    rm -f "$out" "$err"
    exit 1
  fi

  if ! grep -qi "$expect" "$out"; then
    echo "FAIL: $name did not produce expected output /$expect/"
    echo "--- stdout ---"
    sed -n '1,220p' "$out"
    rm -f "$out" "$err"
    exit 1
  fi

  rm -f "$out" "$err"
}

# TerpEtude menu smoke: header, styles, colors, division, accents, undo, exit.
run_case "TerpEtude" "$etude" '3\n4\n5\n6\n7\n13\n.\n' 'TerpEtude\|Header\|Styled\|Colored\|Undo\|Goodbye'

# GNTests menu smoke: fonts, accents, input-codes exit, colours, header, timed-input, exit.
run_case "GNTests" "$gntests" '1 2 3 4 5 6 0' 'Fonts\|Accents\|Colour\|Header\|TimedInput\|Exit'

echo "TerpEtude/GNTests smoke passed"
