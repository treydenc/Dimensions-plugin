# Handoff: Dimens/ons, the poster resize build

Read this first in a new thread. It says where things are and what is decided.

## What this is

A practice run for my Kettle final round (Monday: a brief and a repo, 2 hours to build, then an 8-minute video).
This repo began as a copy of my starter (`F:\Local-AI-Starter`), set up for the brief in `sample/02-poster-resize/BRIEF.md`.
The tool is a Photoshop panel that proposes the other sizes of a film poster. `README.md` describes it.

## Layout

- `web/` the Next.js app: the panel, the Claude calls, the checks. Run `npm run dev` here (port 3000).
- `plugin/` the Photoshop UXP plug-in. Its panel is a WebView showing `http://localhost:3000`, plus the Photoshop commands. See `plugin/README.md`.
- `sample/02-poster-resize/` the brief, `poster.png`, `poster.psd` (layered, with the layer names the tool expects), `layers/`, `layers.json`, `sizes.json`, `client-rules.pdf`.
- `docs/` the demo recording used by the README.

## What works (checked on my machine, 20 Nov)

- The plug-in loads in Photoshop 28 through UXP Developer Tool and its status line says "Connected".
- Propose: layouts come back from the live model for the ticked sizes, each with a label and a reason.
- The look at the picture runs after each layout and can send a size back once.
- The rules reader: upload `client-rules.pdf`, tick rules, and the checks use them.
- Make in Photoshop: made the Square size as a new document with every layer in place.

## Not checked yet

- `npm run build`, and a fresh clone with no API key.
- Make in Photoshop on the other four sizes.
- The failure states by eye: no document open, no API key, a wrong file in the rules upload, a size that ends as "Needs you".

## The plan (`web/plan.ts`, drawn on `/plan`)

Every step is decided except four fields left open on purpose: the one line, generative UI, and the two demo fields.

1. **Problem and form.** A first set of sizes inside Photoshop, legal lines checked, everything editable. A plug-in.
2. **Model.** A fixed chain with caps, not an agent. `claude-sonnet-5-5`.
3. **Context.** The designer picks sizes and uploads the client's rules. The model sees numbers, then a picture of each layout.
4. **Tools.** Read the document, ask for a layout, make a size. Each size has its own yes.
5. **Prompt.** "Place every layer for this size. Do not judge whether a rule is met." A schema pins it, code checks it.
6. **Passes.** v1 and v2 are done. v3 is states, sample data and the README.

## How I want to work

- One decision at a time. Ask me first, then give your suggestion with the reason, then write the answer into `web/plan.ts`.
- Simplest pattern that works. Rules in code, not in the prompt. The model proposes, code checks, the person decides.
- Check current Adobe UXP docs before using any Photoshop call.
- After changing `plugin/index.js`, I have to reload the plug-in in UXP Developer Tool.
- I commit and push myself.
