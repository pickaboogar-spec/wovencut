// WovenCut (working title) — captions (basic editing live; full editor = Phase 2 gate)
// ---------------------------------------------------------------------------
// The model carries captions as [{ id, start, end, text }] in seconds.
// Phase 1 desktop: captions can be added (💬 Add Caption button), selected
// on the captions lane, and their words/timing edited in the inspector —
// those mutations live here and WORK. The full caption editor (drag to
// retime on the lane, per-segment auto-timing) remains the Phase 2 gate.
//
// Design constraints inherited from Paul's other work:
//  - Caption type is LARGE and legible on a phone at a glance.
//  - One caption per segment by default; free timing is the exception.

import { uid } from "./model.js";

export function listCaptions(project) {
  return [...project.captions].sort((a, b) => a.start - b.start);
}

export function addCaption(project, start, text = "") {
  const caption = {
    id: uid("t"),
    start: +start.toFixed(2),
    end: +(start + 4).toFixed(2),
    text,
  };
  project.captions.push(caption);
  return caption;
}

export function setCaptionText(project, id, text) {
  const c = project.captions.find((x) => x.id === id);
  if (c) c.text = text;
}

// Shift a caption's start/end, clamped to the project and to >= 0.5s long.
export function retimeCaption(project, id, start, end) {
  const c = project.captions.find((x) => x.id === id);
  if (!c) return;
  c.start = Math.max(0, +start.toFixed(2));
  c.end = Math.max(c.start + 0.5, +end.toFixed(2));
}

// Panel: summary + how editing works in this phase.
export function mountCaptionsEditor(project, container) {
  const n = project.captions.filter((c) => c.text).length;
  container.innerHTML =
    `<p class="stub-note">${n} caption${n === 1 ? "" : "s"} in this project. ` +
    `Add one with the 💬 Add Caption button (it lands at the playhead), ` +
    `click it on the Captions lane, and edit its words and timing in the ` +
    `inspector. The full drag-to-retime caption editor is the Phase 2 ` +
    `review gate.</p>`;
}
