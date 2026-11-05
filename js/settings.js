// WovenCut (working title) — project settings panel (pro-upgrade batch, Nov 5 2026)
// ---------------------------------------------------------------------------
// Pro editors start from SEQUENCE SETTINGS: the frame size and frame rate
// the whole project is built for. WovenCut keeps that idea in beginner
// language: pick the shape your video is headed for (YouTube widescreen,
// vertical for TikTok/Reels/Shorts, square), pick a frame rate, and the
// timeline's timecode, the preview's shape, and the export plan all
// follow. Export presets (Export panel) can still override per-export.

import { formatTimecode, projectDuration } from "./model.js";

const FRAME_PRESETS = [
  { id: "1920x1080", label: "🖥️ Widescreen 1920 × 1080 — YouTube", width: 1920, height: 1080 },
  { id: "1280x720", label: "🖥️ Widescreen 1280 × 720 — smaller files", width: 1280, height: 720 },
  { id: "1080x1920", label: "📱 Vertical 1080 × 1920 — TikTok, Reels, Shorts", width: 1080, height: 1920 },
  { id: "1080x1080", label: "⬛ Square 1080 × 1080 — Instagram posts", width: 1080, height: 1080 },
];

export function mountSettingsPanel(project, container, hooks = {}) {
  const s = project.settings || { width: 1920, height: 1080, fps: 30 };
  const presetId = `${s.width}x${s.height}`;
  const matched = FRAME_PRESETS.some((p) => p.id === presetId);
  const total = projectDuration(project);
  const layerCount = (project.tracks.layers || []).reduce((n, l) => n + l.length, 0);

  container.innerHTML = `
    <label class="insp-field" title="The name of this video project — used for the saved file and the YouTube title">
      <span class="insp-label">🏷️ Project name</span>
      <input type="text" id="set-title" value="${escapeHtml(project.title || "")}">
    </label>
    <label class="insp-field" title="The shape and size of the finished video. Widescreen is YouTube's shape; vertical is the phone shape TikTok, Reels and Shorts want.">
      <span class="insp-label">🖼️ Frame size</span>
      <select id="set-frame">
        ${FRAME_PRESETS.map((p) => `<option value="${p.id}" ${p.id === presetId ? "selected" : ""}>${p.label}</option>`).join("")}
        <option value="custom" ${matched ? "" : "selected"}>✏️ Custom size…</option>
      </select>
    </label>
    <div class="set-dims">
      <label class="insp-field" title="Frame width in pixels">
        <span class="insp-label">↔️ Width (px)</span>
        <input type="number" id="set-w" value="${s.width}" min="16" step="2">
      </label>
      <label class="insp-field" title="Frame height in pixels">
        <span class="insp-label">↕️ Height (px)</span>
        <input type="number" id="set-h" value="${s.height}" min="16" step="2">
      </label>
      <label class="insp-field" title="Frames per second. 30 is the everyday choice; 24 looks film-like; 60 is butter-smooth for action and game footage. The timeline's timecode counts in this rate.">
        <span class="insp-label">🎞️ Frame rate (fps)</span>
        <select id="set-fps">
          ${[24, 25, 30, 50, 60].map((f) => `<option value="${f}" ${f === s.fps ? "selected" : ""}>${f} fps</option>`).join("")}
        </select>
      </label>
    </div>
    <p class="stub-note">This project: ${project.tracks.main.length} clip${project.tracks.main.length === 1 ? "" : "s"} on the main track,
      ${layerCount} layer item${layerCount === 1 ? "" : "s"}, ${(project.tracks.background || []).length} background item${(project.tracks.background || []).length === 1 ? "" : "s"},
      ${project.captions.length} caption${project.captions.length === 1 ? "" : "s"},
      ${(project.markers || []).length} marker${(project.markers || []).length === 1 ? "" : "s"} ·
      length ${formatTimecode(total, s.fps)} (${total}s).
      Changing the frame size reshapes the preview and the export plan — it never adds a fade or a black opening; the first frame is still your first clip at full strength.</p>`;

  const apply = () => hooks.onChange?.();
  container.querySelector("#set-title").addEventListener("change", (e) => {
    project.title = e.target.value;
    apply();
  });
  container.querySelector("#set-frame").addEventListener("change", (e) => {
    const p = FRAME_PRESETS.find((x) => x.id === e.target.value);
    if (p) {
      project.settings.width = p.width;
      project.settings.height = p.height;
    }
    apply();
  });
  const bindDim = (sel, key) => {
    container.querySelector(sel).addEventListener("change", (e) => {
      const v = Math.max(16, Math.round(parseFloat(e.target.value) || 0));
      if (v) {
        project.settings[key] = v;
        apply();
      }
    });
  };
  bindDim("#set-w", "width");
  bindDim("#set-h", "height");
  container.querySelector("#set-fps").addEventListener("change", (e) => {
    project.settings.fps = +e.target.value;
    apply();
  });
}

function escapeHtml(s = "") {
  return String(s).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[ch]));
}
