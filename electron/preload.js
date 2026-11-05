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

  // Phase 1 stub in the main process — returns the plan, renders nothing.
  runExport: (project, outputPath) =>
    ipcRenderer.invoke("export:run", project, outputPath),
});
