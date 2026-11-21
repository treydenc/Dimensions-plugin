# The starter

One Next.js app with three pages.

| Page | What it is |
|---|---|
| `/` | The tool |
| `/plan` | The plan, drawn from `plan.ts`: problem, form, system map, design, architecture, iterations |
| `/forms` | The same tool as a web app, a plug-in panel and a desktop app |
| `/kit` | The design system, documented in five parts |

## How the plan drives the app

`plan.ts` holds every decision as data. `null` means not decided, and shows on `/plan` as `[ undecided ]` with a count at the top.

1. Copy `plan.blank.ts` over `plan.ts`.
2. Fill it in, top to bottom. Watch `/plan` fill in with it.
3. Build what it says. When a decision changes, change `plan.ts` first.

Today the tool reads its name and default pattern from the plan. More is wired in as pieces are added (see the inventory).

## Three ways to use a model

| Pattern | File | Use it when |
|---|---|---|
| One call | `app/api/single/route.ts` | Classify, extract, draft, score. Most tools. |
| Fixed chain | `app/api/chain/route.ts` | Two or three steps in a known order. |
| Agent loop | `app/api/agent/route.ts` | The model has to decide the next step. Capped at 5. |

## Map

```
plan.ts                 the plan, as data
plan.blank.ts           an empty plan to copy
app/page.tsx            the tool
app/plan/page.tsx       the plan, drawn
app/kit/page.tsx        the design system
app/api/*/route.ts      thin routes
components/ui.tsx       every component
app/globals.css         every token
lib/claude.ts           askClaude() and runAgent(); the only API caller
lib/schemas.ts          shapes the model must return
lib/checks.ts           the gate: rules in code
lib/prompts.ts          every prompt
lib/samples.ts          sample input and output (used with no API key)
lib/store.ts            JSON file store
lib/loaders.ts          read and upload files in data/: text, JSON, CSV, images, PDFs
data/                   drop the brief's files here
practice/               practice briefs with their files; see practice/README.md
```

## Inventory

Keep this list current. It is how to remember what the starter can already do.

**In**
- [x] Plan as data, with `/plan`
- [x] Design system documented at `/kit` in five parts: foundation, components, motion, interaction, patterns. Each entry has its purpose, a live specimen and its values
- [x] Three form shells with a demo each at `/forms`: `WebShell`, `PluginShell`, `DesktopShell` in `components/shells/`. `plan.form.production` marks which one the tool uses
- [x] The tool at `/` renders inside the shell the plan names. Preview another with `/?form=web`, `/?form=plugin` or `/?form=desktop`
- [x] Shared rows and marks in `components/ui.tsx` and `/kit`: list rows, check row, status mark, page-scale form rows, inline progress
- [x] File drop and context picker: a person adds PDFs, images or text and ticks which ones the model sees. `askClaude({ files })` sends them
- [x] `design.shaped` in the plan files each design principle under a moment in the person's work (start, ask, judge, correct) and says what it changed in the system; the video walkthrough has a slide for it
- [x] The video walkthrough deck moved out of this repo to `interview-deck` (`/?deck=walkthrough`). It reads a copy of the plan: `src/decks/walkthrough/plan.json` there.
- [x] Motion templates in `globals.css`, documented on `/kit`: `.stagger`, `.draw-x/.draw-y`, `.seq`
- [x] The agent rule gives a verdict on `/plan`
- [x] Panel layout: canvas plus docked side panel, with dense controls (select, slider, toggle, input, progress, thumbnails)
- [x] One call, fixed chain, capped agent loop
- [x] Structured output with Zod schemas
- [x] Checks in code (quote grounding, reply rules)
- [x] Approve-then-save step and a JSON store
- [x] Sample output when there is no API key
- [x] Loaders for text, JSON, CSV, images
- [x] Plain-language error messages

**Next**
- [ ] Editable results
- [ ] Tools that change things, with an approve step in the middle of a run
- [ ] Multi-station runs: a lead that plans, stations with one job each, a gate that sends work back
- [ ] Live progress while a run is working
- [ ] Trace of every model call (time, tokens, cost) with a `/trace` page
- [ ] Other APIs behind one adapter each (image generation, speech, search)
- [ ] Claude Agent SDK as a second agent runner, beside the plain loop in `lib/claude.ts`
- [ ] Sample data generator

## Notes

- The model defaults to `claude-sonnet-5-5`. Set `ANTHROPIC_MODEL` in `.env.local` to change it.
- The sample output includes one invented task on purpose, so you can see the gate reject it.
- `data/store.json` is created on first save and is not committed.
- The font is installed from npm, so it works offline.
