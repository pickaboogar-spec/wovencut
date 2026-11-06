// WovenCut (working title) — Wi-Fi / network camera core (Paul, Nov 5 2026)
// ---------------------------------------------------------------------------
// OBS-style network-camera ingest, the honest first pass: WovenCut can
// RECORD a network camera's RTSP feed into the project (with its sound),
// and TEST the connection so the user knows the camera is there and what
// it's sending. Watching the feed live inside the preview is NOT built —
// the preview still draws placeholder frames (Phase 3); this module never
// pretends otherwise.
//
// Cameras are generic: anything that serves an RTSP stream (TP-Link Tapo,
// most ONVIF cameras, many security cams) works through the same fields.
// ONVIF is only how some cameras are *found* on a network; the feed itself
// is RTSP, and that is what we record.
//
// This file is pure logic — no DOM, no Electron, no spawning — so the
// node test suite exercises all of it. The Electron main process imports
// the arg builders (same pattern as export.js/render.js) so the args the
// tests verify are the args the app runs. The renderer imports the URL
// and validation helpers for the panel form.
//
// PRIVACY: a camera's password lives only inside the RTSP address in the
// user's own project file, on their own machine — the same posture as
// every other WovenCut file. Nothing here phones home, and
// maskRtspUrl() exists so status lines and error reports never print it.

export const DEFAULT_RTSP_PORT = 554;
export const PROBE_TIMEOUT_MS = 12000;

// The two stream paths TP-Link Tapo cameras serve. stream1 is the full
// quality feed; stream2 is the smaller one (easier on a weak Wi-Fi).
export const TAPO_STREAMS = [
  { path: "/stream1", label: "Stream 1 — best quality (Tapo)" },
  { path: "/stream2", label: "Stream 2 — smaller, gentler on Wi-Fi (Tapo)" },
];

let camUid = 0;
function nextCamId() {
  camUid += 1;
  return `cam${Date.now().toString(36)}${camUid}`;
}

// A camera record as stored in project.cameras. Plain fields (not a
// pre-built URL) so the form can edit them and the password can stay
// masked in the UI while the URL is built on demand.
export function newCamera({
  name = "", host = "", port = DEFAULT_RTSP_PORT, path = "/stream1",
  username = "", password = "",
} = {}) {
  return {
    id: nextCamId(),
    name: String(name || "").trim(),
    host: String(host || "").trim(),
    port: Number(port) || DEFAULT_RTSP_PORT,
    path: normalizeStreamPath(path),
    username: String(username || ""),
    password: String(password || ""),
  };
}

export function normalizeStreamPath(p) {
  let s = String(p || "").trim();
  if (!s) return "/stream1";
  if (!s.startsWith("/")) s = `/${s}`;
  return s;
}

// Build the RTSP address from a camera record. Username/password are
// percent-encoded: camera passwords routinely contain @, :, or / and an
// unencoded one would corrupt the address.
export function buildRtspUrl(cam) {
  const host = String(cam?.host || "").trim();
  const port = Number(cam?.port) || DEFAULT_RTSP_PORT;
  const path = normalizeStreamPath(cam?.path);
  const user = String(cam?.username || "");
  const pass = String(cam?.password || "");
  const auth = user
    ? `${encodeURIComponent(user)}${pass ? `:${encodeURIComponent(pass)}` : ""}@`
    : "";
  return `rtsp://${auth}${host}:${port}${path}`;
}

// Parse a pasted RTSP address back into camera fields (so a user who
// already knows their camera's address — e.g. from OBS — can paste it).
// Returns { ok, camera, errors } with plain-words errors.
export function parseRtspUrl(text) {
  const errors = [];
  const raw = String(text || "").trim();
  if (!raw) return { ok: false, camera: null, errors: ["The address box is empty."] };
  let u;
  try {
    u = new URL(raw);
  } catch {
    return { ok: false, camera: null, errors: ["That doesn't look like an address WovenCut can read. It should look like rtsp://192.168.1.50:554/stream1"] };
  }
  if (u.protocol !== "rtsp:" && u.protocol !== "rtsps:") {
    errors.push("A camera address has to start with rtsp:// — that's the language network cameras speak.");
  }
  if (!u.hostname) errors.push("The address is missing the camera's IP address (the numbers, like 192.168.1.50).");
  const port = u.port ? Number(u.port) : DEFAULT_RTSP_PORT;
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    errors.push("The port has to be a number between 1 and 65535 (554 is the usual one).");
  }
  if (errors.length) return { ok: false, camera: null, errors };
  const dec = (s) => { try { return decodeURIComponent(s); } catch { return s; } };
  return {
    ok: true,
    errors: [],
    camera: newCamera({
      host: u.hostname,
      port,
      path: u.pathname && u.pathname !== "/" ? u.pathname : "/stream1",
      username: dec(u.username || ""),
      password: dec(u.password || ""),
    }),
  };
}

// Human checks on a camera record before Test/Record do anything.
// Returns an array of plain-words problems; empty means good to go.
export function validateCamera(cam) {
  const problems = [];
  const host = String(cam?.host || "").trim();
  if (!host) {
    problems.push("The camera's address (its IP, like 192.168.1.50) is missing.");
  } else if (/[\s/\\]/.test(host) || host.includes("://")) {
    problems.push("The address should be just the camera's IP numbers (like 192.168.1.50) — no rtsp://, no spaces, no slashes in this box.");
  }
  const port = Number(cam?.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    problems.push("The port has to be a whole number between 1 and 65535 (554 is the usual one).");
  }
  if (String(cam?.password || "") && !String(cam?.username || "")) {
    problems.push("There's a password but no username — the camera needs both. On a Tapo, both come from the camera account you make in the Tapo app's RTSP settings.");
  }
  return problems;
}

// The address with the password hidden — for status lines, logs, and
// anywhere a human might screenshot. Never print the real one. Done as
// string surgery, not URL re-serialisation: the URL parser would
// percent-encode the mask bullets into unreadable %E2%80%A2 soup.
export function maskRtspUrl(url) {
  return String(url || "").replace(
    /^([a-z][a-z0-9+.-]*:\/\/)([^:/@]+):([^@/]*)@/i,
    "$1$2:••••@"
  );
}

// FFmpeg capture arguments: pull the RTSP stream and save it as-is
// (-c copy: no re-encoding, no quality loss, no CPU burn, and — by
// construction — no filters of any kind, so no fade can ever sneak into
// a recording). .mkv container because it accepts every codec cameras
// send and survives an abrupt stop; WovenCut already treats .mkv as a
// normal clip everywhere. Audio is mapped optionally: cameras with no
// microphone still record fine.
// durationSec > 0 adds -t (auto-stop); 0/absent records until Stop.
export function buildCaptureArgs(cam, outPath, { durationSec = 0 } = {}) {
  const args = [
    "-hide_banner", "-loglevel", "warning",
    "-rtsp_transport", "tcp",
    "-i", buildRtspUrl(cam),
    "-map", "0:v:0",
    "-map", "0:a:0?",
    "-c", "copy",
  ];
  const d = Number(durationSec);
  if (Number.isFinite(d) && d > 0) args.push("-t", String(Math.floor(d)));
  args.push("-y", String(outPath));
  return args;
}

// ffprobe arguments (used when an ffprobe binary is available; the main
// process falls back to parsing `ffmpeg -i` output when it isn't — the
// ffmpeg-static bundle WovenCut ships carries no ffprobe).
export function buildFfprobeArgs(cam) {
  return [
    "-v", "error",
    "-rtsp_transport", "tcp",
    "-show_streams",
    "-of", "json",
    buildRtspUrl(cam),
  ];
}

// Parse the stream list `ffmpeg -i <url>` prints to stderr (the same
// trick the export pipeline uses to detect audio). Returns
// { durationSec, video: {codec,width,height,fps}|null, audio: {codec}|null }.
export function parseFfmpegProbeText(text) {
  const out = { durationSec: null, video: null, audio: null };
  const s = String(text || "");
  const dur = /Duration:\s*(\d+):(\d+):([\d.]+)/.exec(s);
  if (dur) out.durationSec = +dur[1] * 3600 + +dur[2] * 60 + +dur[3];
  for (const line of s.split(/\r?\n/)) {
    const v = /Stream .*Video:\s*([a-z0-9_]+)[^,]*,\s*.*?(\d{2,5})x(\d{2,5})/i.exec(line);
    if (v && !out.video) {
      const fpsM = /([\d.]+)\s*fps/.exec(line);
      out.video = {
        codec: v[1],
        width: Number(v[2]),
        height: Number(v[3]),
        fps: fpsM ? Math.round(Number(fpsM[1])) : null,
      };
      continue;
    }
    const a = /Stream .*Audio:\s*([a-z0-9_]+)/i.exec(line);
    if (a && !out.audio) out.audio = { codec: a[1] };
  }
  return out;
}

// Parse ffprobe's JSON into the same shape as parseFfmpegProbeText.
export function parseFfprobeJson(jsonText) {
  const out = { durationSec: null, video: null, audio: null };
  let data;
  try {
    data = JSON.parse(String(jsonText || ""));
  } catch {
    return out;
  }
  for (const st of data.streams || []) {
    if (st.codec_type === "video" && !out.video) {
      let fps = null;
      const rate = st.avg_frame_rate || st.r_frame_rate || "";
      const [n, d] = rate.split("/").map(Number);
      if (n && d) fps = Math.round(n / d);
      out.video = {
        codec: st.codec_name || "",
        width: Number(st.width) || null,
        height: Number(st.height) || null,
        fps,
      };
    } else if (st.codec_type === "audio" && !out.audio) {
      out.audio = { codec: st.codec_name || "" };
    }
  }
  return out;
}

const CODEC_WORDS = {
  h264: "H.264", hevc: "H.265", h265: "H.265", mjpeg: "MJPEG",
  aac: "AAC", pcm_alaw: "G.711", pcm_mulaw: "G.711", mp3: "MP3",
  opus: "Opus", mpeg4: "MPEG-4",
};
export function codecWord(codec) {
  if (!codec) return "";
  return CODEC_WORDS[String(codec).toLowerCase()] || String(codec).toUpperCase();
}

// What the camera is sending, in plain words — the Test Connection
// result a first-time user can actually read.
export function summarizeProbe(probe) {
  if (!probe?.video) return "The camera answered, but WovenCut couldn't make sense of its video stream.";
  const v = probe.video;
  const parts = [];
  if (v.width && v.height) parts.push(`${v.width}×${v.height}`);
  if (v.fps) parts.push(`${v.fps} frames per second`);
  if (v.codec) parts.push(`${codecWord(v.codec)} video`);
  let s = parts.join(" · ") || "Video stream found";
  s += probe.audio?.codec
    ? ` · ${codecWord(probe.audio.codec)} sound`
    : " · no sound track (this camera model may have no microphone, or sound is off in its settings)";
  return s;
}

// Turn FFmpeg/ffprobe failure output into a plain-language explanation.
// kind: "auth" | "unreachable" | "notfound" | "unknown".
export function classifyNetcamError(text) {
  const s = String(text || "");
  if (/401|unauthori[sz]ed|authori[sz]ation failed/i.test(s)) {
    return {
      kind: "auth",
      message:
        "The camera answered but refused the username or password. On a Tapo, " +
        "that's the special camera account you make in the Tapo app under the " +
        "camera's RTSP / advanced settings — not your normal Tapo app login.",
    };
  }
  if (/404|Server returned 4|not found/i.test(s)) {
    return {
      kind: "notfound",
      message:
        "The camera answered, but it doesn't know that stream path. For Tapo " +
        "cameras the paths are /stream1 (best quality) and /stream2 (smaller) — " +
        "check the Stream box.",
    };
  }
  if (/timed out|timeout|no route to host|network is unreachable|name or service not known|failed to resolve/i.test(s)) {
    return {
      kind: "unreachable",
      message:
        "WovenCut couldn't reach the camera at all — the wait timed out. Check " +
        "the camera is switched on, this computer is on the same Wi-Fi network " +
        "as the camera, and the address numbers are right.",
    };
  }
  if (/connection refused|connection reset|eof|server closed/i.test(s)) {
    return {
      kind: "unreachable",
      message:
        "The camera's address answered but refused the stream — that usually " +
        "means RTSP isn't switched on in the camera's settings yet, or the " +
        "address belongs to a different device. On a Tapo: camera settings → " +
        "Advanced → RTSP, and make the camera account there.",
    };
  }
  return {
    kind: "unknown",
    message:
      "The camera connection didn't work, and the error doesn't match a known " +
      "pattern. Check the camera is on, on the same Wi-Fi as this computer, " +
      "and RTSP is switched on in its settings — then try Test Connection again.",
  };
}
