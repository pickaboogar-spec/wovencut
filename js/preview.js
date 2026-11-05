// WovenCut (working title) — canvas preview player (Phase 1 desktop)
// ---------------------------------------------------------------------------
// Plays a project's main track on a <canvas>: placeholder frames drawn
// from each item's hue + label (real thumbnails/video frames are a later
// phase), per-clip fade-in/fade-out honoured, crossfades rendered across
// boundaries, PiP overlays composited in their corner, captions large at
// the bottom.
//
// PAUL'S FIRST-FRAME RULE: the first clip's fadeIn defaults to 0 (see
// RULES in model.js), so a new project opens on segment one at full
// strength from t=0. The fade machinery here is a TOOL — it draws whatever
// the clip's numbers say, and Paul's projects say 0. Crossfades only ever
// happen across a cut boundary, between segment n and n+1.

import { backgroundAt, captionAt, itemStartTimes, layersAt, projectDuration } from "./model.js";

export class Preview {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.project = null;
    this.playing = false;
    this.startedAt = 0;
    this.offset = 0;
    this.raf = null;
    this.onTick = null;
    // Shuttle rate for J/K/L transport (pro-upgrade batch, Nov 5 2026):
    // 1 = normal forward; L presses speed up (2×, 4×), J plays BACKWARD
    // (−1×, −2×, −4×) — possible because preview frames are drawn
    // procedurally, so any instant can be rendered in either direction.
    this.rate = 1;
  }

  load(project) {
    this.project = project;
    this.offset = 0;
    this.rate = 1;
    this.draw(0);
  }

  play() {
    if (!this.project || this.playing) return;
    if (this.rate === 0) this.rate = 1;
    this.playing = true;
    this.startedAt = performance.now();
    const loop = (now) => {
      if (!this.playing) return;
      const t = this.currentTime();
      this.draw(t);
      if (this.onTick) this.onTick(t);
      const total = projectDuration(this.project);
      if ((this.rate > 0 && t >= total) || (this.rate < 0 && t <= 0)) {
        this.pause();
        if (this.onTick) this.onTick(this.currentTime());
        return;
      }
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  pause() {
    const wasPlaying = this.playing;
    this.playing = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    if (this.project && wasPlaying) {
      const total = projectDuration(this.project);
      this.offset = Math.max(0, Math.min(this.currentTime(), total));
    }
    this.rate = 1;
  }

  // Set the shuttle rate while playing (J/L). 0 pauses.
  setRate(r) {
    if (!this.project) return;
    if (r === 0) {
      this.pause();
      return;
    }
    this.offset = this.currentTime();
    this.startedAt = performance.now();
    this.rate = r;
    if (!this.playing) this.play();
  }

  restart() {
    this.offset = 0;
    this.rate = 1;
    this.startedAt = performance.now();
    this.draw(0);
    if (!this.playing) this.play();
  }

  seek(t) {
    const total = this.project ? projectDuration(this.project) : 0;
    this.offset = Math.max(0, Math.min(t, total));
    if (this.playing) this.startedAt = performance.now();
    this.draw(this.offset);
    if (this.onTick) this.onTick(this.offset);
  }

  currentTime() {
    if (!this.playing) return this.offset;
    return this.offset + ((performance.now() - this.startedAt) / 1000) * this.rate;
  }

  // Alpha of a main-track item at a point inside it: its own fade-in and
  // fade-out applied. A 0 fade contributes nothing — by default, segment
  // one sits at alpha 1 from its first instant (Paul's rule).
  fadeAlpha(item, intoItem) {
    let a = 1;
    if (item.fadeIn > 0 && intoItem < item.fadeIn) a = Math.min(a, intoItem / item.fadeIn);
    const remain = item.duration - intoItem;
    if (item.fadeOut > 0 && remain < item.fadeOut) a = Math.min(a, remain / item.fadeOut);
    return a;
  }

  draw(t) {
    const { ctx, canvas, project } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!project || project.tracks.main.length === 0) {
      ctx.fillStyle = "#101116";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.font = "600 26px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Drop clips onto the timeline to begin", canvas.width / 2, canvas.height / 2);
      return;
    }
    const starts = itemStartTimes(project);
    const total = projectDuration(project);
    const tc = Math.min(t, total);

    let idx = project.tracks.main.findIndex(
      (item, i) => tc >= starts[i] && tc < starts[i] + item.duration
    );
    if (idx === -1) idx = project.tracks.main.length - 1;

    // BACKGROUND lane first: it fills the frame behind everything else.
    const bg = backgroundAt(project, tc);
    if (bg) this.drawFrame(bg, 1, 0, 0, canvas.width, canvas.height);

    const item = project.tracks.main[idx];
    const intoItem = tc - starts[idx];
    // Green-screen clips are drawn translucent in the placeholder preview
    // so the background lane visibly shows through — a stand-in for the
    // real chroma key the Phase 4 export does with FFmpeg's chromakey.
    const mainAlpha = this.fadeAlpha(item, intoItem) * (item.keyGreen && bg ? 0.62 : 1);
    this.drawFrame(item, mainAlpha, 0, 0, canvas.width, canvas.height);
    if (item.keyGreen && bg) {
      ctx.save();
      ctx.font = "500 15px system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.textAlign = "center";
      ctx.fillText("🟩 green screen — the backdrop shows through where the green was",
        canvas.width / 2, 30);
      ctx.restore();
    }

    // Crossfade across the boundary INTO the next segment.
    const next = project.tracks.main[idx + 1];
    if (next && next.transitionIn === "crossfade") {
      const remain = item.duration - intoItem;
      const d = next.transitionDuration || 0.5;
      if (remain < d) {
        this.drawFrame(next, 1 - remain / d, 0, 0, canvas.width, canvas.height);
      }
    }

    // Layer lanes over the top, bottom lane first so higher layers win.
    for (const o of layersAt(project, tc)) {
      const w = (canvas.width * o.sizePct) / 100;
      const h = (w * 9) / 16;
      const m = 24;
      const pos = {
        "top-left": [m, m],
        "top-right": [canvas.width - w - m, m],
        "bottom-left": [m, canvas.height - h - m],
        "bottom-right": [canvas.width - w - m, canvas.height - h - m],
      }[o.corner] || [canvas.width - w - m, canvas.height - h - m];
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = 3;
      ctx.strokeRect(pos[0], pos[1], w, h);
      this.drawFrame(o, 1, pos[0], pos[1], w, h, true);
      ctx.restore();
    }

    const cap = captionAt(project, Math.min(tc, total - 0.001));
    if (cap) this.drawCaption(cap.text);
  }

  // Placeholder frame: a two-tone wash from the item's hue plus its label.
  // Later phases replace this with real image/clip frames.
  drawFrame(item, alpha, x, y, w, h, small = false) {
    const { ctx } = this;
    ctx.save();
    ctx.globalAlpha = alpha;
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, `hsl(${item.hue} 45% 32%)`);
    grad.addColorStop(1, `hsl(${item.hue} 55% 18%)`);
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = `600 ${small ? 15 : 34}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    const label = item.label.length > (small ? 22 : 44)
      ? item.label.slice(0, (small ? 22 : 44) - 1) + "…"
      : item.label;
    ctx.fillText(label, x + w / 2, y + h / 2);
    if (item.generated && !small) {
      ctx.font = "500 16px system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.65)";
      ctx.fillText("AI segue — generated with the user's own Replicate account",
        x + w / 2, y + h / 2 + 34);
    }
    ctx.restore();
  }

  // Captions: large, high-contrast, readable at a glance (Paul's standard).
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
