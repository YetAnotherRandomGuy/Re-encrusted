import fs from 'fs';
import http from 'http';

function fetch(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

const wasmUrl = process.env.WASM_URL || 'http://127.0.0.1:8999/web.wasm';
const wasmBytes = fs.existsSync('web/web.wasm') ? fs.readFileSync('web/web.wasm') : await fetch(wasmUrl);
const storyPath = 'newer/_SHERLOCK.DAT';
if (!fs.existsSync(storyPath)) {
  console.log('SKIP: newer/_SHERLOCK.DAT not present');
  process.exit(0);
}
const story = fs.readFileSync(storyPath);

let instance;
let memory;
let messages = [];

function readCString(ptr) {
  const bytes = new Uint8Array(memory.buffer);
  let end = ptr;
  while (bytes[end] !== 0) end++;
  return new TextDecoder().decode(bytes.subarray(ptr, end));
}

function printed() {
  return messages.filter(([type]) => type === 'print').map(([, msg]) => msg).join('\n');
}

const result = await WebAssembly.instantiate(wasmBytes, {
  env: {
    rand: () => 123456789,
    js_message: (typePtr, msgPtr) => {
      const type = readCString(typePtr);
      const msg = readCString(msgPtr);
      messages.push([type, msg]);
    }
  }
});

instance = result.instance;
memory = instance.exports.memory;

const ptr = instance.exports.allocate(story.length);
new Uint8Array(memory.buffer, ptr, story.length).set(story);
instance.exports.create(ptr, story.length);

function writeCString(text) {
  const encoded = new TextEncoder().encode(text + '\0');
  const inputPtr = instance.exports.allocate(encoded.length);
  new Uint8Array(memory.buffer, inputPtr, encoded.length).set(encoded);
  return inputPtr;
}

try {
  instance.exports.step();
  instance.exports.feed(writeCString(' '));
  instance.exports.step();
  instance.exports.feed(writeCString('wait'));
  instance.exports.step();
} catch (err) {
  console.error('FAIL: Sherlock WASM trapped during initial load/step/wait');
  console.error(err && err.stack || err);
  console.error(printed().slice(-1500));
  process.exit(1);
}

const out = printed();
if (!/Sherlock|Holmes|Watson|Infocom|Copyright|Press any key|restore|Riddle of the Crown Jewels/i.test(out)) {
  console.error('FAIL: expected Sherlock startup/progress text');
  console.error(out.slice(-1500));
  process.exit(1);
}

console.log('V5 Sherlock WASM smoke passed');
