# WovenCut — Research: Pro Editor UI Layout & Timeline Behaviour

Scope: Adobe Premiere Pro, DaVinci Resolve (Edit page), Final Cut Pro (FCP), CapCut Desktop.
Purpose: ground WovenCut (free, Electron, beginner-first: big type, big targets, icon + plain-word labels) in what pro tools actually do, where the control lives, and what to keep / hide / simplify.
Sources are cited inline as URLs. Where a claim rests on a secondary guide rather than vendor docs, that is noted.

Date of research: 2026-11-05.

---

## 1. Overall Window Layout

### 1.1 The shared pattern — all four converge on the same skeleton

| Zone | Premiere Pro | Resolve Edit | Final Cut Pro | CapCut Desktop |
|---|---|---|---|---|
| Media / bins — top- or bottom-left | Project panel (all imported assets, bins, sequences) + Media Browser for browsing disk | Media Pool (upper-left on Edit page; bins) | Libraries sidebar (far left) + Browser (Events, filmstrip or list, keyword / Favourite / Rejected ranges) | Media panel (top-left) with tabs: Media, Audio, Text, Stickers, Effects, Transitions, Filters, Adjustments |
| Preview of a single clip | Source Monitor (top-centre/left) | Source Viewer (left viewer) | Event Viewer (optional second viewer) / Browser skimming | No separate source monitor — preview in the single Player |
| Preview of the edit | Program Monitor (top-right/centre) — shows frame under Timeline playhead, upper tracks in front of lower | Timeline Viewer (right viewer) | Viewer (centre) — timeline or Browser clip | Player / Preview (top-centre) — frame under playhead, ratio selector lives here |
| Timeline | Bottom, full width | Bottom, full width | Bottom, full width | Bottom, full width |
| Properties for selected clip | Effect Controls panel + Essential Graphics / Essential Sound panels | Inspector (top-right, toggleable) — Transform, Cropping, Audio, Effects per clip | Inspector (right) — Video / Audio / Info tabs | Properties / Inspector (top-right) — context-sensitive: clip = Video/Audio/Speed/Animation; nothing selected = project details |
| Effects / titles library | Effects panel (separate from Effect Controls) | Effects Library (top-left, shares space with Media Pool / Edit Index) | Effects + Titles/Generators browsers (right-side browsers) | Same top-left panel as Media, as tabs |
| Mixing / scopes | Audio Track Mixer, Audio Clip Mixer, Lumetri Scopes panel | Mixer panel (Edit page, toggleable); full Fairlight page for mixing; Scopes on Color page | Audio meters in toolbar; no mixer page — mix via Roles + Audio Inspector | No mixer panel; per-clip volume in Properties |

Sources: Premiere's four main panels are Project, Source Monitor, Program Monitor and Timeline, and double-clicking a Project clip loads it in the Source Monitor — https://www.adobe.com/learn/premiere-pro/web/get-started-premiere-pro ; Resolve Edit page has Media Pool upper-left, Source Viewer left, Timeline Viewer right, Inspector top-right, Effects Library top-left, Timeline bottom half — https://2pop.calarts.edu/technicalsupport/davinci-resolve-interface/ and https://documents.blackmagicdesign.com/UserManuals/DaVinci_Resolve_15_Reference_Manual.pdf ; FCP interface is Event Browser (replacing bins), Magnetic Timeline, Viewer, Inspector — https://en.wikipedia.org/wiki/Final_Cut_Pro ; CapCut Desktop is four areas — Media top-left, Player top-centre, Inspector top-right (context-sensitive, project details when nothing is selected), Timeline bottom, Export top-right corner — https://www.scientificdev.net/courses/capcut-from-basics-to-professional/capcut-interface-and-project-settings/

### 1.2 How pros rearrange it — workspaces / pages, not one fixed layout

- **Premiere — Workspaces (top bar):** pre-built panel arrangements per job: Assembly (large Project panel for organising / string-outs), Editing (default), Color (Lumetri panels), Effects (Effects + Effect Controls), Audio (mixers / Essential Sound), Titles/Graphics. Panels can be docked, floated, resized, saved as a custom workspace. Source: https://www.adobe.com/learn/premiere-pro/web/get-started-premiere-pro
- **Resolve — Pages (bottom icon bar, left-to-right = workflow order):** Media → Cut → Edit → Fusion → Color → Fairlight → Deliver. Each page is a different room with its own layout; the Edit page is not customisable to the degree Premiere is. The Cut page is the deliberate simplification: single viewer, Media Pool, and a dual timeline (upper = whole edit always visible, lower = zoomed detail around playhead) plus a Source Tape view that strings all pool clips into one strip for fast browsing. Source: https://2pop.calarts.edu/technicalsupport/davinci-resolve-interface/ ; Cut page dual timeline / Source Tape — https://usermanual.com/support/blackmagicdesign/web-manual/video-assist/using-davinci-resolve
- **FCP — one window, show/hide zones:** Libraries sidebar, Browser, Viewer, Timeline, Inspector are toggled from the toolbar / View menu; dedicated Workspace layouts (Default, Organize, Color & Effects, Dual Displays) exist but rearrangement is limited compared with Premiere. Secondary display can carry Browser or Viewer.
- **CapCut — essentially fixed:** one layout, plus alternate layouts oriented to vertical video. Panels do not dock/float. This is closest to what a beginner product can ship.

### 1.3 What beginner editors keep vs hide

- **Keep (all four, always visible by default):** media list, one preview, timeline, properties for the selected clip, Export button.
- **Collapse into tabs / a second panel (CapCut model):** effects, transitions, text, stickers, stock audio all live as tabs inside the media panel instead of separate docked panels.
- **Drop the dual-monitor model (CapCut does):** no Source Monitor. Clicking a media clip previews it in the single Player; drag either the whole clip or an In/Out-trimmed range to the timeline. FCP reaches a similar place differently: skimming in the Browser + one Viewer, no formal Source Monitor.
- **Hide by default, reveal on demand (pro pattern):** Inspector (Resolve, FCP both toggle it), scopes, mixer, markers list / Edit Index, metadata. Premiere equivalents are closed panels inside a workspace.
- **Consequence for layout:** pros assume (a) media left, (b) preview centre-top, (c) properties right, (d) timeline bottom, (e) primary action (Export/Deliver/Share) top-right or as a final stage. Deviating from that geography costs learnability for no gain.

---

## 2. Timeline Behaviour

### 2.1 Zoom

| Editor | Zoom control location | Keyboard / mouse | Zoom-to-fit |
|---|---|---|---|
| Premiere | Zoom bar / scroll bar at bottom of Timeline panel; drag its ends | `+` / `-` (or `=` / `-`), Zoom tool `Z`, mouse-wheel over track header changes track height not zoom | `\` = Zoom to Sequence; `Shift+\` = zoom to playhead region |
| Resolve Edit | Zoom slider in Timeline toolbar (right side) + Timeline View Options | `-` / `=`, Alt/Cmd + scroll, `Shift+Z` full extent | `Shift+Z` = Full Extent Zoom; Detail Zoom zooms to playhead at frame level; Custom Zoom returns to slider value |
| FCP | Zoom slider bottom-right of Timeline; Clip Appearance pop-over beside it | `Cmd+` / `Cmd-`, Zoom tool `Z` (click / drag a marquee, Option-click zooms out) | `Shift+Z` = Zoom to Fit |
| CapCut | Zoom slider top-right of Timeline panel + `+`/`-` buttons | `Ctrl/Cmd + +` / `-`, `Ctrl/Cmd` + mouse wheel | `Shift+Z` = Fit timeline to window |

Sources: Premiere zoom keys / tools summary — https://thefoxclick.com/the-ultimate-adobe-premiere-pro-cheatsheet-streamline-your-video-editing-workflow/ ; Resolve Full Extent / Detail / Custom Zoom and Zoom slider in toolbar — https://www.manualpdf.in/blackmagic-design/davinci-resolve-mini-panel/manual?p=527 ; FCP Zoom tool, Clip Appearance and `Shift-Z` — https://www.yumpu.com/en/document/view/55991505/apple-final-cut-pro-x-1009-user-guide-final-cut-pro-x-1009-user-guide/141 ; CapCut `Ctrl+=/-`, `Ctrl+wheel`, `Shift+Z` Fit — https://editlogic.io/capcut-keyboard-shortcuts-pc/

Invariant: every editor has (1) a visible slider/buttons, (2) a keyboard zoom, (3) a one-key/button "fit whole video". No editor relies on pinch/scroll alone.

### 2.2 Playhead, time ruler, timecode

- **Ruler on top of the timeline** in all four: timecode / time increments relabel as you zoom (frames → seconds → minutes). Clicking the ruler moves the playhead; dragging in the ruler scrubs.
- **Playhead:** Premiere — blue playhead + vertical line through all tracks, timecode field top-left of Timeline and in Program Monitor, editable by typing a timecode. Resolve — red playhead line, timecode display top of Timeline Viewer, type-to-jump. FCP — playhead is subordinate to the **skimmer** (a second, hover-driven position indicator); edits happen at the skimmer if active, otherwise the playhead. CapCut — white/red playhead line with a draggable handle in the ruler; time display `current / total duration` above the timeline left.
- **Playback following:** Premiere Preferences > Timeline > Timeline Playback Scrolling = No Scroll / Page Scroll / Smooth Scroll (separate setting from snapping). Resolve and FCP page/smooth-scroll similarly; CapCut keeps the playhead centred once it leaves the view in preview-axis mode.
- **Frame stepping:** Left/Right arrows = ±1 frame everywhere; `Shift+` arrows = multi-frame (Premiere/Resolve: 5 or 10 frames, configurable). Up/Down arrows = previous / next edit point (Premiere, Resolve, FCP).

### 2.3 Snapping / magnetism — three different ideas that are often conflated

1. **Edge snapping (all four, toggleable):** while dragging a clip, trim edge, playhead or marker, it "sticks" to nearby clip edges, markers, and the playhead; a vertical guide line flashes at the snap.
   - Premiere: **Snap in Timeline toggle, Timeline panel header (magnet icon), key `S`, on by default.** Snaps to other clips, markers, playhead. https://helpx.adobe.com/premiere/desktop/edit-projects/change-clip-sequence/snap-clips.html
   - Resolve: **Snapping toggle in Edit toolbar (magnet icon), key `N`** — clip In/Out points, markers and playhead snap to each other; pressing `N` mid-drag temporarily flips the state for that drag only. https://www.manualpdf.in/blackmagic-design/davinci-resolve-mini-panel/manual?p=527 and https://www.manual.com.ve/blackmagic-design/davinci-resolve/manual?p=476
   - FCP: **Snapping toggle, key `N`** — skimmer/playhead/clips snap to clip boundaries, playhead, skimmer, markers, keyframes, range selections; snapped playhead turns yellow. (Secondary source summary of Apple guide.)
   - CapCut: **Auto Snapping toggle in Timeline toolbar, key `N`** — dragged/trimmed clip jumps to playhead, marker, or another clip's edge, with a blue vertical line shown. https://editlogic.io/capcut-keyboard-shortcuts-pc/
2. **Magnetic / ripple-by-default main track (FCP, CapCut):**
   - FCP **Magnetic Timeline**: the Primary Storyline has no gaps and no collisions — deleting a clip closes the gap, moving a clip pushes neighbours aside or swaps, connected clips (B-roll, titles, audio) ride along via Clip Connections. The **Position tool (`P`)** opts out, leaving gaps like a track-based editor. https://en.wikipedia.org/wiki/Final_Cut_Pro
   - CapCut **Main Track Magnet, key `P`, on by default:** first video track stays packed — delete/trim/add ripples the rest of that track; dragging a clip past the midpoint of a neighbour reorders them. Other tracks are not magnetised unless clips are Linked/grouped. https://github.com/aglcode/cupcut_reverse_engineering (third-party inspection of CapCut Desktop 9.4, corroborated by https://editlogic.io/capcut-keyboard-shortcuts-pc/ )
3. **Playhead snapping to edits:** a consequence of (1) in all four — scrubbing/dragging the playhead head snaps to edit points and markers when snapping is on. FCP extends it to keyframes (release notes note playhead snapping to audio-component keyframes).

Design note: beginners conflate a gap with "broken". The FCP/CapCut choice — main track cannot have gaps unless the user explicitly opts out — removes the most common beginner failure mode in Premiere/Resolve (accidental gaps, black flashes in export).

### 2.4 Edit operations: ripple, roll, slip, slide, and the simple subset

Definitions are identical across Premiere, Resolve and FCP (CapCut exposes only some):

| Operation | What changes | Duration of neighbours / total |
|---|---|---|
| **Ripple trim** | One clip's edge moves; everything downstream on (sync-locked) tracks shifts to close/open | Total duration changes |
| **Roll trim** | Shared edit point moves: outgoing clip and incoming clip trade frames | Total unchanged |
| **Slip** | Clip stays in place and same length; its source In/Out slide (different content shows) | Nothing else moves |
| **Slide** | Clip moves in time, keeping its content/length; neighbours' edges absorb the move | Total unchanged |
| **Lift** | Remove selected/range, leave a gap | Gap remains |
| **Extract / Ripple Delete** | Remove and close the gap | Total shrinks |

- Premiere: dedicated tools in Tools panel — Ripple Edit `B`, Rolling Edit `N`, Slip `Y`, Slide `U`, Rate Stretch `R`; plus keyboard ripple trims `Q` (ripple head to playhead) / `W` (ripple tail to playhead), and Ripple Delete = `Shift+Delete`. Trim Mode (`T`) opens a two-up Program Monitor for roll/ripple with JKL dynamic trimming. https://helpx.adobe.com/mena_ar/premiere-pro/using/trim-mode-editing.html
- Resolve Edit: Trim mode set in toolbar — Selection `A`, Trim `T` (contextual ripple/roll/slip/slide depending on where you grab the clip), Blade `B`; ripple delete etc. via menu/keyboard. Same tool-less model on the Cut page, reduced further.
- FCP: one Trim tool; ripple is the default behaviour of the magnetic timeline, roll/slip/slide chosen by grabbing different zones of the edit point or via the Precision Editor (double-click an edit point: inline expanded view of outgoing + incoming unused media).
- CapCut: no named slip/slide tools. Exposed: trim by dragging edges (with magnet on, main-track trims ripple), Split `Ctrl/Cmd+B`, **Delete Left `Q` / Delete Right `W`** (ripple-trim everything before/after playhead on the selected clip), Ripple Delete `Shift+Delete`, drag to reorder on main track. https://editlogic.io/capcut-keyboard-shortcuts-pc/

Beginner-relevant fact: `Q`/`W` ripple-trim-to-playhead exists in both Premiere and CapCut and is the single highest-speed editing gesture in both. Slip/slide/roll are pro refinements with low beginner use and high explanation cost.

### 2.5 Linked selection (audio + video staying together)

- Premiere: **Linked Selection toggle, Timeline header, `Ctrl/Cmd+L`** — linked A/V selects/moves/trims together; Alt/Option-click temporarily selects one part alone. Out-of-sync indicators (`+n`/`-n` frames, red) appear on clips whose linked parts have drifted.
- Resolve: **Linked Selection toggle in toolbar, `Cmd/Ctrl+Shift+L`**; Link Clips `Cmd/Ctrl+Option+L` on a selection; Option-click overrides for one move. https://www.manualpdf.in/blackmagic-design/davinci-resolve-mini-panel/manual?p=527
- FCP: A/V is a single clip object by default (audio is a component inside the clip, expandable); connections, not links, bind secondary clips to the Primary Storyline.
- CapCut: **Linkage toggle, key `` ` `` / `~`** — linked overlay/text/audio clips follow main-track magnet moves; grouping `Ctrl/Cmd+G` is the manual equivalent. https://editlogic.io/capcut-keyboard-shortcuts-pc/

Default in all four: **linked ON**. Turning it off is the expert move; leaving it off silently is a common beginner sync disaster.

### 2.6 Track headers

Left end of each track, in Premiere and Resolve (FCP has no track headers — lanes form by Roles; CapCut has a minimal header):

- Premiere video header: track name (V1, V2… double-click to expand/collapse), **Toggle Track Lock** (padlock), **Toggle Sync Lock**, **Toggle Track Output** (eye — track invisible in Program Monitor), track targeting (source patching V1/A1 selectors on the far left). Audio header adds **Mute (M)**, **Solo (S)**, Voice-over record arm. Track height: drag header divider, or scroll-wheel over header; Timeline Display Settings (wrench) sets waveform/keyframe visibility and preset heights.
- Resolve header: track number/name (double-click to rename, colour-tag tracks), **Lock** (padlock — locked clips render hatched/stippled), **Disable** (video) / **Mute** (audio), Auto Select selector, and (Resolve 20.2) a Sync Lock toggle independent of Auto Select. Height via Timeline View Options + drag. https://documents.blackmagicdesign.com/SupportNotes/DaVinci_Resolve_20.2_New_Features_Guide.pdf?ref=davinciresolveclub.com
- CapCut header (left of each track, icons only): **Lock, Hide, Mute** (audio tracks: lock/mute). Tracks are created by dragging a clip above/below existing tracks and auto-deleted when emptied. https://github.com/aglcode/cupcut_reverse_engineering
- FCP: no headers. Equivalent functions live per-clip (Disable `V`) and in the Timeline Index (Roles can be focused/minimised, lanes reorganised).

### 2.7 Markers

| | Clip markers | Timeline / sequence markers | Colours / types | Add key |
|---|---|---|---|---|
| Premiere | On a clip (source or timeline instance); move with the clip | On the sequence ruler; can have duration, name, comment, chapter type | Coloured marker types incl. Chapter, Segmentation, Web Link, Flash Cue Point; Markers panel lists/searches all | `M` (at playhead, on selected clip or sequence depending on focus); `Shift+M`/`Cmd+M` variants to edit |
| Resolve | On a clip in Media Pool or timeline (frame-anchored to source) | On the timeline ruler (Timeline marker) or on a clip | 16-ish colour palette; name, note, duration, keywords; Edit Index / marker list navigation; `Shift+Up/Down` jumps between markers | `M` add; `Cmd/Ctrl+M` add-and-edit |
| FCP | On a Browser clip or a timeline clip | Same object — FCP markers are always clip-attached; the topmost clip carries timeline-visible markers | Standard (blue), **To-Do (orange, checkable/completed)**, **Chapter (green)** types | `M` add; `Option+M` add-and-edit |
| CapCut | On a clip (stay on the same source moment when clip is moved/trimmed/retimed) | On the timeline ruler | `M` = default colour; `Alt+M` = add with a new colour | `M`, `Alt+M`; `Shift+M` next marker (per shortcut lists) |

Sources: Resolve marker/linked-selection toolbar definitions — https://www.manualpdf.in/blackmagic-design/davinci-resolve-mini-panel/manual?p=527 ; CapCut clip vs timeline markers and colours — https://github.com/aglcode/cupcut_reverse_engineering and https://editlogic.io/capcut-keyboard-shortcuts-pc/ ; FCP marker types incl. to-do items that can be checked off and chapter markers — https://eb99c8ab-f7b5-4a11-9b00-6bc7a9131086.atarimworker.dev/my/final-cut-pro/specs/

Pro pattern: markers are cheap, coloured, named, and jumpable (previous/next marker). Chapter markers additionally surface in exports (Premiere, FCP).

### 2.8 Playback: JKL, shuttle, scrubbing, skimming

- **JKL is universal** (Premiere, Resolve, FCP; CapCut is the outlier — Space + arrows + speed controls, no JKL shuttle by default):
  - `L` play forward; repeated presses = 2×, 4×, 8×… `J` same in reverse. `K` pause. `K+L` / `K+J` = slow play (½×, or frame-step taps). `Shift+L/J` in some = ½-speed increments.
  - Premiere help states it directly: "Your keyboard's J, K, and L keys can play the clip backward, pause, or forward", and Trim Mode uses JKL for dynamic trimming (stop playback = commit trim at that frame). https://helpx.adobe.com/mena_ar/premiere-pro/using/trim-mode-editing.html
- **Spacebar** = play/pause everywhere, including CapCut.
- **Scrubbing:** drag playhead (audio scrubbing toggleable: Premiere `Shift+S`; Resolve audio scrubbing on/off in toolbar; FCP audio skimming `Shift+S`).
- **Skimming (FCP invention, now copied):** hover moves a skimmer through Browser and Timeline clips without moving the playhead (`S` toggles; audio skimming separate). Resolve Cut page and Premiere hover-scrub in Project panel icon view approximate it. CapCut: hover-scrub on media thumbnails and timeline preview-axis mode.
- **Shuttle hardware metaphor:** no modern UI shows a jog wheel by default; the JKL cluster + arrow keys replaced it.

### 2.9 Viewer overlays: safe margins, guides, scopes

- **Safe margins:**
  - Premiere: Program/Source Monitor Settings (wrench) → **Safe Margins**; overlays Action Safe (outer) and Title Safe (inner) rectangles, defaults 10% / 20%, customisable in Project Settings; guides are reference-only, never exported. https://helpx.adobe.com/premiere/desktop/get-started/source-and-program-monitor-adjustments/view-safe-zones-in-the-monitors.html
  - Resolve: Viewer menu → Safe Area, with selectable Title / Action / Centre / aspect guides; 20.1 unified the graphical Safe Area selector across Cut/Edit/Color viewers, multiple guides can be on at once, icon toggles all. https://documents.blackmagicdesign.com/SupportNotes/DaVinci_Resolve_20.1_New_Features_Guide.pdf?ref=davinciresolveclub.com
  - FCP: Viewer Settings pop-over → Show Title Safe / Action Safe zones (fixed broadcast proportions), plus Horizon overlay.
  - CapCut: no broadcast safe areas; the social equivalent is platform-UI awareness (ratio/canvas guides in the Player and, in templates, TikTok UI overlays noted in third-party guides). For vertical social video the real-world "safe area" is "keep text/faces clear of the right rail and bottom caption zone of TikTok/Reels/Shorts" — none of the four builds that in as a first-class toggle except via templates/guides.
- **Other viewer overlays pros use:** centre crosshair, rule-of-thirds / custom guides and rulers (Premiere, Resolve, CapCut all have ruler/guide toggles), frame guides for other aspect ratios, zebra/false colour (Resolve/FCP viewer), audio timecode burn-in.
- **Scopes — where they live matters:**
  - Premiere: **Lumetri Scopes panel** (its own docked panel, usually in Color workspace): Waveform (Luma / RGB Parade), Vectorscope YUV, Histogram. Driven by the Program Monitor frame at the playhead.
  - Resolve: scopes are a **Color page** feature (Waveform, Parade, Vectorscope, Histogram, CIE) — on the Edit page there are no scopes, only audio meters. Scopes are explicitly a grading tool, not an editing tool, in Resolve's model.
  - FCP: Video Scopes appear **in/under the Viewer** (View → Show Video Scopes): Luma Waveform, RGB Parade/Overlay, Vectorscope, Histogram; can show in Event Viewer too. https://eb99c8ab-f7b5-4a11-9b00-6bc7a9131086.atarimworker.dev/my/final-cut-pro/specs/
  - CapCut: no scopes. A histogram appears inside Adjust/colour tools only.
- Takeaway: scopes are pro-signalling but are (a) grading-stage, (b) hidden in two of four products while editing. They are not part of the "feels professional while cutting" core.

### 2.10 What actually makes a timeline "feel professional" to a beginner

Ranked by how often the behaviour is touched in a first edit, not by prestige:

1. Playhead that scrubs smoothly with picture + (toggleable) sound, and snaps to cuts.
2. Clips that cannot accidentally leave gaps on the main track (magnet) or that snap flush (snapping on by default).
3. Waveforms visible on audio clips and filmstrip thumbnails on video clips at all normal zooms.
4. Zoom slider + Zoom-to-Fit + keyboard zoom that never loses the playhead.
5. Split at playhead in one key/click, Delete that closes the gap, Undo that always works.
6. A/V staying in sync by default (linked selection on), with an obvious lock/hide/mute per track.
7. Big readable timecode + duration readout; markers you can drop while playing (`M`) without stopping.
8. Audio meters that go red when you clip — immediate, legible feedback.
9. JKL + Space + arrow keys behaving exactly like the tutorials for the pro apps.
10. Safe-area overlay for the destination (for social: platform UI zones, not broadcast title-safe).

Prestige items with low beginner payoff: roll/slip/slide tools, scopes, multicam, track targeting/source patching, sync lock as a separate concept, nested sequences/compound clips (useful later).

---

## 3. Audio

### 3.1 Waveform display

- All four draw peak waveforms inside audio clips on the timeline by default (Premiere: toggle in Timeline Display Settings wrench; track height controls waveform legibility; Resolve: Timeline View Options → Show Audio Waveforms, with per-clip waveform regeneration in newer versions; FCP: Clip Appearance presets trade filmstrip vs waveform height, incl. "waveforms only"; CapCut: waveforms on audio tracks and on video clips' audio, `Ctrl+Shift+H` toggles per shortcut lists).
- Waveforms are the primary visual editing reference for speech (pauses, plosives, music beats) in all four — editors cut on waveforms more than on picture for dialogue.
- Premiere Source Monitor and Resolve Source Viewer also show zoomable waveforms for marking In/Out on audio before insertion.

### 3.2 Volume line, keyframes / rubber bands

Same gesture in all four, different names:

- **Premiere:** horizontal volume line ("rubber band") across the clip. Drag line = whole-clip level; Pen tool `P` or `Ctrl/Cmd+click` on the line = add a keyframe (diamond); drag keyframes up/down/left/right; fade handles at clip corners. Separate concepts: **Clip Gain** (right-click → Audio Gain…, applies before the line) vs clip volume vs track volume in Audio Track Mixer. Show Clip Keyframes must be enabled per track (wrench / clip menu → Show Clip Keyframes → Volume). https://helpwiki.evergreen.edu/wiki/index.php?title=Diversity_and_Dissent_in_Education-_Editing_Sound_in_Premiere_Pro&direction=prev&oldid=38312&printable=yes
- **Resolve Edit:** clip volume line with keyframe points (Alt/Option+click to add), Inspector → Audio → Volume numeric/slider; Fairlight page adds full automation lanes per track. White volume line drag described for Fairlight clips — https://e-tipsdaily.com/how-to-edit-audio-in-davinci-resolve/
- **FCP:** volume line across the clip; drag = level with live dB readout and waveform reshaping; `Option+click` = keyframe; **Range tool trick:** select a range inside a clip and drag its volume line — FCP auto-creates 4 keyframes (duck/swell in one gesture). Fade handles at clip ends. https://larryjordan.com/articles/fcp-x-adjusting-audio-levels/comment-page-1/
- **CapCut:** no rubber band on the timeline clip in most builds; volume is a slider in Properties (with dB readout) plus **volume keyframes** via the keyframe diamond in Properties / keyframe panel, fade in/out durations as numeric fields + right-click fade menu. Cross-editor comparison table (clip volume/rubber band, keyframing, mixer presence per editor) — https://datafield.dev/video-production/appendices/appendix-e-nle-translation-guide.html

### 3.3 Meters

- Premiere: Audio Meters panel (vertical stereo/bus meters docked right of Program Monitor / in Audio workspace), peak-hold + red clip indicators; meters measure dBFS, 0 = ceiling.
- Resolve: Edit page has a compact meter + Mixer panel meters per track; Fairlight page has full channel-strip meters and a loudness meter (LUFS, standard selectable; Project Settings → Fairlight → Target Loudness, default −23 LUFS, set −14 for YouTube). https://umbrellacreators.com/blog/how-to-normalize-audio-for-youtube
- FCP: small meters in the toolbar/dashboard; click to expand to large meters; peak-only dBFS display.
- CapCut: a small stereo meter beside the Player during playback in recent desktop builds; no loudness meter. (Weakest of the four.)

### 3.4 Normalisation / loudness — one-click fixes

| Editor | Feature | Where | Target model |
|---|---|---|---|
| Premiere | Audio Gain → **Normalize Max Peak / Normalize All Peaks to −x dB** | Right-click clip → Audio Gain | Peak normalisation |
| Premiere | **Essential Sound → Loudness → Auto-Match** | Essential Sound panel after tagging clip as Dialogue/Music/SFX/Ambience | LUFS auto-match (broadcast/streaming); Music tagging also unlocks auto-**Ducking** with generated keyframes | 
| Premiere (export) | **Loudness Normalization** effect (ITU BS.1770-3 etc., target LUFS + true-peak limiter) | Media Encoder / Export → Effects tab | Whole-export loudness |
| Resolve | **Normalize Audio Levels** (Independent / Relative, peak or loudness mode) | Right-click clips → Normalize Audio Levels | Per-clip or batch, peak dBFS or LUFS |
| Resolve (export) | **Normalize Audio checkbox on YouTube preset**, or Audio tab → Audio Normalization (Normalize to / Optimize to Standard, target level) | Deliver page render settings | Whole-export; manual states YouTube target = −14 LUFS |
| FCP | **Audio Enhancements → Loudness** (Amount + Uniformity) in Audio Inspector; analysis can flag/fix loudness on import | Audio Inspector / Browser analysis | Perceptual loudness correction per clip; no LUFS numeric target in-app |
| CapCut | **Normalize loudness** toggle + **Reduce noise** toggle | Select clip → Audio tab in Properties | One-toggle loudness evening; no numeric target shown |

Sources: Premiere Essential Sound Auto-Match + ducking workflow — https://cursa.app/en/page/premiere-pro-beginner-workflow-audio-basics-for-clear-dialogue-and-balanced-mix ; Premiere gain-normalize options — https://www.hollyland.com/blog/topics/normalize-audio-in-premiere ; Resolve clip normalize + Deliver normalize + −14 LUFS — https://umbrellacreators.com/blog/how-to-normalize-audio-for-youtube ; FCP loudness enhancement in Inspector — https://www.brainscape.com/flashcards/final-cut-pro-x-24-2449572/packs/3704870 (secondary); CapCut normalize loudness / reduce noise listed among its desktop audio tools — https://www.capcut.com/resource/audio-enhancer-software?from_page=landing_page&enter_from=header

Pattern: every editor ships a single obvious "make it the right loudness" button, and the beginner-facing ones (FCP, CapCut) hide the LUFS number entirely. Premiere/Resolve expose the number for pros delivering to broadcast/streaming specs (~−14 LUFS integrated for YouTube, true peak ≤ −1 dBTP is the common companion rule).

### 3.5 Other audio facts worth copying

- **Fades are handles, not effects:** all four put drag fade-in/out handles on clip corners; double-click/drag sets duration visually.
- **Ducking:** Premiere generates keyframes from Essential Sound ducking; Resolve/CapCut offer auto-duck toggles in newer builds; FCP does it manually via the Range-tool 4-keyframe gesture. All solve the same #1 beginner mix problem: music too loud under speech.
- **Noise reduction as a toggle:** Essential Sound Repair (Premiere), Voice Isolation / Noise Reduction (Resolve Fairlight FX + Inspector), Audio Enhancements → Noise Removal (FCP), Reduce Noise (CapCut). One toggle, one amount slider is the beginner form.

---

## 4. Export

### 4.1 Preset systems

- **Premiere — Export mode** (`File > Export > Media`, `Ctrl/Cmd+M`): a dedicated screen, three columns — destinations left (Media File, YouTube, Vimeo, TikTok, Facebook, X, Behance…), preview + range centre, settings right (Format, Preset). Presets include **Match Source – Adaptive High/Low Bitrate** (copies sequence resolution + frame rate, H.264) and platform presets (YouTube 720/1080/4K, Vimeo, TikTok vertical). Direct publish to YouTube/Vimeo/TikTok with sign-in. Custom presets saveable. https://helpx.adobe.com/th_en/premiere-pro/using/workflow-overview-exporting.html
- **Resolve — Deliver page:** preset strip at top of Render Settings (left): YouTube (720p/1080p/1440p/2160p), Vimeo, TikTok (HD/FHD), H.264/H.265 Master, ProRes Master, plus Custom; below it Video / Audio / File tabs. Frame rate is locked to project frame rate for platform presets. **Quick Export** (`File > Quick Export`, from any page) = preset icons only, one dialog, optionally direct-upload to YouTube/Vimeo/TikTok/Dropbox/Frame.io. https://github.com/fenixstarlord/cowork-resolvemanual/blob/HEAD/skills/deliver/SKILL.md and https://davinciresolveclub.com/export-video-davinci-resolve/
- **FCP — Share:** `File > Share` destinations: Master File, Apple Devices (720/1080/4K), YouTube/Facebook/Vimeo optimised files, DVD/Blu-ray; custom destinations are built in Compressor and appear in the Share menu; a **bundle** = several destinations fired in one step; background rendering/export while you keep editing. https://eb99c8ab-f7b5-4a11-9b00-6bc7a9131086.atarimworker.dev/my/final-cut-pro/specs/
- **CapCut — Export dialog:** one button top-right (`Ctrl+E`). Fields: name, folder, resolution (up to 4K), bit rate (Recommended/Higher/custom), codec (H.264/HEVC), format (MP4/MOV), frame rate (24–60), separate "Export audio" checkbox (MP3/WAV/AAC/FLAC), copyright check toggle; after render, one-click share panels for TikTok (9:16, title, visibility, duet/stitch toggles) and YouTube (16:9). No named platform preset list — resolution/fps fields + post-export share buttons do the same job. https://www.capcut.com/resource/how-to-use-capcut

Common denominator: **H.264 in MP4 is the default web deliverable everywhere**; resolution + frame rate default to "match the sequence/timeline"; platform presets differ mainly in bitrate, resolution ceiling, and (vertical) aspect.

### 4.2 Queue / batch

- Premiere: **Queue button → Adobe Media Encoder**: jobs stack, encode in background while editing continues; one sequence can spawn multiple outputs (duplicated queue items with different presets); watch folders auto-encode dropped files. https://helpx.adobe.com/th_en/premiere-pro/using/workflow-overview-exporting.html
- Resolve: **Render Queue (right side of Deliver):** configure → Add to Render Queue → repeat with other settings/ranges → Render All. Queued jobs are snapshots — editing settings afterwards does not change a queued job until you click its pencil and Update Job. https://davinciresolveclub.com/export-video-davinci-resolve/
- FCP: batch via Share bundle (multiple destinations, one trigger) and selecting multiple projects in the Browser to Share; background tasks window shows progress.
- CapCut: no queue. One export at a time; export is modal-ish with progress + share step. (The beginner editor of the four is the one without a queue.)

### 4.3 Range (In/Out) export

Universal, same mechanism everywhere: set timeline In `I` / Out `O`; export's Range/Source control chooses **Entire Sequence / Timeline** vs **Sequence In/Out** (Premiere Export mode range menu; Resolve Deliver: "Entire Timeline" vs "In/Out Range" selector above the mini-timeline, Quick Export respects I/O too; FCP: select a Range in the timeline before Share, or set range in the Share preview; CapCut: export dialog in recent builds offers full vs selected-range where a range is marked). If no I/O is set, all default to the whole timeline. Chapter markers (Premiere/FCP) can be embedded in the exported file.

---

## 5. Project Settings, Auto-Save, Templates

### 5.1 Sequence / timeline settings (resolution, fps)

- **Premiere — sequence is the unit:** New Sequence from preset (by camera/format) or custom Settings tab (frame size, frame rate, pixel aspect, audio sample rate). Dragging a clip onto the New Item icon or onto an empty timeline creates a sequence matching that clip; first clip dropped on a mismatched sequence triggers **"Clip does not match sequence settings — Change / Keep"** dialog. Sequence frame rate cannot be changed after creation in older versions; modern versions allow some changes via Sequence Settings. Multiple sequences per project = multiple timelines/outputs.
- **Resolve — project is the unit:** Project Settings (gear, bottom-right) → Master Settings → **Timeline Format: resolution + frame rate set before editing** (frame rate locks once media is on a timeline in most versions); timelines can override format ("Use custom settings" per timeline). Importing mismatched-fps media prompts an offer to change project frame rate to match the clip. Deliver frame rate follows the timeline. https://github.com/fenixstarlord/cowork-resolvemanual/blob/HEAD/skills/deliver/SKILL.md and http://primalvideo.com/guides/davinci-resolve-tutorial-for-beginners-2026/
- **FCP — project properties:** New Project dialog offers **Automatic** (project adopts frame size, frame rate, colour space of the **first clip edited in**; frame rate then cannot be changed once media is in the timeline) or Custom (explicit format/resolution/rate, incl. non-standard sizes; Smart Conform can later reframe for square/vertical delivery). https://dev.larryjordan.com/articles/how-to-set-and-change-project-settings-in-final-cut-pro/
- **CapCut — canvas model:** project = ratio + resolution + fps. Ratio chosen from the Player area (Original, 16:9, 9:16, 1:1, 4:3, etc.); resolution/fps edited in project Details (Properties panel when nothing selected) and confirmed again at export. Changing ratio mid-project is allowed and reframes the canvas (clips can be scaled/pinned). https://www.scientificdev.net/courses/capcut-from-basics-to-professional/capcut-interface-and-project-settings/

Pattern for beginners: three of four either auto-match the first clip (FCP automatic, Premiere prompt, Resolve prompt) or make ratio a one-tap visual choice (CapCut). Nobody expects a beginner to type a frame rate unprompted — the dangerous setting (fps) is the one most guarded/locked after first use.

### 5.2 Auto-save / recovery

| Editor | Mechanism | Defaults / location |
|---|---|---|
| Premiere | **Auto Save** preferences: interval + max versions; timestamped copies in an Auto-Save folder next to / in the Documents Adobe folder; also one emergency backup file per project, overwritten each interval; crash relaunch offers recovery | Current Adobe doc: auto-save every **5 minutes, keep last 20 versions** (older versions shipped 15 min / different counts — setting is user-visible) — https://helpx.adobe.com/premiere/desktop/get-started/preferences-and-settings/auto-save-preferences.html |
| Resolve | **Live Save** (Preferences → User → Project Save and Load): incremental save-as-you-go, on by default in current versions + **Project Backups** (timed copies: default every 10 min, 8 hourly, 5 daily, FIFO) + **Timeline Backups** (per-timeline timed copies, restored from Media Pool); backups opened as independent projects | https://www.manuals.ca/blackmagic-design/davinci-resolve-17/manual?p=100 |
| FCP | No Save command at all — library database writes continuously; **automatic library backups every ~15 min** (database only, no media) to Movies/Final Cut Pro Backups, pruned after several days; restore via File > Open Library > From Backup; backup location settable in Library Properties inspector (can be set to Do Not Save) | https://support.apple.com/guide/final-cut-pro/set-storage-locations-ver7db6ffe77/mac |
| CapCut | **Continuous auto-save of drafts** (local draft folder, path configurable in Settings; `draft_content.json.bak` autosave backup alongside the draft); cloud sync of drafts when signed in; no version history UI — duplicate-the-draft is the manual versioning pattern | https://www.scientificdev.net/courses/capcut-from-basics-to-professional/capcut-interface-and-project-settings/ |

Direction of travel is unambiguous: manual Save is disappearing (FCP, CapCut, Resolve Live Save). Versioned backups, not a Save button, are the recovery story.

### 5.3 Templates / starting points

- Premiere: New Project templates / project templates (.prproj templates), mogrt Motion Graphics templates, Essential Graphics browse panel; Productions for shared templates across projects.
- Resolve: project templates via saved project settings + Power Bins (media/fx shared across projects), timeline templates via exported timelines, Deliver presets as export templates.
- FCP: Motion templates (titles/effects/transitions/generators) stored with or outside the library; library itself is the reusable container; **Snapshots** = one-click frozen duplicate of a project for versioning.
- CapCut: template-first culture — projects can be created from / published as templates (replace-the-clips model), draft duplication as versioning, cloud draft sharing.

---

## 6. Implications for WovenCut

Ranking = user value × feasibility in a simple Electron app (HTML/CSS/JS timeline, FFmpeg-class export assumed). "Label" = the plain-word label WovenCut should use, per the big-type / icon + word rule.

### Tier 1 — Ship first (highest value, low–medium cost)

| # | Feature | Pro precedent | WovenCut form | Label |
|---|---|---|---|---|
| 1 | **Fixed 4-zone layout**: Clips left, Preview centre, Settings right, Timeline bottom, Export top-right | All four editors (§1.1) | One layout only, no docking/floating/workspaces | "Clips" / "Preview" / "Settings" / "Export" |
| 2 | **Main-track magnet ON, no toggle at first**: deleting/trimming closes gaps on the main video track | FCP Magnetic Timeline; CapCut Main Track Magnet (`P`) | Main track always packed; overlay/text/audio tracks free | (no control — it just works; if a toggle is added later: "Keep clips together") |
| 3 | **Snapping ON by default** to clip edges, playhead, markers, with a visible guide line + one big toggle | All four (`S`/`N`) | Magnet icon button in timeline toolbar, highlighted = on; also support `S` key | "Snap" |
| 4 | **Zoom slider + Zoom-to-Fit button + `Ctrl/Cmd+wheel` and `+`/`-` keys** | All four (§2.1) | Slider at right end of timeline toolbar; Fit = `Shift+Z` | "Zoom" / "Show whole video" |
| 5 | **Split at playhead (big button + `Ctrl/Cmd+B`), Delete that closes the gap, Undo/Redo always visible** | CapCut/Premiere | Scissors button centred in timeline toolbar; gap-closing delete is the only delete on main track | "Split" / "Delete" |
| 6 | **Ripple-trim to playhead: `Q` = trim start to here, `W` = trim end to here** | Premiere + CapCut both | Two big buttons either side of Split | "Trim start here" / "Trim end here" |
| 7 | **Linked A/V on by default**; one override (Alt-click / a Link toggle) | All four (§2.5) | Video clips carry their sound as one block | "Keep sound with picture" |
| 8 | **Track header: Lock / Hide / Mute only** — three big icon+word buttons per track | CapCut header; Premiere/Resolve headers minus patching/sync-lock | No sync lock, no targeting, no auto-select | "Lock" / "Hide" / "Mute" |
| 9 | **Waveforms always on audio, filmstrip thumbnails always on video**, track height = 2 sizes (Normal/Big) | All four (§3.1, §2.6) | One "Bigger tracks" toggle, not a drag continuum at first | "Bigger tracks" |
| 10 | **Volume line on audio clips**: drag line for level, click line to add a point, drag corner triangles for fade in/out | Premiere/Resolve/FCP rubber band (§3.2) | This single gesture replaces a mixer for v1; numeric dB readout while dragging | (direct manipulation; Settings panel mirrors it as "Volume") |
| 11 | **Live audio meter beside Preview, green/yellow/red, red = too loud** | All four (§3.3) | One stereo bar, red peak-hold dot that stays until clicked | "Sound level" |
| 12 | **One-click loudness fix**: "Make sound even" button (peak-normalise clips + set export to −14 LUFS-style target internally, number hidden) | CapCut Normalize Loudness; FCP Loudness; Premiere Auto-Match (§3.4) | Toggle per clip in Settings + one project-level toggle at Export | "Make sound even" |
| 13 | **Music ducking as one toggle** on a music clip: "Lower music when people talk" | Premiere Essential Sound ducking; CapCut auto-duck | Generates the volume points automatically (uses Tier-1 #10 data) | "Lower under voices" |
| 14 | **Markers: `M` / big button drops a coloured dot on the ruler with a short note; click marker in a list to jump** | All four (§2.7) | One marker type + colour choice at first; no chapter/to-do types | "Mark" |
| 15 | **Playback keys exactly like the pros**: Space, `J K L` shuttle (repeat = faster), Left/Right = 1 frame, Up/Down = previous/next cut, `I`/`O` set start/end | Premiere/Resolve/FCP (§2.8) | Zero UI cost, pure key handling; print them on an on-screen "Keys" card | "Keys" (help card) |
| 16 | **Auto-save continuously + timed backups, no Save button**; on reopen after a crash, banner: "Recovered your video from HH:MM" | FCP / CapCut / Resolve Live Save (§5.2) | Save project JSON on every change (debounced); keep last ~20 timed copies; recovery = open newest good copy | (no control; banner text only) |
| 17 | **Project starts by matching the first clip** (resolution + fps copied; vertical detected automatically); ratio switcher as big visual tiles 16:9 / 9:16 / 1:1 | FCP Automatic; Premiere/Resolve match prompts; CapCut ratio tiles (§5.1) | Ask nothing technical at New Project except a name; fps never shown unless asked | "Shape: Wide / Tall / Square" |
| 18 | **Export = 3 big preset tiles + Custom**: "YouTube (wide)", "TikTok / Shorts (tall)", "Same as my video"; H.264 MP4 underneath; progress bar; range = whole video or Marked part (`I`/`O`) | Premiere/Resolve/FCP presets; CapCut export dialog (§4.1, §4.3) | No codec/bitrate fields outside Custom; frame rate always matched, not offered | "Export" → tile names as above |

### Tier 2 — Ship second (high value, medium cost, or narrower audience)

| # | Feature | Why / precedent |
|---|---|---|
| 19 | **Safe-area overlay for social**: faint outline showing TikTok/Reels bottom + right UI zones (and a centre/title-safe rectangle) toggled over Preview | Modern replacement for broadcast title-safe (§2.9); prevents captions/faces being covered by platform UI — a real beginner pain the pro tools mostly do *not* solve |
| 20 | **Roll trim** on a cut (drag the join between two clips) | Only trim refinement with clear beginner payoff ("move the cut, keep the length"); Premiere/Resolve/FCP core tool (§2.4) |
| 21 | **Noise reduction toggle** per clip ("Make voice clearer") | One toggle in all four (§3.5); needs an audio filter chain (FFmpeg afftdn-class) — feasible, tune carefully |
| 22 | **Export queue**: add several exports (wide + tall) and run them in order, with per-job status | Premiere Media Encoder queue / Resolve Render Queue (§4.2); CapCut proves v1 can ship without it |
| 23 | **Duplicate project / Snapshot button** ("Make a copy before big changes") | FCP Snapshots; CapCut draft duplication (§5.3); complements auto-backups with user-named versions |
| 24 | **Second track-height / waveform detail and a Markers list panel** | Edit Index / Markers panel equivalents; useful once projects pass ~5 minutes |
| 25 | **Guides in Preview**: thirds grid + centre cross toggles | Cheap viewer overlays present in Premiere/Resolve/CapCut (§2.9) |

### Tier 3 — Defer or skip (pro prestige, low beginner value or high cost)

| Feature | Reason to defer |
|---|---|
| Slip and Slide tools | Rarely understood without training; Roll + ripple covers beginner needs (§2.4) |
| Scopes (waveform/vectorscope/histogram) | Grading-stage tools; hidden during editing in Resolve, absent in CapCut (§2.9). A simple brightness warning would serve beginners better later |
| Full mixer panel / track faders | Volume line + ducking + loudness toggle covers the beginner mix (§3) |
| Separate Source Monitor / three-point editing | CapCut and FCP prove a single preview + skim/hover preview is enough (§1.3) |
| Track targeting, source patching, sync lock as separate toggles | Premiere/Resolve complexity that exists for multi-track pro sync work; magnet + linked selection subsume it for beginners |
| Custom workspaces / dockable panels | Fixed layout is a feature for this audience (CapCut model) |
| LUFS numbers, true-peak readouts, broadcast standards menus | Hide behind the "Make sound even" toggle (CapCut/FCP precedent, §3.4) |
| Nested sequences / compound clips | Powerful but conceptually heavy; revisit only if users ask for grouped clips (CapCut grouping is the lighter form) |

### Cross-cutting rules drawn from the research

- **Defaults are the product:** in every editor the beginner-safe state is snapping ON, linked ON, magnet (where present) ON, waveforms ON, auto-save ON. WovenCut should ship those defaults and make turning them off possible but never necessary.
- **Every timeline action needs three forms:** a big button (icon + word), a drag gesture, and the pro keyboard shortcut. Pro editors always provide at least two; beginners find buttons, returning users find keys, tutorials use the pro keys — matching Premiere/CapCut key letters (`B`-split family differs: use CapCut's `Ctrl+B` split, `Q`/`W`, `M`, `I`/`O`, `Shift+Z` fit) means web tutorials transfer.
- **One preview, not two** is the proven beginner simplification (CapCut, FCP) — do not reintroduce Source/Program as separate panes.
- **Hide numbers, keep the decision:** fps, LUFS, bitrate and codec are all auto-matched or preset-hidden in the beginner-facing tools; resolution is presented as shape + a plain size word (Tall/Wide, HD/4K), not pixels, at the top level.
