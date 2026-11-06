// WovenCut — a truly free video editor.
// Copyright (C) 2026 Paul Blanchard (Damonini) and Pepper —
// Damonini and Pepper Software Development.
// This program is free software under the GNU General Public License
// v3.0; see the LICENSE file at the project root.
// WovenCut (working title) — Electron main process
// ---------------------------------------------------------------------------
// Windows desktop shell for the editor (Phase 1 pivot, Paul's decision
// Nov 4 2026: Windows desktop first, drag-and-drop timeline, long-form
// YouTube output). This process owns the window, the native file dialogs,
// project file read/write, and the (stubbed) export pipeline.
//
// The renderer is served over a custom app:// protocol so its ES modules
// load reliably from disk (plain file:// module imports are unreliable in
// Chromium). The protocol only serves files inside the app folder.
//
// PRIVACY POSTURE (unchanged from the skeleton): no telemetry, no network
// calls, no accounts, no analytics. Nothing in this process phones home.

import { app, BrowserWindow, dialog, ipcMain, net, protocol, session, shell } from "electron";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// The renderer's export modules are pure ESM — reuse them here so the
// plan the UI shows is the plan the export runs, and the render graph
// the tests verified is the graph the app spawns.
import { buildFfmpegArgs, planExport } from "../js/export.js";
import { buildRenderArgs } from "../js/render.js";
import { captionsToSrt } from "../js/captions.js";
// Wi-Fi camera (Paul, Nov 5 2026): the same reuse rule — the arg
// builders and parsers the node tests verify are the ones this process
// spawns and reads.
import {
  newCamera, validateCamera, buildRtspUrl, buildCaptureArgs,
  buildFfprobeArgs, parseFfmpegProbeText, parseFfprobeJson,
  summarizeProbe, classifyNetcamError, maskRtspUrl, PROBE_TIMEOUT_MS,
} from "../js/netcam.js";

let mainWindow = null;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, "..");

protocol.registerSchemesAsPrivileged([
  {
    scheme: "app",
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
  },
]);

function createWindow() {
  const win = new BrowserWindow({
    width: 1480,
    height: 920,
    minWidth: 1080,
    minHeight: 700,
    backgroundColor: "#17181c", // editor-dark; no white flash on open
    title: "WovenCut (working title) — free video editor — Beta",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  win.removeMenu(); // the in-app toolbar is the menu (icons + labels rule)
  // External links (the YouTube upload page) open in the user's browser,
  // never inside the editor window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) shell.openExternal(url);
    return { action: "deny" };
  });
  win.loadURL("app://editor/index.html");
  mainWindow = win;
  return win;
}

// --- File dialogs -----------------------------------------------------------
// All media import flows through these filters so the renderer only ever
// receives real filesystem paths the user picked themselves.

const MEDIA_FILTERS = [
  {
    name: "Video, images & audio",
    extensions: [
      "mp4", "mov", "mkv", "webm", "avi", "m4v",
      "png", "jpg", "jpeg", "gif", "webp", "bmp",
      "mp3", "wav", "m4a", "ogg", "flac",
    ],
  },
  { name: "All files", extensions: ["*"] },
];

function registerIpc() {
  ipcMain.handle("dialog:openMedia", async () => {
    const res = await dialog.showOpenDialog({
      title: "Import clips, images or audio",
      properties: ["openFile", "multiSelections"],
      filters: MEDIA_FILTERS,
    });
    return res.canceled ? [] : res.filePaths;
  });

  ipcMain.handle("dialog:openAudio", async () => {
    const res = await dialog.showOpenDialog({
      title: "Choose a music file",
      properties: ["openFile"],
      filters: [
        { name: "Audio", extensions: ["mp3", "wav", "m4a", "ogg", "flac"] },
        { name: "All files", extensions: ["*"] },
      ],
    });
    return res.canceled ? null : res.filePaths[0];
  });

  ipcMain.handle("dialog:openProject", async () => {
    const res = await dialog.showOpenDialog({
      title: "Open a WovenCut project",
      properties: ["openFile"],
      filters: [{ name: "WovenCut project", extensions: ["json", "wovencut"] }],
    });
    if (res.canceled) return null;
    const filePath = res.filePaths[0];
    const text = await fs.promises.readFile(filePath, "utf8");
    return { filePath, project: JSON.parse(text) };
  });

  ipcMain.handle("dialog:saveProject", async (_event, project) => {
    const res = await dialog.showSaveDialog({
      title: "Save WovenCut project",
      defaultPath: `${project.title || "untitled"}.wovencut.json`,
      filters: [{ name: "WovenCut project", extensions: ["json"] }],
    });
    if (res.canceled) return null;
    await fs.promises.writeFile(res.filePath, JSON.stringify(project, null, 2), "utf8");
    return res.filePath;
  });

  // Reaction recorder: save a webcam take (webm bytes from the renderer)
  // wherever the user chooses. The take stays on this machine.
  ipcMain.handle("dialog:saveRecording", async (_event, arrayBuffer, defaultName) => {
    const res = await dialog.showSaveDialog({
      title: "Save your reaction take",
      defaultPath: defaultName || "reaction-take.webm",
      filters: [{ name: "WebM video", extensions: ["webm"] }],
    });
    if (res.canceled) return null;
    await fs.promises.writeFile(res.filePath, Buffer.from(arrayBuffer));
    return res.filePath;
  });

  // Save a plain-text file (the YouTube upload kit) where the user picks.
  ipcMain.handle("dialog:saveText", async (_event, defaultName, text) => {
    const res = await dialog.showSaveDialog({
      title: "Save text file",
      defaultPath: defaultName || "wovencut.txt",
      filters: [{ name: "Text", extensions: ["txt"] }],
    });
    if (res.canceled) return null;
    await fs.promises.writeFile(res.filePath, text, "utf8");
    return res.filePath;
  });

  // Waveform decoding (pro-upgrade batch, Nov 5 2026): the renderer draws
  // real audio waveforms for imported clips. It needs the file's bytes to
  // decode peaks — only ever for paths the user picked in a dialog or
  // dropped onto the timeline themselves. Capped at 512 MB; the bytes
  // stay in this process pair and are never written or sent anywhere.
  ipcMain.handle("file:readBytes", async (_event, filePath) => {
    try {
      if (typeof filePath !== "string" || !filePath) return null;
      const stat = await fs.promises.stat(filePath);
      if (!stat.isFile() || stat.size > 512 * 1024 * 1024) return null;
      return await fs.promises.readFile(filePath);
    } catch {
      return null;
    }
  });

  ipcMain.handle("dialog:saveVideo", async (_event, defaultName) => {
    const res = await dialog.showSaveDialog({
      title: "Export video",
      defaultPath: defaultName || "wovencut-export.mp4",
      filters: [{ name: "MP4 video", extensions: ["mp4"] }],
    });
    return res.canceled ? null : res.filePath;
  });

  // --- Export pipeline (REAL — Phase 4, pro pass 2, Nov 5 2026) -------------
  // Spawns FFmpeg with the graph from js/render.js → buildRenderArgs() —
  // the same builder the repo's render test verifies end-to-end. Binary
  // resolution, in order:
  //   1. The bundled ffmpeg-static binary (electron-builder unpacks it
  //      from the asar via asarUnpack; the path is rewritten to the
  //      unpacked location). No download at runtime, works offline.
  //   2. A system ffmpeg on PATH.
  // If neither exists, the export says so plainly instead of pretending.
  // Progress (from FFmpeg's stderr time= lines) is forwarded to the
  // window on "export:progress"; "export:cancel" kills the render.
  let ffmpegBinCache = null;
  async function resolveFfmpeg() {
    if (ffmpegBinCache) return ffmpegBinCache;
    try {
      const mod = await import("ffmpeg-static");
      let p = mod.default || mod;
      if (typeof p === "string" && p) {
        p = p.replace("app.asar", "app.asar.unpacked");
        if (fs.existsSync(p)) return (ffmpegBinCache = p);
      }
    } catch { /* not installed — fall through to system ffmpeg */ }
    const probe = spawn("ffmpeg", ["-version"], { shell: process.platform === "win32" });
    const ok = await new Promise((res) => {
      probe.on("error", () => res(false));
      probe.on("close", (code) => res(code === 0));
    });
    return (ffmpegBinCache = ok ? "ffmpeg" : null);
  }

  // Which main-track items carry an audio stream? Probed with the
  // bundled ffmpeg itself (`ffmpeg -i` prints the stream list — no
  // separate ffprobe to bundle). Stills never have one.
  const audioProbeCache = new Map();
  async function probeHasAudio(bin, item) {
    if (item.kind === "still" || !item.src) return false;
    if (audioProbeCache.has(item.src)) return audioProbeCache.get(item.src);
    const has = await new Promise((res) => {
      const ch = spawn(bin, ["-hide_banner", "-i", item.src], { shell: process.platform === "win32" });
      let err = "";
      ch.stderr.on("data", (d) => { err += d; });
      ch.on("error", () => res(false));
      ch.on("close", () => res(/Stream .* Audio:/.test(err)));
    });
    audioProbeCache.set(item.src, has);
    return has;
  }

  let currentRender = null;
  // Terms gate (pro pass 2 legal audit): "Decline" closes the app —
  // Paul's hard requirement; the renderer cannot quit itself.
  ipcMain.handle("terms:decline", async () => {
    app.quit();
    return true;
  });
  // External links (the Donate page): https only, opened in the user's
  // real browser — never navigated inside the app window.
  ipcMain.handle("shell:openExternal", async (_event, url) => {
    if (typeof url === "string" && url.startsWith("https://")) {
      await shell.openExternal(url);
      return true;
    }
    return false;
  });

  ipcMain.handle("export:cancel", async () => {
    if (currentRender) {
      currentRender.__cancelled = true;
      currentRender.kill();
      return true;
    }
    return false;
  });

  ipcMain.handle("export:run", async (_event, project, outputPath) => {
    const out = outputPath || "wovencut-export.mp4";
    const plan = planExport(project);
    const bin = await resolveFfmpeg();
    if (!bin) {
      return {
        ok: false, outputPath: out, plan,
        ffmpegArgs: buildFfmpegArgs(project, out),
        message:
          "No FFmpeg found: the bundled binary is missing and no system " +
          "ffmpeg is on the PATH, so nothing was rendered. The plan above " +
          "is what the render will run once FFmpeg is available.",
      };
    }
    // Captions burn-in needs a real .srt file for the subtitles filter —
    // write the project's own captions to a temp file (removed after).
    let srtPath = null;
    if (project.captionMode !== "srt" && project.captions?.some((c) => c.text)) {
      srtPath = path.join(os.tmpdir(), `wovencut-captions-${Date.now()}.srt`);
      await fs.promises.writeFile(srtPath, captionsToSrt(project), "utf8");
    }
    let built;
    try {
      const hasAudio = [];
      for (const item of project.tracks.main) {
        hasAudio.push(await probeHasAudio(bin, item));
      }
      built = buildRenderArgs(project, out, { hasAudio, srtPath });
    } catch (err) {
      if (srtPath) await fs.promises.unlink(srtPath).catch(() => {});
      return {
        ok: false, outputPath: out, plan,
        ffmpegArgs: buildFfmpegArgs(project, out),
        message: `Export didn't start: ${err.message}`,
      };
    }
    const result = await new Promise((resolve) => {
      const child = spawn(bin, built.args, { shell: process.platform === "win32" });
      currentRender = child;
      let stderr = "";
      child.stderr.on("data", (d) => {
        stderr += d;
        if (stderr.length > 200000) stderr = stderr.slice(-200000);
        const m = /time=(\d+):(\d+):([\d.]+)/.exec(String(d));
        if (m && built.durationOut > 0) {
          const t = +m[1] * 3600 + +m[2] * 60 + +m[3];
          mainWindow?.webContents.send("export:progress", {
            t: +t.toFixed(2), durationOut: built.durationOut,
          });
        }
      });
      child.on("error", (err) => resolve({ ok: false, error: String(err) }));
      child.on("close", (code) => {
        if (currentRender === child) currentRender = null;
        if (child.__cancelled) return resolve({ ok: false, cancelled: true });
        resolve(code === 0
          ? { ok: true }
          : { ok: false, error: stderr.slice(-1200) });
      });
    });
    if (srtPath) await fs.promises.unlink(srtPath).catch(() => {});
    if (!result.ok) {
      return {
        ok: false, cancelled: Boolean(result.cancelled), outputPath: out, plan,
        ffmpegArgs: [bin, ...built.args],
        message: result.cancelled
          ? "⏹️ Export cancelled — the unfinished file was not kept as a finished export."
          : `Export didn't finish — FFmpeg said:\n${result.error || "unknown error"}`,
      };
    }
    const timelineLen = project.tracks.main.reduce((s, i) => s + i.duration, 0);
    return {
      ok: true, outputPath: out, plan,
      ffmpegArgs: [bin, ...built.args],
      message:
        `✅ Export finished — saved to ${out}. Rendered length ` +
        `${built.durationOut}s (timeline ${timelineLen}s; transitions overlap, ` +
        `so the render is a little shorter than the timeline).` +
        (built.warnings.length
          ? `\n\n⚠️ Honest notes:\n- ${built.warnings.join("\n- ")}`
          : ""),
    };
  });

  // --- Wi-Fi camera (RTSP) — test + record (Paul, Nov 5 2026) ----------------
  // OBS-style network-camera ingest, record-first: Test Connection probes
  // the stream (ffprobe when one is on the PATH; the bundled ffmpeg's
  // `-i` listing otherwise — ffmpeg-static ships no ffprobe), and Record
  // captures the stream to an .mkv with the app's own FFmpeg via stream
  // copy. Events: "netcam:progress" { elapsedSec } while capturing and
  // "netcam:finished" { ok, filePath?, durationSec?, kind?, message? }.
  // The camera record is re-validated HERE — the main process never
  // trusts renderer-supplied fields — and the password is never logged
  // (status text uses maskRtspUrl).

  let ffprobeBinCache = undefined; // undefined = untested, null = absent
  async function resolveFfprobe() {
    if (ffprobeBinCache !== undefined) return ffprobeBinCache;
    const probe = spawn("ffprobe", ["-version"], { shell: process.platform === "win32" });
    const ok = await new Promise((res) => {
      probe.on("error", () => res(false));
      probe.on("close", (code) => res(code === 0));
    });
    return (ffprobeBinCache = ok ? "ffprobe" : null);
  }

  function spawnCapture(bin, args, timeoutMs) {
    return new Promise((resolve) => {
      const child = spawn(bin, args, { shell: process.platform === "win32" });
      let stdout = "";
      let stderr = "";
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        child.kill();
      }, timeoutMs);
      child.stdout.on("data", (d) => { stdout += d; });
      child.stderr.on("data", (d) => {
        stderr += d;
        if (stderr.length > 100000) stderr = stderr.slice(-100000);
      });
      child.on("error", (err) => {
        clearTimeout(timer);
        resolve({ code: -1, stdout, stderr: stderr || String(err), timedOut });
      });
      child.on("close", (code) => {
        clearTimeout(timer);
        resolve({ code, stdout, stderr, timedOut });
      });
    });
  }

  function checkedCamera(input) {
    const cam = newCamera({
      name: input?.name, host: input?.host, port: input?.port,
      path: input?.path, username: input?.username, password: input?.password,
    });
    const problems = validateCamera(cam);
    return { cam, problems };
  }

  ipcMain.handle("netcam:test", async (_event, input) => {
    const { cam, problems } = checkedCamera(input);
    if (problems.length) {
      return { ok: false, kind: "invalid", message: problems.join(" ") };
    }
    const bin = await resolveFfmpeg();
    if (!bin) {
      return {
        ok: false, kind: "unknown",
        message: "No FFmpeg found (the bundled binary is missing and no system ffmpeg is on the PATH), so WovenCut can't reach out to the camera yet.",
      };
    }
    // Prefer real ffprobe JSON; fall back to the ffmpeg -i stream list.
    const ffprobe = await resolveFfprobe();
    if (ffprobe) {
      const r = await spawnCapture(ffprobe, buildFfprobeArgs(cam), PROBE_TIMEOUT_MS);
      const probe = parseFfprobeJson(r.stdout);
      if (probe.video) return { ok: true, probe, summary: summarizeProbe(probe) };
      const cls = classifyNetcamError(r.timedOut ? "Operation timed out" : r.stderr);
      return { ok: false, kind: cls.kind, message: cls.message };
    }
    const r = await spawnCapture(
      bin, ["-hide_banner", "-rtsp_transport", "tcp", "-i", buildRtspUrl(cam)],
      PROBE_TIMEOUT_MS
    );
    const probe = parseFfmpegProbeText(r.stderr);
    if (probe.video) return { ok: true, probe, summary: summarizeProbe(probe) };
    const cls = classifyNetcamError(r.timedOut ? "Operation timed out" : r.stderr);
    return { ok: false, kind: cls.kind, message: cls.message };
  });

  let currentCapture = null;

  ipcMain.handle("netcam:start", async (_event, input, opts = {}) => {
    const { cam, problems } = checkedCamera(input);
    if (problems.length) {
      return { ok: false, kind: "invalid", message: problems.join(" ") };
    }
    if (currentCapture) {
      return {
        ok: false, kind: "busy",
        message: "A Wi-Fi camera recording is already running — press Stop on it before starting another.",
      };
    }
    const bin = await resolveFfmpeg();
    if (!bin) {
      return {
        ok: false, kind: "unknown",
        message: "No FFmpeg found (the bundled binary is missing and no system ffmpeg is on the PATH), so the recording can't start.",
      };
    }
    // Recordings land in the user's Videos folder, in a WovenCut folder
    // of their own — the same posture as exports: a real file, theirs.
    let recDir = path.join(app.getPath("videos"), "WovenCut Recordings");
    try {
      await fs.promises.mkdir(recDir, { recursive: true });
    } catch {
      recDir = app.getPath("userData");
    }
    const slug = (cam.name || cam.host || "camera")
      .replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-").slice(0, 40) || "camera";
    const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const outPath = path.join(recDir, `wifi-camera-${slug}-${stamp}.mkv`);
    const durationSec = Math.max(0, Math.floor(Number(opts?.durationSec) || 0));
    const args = buildCaptureArgs(cam, outPath, { durationSec });

    const child = spawn(bin, args, { shell: process.platform === "win32" });
    const cap = {
      child, outPath, startedAt: Date.now(), stoppedByUser: false,
      cameraName: cam.name || cam.host, stderr: "",
    };
    currentCapture = cap;
    child.stderr.on("data", (d) => {
      cap.stderr += d;
      if (cap.stderr.length > 100000) cap.stderr = cap.stderr.slice(-100000);
      const m = /time=(\d+):(\d+):([\d.]+)/.exec(String(d));
      if (m) {
        const t = +m[1] * 3600 + +m[2] * 60 + +m[3];
        mainWindow?.webContents.send("netcam:progress", { elapsedSec: +t.toFixed(1) });
      }
    });
    const finish = async (spawnError, closeCode) => {
      if (currentCapture !== cap) return;
      currentCapture = null;
      const duration = +(((Date.now() - cap.startedAt) / 1000)).toFixed(1);
      let size = 0;
      try {
        size = (await fs.promises.stat(cap.outPath)).size;
      } catch { /* file never appeared */ }
      // Success = the run ended cleanly (duration reached, exit 0) or
      // the user pressed Stop ("q" also exits 0; the kill fallback does
      // not, so stoppedByUser vouches for it) AND a real file exists.
      // A refused stream can leave a stub header behind — size alone
      // must never be allowed to call that a recording.
      if (!spawnError && size > 0 && (cap.stoppedByUser || closeCode === 0)) {
        mainWindow?.webContents.send("netcam:finished", {
          ok: true, filePath: cap.outPath, durationSec: duration,
          cameraName: cap.cameraName,
        });
        return;
      }
      const cls = classifyNetcamError(spawnError ? String(spawnError) : cap.stderr);
      mainWindow?.webContents.send("netcam:finished", {
        ok: false, kind: cls.kind, cameraName: cap.cameraName,
        message: cls.message,
        address: maskRtspUrl(buildRtspUrl(cam)),
      });
    };
    child.on("error", (err) => finish(err, -1));
    child.on("close", (code) => finish(null, code));
    return { ok: true, filePath: outPath };
  });

  ipcMain.handle("netcam:stop", async () => {
    if (!currentCapture) return false;
    const cap = currentCapture;
    cap.stoppedByUser = true;
    try {
      cap.child.stdin.write("q"); // ffmpeg's own graceful stop: trailer written, file kept
    } catch { /* stdin already gone — the kill below covers it */ }
    setTimeout(() => {
      if (currentCapture === cap) cap.child.kill();
    }, 4000);
    return true;
  });

  app.on("before-quit", () => {
    if (currentCapture) currentCapture.child.kill();
  });
}

app.whenReady().then(() => {
  // The reaction recorder needs the webcam + microphone. Grant media
  // permission to the app's own window only; deny everything else.
  session.defaultSession.setPermissionRequestHandler((_wc, permission, cb) => {
    cb(permission === "media");
  });
  protocol.handle("app", (request) => {
    const url = new URL(request.url);
    const filePath = path.join(APP_ROOT, decodeURIComponent(url.pathname));
    if (!filePath.startsWith(APP_ROOT)) {
      return new Response("Forbidden", { status: 403 });
    }
    return net.fetch(pathToFileURL(filePath).toString());
  });
  registerIpc();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
