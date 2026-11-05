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
- **Publisher name (Paul, Nov 4, 2026): "Damonini and Pepper Software Development"** — the name on the About page's maker line and the PayPal display name for donations (a brand name on the payment page, not his personal inbox or personal-name account front). Candidate publisher name for the GitHub repo/releases as well.
- **Suggested donation: $1 or $2** (Paul, Nov 4, 2026) — one-tap suggested amounts baked into the Donate section, labeled plainly as a SUGGESTION. His words: "it's just a suggested donation. Nothing's ever required." Model (his framing): the donation framework works because people who can pay often feel moved to give — while people who can't afford it still get the software free. Copy must carry both halves: grateful for a dollar or two if you have it; genuinely free if you don't.
- Donation channel: **PayPal via a PayPal.me link (or PayPal hosted donate button)** — PRIVACY RULE (Paul, Nov 4, 2026): his email is NEVER published anywhere in the app, README, or video. Reason, his words: an email address printed in the open "could get spammed by just anybody." PayPal.me gives a paypal.me/<name> link — donors pay through the link, the email stays hidden. Donors will see the account's display name when paying (Paul accepts this: "they'll have access to know who I am" — it's the address he is protecting, not his identity). Option to weigh at setup: a PayPal business display under the Damonini brand vs. his personal name. NEVER Cash App.
- **QR code (Paul, Nov 4, 2026):** the Donate section shows a QR code the user can scan with their phone to land on the donation page with the suggested $1–$2 one tap away — donating from the couch, phone already in hand, no typing. The QR is generated from the donation URL at build/release time (no third-party QR service baked in), and the same QR can ride the instructional video's end screen and the README.

## Release labeling — BETA (Paul, voice call, Nov 4, 2026, ~7:48 PM)
- The FIRST version put up must clearly say it is a **beta test**. Labeling checklist for the release phase:
  - Version number stays in the 0.x range; the word "Beta" rides with the product name everywhere it appears at release.
  - Installer filename and installer screens say Beta.
  - App title bar and the first-run terms gate header say Beta.
  - About screen says Beta (and the version).
  - GitHub release is marked **Pre-release**, and the README carries a Beta notice at the top.
  - The Terms (§3) now carry a beta-status paragraph: unfinished by definition, may lose/corrupt files, back up your work.
- Beta comes off only when Paul says so — not by a version number rolling over on its own.

## What else makes it GREAT freeware (brainstorm, Paul + Pepper, voice call Nov 4, 2026, ~7:56 PM)
Paul asked what else would make this really good freeware. Captured for the roadmap:
1. **No watermark, ever.** Freeware that watermarks your video is an upsell in disguise. Ours never does — part of the free promise.
2. **Auto-save + crash recovery.** The app quietly saves as you go and reopens where you left off after a crash — a beginner should never lose work, especially in beta.
3. **A finished-first-video path:** a sample starter project bundled in, so a brand-new user can press three buttons and HAVE a video — then learn by changing it.
4. **One-button platform presets:** "Make my YouTube video", "Make a Short / TikTok / Reel" (vertical 9:16) — correct sizes and settings chosen FOR the user, in plain words.
5. **Copyright-safe music:** a small bundled set of royalty-free tracks plus plain guidance, so new creators don't get their first video struck over a song.
6. **Never locked in:** the project file format is documented and open — your work is yours, readable without us.
7. **Quiet update check:** tells you once when a new version exists, then shuts up. No nag screens.
8. **Grows with you:** keyboard shortcuts printed right in the tooltips, so the 12-year-old who masters it at 14 finds the fast path waiting.

## Pepper's robustness suggestions (offered Nov 4, 2026, ~7:57 PM — Paul: "fully open to suggestions")
For the Phase 4–6 engineering list:
1. **Opens anything.** If your phone recorded it, we open it — FFmpeg eats every format; no "unsupported file" dead ends for beginners.
2. **Proxy editing.** The app quietly edits with lightweight copies and exports at full quality, so a ten-year-old laptop can cut 4K phone footage without melting.
3. **Loudness leveling.** One toggle — "Make it all the same loudness" — so voices don't whisper and music doesn't blast; platforms judge this and beginners never know why.
4. **Caption safe zones.** On-screen guides show where TikTok/YouTube put their buttons, so captions never hide under the platform's own furniture.
5. **Project snapshots.** "Go back to how it was yesterday" — automatic dated versions of the project, plain JSON underneath, recoverable by hand if the worst happens.
6. **Shareable project bundle.** Export the whole project (clips + edit decisions) as one file to back up or hand to a friend.
7. **Export in the background** with a big honest progress bar, while you keep editing the next video.
