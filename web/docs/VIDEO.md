# Video: 8 minutes

Record within 48 hours. Screen plus voice.

Present from the **Build walkthrough** deck in my deck repo (`F:\interview-deck`, `npm run dev`, then `/?deck=walkthrough`). It is not in this repo, so nothing about the video ships with the build.

Before recording, fill in `log`, `demo` and `next` in `plan.ts`, then copy the plan into `src/decks/walkthrough/plan.json` in the deck repo and set `demo.url` to where the tool runs.

| Time | Section | Show | Say |
|---|---|---|---|
| 0:00–1:30 | How I understood the problem | The brief, then the one-sentence problem | Who it is for, what I chose, what I left out and why |
| 1:30–3:30 | How I built it | System map: model, context, tools, prompt. Then the architecture sketch. | Why a call, chain or agent. What is in code and what is the model. Where the person decides. |
| 3:30–4:30 | How I worked with AI | Decision log, one or two real prompts, the three tags | Where Claude was fast, where I overruled it, one mistake I caught |
| 4:30–7:00 | Demo | The tool, happy path first | One real task start to finish. Then a bad answer being caught by a check. |
| 7:00–8:00 | With more time | The cut list | Three next steps, in order. What it becomes in production. |

## Camera

Ten of the twelve slides have a place for my camera. In the deck, `C` steps through a marked slot, the live webcam, and off. The deck repo's README has the details.

## Before recording

- [ ] Dry run once with a timer.
- [ ] Demo data loaded. Browser zoom at 125%.
- [ ] Notifications off. Other windows closed.
- [ ] Mic check: record 10 seconds and listen.
