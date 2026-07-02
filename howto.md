# How to Build Encrusted

This guide explains how to compile **Encrusted** (a modern Z-machine interpreter) from source.

## Prerequisites

- [Rust](https://rustup.rs/) (stable toolchain recommended)
- `git`

## Building the Native Binary (Recommended)

```bash
# Clone the repository
git clone https://github.com/YetAnotherRandomGuy/Re-encrusted.git
cd Re-encrusted

# Build the release binary
cargo build --release --bin encrusted

# The binary will be located at:
# target/release/encrusted
```

### Running the Interpreter

```bash
# Run a Z-machine game file (e.g. Zork)
./target/release/encrusted path/to/game.z3

# Common commands inside the game:
#   save
#   restore
#   $undo
#   $redo
```

## Building the WebAssembly Version

```bash
# Add the wasm32 target
rustup target add wasm32-unknown-unknown

# Build the WebAssembly module
cargo build --release --lib --target wasm32-unknown-unknown

# The .wasm file will be at:
# target/wasm32-unknown-unknown/release/web.wasm
```

Copy the generated file into the `web/` directory:

```bash
cp target/wasm32-unknown-unknown/release/web.wasm web/
```

## Running the Web Version Locally

After building the WebAssembly module and copying `web.wasm`, you can serve the web player.

### Using Python (Quick Testing)

```bash
python3 -m http.server 8000
```

Open http://localhost:8000/web/

### Using a Container (Recommended for distribution)

See the **Building a Container Image** section below.

## Building a Container Image (Docker / Podman)

### Prerequisites

- Podman or Docker installed
- You must have already built the WebAssembly module and copied `web.wasm` into the `web/` directory (see above).

### Build the Container

You **must** build with `--network=host`:

```bash
podman build --network=host -t encrusted-web -f Containerfile .
```

### Run the Container

```bash
podman run -d \
  --name encrusted-web \
  --network=host \
  localhost/encrusted-web
```

Access at **http://localhost:8999**

### Notes

- The container expects `web.wasm` to already exist in the `web/` directory.
- If you see "Failed to load WebAssembly", make sure you completed the WebAssembly build step and copied the `.wasm` file before building the container.