# Notes

Fill this in as you go. It is the script for the video.

## 0–10 min: the problem

- **Brief, in my words:**
- **Who it is for:**
- **Problem I chose, in one sentence:**
- **Why this one and not the others:**
- **Form:** web app for the demo. In production it would be [ hosted web app / desktop app / plugin ] because

## 10–20 min: the system

Answer in a few words each. Skip what the brief makes irrelevant.

### The four areas

**Model**
- Which model does which job?
- One call, a fixed chain, or an agent? (Complex enough? Worth the tokens? Can it do every part? What does a mistake cost?)
- Verdict:

**Context**
- What does the model see on each run?
- Who chooses it: the person picks the documents, the system retrieves them, or both?
- Can the person add to it or correct it? Does that carry over to the next run?

**Tools**
- What can it read?
- What can it change?
- Which actions wait for a person's yes?

**Prompt**
- The one instruction that matters most:
- Examples or a schema to pin the output?
- What checks the answer afterwards?

### Human-centered design

- **Data:** how is it tagged, and can the person see where each fact came from?
- **Privacy:** what is sensitive, and where does it go?
- **Brand or design book:** which rules exist, and which are enforced in code?
- **Agency:** what does the person decide? Can they undo?
- **Direct manipulation:** can they fix the result by editing it, without re-prompting?
- **Generative UI:** does the interface change with the output, or is a fixed layout enough?
- Two or three principles I am holding to:

### Code, model, or person?

- Rules I can write down (code):
- Judgment calls (model proposes):
- Decisions that stay with the person:

### Architecture

inputs -> stations -> gate in code -> store -> person

```
[ sketch ]
```

## Cut list

Things I chose not to build, and why.

-

## Decision log

One line each time I narrow scope, reject a suggestion from Claude, or fix its mistake.

| Time | What happened | What I decided |
|---|---|---|
| | | |

## Iterations

- **v1 (by 0:55):** thinnest version working end to end.
- **v2 (by 1:30):** AI quality and the person's control.
- **v3 (by 1:50):** states, sample data, README.

## With more time

-
