#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, '..', 'web', 'index.html'), 'utf8');

function extractModuleScript(source) {
  const match = source.match(/<script type="module">([\s\S]*?)<\/script>/);
  assert(match, 'web/index.html should contain a module script');
  return match[1]
    .replace(/\bconst\s+/g, 'var ')
    .replace(/\blet\s+/g, 'var ');
}

class FakeElement {
  constructor(tagName, id = '') {
    this.tagName = tagName;
    this.id = id;
    this.children = [];
    this.attributes = {};
    this.eventListeners = {};
    this.style = {};
    this.className = '';
    this.disabled = false;
    this.value = '';
    this.files = [];
    this.scrollTop = 0;
    this.scrollHeight = 0;
    this._textContent = '';
    this._innerHTML = '';
  }

  appendChild(child) {
    this.children.push(child);
    this.scrollHeight = this.children.length;
    return child;
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }

  getAttribute(name) {
    return this.attributes[name];
  }

  addEventListener(name, handler) {
    this.eventListeners[name] = handler;
  }

  focus() {}

  set textContent(value) {
    this._textContent = String(value);
    this.children = [];
  }

  get textContent() {
    return [this._textContent, ...this.children.map(child => child.textContent)].join('');
  }

  set innerHTML(value) {
    this._innerHTML = String(value);
    this.children = [];
  }

  get innerHTML() {
    return this._innerHTML || this.children.map(child => child.innerHTML || child.textContent).join('');
  }
}

function makeDocument() {
  const elements = new Map();
  for (const id of ['output', 'input', 'story', 'status-left', 'status-right']) {
    elements.set(id, new FakeElement('div', id));
  }

  return {
    createElement(tagName) {
      return new FakeElement(tagName);
    },
    getElementById(id) {
      if (!elements.has(id)) {
        const element = new FakeElement('div', id);
        if (id === 'tree-toggle') element.checked = true;
        elements.set(id, element);
      }
      return elements.get(id);
    },
    querySelector(selector) {
      if (!selector.startsWith('#')) return null;
      return this.getElementById(selector.slice(1));
    },
  };
}

function runPageScript() {
  const document = makeDocument();
  const logs = [];
  const context = {
    document,
    console: {
      debug: (...args) => logs.push(['debug', ...args]),
      error: (...args) => logs.push(['error', ...args]),
    },
    setTimeout: fn => fn(),
    clearTimeout: () => {},
    TextEncoder,
    TextDecoder,
    Uint8Array,
    ArrayBuffer,
    WebAssembly: { instantiate: async () => { throw new Error('not used in these tests'); } },
    fetch: async () => ({ ok: false, status: 404, arrayBuffer: async () => new ArrayBuffer(0) }),
    window: {},
  };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(extractModuleScript(html), context);
  return { context, document, logs };
}

function sendMessage(context, type, payload) {
  let offset = 8;
  const bytes = new Uint8Array(4096);
  function put(text) {
    const encoded = new TextEncoder().encode(text + '\0');
    const ptr = offset;
    bytes.set(encoded, ptr);
    offset += encoded.length;
    return ptr;
  }

  context.memory = { buffer: bytes.buffer };
  context.jsMessage(put(type), put(payload));
}

(function testMapAndTreePanelsExist() {
  const required = [
    'map-panel',
    'map-current-room',
    'map-rooms',
    'map-edges',
    'map-lines',
    'tree-panel',
    'object-tree',
  ];

  for (const id of required) {
    assert(html.includes(`id="${id}"`), `missing #${id}`);
  }

  assert(html.includes('id="tree-toggle"'), 'missing #tree-toggle');
})();

(function testMapMessageRendersCurrentRoom() {
  const { context, document } = runPageScript();
  sendMessage(context, 'map', JSON.stringify([7, 'West of House']));

  assert.strictEqual(
    document.getElementById('map-current-room').textContent,
    'West of House (#7)'
  );
  assert(document.getElementById('map-rooms').textContent.includes('West of House'));
})();

(function testMapMessageRendersDirectionalEdge() {
  const { context, document } = runPageScript();
  sendMessage(context, 'map', JSON.stringify([7, 'West of House']));
  const bytes = new Uint8Array(4096);
  let nextPtr = 256;
  context.memory = { buffer: bytes.buffer };
  context.wasm = {
    exports: {
      allocate(length) {
        const ptr = nextPtr;
        nextPtr += length;
        return ptr;
      },
      feed() {},
      step: () => false,
    },
  };
  context.input.value = 'east';
  context.input.disabled = false;
  context.input.eventListeners.keydown({ key: 'Enter' });
  sendMessage(context, 'map', JSON.stringify([8, 'Behind House']));

  assert(document.getElementById('map-rooms').textContent.includes('Behind House'));
  assert(document.getElementById('map-edges').textContent.includes('West of House → Behind House (east)'));
  assert(document.getElementById('map-lines').children.length > 0, 'expected a visual map line');
})();

(function testRunUntilInputOrDoneCallsWasmStepOnce() {
  const { context } = runPageScript();
  let steps = 0;
  context.wasm = { exports: { step: () => { steps += 1; return false; } } };

  context.runUntilInputOrDone();

  assert.strictEqual(steps, 1);
})();

(function testTreeMessageRendersObjectTree() {
  const { context, document } = runPageScript();
  sendMessage(context, 'tree', JSON.stringify({
    number: 0,
    name: '(Null Object)',
    children: [
      { number: 1, name: 'brass lantern', children: [] },
      { number: 2, name: 'mailbox', children: [
        { number: 3, name: 'leaflet', children: [] },
      ] },
    ],
  }));

  const text = document.getElementById('object-tree').textContent;
  assert(text.includes('brass lantern (#1)'));
  assert(text.includes('mailbox (#2)'));
  assert(text.includes('leaflet (#3)'));
})();

(function testTreeToggleHidesAndStopsUpdatingObjectTree() {
  const { context, document } = runPageScript();
  const toggle = document.getElementById('tree-toggle');
  const panel = document.getElementById('tree-panel');
  const tree = document.getElementById('object-tree');

  assert.strictEqual(toggle.checked, true);
  sendMessage(context, 'tree', JSON.stringify({
    number: 0,
    name: '(Null Object)',
    children: [{ number: 1, name: 'brass lantern', children: [] }],
  }));
  assert(tree.textContent.includes('brass lantern (#1)'));

  toggle.checked = false;
  toggle.eventListeners.change();
  assert.strictEqual(panel.style.display, 'none');

  sendMessage(context, 'tree', JSON.stringify({
    number: 0,
    name: '(Null Object)',
    children: [{ number: 2, name: 'mailbox', children: [] }],
  }));
  assert(!tree.textContent.includes('mailbox (#2)'));

  toggle.checked = true;
  toggle.eventListeners.change();
  assert.strictEqual(panel.style.display, '');
})();

console.log('web-ui tests passed');
