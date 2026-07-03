#!/bin/bash
cd "$(dirname "$0")"

# Static opcode dispatch audit for V1-V5/V8 non-V6 opcode set.
python ../tests/opcode-coverage.py

# Unit tests
python regtest.py -i "../target/debug/encrusted" czech.z3.regtest
python regtest.py -i "../target/debug/encrusted" czech.z4.regtest
python regtest.py -i "../target/debug/encrusted" czech.z5.regtest
python regtest.py -i "../target/debug/encrusted" czech.z8.regtest
python regtest.py -i "../target/debug/encrusted" praxix.z5.regtest

# V5 real-game smoke test, skipped when the local fixture is absent.
../tests/v5-hitchhik-smoke.sh

# Additional public/personal-use test suites, fetched into ignored local cache.
../tests/terpetude-smoke.sh

# Game tests
python regtest.py -i "../target/debug/encrusted" curses.z3.regtest
python regtest.py -i "../target/debug/encrusted" minizork.z3.regtest
