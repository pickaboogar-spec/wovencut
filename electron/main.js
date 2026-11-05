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
