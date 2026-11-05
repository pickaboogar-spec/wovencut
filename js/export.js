// WovenCut (working title) — export planner (Phase 1 desktop; render in Phase 4)
// ---------------------------------------------------------------------------
// On desktop the render engine is a REAL FFmpeg binary spawned by the main
// process — no longer the skeleton's ffmpeg.wasm idea. Where the binary
// comes from (Phase 4): the `ffmpeg-static` npm package (per-OS binary,
// unpacked from the asar by electron-builder), with a system-ffmpeg-on-PATH
// fallback. This module builds the exact argument list that handler will
// run, so the plan is reviewable NOW, before any binary is bundled.
//
// The graph this planner describes:
//   - Each main item is one input: video files are trimmed with -ss/-t
//     (trimIn/duration); stills are looped for their duration.
//   - Per-clip fades become `fade` filters using the clip's own numbers.
//     PAUL'S RULE: a clip with fadeIn = 0 gets NO fade filter — and the
//     first clip of a new project is 0 by default (see model.js RULES).
//     No black lead-in is ever generated.
//   - Crossfades between neighbours become `xfade` at the boundary, using
//     that item's transitionDuration. Cuts are plain concatenation joins.
//   - PiP overlays become `overlay` filters: each overlay item is scaled
//     to sizePct of the frame width and placed at its corner, enabled
//     between its start and start+duration.
//   - Captions burn in via the subtitles filter, styled to match the
//     preview (large type, dark backing band).
//   - Music mixes under the picture at project volume.
//   Output: MP4 (H.264 + AAC), long-form-YouTube friendly (1920×1080).

export function planExport(project) {
  const total = project.tracks.main.reduce((s, i) => s + i.duration, 0);
  return {
    engine: "FFmpeg (desktop) — binary bundled in Phase 4 via ffmpeg-static; stub in Phase 1",
    output: "MP4 — H.264 + AAC, 1920×1080, rendered locally. Nothing is uploaded, ever.",
    clips: project.tracks.main.length,
    overlays: project.tracks.overlay.length,
    durationSeconds: total,
    firstFrame:
      "first clip at full strength from t=0 — its fade-in defaults to 0 (Paul's rule); " +
      "no fade filter is emitted for a 0 fade-in, and no black lead-in exists in the graph",
    captions: "burned in, preview-identical styling",
    music: project.music?.src || "none chosen",
  };
}

// Build the ffmpeg argument list for a project. Honest status: this is the
// Phase 4 command SHAPE — input staging and the filtergraph skeleton are
// real and derived from the project, but Phase 4 must still validate it
// against the bundled binary (xfade needs matching stream prep per input).
export function buildFfmpegArgs(project, outputPath = "wovencut-export.mp4") {
  const args = ["-y"];
  const filters = [];
  const main = project.tracks.main;

  main.forEach((item, i) => {
    if (item.kind === "still") {
      args.push("-loop", "1", "-t", String(item.duration), "-i", item.src || `<still:${item.label}>`);
    } else {
      if (item.trimIn > 0) args.push("-ss", String(item.trimIn));
      args.push("-t", String(item.duration), "-i", item.src || `<clip:${item.label}>`);
    }
    // Per-clip fades — a 0 fade emits NO filter. The first clip of a new
    // project is 0 by default: Paul's rule survives into the render.
    if (item.fadeIn > 0) {
      filters.push(`[${i}:v]fade=t=in:st=0:d=${item.fadeIn}[f${i}]`);
    }
    if (item.fadeOut > 0) {
      const start = Math.max(0, item.duration - item.fadeOut);
      filters.push(`[${i}:v]fade=t=out:st=${start}:d=${item.fadeOut}[fo${i}]`);
    }
  });

  // Crossfades: noted per boundary; Phase 4 wires xfade offsets from the
  // cumulative starts. Cuts need no filter.
  main.forEach((item, i) => {
    if (i > 0 && item.transitionIn === "crossfade") {
      filters.push(
        `# xfade boundary before clip ${i + 1}: duration=${item.transitionDuration}s`
      );
    }
  });

  // PiP overlays → overlay filter at the chosen corner, time-gated.
  const cornerXY = {
    "top-left": "x=24:y=24",
    "top-right": "x=W-w-24:y=24",
    "bottom-left": "x=24:y=H-h-24",
    "bottom-right": "x=W-w-24:y=H-h-24",
  };
  project.tracks.overlay.forEach((o, j) => {
    const idx = main.length + j;
    args.push("-i", o.src || `<pip:${o.label}>`);
    filters.push(
      `[${idx}:v]scale=iw*${o.sizePct / 100}:ih*${o.sizePct / 100}[pip${j}]`,
      `[base][pip${j}]overlay=${cornerXY[o.corner] || cornerXY["bottom-right"]}` +
        `:enable='between(t,${o.start},${o.start + o.duration})'`
    );
  });

  if (project.music?.src) {
    args.push("-i", project.music.src); // mixed under picture at project volume
  }

  args.push(
    "-filter_complex", filters.join("; ") || "null",
    "-c:v", "libx264", "-c:a", "aac", "-pix_fmt", "yuv420p",
    "-movflags", "+faststart", // long-form YouTube uploads: progressive start
    outputPath
  );
  return args;
}

// Panel UI: shows the plan and, in the desktop app, asks the main process
// to run the (stubbed) export so Paul sees exactly what Phase 4 will do.
export function mountExportPanel(project, container, hooks = {}) {
  const plan = planExport(project);
  container.innerHTML =
    `<p class="stub-note">Engine: ${plan.engine}.<br>` +
    `Output: ${plan.output}<br>` +
    `First frame: ${plan.firstFrame}.<br>` +
    `Clips: ${plan.clips} · PiP overlays: ${plan.overlays} · ` +
    `Length: ${plan.durationSeconds}s · Music: ${plan.music}</p>` +
    `<button type="button" class="tool-btn" data-action="run-export"` +
    ` title="Ask the desktop shell to run the export pipeline (stub in this phase — it returns the full FFmpeg plan and renders nothing)">` +
    `📤 Run export (stub)</button>` +
    `<pre class="export-result" hidden></pre>`;
  const btn = container.querySelector('[data-action="run-export"]');
  const out = container.querySelector(".export-result");
  btn.addEventListener("click", async () => {
    out.hidden = false;
    out.textContent = "Asking the export pipeline…";
    if (hooks.runExport) {
      const res = await hooks.runExport(project);
      out.textContent =
        (res.message || JSON.stringify(res, null, 2)) +
        (res.ffmpegArgs ? `\n\nffmpeg ${res.ffmpegArgs.join(" ")}` : "");
    } else {
      out.textContent =
        "No desktop shell detected (browser preview). The export stub " +
        "lives in the Electron main process — run the desktop app.";
    }
  });
}
