// WovenCut (working title) — project data model (v2, Phase 1 desktop)
// ---------------------------------------------------------------------------
// A project is plain JSON. Shape:
//
// {
//   "version": 2,
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
//         "generated": true,          // segue items only: AI-generated
//         "provider": "replicate"     // segue items only
//       }
//     ],
//     "overlay": [                    // picture-in-picture lane (Phase 1)
//       {
//         "id": "p1", "kind": "pip",
//         "src": null, "label": "…", "hue": 280,
//         "start": 10,                // seconds on the main timeline
//         "duration": 5,
//         "corner": "bottom-right",   // top-left|top-right|bottom-left|bottom-right
//         "sizePct": 28               // % of frame width
//       }
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
  };
}

// A fresh picture-in-picture overlay item.
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

export function emptyProject(title = "Untitled video") {
  return {
    version: 2,
    title,
    tracks: { main: [], overlay: [] },
    captions: [],
    music: { src: null, volume: 0.8 },
  };
}

// Sample project for the Phase 1 review gate: placeholder frames (hue +
// label), one AI segue flagged as generated, one PiP overlay — no files.
export function sampleProject() {
  const p = emptyProject("Sample — The Gate at Dusk (Phase 1 demo)");
  p.tracks.main = [
    { ...newMainItem({ label: "The farm gate", kind: "still", duration: 4 }), hue: 96 },
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
  p.tracks.overlay = [
    { ...newOverlayItem({ label: "Corner cam — the druid", start: 10, duration: 5 }), hue: 280 },
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

// Overlay items visible at time t.
export function overlaysAt(project, t) {
  return project.tracks.overlay.filter((o) => t >= o.start && t < o.start + o.duration);
}

// Accept a Phase 0 (v1) project and lift it into v2 shape, so old sample
// files never crash the desktop app.
export function migrateProject(project) {
  if (!project || project.version >= 2) return project;
  const main = (project.stills || []).map((s) => ({
    ...newMainItem({ label: s.label, kind: s.kind === "segue" ? "segue" : "still", duration: s.duration }),
    id: s.id,
    hue: s.hue,
    transitionIn: s.transitionIn === "dissolve" ? "crossfade" : s.transitionIn || "cut",
    generated: s.generated,
    provider: s.provider,
  }));
  return {
    version: 2,
    title: project.title || "Untitled video",
    tracks: { main, overlay: [] },
    captions: (project.captions || []).map((c) => ({ id: uid("t"), ...c })),
    music: project.music || { src: null, volume: 0.8 },
  };
}
