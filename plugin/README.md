# The Photoshop side

A UXP plug-in with one panel. The panel is a WebView that shows the web app in `../web`, so all the
interface lives there. This folder only hosts it and does the Photoshop work it asks for.

## Files

| File | What it does |
|---|---|
| `manifest.json` | Declares the panel and allows the WebView to load `http://localhost:3000` |
| `index.html` | The panel: a one-line status and the WebView |
| `index.js` | Answers the web app's messages and runs the Photoshop commands |

## Commands

The web app sends a message, `index.js` does the Photoshop part and answers. The other end is `web/lib/host.ts`.

| Command | Changes the document? | What it does |
|---|---|---|
| `ping` | No | Says which application and version is hosting the panel |
| `getDocument` | No | Returns the open document's size and layers |
| `makeSizes` | Yes, after the designer's yes | Makes each size as a new document with editable layers |

How `makeSizes` builds a size: it duplicates the whole poster as a new document, sizes and moves each
layer inside that copy, then trims the canvas to the new size from the top left. It measures every layer
afterwards. If a layer is not where it should be, that size fails with a plain sentence and the
half-made document is closed. The poster itself is never changed.

Every command that changes Photoshop runs inside `core.executeAsModal`.

## Load it

Needs Photoshop 28 and UXP Developer Tool.

1. In `../web`, run `npm run dev`.
2. In UXP Developer Tool, choose Add Plugin and pick this folder's `manifest.json`.
3. Choose Load from the plug-in's menu. The panel's status line reads "Connected" once the web app answers.

After changing `index.js`, reload the plug-in in UXP Developer Tool. Reloading the web page is not enough.

## Before this could ship

- The web app is hosted at an https address, and `manifest.json` allows that address instead of localhost.
- The manifest gets a real plug-in ID from Adobe's Developer Distribution portal. The current one is a test value.
- It is packaged as a `.ccx` from UXP Developer Tool.
