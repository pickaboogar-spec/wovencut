# WovenCut — Legal Framework Checklist

**Date:** 2026-11-05 (pro pass 2 legal audit)
**Scope:** Terms of Use v2 (`TERMS-OF-USE-DRAFT.md`), the acceptance gate,
beta labeling, About/Donate, and the release blockers around them.
**Status of the Terms:** DRAFT v2 — Paul's approval pending; not final.

> **This document is preparation, not legal advice.** It records what an
> AI builder implemented and checked against Paul's own design documents
> and the case law cited in the draft. Before any public release, a
> California attorney should review the Terms and this checklist
> (Section E is written as that attorney's agenda). Nothing here is a
> legal opinion, and no item marked "verified" means "legally
> sufficient" — it means "the software does what the text says."

---

## A. In place — implemented and verified this session

The audit's headline finding: **the gate and About/Donate existed only
as design documents.** Paul's hard requirement (Nov 4, 2026) — "they
can't OPEN the app until they've agreed to the terms" — had a complete
spec (in `TERMS-OF-USE-DRAFT.md`) but no code. Both are now built to
that spec, unchanged in design, and verified in the real UI
(headless-Chromium, wheel-driven, zero page errors):

| Requirement (source) | Implementation | Verified |
|---|---|---|
| Editor unreachable before acceptance (§1.1; spec §1) | Full-screen gate overlay on first run; editor keyboard shortcuts swallowed while it is up | ✅ gate up on fresh profile; editor inert behind it |
| Each screen scrolled to its end before its checkbox unlocks (§1.1; spec §2) | Per-screen scroll measurement against the rendered end of the text; screens that fit without scrolling count as already at the end; scroll position measured, not assumed | ✅ checkbox disabled before scroll, enabled after, on every screen |
| Checkbox per screen: "I have read and understand this section" (spec §2) | Exact label on Screens 1–10; the longer final label on Screen 11, per the Screen Map | ✅ |
| No skipping ahead (§1.1; spec §2) | Sequential Next only (Back allowed for re-reading; states persist); Next disabled until the current checkbox is checked | ✅ full 11-screen walk |
| §15 arbitration ALONE on its own screen (Screen 10) (spec §2; Paul's direction) | Screen 10 contains §15 only — incl. §15.7 and its lock consequence — with §16/§17 nowhere on it | ✅ asserted in node tests + read in the UI |
| "I Agree" disabled until every screen is checked (spec §2) | Enabled only when all 11 checkboxes are checked; Screen 11 shows the recap list with per-screen check states | ✅ disabled before final check, enabled after; recap shows 10 rows |
| Decline always available; declining closes the app (spec §2) | Decline button on every screen → desktop: main process quits the app; browser preview: a closed screen replaces the app | ✅ (browser form; the desktop quit path is code-reviewed, unrun until the .exe exists) |
| Acceptance record: version + text fingerprint + date/time + per-screen set (§1.3; spec §3) | Stored in local storage only; nothing transmitted | ✅ record read back: `v2`, fingerprint `ae21b87c`, 11/11 screens, timestamp |
| Changed terms re-run the gate in full (§12; spec §4) | Gate re-runs when the stored version OR the stored text fingerprint differs — a wording change re-triggers even if the version string is forgotten | ✅ tampered fingerprint → full gate on reload |
| Terms viewable from within the software at any time (§1.2) | Footer "📜 Terms of Use" button opens a reading copy (free navigation, no checkboxes) | ✅ |
| Beta labeling (§3; Paul's release-labeling checklist) | Gate header says Beta; window title and document title say Beta; About screen shows "Version 0.2.0 — Beta"; footer says "Beta build" | ✅ in-app surfaces. **Not yet possible:** installer filename/screens and the GitHub release's Pre-release flag — no build/release exists yet |
| Installer presents the Terms as a license page (spec §5) | NSIS `license` configured; `build/license.txt` generated from the operative text | ⚠️ Config-level only — unverifiable until the first Windows build |
| About at the right of the menu bar; quiet Donate inside it (FEATURE-REQUESTS) | About button (right side), modal with maker line "Damonini and Pepper Software Development", suggested $1–$2 labelled as a suggestion, PayPal.me link (opens in the real browser, https-only), QR image shown | ✅ modal verified; QR image loads. **Also fixed:** `assets/**` was missing from the packaged files list — the QR would not have shipped |
| §15.7 opt-out mechanism "present and working as described" | The mechanism is **legal, not technical** (Annex A): the opt-out notice route ([CONTACT], 30 days) and the consequence are stated in §15.7 itself, alone on Screen 10. There is deliberately **no** remote kill switch — building one needs the check-ins Paul ruled out | ✅ text verified on Screen 10; the "lock" is termination of permission, exactly as the draft describes |

## B. Placeholders and decisions that block release

1. **[CONTACT] — a real, monitored email address.** Appears in the
   operative text at §15.1 (dispute notices), **§15.7** (the opt-out
   notice, with its 30-day clock), and §17.6 (notices), plus Annex A's
   superseded variant. Without it, the notice provisions and the
   opt-out cannot function. The address must be monitored and opt-out
   notices kept — a small permanent chore Paul accepts by choosing it.
2. **Paul's approval of Terms v2 itself.** The draft is hardened and
   implemented, but it is still a draft. Two audit wording corrections
   were made in non-operative sections only (changelog + notes), each
   tagged `[Audit correction — pro pass 2 legal audit, 2026-11-05]`
   and listed in the pass-2 work log for his approval. **No operative
   wording was changed by the audit.**
3. **The open-source license choice (MIT vs GPL).** §2 makes the
   License control the code; the choice is still Paul's and the final
   §2 text depends on it.
4. **Final product name.** "WovenCut (working title)" appears in the
   app; the Terms name the product "WovenCut". Branding is Paul's.
5. **About copy.** The About text shipped this session is plain and
   factual; the maker-story copy is Paul's to approve
   (FEATURE-REQUESTS).

## C. The known gaps — status after this audit

**(a) Contact placeholder.** OPEN — see B.1. It is the single hard
blocker: three operative provisions point at it.

**(b) Proof of agreement lives only on the user's machine.**
UNCHANGED, BY DESIGN. The gate now records exactly what §1.3 promises
(version, text fingerprint, timestamp, per-screen acknowledgments) —
on the user's device, transmitted nowhere. The draft's Notes state
the trade-off honestly: if acceptance were ever challenged, we hold
no copy; the proof sits in a file the user controls. The gate's value
is maximizing real notice (what courts test), backed by the §1.5
fallback. Closing this gap would require architecture Paul has ruled
out (accounts/telemetry) or an optional user-sent receipt email,
which the draft mentions and Paul has not adopted.

**(c) Minors can void.** §1.4 (18+, or a parent/guardian accepts and
takes responsibility) is present and ships on Screen 1. Legal reality,
already recorded in the draft's Notes: a minor's acceptance can be
voided by the minor later no matter what the clause says. The clause
makes the adult-responsibility position explicit; it cannot do more.
No further drafting action available.

**(d) EU/UK consumer law can override California terms.** The draft's
defense is in place and verified in the shipped text: "to the maximum
extent permitted by applicable law" savings phrasing throughout §§4–5,
§5.3's carve-outs, §15.6's surgical severability, and §17.1's
reform-before-sever. For EU/UK consumers, local mandatory law may
still refuse the arbitration clause, the warranty disclaimers, or the
California choice of law. Whether to accept that exposure or
geo-limit distribution is a business decision for Paul + the attorney
(Section E), not a drafting fix.

**(e) $100 liability cap and California carve-outs.** VERIFIED PRESENT
and internally consistent: §5.2 caps aggregate liability at US $100
(stated as part of the bargain for free software); §5.3 carves out
liability that cannot lawfully be limited (fraud, willful misconduct,
California Civil Code §1668). Both ship on gate Screen 4, and §5.1's
excluded-damages list is in the standard enforceable form per the
draft's changelog research. Whether $100 is the right number for a
free product is on the attorney agenda (Section E).

## D. Internal-consistency findings (this audit)

**Fixed, clearly marked in the draft (documentation sections only):**
1. The changelog's Annex A paragraph called the opt-out "Paul's
   undecided question… kept OUT of the main text" — stale since his
   Nov 4 decision adopted it as §15.7. Marked correction appended.
2. The Notes' [CONTACT] enumeration omitted §15.7. Marked correction
   appended with the exact count.

**Flagged for Paul / the attorney — NOT changed by the audit:**
3. **No version identifier inside the operative text.** §12 says the
   Terms "carry a version identifier," but the identifier ("v2") lives
   only in the draft's header, the app's `TERMS_VERSION` constant, and
   the acceptance record — not in the Terms text a user reads.
   Recommend adding a "Version 2 — effective [date]" line to the
   operative text when Paul approves it.
4. **§13.3 vs §15.7 survival lists differ.** Termination survival is
   §§3–9, 14, 15–17; after an opt-out, §15.7 says §§3–6 and 14
   "continue to apply to your past use." These govern different events
   and §5's cap sits inside §§3–6 either way, but the interplay (e.g.
   §15.6/§16 references after opt-out) deserves one attorney pass.
5. **§§7–9 describe features not yet built.** The logo tools (§§7–8)
   are Phase 7–8 and the third-party integrations (§9) are Phase 5–6.
   If a release ships first, those sections describe absent features —
   inert, but the attorney may prefer "when available" framing.
6. **Our own research doc overstated the gate.** The Nov 5 morning
   gap analysis listed "the terms gate" among WovenCut's existing
   features; it was spec-only until this session. Corrected in that
   doc's pass-2 audit addendum.

## E. For the attorney hour — before any public release

1. **§15.7's opt-out-lock**: conditioning the opt-out on losing the
   (free) software is an untested shape; *Suarez v. Uber*'s opt-out
   was penalty-free. Is Paul's all-or-nothing framing defensible as
   drafted, and does the conspicuous Screen-10 presentation carry it?
2. **§15 as a whole** under *Armendariz* bilaterality and the *McGill*
   public-injunctive-relief rule (carve-outs are drafted in — confirm
   they suffice), plus the §15.4 fee cap and §15.1's 45-day step.
3. **The $100 cap** (§5.2) and §5.3's carve-outs for a free consumer
   product, incl. UCC §2-719(3) personal-injury sensitivity.
4. **§1.5's fallback** (use-as-acceptance) — how much weight can it
   bear if the gate record is the only proof (gap b)?
5. **E-SIGN/UETA adequacy** of the acceptance record's contents.
6. **EU/UK exposure**: accept, geo-limit, or adjust — and whether the
   savings phrasing is enough either way (gap d).
7. **License interplay** once Paul picks MIT vs GPL (§2.2's
   License-controls clause against GPL's no-added-restrictions rule).
8. **Beta labeling sufficiency** (§3's paragraph + the labeled
   surfaces in Section A) for distributing unfinished software.
9. **Installer equivalence**: the NSIS license page presents the same
   text/version as the in-app gate (spec §5) — confirm the two-gate
   design is sound once a build exists to check.

## F. Verification evidence (this session)

- Node suite (`tests/node-tests.mjs`): 11 screens; Screen 10 = §15
  alone incl. the §15.7 lock sentence; [CONTACT] still a placeholder;
  fingerprint stability; acceptance round-trip and change detection.
- Headless-Chromium walk of the real UI: all 11 screens by mouse
  wheel; scroll-unlock on every screen; Agree gating; acceptance
  record contents; reload persistence; tamper re-trigger; Decline →
  closed screen; reading-copy view mode; About + QR.
- Screenshots: `~/workspace/your_files/wovencut-pass2-terms-gate.png`,
  `wovencut-pass2-terms-arbitration.png`,
  `wovencut-pass2-about.png`.
- Commits: `62845e1` (gate + About build). The Electron quit-on-decline
  path and the NSIS license page are code/config-reviewed only — like
  everything packaged, they get their first real run at the first
  Windows build (the standing Phase 1 gate).
