// WovenCut (working title) — preload bridge
// ---------------------------------------------------------------------------
// The ONLY bridge between the renderer and the main process. The renderer
// has no Node access (contextIsolation + sandbox); everything native — file
// dialogs, project read/write, export — goes through these named calls.
//
// webUtils.getPathForFile is the supported Electron way to recover the real
// filesystem path of a File dropped into the window (File.path is gone in
// modern Electron). The timeline's drag-and-drop depends on it.

import { contextBridge, ipcRenderer, webUtils } from "electron";

contextBridge.exposeInMainWorld("wovencut", {
  isDesktop: true,
  platform: process.platform,

  // Real path of a dropped File object ("" if it has none, e.g. in tests).
  getPathForFile: (file) => {
    try {
      return webUtils.getPathForFile(file);
    } catch {
      return "";
    }
  },

  openMediaDialog: () => ipcRenderer.invoke("dialog:openMedia"),
  openAudioDialog: () => ipcRenderer.invoke("dialog:openAudio"),
  openProjectDialog: () => ipcRenderer.invoke("dialog:openProject"),
  saveProjectDialog: (project) => ipcRenderer.invoke("dialog:saveProject", project),
  saveVideoDialog: (defaultName) => ipcRenderer.invoke("dialog:saveVideo", defaultName),
  saveRecording: (arrayBuffer, defaultName) =>
    ipcRenderer.invoke("dialog:saveRecording", arrayBuffer, defaultName),
  saveTextFile: (defaultName, text) =>
    ipcRenderer.invoke("dialog:saveText", defaultName, text),

  // Read an imported media file's bytes so the renderer can decode its
  // audio waveform locally (see main.js "file:readBytes").
  readFileBytes: (filePath) => ipcRenderer.invoke("file:readBytes", filePath),

  // Phase 4 (pro pass 2): the main process really renders with FFmpeg.
  runExport: (project, outputPath) =>
    ipcRenderer.invoke("export:run", project, outputPath),
  cancelExport: () => ipcRenderer.invoke("export:cancel"),
  // Subscribe to render progress ({ t, durationOut }). Replaces any
  // previous subscription — the export panel re-mounts on every refresh.
  onExportProgress: (cb) => {
    ipcRenderer.removeAllListeners("export:progress");
    ipcRenderer.on("export:progress", (_event, data) => cb(data));
  },

  // Terms gate (pro pass 2 legal audit): declining the Terms closes the
  // app — the main process owns quitting; the renderer just asks.
  declineTerms: () => ipcRenderer.invoke("terms:decline"),
  // Open an https link in the user's real browser (the Donate page).
  // The main process refuses anything that isn't https.
  openExternal: (url) => ipcRenderer.invoke("shell:openExternal", url),
});
