# WovenCut *(working title — Paul will brand it later)*

A truly free video editor for budget creators — a **Windows desktop app**
for making long-form YouTube videos the simple way: drop clips onto a
timeline, drag them into order, trim, caption, add music, export.
**No upsells, no premium tier, no watermark ransom, no telemetry — ever.**

WovenCut ships "empty": the editor itself is free, and each user plugs in
**their own Muse** as an AI co-editor and **their own Replicate account**
to generate AI segue clips between scenes. Users pay their own AI providers
directly, at cost. WovenCut takes nothing and sells nothing.

## Why

Paul's framing: most "free" editors are storefronts wearing an editor's
clothes — the good features are bait for a subscription. This is an
experiment in vibe-coded software built the other way: a small, honest
tool that does the job, free, because information and tools should be free.
What costs money is the *application* — your own AI time and rendering,
paid by you, to your own providers, with no middleman.

## The interface explains itself

Every button and control carries an **icon, a plain-words label, and a
tooltip**. Paul's design rule: *"If a first-time user can't guess what a
button does, the button is wrong."* No icon-only mystery buttons, anywhere.

## Paul's first-frame rule — the app's default

> A new project's first clip opens at **full strength**. Fade-in defaults
> to **0**. Never an open on black.

Paul spotted a black fade-in open on one of his posted videos within hours
and killed the practice on the spot. Fades and crossfades are standard
tools here — every clip has fade-in/fade-out controls and crossfade joins —
but the *default* is Paul's way (see `RULES` in `js/model.js`). Raise a
fade only if you mean to.

## What works today (Phase 1 — Windows desktop)

- **Electron desktop app** for Windows (installer + portable build via
  GitHub Actions — see below).
- **Drag-and-drop timeline** with four lanes:
  - 🎬 **Main video** — drop video/image files from your computer; blocks
    show filename + real duration; **drag blocks to reorder**; click to
    select; Delete key or ✕ removes; click empty track to seek.
  - 🪟 **Overlay (picture-in-picture)** — clips that float in a corner
    over the main video; corner (4 choices), size %, start and duration
    are all editable; the preview composites them live.
  - 💬 **Captions** — add at the playhead, click to edit words and timing.
  - 🎵 **Music** — drop an audio file; volume control (playback sync is
    Phase 3).
- **Inspector** for the selected item: duration, **trim** (skip-from-start),
  **fade in / fade out**, **transition in: Cut or Crossfade** with
  adjustable crossfade length, and **Split at Playhead**.
- **Preview player** that honours all of it — fades, crossfades, PiP
  overlays, captions — opening on segment one at full strength.
- **Save / open projects** as plain JSON files.

### Honestly stubbed (labelled in the app, planned in WORKFLOW.md)
| Piece | Status |
|---|---|
| Export | Full FFmpeg plan + argument builder are real; the render itself waits for Phase 4 (bundled FFmpeg). The app says so — nothing fake-renders. |
| AI segues (Replicate) | Panel + token-safety design; generation is Phase 5, on your own account. |
| Muse co-editor | Panel + suggestion interface; wiring is Phase 6, on your own Muse. |
| Shirt-logo overlay, trademark blur | Later phases (7–8): keyframed tracking first, assisted tracking last. Blurring is a convenience, never a legal guarantee. |

### Project format (v2)
Plain JSON: `tracks.main` (clips with `trimIn`, `fadeIn`, `fadeOut`,
`transitionIn`, `transitionDuration`; segue items flagged
`generated: true`), `tracks.overlay` (PiP items with `start`, `corner`,
`sizePct`), `captions` (timed in seconds), and `music` (a file reference
only). See `js/model.js`.

## Run it (development)

```sh
npm install
npm start          # opens the Electron app
```

The renderer (`index.html` + `js/` + `css/`) also opens in a plain browser
for quick UI checks; native dialogs and the export stub need the desktop
shell.

## Get the Windows .exe

The installer is built by **GitHub Actions** on a Windows runner
(`.github/workflows/build-windows.yml`): push a version tag or run the
workflow manually, then download the artifact (or the GitHub Release
assets on tags). The .exe is not built on the developer machine.

## Your keys stay yours

When the Replicate and Muse modules are implemented (Phases 5–6), you
will paste **your own** tokens into the app at runtime. They live only on
your machine, are never sent anywhere except the provider you chose, never
bundled with the app, and there are no shared or demo keys. No account?
The editor still edits — the AI features simply stay dark.

## Open questions for Paul

1. **Final name** — "WovenCut" is a working title only.
2. **License** for the GitHub freeware release — MIT vs GPL is Paul's call
   (see WORKFLOW.md, Phase 9). Undecided, deliberately.
3. ~~Phone vs desktop first~~ — **decided Nov 4 2026: Windows desktop
   first.** (WORKFLOW.md decisions log.)

## Development

Phased plan, Paul's decisions and hard rules, review gates, and the review
log live in [WORKFLOW.md](WORKFLOW.md). An instructional video in Paul's
woven-stills style ships with the release (Phase 9). Paul directs, AI
builds, Paul reviews.
