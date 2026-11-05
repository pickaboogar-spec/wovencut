// WovenCut (working title) — captions
// ---------------------------------------------------------------------------
// The model carries captions as [{ id, start, end, text }] in seconds.
// Captions can be added (💬 Add Caption button), selected on the captions
// lane, DRAGGED left/right on the lane to retime them (pro-upgrade batch,
// Nov 5 2026), and their words/timing edited in the inspector — those
// mutations live here and WORK.
//
// SRT import/export (pro pass 2, Nov 5 2026): SRT is the subtitle file
// format every platform accepts (YouTube, TikTok, Vimeo…). Export writes
// the project's captions as a standard .srt; import reads one back in.
// The parser is tolerant: CRLF or LF, '.' or ',' before milliseconds,
// missing sequence numbers, and multi-line caption text all parse.
//
// Design constraints inherited from Paul's other work:
//  - Caption type is LARGE and legible on a phone at a glance.
//  - One caption per segment by default; free timing is the exception.

import { uid } from "./model.js";

export function listCaptions(project) {
  return [...project.captions].sort((a, b) => a.start - b.start);
}

export function addCaption(project, start, text = "") {
  const caption = {
    id: uid("t"),
    start: +start.toFixed(2),
    end: +(start + 4).toFixed(2),
    text,
  };
  project.captions.push(caption);
  return caption;
}

export function setCaptionText(project, id, text) {
  const c = project.captions.find((x) => x.id === id);
  if (c) c.text = text;
}

// Shift a caption's start/end, clamped to the project and to >= 0.5s long.
export function retimeCaption(project, id, start, end) {
  const c = project.captions.find((x) => x.id === id);
  if (!c) return;
  c.start = Math.max(0, +start.toFixed(2));
  c.end = Math.max(c.start + 0.5, +end.toFixed(2));
}

// --- SRT -------------------------------------------------------------------

// "00:01:05,250" — SRT's timestamp shape (comma before milliseconds).
export function formatSrtTime(t) {
  const safe = Math.max(0, t || 0);
  const ms = Math.round((safe - Math.floor(safe)) * 1000);
  const totalSeconds = Math.floor(safe);
  const ss = totalSeconds % 60;
  const mm = Math.floor(totalSeconds / 60) % 60;
  const hh = Math.floor(totalSeconds / 3600);
  const p2 = (n) => String(n).padStart(2, "0");
  return `${p2(hh)}:${p2(mm)}:${p2(ss)},${String(ms).padStart(3, "0")}`;
}

function parseSrtTime(s) {
  const m = /^(\d+):(\d{1,2}):(\d{1,2})[,.](\d{1,3})$/.exec((s || "").trim());
  if (!m) return null;
  const [, h, min, sec, ms] = m;
  return +h * 3600 + +min * 60 + +sec + +ms.padEnd(3, "0") / 1000;
}

// Project captions → SRT file text. Captions with no words are skipped
// (an empty cue is junk to every player); output is sorted by start.
export function captionsToSrt(project) {
  const caps = listCaptions(project).filter((c) => (c.text || "").trim());
  return (
    caps
      .map(
        (c, i) =>
          `${i + 1}\n${formatSrtTime(c.start)} --> ${formatSrtTime(c.end)}\n${c.text.trim()}\n`
      )
      .join("\n") + (caps.length ? "\n" : "")
  );
}

// SRT file text → caption objects [{ id, start, end, text }]. Blocks that
// don't parse are skipped rather than failing the whole import; the
// caller reports how many landed.
export function parseSrt(text) {
  if (!text) return [];
  const blocks = String(text).replace(/\r\n?/g, "\n").split(/\n\s*\n/);
  const out = [];
  for (const block of blocks) {
    const lines = block.split("\n").filter((l) => l.trim() !== "" || false);
    const timeIdx = lines.findIndex((l) => l.includes("-->"));
    if (timeIdx === -1) continue;
    const [startRaw, endRaw] = lines[timeIdx].split("-->").map((s) => s.trim().split(/\s+/)[0]);
    const start = parseSrtTime(startRaw);
    const end = parseSrtTime(endRaw);
    if (start === null || end === null || end <= start) continue;
    const words = lines.slice(timeIdx + 1).join("\n").trim();
    out.push({
      id: uid("t"),
      start: +start.toFixed(2),
      end: +end.toFixed(2),
      text: words,
    });
  }
  return out.sort((a, b) => a.start - b.start);
}

// Replace the project's captions with an SRT file's contents. Returns the
// number imported. (Undo covers regrets — the caller refreshes after.)
export function importSrtInto(project, text) {
  const caps = parseSrt(text);
  project.captions = caps;
  return caps.length;
}

// Import/export result message. The panel re-mounts on every app
// refresh, which would wipe a message written straight into the DOM —
// so the message is kept here and each mount renders it once.
let flashStatus = "";

// Panel: summary, SRT import/export, and how editing works.
// hooks: { onChange(), saveTextFile(name, text) } — saveTextFile comes
// from the desktop shell when present; the browser fallback downloads.
export function mountCaptionsEditor(project, container, hooks = {}) {
  const n = project.captions.filter((c) => c.text).length;
  const flash = flashStatus;
  flashStatus = "";
  container.innerHTML =
    `<p class="stub-note">${n} caption${n === 1 ? "" : "s"} in this project. ` +
    `Add one with the 💬 Add Caption button (it lands at the playhead), ` +
    `drag it left or right on the Captions lane to retime it, and edit ` +
    `its words and exact timing in the inspector.</p>` +
    `<div class="insp-actions">
      <button type="button" class="tool-btn" data-action="srt-import"
        title="Load captions from a subtitle file (.srt) — it REPLACES the captions in this project. Undo (Ctrl+Z) brings the old ones back.">📥 Import Captions (.srt)…</button>
      <button type="button" class="tool-btn" data-action="srt-export"
        title="Save this project's captions as a subtitle file (.srt) — upload it next to your video on YouTube or TikTok, or keep it as a backup of your caption wording">💾 Export Captions (.srt)</button>
    </div>
    <input type="file" data-srt-file hidden accept=".srt,text/plain">
    <p class="stub-note" data-srt-status ${flash ? "" : "hidden"}>${flash}</p>`;

  const status = container.querySelector("[data-srt-status]");
  const say = (msg) => {
    flashStatus = msg; // survives the refresh remount this may trigger
    status.hidden = false;
    status.textContent = msg;
  };
  const fileInput = container.querySelector("[data-srt-file]");
  container.querySelector('[data-action="srt-import"]')
    .addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    fileInput.value = "";
    if (!file) return;
    try {
      const count = importSrtInto(project, await file.text());
      say(count
        ? `📥 Imported ${count} caption${count === 1 ? "" : "s"} from ${file.name}. (Undo brings the old captions back.)`
        : `⚠️ No readable captions found in ${file.name} — nothing was changed.`);
      if (count) hooks.onChange?.();
    } catch {
      say("⚠️ That file couldn't be read as an .srt — nothing was changed.");
    }
  });
  container.querySelector('[data-action="srt-export"]')
    .addEventListener("click", async () => {
      const srt = captionsToSrt(project);
      if (!srt) {
        say("There are no captioned words to export yet — add a caption with words first.");
        return;
      }
      const name = `${project.title || "wovencut"} — captions.srt`;
      if (hooks.saveTextFile) {
        const path = await hooks.saveTextFile(name, srt);
        say(path ? `💾 Captions saved to ${path}` : "Save cancelled — nothing written.");
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([srt], { type: "text/plain" }));
        a.download = name;
        a.click();
        URL.revokeObjectURL(a.href);
        say("💾 Captions file downloaded.");
      }
    });
}
