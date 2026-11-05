// WovenCut (working title) — app entry (Phase 0 skeleton)
// ---------------------------------------------------------------------------
// Boots the sample project, wires the preview player and timeline strip,
// and mounts the stub panels. No network calls, no dependencies.

import { RULES, projectDuration, sampleProject } from "./model.js";
import { renderTimelineStrip } from "./timeline.js";
import { Preview } from "./preview.js";
import { mountCaptionsEditor } from "./captions.js";
import { mountMusicPanel } from "./music.js";
import { mountExportPanel } from "./export.js";
import { mountReplicatePanel } from "./replicate.js";
import { mountClaudePanel } from "./muse.js";

const project = sampleProject();

const preview = new Preview(document.getElementById("preview"));
preview.load(project);

const readout = document.getElementById("readout");
const total = projectDuration(project);
preview.onTick = (t) => {
  readout.textContent = `${Math.min(t, total).toFixed(1)}s / ${total}s`;
};
readout.textContent = `0.0s / ${total}s`;

// Surface Paul's rule in the UI so anyone opening the skeleton sees it.
document.getElementById("open-note").textContent =
  RULES.FIRST_SEGMENT_FADE_IN_MS === 0
    ? "First-frame rule active: segment one opens at full strength — no fade-in."
    : "WARNING: first-segment fade-in is not 0 — this violates Paul's rule.";

document.getElementById("btn-play").addEventListener("click", (e) => {
  if (preview.playing) {
    preview.pause();
    e.target.textContent = "▶ Play";
  } else {
    if (preview.currentTime() >= total) preview.offset = 0;
    preview.play();
    e.target.textContent = "⏸ Pause";
  }
});
document.getElementById("btn-restart").addEventListener("click", () => {
  preview.restart();
  document.getElementById("btn-play").textContent = "⏸ Pause";
});

renderTimelineStrip(project, document.getElementById("timeline"));
mountCaptionsEditor(project, document.getElementById("panel-captions"));
mountMusicPanel(project, document.getElementById("panel-music"));
mountExportPanel(project, document.getElementById("panel-export"));
mountReplicatePanel(document.getElementById("panel-replicate"));
mountClaudePanel(document.getElementById("panel-Muse"));
