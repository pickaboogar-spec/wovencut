# WovenCut — Paul's feature additions (voice call, Nov 4, 2026, ~7:32 PM)
Status: captured verbatim from Paul; to be merged into WORKFLOW.md's feature roadmap at the Phase 1 review gate (the Phase 1 build was in flight when these arrived).

## DESIGN NORTH STAR — "12 to 70" (Paul, voice call, Nov 4, 2026, ~7:42 PM)
- The GUI must be genuinely ATTRACTIVE and so easy that a kid of 12 or a grandparent of 70 can figure it out, put content online, and become a content creator.
- Paul's rationale, his framing: the creator economy is where the human economy is going, because AI and robotics will take over almost everything else. This app is a door into that economy for people priced and skilled out of the pro tools.
- Consequences for design: big readable type, generous click targets, plain-words labels (already a rule), zero assumed jargon ("export" says what it makes — e.g., "Make my YouTube video"), forgiving undo everywhere, no hidden right-click-only features, first-run guided path from empty project to finished video in a handful of obvious steps. Beauty matters too — it should look like something a person is proud to open, not a utility panel.
- Test question for every screen: "Could a 12-year-old and a 70-year-old each finish a video with this, unhelped?"

## Comfort & appearance options (Paul, voice call, Nov 4, 2026, ~7:43 PM)- A couple of COLOR OPTIONS (themes) so users can pick a look they like.
- DAYTIME and NIGHTTIME screens — a bright day mode and an easy-on-the-eyes night mode; follow the Windows setting automatically, with a big friendly manual toggle too (Paul edits at night; the grandparent edits at noon — both served).
- Filed under Paul's general principle: "all these little options that make it more friendly software to use" — comfort settings live in ONE obvious place ("Make it comfortable" settings page), in plain words, no hunting through menus.

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

## About + Donate (Paul, voice call, Nov 4, 2026, ~7:44 PM)
- An **About** entry at the RIGHT-HAND side of the menu bar.
- The About page tells them who Paul is and what he does (maker story — draft copy is Paul's to approve; business rule applies: brand Damonini + "by Paul Blanchard" framing as on his other surfaces).
- A **Donate** section inside About: if you appreciate and like this software, you can donate so Paul can create more free software for people to use. STRICTLY voluntary — donation never unlocks, nags, or gates anything (his information-is-free principle; the app stays fully free). One quiet link, no pop-ups, no reminders.
- Donation channel: TBD by Paul (PayPal is his known-accepted route; NEVER Cash App).

## Release labeling — BETA (Paul, voice call, Nov 4, 2026, ~7:48 PM)
- The FIRST version put up must clearly say it is a **beta test**. Labeling checklist for the release phase:
  - Version number stays in the 0.x range; the word "Beta" rides with the product name everywhere it appears at release.
  - Installer filename and installer screens say Beta.
  - App title bar and the first-run terms gate header say Beta.
  - About screen says Beta (and the version).
  - GitHub release is marked **Pre-release**, and the README carries a Beta notice at the top.
  - The Terms (§3) now carry a beta-status paragraph: unfinished by definition, may lose/corrupt files, back up your work.
- Beta comes off only when Paul says so — not by a version number rolling over on its own.
