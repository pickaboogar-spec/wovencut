# WovenCut — Development Workflow

**WovenCut is a working title.** Paul brands it later; every use of the name in
this repo is provisional.

**What it is:** a truly free video editor for budget creators. No upsells, no
premium tier, no watermark ransom — ever. It ships "empty": the tool itself is
free, and each user plugs in **their own Muse** (AI co-editor) and **their
own Replicate account** (AI-generated segue/transition clips between scenes).
Users pay their own AI providers at cost; WovenCut takes nothing.

**How it's built:** Paul directs, AI builds, Paul reviews — his
"AI architect, human-reviewed" model. This workflow exists so that loop stays
tight: small phases, each one ending at Paul's review before the next begins.

---

## Paul's hard rules (baked in, not preferences)

1. **First frame rule:** the first segment of every video opens at full
   strength — **no fade-in, ever, and never an open on black.** This is
   encoded as a constant in the code (`js/model.js`) and must survive every
   refactor and every export path.
2. **No upsells.** If a feature idea smells like a premium tier, it is cut or
   it ships free. There is no third option.
3. **Users' keys are users' keys.** Muse and Replicate tokens are supplied by
   each user at runtime, live only on their machine, and are never committed,
   bundled, or proxied. Paul's own credentials never enter this codebase.

---

## Phases

Each phase ends with a **Paul review gate**: Pepper demos what works, Paul
says ship / fix / rethink, and the outcome is recorded (see "How reviews are
recorded") before the next phase starts.

### Phase 0 — Skeleton *(this phase)*
- Static web app, no build step, no server: plain HTML/CSS/JS modules.
- Project data model (JSON): stills/clips track, captions track, music track,
  per-item durations, per-cut transitions, segue items flagged AI-generated.
- Canvas preview that plays a hardcoded sample stills sequence with captions.
- Stub modules for captions editing, music, export, Replicate segues, and the
  Muse co-editor panel — interfaces defined, no network calls.
- **Review gate:** Paul opens the preview, watches the sample sequence, and
  confirms the first frame opens at full strength.

### Phase 1 — Stills timeline
- Load real images from the user's machine; add / remove / reorder stills.
- Per-still duration editing; save / load projects as JSON files.
- **Review gate:** Paul builds a real sequence from his own photos.

### Phase 2 — Captions
- Caption editor: text, timing tied to stills, large legible type (Paul's
  shelf-demo standard: readable on a phone, at a glance, walking pace).
- **Review gate:** Paul captions one full story sequence himself.

### Phase 3 — Music
- Music track: user-supplied audio file, trim/fade-out controls, volume.
- Fade-**out** at the end is fine. Fade-**in** on segment one is not (rule 1
  applies to picture; audio bed may fade under the first still only if Paul
  approves it at this gate — open question, default: no).
- **Review gate:** Paul scores one sequence end to end.

### Phase 4 — Export
- In-browser render via ffmpeg.wasm (planned path; see `js/export.js`).
- Export must encode the first frame rule identically to the preview:
  segment one starts at t=0 at full opacity.
- **Review gate:** Paul exports a real video and posts it; the open-on-black
  check is part of acceptance.

### Phase 5 — Replicate segues
- Per-cut "generate segue" action: sends the tail/head frames of neighbouring
  segments to Replicate with the user's own token, drops the returned clip
  into the timeline as a segue item (flagged `generated: true`).
- Cost display before every generation — the user spends their own money,
  knowingly, per segue. No silent spend.
- **Review gate:** Paul generates one segue on his own Replicate credit and
  judges whether it earns its cost.

### Phase 6 — Muse co-editor panel
- Chat panel wired to the user's own Muse access: suggest caption wording,
  sequence order, segue prompts; nothing applies without the user accepting
  it (human-reviewed, same as Paul's model).
- **Review gate:** Paul runs a full edit session with the panel live.

### Phase 7 — GitHub freeware release *(later — not now)*
- Public repo on **Paul's GitHub account**; static site deployable from
  GitHub Pages (the no-build-step skeleton is chosen with this in mind).
- **Open question for Paul — license:** MIT (anyone can use/fork, including
  commercially) vs GPL (forks must stay open/free — arguably closer to the
  "truly free forever" spirit). **Paul decides; do not default this for him.**
- Release checklist: README with the freeware philosophy, token-safety notes,
  first-frame rule documented as a feature, sample project included.

---

## How reviews are recorded

- Every phase gate gets an entry appended to this file under "Review log"
  with: date, phase, what Paul saw, his verdict (ship / fix / rethink), and
  any rule or direction he set.
- Code changes land as git commits in the Code Vault with messages naming the
  phase (`Phase 1: stills timeline — load/reorder/durations`).
- Per Paul's Code Vault rule, commits here are also mirrored to Drive
  (Pepper > Code Vault), same as the games and VoiceBridge.
- If a phase is rethought, the old plan stays in the log — the record of how
  the tool evolved is part of the experiment.

## Review log

- **2026-11-04 — Phase 0 skeleton delivered for review.** Static skeleton,
  sample woven-stills preview, all AI/export paths stubbed. Awaiting Paul's
  first look.
