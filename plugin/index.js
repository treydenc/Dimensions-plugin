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

/* ── making the other sizes ─────────────────────────────────────────────── */
function findDocument(id) {
  const docs = require('photoshop').app.documents;
  for (let i = 0; i < docs.length; i++) if (docs[i].id === id) return docs[i];
  return null;
}

function findLayer(layers, id) {
  for (let i = 0; i < layers.length; i++) {
    if (layers[i].id === id) return layers[i];
    if (layers[i].layers && layers[i].layers.length) {
      const inside = findLayer(layers[i].layers, id);
      if (inside) return inside;
    }
  }
  return null;
}

// The colour mode for a new document. Only modes that can hold layers; anything else becomes RGB.
function newDocumentMode(source) {
  const constants = require('photoshop').constants;
  const names = ['CMYK', 'GRAYSCALE', 'LAB', 'RGB'];
  try {
    for (let i = 0; i < names.length; i++) {
      if (source.mode === constants.DocumentMode[names[i]]) return constants.NewDocumentMode[names[i]];
    }
  } catch (e) { /* fall through to RGB */ }
  return constants.NewDocumentMode.RGB;
}

// An error whose message is already a plain sentence for the person.
function plain(message) {
  const err = new Error(message);
  err.plain = true;
  return err;
}

// Every layer in a document as one flat list, top to bottom, groups included.
function allLayers(layers, out) {
  out = out || [];
  for (let i = 0; i < layers.length; i++) {
    out.push(layers[i]);
    if (layers[i].layers && layers[i].layers.length) allLayers(layers[i].layers, out);
  }
  return out;
}

// Photoshop changes the active document in the background. Wait until it has really happened.
async function waitUntilActive(doc) {
  const app = require('photoshop').app;
  for (let i = 0; i < 60; i++) {
    try { if (app.activeDocument && app.activeDocument.id === doc.id) return true; } catch (e) { /* keep waiting */ }
    await new Promise(function (resolve) { setTimeout(resolve, 50); });
  }
  return false;
}

const widthOf = function (b) { return b.right - b.left; };
const near = function (a, b, by) { return Math.abs(a - b) <= by; };

// Builds one size. Must be called inside executeAsModal. Returns { name, documentId, title }.
//
// How: copy the whole poster as a new document, move and size each layer inside that copy, then
// trim the canvas to the new size from the top left. Nothing is copied between two documents, so
// every layer keeps its name and its place in the stack, and every step can be measured.
async function makeOneSize(source, size) {
  const ps = require('photoshop');
  const app = ps.app;
  const constants = ps.constants;

  if (!size || !(size.w > 0) || !(size.h > 0)) throw plain('This size has no width or height.');
  const list = size.layers || [];
  const sourceFlat = allLayers(source.layers);
  const jobs = [];
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (!item) continue;
    if (item.box && !(item.box.w > 0)) throw plain('The layer "' + item.name + '" has no width in this size.');
    let index = -1;
    for (let j = 0; j < sourceFlat.length; j++) if (sourceFlat[j].id === item.id) index = j;
    if (index < 0) throw plain('The layer "' + item.name + '" is no longer in the poster. Read the poster again and try again.');
    jobs.push({ item: item, index: index, layerName: sourceFlat[index].name });
  }
  let placing = 0;
  for (let i = 0; i < jobs.length; i++) if (jobs[i].item.box) placing++;
  if (!placing) throw plain('No layers were chosen for this size.');

  const title = String(source.title).replace(/\.[^.\\\/]+$/, '') + ' - ' + size.name;
  app.activeDocument = source;
  await waitUntilActive(source);
  const made = await source.duplicate(title);
  if (!made || made.id === source.id) throw plain('Photoshop did not make the new document. Try again.');

  try {
    if (!(await waitUntilActive(made))) throw plain('Photoshop did not switch to the new document. Click on Photoshop, then try again.');

    // The copy has the same layers in the same order. Find each one by position, and check the name agrees.
    const flat = allLayers(made.layers);
    if (flat.length !== sourceFlat.length) throw plain('The copy of the poster has a different number of layers. Try again.');
    for (let i = 0; i < jobs.length; i++) {
      const layer = flat[jobs[i].index];
      if (!layer || layer.name !== jobs[i].layerName) throw plain('The layer "' + jobs[i].item.name + '" could not be found in the copy of the poster. Try again.');
      jobs[i].layer = layer;
    }

    for (let i = 0; i < jobs.length; i++) {
      const layer = jobs[i].layer;
      const box = jobs[i].item.box;
      const name = jobs[i].item.name;

      // Left out of this size.
      if (!box) { layer.delete(); continue; }

      // Select it first, so it is the layer Photoshop acts on whichever way it resolves the command.
      try { made.activeLayers = [layer]; } catch (e) { console.log('makeSizes: could not select "' + name + '"', String(e)); }

      let b = layer.bounds;
      if (!(widthOf(b) > 0)) throw plain('The layer "' + name + '" is empty on the poster, so it cannot be resized. Leave it out and try again.');
      const before = { left: b.left, top: b.top, width: widthOf(b) };

      const percent = (box.w / widthOf(b)) * 100;
      if (Math.abs(percent - 100) > 0.001) await layer.scale(percent, percent, constants.AnchorPosition.TOPLEFT);
      b = layer.bounds;
      if (!near(box.x, b.left, 0.5) || !near(box.y, b.top, 0.5)) await layer.translate(box.x - b.left, box.y - b.top);

      // Measure what really happened. A document with layers in the wrong place must never be reported as made.
      b = layer.bounds;
      console.log('makeSizes: "' + name + '" in "' + size.name + '": was ' + Math.round(before.left) + ',' + Math.round(before.top) + ' width ' + Math.round(before.width)
        + '; asked ' + box.x + ',' + box.y + ' width ' + box.w + '; now ' + Math.round(b.left) + ',' + Math.round(b.top) + ' width ' + Math.round(widthOf(b)));
      if (!near(widthOf(b), box.w, 3) || !near(b.left, box.x, 3) || !near(b.top, box.y, 3)) {
        throw plain('Photoshop did not move the layer "' + name + '" into place, so this size was not made. Try again.');
      }
    }

    // Trim the canvas to the new size, keeping the top left corner where it is.
    await made.resizeCanvas(Math.round(size.w), Math.round(size.h), constants.AnchorPosition.TOPLEFT);
    if (!near(made.width, size.w, 1) || !near(made.height, size.h, 1)) {
      throw plain('Photoshop did not trim the new document to ' + size.w + ' x ' + size.h + '. Try again.');
    }

    return { name: size.name, documentId: made.id, title: made.title };
  } catch (err) {
    // A half-made document is worse than none. It is ours and was never saved, so close it.
    try { made.closeWithoutSaving(); } catch (e) { /* leave it open */ }
    throw err;
  }
}

async function makeSizes(payload) {
  const ps = require('photoshop');
  const gone = 'The poster is no longer open in Photoshop. Open the poster and try again.';
  if (!payload || !payload.sizes || !payload.sizes.length) throw new Error('There are no sizes to make. Choose at least one size and try again.');
  if (!findDocument(payload.sourceId)) throw new Error(gone);

  const result = { made: [], failed: [] };
  try {
    await ps.core.executeAsModal(async function () {
      for (let i = 0; i < payload.sizes.length; i++) {
        const size = payload.sizes[i];
        const name = (size && size.name) || 'Size ' + (i + 1);
        try {
          const source = findDocument(payload.sourceId);
          if (!source) throw plain(gone);
          result.made.push(await makeOneSize(source, size));
        } catch (err) {
          console.error('makeSizes: "' + name + '" failed', err);
          result.failed.push({
            name: name,
            error: err && err.plain ? err.message : 'Photoshop could not make this size. Check the poster is open and not busy, then try again.',
          });
        }
      }
      // Put the poster back in front, so the tool keeps reading the poster and not a copy.
      try {
        const source = findDocument(payload.sourceId);
        if (source) ps.app.activeDocument = source;
      } catch (e) { /* not important */ }
    }, { commandName: 'Make sizes' });
  } catch (err) {
    console.error('makeSizes: could not start', err);
    if (!result.made.length && !result.failed.length) {
      throw new Error('Photoshop is busy with something else. Finish or cancel it, then try again.');
    }
    // Some sizes were finished before Photoshop stopped. Report what happened to the rest.
    for (let i = result.made.length + result.failed.length; i < payload.sizes.length; i++) {
      result.failed.push({ name: (payload.sizes[i] && payload.sizes[i].name) || 'Size ' + (i + 1), error: 'Photoshop stopped before this size was made. Try again.' });
    }
  }
  return result;
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
  makeSizes: function (payload) {
    return makeSizes(payload);
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
