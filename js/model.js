// WovenCut — a truly free video editor.
// Copyright (C) 2026 Paul Blanchard (Damonini) and Pepper —
// Damonini and Pepper Software Development.
// This program is free software under the GNU General Public License
// v3.0; see the LICENSE file at the project root.
// WovenCut (working title) — project data model (v3, layered timeline)
// ---------------------------------------------------------------------------
// LAYERING (Paul, Nov 4 2026): the timeline is a stack of layers, top to
// bottom: any number of layer lanes → the main video → a background lane.
// Things on a higher lane draw OVER what's below; the background lane sits
// BEHIND the main video, which is where a green-screen shot lives: mark a
// main clip "green screen" (keyGreen) and its green is knocked out so the
// background shows through, while layer lanes put things on top.
//
// A project is plain JSON. Shape:
//
// {
//   "version": 3,
//   "title": "string",
//   "tracks": {
//     "main": [                       // picture track, in play order
//       {
//         "id": "c1",
//         "kind": "clip" | "still" | "segue",
//         "src": "absolute file path, or null (skeleton placeholder)",
//         "label": "shown on the block / placeholder frame",
//         "hue": 210,                 // placeholder frame colour
//         "duration": 4,              // seconds on screen (after trim)
//         "trimIn": 0,                // seconds skipped from the source head
//         "fadeIn": 0,                // seconds — DEFAULT 0 (Paul's rule)
//         "fadeOut": 0,               // seconds
//         "transitionIn": "cut",      // "cut" | "crossfade"
//         "transitionDuration": 0.5,  // seconds, when transitionIn=crossfade
//         "keyGreen": false,          // green-screen shot: knock out green
//         "generated": true,          // segue items only: AI-generated
//         "provider": "replicate"     // segue items only
//       }
//     ],
//     "layers": [                     // lanes ABOVE main, bottom lane first
//       [                             // layer 1: just over the main video
//         {
//           "id": "p1", "kind": "pip",
//           "src": null, "label": "…", "hue": 280,
//           "start": 10,              // seconds on the main timeline
//           "duration": 5,
//           "corner": "bottom-right", // top-left|top-right|bottom-left|bottom-right
//           "sizePct": 28             // % of frame width
//         }
//       ]
//     ],
//     "background": [                 // lane BEHIND main, full frame
//       { "id": "b1", "kind": "bg", "src": null, "label": "…", "hue": 190,
//         "start": 0, "duration": 15 }
//     ]
//   },
//   "captions": [ { "id": "t1", "start": 0, "end": 4, "text": "..." } ],
//   "music": { "src": null, "volume": 0.8 }   // file reference only
// }

export const RULES = {
  // PAUL'S FIRST-FRAME RULE — the app's DEFAULT, set by Paul (Nov 4 2026).
  // Paul's own videos open on the first frame at full strength: no fade-in,
  // never an open on black. Fades are standard tools WovenCut offers every
  // user — but a NEW project's first clip is created with fadeIn = 0, which
  // is Paul's way, and every sample/demo project ships that way. Any user
  // may raise a clip's fade-in in the inspector; the app never raises it
  // for them, and no export preset may prepend a fade or a black lead-in.
  FIRST_SEGMENT_FADE_IN_MS: 0,
  DEFAULT_FADE_IN_S: 0,
  DEFAULT_FADE_OUT_S: 0,

  DEFAULT_TRANSITION: "cut",
  DEFAULT_CROSSFADE_S: 0.5,
  DEFAULT_STILL_DURATION_S: 5,
};

// Transitions between main-track clips (pro pass 2, Nov 5 2026). The
// chosen transition lives on the INCOMING clip (transitionIn +
// transitionDuration), the way it always has. `xfade` is the FFmpeg
// xfade transition name the Phase 4 render uses; the preview draws an
// approximation of each (see preview.js). DIP transitions pass through
// black/white BETWEEN two clips — they are never applied at the very
// start of a project, so Paul's first-frame rule is untouched: clip 1
// still opens at full strength from t=0.
export const TRANSITIONS = [
  { id: "cut", icon: "✂️", label: "Cut — instant switch", xfade: null },
  { id: "crossfade", icon: "⤨", label: "Crossfade — soft blend", xfade: "fade" },
  { id: "dipblack", icon: "🌑", label: "Dip to black — fade out, fade in", xfade: "fadeblack" },
  { id: "dipwhite", icon: "🌕", label: "Dip to white — flash through white", xfade: "fadewhite" },
  { id: "wipeleft", icon: "◀️", label: "Wipe left — new clip wipes in from the right", xfade: "wipeleft" },
  { id: "slideleft", icon: "⏩", label: "Slide left — new clip slides in, pushing the old one out", xfade: "slideleft" },
];

export function transitionById(id) {
  return TRANSITIONS.find((t) => t.id === id) || TRANSITIONS[0];
}

let uidCounter = 0;
export function uid(prefix = "c") {
  uidCounter += 1;
  return `${prefix}${Date.now().toString(36)}${uidCounter}`;
}

// Deterministic placeholder colour from a name, so real imported files get
// stable, distinct block/frame colours before thumbnails exist.
export function hueFromName(name = "") {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

export function baseName(p = "") {
  return p.split(/[\\/]/).pop() || p;
}

const VIDEO_EXT = ["mp4", "mov", "mkv", "webm", "avi", "m4v"];
const IMAGE_EXT = ["png", "jpg", "jpeg", "gif", "webp", "bmp"];
const AUDIO_EXT = ["mp3", "wav", "m4a", "ogg", "flac"];

export function kindFromPath(p = "") {
  const ext = (p.split(".").pop() || "").toLowerCase();
  if (VIDEO_EXT.includes(ext)) return "clip";
  if (IMAGE_EXT.includes(ext)) return "still";
  if (AUDIO_EXT.includes(ext)) return "audio";
  return "clip";
}

// A fresh main-track item with Paul's defaults baked in.
export function newMainItem({ src = null, label = "", kind = "clip", duration = 0 } = {}) {
  const name = label || (src ? baseName(src) : "Untitled");
  return {
    id: uid("c"),
    kind,
    src,
    label: name,
    hue: hueFromName(name),
    duration: duration || (kind === "still" ? RULES.DEFAULT_STILL_DURATION_S : 10),
    trimIn: 0,
    fadeIn: RULES.DEFAULT_FADE_IN_S, // 0 — Paul's rule is the default
    fadeOut: RULES.DEFAULT_FADE_OUT_S,
    transitionIn: RULES.DEFAULT_TRANSITION,
    transitionDuration: RULES.DEFAULT_CROSSFADE_S,
    keyGreen: false, // green-screen shots opt in per clip (inspector)
  };
}

// A fresh picture-in-picture layer item (any layer lane above main).
export function newOverlayItem({ src = null, label = "", start = 0, duration = 5 } = {}) {
  const name = label || (src ? baseName(src) : "Overlay");
  return {
    id: uid("p"),
    kind: "pip",
    src,
    label: name,
    hue: hueFromName(name),
    start,
    duration,
    corner: "bottom-right",
    sizePct: 28,
  };
}

// A fresh background item: fills the whole frame BEHIND the main video —
// the layer a green-screen shot reveals when its green is knocked out.
export function newBackgroundItem({ src = null, label = "", start = 0, duration = 10 } = {}) {
  const name = label || (src ? baseName(src) : "Background");
  return {
    id: uid("b"),
    kind: "bg",
    src,
    label: name,
    hue: hueFromName(name),
    start,
    duration,
  };
}

export function emptyProject(title = "Untitled video") {
  return {
    version: 3,
    title,
    // Project settings (pro-upgrade batch, Nov 5 2026): the frame the
    // video is made for. Export presets can override at export time;
    // the first-frame rule applies to every preset equally.
    settings: { width: 1920, height: 1080, fps: 30 },
    // Timeline markers: named flags on the ruler ({ id, time, label })
    // for chapters, beats, and "fix this later" notes.
    markers: [],
    exportPreset: "youtube-1080",
    // Loudness normalisation (pro pass 2): when ON, the export plan adds
    // FFmpeg loudnorm targeting −14 LUFS / −1 dBTP — the level YouTube
    // and TikTok normalise to, so the upload sounds as loud as intended
    // instead of being turned down (or left quiet). Applied to the final
    // audio mix at render time (Phase 4); the toggle shapes the plan now.
    loudnessNormalize: true,
    // Captions at export: "burn" bakes them into the picture (what the
    // preview shows); "srt" keeps the picture clean and ships a separate
    // .srt file to upload alongside (YouTube captions). 
    captionMode: "burn",
    tracks: { main: [], layers: [[]], background: [] },
    captions: [],
    // Music bed: file reference + volume. Ducking (pro pass 2): when
    // duck is ON, the music dips under the main track's sound by
    // duckAmount (0–1, the fraction of volume removed while the main
    // track is loud). Modelled from the clips' real decoded waveforms.
    music: { src: null, volume: 0.8, duck: false, duckAmount: 0.6 },
    laneState: {
      hidden: { layers: [], background: false, captions: false },
      muted: { main: false, music: false },
    },
    // Credit for the original creator (reaction videos, Paul Nov 4 2026):
    // filled in the Reaction panel, written into the YouTube description
    // automatically at export — crediting the original is not optional
    // homework the user has to remember.
    sourceCredit: { title: "", creator: "", url: "" },
    // Saved Wi-Fi cameras (Paul, Nov 5 2026): network cameras the user
    // records from over RTSP, OBS-style — { id, name, host, port, path,
    // username, password } as built by js/netcam.js. They live in the
    // project file on the user's own machine, like everything else here;
    // the password is part of the camera's address and never leaves it.
    cameras: [],
  };
}

// Sample project for the Phase 1 review gate: placeholder frames (hue +
// label), one AI segue flagged as generated, one PiP overlay — no files.
export function sampleProject() {
  const p = emptyProject("Sample — The Gate at Dusk (Phase 1 demo)");
  p.tracks.main = [
    { ...newMainItem({ label: "The farm gate", kind: "still", duration: 4 }), hue: 96, keyGreen: true },
    {
      ...newMainItem({ label: "The herb rows", kind: "still", duration: 4 }),
      hue: 140, transitionIn: "crossfade", transitionDuration: 0.6,
    },
    {
      ...newMainItem({ label: "Segue — generated", kind: "segue", duration: 2 }),
      hue: 24, generated: true, provider: "replicate",
    },
    {
      ...newMainItem({ label: "The well at night", kind: "still", duration: 5 }),
      hue: 210, fadeOut: 1.2, // fade-OUT at the very end is unrestricted
    },
  ];
  p.tracks.layers = [
    [
      { ...newOverlayItem({ label: "Corner cam — the druid", start: 10, duration: 5 }), hue: 280 },
    ],
    [
      { ...newOverlayItem({ label: "Leaf border — top layer", start: 0, duration: 6 }), hue: 45, corner: "top-left", sizePct: 20 },
    ],
  ];
  p.tracks.background = [
    { ...newBackgroundItem({ label: "Backdrop — the valley behind", start: 0, duration: 15 }), hue: 190 },
  ];
  // The corner cam is a locked reaction pair: it stays glued to the last
  // main clip, so moving that clip moves the cam with it.
  const cam = p.tracks.layers[0][0];
  cam.lockToId = p.tracks.main[3].id;
  cam.lockOffset = 0;
  cam.reactionPair = true;
  p.sourceCredit = {
    title: "The Valley in Autumn — full walk",
    creator: "@valleywalks",
    url: "",
  };
  p.markers = [
    { id: uid("m"), time: 4, label: "Herb rows — crossfade in" },
    { id: uid("m"), time: 10, label: "The well scene" },
  ];
  p.captions = [
    { id: uid("t"), start: 0, end: 4, text: "The gate is open." },
    { id: uid("t"), start: 4, end: 8, text: "The rows remember every hand that planted them." },
    { id: uid("t"), start: 10, end: 15, text: "And the well keeps the last of the light." },
  ];
  return p;
}

// Total runtime of the main track, in seconds.
export function projectDuration(project) {
  return project.tracks.main.reduce((sum, item) => sum + item.duration, 0);
}

// Cumulative start time of each main-track item, in seconds. Item 0 starts
// at 0 — and, by default, is fully visible from 0 (Paul's rule).
export function itemStartTimes(project) {
  const starts = [];
  let t = 0;
  for (const item of project.tracks.main) {
    starts.push(t);
    t += item.duration;
  }
  return starts;
}

// Caption active at time t (seconds), or null.
export function captionAt(project, t) {
  return project.captions.find((c) => t >= c.start && t < c.end && c.text) || null;
}

// Layer items visible at time t, flattened bottom-to-top across every
// layer lane (so later entries draw over earlier ones).
export function layersAt(project, t) {
  const out = [];
  for (const lane of project.tracks.layers || []) {
    for (const o of lane) {
      if (t >= o.start && t < o.start + o.duration) out.push(o);
    }
  }
  return out;
}

// LOCKED PAIRS (Paul, Nov 4 2026 — reaction videos): a layer or
// background item can be locked to a main clip (lockToId + lockOffset).
// Locked items follow their main clip wherever it moves on the main
// track, so the two stay in sync — e.g. your camera window locked to the
// video you're reacting to. Called before every render/refresh.
export function syncLockedItems(project) {
  const starts = itemStartTimes(project);
  const byId = new Map(project.tracks.main.map((it, i) => [it.id, starts[i]]));
  const sync = (item) => {
    if (!item.lockToId) return;
    if (!byId.has(item.lockToId)) {
      delete item.lockToId;
      delete item.lockOffset;
      return;
    }
    item.start = Math.max(0, +(byId.get(item.lockToId) + (item.lockOffset || 0)).toFixed(2));
  };
  for (const lane of project.tracks.layers || []) lane.forEach(sync);
  (project.tracks.background || []).forEach(sync);
}

// Background item visible at time t (the lane behind the main video).
export function backgroundAt(project, t) {
  return (project.tracks.background || []).find(
    (b) => t >= b.start && t < b.start + b.duration
  ) || null;
}

// Back-compat name: every layer item visible at t.
export function overlaysAt(project, t) {
  return layersAt(project, t);
}

// Lift older projects into the v3 layered shape, so old files never crash
// the app: v1 (Phase 0 stills) → v3; v2 (single overlay lane) → the
// overlay lane becomes layer 1, with an empty background lane.
// Pro pass 2 defaults, filled in for any older file that predates them.
function fillPass2Defaults(project) {
  if (project.loudnessNormalize === undefined) project.loudnessNormalize = true;
  if (!project.captionMode) project.captionMode = "burn";
  if (!Array.isArray(project.cameras)) project.cameras = [];
  project.music = { duck: false, duckAmount: 0.6, ...(project.music || { src: null, volume: 0.8 }) };
  if (project.music.volume === undefined) project.music.volume = 0.8;
  return project;
}

// Lane state (pro pass 2, later in the day): per-lane Hide (eye) and
// Mute toggles, the track-header furniture every pro editor has.
//   hidden: layers[] per layer lane, background, captions — hidden lanes
//     stay on the timeline (dimmed) but leave the preview and the render.
//   muted: main (its audio renders as silence), music (left out of the
//     mix). Filled in by fillLaneState for older files.
export function fillLaneState(project) {
  const ls = project.laneState || {};
  ls.hidden = { layers: [], background: false, captions: false, ...(ls.hidden || {}) };
  if (!Array.isArray(ls.hidden.layers)) ls.hidden.layers = [];
  ls.muted = { main: false, music: false, ...(ls.muted || {}) };
  project.laneState = ls;
  return project;
}

export function isLaneHidden(project, lane, layerIdx = 0) {
  const h = project.laneState?.hidden;
  if (!h) return false;
  if (lane === "background") return Boolean(h.background);
  if (lane === "caption") return Boolean(h.captions);
  if (lane === "layer") return Boolean(h.layers?.[layerIdx]);
  return false;
}

export function migrateProject(project) {
  if (!project) return project;
  if (project.version >= 3) {
    project.tracks.layers = project.tracks.layers?.length ? project.tracks.layers : [[]];
    project.tracks.background = project.tracks.background || [];
    project.sourceCredit = project.sourceCredit || { title: "", creator: "", url: "" };
    project.settings = { width: 1920, height: 1080, fps: 30, ...(project.settings || {}) };
    project.markers = project.markers || [];
    project.exportPreset = project.exportPreset || "youtube-1080";
    return fillLaneState(fillPass2Defaults(project));
  }
  if (project.version === 2) {
    project.tracks.layers = [project.tracks.overlay || []];
    project.tracks.background = [];
    delete project.tracks.overlay;
    project.sourceCredit = project.sourceCredit || { title: "", creator: "", url: "" };
    project.settings = { width: 1920, height: 1080, fps: 30, ...(project.settings || {}) };
    project.markers = project.markers || [];
    project.exportPreset = project.exportPreset || "youtube-1080";
    project.version = 3;
    return fillLaneState(fillPass2Defaults(project));
  }
  const main = (project.stills || []).map((s) => ({
    ...newMainItem({ label: s.label, kind: s.kind === "segue" ? "segue" : "still", duration: s.duration }),
    id: s.id,
    hue: s.hue,
    transitionIn: s.transitionIn === "dissolve" ? "crossfade" : s.transitionIn || "cut",
    generated: s.generated,
    provider: s.provider,
  }));
  return fillLaneState(fillPass2Defaults({
    version: 3,
    title: project.title || "Untitled video",
    settings: { width: 1920, height: 1080, fps: 30 },
    markers: [],
    exportPreset: "youtube-1080",
    tracks: { main, layers: [[]], background: [] },
    captions: (project.captions || []).map((c) => ({ id: uid("t"), ...c })),
    music: project.music || { src: null, volume: 0.8 },
    sourceCredit: { title: "", creator: "", url: "" },
  }));
}

// --- Timecode ----------------------------------------------------------------
// Pro editors label the ruler in timecode: HH:MM:SS:FF at the project's
// frame rate. WovenCut shows the same format so the timeline reads like a
// professional one (and frame-stepping with , and . keys lands exactly).

export function formatTimecode(t, fps = 30) {
  const safe = Math.max(0, t || 0);
  const totalFrames = Math.floor(safe * fps);
  const ff = totalFrames % fps;
  const totalSeconds = Math.floor(totalFrames / fps);
  const ss = totalSeconds % 60;
  const mm = Math.floor(totalSeconds / 60) % 60;
  const hh = Math.floor(totalSeconds / 3600);
  const p2 = (n) => String(n).padStart(2, "0");
  return `${p2(hh)}:${p2(mm)}:${p2(ss)}:${p2(ff)}`;
}

// Short clock for ruler ticks: MM:SS under an hour, H:MM:SS beyond.
export function formatClock(t) {
  const safe = Math.max(0, Math.floor(t || 0));
  const ss = safe % 60;
  const mm = Math.floor(safe / 60) % 60;
  const hh = Math.floor(safe / 3600);
  const p2 = (n) => String(n).padStart(2, "0");
  return hh > 0 ? `${hh}:${p2(mm)}:${p2(ss)}` : `${p2(mm)}:${p2(ss)}`;
}
