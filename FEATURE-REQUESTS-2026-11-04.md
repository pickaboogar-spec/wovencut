# WovenCut — Paul's feature additions (voice call, Nov 4, 2026, ~7:32 PM)
Status: captured verbatim from Paul; to be merged into WORKFLOW.md's feature roadmap at the Phase 1 review gate (the Phase 1 build was in flight when these arrived).

## 1. Tracked logo overlay — "your logo on a plain t-shirt"
- Put the user's own logo onto a plain t-shirt (or other surface) in the video, as an overlay that FOLLOWS the person as they move.
- Phasing: Phase A — manual keyframed tracking (place overlay, set keyframes, interpolate position/scale/rotation; FFmpeg overlay at export). Phase B — assisted auto/motion tracking (later, flagged hard).
- GUI: "Logo Overlay" tool on the overlay/PiP lane — icon + plain label + tooltip, per the design rule.

## 2. Logo obscurer — "don't get sued"
- Obscure (blur / mosaic / patch) trademarked or copyrighted logos that appear in the frame, so creators don't have to worry about trademark/copyright infringement in published videos.
- Phasing: Phase A — user draws a box over the logo; box can be keyframe-tracked like feature 1; export applies FFmpeg boxblur/drawbox. Phase B — assisted detection suggestions (vision task via the user's own Muse/Replicate; exploratory).
- GUI: "Hide a Logo" tool — icon + plain label + tooltip. Framed as a creator-protection feature.
- Paul's framing correction (voice call, Nov 4, 2026): the protection aim is that the logo is blurred from HUMAN view — unrecognizable to the eye. Describe the tool exactly that way; never as a technical or legal guarantee against detection or claims.

## 3. Terms of use / legal protection (Paul, voice call, Nov 4, 2026)
- Freeware still ships with terms: use-at-own-risk, no warranty, liability limits — "people aren't going to read it anyways, but it's a built-in protection for us."
- Draft written: TERMS-OF-USE-DRAFT.md in this folder (draft for Paul's approval; pairs with whichever license he picks — MIT/GPL both carry no-warranty clauses; the license choice is still his).
- Workflow note: add a terms screen to the installer / first-run flow.
- HARD REQUIREMENT (Paul, Nov 4, 2026): even though it's freeware and they download it, they can't OPEN the app until they've agreed to the terms. First-run clickwrap gate inside the app (not only the installer): full terms shown, editor unreachable until "I Agree"; local acceptance marker with terms version + date; re-prompt when the terms version changes; Decline closes the app. Full spec is in TERMS-OF-USE-DRAFT.md under "Acceptance gate".
