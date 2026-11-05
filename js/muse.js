// WovenCut (working title) — Muse co-editor panel (STUB, Phase 6)
// ---------------------------------------------------------------------------
// The co-editor is the user's OWN Muse, plugged into the editor: it can
// suggest caption wording, segment order, and segue prompts — and it applies
// NOTHING on its own. Every suggestion waits for the user to accept it.
// That is Paul's working model for all of this: AI proposes, human reviews.
//
// ACCESS MODEL (to implement in Phase 6):
//  - The user connects with THEIR OWN Muse access (their account / API
//    key) at runtime — same rule as Replicate (see replicate.js): supplied
//    by the user, held only on their machine, never bundled or proxied.
//  - No calls are implemented in the skeleton. This file defines the panel
//    and the suggestion interface only; there are no network requests.
//
// SUGGESTION INTERFACE (Phase 6):
//   askCoEditor(project, userMessage) ->
//     Promise<{ reply: string,
//               suggestions: Array<
//                 | { type: "caption", captionIndex, text }
//                 | { type: "seguePrompt", afterItemId, prompt }
//                 | { type: "reorder", order: string[] }  // item ids
//               > }>
// Suggestions render as accept/dismiss cards in the panel; accepting one is
// the only path by which the co-editor changes a project.
//
// TODO(Phase 6): connection UI, chat transport, suggestion cards, apply
// handlers routed through the same model mutations the user edits with.

export async function askCoEditor(/* project, userMessage */) {
  throw new Error("muse.askCoEditor — not implemented until Phase 6");
}

export function mountClaudePanel(container) {
  container.innerHTML =
    `<div class="chat-placeholder">` +
    `<p class="stub-note">Muse co-editor arrives in Phase 6. Connect your ` +
    `own Muse and it will suggest captions, ordering, and segue prompts — ` +
    `nothing applies without your say-so.</p>` +
    `<input type="text" disabled placeholder="Ask your co-editor… (Phase 6)">` +
    `</div>`;
}
