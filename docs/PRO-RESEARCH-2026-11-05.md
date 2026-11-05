# WovenCut — Pro Research & Gap Analysis (Nov 5, 2026)

Commissioned by Paul (Nov 5, 2026): study what professional video editors
look like and do, measure WovenCut against them, and build the
highest-value upgrades the same day. Full sourced research lives in the
two companion docs; this file is the synthesis + gap analysis + the
record of what the build batch shipped.

- `docs/research-pro-ui-timeline.md` — layout & timeline behaviour across
  Adobe Premiere Pro, DaVinci Resolve (Edit), Final Cut Pro, CapCut
  Desktop (335 lines, sourced).
- `docs/research-pro-features.md` — feature sets across the same four,
  plus the free-competitor baseline (CapCut, Clipchamp, Shotcut,
  Kdenlive, OpenShot) (225 lines, sourced).

## What the pros converge on (the pattern that matters)

1. **One skeleton everywhere:** media/clips zone, one preview monitor,
   an inspector/settings zone, the timeline along the bottom, export one
   click away. Beginner tools keep exactly one fixed layout (CapCut,
   FCP); docking/workspaces are pro-only complexity.
2. **Defaults are the product:** snapping ON, linked audio/video ON,
   main track gapless ("magnetic"), waveforms ON, auto-save ON. The
   beginner-safe state is the shipped state.
3. **Every action exists three ways:** a big labelled button, a drag
   gesture, and the pro keyboard shortcut. Tutorials teach the keys —
   matching the pro key map makes tutorials transferable.
4. **The timeline furniture of a "real" editor:** zoom (slider + fit),
   timecode ruler, markers, clip waveforms + thumbnails, track headers
   with lock/hide/mute, a live audio meter by the preview.
5. **Numbers hidden, decisions kept:** fps/LUFS/bitrate are auto-matched
   or buried in presets; resolution is presented as a shape (wide /
   tall / square) + a size word, not pixels, at the top level.
6. **Finishing is a feature:** loudness normalisation to −14 LUFS
   (YouTube/TikTok), music ducking under speech, caption sidecar (SRT)
   vs burn-in choice, export presets per platform, an export queue.

## Gap analysis — where WovenCut stood on Nov 5, morning

WovenCut already had: the layered timeline (background / main / stackable
layers / captions / music), drag-and-drop incl. folders, reorder, split,
trim, fades/crossfades, PiP, locked reaction pairs, the webcam reaction
recorder, upload kits with automatic creator credit, the terms gate, and
the FFmpeg export *planner* (rendering itself is Phase 4 — still a
labelled stub, unchanged by this batch).

Against the pro pattern it was missing, in rough priority order:

| Gap | Pro precedent | Status after this batch |
|---|---|---|
| Undo/redo for everything | All four (history panels) | ✅ **Built** — snapshot history (80 steps), toolbar buttons + Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y |
| Timeline zoom + fit | All four | ✅ **Built** — Zoom In/Out/Fit buttons, % readout, +/− keys |
| Snapping (magnet) | All four (S/N keys) | ✅ **Built** — ON by default; playhead + dragged blocks stick to clip/caption/layer/marker edges; big toggle button + N key; Alt while dragging = free |
| Timecode ruler | All four | ✅ **Built** — HH:MM:SS:FF readout at project fps, ruler ticks labelled MM:SS with minor ticks, adaptive interval by zoom |
| Markers | All four (M key) | ✅ **Built** — 🚩 flags on the ruler, Add Marker button + M key, name/time editing + jump in the inspector |
| Drag blocks to retime | All four | ✅ **Built** — layer, background and caption blocks drag left/right (captions keep their length); locked pairs exempt (they follow their clip) |
| JKL shuttle transport | Premiere/Resolve/FCP | ✅ **Built** — J plays backward (repeat = faster, to −4×), K stops, L forward (to 4×); works because preview frames are procedural; speed shown beside the timecode |
| Frame stepping, Home/End | All four | ✅ **Built** — , / . step one frame at project fps; ←/→ 1 s (Shift = 5 s) |
| Shortcut system + help | Premiere map; CapCut cheat sheets | ✅ **Built** — ⌨️ Shortcuts panel + toolbar button; split also falls back to the clip under the playhead (razor behaviour) |
| Audio waveforms in clips | All four | ✅ **Built** — real peaks decoded locally (Web Audio) for dropped/imported clips + the music bed; stored in the project file; never a fake wave — unreadable/silent files show none |
| Project settings (frame + fps) | Sequence settings / CapCut ratio tiles | ✅ **Built** — ⚙️ Project Settings panel: shape presets (wide 16:9, 720p, vertical 9:16, square 1:1, custom), fps 24/25/30/50/60; preview canvas reshapes; timecode + export plan follow |
| Export presets | Premiere/Resolve preset menus | ✅ **Built** — YouTube 1080p, YouTube 4K, Vertical, Square, Use-project-settings; wired into the FFmpeg planner (scale + fps in the args). Rendering remains the Phase 4 stub — a preset changes the *plan*, honestly labelled |
| Auto-save + recovery vault | FCP/CapCut/Resolve Live Save | ⬜ Next tier — recommended next build (cheap: projects are small JSON) |
| SRT import/export; burn-in vs sidecar at export | All four | ⬜ Next tier — top-ranked in the features research (V×F 25) |
| Loudness −14 LUFS normalise + report | CapCut/Premiere/FCP | ⬜ Next tier — lands with real rendering (Phase 4), `loudnorm` in the plan |
| Music ducking under speech | Essential Sound / CapCut | ⬜ Next tier — export-side (Phase 4) or generated volume points |
| Transitions library (~12 curated xfade types) | All four | ⬜ Next tier — planner already names xfade boundaries; UI menu is the work |
| Ripple trim to playhead (Q/W) | Premiere + CapCut | ⬜ Next tier — small; main track is already gapless so this is pure trim |
| Track headers: Lock / Hide / Mute | CapCut header model | ⬜ Next tier — needs per-lane state in the model + preview/export honouring it |
| Volume line / keyframes on clips | Rubber bands in all four | ⬜ Later — first keyframe engine; also powers PiP animation + Phase 7 keyframing |
| Live audio meter by the preview | All four | ⬜ Later — meaningful once preview plays real media audio (Phase 3) |
| Colour basics + looks/LUTs | All four | ⬜ Later — preview via CSS-filter approximation, export is truth |
| Speed controls / freeze / reverse | All four | ⬜ Later — export-side `setpts` work (Phase 4+) |
| Proxies for big media | Resolve/Shotcut/Kdenlive | ⬜ Later — matters once real-media preview lands |
| Auto-captions via user's own key | CapCut baseline expectation | ⬜ Later — fits the BYO-key architecture (Phase 5/6 pattern) |
| Scopes, mixer panel, source monitor, multicam, node grading | Pro identity features | ⛔ Explicitly out of scope — research says beginner value ≈ 0 |

## Rules check for everything built in this batch

- **First-frame rule:** untouched and re-verified — a new project's
  first clip still defaults to fade-in 0; no export preset adds a fade
  or a black lead-in (the preset UI says so in plain words; a node test
  asserts the plan text for all five presets).
- **Icons + words + tooltips:** every new control (Undo, Redo, Add
  Marker, Shortcuts, Zoom In/Out/Fit, Snapping, preset select, settings
  fields) carries an icon, a plain-words label, and a tooltip.
- **Undo on everything:** the charter item is now literally true for
  project edits (selection/playhead excluded, like the pros).
- **Free means free:** no watermarks, no locks, no nags — nothing in
  this batch changes that; waveforms/settings/presets are all core.
- **Beta label:** unchanged everywhere it already stood; the footer now
  also says "Beta build".
- **Terms gate + donation plumbing:** untouched, per instructions.
- **Honesty:** export still renders nothing and says so; waveforms are
  real decodes or absent; the preview remains placeholder frames and is
  labelled as such in the inspector.

## Verification (Nov 5, 2026)

- `node --check` passes on every JS file.
- Node unit tests (model/history/export/timeline helpers): timecode
  formatting, history round-trips, preset resolution into the FFmpeg
  args, v1/v2 migration defaults, split + marker removal — all pass.
  (The tests caught one real bug: the v2→v3 migration missed the new
  settings/markers defaults; fixed.)
- Headless-Chromium runs of the real UI (CDP-driven): zoom
  100% → 274% → Fit 416%; clip + marker inspectors open with correct
  values (clip fade-in reads 0); M adds a marker and Ctrl+Z removes it;
  Delete + Ctrl+Z + Ctrl+Shift+Z round-trip a clip delete; N toggles
  snapping; S splits the clip under the playhead; a generated WAV
  dropped on the music lane renders a real waveform in the block.
- Screenshots: `~/workspace/your_files/wovencut-pro-top.png`,
  `wovencut-pro-full.png`, `wovencut-pro-inspector.png`,
  `wovencut-pro-waveform.png`.

## Honest limits

- The Electron `.exe` still has never been built: this VM is Linux, and
  the first real build remains the future GitHub Actions run on Paul's
  repo (not yet created — Paul's step). Everything above is verified in
  the renderer (the same UI the .exe will host), not in the packaged app.
- Real-media preview (actual video frames, thumbnails, music playback)
  is still Phases 2–3 scope; this batch's waveforms are audio-true but
  the picture remains labelled placeholder frames.

---

# Addendum — pro pass 2 (later the same day, 2026-11-05)

Paul authorized a ~2.5-hour follow-on session against this document's
rankings. Everything in the "Build next (ranked)" list above is now
BUILT and verified:

1. ✅ Auto-save + crash recovery + snapshots (12-deep version history).
2. ✅ SRT import AND export (plus burn-in vs sidecar choice at export).
3. ✅ Loudness toggle (−14 LUFS) — plan AND real render (loudnorm).
4. ✅ Music auto-ducking — model from real decoded peaks, dip curve on
   the timeline, sidechain compression in the render.
5. ✅ Transitions menu — cut, crossfade, dip to black, dip to white,
   wipe left, slide left; model + preview + planner + render.

Plus three items pulled forward: **Phase 4 real rendering itself**
(the render this list assumed was still stubbed — see WORKFLOW.md's
Phase 4 status note for the measured verification), **ripple trim
Q/W**, and **per-lane Hide/Mute** from the "Still missing" list.

### Updated "still missing" ranking after pass 2

1. **Real media decode in preview / Phase 3** — still the biggest
   experiential gap: preview draws labelled placeholders. Everything
   else now assumes it.
2. **Render compositing for layers/background/green-screen** — the
   model, preview, and planner all support them; render v1 warns and
   skips. This is now the top render gap (overlay filter + chromakey).
3. **Clip handles for transitions** — rendered length currently shrinks
   by the transition durations; pros eat handles instead.
4. **Audio keyframes / volume line** — ducking covers the common case;
   a drawn volume line is the next audio step.
5. **Live audio meter** — needs Phase 3's real audio path.
6. **Colour basics** (brightness/contrast/saturation) — CSS-filter
   preview + eq/curves in render; cheap once render compositing lands.
7. **Speed controls** — setpts/atempo in render; preview approximation.
8. Lock lane toggle (hide/mute landed; lock is the third header state).
