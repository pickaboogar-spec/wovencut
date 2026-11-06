// WovenCut (working title) — Wi-Fi camera panel (Paul, Nov 5 2026)
// ---------------------------------------------------------------------------
// Record a network camera (RTSP — TP-Link Tapo and friends) into the
// project, the way OBS records a camera source. This panel is the
// "source" half: save the camera once, test the connection in plain
// words, press Record, and the finished take lands on the main track.
//
// HONEST LIMIT, stated here because the UI must never fake it: there is
// no live picture from the Wi-Fi camera inside WovenCut's preview. The
// preview still draws placeholder frames (Phase 3). This panel RECORDS
// the feed; it does not monitor it.
//
// Mounted ONCE from app.js (like the reaction recorder): it holds the
// in-flight recording state, so a refresh must never remount it.

import {
  newCamera, buildRtspUrl, maskRtspUrl, validateCamera, TAPO_STREAMS,
} from "./netcam.js";
import { newMainItem } from "./model.js";

function fmt(t) {
  if (!Number.isFinite(t)) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function esc(s = "") {
  return String(s).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[ch]));
}

export function mountWifiCameraPanel(container, hooks = {}) {
  container.innerHTML = `
    <p class="stub-note">Add a camera that lives on your home Wi-Fi — like a
      TP-Link Tapo — and record what it sees straight into this project,
      with its sound. This is the OBS way of working: the camera is a
      <em>source</em>, and WovenCut records the source.</p>
    <p class="stub-note">⚠️ <strong>Honest limit:</strong> you can't watch the
      Wi-Fi camera's picture live inside WovenCut yet — the preview still
      uses placeholder frames (a later build phase). Test Connection proves
      the camera is there and tells you what it's sending; Record captures
      the feed into your project. To watch while it records, use the
      camera's own phone app.</p>

    <label class="insp-field" title="Cameras you've saved into this project. Pick one to fill the boxes below with its details, or choose 'Set up a new camera'">
      <span class="insp-label">💾 Saved cameras in this project</span>
      <select data-el="saved"></select>
    </label>

    <div class="netcam-form">
      <label class="insp-field" title="A name you'll recognise — the room or the job, like 'Porch' or 'Workbench'">
        <span class="insp-label">🏷️ Camera name</span>
        <input type="text" data-el="name" placeholder="Porch camera">
      </label>
      <label class="insp-field" title="The camera's address on your home network — numbers like 192.168.1.50. The Tapo app shows it under the camera's settings / device info">
        <span class="insp-label">📍 Camera address (IP)</span>
        <input type="text" data-el="host" placeholder="192.168.1.50">
      </label>
      <label class="insp-field" title="The stream port. 554 is the standard one — leave it unless your camera's settings say different">
        <span class="insp-label">🔢 Port</span>
        <input type="number" data-el="port" value="554" min="1" max="65535" step="1">
      </label>
      <label class="insp-field" title="Which of the camera's streams to record. Tapo cameras offer Stream 1 (best quality) and Stream 2 (smaller)">
        <span class="insp-label">🎞️ Stream</span>
        <select data-el="stream">
          ${TAPO_STREAMS.map((t) => `<option value="${t.path}">${t.label}</option>`).join("")}
          <option value="__custom">Type a different stream path…</option>
        </select>
      </label>
      <label class="insp-field" data-el="path-wrap" hidden title="The stream path for cameras that don't use the Tapo paths — it starts with a slash, like /stream1">
        <span class="insp-label">🧭 Stream path</span>
        <input type="text" data-el="path" value="/stream1">
      </label>
      <label class="insp-field" title="The camera account username. On a Tapo this is the special account made in the Tapo app's RTSP settings — NOT your Tapo app login">
        <span class="insp-label">🙋 Camera username</span>
        <input type="text" data-el="username" autocomplete="off">
      </label>
      <label class="insp-field" title="The camera account password. It's hidden while you type, saved only inside this project file on your computer, and never shown in the address below">
        <span class="insp-label">🔑 Camera password</span>
        <input type="password" data-el="password" autocomplete="off">
      </label>
    </div>
    <label class="terms-check" title="Show the password as plain text while you check it — it hides again when you untick">
      <input type="checkbox" data-el="showpass">
      <span>👁️ Show password while I check it</span>
    </label>
    <p class="netcam-url" data-el="url"
      title="The full camera address these boxes make — the password is always hidden here">rtsp://…</p>

    <div class="netcam-controls">
      <button type="button" class="tool-btn" data-act="save"
        title="Save this camera into the project file, so it's here next time you open the project">💾 Save This Camera</button>
      <button type="button" class="tool-btn danger" data-act="remove"
        title="Remove the saved camera selected above from this project (the camera itself is untouched)">🗑️ Remove Saved Camera</button>
      <button type="button" class="tool-btn" data-act="test"
        title="Ask the camera to identify itself — WovenCut reports its picture size, speed and sound in plain words, or explains in plain words why it couldn't answer">🔌 Test Connection</button>
    </div>

    <div class="netcam-controls">
      <label class="insp-field" title="How many minutes to record before stopping by itself. 0 means: record until you press Stop">
        <span class="insp-label">⏱️ Minutes to record (0 = until I press Stop)</span>
        <input type="number" data-el="minutes" value="0" min="0" max="240" step="1">
      </label>
      <button type="button" class="tool-btn primary" data-act="record"
        title="Start recording this camera's feed (picture and sound) into a video file — when it finishes, the recording lands on your timeline's main track">🔴 Record from Wi-Fi Camera</button>
      <button type="button" class="tool-btn danger" data-act="stop" disabled
        title="Stop the recording now and keep what was captured">⏹️ Stop Recording</button>
    </div>
    <p class="reaction-status" data-el="status">No camera tested yet. Fill in a camera, or pick a saved one, then press 🔌 Test Connection.</p>

    <details class="yt-guide">
      <summary title="Setting up a TP-Link Tapo camera for WovenCut, in the Tapo app, step by step">❓ Using a Wi-Fi camera (like OBS) — TP-Link Tapo setup, step by step</summary>
      <ol>
        <li><strong>These steps happen in the Tapo app on your phone, on your own home network.</strong> WovenCut can't do them for you — the camera only takes these orders from its own app. Other brands differ in detail, but the shape is the same: find RTSP in the camera's advanced settings and make a camera account there.</li>
        <li><strong>Make the camera account:</strong> in the Tapo app, open your camera → the ⚙️ settings gear → <em>Advanced Settings</em> → <em>Camera Account</em> (RTSP). Create a username and password there. This is a separate little account that lives in the camera — <strong>not</strong> your Tapo app login, and WovenCut's Test Connection will refuse the login if you mix them up.</li>
        <li><strong>Find the camera's address:</strong> still in the Tapo app, the camera's settings show its IP address (under device info), something like <em>192.168.1.50</em>. Your router's device list shows it too.</li>
        <li><strong>Fill in this panel:</strong> the IP goes in 📍 Camera address, the camera-account username and password in their boxes, the port stays <strong>554</strong>, and the stream is <strong>/stream1</strong> for best quality (the address it builds looks like <em>rtsp://username:password@192.168.1.50:554/stream1</em>) or <strong>/stream2</strong> for the smaller feed.</li>
        <li><strong>Press 🔌 Test Connection.</strong> WovenCut reports the picture size, frame rate and sound in plain words — or explains the problem in plain words. Then press 🔴 Record.</li>
      </ol>
      <p class="stub-note">Your camera's password is saved only inside this project file, on
        your own computer — WovenCut has no accounts, no cloud, and sends nothing
        anywhere. The address line in this panel always hides the password.</p>
    </details>`;

  const $ = (sel) => container.querySelector(`[data-el="${sel}"]`);
  const savedSel = $("saved");
  const status = $("status");
  const urlLine = $("url");
  const btnSave = container.querySelector('[data-act="save"]');
  const btnRemove = container.querySelector('[data-act="remove"]');
  const btnTest = container.querySelector('[data-act="test"]');
  const btnRecord = container.querySelector('[data-act="record"]');
  const btnStop = container.querySelector('[data-act="stop"]');

  let editingId = null; // the saved camera currently loaded in the form
  let recording = false;
  let activeCamName = "";

  const setStatus = (msg) => { status.textContent = msg; };

  function formCamera() {
    const streamSel = $("stream").value;
    const path = streamSel === "__custom" ? $("path").value : streamSel;
    return newCamera({
      name: $("name").value,
      host: $("host").value,
      port: Number($("port").value),
      path,
      username: $("username").value,
      password: $("password").value,
    });
  }

  function refreshUrl() {
    urlLine.textContent = maskRtspUrl(buildRtspUrl(formCamera()));
  }

  function refreshSaved() {
    const cameras = hooks.getProject()?.cameras || [];
    savedSel.innerHTML =
      `<option value="">➕ Set up a new camera…</option>` +
      cameras.map((c) =>
        `<option value="${esc(c.id)}">${esc(c.name || c.host)} — ${esc(c.host)}</option>`
      ).join("");
    if (editingId && cameras.some((c) => c.id === editingId)) {
      savedSel.value = editingId;
    }
    btnRemove.disabled = !editingId;
  }

  function fillForm(cam) {
    $("name").value = cam?.name || "";
    $("host").value = cam?.host || "";
    $("port").value = cam?.port || 554;
    $("username").value = cam?.username || "";
    $("password").value = cam?.password || "";
    const known = TAPO_STREAMS.some((t) => t.path === cam?.path);
    $("stream").value = cam ? (known ? cam.path : "__custom") : "/stream1";
    $("path-wrap").hidden = $("stream").value !== "__custom";
    if (!known && cam) $("path").value = cam.path;
    refreshUrl();
  }

  savedSel.addEventListener("change", () => {
    const cameras = hooks.getProject()?.cameras || [];
    const cam = cameras.find((c) => c.id === savedSel.value) || null;
    editingId = cam?.id || null;
    fillForm(cam);
    btnRemove.disabled = !editingId;
    setStatus(cam
      ? `Loaded “${cam.name || cam.host}”. Press 🔌 Test Connection to check it, or 🔴 Record.`
      : "Setting up a new camera — fill in the boxes, then 💾 Save This Camera.");
  });

  for (const el of ["name", "host", "port", "username", "password", "path"]) {
    $(el).addEventListener("input", refreshUrl);
  }
  $("stream").addEventListener("change", () => {
    $("path-wrap").hidden = $("stream").value !== "__custom";
    refreshUrl();
  });
  $("showpass").addEventListener("change", () => {
    $("password").type = $("showpass").checked ? "text" : "password";
  });

  btnSave.addEventListener("click", () => {
    const cam = formCamera();
    const problems = validateCamera(cam);
    if (problems.length) {
      setStatus(`Can't save yet: ${problems.join(" ")}`);
      return;
    }
    if (!cam.name) cam.name = cam.host;
    const project = hooks.getProject();
    project.cameras ||= [];
    if (editingId && project.cameras.some((c) => c.id === editingId)) {
      const i = project.cameras.findIndex((c) => c.id === editingId);
      cam.id = editingId;
      project.cameras[i] = cam;
    } else {
      project.cameras.push(cam);
      editingId = cam.id;
    }
    refreshSaved();
    setStatus(`💾 Saved “${cam.name}” into this project — it'll be here next time you open it.`);
    hooks.onProjectChanged?.();
  });

  btnRemove.addEventListener("click", () => {
    if (!editingId) return;
    const project = hooks.getProject();
    const gone = (project.cameras || []).find((c) => c.id === editingId);
    project.cameras = (project.cameras || []).filter((c) => c.id !== editingId);
    editingId = null;
    fillForm(null);
    refreshSaved();
    setStatus(`🗑️ Removed “${gone?.name || gone?.host || "camera"}” from this project. The camera itself is untouched.`);
    hooks.onProjectChanged?.();
  });

  function checkedForm() {
    const cam = formCamera();
    const problems = validateCamera(cam);
    if (problems.length) {
      setStatus(`Not yet: ${problems.join(" ")}`);
      return null;
    }
    return cam;
  }

  btnTest.addEventListener("click", async () => {
    const cam = checkedForm();
    if (!cam) return;
    if (!hooks.desktop?.testNetcam) {
      setStatus("Testing a camera needs the WovenCut desktop app — this browser copy can save camera details into the project, but the tester itself runs in the app.");
      return;
    }
    btnTest.disabled = true;
    setStatus(`🔌 Asking the camera at ${maskRtspUrl(buildRtspUrl(cam))} who it is… (up to about 12 seconds)`);
    try {
      const res = await hooks.desktop.testNetcam(cam);
      setStatus(res.ok
        ? `✅ Camera found: ${res.summary}. It's ready to record.`
        : `❌ ${res.message}`);
    } catch {
      setStatus("❌ The test itself failed inside WovenCut — nothing was recorded. Try again, and if it keeps happening, restart the app.");
    }
    btnTest.disabled = false;
  });

  function setRecordingUI(on) {
    recording = on;
    btnStop.disabled = !on;
    btnRecord.disabled = on;
    btnTest.disabled = on;
  }

  btnRecord.addEventListener("click", async () => {
    const cam = checkedForm();
    if (!cam) return;
    if (!hooks.desktop?.startNetcam) {
      setStatus("Recording a Wi-Fi camera needs the WovenCut desktop app — this browser copy can save camera details into the project, but the recorder itself runs in the app.");
      return;
    }
    const minutes = Math.max(0, Math.floor(Number($("minutes").value) || 0));
    activeCamName = cam.name || cam.host;
    setStatus(`🔴 Starting the recording from “${activeCamName}”…`);
    const res = await hooks.desktop.startNetcam(cam, { durationSec: minutes * 60 });
    if (!res?.ok) {
      setStatus(`❌ ${res?.message || "The recording didn't start."}`);
      return;
    }
    setRecordingUI(true);
    setStatus(minutes > 0
      ? `🔴 Recording “${activeCamName}” — it stops by itself at ${fmt(minutes * 60)}, or press ⏹️ Stop Recording.`
      : `🔴 Recording “${activeCamName}” — press ⏹️ Stop Recording when you're done.`);
  });

  btnStop.addEventListener("click", async () => {
    setStatus("⏹️ Stopping — finishing the file so it plays properly…");
    btnStop.disabled = true;
    await hooks.desktop?.stopNetcam?.();
  });

  hooks.desktop?.onNetcamEvent?.((ev) => {
    if (ev.type === "progress") {
      if (recording) {
        setStatus(`🔴 Recording “${activeCamName}” — ${fmt(ev.elapsedSec)} so far. Press ⏹️ Stop Recording when you're done.`);
      }
      return;
    }
    if (ev.type !== "finished") return;
    setRecordingUI(false);
    if (!ev.ok) {
      setStatus(`❌ The recording from “${ev.cameraName || activeCamName}” didn't work: ${ev.message}${ev.address ? ` (Camera address: ${ev.address})` : ""}`);
      return;
    }
    // The take lands on the main track — the same landing spot a
    // recorded clip gets anywhere else in WovenCut. fadeIn defaults
    // to 0 via newMainItem (Paul's first-frame rule is untouched).
    const project = hooks.getProject();
    const item = newMainItem({
      src: ev.filePath,
      label: `${ev.cameraName || "Wi-Fi camera"} — Wi-Fi recording`,
      kind: "clip",
      duration: Math.max(1, Math.round(ev.durationSec || 1)),
    });
    project.tracks.main.push(item);
    setStatus(`✅ Recorded ${fmt(ev.durationSec || 0)} from “${ev.cameraName || activeCamName}” and put it on your timeline's main track — saved as ${ev.filePath}.`);
    hooks.onRecordingAdded?.({ lane: "main", id: item.id });
  });

  refreshSaved();
  refreshUrl();
}
