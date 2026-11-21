# Notes

The script for the video. Filled from `web/plan.ts`, which is the source of truth and is drawn at `/plan`.

## 0–10 min: the problem

- **Brief, in my words:** A film client sends one finished poster. Designers rebuild it by hand for every placement. Help a designer get from the one sheet to the pack.
- **Who it is for:** Designers at an agency, resizing a film client's finished poster.
- **Problem I chose, in one sentence:** Get a designer from the one sheet to a first set of sizes inside Photoshop, with every legal line checked and everything still editable.
- **Why this one and not the others:** Layout is where the hours go and the legal lines are where a mistake costs money. Three sizes that cover the hard cases came first.
- **Form:** web app for the demo. In production it would be a plugin, because designers work in Photoshop all day and do not want another window.

## 10–20 min: the system

### The four areas

**Model**
- Which model does which job? One model, three small jobs: read the client's rules, place layers on a size whose shape is very different, and look at a picture of a layout.
- One call, a fixed chain, or an agent? A fixed chain with a cap. Complex enough: no. Worth the tokens: yes. Can it do every part: yes. Is a mistake cheap: no.
- Verdict: workflow, not an agent. If a task does not need a model, it does not get one.

**Context**
- What does the model see on each run? Layer names, positions and rules as numbers. Then a small picture of each finished layout.
- Who chooses it? The designer picks the sizes and uploads the client's rules. The system fixes everything else.
- Can the person add to it or correct it? Yes: they tick which proposed rules are used. It carries over until they change the rules.

**Tools**
- What can it read? The open document's size and layers.
- What can it change? Nothing by itself. Code makes each size as a new document.
- Which actions wait for a person's yes? Proposing layouts, and making each size in Photoshop.

**Prompt**
- The one instruction that matters most: "Place every layer for this size. Do not judge whether a rule is met."
- Examples or a schema to pin the output? A schema: one place per layer, a left-out flag, a one-line reason. Height is never asked for, so nothing can be stretched.
- What checks the answer afterwards? Code: legal lines present, nothing cropped or stretched, billing size against the title, covered areas clear, logo clear space, no text on text. Failures go back once.

### Human-centered design

- **Data:** every size says Ready, Check this or Needs you, with the reason, and whether code or AI made it. Each rule shows the client's own words.
- **Privacy:** unreleased film artwork. Layer names, positions, rules and a small picture of each layout leave the machine, and the panel says so.
- **Brand or design book:** the client's rules, checked in code on every size.
- **Agency:** each size has its own Make in Photoshop and its own Try again. Nothing changes a document before a yes.
- **Direct manipulation:** everything lands as editable layers. Nothing checks again after an edit yet.
- **Generative UI:** [ undecided ]
- Principles I am holding to: the designer never writes a prompt; say what was checked and who made it; fix it by moving it.

### Code, model, or person?

- **Rules I can write down (code):** every check, shrinking the poster to fit, matching layers to rules by name, the plain-words version of each rule.
- **Judgment calls (model proposes):** reading rules out of a document, composing a new shape, seeing what looks wrong in a picture.
- **Decisions that stay with the person:** which rules to use, which sizes to make, and whether each one is good enough.

### Architecture

inputs -> stations -> gate in code -> store -> person

The drawn version is in `README.md`.

## Cut list

- An agent: the steps are known before it starts.
- Changing rules in the panel.
- One yes for the whole set: after using it, a yes for each size was clearer.
- A check again button for edited documents.
- A way back to the practice rules in the panel.

## Decision log

| What happened | What I decided |
|---|---|
| Ran the agent test before building. The steps are the same for every size. | A fixed chain with a cap. Code does the easy sizes, the model only the ones where the shape changes. |
| Measured the poster. Its billing letters are 12.6% of the title's letter height, and the rule says 15%. The one sheet fails its own rule. | Code raises the billing block to its smallest legal size on every size that needs it. |
| The first live layout came back cut off and crashed the run. Thinking used up the token limit. | Raised the limit. A cut-off answer is now a failed try, not a crash. |
| Used one Make button for the whole set and did not like it. | Each size has its own Make and its own Try again. |
| The model floated the lighthouse island in the sky. It only saw numbers, so no check could catch it. | Added a look at a picture of each layout. It can advise, it can never pass a legal line. |
| Claude proposed a rules file as JSON. Most designers do not write JSON. | The designer uploads the client's own document, and only ticked rules are used. |
| Make in Photoshop failed three ways before it worked. | Each size is a copy of the whole poster, changed in place, trimmed, then measured before it counts as made. |

## Iterations

- **v1:** Story, Square and Video thumbnail end to end, with rules loaded from `layers.json`.
- **v2:** the look at the picture, a yes and a try again for each size, and the rules reader.
- **v3:** states, sample data, README.

## With more time

1. The four wide sizes, with a one-line title.
2. Check a document again after the designer has edited it.
3. Rules saved per document, and edited in the panel.
4. A cost view: which sizes code did for free, and what the model calls cost.
5. Layout suggestions by genre or style.

## What slowed me down (fix in the starter)

- No layered sample file to test a plug-in against.
- The starter's 2,048-token default cut the first structured answer off.
- Three rounds to get layers moving in Photoshop, with no way to see its console from the chat.
