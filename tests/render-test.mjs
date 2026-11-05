// WovenCut — Phase 4 render integration test (pro pass 2, Nov 5 2026)
// ---------------------------------------------------------------------------
// Generates real media with FFmpeg's lavfi sources, builds a real
// project (crossfade + dip-to-black + fade-out + music ducking +
// loudness + burned captions), renders it with buildRenderArgs, and
// verifies the output with ffprobe, blackdetect, and a loudnorm
// measurement. Runs the render TWICE: once with the system ffmpeg and
// once with the ffmpeg-static binary (the Phase 4 bundling path), when
// that binary is present at /tmp/ffstatic.
//
// Run: node tests/render-test.mjs   (needs ffmpeg + ffprobe on PATH)

import assert from "node:assert";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { emptyProject, newMainItem } from "../js/model.js";
import { captionsToSrt } from "../js/captions.js";
import { buildRenderArgs } from "../js/render.js";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wovencut-render-"));
const F = (name) => path.join(dir, name);
const run = (bin, args) => {
  const r = spawnSync(bin, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return r;
};
const must = (bin, args) => {
  const r = run(bin, args);
  if (r.status !== 0) throw new Error(`${bin} failed: ${r.stderr?.slice(-800)}`);
  return r;
};

// --- Generate media -----------------------------------------------------------
must("ffmpeg", ["-y", "-f", "lavfi", "-i", "testsrc2=size=640x360:rate=30:duration=4",
  "-f", "lavfi", "-i", "sine=frequency=440:duration=4", "-shortest",
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", F("clipA.mp4")]);
must("ffmpeg", ["-y", "-f", "lavfi", "-i", "smptebars=size=640x360:rate=30:duration=4",
  "-f", "lavfi", "-i", "sine=frequency=660:duration=4", "-shortest",
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", F("clipB.mp4")]);
must("ffmpeg", ["-y", "-f", "lavfi", "-i", "color=c=green:size=640x360",
  "-frames:v", "1", F("still.png")]);
must("ffmpeg", ["-y", "-f", "lavfi", "-i", "sine=frequency=220:duration=12",
  "-af", "volume=0.5", F("music.wav")]);

// --- Build the project ----------------------------------------------------------
const p = emptyProject("Render test");
p.settings = { width: 640, height: 360, fps: 30 };
p.exportPreset = "project";
p.tracks.main = [
  { ...newMainItem({ src: F("clipA.mp4"), label: "Clip A", duration: 4 }) },
  { ...newMainItem({ src: F("still.png"), label: "Green still", kind: "still", duration: 3 }),
    transitionIn: "crossfade", transitionDuration: 0.5 },
  { ...newMainItem({ src: F("clipB.mp4"), label: "Clip B", duration: 4 }),
    transitionIn: "dipblack", transitionDuration: 0.6, fadeOut: 1.0 },
];
assert.equal(p.tracks.main[0].fadeIn, 0); // Paul's rule in the render input
p.captions = [
  { id: "t1", start: 0.5, end: 2.5, text: "Hello from the render" },
  { id: "t2", start: 7.2, end: 9.2, text: "After the dip" },
];
p.captionMode = "burn";
p.music = { src: F("music.wav"), volume: 0.8, duck: true, duckAmount: 0.6 };
p.loudnessNormalize = true;
const srtPath = F("captions.srt");
fs.writeFileSync(srtPath, captionsToSrt(p));

// --- Render + verify --------------------------------------------------------------
function renderAndVerify(ffmpegBin, outName) {
  const { args, durationOut, warnings } = buildRenderArgs(p, F(outName), {
    hasAudio: [true, false, true],
    srtPath,
  });
  assert.equal(durationOut, 9.9); // 11s of clips − 0.5 crossfade − 0.6 dip
  const r = run(ffmpegBin, args);
  assert.equal(r.status, 0, `render failed (${ffmpegBin}): ${r.stderr?.slice(-600)}`);

  const probe = JSON.parse(execFileSync("ffprobe", [
    "-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", F(outName),
  ], { encoding: "utf8" }));
  const dur = parseFloat(probe.format.duration);
  assert.ok(Math.abs(dur - 9.9) < 0.4, `duration ${dur} ≈ 9.9`);
  const v = probe.streams.find((s) => s.codec_type === "video");
  const a = probe.streams.find((s) => s.codec_type === "audio");
  assert.ok(v && a, "output has video + audio streams");
  assert.deepEqual([v.width, v.height], [640, 360]);

  // Black detection: NOTHING black at the open (first-frame rule, in the
  // actual pixels), and a black pass exactly at the dip (≈5.9–6.5s).
  const bd = run(ffmpegBin, ["-i", F(outName), "-vf", "blackdetect=d=0.05:pix_th=0.10",
    "-an", "-f", "null", "-"]);
  const segs = [...bd.stderr.matchAll(/black_start:([\d.]+) black_end:([\d.]+)/g)]
    .map((m) => [+m[1], +m[2]]);
  assert.ok(!segs.some(([s, e]) => s < 0.4 && e > 0.05),
    `no black at the open (found ${JSON.stringify(segs)})`);
  assert.ok(segs.some(([s, e]) => s < 6.6 && e > 5.8),
    `dip-to-black present around 6.2s (found ${JSON.stringify(segs)})`);

  // Loudness: the rendered mix measures at the −14 LUFS target.
  const ln = run(ffmpegBin, ["-i", F(outName), "-af", "loudnorm=print_format=json",
    "-vn", "-f", "null", "-"]);
  const measured = JSON.parse(ln.stderr.match(/"input_i"\s*:\s*"(-?[\d.]+)"/)[0].split(":")[1].replace(/"/g, ""));
  assert.ok(Math.abs(measured - -14) < 2, `loudness ${measured} LUFS ≈ −14`);
  return { dur, measured, warnings, segs };
}

const sys = renderAndVerify("ffmpeg", "out-system.mp4");
console.log(`system ffmpeg: duration=${sys.dur.toFixed(2)}s loudness=${sys.measured} LUFS black=${JSON.stringify(sys.segs)}`);
console.log(`warnings: ${sys.warnings.join(" | ") || "(none)"}`);

const staticBin = "/tmp/ffstatic/node_modules/ffmpeg-static/ffmpeg";
if (fs.existsSync(staticBin)) {
  const st = renderAndVerify(staticBin, "out-static.mp4");
  console.log(`ffmpeg-static: duration=${st.dur.toFixed(2)}s loudness=${st.measured} LUFS`);
} else {
  console.log("ffmpeg-static binary not present at /tmp/ffstatic — skipped (system render still verified)");
}

// --- Refusals are honest ------------------------------------------------------------
import { sampleProject } from "../js/model.js";
assert.throws(() => buildRenderArgs(sampleProject(), F("x.mp4")), /placeholder/);
assert.throws(() => buildRenderArgs(emptyProject("e"), F("x.mp4")), /empty/);

console.log(`RENDER TESTS PASSED (media + outputs in ${dir})`);
