// WovenCut (working title) — export (STUB, Phase 4)
// ---------------------------------------------------------------------------
// PLANNED RENDER PATH — ffmpeg.wasm, in the browser, on the user's machine:
//
//   1. Phase 4 adds @ffmpeg/ffmpeg (ffmpeg.wasm build) as the ONLY runtime
//      dependency this project is currently planning to take on. It is NOT
//      vendored into this skeleton and must not be downloaded by the
//      skeleton — offline Phase 0 stays dependency-free.
//   2. Frames: each still is staged as an image input looped for its
//      duration; clips and segue items pass through as video inputs.
//   3. Filters: scale/pad to the project canvas size; `xfade` ONLY for cuts
//      whose transitionIn is "dissolve"; plain concatenation otherwise.
//   4. Captions: burned in with drawtext/subtitles at the same size and
//      backing-band style the preview uses (what you preview is what ships).
//   5. Music: the user's file mixed under the picture at project volume.
//   6. Output: MP4 (H.264 + AAC), rendered locally, downloaded by the user.
//      Nothing is uploaded anywhere — export works offline once the wasm
//      core is cached.
//
// FIRST-FRAME RULE IN EXPORT (Paul's rule, non-negotiable):
// the rendered file's first frame is segment one at full opacity at t=0.
// No fade-in filter may ever be applied to the head of the first segment —
// in ffmpeg terms: no `fade=t=in` on the first input, no black lead-in,
// no title card inserted before it. Any future export preset that wants a
// fade-in must apply it somewhere other than the open, or be rejected.
//
// TODO(Phase 4): load ffmpeg.wasm, build the filtergraph from the model,
// progress reporting, cancel, download link.

export function planExport(project) {
  // Returns the human-readable render plan the Phase 4 implementation will
  // execute — useful for Paul's review gate even before it can run.
  return {
    engine: "ffmpeg.wasm (planned, not yet a dependency)",
    output: "MP4 — H.264 + AAC, rendered locally in the browser",
    segments: project.stills.length,
    firstFrame: "segment 1 at full opacity from t=0 — no fade-in (Paul's rule)",
    captions: "burned in, preview-identical styling",
    music: project.music?.src || "none chosen",
  };
}

export function mountExportPanel(project, container) {
  const plan = planExport(project);
  container.innerHTML =
    `<p class="stub-note">Export arrives in Phase 4 (${plan.engine}).<br>` +
    `First frame: ${plan.firstFrame}.</p>`;
}
