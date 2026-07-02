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

You can then load `web.wasm` from a web page using the WebAssembly JavaScript API (see the `web/` directory for a minimal example).

## Running the Web Version Locally

After building the WebAssembly module, you can serve the web player using any static web server.

### Using Python (Quick Testing)

```bash
# From the project root
python3 -m http.server 8000
```

Then open http://localhost:8000/web/ in your browser.

### Using Node.js (http-server)

```bash
npx http-server -p 8000
```

### Using Apache

1. Copy the contents of the `web/` directory (or the entire project) into your Apache document root (e.g. `/var/www/html/encrusted`).
2. Ensure `web.wasm` and `index.html` are present.
3. Restart Apache:

```bash
sudo systemctl restart apache2
```

Visit `http://your-server/encrusted/web/`.

### Using Nginx

1. Place the `web/` directory inside your Nginx web root.
2. Example configuration snippet:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/encrusted;

    location / {
        try_files $uri $uri/ =404;
    }

    # Important for WebAssembly MIME type
    location ~* \.wasm$ {
        default_type application/wasm;
    }
}
```

3. Reload Nginx:

```bash
sudo nginx -s reload
```

### Important Notes

- WebAssembly modules generally cannot be loaded via `file://` URLs due to CORS and security restrictions. You **must** serve the files over HTTP or HTTPS.
- Make sure your web server sends the correct MIME type for `.wasm` files (`application/wasm`).
- The included `web/index.html` provides a minimal working interface. For a richer experience, you can integrate the original React frontend from the `src/js/` directory.

## Notes

- Only Z-machine version 3 is currently supported.
- Saves are stored in the Quetzal format.
- The project has been modernized to Rust Edition 2021.

## License

MIT — see [LICENSE](LICENSE) for details.