// WovenCut (working title) — timeline model + strip renderer
// ---------------------------------------------------------------------------
// The timeline model is the picture track viewed as a sequence of cuts.
// Rendering here is the read-only strip under the preview; real editing
// (drag, trim, reorder) arrives in Phase 1.

import { itemStartTimes, projectDuration } from "./model.js";

// One entry per picture item, with its placement on the track.
export function timelineEntries(project) {
  const starts = itemStartTimes(project);
  return project.stills.map((item, i) => ({
    index: i,
    item,
    start: starts[i],
    end: starts[i] + item.duration,
    // The first item has no incoming cut — it opens the video (Paul's rule).
    transitionIn: i === 0 ? null : item.transitionIn || "cut",
  }));
}

// Render the track as a horizontal strip of blocks, widths proportional to
// duration, each labelled with its cut type. Segue items are flagged as
// AI-generated so a user always knows which frames cost them money.
export function renderTimelineStrip(project, container) {
  const total = projectDuration(project);
  container.innerHTML = "";
  for (const entry of timelineEntries(project)) {
    const block = document.createElement("div");
    block.className = "tl-block" + (entry.item.generated ? " tl-segue" : "");
    block.style.flexGrow = String(entry.item.duration);
    block.title =
      `${entry.item.label} — ${entry.item.duration}s` +
      (entry.transitionIn ? ` — in: ${entry.transitionIn}` : " — opens the video") +
      (entry.item.generated ? " — AI-generated (Replicate)" : "");
    block.innerHTML =
      `<span class="tl-label">${entry.item.label}</span>` +
      `<span class="tl-meta">${entry.item.duration}s` +
      (entry.transitionIn ? ` · ${entry.transitionIn}` : " · open") +
      (entry.item.generated ? " · AI" : "") +
      `</span>`;
    container.appendChild(block);
  }
  const scale = document.createElement("div");
  scale.className = "tl-scale";
  scale.textContent = `Total ${total}s`;
  container.appendChild(scale);
}
