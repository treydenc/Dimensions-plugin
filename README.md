# [ tool name ]

[ One sentence: what it does and who it is for. ]

> This README is a template. Fill in every bracket before you push.
> Notes on the starter itself are in `docs/STARTER.md`.

## The problem

[ Two or three sentences. Who has this problem, how they handle it today, what it costs them. ]

## What it does

[ Three bullets at most. What the person does, what the tool does, what the person decides. ]

## Run it

Needs Node 20.9 or later.

```bash
npm install
cp .env.example .env.local   # then add ANTHROPIC_API_KEY
npm run dev
```

Open http://localhost:3000.

Without an API key the app still runs, on sample output. The pill in the top right says which mode it is in.

## How it works

[ The architecture in one line, for example: input -> Claude extracts -> code checks -> person approves -> saved. ]

- **Model:** [ which model, and why a single call / chain / agent ]
- **Context:** [ what the model sees, and who chose it ]
- **Tools:** [ what it can do, and what it cannot ]
- **Prompt:** `lib/prompts.ts`
- **Checks in code:** `lib/checks.ts`
- **Where a person decides:** [ the approval step ]

## What I would do next

- [ ]
- [ ]

## How I used AI to build this

See `NOTES.md`.
