// WovenCut (working title) — project data model
// ---------------------------------------------------------------------------
// A project is plain JSON. Shape:
//
// {
//   "version": 1,
//   "title": "string",
//   "stills": [                       // picture track, in play order
//     {
//       "id": "s1",
//       "kind": "still" | "clip" | "segue",
//       "src": "file name or null (placeholder in the skeleton)",
//       "hue": 210,                   // skeleton only: placeholder frame colour
//       "label": "shown on the placeholder frame",
//       "duration": 4,                // seconds on screen
//       "transitionIn": "cut"         // how THIS item arrives from the previous
//                                     // one: "cut" (default) | "dissolve" |
//                                     // "segue" (an AI-generated clip)
//     },
//     {
//       "id": "g1", "kind": "segue", "generated": true,
//       "provider": "replicate",      // segue items are AI-generated clips
//       ...
//     }
//   ],
//   "captions": [ { "start": 0, "end": 4, "text": "..." } ],  // seconds
//   "music": { "src": null, "volume": 0.8 }   // file reference only
// }

export const RULES = {
  // PAUL'S FIRST-FRAME RULE — do not make this configurable per project.
  // Paul, on the woven-stills videos: "the first segment gets NO fade-in —
  // every video opens on the first image at full strength, never on black."
  // He spotted a black open on a posted video within hours and killed it.
  // Transitions apply BETWEEN segments only. Segment one starts at t=0 at
  // opacity 1. Preview obeys this; every export path must obey it too.
  FIRST_SEGMENT_FADE_IN_MS: 0,

  // Default transition for a cut when a project item doesn't specify one.
  DEFAULT_TRANSITION: "cut",
};

// Build a fresh sample project: a tiny woven-stills story used by the
// skeleton's preview. Frames are CSS/canvas-generated placeholders (hue +
// label) — no image files, no external assets.
export function sampleProject() {
  return {
    version: 1,
    title: "Sample — The Gate at Dusk (skeleton demo)",
    stills: [
      { id: "s1", kind: "still", src: null, hue: 96,  label: "The farm gate",
        duration: 4, transitionIn: RULES.DEFAULT_TRANSITION },
      { id: "s2", kind: "still", src: null, hue: 140, label: "The herb rows",
        duration: 4, transitionIn: "dissolve" },
      { id: "g1", kind: "segue", src: null, hue: 24,  label: "Segue — generated",
        duration: 2, transitionIn: "segue", generated: true, provider: "replicate" },
      { id: "s3", kind: "still", src: null, hue: 210, label: "The well at night",
        duration: 5, transitionIn: RULES.DEFAULT_TRANSITION },
    ],
    captions: [
      { start: 0,  end: 4,  text: "The gate is open." },
      { start: 4,  end: 8,  text: "The rows remember every hand that planted them." },
      { start: 8,  end: 10, text: "" }, // segue plays uncaptioned
      { start: 10, end: 15, text: "And the well keeps the last of the light." },
    ],
    music: { src: null, volume: 0.8 }, // TODO(Phase 3): user file reference
  };
}

// Total runtime of the picture track, in seconds.
export function projectDuration(project) {
  return project.stills.reduce((sum, item) => sum + item.duration, 0);
}

// Cumulative start time of each picture item, in seconds. Item 0 starts at 0
// — and is fully visible from 0 (see RULES.FIRST_SEGMENT_FADE_IN_MS).
export function itemStartTimes(project) {
  const starts = [];
  let t = 0;
  for (const item of project.stills) {
    starts.push(t);
    t += item.duration;
  }
  return starts;
}

// Caption active at time t (seconds), or null.
export function captionAt(project, t) {
  return project.captions.find((c) => t >= c.start && t < c.end && c.text) || null;
}
