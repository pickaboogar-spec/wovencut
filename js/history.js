// WovenCut (working title) — undo / redo history (pro-upgrade batch, Nov 5 2026)
// ---------------------------------------------------------------------------
// Pro editors let you undo EVERYTHING — Paul's design charter says the
// same ("undo on everything"). This is a snapshot history: the app calls
// noteChange(project) after every edit; when the project's JSON actually
// changed, the previous state is pushed onto the undo stack. Undo/redo
// hand back a fresh parsed project for the app to adopt.
//
// Snapshots are plain JSON strings, capped at MAX_STEPS so a long session
// can't grow memory without bound. Selection and playhead are NOT part of
// history (same as pro editors: undo affects the edit, not your view).

const MAX_STEPS = 80;

export class History {
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
    this.current = null; // JSON string of the state we last recorded
  }

  // Start fresh for a newly created/opened project.
  reset(project) {
    this.undoStack = [];
    this.redoStack = [];
    this.current = JSON.stringify(project);
  }

  // Call after any possible mutation. Records only real changes, so
  // re-renders and no-op refreshes never pollute the undo stack.
  noteChange(project) {
    if (this.current === null) {
      this.current = JSON.stringify(project);
      return;
    }
    const next = JSON.stringify(project);
    if (next === this.current) return;
    this.undoStack.push(this.current);
    if (this.undoStack.length > MAX_STEPS) this.undoStack.shift();
    this.redoStack = [];
    this.current = next;
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  // Returns the project to adopt, or null when there's nothing to undo.
  undo() {
    if (!this.canUndo()) return null;
    this.redoStack.push(this.current);
    this.current = this.undoStack.pop();
    return JSON.parse(this.current);
  }

  redo() {
    if (!this.canRedo()) return null;
    this.undoStack.push(this.current);
    this.current = this.redoStack.pop();
    return JSON.parse(this.current);
  }
}
