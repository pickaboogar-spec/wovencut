// WovenCut (working title) — music track (Phase 3 wires playback)
// ---------------------------------------------------------------------------
// The project model stores music as a FILE REFERENCE ONLY:
//   project.music = { src, volume, duck, duckAmount, peaks? }
// WovenCut never bundles, uploads, or proxies audio. The reference can be
// set (drop an audio file on the timeline, or the 🎵 Add Music button)
// and its volume edited in the inspector. Playback synced with the
// preview is Phase 3.
//
// DUCKING (pro pass 2, Nov 5 2026): when ducking is ON, the music dips
// automatically while the main track is making sound, so speech stays on
// top — the Essential Sound / CapCut behaviour. The model here is REAL,
// not decorative: the envelope is computed from the main clips' actual
// decoded waveforms (item.peaks, see waveform.js). Where a clip has no
// decoded waveform the app cannot prove it makes sound, so it does not
// duck under it — no fake precision. The timeline's music block draws
// the resulting duck curve so the user can SEE where the music will dip.
// At render time (Phase 4) FFmpeg's sidechaincompress does the same job
// listening to the actual mixed audio; the planner emits it (export.js).
//
// OPEN QUESTION for Paul's Phase 3 review gate: may the music bed fade IN
// under the first still? Default is NO — the first-frame rule is about the
// picture opening at full strength, and the conservative reading extends it
// to the whole open. Fade-OUT at the end is unrestricted.

import { itemStartTimes, projectDuration } from "./model.js";

// A main clip counts as "making sound" at a moment when its decoded peak
// there clears this (peaks are normalised 0..1).
export const DUCK_THRESHOLD = 0.08;
const ATTACK_S = 0.12; // how fast the music dips when sound starts
const RELEASE_S = 0.35; // how gently it comes back up in a gap

// The main track's loudness at time t, from real decoded peaks — or null
// when the clip under t has no waveform to judge by (or t is past the
// end). Peaks span the clip's on-screen duration.
export function mainLevelAt(project, t) {
  const starts = itemStartTimes(project);
  const i = project.tracks.main.findIndex(
    (it, k) => t >= starts[k] && t < starts[k] + it.duration
  );
  if (i === -1) return null;
  const item = project.tracks.main[i];
  if (!item.peaks?.length) return null;
  const frac = (t - starts[i]) / item.duration;
  const idx = Math.min(item.peaks.length - 1, Math.floor(frac * item.peaks.length));
  return item.peaks[idx];
}

// The music volume in effect at time t with ducking applied (unsmoothed
// target — the envelope below smooths it the way a compressor does).
export function musicVolumeTargetAt(project, t) {
  const m = project.music || {};
  const base = m.volume ?? 0.8;
  if (!m.src || !m.duck) return base;
  const level = mainLevelAt(project, t);
  if (level === null) return base; // no waveform → no proof of sound → no dip
  return level > DUCK_THRESHOLD ? base * (1 - (m.duckAmount ?? 0.6)) : base;
}

// The duck curve across the whole project: [{ t, v }] with compressor-
// style attack/release smoothing applied. samples ≈ curve resolution.
export function duckEnvelope(project, samples = 160) {
  const total = projectDuration(project);
  const out = [];
  if (!total) return out;
  let v = (project.music?.volume ?? 0.8);
  const dt = total / samples;
  for (let i = 0; i <= samples; i++) {
    const t = +(i * dt).toFixed(3);
    const target = musicVolumeTargetAt(project, t);
    const tau = target < v ? ATTACK_S : RELEASE_S;
    v += (target - v) * Math.min(1, dt / tau);
    out.push({ t, v: +v.toFixed(3) });
  }
  return out;
}

// The duck curve as an inline SVG strip for the music block on the
// timeline: a line that visibly DROPS where the music will dip. Empty
// string when ducking is off or there's nothing to draw.
export function duckEnvelopeSvg(project) {
  if (!project.music?.src || !project.music?.duck) return "";
  const env = duckEnvelope(project);
  if (env.length < 2) return "";
  const maxT = env[env.length - 1].t || 1;
  const pts = env
    .map((p) => `${((p.t / maxT) * 160).toFixed(1)},${(22 - Math.min(1, p.v) * 18).toFixed(1)}`)
    .join(" ");
  return `<svg class="tl-duck" viewBox="0 0 160 24" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts}"/></svg>`;
}

export function describeMusic(project) {
  const m = project.music;
  if (!m || !m.src) return "No music file chosen yet.";
  const duck = m.duck
    ? ` Ducking is ON: the music dips to ${Math.round((1 - (m.duckAmount ?? 0.6)) * 100)}% of its set volume while the main track is making sound (following the clips' real waveforms).`
    : " Ducking is OFF: the music holds its volume throughout (turn it on in the music inspector to dip it under speech).";
  return `${m.src} at ${Math.round(m.volume * 100)}% volume.${duck}`;
}

export function mountMusicPanel(project, container) {
  container.innerHTML =
    `<p class="stub-note">${describeMusic(project)} ` +
    `Set the music by dropping an audio file on the timeline or with the ` +
    `🎵 Add Music button; click the music block on the timeline for its ` +
    `volume and ducking controls. Playback sync arrives in Phase 3 — ` +
    `ducking is modelled and drawn now, and applied by the render.</p>`;
}
