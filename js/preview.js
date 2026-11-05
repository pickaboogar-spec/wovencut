// WovenCut (working title) — canvas preview player
// ---------------------------------------------------------------------------
// Plays a project's picture track on a <canvas>: placeholder frames drawn
// from each item's hue + label (real image loading is Phase 1), captions
// rendered large at the bottom, dissolves honoured between segments.
//
// PAUL'S FIRST-FRAME RULE is enforced here, not just documented: the first
// segment is drawn at opacity 1 from t=0 — see RULES.FIRST_SEGMENT_FADE_IN_MS
// in model.js (0, and not project-configurable). Crossfades only ever happen
// across a cut boundary, between segment n and n+1.

import { RULES, captionAt, itemStartTimes } from "./model.js";

const DISSOLVE_MS = 600; // between segments only — never onto segment one

export class Preview {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.project = null;
    this.playing = false;
    this.startedAt = 0;   // performance.now() when playhead was at 0
    this.offset = 0;      // seconds into the project when paused
    this.raf = null;
    this.onTick = null;   // optional callback(seconds) for UI readouts
  }

  load(project) {
    this.project = project;
    this.offset = 0;
    this.draw(0);
  }

  play() {
    if (!this.project || this.playing) return;
    this.playing = true;
    this.startedAt = performance.now() - this.offset * 1000;
    const loop = (now) => {
      if (!this.playing) return;
      const t = (now - this.startedAt) / 1000;
      this.draw(t);
      if (this.onTick) this.onTick(t);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  pause() {
    this.playing = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.offset = this.project
      ? Math.min(this.currentTime(), this.project.stills.reduce((s, i) => s + i.duration, 0))
      : 0;
  }

  restart() {
    this.offset = 0;
    this.startedAt = performance.now();
    this.draw(0);
    if (!this.playing) this.play();
  }

  currentTime() {
    if (!this.playing) return this.offset;
    return (performance.now() - this.startedAt) / 1000;
  }

  draw(t) {
    const { ctx, canvas, project } = this;
    if (!project) return;
    const starts = itemStartTimes(project);
    const total = starts[starts.length - 1] + project.stills[project.stills.length - 1].duration;

    let idx = project.stills.findIndex(
      (item, i) => t >= starts[i] && t < starts[i] + item.duration
    );
    if (idx === -1) idx = project.stills.length - 1; // hold last frame past end

    const item = project.stills[idx];
    const intoItem = t - starts[idx];

    this.drawFrame(item, 1);

    // Dissolve across the boundary INTO the next segment, late in this one.
    // Segment one's own arrival is never faded — this branch only runs when
    // idx >= 0 is showing a segment and the NEXT one dissolves in; segment
    // one itself entered at full strength at t=0 by construction.
    const next = project.stills[idx + 1];
    if (next && next.transitionIn === "dissolve") {
      const remainMs = (item.duration - intoItem) * 1000;
      if (remainMs < DISSOLVE_MS) {
        this.drawFrame(next, 1 - remainMs / DISSOLVE_MS);
      }
    }

    const cap = captionAt(project, Math.min(t, total - 0.001));
    if (cap) this.drawCaption(cap.text);
  }

  // Placeholder frame: a two-tone wash from the item's hue plus its label.
  // Phase 1 replaces this with the user's real image / clip frames.
  drawFrame(item, alpha) {
    const { ctx, canvas } = this;
    ctx.save();
    ctx.globalAlpha = alpha;
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, `hsl(${item.hue} 45% 32%)`);
    grad.addColorStop(1, `hsl(${item.hue} 55% 18%)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "600 34px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(item.label, canvas.width / 2, canvas.height / 2);
    if (item.generated) {
      ctx.font = "500 16px system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.65)";
      ctx.fillText("AI segue — generated with the user's own Replicate account",
        canvas.width / 2, canvas.height / 2 + 34);
    }
    ctx.restore();
  }

  // Captions: large, high-contrast, phone-readable (Paul's legibility
  // standard) with a dark backing band.
  drawCaption(text) {
    const { ctx, canvas } = this;
    ctx.save();
    ctx.font = "600 26px system-ui, sans-serif";
    ctx.textAlign = "center";
    const width = Math.min(ctx.measureText(text).width + 48, canvas.width - 32);
    const x = (canvas.width - width) / 2;
    const y = canvas.height - 72;
    ctx.fillStyle = "rgba(0,0,0,0.68)";
    ctx.beginPath();
    ctx.roundRect(x, y, width, 48, 10);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillText(text, canvas.width / 2, y + 33);
    ctx.restore();
  }
}
