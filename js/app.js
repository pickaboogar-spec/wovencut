// WovenCut (working title) — app entry (Phase 1 desktop)
// ---------------------------------------------------------------------------
// Boots the editor: toolbar (icon + label + tooltip on every action),
// preview player, interactive timeline, inspector, and the phase panels.
// Runs inside Electron (native dialogs + export stub via the preload
// bridge) and degrades gracefully in a plain browser for development.
//
// No network calls, no telemetry, no accounts. Files stay on this machine.

import {
  RULES, TRANSITIONS, baseName, formatTimecode, itemStartTimes, migrateProject, newMainItem,
  newOverlayItem, projectDuration, sampleProject, emptyProject,
  syncLockedItems, uid,
} from "./model.js";
import { TimelineEditor, layerIndex, removeItem, splitMainItemAt } from "./timeline.js";
import { Preview } from "./preview.js";
import { History } from "./history.js";
import { mountSettingsPanel } from "./settings.js";
import { addCaption, mountCaptionsEditor, retimeCaption, setCaptionText } from "./captions.js";
import { mountMusicPanel } from "./music.js";
import { mountExportPanel } from "./export.js";
import { mountReplicatePanel } from "./replicate.js";
import { mountClaudePanel } from "./muse.js";
import { mountReactionPanel } from "./reaction.js";
import {
  addSnapshot, clearAutosave, formatWhen, mountAutosavePanel, readAutosave,
  safeStorage, writeAutosave,
} from "./autosave.js";

const desktop = window.wovencut?.isDesktop ? window.wovencut : null;

// Auto-save & crash recovery (pro pass 2): if the last session left work
// in progress, we open WITH it and say so in the recovery banner — the
// sample project only appears on a genuinely fresh start.
const storage = safeStorage();
const bootSave = readAutosave(storage);
let project = bootSave ? migrateProject(bootSave.project) : sampleProject();
let recoveredAt = bootSave ? bootSave.savedAt : null;
let sessionDirty = Boolean(bootSave); // recovered work is worth re-saving
let autosaveTimer = null;
let selection = null; // { lane, id }

// Undo/redo (pro-upgrade batch, Nov 5 2026): refresh() records every real
// change; Ctrl+Z / Ctrl+Shift+Z walk the stacks. See history.js.
const history = new History();
history.reset(project);

const preview = new Preview(document.getElementById("preview"));
preview.load(project);

const readout = document.getElementById("readout");
const rateReadout = document.getElementById("rate-readout");
function updateReadout(t = preview.currentTime()) {
  const total = projectDuration(project);
  const fps = project.settings?.fps ?? 30;
  const tc = Math.min(Math.max(t, 0), total);
  readout.textContent = `${formatTimecode(tc, fps)} / ${formatTimecode(total, fps)}`;
  rateReadout.textContent =
    preview.playing && preview.rate !== 1
      ? `${preview.rate > 0 ? "▶▶" : "◀◀"} ${Math.abs(preview.rate)}× speed`
      : "";
  return tc;
}
preview.onTick = (t) => {
  timeline.setPlayhead(updateReadout(t));
};

document.getElementById("open-note").textContent =
  RULES.FIRST_SEGMENT_FADE_IN_MS === 0
    ? "First-frame rule is the default: a new project's first clip has fade-in 0 — it opens at full strength, never on black. Fades are tools in the inspector; the default is Paul's way."
    : "WARNING: the first-segment fade-in default is not 0 — this violates Paul's rule.";

const timeline = new TimelineEditor(document.getElementById("timeline"), {
  project: () => project,
  desktop,
  onChange: refresh,
  onSelect: (sel) => {
    selection = sel;
    renderInspector();
  },
  onSeek: (t) => preview.seek(t),
});

// Keep the preview canvas shaped like the project's frame (widescreen,
// vertical, square) so what you see is the shape you'll export.
let lastCanvasKey = "";
function fitCanvasToFrame() {
  const s = project.settings || { width: 1920, height: 1080 };
  const key = `${s.width}x${s.height}`;
  if (key === lastCanvasKey) return;
  lastCanvasKey = key;
  const cv = preview.canvas;
  if (s.width >= s.height) {
    cv.width = 960;
    cv.height = Math.max(120, Math.round((960 * s.height) / s.width));
  } else {
    cv.height = 960;
    cv.width = Math.max(120, Math.round((960 * s.width) / s.height));
  }
}

function refresh() {
  history.noteChange(project); // undo history records real changes only
  if (history.canUndo()) sessionDirty = true;
  // Auto-save (pro pass 2): debounce so a burst of edits writes once.
  if (sessionDirty && storage) {
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => writeAutosave(storage, project), 1200);
  }
  syncLockedItems(project); // locked pairs follow their main clip
  fitCanvasToFrame();
  timeline.render();
  renderInspector();
  mountPanels();
  preview.draw(preview.currentTime());
  updateReadout();
  const undoBtn = document.getElementById("btn-undo");
  const redoBtn = document.getElementById("btn-redo");
  if (undoBtn) undoBtn.disabled = !history.canUndo();
  if (redoBtn) redoBtn.disabled = !history.canRedo();
}

// Adopt a project handed back by undo/redo (history already points at
// this exact state, so refresh's noteChange sees no new change).
function applyRestored(next) {
  project = next;
  selection = null;
  timeline.selection = null;
  preview.load(project);
  refresh();
}

function doUndo() {
  const prev = history.undo();
  if (prev) applyRestored(prev);
}

function doRedo() {
  const nxt = history.redo();
  if (nxt) applyRestored(nxt);
}

function mountPanels() {
  mountSettingsPanel(project, document.getElementById("panel-settings"), {
    onChange: refresh,
  });
  mountAutosavePanel(project, document.getElementById("panel-autosave"), {
    storage,
    onTouched: refresh,
    onRestore: (restored) => {
      project = migrateProject(restored);
      selection = null;
      timeline.selection = null;
      sessionDirty = true;
      history.reset(project);
      preview.load(project);
      refresh();
    },
  });
  mountCaptionsEditor(project, document.getElementById("panel-captions"), {
    onChange: refresh,
    saveTextFile: desktop
      ? (name, text) => desktop.saveTextFile(name, text)
      : null,
  });
  mountMusicPanel(project, document.getElementById("panel-music"));
  mountExportPanel(project, document.getElementById("panel-export"), {
    onChange: refresh,
    runExport: desktop
      ? async (p) => {
          const out = await desktop.saveVideoDialog(`${p.title || "wovencut"}.mp4`);
          if (!out) return { message: "Export cancelled at the save dialog." };
          return desktop.runExport(p, out);
        }
      : null,
    saveTextFile: desktop
      ? (name, text) => desktop.saveTextFile(name, text)
      : null,
  });
  mountReplicatePanel(document.getElementById("panel-replicate"));
  mountClaudePanel(document.getElementById("panel-Muse"));
}

// --- Inspector ---------------------------------------------------------------
// Context controls for whatever is selected. Every field: icon + plain
// label + tooltip (the design rule). Number fields apply on change.

const inspectorBody = document.getElementById("inspector-body");

function numField({ id, icon, label, title, value, step = "0.1", min = "0" }) {
  return `
    <label class="insp-field" title="${title}">
      <span class="insp-label">${icon} ${label}</span>
      <input type="number" id="${id}" value="${value}" step="${step}" min="${min}">
    </label>`;
}

function renderInspector() {
  const p = project;
  if (!selection) {
    inspectorBody.innerHTML =
      `<p class="stub-note">Nothing selected. Click any clip, overlay, ` +
      `caption or the music bed on the timeline and its controls appear ` +
      `here — trim, fades, transitions, position.</p>`;
    return;
  }
  const { lane, id } = selection;

  if (lane === "main") {
    const starts = itemStartTimes(p);
    const i = p.tracks.main.findIndex((it) => it.id === id);
    if (i === -1) return void (selection = null, renderInspector());
    const it = p.tracks.main[i];
    inspectorBody.innerHTML = `
      <h3>${it.kind === "segue" ? "✨" : it.kind === "still" ? "🖼️" : "🎬"} ${escapeHtml(it.label)}</h3>
      <p class="insp-meta">Clip ${i + 1} of ${p.tracks.main.length} · starts at ${starts[i].toFixed(1)}s
        ${it.src ? `<br>File: ${escapeHtml(it.src)}` : "<br>Placeholder frame (skeleton sample)"}</p>
      ${numField({ id: "f-duration", icon: "⏱️", label: "Plays for (seconds)",
        title: "How long this clip stays on screen", value: it.duration })}
      ${numField({ id: "f-trimin", icon: "📐", label: "Trim — skip from start (seconds)",
        title: "Cut this many seconds off the beginning of the source clip", value: it.trimIn })}
      ${numField({ id: "f-fadein", icon: "🌅", label: "Fade in (seconds)",
        title: "Fade this clip in from black over this many seconds. 0 = appears at full strength instantly. The FIRST clip of a new project is 0 by default — Paul's rule: his videos open at full strength, never on a fade from black. Raise it only if you want the fade.", value: it.fadeIn })}
      ${numField({ id: "f-fadeout", icon: "🌇", label: "Fade out (seconds)",
        title: "Fade this clip out to black over this many seconds at its end. 0 = hard cut away.", value: it.fadeOut })}
      <label class="insp-field" title="How this clip arrives FROM the previous clip. Cut is an instant switch; Crossfade blends the two together; the Dips pass through black or white between the clips; Wipe and Slide push the new clip across the old one. The length below sets how long the join takes. (Transitions never apply to the very first clip — a video always opens on its first frame at full strength.)">
        <span class="insp-label">⤨ Transition in</span>
        <select id="f-transition">
          ${TRANSITIONS.map((t) => `<option value="${t.id}" ${it.transitionIn === t.id ? "selected" : ""}>${t.icon} ${t.label}</option>`).join("")}
        </select>
      </label>
      ${numField({ id: "f-transdur", icon: "⤨", label: "Transition length (seconds)",
        title: "How long the join lasts (only used when Transition in is not Cut)", value: it.transitionDuration })}
      <label class="insp-field" title="Tick this when this clip was filmed in front of a green screen: the green is knocked out and the Background lane shows through behind the person. Layer lanes still draw on top.">
        <span class="insp-label">🟩 Green screen</span>
        <span><input type="checkbox" id="f-keygreen" ${it.keyGreen ? "checked" : ""}> This clip is green screen — show the background behind it</span>
      </label>
      <div class="insp-actions">
        <button type="button" class="tool-btn" data-act="split"
          title="Split this clip into two at the playhead">✂️ Split at Playhead</button>
        <button type="button" class="tool-btn danger" data-act="delete"
          title="Remove this clip from the timeline">🗑️ Delete Clip</button>
      </div>`;
    bindNum("f-duration", (v) => { it.duration = Math.max(0.1, v); });
    bindNum("f-trimin", (v) => { it.trimIn = Math.max(0, v); });
    bindNum("f-fadein", (v) => { it.fadeIn = Math.max(0, v); });
    bindNum("f-fadeout", (v) => { it.fadeOut = Math.max(0, v); });
    bindNum("f-transdur", (v) => { it.transitionDuration = Math.max(0.1, v); });
    inspectorBody.querySelector("#f-transition").addEventListener("change", (e) => {
      it.transitionIn = e.target.value;
      refresh();
    });
    inspectorBody.querySelector("#f-keygreen").addEventListener("change", (e) => {
      it.keyGreen = e.target.checked;
      refresh();
    });
    wireInspectorActions(lane, id);
    return;
  }

  if (lane === "overlay" || layerIndex(lane) >= 0) {
    const li = lane === "overlay" ? 0 : layerIndex(lane);
    const o = (p.tracks.layers[li] || []).find((x) => x.id === id);
    if (!o) return void (selection = null, renderInspector());
    inspectorBody.innerHTML = `
      <h3>🪟 ${escapeHtml(o.label)}</h3>
      <p class="insp-meta">Layer ${li + 1} item — floats in a corner over everything on the lanes below it (layer 1 sits just over the main video; higher layers draw on top).</p>
      ${numField({ id: "f-start", icon: "⏱️", label: "Starts at (seconds)",
        title: "When in the video this overlay appears", value: o.start })}
      ${numField({ id: "f-duration", icon: "⏱️", label: "Stays for (seconds)",
        title: "How long the overlay stays on screen", value: o.duration })}
      <label class="insp-field" title="Which corner of the frame the overlay window sits in">
        <span class="insp-label">🧭 Corner</span>
        <select id="f-corner">
          ${["top-left", "top-right", "bottom-left", "bottom-right"].map((c) =>
            `<option value="${c}" ${o.corner === c ? "selected" : ""}>${c.replace("-", " ")}</option>`).join("")}
        </select>
      </label>
      <label class="insp-field" title="How wide the overlay window is, as a percentage of the video's width">
        <span class="insp-label">🔍 Size — <span id="size-readout">${o.sizePct}%</span> of frame width</span>
        <input type="range" id="f-size" min="10" max="60" step="1" value="${o.sizePct}">
      </label>
      ${o.lockToId ? `
      <p class="insp-meta">🔒 <strong>Locked to a main clip</strong> (${escapeHtml(p.tracks.main.find((m) => m.id === o.lockToId)?.label || "gone")}) — this window moves with that clip, so the two stay in sync. Changing "Starts at" shifts it relative to the clip.</p>
      <div class="insp-actions">
        <button type="button" class="tool-btn" data-act="unlock"
          title="Unlock this window from its main clip — it will stay where it is when clips move">🔓 Unlock</button>
      </div>` : `
      <div class="insp-actions">
        <button type="button" class="tool-btn" data-act="reaction"
          title="Lock this window to the main clip under it — the reaction-video setup: the main clip plays, this window rides in the corner, and the two stay in sync when clips move">📺 Lock to main clip — reaction pair</button>
      </div>`}
      <div class="insp-actions">
        <button type="button" class="tool-btn danger" data-act="delete"
          title="Remove this item from its layer">🗑️ Delete Layer Item</button>
      </div>
      <p class="stub-note">Full compositing (real video inside the window) renders
        in the Phase 4 export via FFmpeg's overlay filter; the preview already
        shows position and size.</p>`;
    bindNum("f-start", (v) => {
      if (o.lockToId) {
        // Locked: "starts at" edits the offset from its main clip.
        const starts = itemStartTimes(p);
        const idx = p.tracks.main.findIndex((m) => m.id === o.lockToId);
        if (idx >= 0) o.lockOffset = +(Math.max(0, v) - starts[idx]).toFixed(2);
      } else {
        o.start = Math.max(0, v);
      }
    });
    bindNum("f-duration", (v) => { o.duration = Math.max(0.1, v); });
    inspectorBody.querySelector('[data-act="reaction"]')?.addEventListener("click", () => {
      const starts = itemStartTimes(p);
      let idx = p.tracks.main.findIndex((m, i) => o.start >= starts[i] && o.start < starts[i] + m.duration);
      if (idx === -1) idx = p.tracks.main.length - 1;
      if (idx < 0) return;
      o.lockToId = p.tracks.main[idx].id;
      o.lockOffset = +(o.start - starts[idx]).toFixed(2);
      o.reactionPair = true;
      refresh();
    });
    inspectorBody.querySelector('[data-act="unlock"]')?.addEventListener("click", () => {
      delete o.lockToId;
      delete o.lockOffset;
      delete o.reactionPair;
      refresh();
    });
    inspectorBody.querySelector("#f-corner").addEventListener("change", (e) => {
      o.corner = e.target.value;
      refresh();
    });
    const size = inspectorBody.querySelector("#f-size");
    size.addEventListener("input", (e) => {
      o.sizePct = +e.target.value;
      inspectorBody.querySelector("#size-readout").textContent = `${o.sizePct}%`;
      preview.draw(preview.currentTime());
    });
    size.addEventListener("change", refresh);
    wireInspectorActions(lane, id);
    return;
  }

  if (lane === "background") {
    const b = p.tracks.background.find((x) => x.id === id);
    if (!b) return void (selection = null, renderInspector());
    inspectorBody.innerHTML = `
      <h3>🌄 ${escapeHtml(b.label)}</h3>
      <p class="insp-meta">Background — fills the whole frame BEHIND the main video. It shows through wherever a main clip is marked 🟩 green screen.</p>
      ${numField({ id: "f-start", icon: "⏱️", label: "Starts at (seconds)",
        title: "When this background appears", value: b.start })}
      ${numField({ id: "f-duration", icon: "⏱️", label: "Stays for (seconds)",
        title: "How long this background stays behind the video", value: b.duration })}
      <div class="insp-actions">
        <button type="button" class="tool-btn danger" data-act="delete"
          title="Remove this background item">🗑️ Delete Background</button>
      </div>`;
    bindNum("f-start", (v) => { b.start = Math.max(0, v); });
    bindNum("f-duration", (v) => { b.duration = Math.max(0.1, v); });
    wireInspectorActions(lane, id);
    return;
  }

  if (lane === "caption") {
    const c = p.captions.find((x) => x.id === id);
    if (!c) return void (selection = null, renderInspector());
    inspectorBody.innerHTML = `
      <h3>💬 Caption</h3>
      <label class="insp-field" title="The words that appear on screen">
        <span class="insp-label">✏️ Caption words</span>
        <input type="text" id="f-captext" value="${escapeHtml(c.text)}" placeholder="Type the caption…">
      </label>
      ${numField({ id: "f-start", icon: "⏱️", label: "Appears at (seconds)",
        title: "When this caption appears", value: c.start })}
      ${numField({ id: "f-end", icon: "⏱️", label: "Disappears at (seconds)",
        title: "When this caption leaves the screen", value: c.end })}
      <div class="insp-actions">
        <button type="button" class="tool-btn danger" data-act="delete"
          title="Delete this caption">🗑️ Delete Caption</button>
      </div>`;
    inspectorBody.querySelector("#f-captext").addEventListener("change", (e) => {
      setCaptionText(p, id, e.target.value);
      refresh();
    });
    const applyTime = () => {
      const s = parseFloat(inspectorBody.querySelector("#f-start").value);
      const e2 = parseFloat(inspectorBody.querySelector("#f-end").value);
      if (Number.isFinite(s) && Number.isFinite(e2)) {
        retimeCaption(p, id, s, e2);
        refresh();
      }
    };
    inspectorBody.querySelector("#f-start").addEventListener("change", applyTime);
    inspectorBody.querySelector("#f-end").addEventListener("change", applyTime);
    wireInspectorActions(lane, id);
    return;
  }

  if (lane === "marker") {
    const m = (p.markers || []).find((x) => x.id === id);
    if (!m) return void (selection = null, renderInspector());
    inspectorBody.innerHTML = `
      <h3>🚩 Marker</h3>
      <p class="insp-meta">Sits on the ruler at ${formatTimecode(m.time, p.settings?.fps ?? 30)} (${m.time}s).
        Markers are your bookmarks — chapters, beats, or "fix this bit later" notes. They never appear in the exported video.</p>
      <label class="insp-field" title="What this marker means — a chapter name, a beat, a note to yourself">
        <span class="insp-label">🏷️ Marker name</span>
        <input type="text" id="f-marker-label" value="${escapeHtml(m.label || "")}" placeholder="e.g. Chapter 2 — the well">
      </label>
      ${numField({ id: "f-markertime", icon: "⏱️", label: "At time (seconds)",
        title: "Move the marker to this time on the ruler", value: m.time })}
      <div class="insp-actions">
        <button type="button" class="tool-btn" data-act="jump"
          title="Move the playhead to this marker">▶️ Jump Playhead Here</button>
        <button type="button" class="tool-btn danger" data-act="delete"
          title="Remove this marker from the ruler">🗑️ Delete Marker</button>
      </div>`;
    inspectorBody.querySelector("#f-marker-label").addEventListener("change", (e) => {
      m.label = e.target.value;
      refresh();
    });
    bindNum("f-markertime", (v) => { m.time = Math.max(0, +v.toFixed(2)); });
    inspectorBody.querySelector('[data-act="jump"]').addEventListener("click", () => {
      preview.seek(m.time);
    });
    wireInspectorActions(lane, id);
    return;
  }

  if (lane === "music") {
    inspectorBody.innerHTML = `
      <h3>🎵 Music bed</h3>
      <p class="insp-meta">${p.music?.src ? escapeHtml(p.music.src) : "No music file chosen."}</p>
      <label class="insp-field" title="How loud the music sits under the video, 0–100%">
        <span class="insp-label">🔊 Volume — <span id="vol-readout">${Math.round((p.music?.volume ?? 0.8) * 100)}%</span></span>
        <input type="range" id="f-volume" min="0" max="100" step="1"
          value="${Math.round((p.music?.volume ?? 0.8) * 100)}">
      </label>
      <label class="insp-field" title="Ducking dips the music automatically while your clips are making sound, so speech stays clear on top of it — then brings it back up in the quiet gaps. The dip follows your clips' real decoded waveforms, the curve is drawn on the music block on the timeline, and the export applies it with a sidechain compressor listening to the real audio.">
        <span class="insp-label">🦆 Ducking — dip the music under speech</span>
        <span><input type="checkbox" id="f-duck" ${p.music?.duck ? "checked" : ""}> Dip the music while the main track is loud</span>
      </label>
      <label class="insp-field" title="How far the music dips while the main track is loud. 60% means the music falls to 40% of its set volume under speech.">
        <span class="insp-label">🎚️ Dip strength — <span id="duck-readout">${Math.round((p.music?.duckAmount ?? 0.6) * 100)}%</span></span>
        <input type="range" id="f-duckamt" min="0" max="90" step="5"
          value="${Math.round((p.music?.duckAmount ?? 0.6) * 100)}">
      </label>
      <div class="insp-actions">
        <button type="button" class="tool-btn danger" data-act="delete"
          title="Remove the music bed">🗑️ Remove Music</button>
      </div>
      <p class="stub-note">Playback sync with the preview arrives in Phase 3. Ducking is modelled and drawn now, and applied by the render.</p>`;
    inspectorBody.querySelector("#f-volume").addEventListener("input", (e) => {
      p.music.volume = +e.target.value / 100;
      inspectorBody.querySelector("#vol-readout").textContent = `${e.target.value}%`;
    });
    inspectorBody.querySelector("#f-volume").addEventListener("change", refresh);
    inspectorBody.querySelector("#f-duck").addEventListener("change", (e) => {
      p.music.duck = e.target.checked;
      refresh();
    });
    inspectorBody.querySelector("#f-duckamt").addEventListener("input", (e) => {
      p.music.duckAmount = +e.target.value / 100;
      inspectorBody.querySelector("#duck-readout").textContent = `${e.target.value}%`;
      timeline.render(); // the duck curve on the music block follows live
    });
    inspectorBody.querySelector("#f-duckamt").addEventListener("change", refresh);
    wireInspectorActions(lane, id);
  }
}

function bindNum(idSel, apply) {
  const el = inspectorBody.querySelector(`#${idSel}`);
  if (!el) return;
  el.addEventListener("change", () => {
    const v = parseFloat(el.value);
    if (Number.isFinite(v)) {
      apply(v);
      refresh();
    }
  });
}

function wireInspectorActions(lane, id) {
  inspectorBody.querySelectorAll("[data-act]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.act === "delete") doDelete();
      if (btn.dataset.act === "split") doSplit();
    });
  });
}

function doDelete() {
  if (!selection) return;
  removeItem(project, selection.lane, selection.id);
  selection = null;
  timeline.selection = null;
  refresh();
}

function doSplit() {
  const t = preview.currentTime();
  // Split the selected main clip at the playhead; if the playhead isn't
  // inside it, split whichever clip IS under the playhead (the way pro
  // editors' razor-at-playhead behaves).
  let targetId = selection?.lane === "main" ? selection.id : null;
  let newId = targetId ? splitMainItemAt(project, targetId, t) : null;
  if (!newId) {
    const starts = itemStartTimes(project);
    const idx = project.tracks.main.findIndex(
      (it, i) => t > starts[i] + 0.05 && t < starts[i] + it.duration - 0.05
    );
    if (idx === -1) {
      if (targetId) refresh();
      return;
    }
    targetId = project.tracks.main[idx].id;
    newId = splitMainItemAt(project, targetId, t);
  }
  if (newId) {
    selection = { lane: "main", id: newId };
    timeline.selection = selection;
  }
  refresh();
}

function addMarkerAtPlayhead() {
  const m = {
    id: uid("m"),
    time: +preview.currentTime().toFixed(2),
    label: "",
  };
  (project.markers ||= []).push(m);
  project.markers.sort((a, b) => a.time - b.time);
  selection = { lane: "marker", id: m.id };
  timeline.selection = selection;
  refresh();
  inspectorBody.querySelector("#f-marker-label")?.focus();
}

// --- Toolbar -----------------------------------------------------------------

const $ = (id) => document.getElementById(id);

$("btn-play").addEventListener("click", (e) => {
  if (preview.playing) {
    preview.pause();
    e.currentTarget.innerHTML = "▶️ Play";
  } else {
    if (preview.currentTime() >= projectDuration(project)) preview.offset = 0;
    preview.play();
    e.currentTarget.innerHTML = "⏸️ Pause";
  }
});
$("btn-restart").addEventListener("click", () => {
  preview.restart();
  $("btn-play").innerHTML = "⏸️ Pause";
});

// Before the current project is replaced (New / Open), snapshot it —
// replacing work is never a loss (pro pass 2).
function snapshotBeforeReplace(label) {
  if (storage && project.tracks.main.length) {
    addSnapshot(storage, project, label);
  }
}

$("btn-new").addEventListener("click", () => {
  snapshotBeforeReplace("auto — before New Project");
  project = emptyProject();
  selection = null;
  timeline.selection = null;
  sessionDirty = false;
  clearAutosave(storage);
  history.reset(project); // a new project starts with a clean undo history
  preview.load(project);
  refresh();
});

$("btn-open").addEventListener("click", async () => {
  if (desktop) {
    const res = await desktop.openProjectDialog();
    if (!res) return;
    snapshotBeforeReplace("auto — before opening another project");
    project = migrateProject(res.project);
  } else {
    $("file-open").click();
    return;
  }
  selection = null;
  timeline.selection = null;
  sessionDirty = true;
  history.reset(project);
  preview.load(project);
  refresh();
});
$("file-open").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  snapshotBeforeReplace("auto — before opening another project");
  project = migrateProject(JSON.parse(await file.text()));
  selection = null;
  timeline.selection = null;
  sessionDirty = true;
  history.reset(project);
  preview.load(project);
  refresh();
});

$("btn-save").addEventListener("click", async () => {
  if (desktop) {
    await desktop.saveProjectDialog(project);
  } else {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([JSON.stringify(project, null, 2)], { type: "application/json" }));
    a.download = `${project.title || "untitled"}.wovencut.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
});

$("btn-import").addEventListener("click", async () => {
  if (desktop) {
    const paths = await desktop.openMediaDialog();
    if (paths.length) timeline.addPaths(paths, "main");
  } else {
    $("file-import").click();
  }
});
$("file-import").addEventListener("change", async (e) => {
  if (e.target.files.length) await timeline.addFiles(e.target.files, "main");
  e.target.value = "";
});

$("btn-reaction").addEventListener("click", () => {
  // One-click reaction setup (Paul, Nov 4 2026): the video being reacted
  // to plays on the main track; your camera rides in a corner window on
  // layer 1, LOCKED to the first main clip so the pair stays in sync.
  if (!project.tracks.main.length) {
    project.tracks.main.push({
      ...newMainItem({ label: "Video you're reacting to", kind: "clip", duration: 30 }),
      hue: 210,
    });
  }
  let cam = (project.tracks.layers[0] || []).find((o) => o.lockToId);
  if (!cam) {
    const first = project.tracks.main[0];
    cam = {
      ...newOverlayItem({
        label: "You — your camera",
        start: 0,
        duration: Math.min(first.duration, 30),
      }),
      hue: 280,
      lockToId: first.id,
      lockOffset: 0,
      reactionPair: true,
    };
    (project.tracks.layers[0] ||= []).push(cam);
  }
  selection = { lane: "layer:0", id: cam.id };
  timeline.selection = selection;
  refresh();
  document.getElementById("timeline")
    .scrollIntoView({ behavior: "smooth", block: "center" });
});

$("btn-caption").addEventListener("click", () => {
  const c = addCaption(project, preview.currentTime(), "");
  selection = { lane: "caption", id: c.id };
  timeline.selection = selection;
  refresh();
  inspectorBody.querySelector("#f-captext")?.focus();
});

$("btn-music").addEventListener("click", async () => {
  if (desktop) {
    const p = await desktop.openAudioDialog();
    if (p) {
      project.music = { ...(project.music || {}), src: p, volume: project.music?.volume ?? 0.8 };
      refresh();
    }
  } else {
    $("file-music").click();
  }
});
$("file-music").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (file) {
    project.music = { ...(project.music || {}), src: file.name, volume: project.music?.volume ?? 0.8 };
    refresh();
  }
  e.target.value = "";
});

$("btn-split").addEventListener("click", doSplit);
$("btn-delete").addEventListener("click", doDelete);
$("btn-undo").addEventListener("click", doUndo);
$("btn-redo").addEventListener("click", doRedo);
$("btn-marker").addEventListener("click", addMarkerAtPlayhead);
$("btn-shortcuts").addEventListener("click", () => {
  document.getElementById("panel-shortcuts-wrap")
    .scrollIntoView({ behavior: "smooth", block: "center" });
});
$("btn-trim").addEventListener("click", () => {
  const el = inspectorBody.querySelector("#f-trimin") ||
    inspectorBody.querySelector("#f-duration");
  if (el) {
    el.focus();
    el.select();
  } else {
    inspectorBody.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});
$("btn-export").addEventListener("click", () => {
  document.getElementById("panel-export-wrap")
    .scrollIntoView({ behavior: "smooth", block: "center" });
  document.querySelector('#panel-export [data-action="run-export"]')?.click();
});
$("btn-record").addEventListener("click", () => {
  document.getElementById("panel-reaction-wrap")
    .scrollIntoView({ behavior: "smooth", block: "center" });
});
$("btn-segue").addEventListener("click", () => {
  document.getElementById("panel-replicate-wrap")
    .scrollIntoView({ behavior: "smooth", block: "center" });
});
$("btn-Muse").addEventListener("click", () => {
  document.getElementById("panel-claude-wrap")
    .scrollIntoView({ behavior: "smooth", block: "center" });
});

// --- Keyboard shortcuts --------------------------------------------------------
// The pro transport + edit keys, listed in the ⌨️ Shortcuts panel. All of
// them pause while the user is typing in a field, so letters never fight
// captions or names. Space also steps aside for buttons (it "presses" a
// focused button natively, like every desktop app).

function setPlayButtonLabel() {
  $("btn-play").innerHTML = preview.playing ? "⏸️ Pause" : "▶️ Play";
}

document.addEventListener("keydown", (e) => {
  const tag = document.activeElement?.tagName || "";
  const typing = /INPUT|TEXTAREA|SELECT/.test(tag) ||
    document.activeElement?.isContentEditable;
  if (typing) return;

  const fps = project.settings?.fps ?? 30;
  const t = preview.currentTime();
  const total = projectDuration(project);

  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
    e.preventDefault();
    if (e.shiftKey) doRedo();
    else doUndo();
    return;
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
    e.preventDefault();
    doRedo();
    return;
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
    e.preventDefault();
    $("btn-save").click();
    return;
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "o") {
    e.preventDefault();
    $("btn-open").click();
    return;
  }
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  switch (e.key) {
    case " ":
      if (tag === "BUTTON") return; // space presses the focused button
      e.preventDefault();
      if (preview.playing) preview.pause();
      else {
        if (t >= total) preview.offset = 0;
        preview.play();
      }
      setPlayButtonLabel();
      updateReadout();
      break;
    case "j":
    case "J": {
      const r = preview.playing
        ? (preview.rate < 0 ? Math.max(-4, preview.rate * 2) : -1)
        : -1;
      preview.setRate(r);
      setPlayButtonLabel();
      updateReadout();
      break;
    }
    case "l":
    case "L": {
      const r = preview.playing
        ? (preview.rate > 0 ? Math.min(4, preview.rate * 2) : 1)
        : 1;
      preview.setRate(r);
      setPlayButtonLabel();
      updateReadout();
      break;
    }
    case "k":
    case "K":
      preview.pause();
      setPlayButtonLabel();
      updateReadout();
      break;
    case "ArrowLeft":
      e.preventDefault();
      preview.seek(t - (e.shiftKey ? 5 : 1));
      break;
    case "ArrowRight":
      e.preventDefault();
      preview.seek(t + (e.shiftKey ? 5 : 1));
      break;
    case ",":
      preview.seek(t - 1 / fps);
      break;
    case ".":
      preview.seek(t + 1 / fps);
      break;
    case "Home":
      e.preventDefault();
      preview.seek(0);
      break;
    case "End":
      e.preventDefault();
      preview.seek(total);
      break;
    case "s":
    case "S":
      doSplit();
      break;
    case "m":
    case "M":
      addMarkerAtPlayhead();
      break;
    case "n":
    case "N":
      timeline.snapping = !timeline.snapping;
      timeline.render();
      break;
    case "+":
    case "=":
      timeline.zoomBy(1.25);
      break;
    case "-":
    case "_":
      timeline.zoomBy(1 / 1.25);
      break;
    case "Delete":
      if (selection) doDelete();
      break;
  }
});

refresh(); // first full render: panels, inspector, timecode, undo state

// Crash-recovery banner: visible only when this session opened with
// recovered work in progress. Keep = carry on; Discard = the sample
// project instead (the recovered state stays reachable in Snapshots —
// discarding snapshots it first, so even this is reversible).
if (recoveredAt) {
  const bar = document.getElementById("recovery-bar");
  document.getElementById("recovery-text").textContent =
    `🛟 Recovered your work in progress — auto-saved ${formatWhen(recoveredAt)}. ` +
    `It's loaded and ready below.`;
  bar.hidden = false;
  document.getElementById("btn-recovery-keep").addEventListener("click", () => {
    bar.hidden = true;
  });
  document.getElementById("btn-recovery-discard").addEventListener("click", () => {
    addSnapshot(storage, project, "auto — recovered work, discarded at startup");
    project = sampleProject();
    selection = null;
    timeline.selection = null;
    sessionDirty = false;
    clearAutosave(storage);
    history.reset(project);
    preview.load(project);
    bar.hidden = true;
    refresh();
  });
}

// Flush the auto-save if the window closes mid-debounce.
window.addEventListener("beforeunload", () => {
  if (sessionDirty) writeAutosave(storage, project);
});

// The reaction recorder mounts ONCE (not in mountPanels): it holds live
// camera/recorder state that a refresh must never wipe mid-take.
mountReactionPanel(document.getElementById("panel-reaction"), {
  getProject: () => project,
  desktop,
  onPairCreated: (sel) => {
    selection = sel;
    timeline.selection = sel;
    refresh();
  },
});

function escapeHtml(s = "") {
  return String(s).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[ch]));
}
