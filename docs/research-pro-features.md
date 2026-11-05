# WovenCut — Pro / Prosumer Feature-Set Research

Date: 2026-11-05. Scope: **capabilities and workflow features only** — timeline mechanics / UI layout are covered by a separate researcher.
Editors studied: Adobe Premiere Pro (now "Adobe Premiere"), DaVinci Resolve (free + Studio), Final Cut Pro, CapCut Desktop; free-baseline section adds Clipchamp, Shotcut, Kdenlive, OpenShot.
WovenCut baseline (checked in this repo, `README.md` + `js/model.js`, 2026-11-05): drag/reorder timeline, trim, fade-in/out, Cut-or-Crossfade only, PiP overlay (corner + size %), manually typed timed captions, one music file with a volume slider, save/open as plain JSON. No keyframes, colour, speed, effects library, bins, proxies, history panel, SRT, or audio processing yet. Rankings at the end are scored against that baseline and an Electron + FFmpeg architecture.

---

## 1. Editing capabilities

### 1.1 Transitions library
- Premiere: "hundreds of built-in transitions and effects" in the Effects panel, plus a *default* transition applied with a shortcut (Ctrl/Cmd+D video, Shift+Ctrl/Cmd+D audio) and "Apply Default Transitions to Selection" (Shift+D). Source: https://www.adobe.com/products/premiere/features.html ; https://helpx.adobe.com/premiere/desktop/get-started/keyboard-shortcuts/default-keyboard-shortcuts.html
- Final Cut Pro: technical spec lists "Over 95 high-quality transitions", a Flow transition that "seamlessly smooths jump cuts", and a customisable Default Effect assignable to a keyboard shortcut. Source: https://eb99c8ab-f7b5-4a11-9b00-6bc7a9131086.atarimworker.dev/my/final-cut-pro/specs/
- CapCut Desktop: a dedicated Transitions tab/panel, drag-and-drop, marketed on "cinematic filters, motion transitions" and a large trending-effects library updated frequently. Sources: https://www.capcut.com/resource/how-to-use-capcut-on-pc?from_page=a1.b5.0.0&enter_from=a1.b5.0.0 ; https://www.filehorse.com/download-capcut/?amp
- Resolve: transitions live alongside Resolve FX; Studio unlocks "more than 100 GPU-accelerated Resolve FX" (free version has a smaller FX set). Source: https://www.reel-stack.com/tools/davinci-resolve
- **Takeaway:** the pro expectation is not 2 transitions (WovenCut today) but a *categorised library* (dissolves, wipes, slides/zooms, blur/glitch) with adjustable duration, alignment (start/centre/end at edit), and a one-key default transition. In FFmpeg terms this maps directly onto the `xfade` filter family (~50 built-in xfade types) plus `fade` — high coverage for low code.

### 1.2 Effects: colour correction basics, wheels, LUTs
- Premiere — Lumetri Color: Basic Correction (exposure, contrast, highlights/shadows, whites/blacks, temperature/tint, saturation), Creative (Looks/LUTs), Curves, Color Wheels & Match, HSL Secondary; Lumetri Scopes (waveform, RGB parade, vectorscope, histogram); Auto Color; colour-match / Comparison View. The help index lists these as separate documented workflows: "Correct color using color wheels", "Save or export Look-up Tables", "Apply Lumetri looks", "Available Lumetri Scopes". Source: https://helpx.adobe.com/premiere-pro/using/basic-workflow.html
- Resolve — the benchmark: even the **free** version gives "nodes, color wheels, curves, LUTs, scopes" and primary wheels/bars/curves, HSL qualifiers, Color Warper; Studio adds HDR grading/scopes (Dolby Vision, HDR10+), temporal/spatial noise reduction, film grain, Magic Mask. Sources: https://www.miracamp.com/learn/davinci-resolve/free-vs-studio-pro ; https://writingwithacamera.com/Handouts/DaVinci-Resolve-vs-Studio
- Resolve colour workflow norm: technical LUT (log → Rec.709) on its own node first, then correction (Lift/Gamma/Gain/Offset wheels, custom S-curve), creative LUT last. Source: https://store.hollyland.com/blogs/creator-hub/enhance-video-with-davinci-resolve-studio
- Final Cut Pro: colour wheels / colour board, curves, Match Color (new tool "unifying the look of your timeline" across cameras/lighting), HDR (Rec.2020 PQ/HLG) support, LUT support via camera LUTs and custom LUT effect. Sources: https://support.apple.com/en-us/102825 ; https://eb99c8ab-f7b5-4a11-9b00-6bc7a9131086.atarimworker.dev/my/final-cut-pro/specs/
- CapCut: filters as one-click looks + manual Adjustments (brightness/contrast/etc.), i.e. presets first, sliders second. Source: https://www.capcut.com/resource/how-to-use-capcut-on-pc?from_page=a1.b5.0.0&enter_from=a1.b5.0.0
- **Takeaway:** minimum "feels professional" colour stack, in order users expect it: (1) sliders — exposure/brightness, contrast, saturation, temperature, tint, highlights, shadows; (2) one-click preset looks; (3) importable `.cube` LUT with intensity slider; (4) a histogram (scopes-lite). Wheels and node graphs are pro identity for Resolve but are *not* beginner baseline. FFmpeg equivalents exist for all of tier 1–3 (`eq`, `colorbalance`, `curves`, `lut3d`, `haldclut`); preview can approximate with CSS filters but export values must be the source of truth — preview/export mismatch is the main risk.

### 1.3 Keyframing (position / scale / opacity / rotation)
- Premiere: Effect Controls panel animates Position, Scale, Rotation, Anchor Point and Opacity with keyframes; keyframes can be moved/copied, with temporal interpolation (easing / Bezier); the same system animates effect properties, titles and Time Remapping. Sources: https://www.capcut.com/resource/keyframes-in-premiere-pro ; course outline confirming "Keyframing Motion Properties, Adding, Moving and Copying Keyframes, Working with Keyframe Interpolation" at https://www.mewshop.com/adobe-intermediate-premiere-pro-201-film-editing-video-classes-new-york
- CapCut: "Advanced Keyframe Controls — smoother motion animations with precise timeline adjustments"; keyframes are a headline *advanced* feature, not a paid extra in the desktop pitch. Source: https://www.filehorse.com/download-capcut/?amp
- Shotcut / Kdenlive / OpenShot all ship keyframe animation in their free builds (see §7) — keyframes are now free-tier baseline, not a pro differentiator.
- **Takeaway for WovenCut:** a generic keyframe model — any numeric property (PiP x/y, scale, opacity, rotation, volume) gets diamond-at-playhead, linear + ease-in/out interpolation — unlocks PiP animation, ken-burns on stills, logo tracking (already on Paul's roadmap, Phase A manual keyframed tracking in `FEATURE-REQUESTS-2026-11-04.md`), volume rides and animated titles from one mechanism. This is the single highest-leverage engine feature.

### 1.4 Speed controls: slow-mo, ramping, freeze frame
- Premiere: Speed/Duration dialog (constant %, reverse, ripple), Rate Stretch tool (R), and Time Remapping — speed keyframes on the clip itself, drag the line up/down, split keyframes to smooth the ramp. Source: https://www.adobe.com/creativecloud/video/hub/guides/premiere-pro-speed-ramp.html
- Interpolation is a named, user-facing choice in all three pro apps, with the same three tiers: **Frame Sampling** (repeat/drop) / **Frame Blending** / **Optical Flow** (synthesised frames). Resolve adds Speed Warp (Studio, motion estimation); Final Cut Pro offers five Video Quality levels up to "Best (Machine Learning)". Comparison table: https://loopdesk.ai/blog/speed-ramping-explained ; Premiere doc: https://helpx.adobe.com/premiere/desktop/edit-projects/change-clip-speed/apply-time-interpolation-methods-to-adjust-clip-speed.html
- CapCut: speed 0.1×–100×, a **Curve** speed editor (preset ramp curves), "smooth slow-mo" (optical-flow) toggle, and a Freeze feature — all in the free desktop feature list. Sources: https://www.filehorse.com/download-capcut/?amp ; https://techdows.com/the-best-free-video-editing-software-for-windows-or-mac.html
- Freeze frame: Premiere (Frame Hold / Insert Frame Hold Segment), Resolve and FCP all treat "hold this frame" as a first-class clip operation, including ramp-to-freeze.
- **Takeaway:** expected ladder = constant speed % → reverse → freeze frame → preset ramp curves (CapCut-style, beginner-readable) → interpolation choice on export. FFmpeg: `setpts`/`atempo` for constant, `minterpolate` for optical-flow-like synthesis (slow, artefacts on crossing objects — same caveat the pro tools document).

### 1.5 Stabilisation
- Premiere: Warp Stabilizer effect — background analysis, Smoothness / method controls, reframing of edges; routinely listed beside masking/tracking in pro syllabi. Source: https://github.com/tertiarycourses/tgs-2026064536-video-editing-with-premiere-pro/blob/HEAD/LEARNER-GUIDE.md
- Resolve: tracker-based stabilisation on Color/Edit pages; Studio adds Camera Shake *removal* tooling and AI enhancement. CapCut: one-toggle "Stabilize" (AI-based) in the right panel. Sources: https://filmora.wondershare.com/answers/video-stabilization-motion-tracking.html ; https://github.com/tashisleepy/capcut-ai-director/blob/HEAD/knowledge-base/KF-07-audio-music-intelligence.md
- **Takeaway:** users expect a single "Smooth shaky video" toggle, not parameters. Feasibility warning for WovenCut: FFmpeg's `vidstabdetect`/`vidstabtransform` two-pass stabilisation is effective but is **not in every stock FFmpeg build** (requires libvidstab) and `deshake` is weaker — this is a build/packaging problem, not a UI problem. Rank accordingly (§8).

### 1.6 Text / titles systems
- Premiere: titles are *templates*. Motion Graphics Templates (`.mogrt`) — authored in After Effects or Premiere, exposing only chosen fields (text, colour, duration) — are browsed/dragged from the Essential Graphics panel, then filled in like a form; lower thirds are the canonical use case, reused across episodes without rebuilding. Sources: https://www.adobe.com/creativecloud/video/discover/lower-third-graphics.html ; https://anfx.co/blog/adobe-unveils-breakthroughs-in-video-and-film-production/
- Final Cut Pro: "Over 176 advanced 2D and 3D title templates", cinematic 3D titles with built-in backgrounds/animations, plus generators and ~125 animation templates with drop zones; custom templates via Motion can be saved with the library. Source: https://eb99c8ab-f7b5-4a11-9b00-6bc7a9131086.atarimworker.dev/my/final-cut-pro/specs/
- CapCut: text templates + text animations + auto-styled captions are a primary tab (Text / Templates in the top media bar), not a sub-menu. Source: https://github.com/tashisleepy/capcut-ai-director/blob/HEAD/knowledge-base/KF-07-audio-music-intelligence.md
- **Takeaway:** a title *system* = (a) a small gallery (opening title, lower third name/title, end card, callout/subscribe), (b) each template exposing only text + colour + size fields, (c) in/out animation baked in, (d) save-my-own-style. WovenCut's HTML/CSS overlay rendering is actually well suited to this — templates can be DOM elements in preview and `drawtext`/overlay renders at export, provided fonts are bundled.

### 1.7 Captions / subtitles
This is now the most standardised workflow across all four editors:

| Step | Premiere | Resolve | Final Cut Pro | CapCut |
|---|---|---|---|---|
| Auto-captions | Speech-to-Text: transcribe sequence in Text panel → Create Captions onto a caption track | Studio: Transcribe Audio / Create Subtitles From Audio (free version: import SRT) | Generate Captions (AI, Apple-silicon Macs, US English) analyses spoken audio into timeline captions/subtitles | Auto Captions, dozens of languages, ~30 s for a 3-min clip in independent testing |
| Edit | Correct transcript *before* captioning; cues are draggable clips; style per-track (Track Style) | Subtitle clips editable; styling per-subtitle not scriptable | Convert closed captions ↔ subtitles; select-all-subtitles command | Word-level editing, one-click filler-word ("um/uh") removal, collective styling |
| Import | SRT (and other formats) via File ▸ Import / Text panel "Import captions from file" → caption track | SRT import is the standard workaround even for Studio scripting | "Import caption files … to automatically create time-synced, connected captions" | SRT import supported |
| Export choice | Three explicit options at export: **burn captions into video**, **create sidecar file (.srt/.vtt)**, or **embed** in container | Sidecar SRT export or burn-in on Deliver page | Burn-in, sidecar, or embed via Compressor / iTunes package | Burn-in (styled) is the default social path; SRT export available |

Sources: Premiere captions overview — burn-in vs `.srt` sidecar vs embed in QuickTime/MXF: https://helpx.adobe.com/premiere/desktop/add-text-images/insert-captions/about-captions.html ; SRT import/export/styling workflow and burn-in-vs-sidecar guidance by platform (YouTube = sidecar, Shorts/TikTok/Reels = burned-in): https://www.captionplug.com/blog/srt-files-premiere-pro ; two-stage transcribe→captions detail: https://subtitlebee.com/blog/how-to-add-subtitles-in-premiere-pro/ ; FCP Generate Captions + caption import: https://support.apple.com/en-us/102825 ; https://apps.apple.com/fi/app/final-cut-pro/id424389933?mt=12 ; Resolve transcription/subtitle API limits: https://voyager.so/resources/apps/davinci-resolve ; CapCut caption speed/accuracy test: https://www.redoyou.com.au/reviews/capcut-desktop-w1h8h

Key facts a beginner editor must match:
- **SRT carries text + timing only — no fonts, colours or positions.** Players/renderers decide presentation. Any SRT feature must say so plainly.
- **Burn-in vs sidecar is a delivery decision, not a preference:** sidecar for YouTube (toggleable, searchable, auto-translatable), burn-in for TikTok/Reels/Shorts where platform caption UI is minimal and styled text is part of the content.
- Auto-caption *accuracy* is now expected to include speaker labels, punctuation, and filler-word cleanup (CapCut/Premiere both surface these).
- WovenCut fit: it already has timed caption objects in JSON, so SRT import/export is a pure parser/serialiser. Auto-captions fit its existing "bring your own provider key" model (user's own Muse/Replicate/Whisper key) — do **not** need a bundled cloud service.

---

## 2. Media management

- **Bins / folders:** Premiere Project panel = bins (nestable folders), with list/icon views, labels/colours, and search; Resolve Media Pool = bins + smart bins, with per-clip metadata columns; FCP replaces bins with Events + keyword collections / favourites applied to *ranges* ("Apply custom keywords or favourites on the fly as you select clip ranges"). Sources: https://apps.apple.com/fi/app/final-cut-pro/id424389933?mt=12 ; http://masv.io/blog/media-asset-management-in-nles (note: URL as returned by search was http://masv.io/blog/media-asset-management-in-nles)
- **Metadata:** all three pro apps read camera metadata, allow custom metadata fields, and make media *searchable/filterable* by it; FCP additionally reads iXML audio metadata to auto-create roles, and Resolve's scripting/API surface exposes media-pool organisation, markers and metadata. Sources: https://eb99c8ab-f7b5-4a11-9b00-6bc7a9131086.atarimworker.dev/my/final-cut-pro/specs/ ; https://voyager.so/resources/apps/davinci-resolve
- **Proxies:** universal and expected, including in free tools.
  - Premiere: ingest-time proxy creation, Attach Proxies for externally made proxies (matched by filename/extension/timecode), a one-click proxy toggle, and Reconnect Full Resolution Media before export. Source: https://helpx.adobe.com/il_en/premiere/desktop/organize-media/ingest-proxy-workflow/attach-proxies-to-full-resolution-media.html
  - FCP: proxy at 12.5%–100% of original size, ProRes Proxy or H.264 (HEVC in newer versions), "Proxy Preferred" playback mode, originals swapped back automatically at export. Sources: https://eb99c8ab-f7b5-4a11-9b00-6bc7a9131086.atarimworker.dev/my/final-cut-pro/specs/ ; https://www.editorskeys.com/en-nl/blogs/news/final-cut-pro-mastery-10-advanced-tips-for-power-users
  - Resolve: standalone free **Blackmagic Proxy Generator** app creates proxies from camera originals outside the editor. Source: https://www.blackmagicdesign.com/sg/products/davinciresolve/collaboration/
  - Kdenlive and Shotcut also ship proxy editing free (see §7) — proxies are baseline for "edits 4K on a weak laptop", which is exactly WovenCut's stated audience (already item 2 in Paul's robustness list, `FEATURE-REQUESTS-2026-11-04.md`). FFmpeg implementation is trivial (`scale=-2:540` H.264 crf 28 proxy + a `useProxy` flag per clip, swapped at export).
- **Offline media relink:** Premiere = Link Media / Locate Files (search a folder tree, relink others automatically by matching properties); Resolve = Media Pool ▸ Relink Selected Clips; FCP = Relink Files. The shared pattern: clips show a clear **offline/missing** state (Premiere renders a red "Media Offline" frame), never a silent blank, and one located file relinks its neighbours from the same folder. Source: https://33rdsquare.com/how-to-share-adobe-premiere-pro-projects-a-comprehensive-guide/
- **Project archive / consolidate:**
  - Premiere **Project Manager**: "Collect Files and Copy to New Location" or "Consolidate and Transcode", with exclude-unused-clips, rename-media-to-clip-names, and handles (extra frames) options. Source: http://masv.io/blog/media-asset-management-in-nles
  - FCP: Consolidate Library/Project Media — copies original + optimised + proxy media into the library or a chosen location for transport/archiving; Motion (template) content consolidates separately. Source: https://support.apple.com/en-ca/guide/final-cut-pro/ver7db6ffe77/mac
  - Resolve: Project Manager ▸ Archive (project + media), plus exportable `.drp` project files. Source: https://www.manualpdf.in/blackmagic-design/davinci-resolve/manual?p=11
  - **WovenCut equivalent:** "Bundle my project" — one `.zip`/folder containing project JSON + copies of only the used files (with trim handles where cheap) + a missing-files report. This is Paul's already-proposed "shareable project bundle"; the research confirms it is a named pro feature, not a nice-to-have.

---

## 3. Keyboard shortcut systems

### 3.1 Canonical default map (Premiere defaults — the map most tutorials assume)
Source for the full official list (updated 2026-01-07): https://helpx.adobe.com/premiere/desktop/get-started/keyboard-shortcuts/default-keyboard-shortcuts.html — corroborated at https://filmdaft.com/premiere-pro-keyboard-shortcuts-pc-mac/

| Action | Win | Mac | Notes |
|---|---|---|---|
| Selection tool | V | V | |
| Track Select Forward | A | A | Shift+A = backward |
| Ripple Edit tool | B | B | |
| Rolling Edit tool | N | N | (note: N is *not* snapping in Premiere) |
| Rate Stretch tool | R | R | |
| Razor tool | C | C | Ctrl/Cmd+K = add edit at playhead on targeted tracks |
| Slip / Slide | Y / U | Y / U | |
| Pen (keyframe) | P | P | |
| Hand / Zoom | H / Z | H / Z | Shift+Z in FCP = fit timeline; +/- also zoom in Premiere |
| Play/pause; shuttle | Space; J-K-L | same | J/L pressed repeatedly = faster shuttle; K = pause |
| Mark In / Out | I / O | I / O | X = mark clip, / = mark selection, Shift+I/O = go to In/Out |
| Add marker | M | M | Shift+M = next marker |
| Snap in Timeline toggle | S | S | **the** snapping shortcut beginners learn first |
| Ripple Delete | Shift+Delete | Shift+Forward Delete | plain Delete = lift (leaves gap) — the lift/extract distinction is core pro vocabulary |
| Ripple trim to playhead | Q / W | Q / W | trim previous/next edit, closing the gap |
| Apply default transition | Ctrl+D | Cmd+D | Shift+D = apply to selection |
| Undo / Redo | Ctrl+Z / Ctrl+Shift+Z | Cmd+Z / Cmd+Shift+Z | |
| Save | Ctrl+S | Cmd+S | |
| Keyboard Shortcuts editor | Ctrl+Alt+K | Cmd+Opt+K | opens the visual customiser (below) |
| Duplicate | Ctrl+Shift+/ | Cmd+Shift+/ | |

Cross-app divergence worth knowing: FCP uses **B = Blade** (not ripple), **A = Select**, Cmd+B = blade at playhead, M = marker, Control+R etc.; Resolve defaults are Premiere-like (it ships selectable Premiere/FCP shortcut presets). Sources: https://www.editorskeys.com/en-nl/blogs/news/final-cut-pro-mastery-10-advanced-tips-for-power-users ; https://copyprogramming.com/howto/final-cut-pro-x-shortcuts-cheat-sheet-pdf
**Implication:** WovenCut (Windows-first) should adopt the **Premiere map** for the overlapping actions — V, C, S, M, I/O, J-K-L, Space, Q/W, Shift+Delete, Ctrl+Z/Shift+Ctrl+Z, Ctrl+D, Ctrl+S, Ctrl+K — because that is the map YouTube tutorials teach.

### 3.2 Customisation + cheat-sheet UI
- Premiere: Keyboard Shortcuts dialog shows a *visual keyboard* — click a key to see its assignment, drag commands onto keys, save named presets, export/import presets. FCP: Final Cut Pro ▸ Commands ▸ Customise, 150+ customisable commands, also with a visual keyboard and command sets. Resolve: Keyboard Customization with switchable application presets (Premiere / FCP / Resolve). Sources: https://helpx.adobe.com/premiere/desktop/get-started/keyboard-shortcuts/default-keyboard-shortcuts.html ; https://www.editorskeys.com/en-nl/blogs/news/final-cut-pro-mastery-10-advanced-tips-for-power-users ; https://davinciresolveclub.com/undo-redo-davinci-resolve/
- Beginner-app equivalent that preserves the pro feel at low cost: (1) shortcuts printed in tooltips (already Paul's plan — "keyboard shortcuts printed right in the tooltips", `FEATURE-REQUESTS-2026-11-04.md`), (2) a one-page in-app "Keyboard shortcuts" sheet (searchable list), (3) remapping only for the ~20 core actions, stored in settings JSON. Full visual-keyboard customisers are polish, not baseline.

---

## 4. Undo / history

How the pros present it — three distinct layers, consistently separated:

1. **Undo/redo stack (session only).** Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z everywhere. Premiere's History panel (Window ▸ History) lists every project-changing action of the *current session*, oldest at top, newest at bottom; clicking a state jumps the project to it, states below dim, and editing from an earlier state discards the redo branch. History is cleared when the project closes; panel/window/preference changes are not recorded. Sources: https://www.manualsdir.com/manuals/753890/adobe-premiere-pro-cs3.html?page=129 ; https://gbtimes.com/how-to-undo-in-adobe-premiere/
2. **History as a menu + window (Resolve's clearest model).** Edit ▸ History submenu shows the last ~20 actions (newest at top); Edit ▸ History ▸ Open History Window shows the full stack (newest at *bottom* — the two views order oppositely, a known confusion). Media/Cut/Edit/Fairlight share one project-wide history; Color and Fusion keep per-clip histories. Closing the project purges the stack. Source: https://davinciresolveclub.com/undo-redo-davinci-resolve/
3. **Autosave vault (survives closing/crash) — separate from undo.** Premiere Auto Save preference: interval + maximum versions kept, written to an Auto-Save folder beside the project; Team Projects adds browsable Version History with "Make Auto-Save the Latest". Resolve: **Live Save** (on by default — incremental save on every change) + **Project Backups** (timed copies: minutes/hours/days) + per-timeline **Timeline Backups** with Restore Timeline Backup. FCP: automatic library backups (database only, timestamped, *not* media) restored via File ▸ Open Library ▸ From Backup. Sources: https://helpx.adobe.com/premiere/desktop/collaborate-with-others/collaborate-using-team-projects/view-auto-saves.html ; https://davinciresolve21.com/blog/davinci-resolve-recover-deleted-timeline ; https://support.apple.com/en-ca/guide/final-cut-pro/ver7db6ffe77/mac

**WovenCut translation (cheap because projects are small JSON):** an in-memory undo stack + a visible History list ("Split clip", "Moved clip", "Changed fade") the user can click to jump to; autosave every change (debounced) to a rotating vault (e.g. keep last 20 + hourly for a day) next to the project file; "Go back to how it was yesterday" restore list in plain words. Paul already requested auto-save/crash recovery and project snapshots — this research confirms the pro pattern is *history panel for the session, vault for everything else*, and that conflating them confuses users.

---

## 5. Audio features

### 5.1 The beginner-facing model: tag the clip type, get the processing
Premiere's Essential Sound panel is the reference design: assign a clip **Dialogue / Music / SFX / Ambience**, and the panel exposes only the controls relevant to that type, in plain language:
- Dialogue: Auto-Match Loudness, Enhance Speech (AI noise/reverb reduction + clarity, one intensity slider), Reduce Noise / Reduce Rumble / DeHum / DeEss / Reduce Reverb repair checkboxes, EQ presets.
- Music: **Ducking** — enable, choose what it ducks against (Dialogue), sensitivity + duck amount; Premiere *writes volume keyframes* onto the music clip, which remain hand-editable afterwards.
- Remix: re-times a music track to a target duration (rearranges sections rather than looping/fading).
Sources: https://www.adobe.com/learn/premiere-pro/web/professional-audio-mix ; https://helpx.adobe.com/se/premiere-pro/how-to/audio-sweetening.html

Resolve Fairlight (free) is a full DAW page: per-track EQ, dynamics (compressor/expander/limiter), automation, ADR, VST/AU plug-ins, loudness metering/analysis and Match Loudness; Studio adds Voice Isolation (AI dialogue/background separation), Dolby Atmos/immersive, higher sample rates. Sources: https://www.miracamp.com/learn/davinci-resolve/free-vs-studio-pro ; https://writingwithacamera.com/Handouts/DaVinci-Resolve-vs-Studio ; https://store.hollyland.com/blogs/creator-hub/enhance-video-with-davinci-resolve-studio
FCP: audio **Roles** (Dialogue/Music/Effects) organise lanes and exports, EQ + effects per clip, loudness and noise-reduction effects, stem export by role. Source: https://www.editorskeys.com/en-nl/blogs/news/final-cut-pro-mastery-10-advanced-tips-for-power-users
CapCut: auto-ducking, noise reduction and voice enhancement as toggles; note the cautionary trend — CapCut has moved "high-end noise reduction and specific AI transitions" behind its Pro subscription, blocking export until paid. Source: https://www.redoyou.com.au/reviews/capcut-desktop-w1h8h

### 5.2 Loudness standards (the numbers)
- **YouTube, TikTok, Instagram/Reels: −14 LUFS integrated, true peak ≤ −1 dBTP.** Platforms normalise on ingest: louder masters are turned *down* (dynamics already crushed stay crushed), quieter ones are mostly left alone — mastering louder gains nothing. Neither YouTube nor TikTok publishes an official target; −14 LUFS / −1 dBTP is the widely observed/safe figure. Broadcast is a different world (−23 LUFS EBU R128 / −24 LKFS ATSC). Sources: https://mediastrategylab.com/tools/lufs-loudness-reference ; https://www.soundveo.com/blog/loudness-levels-youtube-tiktok-podcasts/
- Ducking rule of thumb from the same reference: music ≈ **6 LU below dialogue while someone speaks**, rising to ≈3 LU below in gaps; attack ~80–150 ms, release ~300–500 ms.
- Tooling norm: an integrated-LUFS meter in the editor (Premiere Loudness Meter/Radar effect, Resolve Fairlight meter) **and** a normalise-on-export option targeting a named preset ("YouTube −14 LUFS").
- **WovenCut / FFmpeg fit is exact:** FFmpeg `loudnorm` (two-pass: measure, then apply) implements EBU R128 normalisation to a target LUFS/true-peak; `ebur128` measures; `sidechaincompress` implements real ducking keyed by the dialogue track; `afftdn` = noise reduction, `anlmdn` = stronger denoise, `equalizer`/`firequalizer` = EQ, `highpass=f=80` removes rumble. One plain-words toggle — "Make it all the same loudness (YouTube standard)" — covers the feature Paul already proposed; show the measured LUFS number after export as proof.

### 5.3 Built-in music / SFX libraries and licensing
- Premiere: Adobe Stock audio browsable *inside* Essential Sound (search by mood/tempo/duration), free-and-paid tracks mixed in results; Stock tracks are **not free** — use requires an Adobe Stock licence/plan; unlicensed previews are watermarked by audio ID. Source: https://www.adobe.com/learn/premiere-pro/web/professional-audio-mix ; licensing note at https://test.apkfunny.com/en/article/adding-music-to-video-in-premiere-pro-a-professional-workflow-guide-for-modern-content-creators/175442.html
- CapCut: large in-app commercial music + SFX library is a core attraction, but tracks carry platform terms and the library is a moving paywall risk (above).
- YouTube Audio Library is the free reference point creators know: free, searchable by mood/genre/duration, most tracks no-attribution, safe for monetised videos. Same source as above.
- Resolve/FCP ship modest built-in SFX (Fairlight sound library; FCP's bundled effects/loops via media browsers) rather than a streaming music store.
- **WovenCut rule implied by the research + Paul's copyright-safe-music item:** bundle a *small, verifiably* royalty-free set (public-domain / CC0 / self-made) with a per-track licence label stored in the project ("Free to use, no credit needed" vs "Credit required: …"), and link out to YouTube Audio Library rather than embedding a third-party catalogue whose terms can change. Never ship commercial-service music (Spotify/Apple Music rips are not licensed for video — stated explicitly in the Premiere workflow guide above).

---

## 6. Collaboration / versioning

- **Resolve — the high end:** Blackmagic Cloud project libraries let multiple users work in the *same project simultaneously* (even the same timeline, with change review/accept and timeline-compare/merge), bin and timeline locking prevents overwrites, media/proxies sync between machines, and the free Proxy Generator feeds remote editors. Sources: https://www.blackmagicdesign.com/sg/products/davinciresolve/collaboration/
- **Premiere — Team Projects / Productions:** shared projects with Version History and browsable auto-saves (see §4), conflict resolution on save, and Productions (a folder of projects sharing media) for long-form teams. Source: https://helpx.adobe.com/premiere/desktop/collaborate-with-others/collaborate-using-team-projects/view-auto-saves.html
- **FCP — deliberately single-user, versioning instead:** no simultaneous library editing; the versioning tool is **Duplicate as Snapshot** — a frozen copy of a project (compound clips frozen too, unlike a plain duplicate which stays live-linked) for trying a different cut safely — plus timestamped automatic library backups. Sources: https://eb99c8ab-f7b5-4a11-9b00-6bc7a9131086.atarimworker.dev/my/final-cut-pro/specs/ ; https://support.apple.com/en-ca/guide/final-cut-pro/ver7db6ffe77/mac
- **CapCut:** cloud drafts/spaces and template sharing are its collaboration story — projects live in ByteDance cloud, which is also its lock-in story.
- **Realistic WovenCut scope:** real-time co-editing is out of scope for a local Electron app and not a beginner expectation. What *is* expected, per FCP/Premiere above: (1) named **snapshots** ("Before I re-cut the ending") that are frozen and restorable, (2) autosave vault (§4), (3) the project **bundle** (§2) as the hand-off mechanism — bundle + plain-JSON project is WovenCut's honest equivalent of collaboration, and it is diffable/version-controllable in git because the format is text.

---

## 7. Free-competitor baseline — what "free" now means to users

Sources for this section: https://techlasi.com/tools/best-free-video-editors-with-real-limits-listed/ ; https://rankite.com/blog/best-free-editing-software-pc ; https://alternativesatlas.com/free-video-editors/ ; https://www.nemovideo.com/blog/best-free-video-editors-without-watermark

| Baseline expectation | Who sets it | Detail |
|---|---|---|
| No watermark, no length limit, HD export free | Resolve, Shotcut, Kdenlive, OpenShot, Clipchamp (1080p), CapCut (most workflows) | Watermark-on-free is now read as a scam signal; multiple 2026 round-ups use "exports without watermark" as their inclusion filter |
| 4K editing + export free | Resolve (to UHD 60 fps, 8-bit free), Shotcut, Kdenlive, CapCut (to 4K 60 fps) | Clipchamp free caps at 1080p — and is criticised for it |
| Auto-captions free | CapCut, Clipchamp (80+ languages, plus silence remover + noise suppression + text-to-speech, free tier) | This is the single feature that moved from "AI extra" to baseline in ~2 years |
| Keyframes, chroma key, stabilisation | CapCut, Shotcut, Kdenlive | All free; see §1.3/§1.5 |
| Proxy editing | Shotcut, Kdenlive, Resolve | Expected even in open-source tools |
| Colour correction + scopes-lite | Shotcut ("color correction"), Kdenlive, Resolve (full) | Sliders + filters minimum |
| Templates / stock library built in | Clipchamp, CapCut | Templates updated weekly (CapCut) set the freshness expectation |
| Screen + webcam recording built in | Clipchamp (free) | A creator-workflow expectation WovenCut does not currently touch |
| Text-to-speech voiceover | CapCut, Clipchamp (free) | Increasingly baseline for faceless channels |
| Background removal (no green screen) | CapCut (free at launch, drifting Pro), Clipchamp | AI feature users now ask for by name |
| Multi-track, unlimited tracks | Shotcut, Kdenlive, OpenShot ("unlimited") | OpenShot pairs this with animated/3D title templates as its beginner pitch |
| No account required, works offline | Shotcut, Kdenlive, OpenShot, Resolve | Clipchamp/CapCut require accounts + internet for most assets — the gap a local, no-telemetry free app can honestly claim |

Net: a 2026 "free editor" is judged against **CapCut's AI conveniences + Resolve's depth + open-source tools' no-strings terms, simultaneously.** WovenCut cannot match all three; it can match the *terms* (no watermark/account/upsell — already its founding promise) plus the highest-frequency conveniences (captions, loudness, templates, proxies).

---

## 8. Candidate features for WovenCut, ranked

Scoring: Value = how much it moves WovenCut toward "feels professional" for a beginner creator (1–5). Feasibility = ease in Electron + FFmpeg + plain-JSON projects (5 = trivial, 1 = packaging/research risk). Ranked by Value × Feasibility, ties broken by beginner visibility. Effort is relative (S/M/L).

| # | Feature | V | F | V×F | Effort | Notes / implementation sketch |
|---|---|---|---|---|---|---|
| 1 | **SRT import + export, caption Track Style, burn-in vs sidecar choice at export** | 5 | 5 | 25 | S | Parser/serialiser over existing caption JSON; export switch = FFmpeg `subtitles` burn-in *or* write `.srt` beside the MP4. Label plainly: "SRT = words + timing only; YouTube can show/hide it" vs "Burned in = always visible, best for TikTok/Shorts" (§1.7) |
| 2 | **Loudness: measure + one-toggle normalise to −14 LUFS / −1 dBTP, with the measured number shown** | 5 | 5 | 25 | S | FFmpeg `loudnorm` two-pass at export; `ebur128` for the report. Name it "Make it YouTube loudness" (§5.2). Already on Paul's list — research confirms the exact target numbers |
| 3 | **Autosave vault + History panel + named Snapshots** | 5 | 5 | 25 | S–M | Undo stack with human-readable action names, click-to-jump (Premiere/Resolve pattern, §4); debounced autosave to rotating JSON vault; snapshot = frozen JSON copy with a user name (FCP pattern, §6). All cheap *because* projects are small JSON |
| 4 | **Premiere-map keyboard shortcuts + in-app cheat sheet + shortcuts in tooltips** | 4 | 5 | 20 | S | Adopt V/C/S/M/I/O/J-K-L/Q/W/Shift+Delete/Ctrl+K/Ctrl+D exactly (§3.1); one searchable shortcuts page; remap later. Makes every YouTube tutorial transferable to WovenCut |
| 5 | **Auto-ducking: music dips under speech** | 4 | 5 | 20 | S | Tag tracks Dialogue/Music (Essential Sound pattern, §5.1); export via FFmpeg `sidechaincompress`, or generate volume keyframes so the dip is visible/editable. Slider: "How much should music dip?" |
| 6 | **Transitions library expansion** | 4 | 5 | 20 | S–M | FFmpeg `xfade` gives ~50 types (dissolve, wipes, slides, circle, pixelise…); present ~12 curated in plain words + duration control + Ctrl+D default transition. Replaces today's Cut/Crossfade-only menu (§1.1) |
| 7 | **Colour basics + preset looks + LUT import** | 5 | 4 | 20 | M | Sliders (brightness, contrast, saturation, warmth, tint, highlights, shadows) → `eq`/`colorbalance`/`curves`; 6–8 bundled preset looks; `.cube` import with intensity → `lut3d`; histogram in inspector. Preview via CSS-filter approximation, export is truth (§1.2) |
| 8 | **Title / lower-third template gallery** | 5 | 4 | 20 | M | 6 templates (opening title, lower third, end card, subscribe callout, chapter heading, quote) exposing only text + colour + size; DOM in preview, rendered overlay at export (§1.6). Bundled font required for preview/export match |
| 9 | **Speed controls: constant %, reverse, freeze frame, 3 preset ramp curves** | 4 | 4 | 16 | M | `setpts`+`atempo` chains; freeze = `tpad` clone frame / still extraction; ramps as piecewise segments first, curves later; interpolation choice (repeat/blend/`minterpolate`) on export (§1.4) |
| 10 | **Proxy editing (automatic, invisible)** | 4 | 4 | 16 | M | On import of >1080p media, FFmpeg-generate 540p proxy in a project cache folder; preview uses proxy, export auto-swaps to original (Premiere/FCP pattern, §2). Paul's "ten-year-old laptop cuts 4K" promise depends on this |
| 11 | **Media bins, clip metadata, search, missing-file relink** | 4 | 4 | 16 | M | Folders + colour labels + name/duration/resolution columns in the media list; search box; offline clips shown as red "Missing — find it" cards, one located file relinks siblings in the same folder (§2) |
| 12 | **Generic keyframing for PiP / stills / volume (position, scale, opacity, rotation)** | 5 | 3 | 15 | L | One keyframe engine (§1.3) powers animated PiP, ken-burns, logo-tracking Phase A (already planned) and volume rides. Highest ceiling, most UI work — diamond button + interpolation + a simple curve/easing choice |
| 13 | **Auto-captions via the user's own key (Whisper/Replicate/Muse)** | 5 | 3 | 15 | M–L | Fits the existing BYO-key architecture; word-timed output lands in the existing caption model, then #1 handles styling/export. Accuracy features to copy: punctuation, filler-word cleanup toggle (§1.7). No bundled cloud, no WovenCut bill |
| 14 | **Audio repair basics: noise reduction, rumble cut, simple EQ presets** | 4 | 3 | 12 | M | `afftdn` (strength slider), `highpass=f=80`, 3 EQ presets ("Clearer voice", "Less boxy", "Less harsh") via `equalizer` — Essential Sound's checkbox pattern without a DAW (§5.1) |
| 15 | **Project bundle / consolidate ("Bundle my project")** | 3 | 4 | 12 | S–M | Zip of project JSON + used media only + missing-file report; the archive/hand-off feature (§2, §6). Lower daily value, high trust value |
| 16 | **Markers** | 3 | 4 | 12 | S | M key, named markers on a marker lane, click-to-jump, export marker list as chapters for YouTube descriptions — a small feature creators visibly use daily (§3.1) |
| 17 | **Bundled royalty-free music/SFX mini-library with per-track licence labels** | 3 | 3 | 9 | M | ~10 CC0/public-domain tracks + basic SFX (whoosh, pop, click), licence text stored per track and shown in plain words (§5.3). Curation/verification time is the cost, not code |
| 18 | **Stabilisation ("Smooth shaky video" toggle)** | 4 | 2 | 8 | L | Wanted and expected (CapCut one-toggle), but FFmpeg `vidstab` needs libvidstab in the bundled build — verify the Windows FFmpeg build first; two-pass analysis UX also needs design (§1.5) |
| 19 | **Chroma key + AI background removal** | 3 | 2 | 6 | L | `chromakey` is feasible for true green-screen; AI removal needs a per-frame segmentation model via the user's Replicate key — defer until auto-captions (#13) proves that pipeline |
| 20 | **Multicam, node colour, DAW-grade audio, real-time collaboration** | 2 | 1 | 2 | XL | Explicitly out of scope: pro identity features with near-zero beginner frequency; FCP-style snapshots + bundles cover the underlying need (§6) |

**Sequencing suggestion implied by the scores:** #1–#6 are all S/S–M and together convert WovenCut from "trimmer with captions" to "editor that finishes a publishable YouTube/TikTok video" (captions done properly, loudness correct, music ducked, transitions presentable, work never lost, tutorial shortcuts working). #7–#11 are the "feels professional" layer. #12–#13 are the growth engines. #18–#20 should not start before the first two layers ship.
