import assert from "node:assert";
import {
  emptyProject, sampleProject, migrateProject, formatTimecode, formatClock,
  projectDuration,
} from "../js/model.js";
import { History } from "../js/history.js";
import {
  planExport, buildFfmpegArgs, getExportSpec, EXPORT_PRESETS,
} from "../js/export.js";
import { splitMainItemAt, removeItem } from "../js/timeline.js";

// Timecode
assert.equal(formatTimecode(0, 30), "00:00:00:00");
assert.equal(formatTimecode(75.5, 30), "00:01:15:15");
assert.equal(formatTimecode(3661, 25), "01:01:01:00");
assert.equal(formatClock(65), "01:05");
assert.equal(formatClock(3600), "1:00:00");

// Empty project defaults
const p = emptyProject("t");
assert.deepEqual(p.settings, { width: 1920, height: 1080, fps: 30 });
assert.deepEqual(p.markers, []);
assert.equal(p.exportPreset, "youtube-1080");

// Sample project: Paul's rule intact (first clip fade-in 0) + markers exist
const s = sampleProject();
assert.equal(s.tracks.main[0].fadeIn, 0);
assert.equal(s.markers.length, 2);
assert.equal(projectDuration(s), 15);

// History round-trip
const h = new History();
h.reset(p);
p.title = "changed";
h.noteChange(p);
assert.equal(h.canUndo(), true);
const back = h.undo();
assert.equal(back.title, "t");
assert.equal(h.canRedo(), true);
const fwd = h.redo();
assert.equal(fwd.title, "changed");
h.noteChange(fwd); // no-op after redo (same state)
assert.equal(h.canRedo(), false);
// No-change noteChange must not create undo steps
const h2 = new History();
h2.reset(p);
h2.noteChange(p);
assert.equal(h2.canUndo(), false);

// Export presets resolve + reach the ffmpeg plan
assert.equal(EXPORT_PRESETS.length, 5);
const v = emptyProject("v");
v.tracks.main = sampleProject().tracks.main;
v.exportPreset = "vertical";
const spec = getExportSpec(v);
assert.deepEqual([spec.width, spec.height, spec.fps], [1080, 1920, 30]);
const plan = planExport(v);
assert.match(plan.output, /1080×1920/);
const args = buildFfmpegArgs(v, "out.mp4").join(" ");
assert.match(args, /-s 1080x1920/);
assert.match(args, /-r 30/);
// "project" preset follows settings
v.exportPreset = "project";
v.settings = { width: 1080, height: 1080, fps: 24 };
assert.deepEqual(
  (({ width, height, fps }) => [width, height, fps])(getExportSpec(v)),
  [1080, 1080, 24]
);
// First-frame rule in the plan text for every preset
for (const preset of EXPORT_PRESETS) {
  v.exportPreset = preset.id;
  assert.match(planExport(v).firstFrame, /fade-in defaults to 0/);
}

// Migration: v2 project gains settings/markers/preset
const v2 = {
  version: 2, title: "old",
  tracks: { main: [], overlay: [] },
  captions: [], music: { src: null, volume: 0.8 },
};
const mig = migrateProject(structuredClone(v2));
assert.equal(mig.version, 3);
assert.deepEqual(mig.settings, { width: 1920, height: 1080, fps: 30 });
assert.deepEqual(mig.markers, []);

// Split + marker removal helpers
const sp = sampleProject();
const firstId = sp.tracks.main[0].id;
const newId = splitMainItemAt(sp, firstId, 2);
assert.ok(newId);
assert.equal(sp.tracks.main.length, 5);
assert.equal(sp.tracks.main[0].duration, 2);
assert.equal(sp.tracks.main[1].fadeIn, 0); // split point is a hard cut
const mid = sp.markers[0].id;
removeItem(sp, "marker", mid);
assert.equal(sp.markers.length, 1);

console.log("ALL NODE TESTS PASSED");
