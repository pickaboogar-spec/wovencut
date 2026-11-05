// WovenCut (working title) — audio waveforms (pro-upgrade batch, Nov 5 2026)
// ---------------------------------------------------------------------------
// Pro timelines draw the sound INSIDE each clip: you can SEE the loud
// parts, the quiet parts, and where a sentence starts. WovenCut computes
// real peaks from the actual file (Web Audio decoding, on this machine
// only — nothing is uploaded) and stores a small peaks array on the item
// (project.music.peaks / main item .peaks), so saved projects reopen with
// their waveforms intact.
//
// Honest limits: decoding needs the file's bytes. Files dropped in (or
// read through the desktop shell) decode fine; a clip whose file can't be
// read or has no audio track simply shows no waveform — never a fake one.

export const PEAK_COUNT = 160;

let sharedCtx = null;
function audioContext() {
  if (!sharedCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    sharedCtx = new AC();
  }
  return sharedCtx;
}

// Reduce a decoded AudioBuffer to PEAK_COUNT normalised peak values.
export function peaksFromBuffer(buffer, count = PEAK_COUNT) {
  const channels = [];
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }
  if (!channels.length || !channels[0].length) return null;
  const len = channels[0].length;
  const peaks = [];
  for (let i = 0; i < count; i++) {
    const start = Math.floor((i / count) * len);
    const end = Math.max(start + 1, Math.floor(((i + 1) / count) * len));
    let max = 0;
    // Sample the bucket (stride keeps huge files fast) — peaks are a
    // visual summary, not an analysis.
    const stride = Math.max(1, Math.floor((end - start) / 400));
    for (let s = start; s < end; s += stride) {
      for (const ch of channels) {
        const v = Math.abs(ch[s]);
        if (v > max) max = v;
      }
    }
    peaks.push(+Math.min(1, max).toFixed(3));
  }
  return peaks;
}

// Decode raw bytes (ArrayBuffer) → peaks, or null on any failure.
export async function peaksFromBytes(arrayBuffer, count = PEAK_COUNT) {
  const ctx = audioContext();
  if (!ctx || !arrayBuffer) return null;
  try {
    // decodeAudioData detaches the buffer it is given — hand it a copy.
    const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
    return peaksFromBuffer(decoded, count);
  } catch {
    return null; // no audio track, unsupported codec, unreadable file
  }
}

// Decode a browser File object → peaks, or null.
export async function peaksFromFile(file, count = PEAK_COUNT) {
  if (!file) return null;
  try {
    return await peaksFromBytes(await file.arrayBuffer(), count);
  } catch {
    return null;
  }
}

// An inline SVG strip for a peaks array, drawn as vertical bars around a
// centre line — the classic waveform look. Height is fixed by CSS; the
// viewBox keeps bars proportional at any block width.
export function waveformSvg(peaks, className = "tl-wave") {
  if (!peaks?.length) return "";
  const n = peaks.length;
  const mid = 12;
  let d = "";
  for (let i = 0; i < n; i++) {
    const h = Math.max(0.8, peaks[i] * (mid - 1));
    const x = (i + 0.5).toFixed(1);
    d += `M${x} ${(mid - h).toFixed(1)}V${(mid + h).toFixed(1)}`;
  }
  return `<svg class="${className}" viewBox="0 0 ${n} 24" preserveAspectRatio="none" aria-hidden="true"><path d="${d}"/></svg>`;
}
