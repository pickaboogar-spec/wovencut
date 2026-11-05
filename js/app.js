// WovenCut (working title) — app entry (Phase 1 desktop)
// ---------------------------------------------------------------------------
// Boots the editor: toolbar (icon + label + tooltip on every action),
// preview player, interactive timeline, inspector, and the phase panels.
// Runs inside Electron (native dialogs + export stub via the preload
// bridge) and degrades gracefully in a plain browser for development.
//
// No network calls, no telemetry, no accounts. Files stay on this machine.

import {
  RULES, baseName, itemStartTimes, migrateProject, newMainItem,
  newOverlayItem, projectDuration, sampleProject, emptyProject,
  syncLockedItems,
} from "./model.js";
import { TimelineEditor, layerIndex, removeItem, splitMainItemAt } from "./timeline.js";
import { Preview } from "./preview.js";
import { addCaption, mountCaptionsEditor, retimeCaption, setCaptionText } from "./captions.js";
import { mountMusicPanel } from "./music.js";
import { mountExportPanel } from "./export.js";
import { mountReplicatePanel } from "./replicate.js";
import { mountClaudePanel } from "./muse.js";
import { mountReactionPanel } from "./reaction.js";

const desktop = window.wovencut?.isDesktop ? window.wovencut : null;

let project = sampleProject();
let selection = null; // { lane, id }

const preview = new Preview(document.getElementById("preview"));
preview.load(project);

const readout = document.getElementById("readout");
preview.onTick = (t) => {
  const total = projectDuration(project);
  readout.textContent = `${Math.min(t, total).toFixed(1)}s / ${total}s`;
  timeline.setPlayhead(Math.min(t, total));
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

function refresh() {
  syncLockedItems(project); // locked pairs follow their main clip
  timeline.render();
  renderInspector();
  mountPanels();
  preview.draw(preview.currentTime());
  readout.textContent =
    `${Math.min(preview.currentTime(), projectDuration(project)).toFixed(1)}s / ${projectDuration(project)}s`;
}

function mountPanels() {
  mountCaptionsEditor(project, document.getElementById("panel-captions"));
  mountMusicPanel(project, document.getElementById("panel-music"));
  mountExportPanel(project, document.getElementById("panel-export"), {
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
      <label class="insp-field" title="How this clip arrives FROM the previous clip. Crossfade blends the two together for a soft join; Cut is an instant switch.">
        <span class="insp-label">⤨ Transition in</span>
        <select id="f-transition">
          <option value="cut" ${it.transitionIn === "cut" ? "selected" : ""}>Cut — instant switch</option>
          <option value="crossfade" ${it.transitionIn === "crossfade" ? "selected" : ""}>Crossfade — soft blend</option>
        </select>
      </label>
      ${numField({ id: "f-transdur", icon: "⤨", label: "Crossfade length (seconds)",
        title: "How long the crossfade blend lasts (only used when Transition in = Crossfade)", value: it.transitionDuration })}
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

  if (lane === "music") {
    inspectorBody.innerHTML = `
      <h3>🎵 Music bed</h3>
      <p class="insp-meta">${p.music?.src ? escapeHtml(p.music.src) : "No music file chosen."}</p>
      <label class="insp-field" title="How loud the music sits under the video, 0–100%">
        <span class="insp-label">🔊 Volume — <span id="vol-readout">${Math.round((p.music?.volume ?? 0.8) * 100)}%</span></span>
        <input type="range" id="f-volume" min="0" max="100" step="1"
          value="${Math.round((p.music?.volume ?? 0.8) * 100)}">
      </label>
      <div class="insp-actions">
        <button type="button" class="tool-btn danger" data-act="delete"
          title="Remove the music bed">🗑️ Remove Music</button>
      </div>
      <p class="stub-note">Playback sync with the preview arrives in Phase 3.</p>`;
    inspectorBody.querySelector("#f-volume").addEventListener("input", (e) => {
      p.music.volume = +e.target.value / 100;
      inspectorBody.querySelector("#vol-readout").textContent = `${e.target.value}%`;
    });
    inspectorBody.querySelector("#f-volume").addEventListener("change", refresh);
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
  if (selection?.lane !== "main") return;
  const newId = splitMainItemAt(project, selection.id, preview.currentTime());
  if (newId) {
    selection = { lane: "main", id: newId };
    timeline.selection = selection;
  }
  refresh();
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

$("btn-new").addEventListener("click", () => {
  project = emptyProject();
  selection = null;
  timeline.selection = null;
  preview.load(project);
  refresh();
});

$("btn-open").addEventListener("click", async () => {
  if (desktop) {
    const res = await desktop.openProjectDialog();
    if (!res) return;
    project = migrateProject(res.project);
  } else {
    $("file-open").click();
    return;
  }
  selection = null;
  timeline.selection = null;
  preview.load(project);
  refresh();
});
$("file-open").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  project = migrateProject(JSON.parse(await file.text()));
  selection = null;
  timeline.selection = null;
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
      project.music = { src: p, volume: project.music?.volume ?? 0.8 };
      refresh();
    }
  } else {
    $("file-music").click();
  }
});
$("file-music").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (file) {
    project.music = { src: file.name, volume: project.music?.volume ?? 0.8 };
    refresh();
  }
  e.target.value = "";
});

$("btn-split").addEventListener("click", doSplit);
$("btn-delete").addEventListener("click", doDelete);
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

document.addEventListener("keydown", (e) => {
  if (e.key === "Delete" && selection &&
      !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "")) {
    doDelete();
  }
});

mountPanels();
renderInspector();

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
