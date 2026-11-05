// WovenCut (working title) — REAL export rendering (Phase 4, pro pass 2)
// ---------------------------------------------------------------------------
// buildFfmpegArgs (export.js) is the readable PLAN. This module builds
// the graph that actually renders: a complete, runnable FFmpeg command
// for the main track, derived from the same project model.
//
// What v1 renders, honestly:
//  - Main track: video clips (trimmed) and stills (looped), scaled/padded
//    to the export frame, per-clip fade-in/out honoured — a 0 fade emits
//    no filter, so Paul's first frame opens at full strength.
//  - Transitions: cut boundaries split the track into scenes; inside a
//    scene, boundaries join with xfade (video) + acrossfade (audio) in
//    the transition the user picked. Scenes join with the concat filter.
//    NOTE: xfade-style transitions overlap their two clips, so a rendered
//    video is shorter than the timeline by the sum of its transition
//    lengths — the same trade pro editors make (their transitions eat
//    clip handles; WovenCut clips have no spare handles yet).
//  - A dip transition IS the fade through black/white at that join, so a
//    clip's own fade-in (or the previous clip's fade-out) is not applied
//    twice across a dip — the builder skips it and says so in warnings.
//  - Audio: every item contributes its real audio when it has a stream,
//    silence when it doesn't (stills, muted clips). Music (if any) is
//    looped under everything at its set volume, ducked by
//    sidechaincompress when ducking is on, and the whole mix gets
//    loudnorm when loudness normalisation is on.
//  - Captions burn in via the subtitles filter when the caller supplies
//    an .srt file (the desktop shell writes one from the project).
//
// What v1 does NOT render yet (reported in `warnings`, never silently
// dropped): layer lanes (PiP), the background lane, green-screen keying.
// Those join the graph in a later Phase 4 step.
//
// Callers must say which main items carry an audio stream
// (opts.hasAudio, parallel to tracks.main; default: clips yes, stills
// no). The desktop shell will probe with ffprobe later; a wrong "yes"
// makes FFmpeg fail loudly rather than render something false.

import { getExportSpec } from "./export.js";
import { transitionById } from "./model.js";

const escFilterPath = (p) =>
  String(p).replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/'/g, "\\'");

export function buildRenderArgs(project, outputPath, opts = {}) {
  const warnings = [];
  const main = project.tracks.main;
  if (!main.length) throw new Error("Nothing to render: the main track is empty.");
  main.forEach((item, i) => {
    if (!item.src) {
      throw new Error(
        `Clip ${i + 1} ("${item.label}") is a placeholder with no file — ` +
        `import the real file before exporting.`
      );
    }
  });
  const spec = getExportSpec(project);
  const { width: W, height: H, fps: F } = spec;
  const hasAudio = main.map((it, i) =>
    opts.hasAudio ? Boolean(opts.hasAudio[i]) : it.kind !== "still"
  );

  const layerCount = (project.tracks.layers || []).reduce((s, l) => s + l.length, 0);
  if (layerCount) warnings.push(`${layerCount} layer (picture-in-picture) item(s) are not in the render yet — main track only.`);
  if ((project.tracks.background || []).length) warnings.push("Background lane items are not in the render yet.");
  if (main.some((i) => i.keyGreen)) warnings.push("Green-screen keying is not in the render yet — keyed clips render as normal clips.");

  const args = ["-y"];
  const filters = [];

  // --- Inputs + per-item prep -------------------------------------------------
  main.forEach((item, i) => {
    if (item.kind === "still") {
      args.push("-loop", "1", "-t", String(item.duration), "-i", item.src);
    } else {
      if (item.trimIn > 0) args.push("-ss", String(item.trimIn));
      args.push("-t", String(item.duration), "-i", item.src);
    }
  });
  // Extra silent-audio inputs for items with no audio stream.
  const silenceIdx = new Map();
  main.forEach((item, i) => {
    if (!hasAudio[i]) {
      silenceIdx.set(i, main.length + silenceIdx.size + (project.music?.src ? 1 : 0));
    }
  });
  const musicIdx = project.music?.src ? main.length : -1;
  if (project.music?.src) args.push("-stream_loop", "-1", "-i", project.music.src);
  for (const [, idx] of silenceIdx) {
    args.push("-f", "lavfi", "-t", String(Math.max(...main.map((m) => m.duration))),
      "-i", "anullsrc=r=48000:cl=stereo");
  }

  const isDip = (item) => item.transitionIn === "dipblack" || item.transitionIn === "dipwhite";
  main.forEach((item, i) => {
    const vf = [
      `scale=${W}:${H}:force_original_aspect_ratio=decrease`,
      `pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2`,
      `fps=${F}`, "setsar=1", "settb=AVTB", "format=yuv420p",
    ];
    const prev = main[i - 1];
    const next = main[i + 1];
    if (item.fadeIn > 0) {
      if (i > 0 && isDip(item)) {
        warnings.push(`Clip ${i + 1}: fade-in skipped — the dip transition at its start already fades from the dip colour.`);
      } else {
        vf.push(`fade=t=in:st=0:d=${item.fadeIn}`);
      }
    }
    if (item.fadeOut > 0) {
      if (next && isDip(next)) {
        warnings.push(`Clip ${i + 1}: fade-out skipped — the dip transition at its end already fades to the dip colour.`);
      } else {
        vf.push(`fade=t=out:st=${Math.max(0, item.duration - item.fadeOut)}:d=${item.fadeOut}`);
      }
    }
    filters.push(`[${i}:v]${vf.join(",")}[v${i}]`);
    if (hasAudio[i]) {
      filters.push(`[${i}:a]aresample=48000,atrim=0:${item.duration},asetpts=PTS-STARTPTS[a${i}]`);
    } else {
      filters.push(`[${silenceIdx.get(i)}:a]atrim=0:${item.duration},asetpts=PTS-STARTPTS[a${i}]`);
    }
  });

  // --- Scenes: split at cut boundaries, xfade within, concat between ---------
  const scenes = [[0]];
  main.forEach((item, i) => {
    if (i === 0) return;
    if (!item.transitionIn || item.transitionIn === "cut") scenes.push([i]);
    else scenes[scenes.length - 1].push(i);
  });

  const sceneVideo = [];
  const sceneAudio = [];
  scenes.forEach((scene, s) => {
    let vLabel = `v${scene[0]}`;
    let aLabel = `a${scene[0]}`;
    let offset = main[scene[0]].duration;
    for (let k = 1; k < scene.length; k++) {
      const item = main[scene[k]];
      const td = Math.max(0.1, item.transitionDuration || 0.5);
      const tName = transitionById(item.transitionIn).xfade || "fade";
      const off = +(offset - td).toFixed(3);
      const xv = `xv${s}_${k}`;
      filters.push(`[${vLabel}][v${scene[k]}]xfade=transition=${tName}:duration=${td}:offset=${off}[${xv}]`);
      const xa = `xa${s}_${k}`;
      filters.push(`[${aLabel}][a${scene[k]}]acrossfade=d=${td}[${xa}]`);
      vLabel = xv;
      aLabel = xa;
      offset = +(offset + item.duration - td).toFixed(3);
    }
    sceneVideo.push(vLabel);
    sceneAudio.push(aLabel);
  });

  let mainVideo = sceneVideo[0];
  let mainAudio = sceneAudio[0];
  if (scenes.length > 1) {
    filters.push(`${sceneVideo.map((l) => `[${l}]`).join("")}concat=n=${scenes.length}:v=1:a=0[scv]`);
    filters.push(`${sceneAudio.map((l) => `[${l}]`).join("")}concat=n=${scenes.length}:v=0:a=1[sca]`);
    mainVideo = "scv";
    mainAudio = "sca";
  }

  // Output duration: timeline length minus the transition overlaps.
  let durationOut = main.reduce((s, i) => s + i.duration, 0);
  main.forEach((item, i) => {
    if (i > 0 && item.transitionIn && item.transitionIn !== "cut") {
      durationOut -= Math.max(0.1, item.transitionDuration || 0.5);
    }
  });
  durationOut = +durationOut.toFixed(3);

  // --- Captions burn-in ---------------------------------------------------------
  let finalVideo = mainVideo;
  if (project.captionMode === "srt") {
    // Sidecar mode: picture stays clean; the .srt ships beside the video.
  } else if (project.captions?.some((c) => c.text)) {
    if (opts.srtPath) {
      filters.push(
        `[${mainVideo}]subtitles=filename='${escFilterPath(opts.srtPath)}':` +
        `force_style='FontSize=22,BackColour=&H99000000,BorderStyle=4'[vburn]`
      );
      finalVideo = "vburn";
    } else {
      warnings.push("Captions exist but no .srt file was supplied to the renderer — captions were not burned in.");
    }
  }

  // --- Music mix + ducking + loudness -------------------------------------------
  let finalAudio = mainAudio;
  if (project.music?.src) {
    filters.push(
      `[${musicIdx}:a]atrim=0:${durationOut},asetpts=PTS-STARTPTS,` +
      `aresample=48000,volume=${project.music.volume ?? 0.8}[mus]`
    );
    if (project.music.duck) {
      const amt = project.music.duckAmount ?? 0.6;
      const ratio = Math.max(2, Math.round(1 / Math.max(0.05, 1 - amt)));
      filters.push(`[${mainAudio}]asplit=2[akey][amain]`);
      filters.push(`[mus][akey]sidechaincompress=threshold=0.02:ratio=${ratio}:attack=20:release=300[musd]`);
      filters.push(`[amain][musd]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[mix]`);
    } else {
      filters.push(`[${mainAudio}][mus]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[mix]`);
    }
    finalAudio = "mix";
  }
  if (project.loudnessNormalize) {
    filters.push(`[${finalAudio}]loudnorm=I=-14:TP=-1:LRA=11[aout]`);
    finalAudio = "aout";
  }

  args.push(
    "-filter_complex", filters.join(";"),
    "-map", `[${finalVideo}]`, "-map", `[${finalAudio}]`,
    "-c:v", "libx264", "-preset", "medium", "-c:a", "aac", "-b:a", "160k",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart",
    outputPath
  );
  return { args, durationOut, warnings };
}
