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
const storyPath = 'newer/_NORDANDB.DAT';
if (!fs.existsSync(storyPath)) {
  console.log('SKIP: newer/_NORDANDB.DAT not present');
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

function writeCString(text) {
  const encoded = new TextEncoder().encode(text + '\0');
  const ptr = instance.exports.allocate(encoded.length);
  new Uint8Array(memory.buffer, ptr, encoded.length).set(encoded);
  return ptr;
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

instance.exports.step();
instance.exports.feed(writeCString('look'));

try {
  instance.exports.step();
} catch (err) {
  console.error('FAIL: Nord and Bert WASM trapped after first command');
  console.error(err && err.stack || err);
  console.error(printed().slice(-1500));
  process.exit(1);
}

const out = printed();
if (!/Press any key|Punster|Reporter's Note|Untied Press/i.test(out)) {
  console.error('FAIL: expected Nord and Bert startup/progress text');
  console.error(out.slice(-1500));
  process.exit(1);
}

console.log('V4 Nord and Bert WASM smoke passed');
