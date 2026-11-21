# CLAUDE.md

A small local tool for non-technical users, built fast. Favour working over clever.

## Commands

```bash
npm run dev         # develop
npm run typecheck   # must pass before every commit
npm run build       # must pass before every push
```

## Rules

- **Small steps.** One change at a time, typecheck, then the next. Do not rewrite files you were not asked to touch.
- **`lib/claude.ts` is the only file that calls the Anthropic API.** Routes use `askClaude()` for one structured answer or `runAgent()` for a capped tool loop.
- **Every model answer has a Zod schema** in `lib/schemas.ts`. No free-text parsing.
- **Rules you can write down go in code** (`lib/checks.ts`), not in a prompt. The model proposes, code checks, the person decides.
- **Prompts live in `lib/prompts.ts`.**
- **Simplest pattern that works:** one call, then a fixed chain, then the agent loop. Say why before reaching for the agent.
- **Tools the model can call are read-only** unless a person approves the action in the UI.
- **Every model call needs sample output** so the app runs with no API key.
- **Every screen has four states:** empty, working, done, failed. Errors are one plain sentence that says what to do.
- **Plain language in the UI.** No jargon, no model names in body copy, no instructional filler text.
- **Unfinished things look unfinished:** `[ like this ]`.
- **Data** is files in `data/` and the JSON store in `lib/store.ts`. No database server, no hosted services.
- **No new dependencies** without asking.
- **The plan is `plan.ts`.** When a decision changes, update `plan.ts` first, then the code. `/plan` must always describe what is built. Leave a field `null` if it is not decided; never guess.
- **Design system only.** Build screens from `components/ui.tsx` and the tokens in `app/globals.css`. No raw hex, no new radii, no new font sizes at a call site. If a component is missing, add it to `components/ui.tsx` and to `/kit` first.
- **Colour:** dark ground, stone ink, silver accent. Spectrum colours mark categories only and always sit next to a text label.
- **Type:** Instrument Sans. Sizes in use: 48, 30, 20, 14, 12, 11.
- **Read `/kit` before building a screen.** It says what each component is for. Hover moves a thing one step toward full ink and nothing else. A result arriving uses the `enter` class.
- **Three forms.** A tool is a web app (`WebShell`), a plug-in panel (`PluginShell`) or a desktop app (`DesktopShell`), from `components/shells/`. Use the one `plan.form.production` names. Put content in the shell's slots; do not rebuild the frame. A plug-in demo never imitates the host application's interface.
- **Two scales.** Page scale (36px buttons, 14px text) for full screens. Panel scale (28px controls, 12px text) inside `Workspace`, for tools that sit beside a canvas like a plug-in.

## When I say "log it"

Add an entry to `log` in `plan.ts`: what happened, and what I decided. It shows on `/plan`, and it feeds the video walkthrough, which lives in my deck repo.

## Layout of this repo

- `web/` is the Next.js app (everything the rules above describe). Run npm commands from inside it.
- `plugin/` is the Photoshop UXP plug-in: a panel that shows `web` in a WebView and runs Photoshop commands. Load `plugin/manifest.json` in UXP Developer Tool.
- `sample/` holds the brief and its files.
