// WovenCut (working title) — interactive timeline editor (Phase 1 desktop)
// ---------------------------------------------------------------------------
// Pro-upgrade batch (Nov 5 2026): zoomable timeline (buttons + Fit + keys),
// timecode ruler with minor ticks, 🚩 markers on the ruler, 🧲 snapping
// (playhead + dragged blocks stick to edges), drag-to-retime for layer /
// background / caption blocks, and real audio waveforms inside clip and
// music blocks (decoded locally — see waveform.js).
//
// The centrepiece of the desktop app. A stack of lanes, top to bottom:
//
//   🪟 Layer N (PiP) — any number of layer lanes (➕ Add a layer on top);
//                      blocks placed by start time; corner + size edited
//                      in the inspector; drawn OVER everything below.
//   🎬 Main          — the picture track. Drop files here, drag blocks to
//                      reorder, click to select, ✕ or Delete key removes.
//   🌄 Background    — full-frame lane BEHIND main; shows through where a
//                      main clip is marked green screen (keyGreen).
//   💬 Captions      — blocks by start/end; click to select and edit text
//                      in the inspector.
//   🎵 Music         — the music bed's file reference (a block when set).
//
// Drag-and-drop, per Paul's direction: files dropped from the OS land as
// clips (real paths recovered through the preload bridge in Electron;
// blob-URL probing measures real durations in both shells). In-app drag
// reorders the main track. Every control carries an icon, a plain-words
// label, and a tooltip — the standing design rule (see WORKFLOW.md):
// "If a first-time user can't guess what a button does, the button is wrong."

import {
  baseName, formatClock, itemStartTimes, kindFromPath, newBackgroundItem,
  newMainItem, newOverlayItem, projectDuration, syncLockedItems, uid,
} from "./model.js";
import { peaksFromBytes, peaksFromFile, waveformSvg } from "./waveform.js";

// Lane ids: "main" | "layer:<n>" (n = 0 is the lane just above main;
// higher n stacks higher) | "background" | "caption" | "music".
export function layerIndex(lane) {
  const m = /^layer:(\d+)$/.exec(lane || "");
  return m ? +m[1] : -1;
}

export const PX_PER_SEC = 16;
const LANE_LABEL_W = 104;

const KIND_ICON = { clip: "🎬", still: "🖼️", segue: "✨", pip: "🪟", audio: "🔊" };

// --- Pure edit helpers (also used by the inspector) -------------------------

// Split a main-track item at an absolute timeline time. Returns the new
// item's id, or null if the time isn't strictly inside the item.
export function splitMainItemAt(project, itemId, atTime) {
  const starts = itemStartTimes(project);
  const i = project.tracks.main.findIndex((it) => it.id === itemId);
  if (i === -1) return null;
  const item = project.tracks.main[i];
  const into = atTime - starts[i];
  if (into <= 0.05 || into >= item.duration - 0.05) return null;
  const second = {
    ...item,
    id: item.id + "b" + Math.floor(Math.random() * 1e6).toString(36),
    duration: +(item.duration - into).toFixed(3),
    trimIn: +(item.trimIn + into).toFixed(3),
    fadeIn: 0, // a split point is a hard cut — no surprise fades
    transitionIn: "cut",
    label: item.label,
  };
  item.duration = +into.toFixed(3);
  item.fadeOut = 0;
  project.tracks.main.splice(i + 1, 0, second);
  return second.id;
}

export function removeItem(project, lane, id) {
  if (lane === "main") {
    project.tracks.main = project.tracks.main.filter((it) => it.id !== id);
  } else if (lane === "overlay" || layerIndex(lane) >= 0) {
    const li = lane === "overlay" ? 0 : layerIndex(lane);
    if (project.tracks.layers[li]) {
      project.tracks.layers[li] = project.tracks.layers[li].filter((it) => it.id !== id);
    }
  } else if (lane === "background") {
    project.tracks.background = project.tracks.background.filter((it) => it.id !== id);
  } else if (lane === "caption") {
    project.captions = project.captions.filter((c) => c.id !== id);
  } else if (lane === "marker") {
    project.markers = (project.markers || []).filter((m) => m.id !== id);
  } else if (lane === "music") {
    project.music = { src: null, volume: project.music?.volume ?? 0.8 };
  }
}

// Measure a dropped media file's real duration via a blob URL. Images and
// unprobeable files resolve to the supplied fallback.
export function probeDuration(file, kind, fallback) {
  if (kind === "still") return Promise.resolve(fallback);
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const el = document.createElement(kind === "audio" ? "audio" : "video");
    el.preload = "metadata";
    el.onloadedmetadata = () => {
      const d = Number.isFinite(el.duration) ? el.duration : fallback;
      URL.revokeObjectURL(url);
      resolve(+d.toFixed(2));
    };
    el.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(fallback);
    };
    el.src = url;
  });
}

// Media extensions accepted from an OS drop (mirrors model.js kindFromPath).
// Anything else in a dropped folder (notes, documents, installers) is
// quietly skipped — a folder drop should never become junk clips.
const DROP_EXT = [
  "mp4", "mov", "mkv", "webm", "avi", "m4v",
  "png", "jpg", "jpeg", "gif", "webp", "bmp",
  "mp3", "wav", "m4a", "ogg", "flac",
];
export function isSupportedDropFile(file) {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  return DROP_EXT.includes(ext);
}

// Expand an OS drop into a flat File list. Per Paul's direction (Nov 4
// 2026): a user can open a folder on their drive and drag clips in — and
// dragging the whole FOLDER in works too. Chromium/Electron expose dropped
// folders as directory entries; walk them recursively and keep the media
// files. Entries must be captured synchronously during the drop event, so
// this is called before any await in the handler.
export async function collectDroppedFiles(dataTransfer) {
  const entries = [];
  if (dataTransfer.items?.length) {
    for (const item of dataTransfer.items) {
      if (item.kind !== "file") continue;
      const entry = item.webkitGetAsEntry?.();
      if (entry) entries.push(entry);
    }
  }
  if (!entries.length) return [...(dataTransfer.files || [])];

  const files = [];
  const walk = async (entry) => {
    if (entry.isFile) {
      const file = await new Promise((res, rej) => entry.file(res, rej)).catch(() => null);
      if (file) files.push(file);
    } else if (entry.isDirectory) {
      const reader = entry.createReader();
      // readEntries returns in batches; loop until it returns an empty set.
      for (;;) {
        const batch = await new Promise((res, rej) => reader.readEntries(res, rej)).catch(() => []);
        if (!batch.length) break;
        for (const child of batch) await walk(child);
      }
    }
  };
  for (const entry of entries) await walk(entry);
  return files;
}

export class TimelineEditor {
  // hooks: { project(), onChange(), onSelect(sel|null), onSeek(t), desktop }
  constructor(container, hooks) {
    this.container = container;
    this.hooks = hooks;
    this.selection = null; // { lane, id }
    this.drag = null; // { lane, id } while an in-app drag is live
    // Pro-upgrade batch (Nov 5 2026): zoomable timeline + snapping.
    this.pxPerSec = PX_PER_SEC;
    this.snapping = true;
    this.playheadT = 0;
    this.render();
  }

  get project() {
    return this.hooks.project();
  }

  select(sel) {
    this.selection = sel;
    this.hooks.onSelect(sel);
    this.render();
  }

  setPlayhead(t) {
    this.playheadT = t;
    const ph = this.container.querySelector(".tl-playhead");
    if (ph) ph.style.left = `${LANE_LABEL_W + t * this.pxPerSec}px`;
  }

  // -- zoom --------------------------------------------------------------------

  setZoom(pps) {
    this.pxPerSec = Math.min(96, Math.max(3, pps));
    this.render();
  }

  zoomBy(factor) {
    this.setZoom(this.pxPerSec * factor);
  }

  zoomFit() {
    const total = Math.max(projectDuration(this.project), 1);
    const scroll = this.container.querySelector(".tl-scroll");
    const avail = (scroll?.clientWidth || 960) - LANE_LABEL_W - 24;
    this.setZoom(avail / total);
  }

  // -- snapping ------------------------------------------------------------------
  // When snapping is on, a time "sticks" to the nearest interesting edge —
  // clip starts/ends, caption edges, layer edges, markers — within a few
  // pixels, exactly like the magnet in pro editors.

  snapTime(t, extra = []) {
    if (!this.snapping) return t;
    const p = this.project;
    const edges = [0, ...extra];
    const starts = itemStartTimes(p);
    p.tracks.main.forEach((item, i) => {
      edges.push(starts[i], starts[i] + item.duration);
    });
    for (const c of p.captions) edges.push(c.start, c.end);
    for (const lane of p.tracks.layers || []) {
      for (const o of lane) edges.push(o.start, o.start + o.duration);
    }
    for (const b of p.tracks.background || []) edges.push(b.start, b.start + b.duration);
    for (const m of p.markers || []) edges.push(m.time);
    const threshold = 10 / this.pxPerSec;
    let best = t;
    let bestDist = threshold;
    for (const e of edges) {
      const d = Math.abs(e - t);
      if (d < bestDist) {
        bestDist = d;
        best = e;
      }
    }
    return +best.toFixed(3);
  }

  // -- file intake -----------------------------------------------------------

  async addFiles(fileList, lane, atTime = null) {
    const project = this.project;
    const files = [...fileList].filter(isSupportedDropFile);
    for (const file of files) {
      const path = this.hooks.desktop?.getPathForFile(file) || file.name;
      const kind = kindFromPath(file.name);
      if (kind === "audio") {
        project.music = { src: path, volume: project.music?.volume ?? 0.8 };
        // Real waveform for the music bed, decoded locally (async — the
        // block redraws with its wave when the peaks land).
        peaksFromFile(file).then((peaks) => {
          if (peaks && project.music?.src === path) {
            project.music.peaks = peaks;
            this.render();
          }
        });
        continue;
      }
      const duration = await probeDuration(
        file, kind, kind === "still" ? 5 : 10
      );
      const li = lane === "overlay" ? 0 : layerIndex(lane);
      if (li >= 0) {
        const start = atTime != null ? Math.max(0, +atTime.toFixed(2)) : projectDuration(project);
        (project.tracks.layers[li] ||= []).push(
          newOverlayItem({ src: path, start, duration: Math.min(duration, 30) })
        );
      } else if (lane === "background") {
        const start = atTime != null ? Math.max(0, +atTime.toFixed(2)) : projectDuration(project);
        project.tracks.background.push(
          newBackgroundItem({ src: path, start, duration })
        );
      } else {
        const item = newMainItem({ src: path, kind, duration });
        project.tracks.main.push(item);
        if (kind === "clip") {
          peaksFromFile(file).then((peaks) => {
            if (peaks) {
              item.peaks = peaks;
              this.render();
            }
          });
        }
      }
    }
    this.hooks.onChange();
    this.render();
  }

  // Paths picked through the native dialog (Import Clips button): no File
  // objects, so durations start at defaults and Phase 2 adds ffprobe.
  // Waveforms still work: the desktop shell reads the file's bytes (a
  // file the user just picked) and the peaks decode locally, async.
  addPaths(paths, lane = "main") {
    const project = this.project;
    for (const p of paths) {
      const kind = kindFromPath(p);
      if (kind === "audio") {
        project.music = { src: p, volume: project.music?.volume ?? 0.8 };
        this.peaksForPath(p, (peaks) => {
          if (project.music?.src === p) project.music.peaks = peaks;
        });
      } else if (lane === "overlay" || layerIndex(lane) >= 0) {
        const li = lane === "overlay" ? 0 : layerIndex(lane);
        (project.tracks.layers[li] ||= []).push(
          newOverlayItem({ src: p, start: projectDuration(project) })
        );
      } else if (lane === "background") {
        project.tracks.background.push(
          newBackgroundItem({ src: p, start: projectDuration(project) })
        );
      } else {
        const item = newMainItem({ src: p, kind });
        project.tracks.main.push(item);
        if (kind === "clip") {
          this.peaksForPath(p, (peaks) => { item.peaks = peaks; });
        }
      }
    }
    this.hooks.onChange();
    this.render();
  }

  // Read a file's bytes through the desktop bridge and decode its peaks.
  // No-op in the browser shell (no bridge) or when decoding fails.
  peaksForPath(path, assign) {
    const read = this.hooks.desktop?.readFileBytes;
    if (!read) return;
    read(path)
      .then((data) => {
        if (!data) return null;
        const u8 = data instanceof Uint8Array ? data : new Uint8Array(data);
        const ab = u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
        return peaksFromBytes(ab);
      })
      .then((peaks) => {
        if (peaks) {
          assign(peaks);
          this.render();
        }
      })
      .catch(() => {});
  }

  // -- rendering ---------------------------------------------------------------

  render() {
    const project = this.project;
    syncLockedItems(project); // locked pairs follow their main clip
    const total = Math.max(projectDuration(project), 10);
    const pps = this.pxPerSec;
    const widthPx = Math.ceil(total * pps) + 240;
    const sel = this.selection;

    const laneRow = (lane, icon, name, hint, innerHTML) => `
      <div class="tl-lane" data-lane="${lane}">
        <div class="tl-lane-label" title="${hint}">
          <span class="tl-lane-icon">${icon}</span> ${name}
        </div>
        <div class="tl-track" data-track="${lane}" style="width:${widthPx}px">${innerHTML}</div>
      </div>`;

    // Main lane blocks
    const mainBlocks = project.tracks.main.map((item) => {
      const badges = [
        item.transitionIn === "crossfade" ? `⤨ crossfade ${item.transitionDuration}s` : "",
        item.fadeIn > 0 ? `fade-in ${item.fadeIn}s` : "",
        item.fadeOut > 0 ? `fade-out ${item.fadeOut}s` : "",
        item.generated ? "AI segue" : "",
      ].filter(Boolean).join(" · ");
      return `
      <div class="tl-block ${sel?.lane === "main" && sel.id === item.id ? "selected" : ""}
                  ${item.generated ? "tl-segue" : ""} ${item.peaks ? "has-wave" : ""}"
           draggable="true" data-lane="main" data-id="${item.id}"
           style="width:${Math.max(56, item.duration * pps)}px"
           title="${escapeHtml(item.label)} — ${item.duration}s${badges ? " — " + badges : ""}. Drag to reorder; click to select; Delete key removes.">
        <span class="tl-block-icon">${KIND_ICON[item.kind] || "🎬"}</span>
        <span class="tl-block-main">
          <span class="tl-label">${escapeHtml(item.label)}</span>
          <span class="tl-meta">${item.duration}s${badges ? " · " + badges : ""}</span>
        </span>
        <button type="button" class="tl-del" data-del="${item.id}" data-lane="main"
          title="Delete this clip from the timeline">✕</button>
        ${waveformSvg(item.peaks)}
      </div>`;
    }).join("");

    // Layer-lane blocks (picture-in-picture style, positioned by start
    // time). Lane "layer:<n>": n = 0 sits just over the main video and
    // higher numbers stack higher — what's on a higher lane draws on top.
    const layerBlocks = (li) => (project.tracks.layers[li] || []).map((o) => `
      <div class="tl-block tl-abs ${sel?.lane === `layer:${li}` && sel.id === o.id ? "selected" : ""}"
           data-lane="layer:${li}" data-id="${o.id}"
           style="left:${o.start * pps}px;width:${Math.max(56, o.duration * pps)}px"
           title="Layer ${li + 1} item: ${escapeHtml(o.label)} — starts ${o.start}s, ${o.duration}s long, ${o.corner}, ${o.sizePct}% wide. It draws OVER everything on the lanes below it. Drag it left/right to move it; click to select; position, corner and size also live in the inspector.">
        <span class="tl-block-icon">🪟</span>
        <span class="tl-block-main">
          <span class="tl-label">${o.lockToId ? "🔒 " : ""}${escapeHtml(o.label)}</span>
          <span class="tl-meta">${o.start}s + ${o.duration}s · ${o.corner} · ${o.sizePct}%${o.lockToId ? " · locked to main clip" : ""}</span>
        </span>
        <button type="button" class="tl-del" data-del="${o.id}" data-lane="layer:${li}"
          title="Remove this item from layer ${li + 1}">✕</button>
      </div>`).join("");

    // Background blocks — full-frame items BEHIND the main video, revealed
    // where a green-screen main clip is keyed out.
    const bgBlocks = project.tracks.background.map((b) => `
      <div class="tl-block tl-abs tl-bg ${sel?.lane === "background" && sel.id === b.id ? "selected" : ""}"
           data-lane="background" data-id="${b.id}"
           style="left:${b.start * pps}px;width:${Math.max(56, b.duration * pps)}px"
           title="Background: ${escapeHtml(b.label)} — fills the whole frame BEHIND the main video from ${b.start}s for ${b.duration}s. It shows through wherever a main clip is marked green screen. Drag it left/right to move it; click to select.">
        <span class="tl-block-icon">🌄</span>
        <span class="tl-block-main">
          <span class="tl-label">${escapeHtml(b.label)}</span>
          <span class="tl-meta">${b.start}s + ${b.duration}s · behind main</span>
        </span>
        <button type="button" class="tl-del" data-del="${b.id}" data-lane="background"
          title="Remove this background item">✕</button>
      </div>`).join("");

    // Layer lanes render TOP lane first (highest number at the top of the
    // stack, exactly like layers in a picture editor).
    const layerRows = project.tracks.layers.map((laneItems, li) => ({ laneItems, li }))
      .reverse()
      .map(({ laneItems, li }) => laneRow(
        `layer:${li}`, "🪟", `Layer ${li + 1}`,
        `Layer ${li + 1} — floats over everything below it${li === project.tracks.layers.length - 1 ? " (top layer)" : ""}. Drop clips or images here.`,
        layerBlocks(li) || `<div class="tl-empty">Drop a clip or image here to float it over the lanes below.</div>`
      )).join("");

    // Caption blocks
    const capBlocks = project.captions.map((c) => `
      <div class="tl-block tl-abs tl-caption ${sel?.lane === "caption" && sel.id === c.id ? "selected" : ""}"
           data-lane="caption" data-id="${c.id}"
           style="left:${c.start * pps}px;width:${Math.max(44, (c.end - c.start) * pps)}px"
           title="Caption ${c.start}s–${c.end}s. Drag it left/right to retime it; click to select; edit the words in the inspector.">
        <span class="tl-block-icon">💬</span>
        <span class="tl-label">${escapeHtml(c.text || "(empty)")}</span>
        <button type="button" class="tl-del" data-del="${c.id}" data-lane="caption"
          title="Delete this caption">✕</button>
      </div>`).join("");

    // Music block
    const musicBlock = project.music?.src ? `
      <div class="tl-block tl-music-block ${project.music.peaks ? "has-wave" : ""} ${sel?.lane === "music" ? "selected" : ""}"
           data-lane="music" data-id="music"
           style="width:${Math.max(120, total * pps)}px"
           title="Music bed: ${escapeHtml(baseName(project.music.src))} at ${Math.round(project.music.volume * 100)}% volume. Click to select; volume lives in the inspector.">
        <span class="tl-block-icon">🎵</span>
        <span class="tl-label">${escapeHtml(baseName(project.music.src))}</span>
        <button type="button" class="tl-del" data-del="music" data-lane="music"
          title="Remove the music bed">✕</button>
        ${waveformSvg(project.music.peaks)}
      </div>` : `
      <div class="tl-empty">Drop an audio file here, or use the 🎵 Add Music button.</div>`;

    // Ruler: timecode ticks at a zoom-friendly interval, minor ticks
    // between them, and marker flags. Clicking the ruler seeks (with
    // snapping); clicking a flag selects that marker.
    const tickSteps = [0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300];
    const step = tickSteps.find((s) => s * pps >= 72) || 300;
    let ticks = "";
    for (let s = 0; s <= total; s += step) {
      ticks += `<span class="tl-tick" style="left:${LANE_LABEL_W + s * pps}px">${formatClock(s)}</span>`;
      for (let k = 1; k < 5; k++) {
        const ms = s + (step / 5) * k;
        if (ms < total) {
          ticks += `<span class="tl-tick-minor" style="left:${LANE_LABEL_W + ms * pps}px"></span>`;
        }
      }
    }
    const markerFlags = (project.markers || []).map((m) => `
      <button type="button" class="tl-marker ${sel?.lane === "marker" && sel.id === m.id ? "selected" : ""}"
        data-marker="${m.id}" style="left:${LANE_LABEL_W + m.time * pps}px"
        title="🚩 Marker at ${m.time}s${m.label ? ` — ${escapeHtml(m.label)}` : ""}. Click to jump there and edit it in the inspector.">🚩</button>`).join("");

    const zoomPct = Math.round((pps / PX_PER_SEC) * 100);
    this.container.innerHTML = `
      <div class="tl-scroll">
        <div class="tl-inner" style="width:${LANE_LABEL_W + widthPx}px">
          <div class="tl-ruler" title="Ruler — click to jump the playhead there (it snaps to clip edges when snapping is on)">${ticks}${markerFlags}</div>
          <div class="tl-tools">
            <button type="button" class="tool-btn" data-add-layer
              title="Add another layer lane on top of the stack — things on higher layers draw over the lanes below">➕ Add a layer on top</button>
            ${project.tracks.layers.length > 1 && project.tracks.layers[project.tracks.layers.length - 1].length === 0 ? `
            <button type="button" class="tool-btn" data-remove-layer
              title="Remove the top layer lane (it's empty)">➖ Remove top layer</button>` : ""}
            <span class="tool-sep" aria-hidden="true"></span>
            <button type="button" class="tool-btn" data-zoom="out"
              title="Zoom the timeline OUT — see more of the video at once (key: −)">🔍➖ Zoom Out</button>
            <span class="tl-zoom-label" title="Timeline zoom level">${zoomPct}%</span>
            <button type="button" class="tool-btn" data-zoom="in"
              title="Zoom the timeline IN — see the clips bigger for fine trimming (key: +)">🔍➕ Zoom In</button>
            <button type="button" class="tool-btn" data-zoom="fit"
              title="Fit the whole video into the timeline view">↔️ Fit Whole Video</button>
            <button type="button" class="tool-btn ${this.snapping ? "toggle-on" : ""}" data-snap
              title="Snapping (the magnet): when ON, the playhead and dragged blocks stick to clip edges, caption edges and markers, so cuts line up exactly. Turn it OFF for completely free movement. (Key: N)">
              🧲 Snapping: ${this.snapping ? "On" : "Off"}</button>
          </div>
          ${layerRows}
          ${laneRow("main", "🎬", "Main video", "The main track. Drop video clips and images here; drag blocks left/right to reorder them.", mainBlocks || `<div class="tl-empty">Drop video clips or images here — or press 🎞️ Import Clips.</div>`)}
          ${laneRow("background", "🌄", "Background", "Background lane: fills the frame BEHIND the main video. Mark a main clip as green screen and this shows through where the green was.", bgBlocks || `<div class="tl-empty">Drop a clip or image here to sit behind the main video (green-screen backdrop).</div>`)}
          ${laneRow("caption", "💬", "Captions", "Caption lane: words that appear on screen, timed to the video.", capBlocks)}
          ${laneRow("music", "🎵", "Music", "Music lane: one audio file plays under the whole video.", musicBlock)}
          <div class="tl-playhead" style="left:${LANE_LABEL_W + this.playheadT * pps}px" title="Playhead — where the preview is up to"></div>
        </div>
      </div>`;

    this.wireEvents();
  }

  // -- events ------------------------------------------------------------------

  wireEvents() {
    const root = this.container;

    // Selection + delete buttons
    root.querySelectorAll(".tl-block").forEach((el) => {
      el.addEventListener("click", (e) => {
        if (e.target.closest(".tl-del")) return;
        this.select({ lane: el.dataset.lane, id: el.dataset.id });
      });
      el.addEventListener("dragstart", (e) => {
        this.drag = { lane: el.dataset.lane, id: el.dataset.id };
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("application/x-wovencut", JSON.stringify(this.drag));
        el.classList.add("dragging");
      });
      el.addEventListener("dragend", () => {
        this.drag = null;
        root.querySelectorAll(".drop-before,.drop-after").forEach((b) =>
          b.classList.remove("drop-before", "drop-after"));
        this.render();
      });
      // Reorder indicator while dragging over main-track blocks
      el.addEventListener("dragover", (e) => {
        if (!this.drag || el.dataset.lane !== "main" || this.drag.lane !== "main") return;
        e.preventDefault();
        const r = el.getBoundingClientRect();
        const after = e.clientX - r.left > r.width / 2;
        el.classList.toggle("drop-after", after);
        el.classList.toggle("drop-before", !after);
        el.dataset.dropAfter = after ? "1" : "";
      });
      el.addEventListener("drop", (e) => {
        if (!this.drag || el.dataset.lane !== "main") return;
        e.preventDefault();
        e.stopPropagation();
        this.reorderMain(this.drag.id, el.dataset.id, el.dataset.dropAfter === "1");
      });
    });
    root.querySelectorAll(".tl-del").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        removeItem(this.project, btn.dataset.lane, btn.dataset.del);
        if (this.selection?.id === btn.dataset.del) this.selection = null;
        this.hooks.onChange();
        this.render();
      });
    });

    // Lane drops: OS files + lane-background reorder-to-end
    root.querySelectorAll(".tl-track").forEach((track) => {
      const lane = track.dataset.track;
      track.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = e.dataTransfer.files?.length ? "copy" : "move";
        track.classList.add("dragover");
      });
      track.addEventListener("dragleave", () => track.classList.remove("dragover"));
      track.addEventListener("drop", async (e) => {
        e.preventDefault();
        track.classList.remove("dragover");
        if (e.dataTransfer.files?.length || e.dataTransfer.items?.length) {
          // Capture the drop (incl. any folders) before the first await.
          const dropped = collectDroppedFiles(e.dataTransfer);
          const r = track.getBoundingClientRect();
          const atTime = (e.clientX - r.left) / this.pxPerSec;
          await this.addFiles(await dropped, lane, atTime);
        } else if (this.drag?.lane === "main" && lane === "main") {
          this.moveMainToEnd(this.drag.id);
        }
      });
      // Click empty track → seek the preview there (snapping applies)
      track.addEventListener("click", (e) => {
        if (e.target !== track) return;
        const r = track.getBoundingClientRect();
        this.hooks.onSeek(this.snapTime(Math.max(0, (e.clientX - r.left) / this.pxPerSec)));
      });
    });

    // Ruler: click seeks (snapped); marker flags select + jump.
    const ruler = root.querySelector(".tl-ruler");
    ruler?.addEventListener("click", (e) => {
      if (e.target.closest(".tl-marker")) return;
      const r = ruler.getBoundingClientRect();
      const t = (e.clientX - r.left - LANE_LABEL_W) / this.pxPerSec;
      this.hooks.onSeek(this.snapTime(Math.max(0, t)));
    });
    root.querySelectorAll(".tl-marker").forEach((flag) => {
      flag.addEventListener("click", (e) => {
        e.stopPropagation();
        const m = (this.project.markers || []).find((x) => x.id === flag.dataset.marker);
        if (!m) return;
        this.select({ lane: "marker", id: m.id });
        this.hooks.onSeek(m.time);
      });
    });

    // Zoom + snapping controls.
    root.querySelector('[data-zoom="in"]')?.addEventListener("click", () => this.zoomBy(1.4));
    root.querySelector('[data-zoom="out"]')?.addEventListener("click", () => this.zoomBy(1 / 1.4));
    root.querySelector('[data-zoom="fit"]')?.addEventListener("click", () => this.zoomFit());
    root.querySelector("[data-snap]")?.addEventListener("click", () => {
      this.snapping = !this.snapping;
      this.render();
    });

    // Drag positioned blocks (layers, background, captions) left/right to
    // retime them — with snapping. Locked items follow their main clip
    // and don't drag. A plain click still selects (handled above).
    root.querySelectorAll(".tl-block.tl-abs").forEach((el) => {
      el.addEventListener("pointerdown", (e) => {
        if (e.button !== 0 || e.target.closest(".tl-del")) return;
        const lane = el.dataset.lane;
        const item = this.findPositioned(lane, el.dataset.id);
        if (!item || item.lockToId) return;
        const startX = e.clientX;
        const origStart = item.start;
        const origEnd = item.end; // captions only
        let pending = origStart;
        let moved = false;
        try { el.setPointerCapture(e.pointerId); } catch { /* fine */ }
        const onMove = (ev) => {
          const dxPx = ev.clientX - startX;
          if (!moved && Math.abs(dxPx) < 4) return;
          moved = true;
          el.classList.add("dragging");
          const t = Math.max(0, origStart + dxPx / this.pxPerSec);
          pending = ev.altKey ? +t.toFixed(3) : this.snapTime(t);
          el.style.left = `${pending * this.pxPerSec}px`;
        };
        const onUp = () => {
          el.removeEventListener("pointermove", onMove);
          el.removeEventListener("pointerup", onUp);
          el.removeEventListener("pointercancel", onUp);
          if (!moved) return;
          if (lane === "caption") {
            const shift = pending - origStart;
            item.start = +pending.toFixed(2);
            item.end = +(origEnd + shift).toFixed(2);
          } else {
            item.start = +pending.toFixed(2);
          }
          this.hooks.onChange();
          this.render();
        };
        el.addEventListener("pointermove", onMove);
        el.addEventListener("pointerup", onUp);
        el.addEventListener("pointercancel", onUp);
      });
    });

    // Layer stack controls: add a lane on top / remove an empty top lane.
    root.querySelector("[data-add-layer]")?.addEventListener("click", () => {
      this.project.tracks.layers.push([]);
      this.hooks.onChange();
      this.render();
    });
    root.querySelector("[data-remove-layer]")?.addEventListener("click", () => {
      const layers = this.project.tracks.layers;
      if (layers.length > 1 && layers[layers.length - 1].length === 0) {
        layers.pop();
        this.hooks.onChange();
        this.render();
      }
    });
  }

  reorderMain(dragId, targetId, after) {
    const main = this.project.tracks.main;
    const from = main.findIndex((i) => i.id === dragId);
    if (from === -1) return;
    const [item] = main.splice(from, 1);
    let to = main.findIndex((i) => i.id === targetId);
    if (to === -1) to = main.length;
    else if (after) to += 1;
    main.splice(to, 0, item);
    this.drag = null;
    this.hooks.onChange();
    this.render();
  }

  // Look up a positioned (non-main) item by lane + id.
  findPositioned(lane, id) {
    const p = this.project;
    const li = layerIndex(lane);
    if (li >= 0) return (p.tracks.layers[li] || []).find((x) => x.id === id) || null;
    if (lane === "background") return p.tracks.background.find((x) => x.id === id) || null;
    if (lane === "caption") return p.captions.find((x) => x.id === id) || null;
    return null;
  }

  moveMainToEnd(dragId) {
    const main = this.project.tracks.main;
    const from = main.findIndex((i) => i.id === dragId);
    if (from === -1) return;
    const [item] = main.splice(from, 1);
    main.push(item);
    this.drag = null;
    this.hooks.onChange();
    this.render();
  }
}

function escapeHtml(s = "") {
  return s.replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[ch]));
}
