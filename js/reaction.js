// WovenCut (working title) — reaction recorder (Paul, Nov 4 2026)
// ---------------------------------------------------------------------------
// Paul's flow: watch the video on your computer, react to it live, and let
// your camera record YOU while the app pays attention to where the source
// video is at. "Camera" means any video device Windows exposes — built-in
// webcam or USB camera (an action camera in PC Camera mode included);
// the device picker in the panel chooses which one. When you stop, the two are already synced — the app builds
// the locked reaction pair on the timeline, ready to edit.
//
// HOW THE SYNC WORKS (one clock rules both): the recorder's elapsed clock
// starts the instant recording starts. The source clip's segment and the
// webcam clip both get that same elapsed length, the webcam item is
// LOCKED to the source item at offset 0, and every pause/resume/seek of
// the source during the take is logged onto the webcam item (syncEvents)
// so the editor — and later the Phase 4 export — can see exactly where
// the source was held. No manual aligning, ever.

import { itemStartTimes, newMainItem, newOverlayItem } from "./model.js";

function fmt(t) {
  if (!Number.isFinite(t)) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function mountReactionPanel(container, hooks = {}) {
  container.innerHTML = `
    <p class="stub-note">Watch a video here, react out loud, and your camera
      records <em>you</em> while the app tracks where the video is at. Press Stop
      and the pair lands on your timeline already locked in sync — then edit
      it like anything else. The recording camera can be a built-in webcam
      <em>or any USB camera</em> — including an action camera switched to its
      PC Camera mode (guide at the bottom of this panel).</p>
    <label class="insp-field" title="Pick which camera records you: your built-in webcam, or any USB camera plugged into this computer — including an action camera (like an AKASO) set to its 'PC Camera' mode. If a camera was just plugged in, press Refresh Camera List">
      <span class="insp-label">📷 Camera to record from — Webcam / USB Camera</span>
      <select data-el="device"></select>
    </label>
    <div class="reaction-stage">
      <figure>
        <video class="reaction-video" data-el="source" controls playsinline
          title="The video you're reacting to — pick its file, press play when recording starts"></video>
        <figcaption>🎬 The video you're reacting to</figcaption>
      </figure>
      <figure>
        <video class="reaction-video" data-el="cam" muted playsinline autoplay
          title="Your camera — this is what gets recorded while you react"></video>
        <figcaption>🎥 You, on your camera</figcaption>
      </figure>
    </div>
    <div class="reaction-controls">
      <label class="tool-btn reaction-pick" title="Choose the video file you'll react to — the same file you put (or will put) on the main track">
        📂 Pick the video
        <input type="file" data-el="pick" accept="video/*" hidden>
      </label>
      <button type="button" class="tool-btn" data-act="camera"
        title="Turn the selected camera (and microphone) on or off — nothing is recorded until you press Start">🎥 Turn Camera On</button>
      <button type="button" class="tool-btn" data-act="refresh-devices"
        title="Look again for cameras — press this after plugging in a USB camera or switching an action camera to PC Camera mode">🔄 Refresh Camera List</button>
      <button type="button" class="tool-btn primary" data-act="start" disabled
        title="Start the source video playing AND the webcam recording at the same instant — that's what locks them in sync">🔴 Start Reaction Recording</button>
      <button type="button" class="tool-btn danger" data-act="stop" disabled
        title="Stop recording and build the locked pair on the timeline">⏹️ Stop &amp; Build My Pair</button>
    </div>
    <div class="reaction-credit">
      <label class="insp-field" title="Paste the link to the original video on YouTube — it goes into your upload description automatically, so the original creator always gets credited">
        <span class="insp-label">🔗 Original video link (YouTube)</span>
        <input type="url" data-el="credit-url" placeholder="https://www.youtube.com/watch?v=…">
      </label>
      <label class="insp-field" title="Who made the original video — their channel name or @handle. They get named and tagged in your description automatically">
        <span class="insp-label">🙋 Original creator (@handle or channel name)</span>
        <input type="text" data-el="credit-creator" placeholder="@originalcreator">
      </label>
    </div>
    <p class="reaction-status" data-el="status">Camera is off. Pick a video and turn the camera on to begin.</p>
    <details class="yt-guide">
      <summary title="Connecting an AKASO EK7000 (and similar action cameras) so it can record you live, step by step">❓ Using an action camera — AKASO EK7000 — as your recording camera</summary>
      <ol>
        <li><strong>Plug the camera into the computer with its USB cable.</strong> The EK7000 wakes up and asks a question on its own screen: which USB mode?</li>
        <li><strong>On the camera's screen, choose PCCAM</strong> — that's its PC Camera (webcam) mode. Do <em>not</em> choose <strong>MSDC</strong>: that's Mass Storage, which turns the camera into a card reader. Useful for copying files off the card; it cannot record you.</li>
        <li><strong>Back in WovenCut:</strong> press 🔄 Refresh Camera List, pick the camera in the 📷 <em>Camera to record from</em> list above (Windows shows it as a USB camera), then 🎥 Turn Camera On and record as normal. Any USB camera Windows can see as a video device works this way — nothing AKASO-specific is built in, on purpose.</li>
      </ol>
      <p class="stub-note"><strong>Honest note on quality:</strong> on the EK7000, the PCCAM feed is
        standard webcam resolution — plenty for a reaction window or a
        picture-in-picture corner, which is what this panel is for. The camera's
        full 4K quality is recorded onto its own microSD card instead; to use
        that footage, copy the files off the card and drop them in with
        🎞️ Import Clips, like any other clips. Two more honest points: the exact
        wording of the mode question can vary a little between production runs,
        and if a camera only ever offers the storage mode (no PC Camera choice),
        it can't live-record over USB at all — importing its files is the way.
        The EK7000's Wi-Fi phone-app picture is not a standard feed WovenCut can
        take, so USB is the reliable route: it also runs the camera off USB
        power on most models (no mid-take battery death) and has none of
        Wi-Fi's lag.</p>
    </details>`;

  const source = container.querySelector('[data-el="source"]');
  const cam = container.querySelector('[data-el="cam"]');
  const pick = container.querySelector('[data-el="pick"]');
  const status = container.querySelector('[data-el="status"]');
  const deviceSel = container.querySelector('[data-el="device"]');
  const btnCamera = container.querySelector('[data-act="camera"]');
  const btnRefreshDevices = container.querySelector('[data-act="refresh-devices"]');
  const btnStart = container.querySelector('[data-act="start"]');
  const btnStop = container.querySelector('[data-act="stop"]');

  // --- Camera device picker (Webcam / USB Camera) ----------------------------
  // Generic UVC by design: any video device Windows exposes — built-in
  // webcam, USB webcam, or an action camera in PC Camera mode — appears
  // in enumerateDevices and records through the exact same getUserMedia
  // path. Nothing in this panel is webcam-brand- or AKASO-specific.
  // Device LABELS are hidden by the browser until camera permission has
  // been granted once, so the list is re-read after the camera turns on.
  let selectedDeviceId = "";
  function renderDeviceOptions(devices) {
    deviceSel.innerHTML = "";
    if (!devices.length) {
      const o = document.createElement("option");
      o.value = "";
      o.textContent = "No camera found yet — plug one in, then press Refresh Camera List";
      deviceSel.appendChild(o);
      return;
    }
    devices.forEach((d, i) => {
      const o = document.createElement("option");
      o.value = d.deviceId;
      o.textContent = d.label
        || `Camera ${i + 1} (its name appears after the camera has been on once)`;
      deviceSel.appendChild(o);
    });
    if (selectedDeviceId && devices.some((d) => d.deviceId === selectedDeviceId)) {
      deviceSel.value = selectedDeviceId;
    } else {
      selectedDeviceId = deviceSel.value;
    }
  }
  async function refreshDevices() {
    let devices = [];
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      devices = all.filter((d) => d.kind === "videoinput");
    } catch { /* no media devices API — the picker just stays empty */ }
    renderDeviceOptions(devices);
  }
  deviceSel.addEventListener("change", () => {
    selectedDeviceId = deviceSel.value;
    if (stream) {
      setStatus("Camera choice saved — it takes over the next time you turn the camera on. (The running camera never switches mid-take.)");
    }
  });
  btnRefreshDevices.addEventListener("click", async () => {
    await refreshDevices();
    setStatus(deviceSel.value
      ? "Camera list refreshed — pick your camera in the list above."
      : "No camera found. Plug the camera in (for an action camera: USB in, and PCCAM chosen on its screen), then refresh again.");
  });
  try {
    navigator.mediaDevices?.addEventListener?.("devicechange", refreshDevices);
  } catch { /* older engines: the Refresh button covers it */ }

  // Credit fields → project.sourceCredit (the Export panel writes them
  // into the YouTube description automatically).
  const creditUrl = container.querySelector('[data-el="credit-url"]');
  const creditCreator = container.querySelector('[data-el="credit-creator"]');
  const saveCredit = () => {
    const project = hooks.getProject();
    project.sourceCredit = {
      ...(project.sourceCredit || {}),
      url: creditUrl.value.trim(),
      creator: creditCreator.value.trim(),
      title: project.sourceCredit?.title || (sourceFile ? sourceFile.name.replace(/\.[^.]+$/, "") : ""),
    };
  };
  creditUrl.addEventListener("change", saveCredit);
  creditCreator.addEventListener("change", saveCredit);

  let stream = null;
  let recorder = null;
  let chunks = [];
  let sourceFile = null;
  let startedAt = 0;
  let startSourceTime = 0;
  let syncEvents = [];
  let ticker = null;

  const elapsed = () => (performance.now() - startedAt) / 1000;

  function setStatus(msg) {
    status.textContent = msg;
  }

  function updateButtons() {
    btnStart.disabled = !(stream && sourceFile && !recorder);
    btnStop.disabled = !recorder;
    btnCamera.textContent = stream ? "🎥 Turn Camera Off" : "🎥 Turn Camera On";
  }

  pick.addEventListener("change", () => {
    const file = pick.files?.[0];
    if (!file) return;
    sourceFile = file;
    if (source.src) URL.revokeObjectURL(source.src);
    source.src = URL.createObjectURL(file);
    setStatus(`Video loaded: ${file.name}. Turn the camera on, then press Start when you're ready to react.`);
    updateButtons();
  });

  btnCamera.addEventListener("click", async () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
      cam.srcObject = null;
      setStatus("Camera is off.");
      updateButtons();
      return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true,
        audio: true,
      });
      cam.srcObject = stream;
      await refreshDevices(); // permission granted → real camera names appear
      setStatus(sourceFile
        ? "Camera on. Press Start — the video and your camera begin at the same instant."
        : "Camera on. Pick the video you'll react to, then press Start.");
    } catch {
      setStatus("The camera didn't open. Check it's plugged in (an action camera must be in its PC Camera mode — PCCAM on an AKASO — not its storage mode), that no other app is using it, and that Windows allows camera access, then try again.");
    }
    updateButtons();
  });

  // While recording, every source transport event is a sync fact.
  const logEvent = (type) => {
    if (!recorder) return;
    syncEvents.push({
      type,
      atSeconds: +elapsed().toFixed(2),
      sourceSeconds: +source.currentTime.toFixed(2),
    });
  };
  source.addEventListener("pause", () => logEvent("source-paused"));
  source.addEventListener("play", () => logEvent("source-playing"));
  source.addEventListener("seeked", () => logEvent("source-seeked"));

  btnStart.addEventListener("click", async () => {
    if (!stream || !sourceFile) return;
    chunks = [];
    syncEvents = [];
    startSourceTime = source.currentTime || 0;
    try {
      recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    } catch {
      recorder = new MediaRecorder(stream);
    }
    recorder.ondataavailable = (e) => {
      if (e.data?.size) chunks.push(e.data);
    };
    recorder.onstop = finishTake;
    startedAt = performance.now();
    recorder.start(250);
    source.play();
    logEvent("recording-started");
    setStatus("🔴 Recording… react away. The app is watching the video's position for you.");
    ticker = setInterval(() => {
      setStatus(`🔴 Recording… you: ${fmt(elapsed())} · the video is at ${fmt(source.currentTime)} · ${syncEvents.length} sync marks logged`);
    }, 500);
    updateButtons();
  });

  btnStop.addEventListener("click", () => {
    if (!recorder) return;
    source.pause();
    recorder.stop(); // → finishTake via onstop
  });

  async function finishTake() {
    saveCredit();
    clearInterval(ticker);
    const takeSeconds = +elapsed().toFixed(2);
    const blob = new Blob(chunks, { type: "video/webm" });
    recorder = null;

    // Save the webcam take. Desktop: a real file via the save dialog.
    // Browser fallback: a normal download. Either way the pair is built.
    const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const fileName = `reaction-take-${stamp}.webm`;
    let camPath = null;
    if (hooks.desktop?.saveRecording) {
      const buf = await blob.arrayBuffer();
      camPath = await hooks.desktop.saveRecording(buf, fileName);
    } else {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = fileName;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    }

    // Build the locked pair on the timeline.
    const project = hooks.getProject();
    const sourcePath = hooks.desktop?.getPathForFile(sourceFile) || sourceFile.name;
    const mainItem = {
      ...newMainItem({
        src: sourcePath,
        label: sourceFile.name.replace(/\.[^.]+$/, ""),
        kind: "clip",
        duration: takeSeconds,
      }),
      trimIn: +startSourceTime.toFixed(2),
    };
    project.tracks.main.push(mainItem);
    const starts = itemStartTimes(project);
    const mainStart = starts[project.tracks.main.length - 1];
    const camItem = {
      ...newOverlayItem({
        src: camPath || fileName,
        label: "You — reaction take",
        start: mainStart,
        duration: takeSeconds,
      }),
      hue: 280,
      lockToId: mainItem.id,
      lockOffset: 0,
      reactionPair: true,
      syncEvents,
    };
    (project.tracks.layers[0] ||= []).push(camItem);

    setStatus(camPath
      ? `✅ Take saved to ${camPath} and your locked pair is on the timeline (${fmt(takeSeconds)} of reaction, ${syncEvents.length} sync marks). Edit away.`
      : `✅ Take downloaded as ${fileName} and your locked pair is on the timeline (${fmt(takeSeconds)} of reaction, ${syncEvents.length} sync marks). In the desktop app the take saves straight into the project instead.`);
    updateButtons();
    hooks.onPairCreated?.({ lane: "layer:0", id: camItem.id });
  }

  updateButtons();
  refreshDevices();
}
