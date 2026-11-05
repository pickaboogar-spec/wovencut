// WovenCut (working title) — Replicate segue generation (STUB, Phase 5)
// ---------------------------------------------------------------------------
// A "segue" is a short AI-generated clip woven between two segments so a
// woven-stills sequence flows instead of jumping. Generation runs on
// Replicate with the USER'S OWN account and token.
//
// TOKEN SAFETY — read before implementing:
//  - The user pastes THEIR OWN Replicate API token at runtime, in the app.
//  - The token is held in browser memory / local storage ON THEIR MACHINE
//    ONLY. It is never committed, never bundled, never proxied through any
//    server of ours, and never logged.
//  - There is NO shared, demo, or fallback key. In particular, Paul's
//    personal Replicate credentials exist elsewhere in his setup and must
//    NEVER enter this codebase — this file must stay clean of them.
//  - No token pasted = segue generation stays dark; the editor still edits.
//
// COST HONESTY: generation spends the user's real money. Phase 5 must show
// the estimated cost of a segue BEFORE the user confirms it. No silent spend.
//
// TODO(Phase 5): token entry UI, model choice (image-to-video), polling,
// drop the returned clip into the timeline as { kind: "segue",
// generated: true, provider: "replicate" }.

const TOKEN_STORAGE_KEY = "wovencut.replicateToken"; // user's machine only

export function hasToken() {
  try {
    return Boolean(localStorage.getItem(TOKEN_STORAGE_KEY));
  } catch {
    return false;
  }
}

// Stores the user's own token locally on their machine. Never transmitted
// anywhere by this function.
export function setToken(token) {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token.trim());
  } catch {
    /* storage unavailable — Phase 5 falls back to memory-only */
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch { /* nothing to clear */ }
}

// Interface Phase 5 implements:
//   generateSegue({ fromItem, toItem, prompt, duration }) ->
//     Promise<{ kind: "segue", generated: true, provider: "replicate",
//               src, duration }>
// Throws until implemented.
export async function generateSegue(/* args */) {
  throw new Error("replicate.generateSegue — not implemented until Phase 5");
}

export function mountReplicatePanel(container) {
  container.innerHTML =
    `<p class="stub-note">AI segues arrive in Phase 5. You'll paste your ` +
    `own Replicate token here; it never leaves your machine. ` +
    `Status: ${hasToken() ? "token saved locally" : "no token yet"}.</p>`;
}
