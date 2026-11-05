// WovenCut (working title) — captions editor (STUB, Phase 2)
// ---------------------------------------------------------------------------
// Interface only. The model already carries captions as
// [{ start, end, text }] in seconds (see model.js); Phase 2 builds the
// editing UI on top of these functions.
//
// Design constraints inherited from Paul's other demo work:
//  - Caption type is LARGE and legible on a phone at a glance.
//  - One caption per segment by default; free timing is the exception.
// TODO(Phase 2): caption list UI, per-segment text fields, retime by drag.

export function listCaptions(project) {
  return [...project.captions];
}

// TODO(Phase 2): mutate project.captions, re-render preview + timeline.
export function setCaptionText(project, index, text) {
  throw new Error("captions.setCaptionText — not implemented until Phase 2");
}

// TODO(Phase 2): shift a caption's start/end, clamped to neighbours.
export function retimeCaption(project, index, start, end) {
  throw new Error("captions.retimeCaption — not implemented until Phase 2");
}

// Mount point for the Phase 2 editor panel.
export function mountCaptionsEditor(project, container) {
  container.innerHTML =
    `<p class="stub-note">Captions editor arrives in Phase 2. ` +
    `This project carries ${project.captions.filter((c) => c.text).length} ` +
    `captions, already rendering in the preview.</p>`;
}
