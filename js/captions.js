// WovenCut (working title) — captions
// ---------------------------------------------------------------------------
// The model carries captions as [{ id, start, end, text }] in seconds.
// Captions can be added (💬 Add Caption button), selected on the captions
// lane, DRAGGED left/right on the lane to retime them (pro-upgrade batch,
// Nov 5 2026), and their words/timing edited in the inspector — those
// mutations live here and WORK. Per-segment auto-timing remains a later
// refinement.
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
    `drag it left or right on the Captions lane to retime it, and edit ` +
    `its words and exact timing in the inspector.</p>`;
}
