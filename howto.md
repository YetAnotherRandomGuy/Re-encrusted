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

- Docker or Podman installed
- You must have already built the WebAssembly module and copied `web.wasm` into the `web/` directory (see above).

### Build the Container

#### Podman (recommended on Artix Linux)

On Artix Linux (and other systems without `/dev/net/tun`), Podman's default `pasta` networking fails. You **must** build with `--network=host`:

```bash
podman build --network=host -t encrusted-web -f Containerfile .
```

#### Docker

Docker does not require the `--network=host` workaround; the standard build command works:

```bash
docker build -t encrusted-web -f Containerfile .
```

### Run the Container

#### Podman

```bash
podman run -d \
  --name encrusted-web \
  --network=host \
  localhost/encrusted-web
```

#### Docker

```bash
docker run -d \
  --name encrusted-web \
  -p 8999:8999 \
  encrusted-web
```

Access at **http://localhost:8999**

### Managing the Container

```bash
# Stop
podman stop encrusted-web   # or: docker stop encrusted-web

# Start again
podman start encrusted-web  # or: docker start encrusted-web

# Remove
podman rm -f encrusted-web  # or: docker rm -f encrusted-web
```

### Notes

- The container expects `web.wasm` to already exist in the `web/` directory.
- If you see "Failed to load WebAssembly", make sure you completed the WebAssembly build step and copied the `.wasm` file before building the container.
- Podman tags images as `localhost/<name>`; Docker tags them as just `<name>`. Use the appropriate image reference when running.
- The container serves static files via nginx on port 8999 with `Cache-Control: no-store` so WASM/HTML updates are always served fresh during development.