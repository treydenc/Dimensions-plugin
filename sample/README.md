# Sample

The brief this tool was built for, with its files. Everything here is invented: the agency, the client, the film and the people.

## `02-poster-resize/`

| File | What it is |
|---|---|
| `BRIEF.md` | The brief: one poster, every size |
| `poster.png` | The finished one sheet for *The Long Tide* |
| `poster.psd` | The same poster as a layered Photoshop file. Open this one to use the panel. |
| `layers/` | Each layer as its own image |
| `layers.json` | Where each layer sits, what it is, and the client's rule for it |
| `sizes.json` | The sizes the campaign needs, and the areas each platform covers |
| `client-rules.pdf` | The client's rules as a one-page document, for the rules reader |

`poster.psd` and `client-rules.pdf` were made for testing. They are not part of the original brief.

The web app reads its own copies of `layers.json` and `sizes.json` from `web/data/poster/`, and draws previews from `web/public/poster/layers/`.
