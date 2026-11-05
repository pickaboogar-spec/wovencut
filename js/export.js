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
//   - The layer stack composites back to front: background lane items
//     full-frame under the main chain; main clips marked green screen
//     get a `chromakey` filter so the background shows through; layer
//     items become `overlay` filters scaled to sizePct of the frame
//     width at their corner, enabled between start and start+duration.
//   - Captions burn in via the subtitles filter, styled to match the
//     preview (large type, dark backing band).
//   - Music mixes under the picture at project volume.
//   Output: MP4 (H.264 + AAC), long-form-YouTube friendly (1920×1080).

import { transitionById } from "./model.js";

// Export presets (pro-upgrade batch, Nov 5 2026): one-tap shapes for the
// places videos actually go, like the preset menus in pro editors. A
// preset sets ONLY the frame size and frame rate of the render — every
// preset obeys Paul's first-frame rule: no fade-in is added, no black
// lead-in exists, the video opens on the first clip at full strength.
export const EXPORT_PRESETS = [
  { id: "youtube-1080", label: "📺 YouTube — widescreen 1920 × 1080, 30 fps", width: 1920, height: 1080, fps: 30 },
  { id: "youtube-4k", label: "📺 YouTube 4K — 3840 × 2160, 30 fps (bigger files, slower render)", width: 3840, height: 2160, fps: 30 },
  { id: "vertical", label: "📱 Vertical 1080 × 1920, 30 fps — TikTok, Reels, Shorts", width: 1080, height: 1920, fps: 30 },
  { id: "square", label: "⬛ Square 1080 × 1080, 30 fps — Instagram posts", width: 1080, height: 1080, fps: 30 },
  { id: "project", label: "⚙️ Use the project settings (⚙️ Project Settings panel)", width: 0, height: 0, fps: 0 },
];

// Resolve the effective export spec: the chosen preset, or the project
// settings when the preset is "project" (or unknown).
export function getExportSpec(project) {
  const preset = EXPORT_PRESETS.find((p) => p.id === project.exportPreset) || EXPORT_PRESETS[0];
  if (preset.id === "project" || !preset.width) {
    const s = project.settings || { width: 1920, height: 1080, fps: 30 };
    return { preset, width: s.width, height: s.height, fps: s.fps };
  }
  return { preset, width: preset.width, height: preset.height, fps: preset.fps };
}

export function planExport(project) {
  const total = project.tracks.main.reduce((s, i) => s + i.duration, 0);
  const layerCount = (project.tracks.layers || []).reduce((s, l) => s + l.length, 0);
  const spec = getExportSpec(project);
  return {
    engine: "FFmpeg (desktop) — bundled via ffmpeg-static, with a system FFmpeg fallback (Phase 4, real rendering)",
    preset: spec.preset.label,
    output: `MP4 — H.264 + AAC, ${spec.width}×${spec.height} at ${spec.fps} fps, rendered locally. Nothing is uploaded, ever.`,
    clips: project.tracks.main.length,
    overlays: layerCount,
    background: (project.tracks.background || []).length,
    keyedClips: project.tracks.main.filter((i) => i.keyGreen).length,
    durationSeconds: total,
    firstFrame:
      "first clip at full strength from t=0 — its fade-in defaults to 0 (Paul's rule); " +
      "no fade filter is emitted for a 0 fade-in, and no black lead-in exists in the graph",
    captions: project.captionMode === "srt"
      ? "sidecar .srt file — the picture stays clean; upload the .srt next to the video (💾 Export Captions in the Captions panel)"
      : "burned in, preview-identical styling",
    // Loudness (pro pass 2): −14 LUFS integrated / −1 dBTP is the level
    // YouTube and TikTok normalise uploads to. The loudnorm filter runs
    // on the FINAL audio mix at render time (Phase 4) — the toggle
    // shapes the plan today and the render when Phase 4 lands.
    loudness: project.loudnessNormalize
      ? "normalise to −14 LUFS, true peak −1 dB (FFmpeg loudnorm on the final audio mix, at render time)"
      : "off — audio renders at its recorded level",
    music: project.music?.src || "none chosen",
    // Ducking (pro pass 2): the render ducks with sidechaincompress,
    // keyed by the main track's real audio — the model's strength slider
    // maps to the compressor ratio.
    ducking: !project.music?.src
      ? "no music bed"
      : project.music.duck
        ? `ON — music dips to ${Math.round((1 - (project.music.duckAmount ?? 0.6)) * 100)}% under the main track's sound (sidechaincompress at render time)`
        : "off — music holds its set volume throughout",
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

  // Transitions: noted per boundary with the FFmpeg xfade name each one
  // maps to (pro pass 2 — the menu now covers dip-to-black/white, wipe
  // and slide alongside crossfade). Phase 4 wires xfade offsets from the
  // cumulative starts. Cuts need no filter.
  main.forEach((item, i) => {
    if (i > 0 && item.transitionIn && item.transitionIn !== "cut") {
      const t = transitionById(item.transitionIn);
      filters.push(
        `# xfade boundary before clip ${i + 1}: transition=${t.xfade} duration=${item.transitionDuration}s`
      );
    }
  });

  // Captions at export (pro pass 2): burn-in draws them into the picture
  // with the preview's styling; sidecar mode leaves the picture clean
  // and the .srt travels as its own file.
  if (project.captionMode === "srt") {
    filters.push("# captions: sidecar .srt (no burn-in filter — picture stays clean)");
  } else if (project.captions?.some((c) => c.text)) {
    filters.push("# captions: subtitles=<captions.srt>:force_style='FontSize=22,BackColour=&H99000000,BorderStyle=4' (burn-in, preview styling)");
  }

  // Loudness normalisation (pro pass 2): single-pass loudnorm on the
  // final mixed audio. −14 LUFS / −1 dBTP is the YouTube + TikTok target.
  if (project.loudnessNormalize) {
    filters.push("# loudnorm=I=-14:TP=-1:LRA=11 applied to the final audio mix");
  }

  // LAYERING (Paul, Nov 4 2026) — the composite stack, back to front:
  // background lane → main video (green-screen clips keyed) → layer lanes.
  // Background items are full-frame inputs composited UNDER the main
  // chain; a main clip with keyGreen gets a `chromakey` filter so its
  // green drops out and the background shows through.
  (project.tracks.background || []).forEach((b, j) => {
    const idx = main.length + j;
    args.push("-i", b.src || `<bg:${b.label}>`);
    filters.push(
      `# background ${j + 1}: full-frame under main, ` +
      `enable='between(t,${b.start},${b.start + b.duration})' (input ${idx})`
    );
  });
  main.forEach((item, i) => {
    if (item.keyGreen) {
      filters.push(`# clip ${i + 1} is green screen: chromakey=0x00b140:0.18:0.08 before compositing over the background lane`);
    }
  });

  // Layer lanes → overlay filters at the chosen corner, time-gated,
  // flattened bottom lane first so higher layers composite last (on top).
  const cornerXY = {
    "top-left": "x=24:y=24",
    "top-right": "x=W-w-24:y=24",
    "bottom-left": "x=24:y=H-h-24",
    "bottom-right": "x=W-w-24:y=H-h-24",
  };
  const flatLayers = (project.tracks.layers || []).flat();
  flatLayers.forEach((o, j) => {
    const idx = main.length + (project.tracks.background || []).length + j;
    args.push("-i", o.src || `<pip:${o.label}>`);
    filters.push(
      `[${idx}:v]scale=iw*${o.sizePct / 100}:ih*${o.sizePct / 100}[pip${j}]`,
      `[base][pip${j}]overlay=${cornerXY[o.corner] || cornerXY["bottom-right"]}` +
        `:enable='between(t,${o.start},${o.start + o.duration})'`
    );
  });

  if (project.music?.src) {
    args.push("-i", project.music.src); // mixed under picture at project volume
    if (project.music.duck) {
      // Ducking at render: the music is compressed by a sidechain fed
      // from the main track's mixed audio. Strength (fraction removed)
      // maps to a compressor ratio of 1/(1−strength): 0.6 → 2.5 ≈ 3:1.
      const amt = project.music.duckAmount ?? 0.6;
      const ratio = Math.max(2, Math.round(1 / Math.max(0.05, 1 - amt)));
      filters.push(
        `# music ducking: [music]volume=${project.music.volume ?? 0.8},sidechaincompress=` +
        `threshold=0.02:ratio=${ratio}:attack=20:release=300 keyed by the main audio mix`
      );
    }
  }

  // Output spec from the chosen export preset (or the project settings).
  // The scale targets the preset's frame; Phase 4 validates the exact
  // scale/pad chain against the bundled binary.
  const spec = getExportSpec(project);
  filters.push(`# output frame: scale/pad to ${spec.width}x${spec.height} at ${spec.fps} fps (preset: ${spec.preset.id})`);

  args.push(
    "-filter_complex", filters.join("; ") || "null",
    "-c:v", "libx264", "-c:a", "aac", "-pix_fmt", "yuv420p",
    "-s", `${spec.width}x${spec.height}`, "-r", String(spec.fps),
    "-movflags", "+faststart", // long-form YouTube uploads: progressive start
    outputPath
  );
  return args;
}

// YouTube upload kit (Paul, Nov 4 2026): exporting for YouTube means the
// video AND its page text. The description is built for the user — and
// for reaction videos it AUTOMATICALLY credits the original creator with
// a link to the original video, because too many reaction uploads skip
// that credit. The one-click API upload is a later phase (it needs the
// user's own YouTube sign-in, same bring-your-own-account rule as
// everything else); today the kit gives a copy-ready description plus a
// button that opens YouTube's upload page.
export function buildYoutubeMetadata(project) {
  const credit = project.sourceCredit || {};
  const hasCredit = Boolean(credit.url || credit.creator || credit.title);
  const isReaction = project.tracks.main.some((i) => i.reactionPair) ||
    (project.tracks.layers || []).flat().some((i) => i.reactionPair) || hasCredit;

  const lines = [];
  if (isReaction) {
    lines.push(
      `My reaction to ${credit.title ? `"${credit.title}"` : "the original video"}${credit.creator ? ` by ${credit.creator}` : ""}.`,
      ""
    );
  }
  if (hasCredit) {
    lines.push(
      "— ORIGINAL VIDEO —",
      `🎬 ${credit.title || "Original video"}${credit.creator ? ` by ${credit.creator}` : ""}`,
      credit.url ? `▶️ Watch the original: ${credit.url}` : "(Add the original video's link in the Reaction panel and it lands here automatically.)",
      credit.creator ? `Go show ${credit.creator} some love — watch, like, and subscribe to the original creator.` : "",
      ""
    );
  }
  lines.push(
    "Made with WovenCut — a free video editor. No watermark, ever.",
    ""
  );

  const tags = ["reaction", "reactionvideo"];
  if (credit.creator) tags.push(credit.creator.replace(/^@/, ""));
  if (credit.title) {
    tags.push(...credit.title.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3).slice(0, 4));
  }

  return {
    title: project.title || "Untitled video",
    description: lines.join("\n").trim(),
    tags: [...new Set(tags)],
    creditIncluded: hasCredit,
    isReaction,
  };
}

// TikTok + Instagram upload kits (Paul, Nov 4 2026: "build in a TikTok
// uploader and an Instagram uploader too if those are possible").
// What's possible TODAY, honestly: both platforms have official upload
// pages and both take the same kit treatment as YouTube — caption text
// written for the user (with the ORIGINAL CREATOR @-MENTIONED, which is
// the credit that actually reaches them on those platforms, since
// caption links aren't clickable there), plus a button opening the
// platform's own upload page. One-click API posting is a later phase:
// TikTok's Content Posting API and Instagram's Content Publishing API
// both exist, but each demands a registered, reviewed developer app and
// the user's own account connection — it lands under the same
// bring-your-own-account rule when it lands.
export function buildSocialCaption(project, platform) {
  const credit = project.sourceCredit || {};
  const mention = credit.creator
    ? (credit.creator.startsWith("@") ? credit.creator : `@${credit.creator}`)
    : "";
  const lines = [];
  lines.push(project.title || "My new video");
  if (mention || credit.title) {
    lines.push("");
    lines.push(
      `Reaction to ${credit.title ? `"${credit.title}"` : "the original"}${mention ? ` by ${mention}` : ""} — all credit to the original creator, go follow them! 🙏`
    );
  }
  if (credit.url) {
    lines.push(
      platform === "tiktok"
        ? `Original video: ${credit.url}`
        : `Original video link is in the first comment 👇`
    );
  }
  const tags = ["#reaction"];
  if (mention) tags.push(`#${mention.slice(1)}`);
  if (platform === "instagram") tags.push("#reels");
  lines.push("", tags.join(" "));
  return lines.join("\n");
}

function socialSection(project) {
  const tt = buildSocialCaption(project, "tiktok");
  const ig = buildSocialCaption(project, "instagram");
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const kit = (key, icon, name, text, openLabel, guide) => `
    <div class="social-kit">
      <h3>${icon} ${name} upload kit</h3>
      <textarea rows="7" readonly data-kit="${key}-text">${esc(text)}</textarea>
      <div class="insp-actions">
        <button type="button" class="tool-btn" data-action="${key}-copy"
          title="Copy the ${name} caption — the original creator is @-mentioned in it automatically">📋 Copy Caption</button>
        <button type="button" class="tool-btn primary" data-action="${key}-open"
          title="Open ${name}'s own upload page in your browser">${openLabel}</button>
      </div>
      <p class="yt-status stub-note" data-kit="${key}-status" hidden></p>
      <details class="yt-guide">
        <summary>❓ How it works</summary>
        <p class="stub-note">${guide}</p>
      </details>
    </div>`;
  return `
    <div class="social-kits">
      ${kit("tt", "🎵", "TikTok", tt, "▶️ Open TikTok Upload",
        "TikTok's sign-in is TikTok's own (it also offers Google and Facebook buttons on its page). Press Open TikTok Upload, sign in there if asked, drop in your exported video (best: a vertical 1080×1920 export for TikTok), and paste the caption. The original creator is @-mentioned in it — on TikTok that's the credit that actually notifies them, because links in captions aren't clickable for most accounts. One-click posting through TikTok's official API needs a reviewed developer app, so it's a later phase; your login never touches this app either way.")}
      ${kit("ig", "📸", "Instagram", ig, "▶️ Open Instagram",
        "This is where one login really does span both apps: Instagram and Facebook share Meta's Accounts Center, so the login you use for one usually opens the other. Press Open Instagram, tap the + Create button, choose your video (Reels take vertical 1080×1920), and paste the caption — the original creator is @-mentioned automatically. Instagram captions can't hold clickable links either, so the kit also puts the original video's link ready for your first comment; and for a Reel, Instagram's own “Invite collaborator” option can credit the original creator even harder. One-click posting via Instagram's official API needs a reviewed Meta app — later phase, same rule: sign-in happens on Meta's page, never inside this app.")}
    </div>`;
}

function ytSection(project) {
  const yt = buildYoutubeMetadata(project);
  return `
    <div class="yt-kit">
      <h3>📺 YouTube upload kit</h3>
      <p class="stub-note">${yt.creditIncluded
        ? "✅ The original creator's credit is written into the description below — automatically."
        : "For a reaction video, add the original video's link and creator in the 🔴 Record a Reaction panel and the credit appears here automatically — the original creator should never go uncredited."}</p>
      <label class="insp-field" title="The title for the YouTube page">
        <span class="insp-label">🏷️ Title</span>
        <input type="text" readonly value="${yt.title.replace(/"/g, "&quot;")}">
      </label>
      <label class="insp-field" title="The description for the YouTube page — copy it as-is">
        <span class="insp-label">📝 Description (credit included)</span>
        <textarea class="yt-desc" rows="9" readonly>${yt.description.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</textarea>
      </label>
      <p class="stub-note">Tags: ${yt.tags.join(", ")}</p>
      <div class="insp-actions">
        <button type="button" class="tool-btn" data-action="yt-copy"
          title="Copy the title, description and tags to the clipboard, ready to paste into YouTube">📋 Copy Upload Text</button>
        <button type="button" class="tool-btn" data-action="yt-save"
          title="Save the title, description and tags as a text file next to your video">💾 Save Upload Kit (.txt)</button>
        <button type="button" class="tool-btn primary" data-action="yt-open"
          title="Open YouTube's upload page in your browser — drop in the exported video, paste the upload text, done">▶️ Open YouTube Upload Page</button>
      </div>
      <p class="yt-status stub-note" hidden></p>
      ${socialSection(project)}
      <details class="yt-guide">
        <summary title="Plain step-by-step: how your YouTube channel connects to this upload option">❓ How to link your YouTube channel — step by step</summary>
        <ol>
          <li><strong>Your channel lives on your Google account.</strong> One Google login covers Gmail, YouTube, and the rest of Google — if you can sign in to Gmail, you already have the login YouTube wants. (Meta's one login covers Facebook, Instagram, and Threads; YouTube is Google's, so it's the Google login that does this job.)</li>
          <li><strong>No channel yet?</strong> Go to youtube.com, click your profile picture, and choose “Create a channel.” It takes a minute and it's free.</li>
          <li><strong>Press ▶️ Open YouTube Upload Page</strong> (above). Your browser opens YouTube's own upload page. If it asks you to sign in, sign in <em>there, on Google's page</em> — WovenCut never sees or stores your Google password. That's deliberate: the app holds no accounts at all.</li>
          <li><strong>More than one channel?</strong> On YouTube, click your profile picture → <em>Switch account</em> and pick the channel you want <em>before</em> you upload, so the video lands on the right one.</li>
          <li><strong>Drop in your exported video</strong>, then press 📋 Copy Upload Text here and paste it into the title and description boxes — your original-creator credit is already inside.</li>
          <li><strong>Answer YouTube's questions</strong> (audience, visibility), press Publish, and you're live.</li>
        </ol>
        <p class="stub-note">Coming in a later phase: a “Sign in with Google” button that sends the video up in one click. It will still sign you in on Google's own page — same rule: your password never touches this app.</p>
      </details>
    </div>`;
}

// Panel UI: shows the plan and, in the desktop app, asks the main process
// to run the (stubbed) export so Paul sees exactly what Phase 4 will do.
export function mountExportPanel(project, container, hooks = {}) {
  const plan = planExport(project);
  container.innerHTML =
    `<label class="insp-field" title="Choose where this video is headed and the export matches its shape and frame rate. Every preset opens on your first clip at full strength — no fade-in, no black lead-in, ever (Paul's first-frame rule).">
      <span class="insp-label">🎯 Export preset — where is this video going?</span>
      <select id="export-preset">
        ${EXPORT_PRESETS.map((p) => `<option value="${p.id}" ${p.id === (project.exportPreset || "youtube-1080") ? "selected" : ""}>${p.label}</option>`).join("")}
      </select>
    </label>` +
    `<label class="insp-field" title="YouTube and TikTok quietly turn every upload to the same loudness (−14 LUFS). Tick this and the export is normalised to that level itself, so your video sounds as loud as you mixed it instead of being turned down by the platform. It is applied by FFmpeg's loudnorm filter to the finished audio when the video renders (Phase 4).">
      <span class="insp-label">🔊 Loudness</span>
      <span><input type="checkbox" id="export-loudness" ${project.loudnessNormalize ? "checked" : ""}> Normalise loudness for YouTube / TikTok (−14 LUFS)</span>
    </label>` +
    `<label class="insp-field" title="Burned in: the captions become part of the picture, exactly as the preview shows them — they always show, on every player. Sidecar file: the picture stays clean and a separate .srt subtitle file travels with the video — upload it next to the video and viewers can turn captions on or off.">
      <span class="insp-label">💬 Captions in the export</span>
      <select id="export-caption-mode">
        <option value="burn" ${project.captionMode !== "srt" ? "selected" : ""}>🔥 Burned into the picture — always visible</option>
        <option value="srt" ${project.captionMode === "srt" ? "selected" : ""}>📄 Sidecar .srt file — viewers can switch them on/off</option>
      </select>
    </label>` +
    `<p class="stub-note">Engine: ${plan.engine}.<br>` +
    `Preset: ${plan.preset}.<br>` +
    `Output: ${plan.output}<br>` +
    `Loudness: ${plan.loudness}.<br>` +
    `Captions: ${plan.captions}.<br>` +
    `First frame: ${plan.firstFrame}.<br>` +
    `Clips: ${plan.clips} · Layer items: ${plan.overlays} · Background items: ${plan.background} · ` +
    `Green-screen clips: ${plan.keyedClips} · ` +
    `Length: ${plan.durationSeconds}s · Music: ${plan.music} · Ducking: ${plan.ducking}</p>` +
    `<button type="button" class="tool-btn primary" data-action="run-export"` +
    ` title="Render the finished video as an MP4 with FFmpeg — on this computer, nothing is uploaded. In the desktop app a save box asks where to put the file first.">` +
    `📤 Render the Video (MP4)</button>` +
    ` <button type="button" class="tool-btn danger" data-action="cancel-export" hidden` +
    ` title="Stop the render that's running. The unfinished file is not kept as a finished export.">⏹️ Cancel Rendering</button>` +
    `<p class="stub-note" data-export-progress hidden></p>` +
    `<pre class="export-result" hidden></pre>` +
    ytSection(project);
  container.querySelector("#export-preset")?.addEventListener("change", (e) => {
    project.exportPreset = e.target.value;
    hooks.onChange?.();
  });
  container.querySelector("#export-loudness")?.addEventListener("change", (e) => {
    project.loudnessNormalize = e.target.checked;
    hooks.onChange?.();
  });
  container.querySelector("#export-caption-mode")?.addEventListener("change", (e) => {
    project.captionMode = e.target.value;
    hooks.onChange?.();
  });
  const btn = container.querySelector('[data-action="run-export"]');
  const cancelBtn = container.querySelector('[data-action="cancel-export"]');
  const progress = container.querySelector("[data-export-progress]");
  const out = container.querySelector(".export-result");
  hooks.onProgress?.(({ t, durationOut }) => {
    if (progress.hidden) return; // only while a render from this panel runs
    const pct = durationOut > 0 ? Math.min(100, Math.round((t / durationOut) * 100)) : 0;
    progress.textContent = `🎬 Rendering… ${t}s of ${durationOut}s (${pct}%)`;
  });
  cancelBtn?.addEventListener("click", async () => {
    await hooks.cancelExport?.();
  });
  btn.addEventListener("click", async () => {
    out.hidden = false;
    if (!hooks.runExport) {
      out.textContent =
        "No desktop shell detected (browser preview). Rendering lives in " +
        "the Electron main process — run the desktop app to export.";
      return;
    }
    btn.disabled = true;
    if (hooks.cancelExport) cancelBtn.hidden = false;
    progress.hidden = false;
    progress.textContent = "🎬 Rendering… preparing the render graph.";
    out.textContent = "Rendering with FFmpeg…";
    try {
      const res = await hooks.runExport(project);
      out.textContent =
        (res.message || JSON.stringify(res, null, 2)) +
        (res.ffmpegArgs ? `\n\nThe exact command that ran:\n${res.ffmpegArgs.join(" ")}` : "");
      progress.textContent = res.ok
        ? "✅ Render complete."
        : "⏹️ Render did not complete — see the message below.";
    } finally {
      btn.disabled = false;
      cancelBtn.hidden = true;
    }
  });

  // YouTube upload kit wiring.
  const yt = buildYoutubeMetadata(project);
  const ytStatus = container.querySelector(".yt-status");
  const kitText =
    `TITLE:\n${yt.title}\n\nDESCRIPTION:\n${yt.description}\n\nTAGS:\n${yt.tags.join(", ")}\n`;
  const say = (msg) => {
    ytStatus.hidden = false;
    ytStatus.textContent = msg;
  };
  container.querySelector('[data-action="yt-copy"]')?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(kitText);
      say("📋 Copied — paste it into the YouTube upload page.");
    } catch {
      say("Copy didn't work here — the text is in the boxes above; select and copy it by hand.");
    }
  });
  container.querySelector('[data-action="yt-save"]')?.addEventListener("click", async () => {
    if (hooks.saveTextFile) {
      const path = await hooks.saveTextFile(`${project.title || "wovencut"} — YouTube upload kit.txt`, kitText);
      say(path ? `💾 Saved the upload kit to ${path}` : "Save cancelled — nothing written.");
    } else {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([kitText], { type: "text/plain" }));
      a.download = "youtube-upload-kit.txt";
      a.click();
      URL.revokeObjectURL(a.href);
      say("💾 Upload kit downloaded.");
    }
  });
  container.querySelector('[data-action="yt-open"]')?.addEventListener("click", () => {
    window.open("https://www.youtube.com/upload", "_blank");
    say("▶️ YouTube's upload page is opening in your browser. Drop in the exported MP4, then paste the upload text (Copy button above).");
  });

  // TikTok / Instagram kit wiring (same copy + open-page pattern).
  for (const [key, url, name] of [
    ["tt", "https://www.tiktok.com/upload", "TikTok"],
    ["ig", "https://www.instagram.com/", "Instagram"],
  ]) {
    const text = container.querySelector(`[data-kit="${key}-text"]`)?.value || "";
    const st = container.querySelector(`[data-kit="${key}-status"]`);
    const sayK = (msg) => {
      if (st) { st.hidden = false; st.textContent = msg; }
    };
    container.querySelector(`[data-action="${key}-copy"]`)?.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(text);
        sayK("📋 Caption copied — paste it into the upload page.");
      } catch {
        sayK("Copy didn't work here — the caption is in the box above; select and copy it by hand.");
      }
    });
    container.querySelector(`[data-action="${key}-open"]`)?.addEventListener("click", () => {
      window.open(url, "_blank");
      sayK(`▶️ ${name} is opening in your browser. Add your exported video, then paste the caption.`);
    });
  }
}
