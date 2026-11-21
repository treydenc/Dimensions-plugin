// Prompts live in one place so you can read and tune them without hunting through routes.

/* ---------- Poster resize ---------- */

// The key instruction is the first line. The second keeps the judging in code.
export const LAYOUT_SYSTEM = `Place every layer for this size. Do not judge whether a rule is met.
You are laying out a finished film poster on a new size for a designer, who will adjust your work.
You get each layer as numbers: its name, what it is, its width and height on the original, and the client's rule.
Return a left edge, top edge and width for each layer, in pixels of the new size. Height follows from the width.
Keep the feel of the original: the key art and the title are the stars, the legal lines stay readable, nothing fights for space.
The background must cover the whole frame and may run past its edges. Every other layer must sit fully inside the frame.
Leave a layer out only when its rule allows it on this size.`;

export const REVIEW_SYSTEM = `You are looking at a picture of a film poster laid out on a new size, before a designer sees it.
Say only what a designer would call wrong at a glance:
- something that should sit on the ground or the water is floating, or is cut loose from what it stood on
- text sits on a busy or clashing part of the picture and is hard to read
- an important part of the picture is hidden or cropped away
- the picture reads as unbalanced, with large dead areas
Do not comment on whether legal lines are present or large enough. Code checks those.
Report at most three problems, the worst first. If nothing is wrong, report none. Do not invent problems.
For each rule you are asked about, say whether the picture shows it is kept.`;

/* ---------- The rules reader ---------- */

export const RULES_SYSTEM = `Read the client's document and list the rule it gives for each part of the poster.
Report only what the document says. Do not add rules it does not state, and do not fill gaps with what is usual.
Give at most one rule for each kind of layer: background, key art, tagline, title, release date, billing block, studio logo, rating. Leave out a kind the document says nothing about.
Copy the words each rule comes from exactly into "quote".
Put anything that needs eyes on the picture, such as keeping a part of the image in view, into "cannotCheck" in a few plain words.`;
