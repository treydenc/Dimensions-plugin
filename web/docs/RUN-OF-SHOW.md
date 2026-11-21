# Run of show: 2 hours

| Clock | Block | Done when |
|---|---|---|
| 0:00–0:10 | Read the brief. Pick the problem and the form. | One-sentence problem statement in `NOTES.md`. |
| 0:10–0:20 | System pass: model, context, tools, prompt. Principles. Sketch. | The table and the sketch in `NOTES.md` are filled in. |
| 0:20–0:55 | **v1.** Thinnest version, end to end, on real data. | It runs. Commit, tag `v1`, push. |
| 0:55–1:30 | **v2.** AI quality and the person's control. | Checks in code catch a bad answer. Tag `v2`, push. |
| 1:30–1:50 | **v3.** States, sample data, README. | README brackets filled. Tag `v3`, push. |
| 1:50–2:00 | **Freeze.** Fresh clone, install, run. | Final push. No new features. |

If a block runs over, cut scope and write the cut in `NOTES.md`. Do not borrow from the freeze.

## Before the timer starts

- [ ] Laptop plugged in. Chrome tabs and heavy apps closed.
- [ ] Claude Code signed in, set to Sonnet or Opus.
- [ ] `.env.local` has a working `ANTHROPIC_API_KEY` with credit.
- [ ] Their repo cloned. A test push works.
- [ ] Starter copied in. `npm install` and `npm run dev` work.
- [ ] Field Guide deck open in a tab.
- [ ] Timer visible. Water. Phone away.

## Every push

- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] One line in the decision log.

## Before the final push

- [ ] No brackets left in `README.md`.
- [ ] `.env.local` is not committed.
- [ ] Works with no API key (sample output).
- [ ] Works from a fresh clone.
