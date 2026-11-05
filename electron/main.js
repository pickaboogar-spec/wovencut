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
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// The renderer's export-plan module is pure ESM — reuse it here so the
// plan the UI shows is the plan the export stub reports.
import { buildFfmpegArgs, planExport } from "../js/export.js";

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
    title: "WovenCut (working title) — free video editor",
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

  // --- Export pipeline (STUB — Phase 4 makes it real) -----------------------
  // The real renderer will spawn FFmpeg here. Where the binary comes from:
  //   Option A (planned): the `ffmpeg-static` npm package ships a per-OS
  //     ffmpeg binary as a dependency; electron-builder unpacks it from the
  //     asar (asarUnpack) and this handler spawns it with the args built by
  //     js/export.js → buildFfmpegArgs(). No download at runtime, works
  //     offline, binary is free (LGPL/GPL build — license choice lands with
  //     Paul's repo-license decision).
  //   Option B: detect a system ffmpeg on PATH and use it if present.
  // This stub deliberately does NEITHER yet: it returns the full plan + the
  // exact ffmpeg argument list it WOULD run, so Paul's review gate can
  // judge the pipeline before any binary is bundled.
  ipcMain.handle("export:run", async (_event, project, outputPath) => {
    return {
      ok: false,
      stub: true,
      outputPath: outputPath || null,
      plan: planExport(project),
      ffmpegArgs: buildFfmpegArgs(project, outputPath || "wovencut-export.mp4"),
      message:
        "Export is a stub in this build: FFmpeg is not bundled yet " +
        "(planned: ffmpeg-static, Phase 4). Nothing was rendered or " +
        "written. The ffmpeg command above is the real plan — review it " +
        "at the Phase 1 gate.",
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
