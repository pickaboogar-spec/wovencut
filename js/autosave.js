// WovenCut (working title) — auto-save, crash recovery, snapshots
// ---------------------------------------------------------------------------
// Pro pass 2, Nov 5 2026 (from Paul's great-freeware list: "auto-save"
// and "snapshots / version history" — the features that make a free
// editor safe to trust with real work).
//
// How it works:
//  - AUTO-SAVE: as the user edits, the current project is quietly saved
//    to this computer's local storage (Electron and browser shells both
//    have it). No account, no upload, no telemetry — the file never
//    leaves the machine, matching the app's privacy posture.
//  - CRASH RECOVERY: on the next start, if an auto-save exists, the app
//    opens WITH the recovered work and says so in a banner — the user
//    can keep it or discard it and start fresh. Nothing is silently
//    replaced: the banner is the receipt.
//  - SNAPSHOTS: named, dated copies of the project kept in a list
//    (newest first, capped). Taken manually with one button, and taken
//    AUTOMATICALLY before a New Project or Open replaces the current
//    one — so "I clicked New by mistake" is never a loss. Restoring a
//    snapshot first auto-snapshots the state it replaces, so a restore
//    is itself reversible from the same list.
//
// The storage functions take any localStorage-shaped object, which
// keeps them unit-testable outside the browser.

export const AUTOSAVE_KEY = "wovencut.autosave.v1";
export const SNAPSHOTS_KEY = "wovencut.snapshots.v1";
export const MAX_SNAPSHOTS = 12;

// localStorage can throw (private modes, quotas) — the editor must
// never crash because saving a backup failed.
export function safeStorage() {
  try {
    const s = window.localStorage;
    const probe = "__wovencut_probe__";
    s.setItem(probe, "1");
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

function parseJson(raw) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function looksLikeProject(p) {
  return Boolean(p && typeof p === "object" && p.tracks && Array.isArray(p.tracks.main));
}

// --- Auto-save ---------------------------------------------------------------

export function writeAutosave(storage, project, now = Date.now()) {
  if (!storage || !looksLikeProject(project)) return false;
  try {
    storage.setItem(AUTOSAVE_KEY, JSON.stringify({ savedAt: now, project }));
    return true;
  } catch {
    return false; // quota or denial — editing continues regardless
  }
}

export function readAutosave(storage) {
  if (!storage) return null;
  const data = parseJson(storage.getItem(AUTOSAVE_KEY));
  if (!data || !looksLikeProject(data.project)) return null;
  return { savedAt: data.savedAt || 0, project: data.project };
}

export function clearAutosave(storage) {
  try {
    storage?.removeItem(AUTOSAVE_KEY);
  } catch { /* nothing to do */ }
}

// --- Snapshots ---------------------------------------------------------------

export function readSnapshots(storage) {
  if (!storage) return [];
  const list = parseJson(storage.getItem(SNAPSHOTS_KEY));
  if (!Array.isArray(list)) return [];
  return list.filter((s) => s && looksLikeProject(s.project));
}

// Add a snapshot of the project; returns the updated list (newest first,
// capped at MAX_SNAPSHOTS — the oldest fall off the end).
export function addSnapshot(storage, project, label = "manual", now = Date.now()) {
  if (!storage || !looksLikeProject(project)) return readSnapshots(storage);
  const entry = {
    id: `s${now.toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`,
    savedAt: now,
    label,
    title: project.title || "Untitled video",
    project: JSON.parse(JSON.stringify(project)), // decouple from live edits
  };
  const list = [entry, ...readSnapshots(storage)].slice(0, MAX_SNAPSHOTS);
  try {
    storage.setItem(SNAPSHOTS_KEY, JSON.stringify(list));
  } catch { /* quota — the in-memory list still returns for this session */ }
  return list;
}

export function removeSnapshot(storage, id) {
  const list = readSnapshots(storage).filter((s) => s.id !== id);
  try {
    storage?.setItem(SNAPSHOTS_KEY, JSON.stringify(list));
  } catch { /* ignore */ }
  return list;
}

export function formatWhen(ts) {
  if (!ts) return "an unknown time";
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

// --- Panel -------------------------------------------------------------------
// hooks: { storage, onRestore(project), onTouched() } — onTouched asks
// the app to re-render (a snapshot was taken or removed).
export function mountAutosavePanel(project, container, hooks = {}) {
  const storage = hooks.storage;
  const saved = readAutosave(storage);
  const snaps = readSnapshots(storage);
  container.innerHTML =
    `<p class="stub-note">🛟 <strong>Auto-save is ON.</strong> Your work is saved on ` +
    `this computer as you edit${saved ? ` — last saved ${formatWhen(saved.savedAt)}` : ""}. ` +
    `Close the app or crash, and your work in progress is here when you come back. ` +
    `Nothing is uploaded anywhere.</p>` +
    `<div class="insp-actions">
      <button type="button" class="tool-btn" data-action="snap-now"
        title="Take a snapshot: a dated copy of the project exactly as it is now, kept in the list below. Snapshots are also taken automatically before New Project or Open replaces your work.">📸 Take a Snapshot Now</button>
    </div>` +
    (snaps.length
      ? `<div class="snap-list">${snaps.map((s) => `
        <div class="snap-row">
          <span class="snap-meta">📸 <strong>${escapeHtml(s.title)}</strong> — ${formatWhen(s.savedAt)}${s.label && s.label !== "manual" ? ` · ${escapeHtml(s.label)}` : ""}</span>
          <span class="snap-actions">
            <button type="button" class="tool-btn" data-restore="${s.id}"
              title="Put this snapshot back on the timeline, replacing what is there now (your current work is snapshotted first, so this is reversible)">↩️ Restore</button>
            <button type="button" class="tool-btn danger" data-unsnap="${s.id}"
              title="Delete this snapshot from the list">🗑️ Delete</button>
          </span>
        </div>`).join("")}</div>`
      : `<p class="stub-note">No snapshots yet. Take one before a big change and you can always come back to this exact state.</p>`);

  container.querySelector('[data-action="snap-now"]')?.addEventListener("click", () => {
    addSnapshot(storage, project, "manual");
    hooks.onTouched?.();
  });
  container.querySelectorAll("[data-restore]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const snap = readSnapshots(storage).find((s) => s.id === btn.dataset.restore);
      if (!snap) return;
      // Reversible by construction: the state being replaced is
      // snapshotted before the restore lands.
      addSnapshot(storage, project, "auto — before restoring a snapshot");
      hooks.onRestore?.(JSON.parse(JSON.stringify(snap.project)));
    });
  });
  container.querySelectorAll("[data-unsnap]").forEach((btn) => {
    btn.addEventListener("click", () => {
      removeSnapshot(storage, btn.dataset.unsnap);
      hooks.onTouched?.();
    });
  });
}

function escapeHtml(s = "") {
  return String(s).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[ch]));
}
