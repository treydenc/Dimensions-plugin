// Photoshop's side of the bridge. The tool (the web app in the WebView) sends a message,
// this file does the Photoshop part and sends the answer back. web/lib/host.ts is the other end.
//
// Every message is a JSON string: { source, type, id?, payload?, error? }.
// To add a command, add a case to COMMANDS below and call ask('<name>') in the web app.
// Commands that change the document must run inside require('photoshop').core.executeAsModal.

const view = document.getElementById('view');
const dot = document.getElementById('dot');
const statusText = document.getElementById('statusText');

function setStatus(text, connected) {
  statusText.textContent = text;
  dot.className = connected ? 'on' : '';
}

function send(message) {
  view.postMessage(JSON.stringify(Object.assign({ source: 'host' }, message)));
}

/* ── reading the open document ──────────────────────────────────────────── */
function readLayers(layers, depth) {
  const out = [];
  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    let bounds = null;
    try {
      const b = layer.bounds;
      bounds = { left: b.left, top: b.top, right: b.right, bottom: b.bottom };
    } catch (e) { /* some layers have no bounds */ }
    const item = { id: layer.id, name: layer.name, kind: String(layer.kind), visible: layer.visible, bounds: bounds };
    if (layer.layers && layer.layers.length && depth < 6) item.layers = readLayers(layer.layers, depth + 1);
    out.push(item);
  }
  return out;
}

function readDocument() {
  const doc = require('photoshop').app.activeDocument;
  if (!doc) return null;
  return { id: doc.id, title: doc.title, width: doc.width, height: doc.height, resolution: doc.resolution, layers: readLayers(doc.layers, 0) };
}

/* ── the commands the tool can ask for ──────────────────────────────────── */
const COMMANDS = {
  ping: function () {
    const host = require('uxp').host;
    return { app: host.name, version: host.version };
  },
  getDocument: function () {
    return readDocument();
  },
};

window.addEventListener('message', async function (e) {
  let m;
  try { m = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch (err) { return; }
  if (!m || m.source !== 'tool') return;
  setStatus('Connected', true);
  const command = COMMANDS[m.type];
  if (!command) { send({ type: m.type, id: m.id, error: 'Photoshop does not know "' + m.type + '".' }); return; }
  try {
    send({ type: m.type, id: m.id, payload: await command(m.payload) });
  } catch (err) {
    send({ type: m.type, id: m.id, error: String((err && err.message) || err) });
  }
});

/* ── the WebView's own events ───────────────────────────────────────────── */
view.addEventListener('loadstart', function () { setStatus('Loading the tool', false); });
view.addEventListener('loadstop', function () {
  setStatus('Page loaded, waiting for the tool to answer', false);
  send({ type: 'hello' });
});
view.addEventListener('loaderror', function () {
  setStatus('Cannot reach localhost:3000. In the web folder, run: npm run dev', false);
});
