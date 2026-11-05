# WovenCut Capability Matrix — vs the professional editors

**Date:** 2026-11-05 (pro pass 2; updated at the end of the pass, after
Phase 4 rendering and the legal-audit builds landed)
**Sources:** `docs/PRO-RESEARCH-2026-11-05.md`,
`docs/research-pro-features.md`, `docs/research-pro-ui-timeline.md`
(sourced research, URLs in those docs). Competitor cells come from
that research — a "—" means *not covered by the sourced research*,
not a claim that the feature is absent.

**WovenCut status key (the honest column):**
- ✅ **Working** — built and verified (UI-tested headlessly and/or by
  the repo test suites; rendering verified with real FFmpeg runs).
- 🟡 **Plan-only** — a planner, panel, or design exists and is honest
  about it in the app, but the feature does not work end-to-end yet.
- ⛔ **Not yet** — does not exist in WovenCut today.

**Competitor key:** ● full/standard · ◐ partial, limited, or
paid-tier · ○ not offered · — not covered by the sourced research.

## Editing core

| Feature | WovenCut | Premiere Pro | DaVinci Resolve | Final Cut Pro | CapCut Desktop |
|---|---|---|---|---|---|
| Layered multi-track timeline (background / main / stackable layers / captions / music) | ✅ Working | ● | ● | ● | ● |
| Drag-and-drop import (incl. folders), drag to reorder | ✅ Working | ● | ● | ● | ● |
| Split, trim, clip fades | ✅ Working | ● | ● | ● | ● |
| Ripple trim to playhead (Q/W) | ✅ Working | ● | ● | ● | ● |
| Undo/redo | ✅ Working (80-step history; no clickable history panel) | ● (+ History panel) | ● (+ History window) | ● | ● |
| Snapping / magnetism (on by default) | ✅ Working | ● | ● | ● | ● |
| Markers (named, jump-to) | ✅ Working | ● | ● | ● | ● |
| Timeline zoom + fit, timecode ruler/readout | ✅ Working | ● | ● | ● | ● |
| JKL shuttle, frame stepping | ✅ Working | ● | ● | ● | — |
| Track headers: lock / hide / mute | 🟡 Hide + Mute working; **Lock ⛔** | ● | ● | — | ● |
| Real audio waveforms (decoded from your files) | ✅ Working | ● | ● | ● | ● |
| Clip thumbnails / filmstrips | ⛔ (labelled placeholder frames) | ● | ● | ● | ● |
| Real-media preview playback (decoded video + audio) | ⛔ — Phase 3, the biggest remaining gap | ● | ● | ● | ● |
| Volume line / keyframes on clips | ⛔ | ● | ● | ● | ● |
| Keyframe animation (position/scale/opacity/rotation) | ⛔ — the engine Phase 7 also needs | ● | ● | ● | ● |
| Live audio meter by the preview | ⛔ (needs Phase 3 audio) | ● | ● | ● | ◐ (small meter; weakest of the four) |
| Speed controls: constant %, reverse, freeze, ramps | ⛔ | ● | ● | ● | ● (incl. curve editor) |
| Stabilisation ("smooth shaky video") | ⛔ (FFmpeg build question first) | ● | ● | — | ● |
| Multicam, source monitor, scopes, mixer page | ⛔ — explicitly out of scope (beginner value ≈ 0) | ● | ● | ● | ○ |

## Transitions & effects

| Feature | WovenCut | Premiere Pro | DaVinci Resolve | Final Cut Pro | CapCut Desktop |
|---|---|---|---|---|---|
| Transitions library | ✅ Working — 6 types end-to-end (cut, crossfade, dip black/white, wipe, slide); pros ship 95–hundreds | ● | ● | ● (95+) | ● |
| Colour basics (brightness/contrast/saturation sliders) | ⛔ | ● | ● | ● | ● |
| Colour wheels / curves / LUTs / scopes | ⛔ | ● | ● (the benchmark) | ● | ◐ (filters + adjustments) |
| Title / lower-third template systems | ⛔ (captions only today) | ● (.mogrt) | — | ● (176+ templates) | ● |
| Green-screen chroma key | 🟡 Model + preview flag exist; render warns and skips (not composited yet) | ● | ● | ● | ● |
| AI background removal (no green screen) | ⛔ | — | — | — | ● |

## Audio

| Feature | WovenCut | Premiere Pro | DaVinci Resolve | Final Cut Pro | CapCut Desktop |
|---|---|---|---|---|---|
| Music bed with volume control | ✅ Working | ● | ● | ● | ● |
| Auto-ducking music under speech | ✅ Working (real sidechain at render; dip curve shown on the timeline) | ● (Essential Sound) | — | — | ● |
| Loudness normalisation to −14 LUFS | ✅ Working — measured −13.7 LUFS on a real render | ● | ● | ● | ● |
| In-app loudness meter / report | ⛔ (normalisation is applied; no meter UI) | ● | ● | ◐ | ○ |
| Noise reduction / voice repair / EQ presets | ⛔ | ● | ● (Fairlight) | — | ● |
| Built-in music / SFX library | ⛔ (planned: small verified royalty-free set) | ◐ (Adobe Stock, paid) | ◐ (bundled SFX) | ◐ (bundled SFX/loops) | ● (large; paywall drift) |

## Captions & text

| Feature | WovenCut | Premiere Pro | DaVinci Resolve | Final Cut Pro | CapCut Desktop |
|---|---|---|---|---|---|
| Timed caption editor | ✅ Working | ● | ● | ● | ● |
| SRT import and export | ✅ Working | ● | ● | ● | ● |
| Burn-in vs sidecar choice at export | ✅ Working | ● | ● | ● | ● |
| Auto-captions (speech-to-text) | ⛔ (planned via the user's own API key) | ● | ◐ (Studio tier) | ● (Apple-silicon Macs) | ● |

## Media & project safety

| Feature | WovenCut | Premiere Pro | DaVinci Resolve | Final Cut Pro | CapCut Desktop |
|---|---|---|---|---|---|
| Save / open project files | ✅ Working (plain JSON) | ● | ● | ● | ● (cloud drafts) |
| Open, documented project format (your work is yours) | ✅ Working | ○ | ◐ (.drp export) | ○ | ○ |
| Auto-save + crash recovery | ✅ Working | ● | ● (Live Save) | ● | ● |
| Snapshots / version history | ✅ Working (named snapshots, 12-deep) | ● | ● (backups) | ● (Duplicate as Snapshot + backups) | ◐ |
| Bins / folders, metadata, media search | ⛔ | ● | ● | ● (keyword collections) | — |
| Proxy editing for big media | ⛔ | ● | ● | ● | — |
| Missing-file relink flow | ⛔ | ● | ● | ● | — |
| Project bundle / archive (project + used media) | ⛔ (planned; Paul's "bundle my project") | ● (Project Manager) | ● (Archive) | ● (Consolidate) | — |
| Collaboration | ⛔ (out of scope; snapshots + bundles are the honest equivalent) | ● (Team Projects) | ● (Blackmagic Cloud) | ○ (single-user by design) | ◐ (cloud spaces) |

## Export

| Feature | WovenCut | Premiere Pro | DaVinci Resolve | Final Cut Pro | CapCut Desktop |
|---|---|---|---|---|---|
| Real MP4 rendering | ✅ Working — main track with transitions/fades/music/ducking/loudness/captions; layer/background/keying warned, not yet composited | ● | ● | ● | ● |
| Platform export presets (YouTube / vertical / square…) | ✅ Working (5 presets wired into the render) | ● | ● | ● | ● |
| Render progress + cancel | ✅ Working | ● | ● | ● | ● |
| Export queue / batch | ⛔ | ● | ● | ◐ (via Compressor) | — |
| Upload kits (titles/tags/credit text for YouTube/TikTok/Instagram) | ✅ Working (text kits + automatic creator credit; upload itself is manual) | ◐ | ● (direct upload) | ◐ | ● |

## WovenCut-only rows (the founding promises)

| Feature | WovenCut | Premiere Pro | DaVinci Resolve | Final Cut Pro | CapCut Desktop |
|---|---|---|---|---|---|
| Price | ✅ Free, no tiers | ○ subscription | ◐ free tier + paid Studio | ○ paid | ◐ free + Pro upsell (features drifting behind it) |
| No watermark, no length caps, no nags | ✅ Working (charter) | ● | ● | ● | ◐ |
| No account required; works fully offline; no telemetry | ✅ Working | ○ | ● | ◐ | ○ (account + cloud) |
| First-frame rule (a video never opens on black/fade) | ✅ Working — enforced in model, tests, and measured in renders | ○ (user's choice) | ○ | ○ | ○ |
| Reaction-video flow (locked pairs + in-app webcam record, auto-synced) | ✅ Working | — | — | — | — |
| AI segues via your own Replicate account | 🟡 Panel + cost-first design; generation is Phase 5 | — | — | — | — |
| AI co-editor via your own Muse | 🟡 Panel + suggestion design; wiring is Phase 6 | — | — | — | — |
| Terms gate (per-section scrollwrap acceptance, local record) | ✅ Working (built in the pro pass 2 legal audit) | ○ | ○ | ○ | ○ |

## Reading the matrix honestly

WovenCut today genuinely covers the **beginner finishing path**:
import → arrange on a layered timeline → captions (SRT in/out) →
music with ducking → loudness-correct, transition-bearing MP4 out —
with the project-safety net (auto-save, snapshots, undo) the pros
treat as table stakes. It does **not** yet have the creative-depth
layer (colour, keyframes, speed, titles, effects), the media layer
(real-media preview, thumbnails, proxies, bins), or render
compositing for its own layer/background lanes. One ⛔ dwarfs the
rest: **real-media preview (Phase 3)** — the picture is still
labelled placeholders even though waveforms, ducking, and the render
are real. The ranked build order that follows from this matrix is in
`docs/PRO-RESEARCH-2026-11-05.md` (pass-2 addendum).
