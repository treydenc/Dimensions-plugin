# What came from the starter

This app began as a copy of my starter (`F:\Local-AI-Starter`). This page says what is still the starter's and what this build replaced.

## Pages

| Page | What it is |
|---|---|
| `/` | The tool: the poster resize panel |
| `/plan` | The plan, drawn from `plan.ts`: problem, form, system map, design, architecture, iterations |
| `/kit` | The design system |

## How the plan drives the app

`plan.ts` holds every decision as data. `null` means not decided, and shows on `/plan` as `[ undecided ]` with a count at the top. When a decision changes, `plan.ts` changes first, then the code.

## The routes in this build

| Route | Pattern | What it does |
|---|---|---|
| `app/api/layout` | Fixed chain | Scale to fit in code, then place with the model only if a check fails, with one retry |
| `app/api/review` | One call | The model looks at a picture of a layout |
| `app/api/rules` | One call | The model reads the client's rules document |
| `app/api/files` | No model | Saves an uploaded document into `data/uploads/` |

Removed from the starter: its sample routes (`single`, `chain`, `agent`, `saved`, `status`), the agent loop in `lib/claude.ts`, the `/forms` demos, and the web and desktop shells. This tool only needs the plug-in shell.

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
lib/claude.ts           askClaude(); the only API caller
lib/schemas.ts          shapes the model must return
lib/checks.ts           the gate: rules in code
lib/layout.ts           geometry, and the rules in the form code checks
lib/rules.ts            a rule as the designer reads it, and as the checks use it
lib/poster.ts           loads the rules and sizes, and the rules in use
lib/prompts.ts          every prompt
lib/samples.ts          sample output (used with no API key)
lib/host.ts             the bridge to Photoshop
lib/store.ts            JSON file store
lib/loaders.ts          read and upload files in data/
data/poster/            the sample rules and sizes
public/poster/layers/   the sample layer images, for previews
```

## Notes

- The model defaults to `claude-sonnet-5-5`. Set `ANTHROPIC_MODEL` in `.env.local` to change it.
- With no API key, the Story sample fails a check on its first try on purpose, so you can see the gate catch it and the retry fix it.
- `data/store.json` and `data/uploads/` are created on first use and are not committed.
- The font is installed from npm, so it works offline.
