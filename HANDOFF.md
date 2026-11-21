# Handoff: poster resize practice build

Read this first in a new thread. It says where things are and what is decided.

## What this is

A practice run for my Kettle final round (Monday: a brief and a repo, 2 hours to build, then an 8-minute video).
This repo is a copy of my starter (`F:\Local-AI-Starter`), set up for the brief in `practice/02-poster-resize/BRIEF.md`.

## Layout

- `web/` the Next.js app: the tool's interface, the Claude calls, the checks. Run `npm run dev` here (port 3000).
- `plugin/` a Photoshop UXP plug-in. Its panel is a WebView showing `http://localhost:3000`, plus the Photoshop commands.
- `practice/02-poster-resize/` the brief, `poster.png`, `layers/`, `layers.json` (each layer's place, role and rule), `sizes.json`.

## What works (checked on my machine, 20 Nov)

- The plug-in loads in Photoshop 28 through UXP Developer Tool (`plugin/manifest.json`), and its status line says "Connected".
- The bridge: `web/lib/host.ts` has `ask('ping')` and `ask('getDocument')`; `plugin/index.js` answers them. `getDocument` returns the open document's size and layers. Both are read-only.
- Not built yet: any command that changes the document. Those must run inside `core.executeAsModal`.
- The tool on `/` is still the starter's sample (Feedback Sorter). It gets replaced during the build.

## Design system

It is in the repo, so read it there instead of asking me for it:
- Tokens and utilities: `web/app/globals.css` (colours, radii, depth, motion templates, `color-field`, `glass-still`, `glass-pane`).
- Components: `web/components/ui.tsx`. The plug-in panel: `web/components/shells/PluginShell.tsx`.
- The documented system with live examples: `/kit`.
- The look is three layers, from treydenc.com/ai-principles: a colour field at the back, a glass pane over it, and a black canvas card inside the pane for the work. Use these components and tokens. Do not write raw colours or sizes at a call site.

## The plan (`web/plan.ts`, drawn on `/plan`)

Decided:
1. **Problem.** Agency designers rebuild a film client's one sheet by hand for 20 to 40 sizes, 15 to 40 minutes each. The legal lines are where mistakes get expensive.
   **Chosen:** get a designer from the one sheet to a first set of sizes inside Photoshop, with every legal line checked and everything still editable.
   **Scope:** Story, Square and Video thumbnail first, then the other seven. Genre or style variants only if there is time.
2. **Form.** A Photoshop plug-in, because designers do not want another window.

Still to decide, in this order:
3. Model, and the agent test (complex enough, worth the tokens, can do every part, is a mistake cheap)
4. Context (what the person picks, what the system fixes)
5. Tools (which Photoshop commands, which need approval)
6. Prompt (the key instruction, what pins the output, what checks it)
7. Human-centered design (one principle per moment: start, ask, judge, correct)
8. Architecture, then the three passes

## How I want to work

- One decision at a time. Ask me first, so I practise deciding. After I answer, give your own suggestion with the reason, push back if the brief says otherwise, then write the agreed answer into `web/plan.ts`.
- If I am stuck or ask, give the suggestion straight away.
- Simplest pattern that works. Rules in code, not in the prompt. The model proposes, code checks, the person decides.
- Check current Adobe UXP docs before using any Photoshop call.
- I commit and push myself.
