# WovenCut — Development Workflow

**WovenCut is a working title.** Paul brands it later; every use of the name in
this repo is provisional.

**What it is:** a truly free video editor for budget creators. No upsells, no
premium tier, no watermark ransom — ever. It ships "empty": the tool itself is
free, and each user plugs in **their own Muse** (AI co-editor) and **their
own Replicate account** (AI-generated segue/transition clips between scenes).
Users pay their own AI providers at cost; WovenCut takes nothing.

**What it is FOR (Paul, Nov 4 2026):** making long-form YouTube videos the
simple way — drop clips in, drag them into order on a timeline, trim, caption,
add music, export. Robust, real-editor feel; not a toy.

**How it's built:** Paul directs, AI builds, Paul reviews — his
"AI architect, human-reviewed" model. This workflow exists so that loop stays
tight: small phases, each one ending at Paul's review before the next begins.

---

## Decisions log (Paul's calls, in his words where it matters)

- **2026-11-04, ~7:30 PM — Windows desktop first.** The editor is a Windows
  desktop app (Electron). The phone-vs-desktop question is CLOSED: desktop
  first. (Paul creates on his phone today, but the editor he wants to give
  away is a Windows program; the current version of Windows is the target.)
- **2026-11-04, ~7:30 PM — Drag-and-drop is the core.** Clips uploaded to the
  app can be dragged and dropped onto the timeline line and edited there.
  "Make it a really simple way to make a long-form YouTube video with just
  drag and drop clip pasting capabilities" and "a really robust GUI."
- **2026-11-04, ~7:31 PM — Icons + self-explanatory menus.** See design rule 4.
- **2026-11-04, ~7:31 PM — Fades are tools; the default is Paul's way.**
  See hard rule 1 (refined).
- **2026-11-04, ~7:31 PM — Picture-in-picture overlay lane.** See Phase 1.
- **2026-11-04, ~7:33 PM (voice call) — two later-phase features recorded:**
  shirt logo overlay and trademark obscuring. See Phases 7–8. Both are
  honestly scoped as HARD (computer vision); neither is promised early.

---

## Paul's hard rules (baked in, not preferences)

1. **First-frame rule — refined by Paul, Nov 4 2026.** Paul's own videos open
   on the first frame at full strength: no fade-in, never an open on black.
   Fades and crossfades are standard tools WovenCut offers every user — BUT
   the app's default is Paul's way: a new project's first clip is created
   with fade-in = 0, sample projects ship that way, and no export preset may
   ever prepend a fade or a black lead-in. A user may raise a clip's fade-in
   in the inspector; the app never raises it for them. (Original Phase 0
   wording made the rule a hard lock; Paul's refinement makes it the
   DEFAULT, because the tool is for everyone while the rule is his craft.)
2. **No upsells.** If a feature idea smells like a premium tier, it is cut or
   it ships free. There is no third option.
3. **Users' keys are users' keys.** Muse and Replicate tokens are supplied
   by each user at runtime, live only on their machine, and are never
   committed, bundled, or proxied. Paul's own credentials never enter this
   codebase.
4. **Icons + words, always (Paul, Nov 4 2026).** Every menu item, toolbar
   button, and control carries a clear icon AND a plain-words label AND a
   tooltip that says what it does in ordinary language. No icon-only mystery
   buttons. Paul's test, verbatim in spirit: **"If a first-time user can't
   guess what a button does, the button is wrong."** The app must explain
   itself.
5. **No telemetry, no accounts, no phoning home.** The editor works offline
   on the user's own files. (AI features call the user's own providers, with
   the user's own keys, only when the user asks.)

---

## Build & release mechanics

- **Develop:** `npm install` once, then `npm start` (Electron). The renderer
  also opens in a plain browser for quick UI checks, with graceful fallbacks
  (file pickers instead of native dialogs; export stub reports no shell).
- **Windows .exe:** built by GitHub Actions
  (`.github/workflows/build-windows.yml`) on a `windows-latest` runner —
  NSIS installer + portable build via electron-builder, uploaded as a
  workflow artifact; version tags also attach it to a GitHub Release.
  The .exe is NOT built in the dev VM and NOT claimed tested until a real
  Actions run + Paul's install say so.
- **Export engine:** FFmpeg, spawned by the main process. Phase 4 bundles
  the binary via `ffmpeg-static` (asarUnpack) with a system-ffmpeg fallback.
  Phase 1 ships the full argument-plan builder (`js/export.js`) and a stub
  handler that returns the plan instead of rendering — honestly labelled
  in the UI.

---

## Phases

Each phase ends with a **Paul review gate**: Pepper demos what works, Paul
says ship / fix / rethink, and the outcome is recorded (see "How reviews are
recorded") before the next phase starts.

### Phase 0 — Skeleton *(delivered 2026-11-04; review superseded by the pivot)*
- Static web app, project model, canvas preview of a sample woven-stills
  sequence, stub panels. Paul pivoted the project to a Windows desktop app
  before the formal gate; the skeleton's model, preview, and panel
  interfaces carry forward into Phase 1.

### Phase 1 — Windows desktop + drag-and-drop timeline *(this build)*
- Electron shell (main + preload bridge, custom app:// protocol, native
  file dialogs, sandboxed renderer). electron-builder targets Windows
  (NSIS installer + portable); GitHub Actions workflow builds the .exe.
- **Timeline editor (the centrepiece):** drop video/image/audio files from
  the OS onto lanes; clips appear as blocks with icon, filename, and real
  probed duration; drag blocks to REORDER the main track; click to select;
  Delete key / ✕ button removes; click empty track to seek the preview.
- **Inspector controls (working):** duration, trim (skip-from-start),
  per-clip **fade-in / fade-out** (defaults 0 — Paul's rule is the default),
  transition-in **Cut / Crossfade** with adjustable crossfade length, and
  **Split at Playhead**.
- **Picture-in-picture overlay lane:** blocks placed by start time over the
  main track; corner choice (4) + size slider + start/duration in the
  inspector — all working UI; the preview composites the overlay window at
  the chosen corner/size. Full video compositing lands in the export graph
  (Phase 4, FFmpeg `overlay` filter — the argument builder already emits it).
- **Captions (basic):** Add Caption at the playhead; select on the lane;
  edit words + timing in the inspector. Music bed: set by drop or dialog;
  volume in the inspector (playback sync is Phase 3).
- **Icons + labels + tooltips pass** across the whole GUI (design rule 4).
- Export panel shows the real FFmpeg plan; the export handler is a labelled
  stub that returns the plan (no binary bundled yet).
- **Review gate:** the first GitHub Actions Windows build runs; Paul
  installs the .exe, drags his own clips in, reorders, splits, trims, adds
  a caption and a PiP overlay, and judges the GUI's robustness and whether
  every button explains itself.

### Phase 1b — Professional upgrade batch *(built 2026-11-05, Paul's direction)*
- Paul authorized a research-and-build session (Nov 5, while he was out):
  study Premiere Pro / DaVinci Resolve / Final Cut Pro / CapCut Desktop,
  then bring WovenCut toward professional feel without asking permission.
  Research + gap analysis: `docs/PRO-RESEARCH-2026-11-05.md` (+ the two
  sourced research files in `docs/`).
- **Undo / Redo for everything** — snapshot history, 80 steps
  (`js/history.js`); toolbar buttons + Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y.
- **Timeline zoom** — Zoom Out / Zoom In / Fit Whole Video + % readout;
  `+`/`-` keys. **Snapping (magnet)** — toggle button (ON by default) +
  `N` key; playhead and dragged blocks stick to clip / caption / layer /
  marker edges; Alt while dragging = free placement.
- **Drag-to-retime** — layer, background and caption blocks drag to
  change start time (this delivers the Phase 2 caption-drag item early);
  locked pairs stay exempt (they follow their clip).
- **Timecode** — HH:MM:SS:FF readout at the project fps; adaptive ruler
  ticks labelled MM:SS with minor ticks; click ruler to seek.
- **Markers** — 🚩 Add Marker button + `M` key; flags on the ruler;
  click to jump; name/time/delete in the inspector; saved in the file.
- **Shortcuts + help panel** — J/K/L shuttle (to ±4×, speed shown),
  ←/→ 1 s (Shift 5 s), , / . one frame, Home/End, S split (selected
  clip, else clip under playhead), M, N, +/−, Delete, Ctrl+S/O. Keys go
  inert while typing in a field.
- **Audio waveforms** — real peaks decoded locally (Web Audio) for
  imported clips and the music bed, drawn in the blocks, stored in the
  project file; never a fake wave. Desktop file bytes come via a new
  read-only IPC (`file:readBytes`, user-picked paths only).
- **Project settings** — frame shape presets (1080p, 720p, vertical
  9:16, square 1:1, custom) + fps 24/25/30/50/60; preview canvas matches
  the frame; model v3 gains `settings` / `markers` / `exportPreset`
  with migration defaults for v1/v2 files.
- **Export presets** — YouTube 1080p, YouTube 4K, Vertical, Square, Use
  project settings; wired into the FFmpeg planner (scale + fps in the
  args). Rendering stays the Phase 4 stub; every preset restates the
  first-frame rule.
- **Polish pass** — taller labelled ruler, gold focus outlines, themed
  scrollbars, unified panel headers. Big type / big targets unchanged.
- **Verified:** node --check on all JS; unit tests (timecode, history,
  presets, migrations, split/marker — caught and fixed one v2-migration
  bug); headless-Chromium CDP interaction tests (zoom, inspectors,
  marker add/undo, delete undo/redo, snap toggle, split fallback,
  real-waveform drop) all pass; screenshots in `~/workspace/your_files/`
  (`wovencut-pro-*.png`). The .exe is still unbuilt (Linux VM) — the
  Phase 1 gate (first Actions build + Paul's install) is unchanged.
- **Next from the gap analysis:** auto-save + recovery vault; SRT
  import/export; loudness −14 LUFS (with Phase 4); music ducking;
  ~12-type transitions menu; ripple trim Q/W; per-lane Lock/Hide/Mute.

### Phase 2 — Captions, full editor
- ~~Drag captions to retime on the lane~~ *(delivered early in Phase 1b)*;
  per-segment caption timing; save/load polish (ffprobe-accurate
  durations for dialog-imported clips).
- **Review gate:** Paul captions one full story sequence himself.

### Phase 3 — Music
- Music playback synced with the preview; trim/fade-out controls; volume.
- Fade-**out** at the end is unrestricted. (The music-bed fade-IN question
  from Phase 0 is answered by the refined rule 1: fades are tools with
  Paul's defaults — the bed defaults to no fade-in under segment one.)
- **Review gate:** Paul scores one sequence end to end.

### Phase 4 — Real export (FFmpeg)
- Bundle ffmpeg-static; spawn it from the main process with the argument
  plan from `js/export.js`; progress + cancel; validate xfade stream prep,
  PiP `overlay` compositing with real video, caption burn-in identical to
  preview styling, music mix. Export honours every clip's fade numbers —
  and, by default, the first clip emits no fade filter (Paul's rule).
- **Review gate:** Paul exports a real long-form video and posts it; the
  open-on-black check is part of acceptance.
- **Status (2026-11-05, pro pass 2):** the renderer is BUILT and proven
  headlessly — `js/render.js` builds a runnable graph (scenes split at
  cuts; xfade/acrossfade within; concat between; fades; music mix +
  sidechain ducking; loudnorm; caption burn-in via generated SRT), the
  main process spawns bundled ffmpeg-static (asarUnpack) with a system
  fallback, with progress + cancel. An integration test rendered real
  generated media under BOTH ffmpeg builds: exact expected duration,
  −13.7 LUFS measured against the −14 target, and black detected ONLY
  at a deliberate dip-to-black — never at the open. Render v1 limits
  (warned in-app, never silent): layer/background lanes and green-screen
  keying are not composited yet; rendered length is shorter than the
  timeline by the sum of transition durations (no clip handles yet).
  The review gate above still stands: it completes when Paul exports a
  real video from the packaged app.

### Phase 5 — Replicate segues
- Per-cut "generate segue" action (✨ AI Segue): sends tail/head frames of
  neighbouring segments to Replicate with the user's own token; the
  returned clip drops into the timeline flagged `generated: true`.
- Cost displayed BEFORE every generation. No silent spend.
- **Review gate:** Paul generates one segue on his own Replicate credit and
  judges whether it earns its cost.

### Phase 6 — Muse co-editor panel
- Chat panel wired to the user's own Muse access: suggest caption
  wording, sequence order, segue prompts; nothing applies without the user
  accepting it (human-reviewed — Paul's model).
- **Review gate:** Paul runs a full edit session with the panel live.

### Phase 7 — Overlay tracking, manual first *(advanced — Paul, Nov 4 2026)*
Two creator features that share one engine: an overlay or a mask that
FOLLOWS something in the frame.
- **(a) Shirt logo overlay:** place the user's own logo onto a plain
  t-shirt in the video so it follows the wearer as they move. FIRST
  VERSION: manual keyframing — the user positions the logo, sets a few
  keyframes along the clip, and the app interpolates position/scale/
  rotation (and corner-pin skew) between them. This is honest, buildable,
  and genuinely useful.
- **(b) Trademark obscuring:** blur/pixelate regions the user draws over
  trademarked or copyrighted logos in a frame, so creators don't have to
  worry about infringement claims. FIRST VERSION: manual blur regions with
  the same keyframed tracking as (a).
  **Honesty note, binding for UI copy:** blurring is a creator convenience,
  NOT a legal guarantee. The app must never promise that obscuring a mark
  eliminates legal risk; copy says what the tool does (hides the mark),
  never what a court would say.
- Both controls follow design rule 4 (icon + plain label + tooltip).
- **Review gate:** Paul keyframes a logo onto a moving shirt clip and a
  blur over a brand mark, and judges whether the manual workflow is
  tolerable.

### Phase 8 — Assisted tracking *(research-grade — later, maybe much later)*
- Assisted auto-tracking for Phase 7's overlays/masks (point the app at a
  logo/shirt region and let it follow), and detection SUGGESTIONS for
  trademark-like regions. Honest scoping: this is motion/plane tracking —
  real computer vision, the hardest thing on this roadmap. It is phased
  last on purpose, may ship as "good on easy shots only," and is never a
  release blocker for the free editor.
- **Review gate:** Paul tests auto-tracking on one easy, well-lit clip.

### Phase 9 — GitHub freeware release + instructional video
- Public repo on **Paul's GitHub account**; Windows installer + portable
  from the Actions workflow attached to a GitHub Release.
- **Open question for Paul — license:** MIT (anyone can use/fork, including
  commercially) vs GPL (forks must stay open/free — arguably closer to the
  "truly free forever" spirit). **Paul decides; do not default this for him.**
- Release checklist: README with the freeware philosophy, token-safety
  notes, first-frame rule documented as a feature, sample project included.
- **Instructional video (planned deliverable, ships with the release):**
  a how-to video made in Paul's own woven-stills style — captioned stills
  woven into a story, first frame at full strength — recorded once there is
  a real Windows build to show. Outline:
  1. Install (download the .exe from GitHub, run the installer)
  2. Drop clips onto the timeline
  3. Arrange — drag to reorder, split, trim, fades & crossfades
  4. Captions — add and word them
  5. Music — drop a bed, set the volume
  6. Export — MP4 for YouTube, and the first-frame rule as a feature
  7. Optional: your own Muse co-editor + Replicate segues (your keys,
     your cost, your call)
  Posted to Paul's YouTube and linked from the repo README.

---

## How reviews are recorded

- Every phase gate gets an entry appended to this file under "Review log"
  with: date, phase, what Paul saw, his verdict (ship / fix / rethink), and
  any rule or direction he set.
- Code changes land as git commits in the Code Vault with messages naming
  the phase (`Phase 1: Windows desktop + drag-and-drop timeline`).
- Per Paul's Code Vault rule, commits here are also mirrored to Drive
  (Pepper > Code Vault), same as the games and VoiceBridge.
- If a phase is rethought, the old plan stays in the log — the record of how
  the tool evolved is part of the experiment.

## Review log

- **2026-11-04 — Phase 0 skeleton delivered for review.** Static skeleton,
  sample woven-stills preview, all AI/export paths stubbed. (Superseded the
  same evening by Paul's pivot to a Windows desktop app — see below.)
- **2026-11-04, ~7:30–7:33 PM — Paul's pivot + feature directions (chat and
  voice call).** Windows desktop first (phone question closed);
  drag-and-drop timeline as the core for long-form YouTube videos; robust
  GUI; icons + plain labels + tooltips everywhere ("If a first-time user
  can't guess what a button does, the button is wrong"); fades/crossfades
  as standard tools with Paul's first-frame rule kept as the app DEFAULT
  (first clip fade-in = 0); picture-in-picture overlay lane; instructional
  video planned for the release, in Paul's woven-stills style; shirt-logo
  overlay and trademark obscuring recorded as advanced later phases
  (manual keyframing first, assisted tracking last, no legal guarantees
  promised for blurring).
- **2026-11-04 — Phase 1 build delivered for review.** Electron Windows
  app: drag-and-drop timeline with overlay/captions/music lanes, reorder,
  split, trim, fades/crossfades, PiP controls, inspector, icon+label+
  tooltip pass, FFmpeg export as a labelled plan-stub, GitHub Actions
  Windows build workflow. NOT yet run: the Electron GUI and the .exe build
  have not been executed anywhere; the first Actions run + Paul's install
  are part of this phase's gate. Awaiting Paul's review.
- **2026-11-05 — Phase 1b professional upgrade batch delivered for
  review.** Research on Premiere Pro / DaVinci Resolve / Final Cut Pro /
  CapCut Desktop (two sourced research docs + gap analysis in `docs/`),
  then built same day: undo/redo for everything, timeline zoom + fit,
  snapping (on by default), drag-to-retime for positioned blocks and
  captions, HH:MM:SS:FF timecode + adaptive ruler, markers, JKL shuttle
  + full shortcut set with an on-screen help panel, real decoded audio
  waveforms, project settings (frame shape + fps), export presets wired
  to the planner, and a dark-UI polish pass. All locked rules held:
  first-frame default intact (asserted in tests), icons+words+tooltips
  on every new control, no watermark/locks/nags, beta label kept, terms
  gate and donation plumbing untouched, export rendering still an
  honest Phase 4 stub. Verified with node --check, unit tests, and
  headless-Chromium interaction tests + screenshots. NOT yet run: the
  .exe build (awaits the first GitHub Actions run on Paul's future
  repo) and Paul's hands-on review — same gate as Phase 1.
- **2026-11-05 — Pro pass 2 legal audit + capability matrix (same
  session, Paul's added direction).** Audited Terms v2 end-to-end and
  found the acceptance gate and About/Donate were design-only — Paul's
  Nov 4 hard requirement had never been coded. Built both to the
  existing spec (no redesign): 11-screen scrollwrap gate with §15
  alone on Screen 10, acceptance record (version + text fingerprint +
  timestamp + per-screen set, local only), re-run on version or text
  change, Decline closing the app via the main process, reading-copy
  view mode; About at the right of the menu bar with the quiet Donate
  section; Beta added to window/document titles; `assets/**` added to
  the packaged files (the donate QR was excluded); NSIS license page
  generated from the operative text. Two documentation corrections
  inside the Terms draft, both tagged for Paul's approval; NO
  operative wording changed. Deliverables:
  `docs/LEGAL-FRAMEWORK-CHECKLIST-2026-11-05.md` (preparation, not
  legal advice — [CONTACT] is the one hard release blocker) and
  `docs/CAPABILITY-MATRIX-2026-11-05.md`. Verified: node suites green;
  headless-Chromium wheel-walk of all 11 screens + record/reload/
  tamper/decline/view-mode/About checks, zero page errors.
- **2026-11-05 — Pro pass 2 delivered for review (Paul's ~2.5-hour
  gauge session).** Built, in work-list order: (1) auto-save with crash
  recovery + snapshots/version history; (2) SRT caption import AND
  export; (3) −14 LUFS loudness toggle wired into plan + render;
  (4) music auto-ducking (real decoded peaks drive the model, the
  timeline draws the dip curve, render uses sidechain compression);
  (5) transitions menu — cut, crossfade, dip to black, dip to white,
  wipe, slide — through model + preview + planner + render; (6) Phase 4
  real rendering (see the Phase 4 status note above); then from the gap
  doc's next tier: (7) ripple trim Q/W; (8) per-lane Hide/Mute track
  headers honoured by preview and render. Every item exercised in the
  real UI headlessly (CDP + pixel checks) and/or by the repo test
  suites (`tests/node-tests.mjs`, `tests/render-test.mjs`); the dip
  gradient and the rendered black placement were verified numerically.
  All locked rules held: first clip fade-in = 0 (asserted in tests AND
  measured in the rendered file), beta labels kept, terms gate and
  donation plumbing untouched, nothing removed. Full log:
  `~/workspace/your_files/wovencut-pro-pass-2-log.md`. Still NOT run:
  the Electron GUI and the .exe (same Phase 1 gate). Drive mirror of
  the Code Vault still owed (batched; not part of this session).
