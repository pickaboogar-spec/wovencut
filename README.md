# WovenCut *(working title — Paul will brand it later)*

A truly free video editor for budget creators. **No upsells, no premium tier,
no watermark ransom — ever.**

WovenCut ships "empty": the editor itself is free, and each user plugs in
**their own Muse** as an AI co-editor and **their own Replicate account** to
generate AI segue clips between scenes. Users pay their own AI providers
directly, at cost. WovenCut takes nothing and sells nothing.

## Why

Paul's framing: most "free" editors are storefronts wearing an editor's
clothes — the good features are bait for a subscription. This is an experiment
in vibe-coded software built the other way: a small, honest tool that does
the job, free, because information and tools should be free. What costs money
is the *application* — your own AI time and rendering, paid by you, to your
own providers, with no middleman.

It's built for Paul's signature format first: **woven stills** — a captioned
still-image series woven into a longer story video over a music bed.

## Paul's first-frame rule

> The first segment of every video opens at **full strength**. No fade-in.
> Never an open on black.

Paul spotted a black fade-in open on one of his posted videos within hours
and killed the practice on the spot. The rule is encoded as a constant in
`js/model.js`, applied by the preview player, and required of every future
export path.

## What the skeleton is (Phase 0)

A static web app: **no build step, no server, no dependencies, no network
calls.** Plain HTML/CSS/JS modules, so it can later sit on GitHub Pages
unchanged.

### Works today
- A canvas preview player that plays a hardcoded sample project: four
  woven-stills segments (CSS-generated placeholder frames — no image files),
  each with a caption and duration, advancing in sequence, **opening on
  segment one at full strength**.
- Play / pause / restart, segment indicator, live caption rendering.
- A timeline strip rendered from the project model, showing each cut's
  transition type and flagging segue items as AI-generated.

### Stubbed (interfaces defined, nothing implemented)
| Module | Stub covers |
|---|---|
| `js/captions.js` | Caption editor: add/edit/retime captions against segments |
| `js/music.js` | Music track: user audio file reference, trim, volume |
| `js/export.js` | Export plan — documents the ffmpeg.wasm in-browser render path |
| `js/replicate.js` | Segue generation interface — user's own Replicate token, runtime only |
| `js/muse.js` | Muse co-editor panel — user's own Muse access, chat placeholder |

### Project format
A project is plain JSON (see `js/model.js` for the sample): a `stills` track
of items with `duration` and per-cut `transition` (default `"cut"`), segue
items marked `generated: true` with their `provider`, a `captions` track
timed in seconds, and a `music` track holding a file reference only.

## Run it

Either open `index.html` directly in a browser, or serve the folder:

```sh
cd wovencut
python3 -m http.server 8000   # then open http://localhost:8000
```

## Your keys stay yours

When the Replicate and Muse modules are implemented (Phases 5–6), you will
paste **your own** tokens into the app at runtime. They will live only in
your browser, on your machine. They are never sent anywhere except the
provider you chose, never bundled with the app, and there are no shared or
demo keys. If you don't plug in an account, the editor still edits — the AI
features simply stay dark.

## Open questions for Paul

1. **Final name** — "WovenCut" is a working title only.
2. **License** for the GitHub freeware release — MIT vs GPL is Paul's call
   (see WORKFLOW.md, Phase 7). Undecided, deliberately.
3. **Phone vs desktop first** — the skeleton is desktop-shaped; Paul creates
   on his phone, so a phone-first layout pass may jump the queue.
4. Music bed fade-in under segment one — default no; Paul rules at Phase 3.

## Development

Phased plan, review gates, and the review log live in
[WORKFLOW.md](WORKFLOW.md). Paul directs, AI builds, Paul reviews.
