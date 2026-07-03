#!/usr/bin/env python3
"""Static guard for non-V6 opcode dispatch coverage.

This does not prove full semantic correctness; it prevents regressions where a
V1-V5/V8 opcode in the audited non-V6 set is present in the decoder/name table
but has no dispatch arm in Zmachine::handle_instruction / web step handling.
"""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
inst = (ROOT / "src/rust/instruction.rs").read_text()
z = (ROOT / "src/rust/zmachine.rs").read_text()

names = dict(re.findall(r'(OP[0-9]_[0-9]+|VAR_[0-9]+|EXT_[0-9]+)\s*=>\s*"([^"]+)"', inst))
# Conditional-name arms don't match the simple regex above.
names.update({
    "OP1_143": "not/call_1n",
    "OP0_185": "pop/catch",
    "VAR_224": "call/call_vs",
    "VAR_228": "sread/aread",
})

# Z-machine Standard opcodes applicable to v1-v5/v8 text interpreters. V6-only
# graphics/window/mouse/menu opcodes are intentionally excluded here.
audited = []
audited += [f"OP2_{n}" for n in range(1, 29)]
audited += [f"OP1_{n}" for n in range(128, 144)]
audited += [f"OP0_{n}" for n in [176,177,178,179,180,181,182,183,184,185,186,187,188,189,191]]
audited += [f"VAR_{n}" for n in range(224, 256)]
audited += [f"EXT_{n}" for n in [1000,1001,1002,1003,1004,1009,1010,1011,1012,1013]]

match_arms = set(re.findall(r'\((OP[0-9]_[0-9]+|VAR_[0-9]+|EXT_[0-9]+)\b', z))
match_arms.update(re.findall(r'Opcode::(OP[0-9]_[0-9]+|VAR_[0-9]+|EXT_[0-9]+)\b', z))

missing = [op for op in audited if op in names and op not in match_arms]
if missing:
    print("Missing non-V6 opcode dispatch arms:")
    for op in missing:
        print(f"  {op:8} {names.get(op, '')}")
    sys.exit(1)

print("Opcode dispatch coverage passed for audited V1-V5/V8 non-V6 set")
