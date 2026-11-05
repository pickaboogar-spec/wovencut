// WovenCut — Terms of Use gate (built in the pro pass 2 legal audit,
// 2026-11-05).
// ---------------------------------------------------------------------------
// Paul's hard requirement (Nov 4, 2026, FEATURE-REQUESTS-2026-11-04.md §3):
// the app cannot open until the user agrees to the Terms; the gate is a
// per-section scrollwrap built to the implementation spec inside
// TERMS-OF-USE-DRAFT.md — each screen scrolled to its end before its
// checkbox unlocks, §15 (arbitration) alone on Screen 10, the final
// "I Agree" disabled until every screen is checked, Decline always
// available and closing the app, and a full re-run whenever the Terms
// version OR the exact text changes.
//
// The screen bodies below are transcribed from the operative text of
// TERMS-OF-USE-DRAFT.md (Terms v2, DRAFT — still awaiting Paul's final
// approval and the pre-release attorney hour; see
// docs/LEGAL-FRAMEWORK-CHECKLIST-2026-11-05.md). The acceptance record
// (§1.3) is stored ONLY on the user's own device: version, a fingerprint
// of the exact text accepted, date/time, and the per-screen
// acknowledgment set. Nothing is transmitted — WovenCut has no accounts
// and no telemetry.
//
// The §15.7 opt-out "lock" is LEGAL, not technical (Annex A of the
// draft): opting out by notice to wc-support@damonini.com terminates the permission
// to use the app. This module deliberately contains no remote kill
// switch — building one would require the check-ins Paul ruled out.

export const TERMS_VERSION = "v2";
export const ACCEPTANCE_KEY = "wovencut.terms-acceptance.v1";

// Each screen: the title shown to the user (from the draft's Screen Map)
// and the body HTML transcribed from the operative Terms text.
export const TERMS_SCREENS = [
  {
    title: "How this agreement works",
    body: `
<p>These Terms of Use (the "Terms") are a binding agreement between you and the authors and distributors of WovenCut (together, "we," "us," or the "Authors"). By completing the acceptance process described in §1 — and only that way — you agree to these Terms. If you do not agree, do not install or use WovenCut, and choose "Decline" when the Terms are presented.</p>
<h4>1. Agreement and acceptance</h4>
<p><strong>1.1 How this agreement is formed.</strong> Before WovenCut's editor can be opened for the first time, the software presents these Terms on a series of screens. Each screen must be scrolled to its end and its checkbox affirmatively checked before you may continue, and the final "I Agree" control stays disabled until every screen has been acknowledged. Clicking "I Agree" is your electronic signature and your unambiguous manifestation of assent to these Terms.</p>
<p><strong>1.2 Electronic records consent.</strong> You consent to enter into this agreement electronically and to receive and keep these Terms in electronic form, as permitted by the federal E-SIGN Act (15 U.S.C. § 7001) and applicable state electronic-transactions laws (UETA). You may view or print the full text of these Terms at any time from within the software and in the project repository.</p>
<p><strong>1.3 Acceptance record.</strong> When you accept, the software stores a record on your own device containing the version of the Terms accepted, a fingerprint (hash) of the exact text, the date and time of acceptance, and confirmation that each section screen was scrolled and checked. Nothing in that record is transmitted to us; we operate no accounts and collect no telemetry.</p>
<p><strong>1.4 Eligibility.</strong> You must be at least 18 years old, or the age of legal majority where you live, or a parent or legal guardian must complete the acceptance on your behalf and accept responsibility for your use.</p>
<p><strong>1.5 Fallback.</strong> The acceptance process is the only authorized way to agree to these Terms. If you somehow access or use the software without completing it, you agree that your use constitutes acceptance of these Terms to the fullest extent permitted by law.</p>
<h4>2. The software and its license</h4>
<p><strong>2.1 License grant.</strong> Subject to these Terms and to the open-source license that accompanies the software (the "License"), we grant you a personal, non-exclusive license to install and use WovenCut for lawful purposes.</p>
<p><strong>2.2 The License controls the code.</strong> WovenCut's source code is distributed under its open-source License. Nothing in these Terms limits, conditions, or removes any right the License grants you in the code. If anything in these Terms conflicts with the License as it applies to the code, the License controls. These Terms govern your use of the distributed application, its name and branding, and the features described in §§7–9.</p>
<p><strong>2.3 Ownership.</strong> The software and its branding remain the property of the Authors and their licensors. These Terms transfer no ownership to you.</p>`,
  },
  {
    title: "This software is free — what that means",
    body: `
<h4>3. Free software — what "free" means</h4>
<p>WovenCut is provided <strong>free of charge</strong>, as a community resource for people who cannot afford commercial editing software. You pay nothing for it, and we receive nothing from your use of it. That fact is part of the bargain reflected in §§4–6: because the software is free and provided as-is, the risk of using it rests with you, as set out below to the maximum extent the law allows.</p>
<p><strong>Beta status.</strong> The first public releases of WovenCut are <strong>beta test versions</strong>, and they are labeled as such in the software, its installer, its About screen, and its release pages. Beta software is unfinished by definition: it may contain defects, lose or corrupt project files, or change without notice. By using a beta version you acknowledge its beta status and accept the additional risk that comes with testing unfinished software. Keep backup copies of anything you make with it.</p>`,
  },
  {
    title: "No warranties",
    body: `
<h4>4. Disclaimer of warranties</h4>
<p>THE SOFTWARE IS PROVIDED "AS IS" AND "AS AVAILABLE," WITH ALL FAULTS AND WITHOUT WARRANTY OF ANY KIND. TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE AUTHORS EXPRESSLY DISCLAIM ALL WARRANTIES AND CONDITIONS, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING ANY IMPLIED WARRANTY OF MERCHANTABILITY, ANY IMPLIED WARRANTY OF FITNESS FOR A PARTICULAR PURPOSE, ANY WARRANTY OF TITLE OR NON-INFRINGEMENT, AND ANY WARRANTY ARISING FROM COURSE OF DEALING OR USAGE OF TRADE. THE AUTHORS DO NOT WARRANT THAT THE SOFTWARE WILL BE ERROR-FREE, UNINTERRUPTED, SECURE, OR COMPATIBLE WITH YOUR SYSTEM; THAT IT WILL NOT LOSE, CORRUPT, OR FAIL TO SAVE YOUR FILES OR PROJECTS; OR THAT ANY OUTPUT IT PRODUCES WILL BE ACCEPTED BY ANY PLATFORM. SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OF IMPLIED WARRANTIES, SO SOME OF THE ABOVE DISCLAIMERS MAY NOT APPLY TO YOU; IN THAT CASE OUR DISCLAIMERS APPLY TO THE FULLEST EXTENT PERMITTED.</p>`,
  },
  {
    title: "Limits on our liability",
    body: `
<h4>5. Limitation of liability</h4>
<p><strong>5.1 Excluded damages.</strong> TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT WILL THE AUTHORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR FOR ANY LOSS OF PROFITS, REVENUE, GOODWILL, DATA, FILES, OR CONTENT, ARISING OUT OF OR RELATING TO THE SOFTWARE OR THESE TERMS, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</p>
<p><strong>5.2 Cap.</strong> TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE AUTHORS' TOTAL AGGREGATE LIABILITY ARISING OUT OF OR RELATING TO THE SOFTWARE OR THESE TERMS WILL NOT EXCEED ONE HUNDRED U.S. DOLLARS (US $100). THE SOFTWARE IS FREE; THIS CAP IS PART OF THE BARGAIN.</p>
<p><strong>5.3 Carve-outs.</strong> Nothing in these Terms limits or excludes liability that cannot lawfully be limited or excluded, including liability for fraud or willful misconduct, or liability that California Civil Code § 1668 or any similar law makes non-waivable. If any part of this §5 is held unenforceable, it applies to the fullest enforceable extent and the remainder continues in effect.</p>`,
  },
  {
    title: "Your content, your responsibility",
    body: `
<h4>6. Your content is your responsibility</h4>
<p><strong>6.1</strong> You are solely responsible for the media you import, edit, and publish with WovenCut, and for the consequences of publishing it.</p>
<p><strong>6.2</strong> You represent that you own, or have all rights and permissions needed for, the footage, music, images, voices, likenesses, and logos you use, and that your use complies with copyright, trademark, privacy, publicity, and any other applicable law, and with the rules of any platform you publish to.</p>
<p><strong>6.3</strong> You agree not to use WovenCut to infringe anyone's rights, to violate any law, or to circumvent technological measures that control access to or copying of protected works.</p>
<p><strong>6.4</strong> WovenCut is a tool only. We do not host, review, monitor, or endorse your content, and we have no duty to police what you create with it.</p>`,
  },
  {
    title: "About the editing tools",
    body: `
<h4>7. The "Hide a Logo" tool — a convenience, not a guarantee</h4>
<p><strong>7.1</strong> The logo-obscuring feature is designed to make logos unrecognizable to the human eye. It is a creative and practical convenience only.</p>
<p><strong>7.2</strong> It is not legal advice, and it does not guarantee that any video complies with trademark, copyright, or platform rules, that obscuring any particular logo is sufficient or necessary, or that any platform or rights holder will treat an obscured video as non-infringing.</p>
<p><strong>7.3</strong> Whether and how to obscure content, and whether to publish, is your decision and your responsibility.</p>
<h4>8. The logo-overlay tool and your marks</h4>
<p>If you overlay your own logo or branding, you warrant that it is yours to use. You agree not to use the overlay or tracking tools to imitate another party's branding, to pass off your work as another's, or to mislead viewers.</p>`,
  },
  {
    title: "Optional outside services (your own accounts)",
    body: `
<h4>9. Optional third-party services</h4>
<p><strong>9.1</strong> Some features can connect to third-party services (for example, your own Muse or Replicate accounts). Those features work only with accounts you create and control.</p>
<p><strong>9.2</strong> Your credentials stay yours: you enter them, they are used only to make the requests you direct, and your relationship with each provider is governed by that provider's own terms and privacy policy. Any charges those providers impose are yours alone.</p>
<p><strong>9.3</strong> We do not provide, operate, or control those services, are not affiliated with or endorsed by their providers, and are not responsible for their availability, output, pricing, or conduct. References to third-party names are for identification only; all trademarks belong to their owners.</p>`,
  },
  {
    title: "Rules of use; support; changes",
    body: `
<h4>10. Acceptable use; export compliance</h4>
<p><strong>10.1</strong> You agree to use WovenCut only for lawful purposes and in compliance with all applicable laws.</p>
<p><strong>10.2</strong> You agree to comply with U.S. export-control and sanctions laws, and not to use, export, or re-export the software in violation of them, including to any sanctioned country or to any person on a U.S. government restricted-party list.</p>
<h4>11. No support; changes to the software</h4>
<p>WovenCut is a freeware experiment offered without any promise of updates, bug fixes, features, or support. We may change, suspend, or discontinue it at any time, with or without notice, and we have no obligation to maintain compatibility with any project file, format, or third-party service.</p>
<h4>12. Changes to these Terms</h4>
<p>These Terms carry a version identifier. If a future version of the software ships with updated Terms, the acceptance process in §1 will run again in full — every screen scrolled and checked — before the updated software may be used. The version you accepted is identified in your acceptance record, and earlier versions remain available in the project repository.</p>
<h4>13. Termination</h4>
<p><strong>13.1</strong> You may terminate this agreement at any time by ceasing to use the software and deleting your copies, subject to your rights under the License in the source code itself.</p>
<p><strong>13.2</strong> If you breach these Terms, your permission to use the distributed application ends automatically; you must stop using it and delete your copies.</p>
<p><strong>13.3</strong> §§3–9, 14, and 15–17 survive termination.</p>`,
  },
  {
    title: "If your use causes a claim against us",
    body: `
<h4>14. Indemnification</h4>
<p>To the maximum extent permitted by law, you agree to indemnify, defend, and hold harmless the Authors and distributors from and against any third-party claims, damages, losses, and reasonable legal expenses arising out of or relating to (a) your use of the software, (b) content you create or publish with it, or (c) your violation of these Terms or of any law or third-party right.</p>`,
  },
  {
    // Screen 10 — §15 ALONE, per Paul's direction and the draft's Screen
    // Map: arbitration is never buried inside a longer scroll.
    title: "How disputes are resolved — arbitration (please read carefully)",
    body: `
<h4>15. Dispute resolution — binding arbitration; class and jury waivers</h4>
<p><strong>Please read this section carefully. It affects your rights. It is presented on its own screen during acceptance, separately from every other section.</strong></p>
<p><strong>15.1 Informal resolution first.</strong> Before starting any arbitration or court proceeding, you and we agree to try to resolve the dispute informally: the complaining party will send a written notice describing the dispute and the relief sought to the other party (for us, to wc-support@damonini.com), and the parties will attempt in good faith to resolve it within 45 days. If they cannot, either party may proceed under §15.2.</p>
<p><strong>15.2 Binding individual arbitration.</strong> Any dispute, claim, or controversy arising out of or relating to the software or these Terms that is not resolved under §15.1 will be resolved exclusively by binding arbitration on an individual basis, administered by the American Arbitration Association (AAA) under its Consumer Arbitration Rules, rather than in court. The arbitration will take place in San Diego County, California, unless the arbitrator orders a documents-only, telephone, or video hearing. The arbitrator's award is final and binding, and judgment on it may be entered in any court of competent jurisdiction. This §15 is governed by the Federal Arbitration Act.</p>
<p><strong>15.3 Waivers.</strong> YOU AND WE EACH WAIVE ANY RIGHT TO A JURY TRIAL, AND ANY RIGHT TO PARTICIPATE IN A CLASS ACTION, CLASS ARBITRATION, COLLECTIVE ACTION, OR REPRESENTATIVE PROCEEDING (INCLUDING AS A PRIVATE ATTORNEY GENERAL), TO THE FULLEST EXTENT PERMITTED BY LAW. CLAIMS MAY BE BROUGHT ONLY IN YOUR OR OUR INDIVIDUAL CAPACITY.</p>
<p><strong>15.4 Fees.</strong> Each side bears its own attorneys' fees unless the arbitrator orders otherwise. If the filing or administrative fees of arbitration would exceed the filing fee for bringing the same claim in court, we will pay the difference.</p>
<p><strong>15.5 Exceptions.</strong> Either party may bring an individual claim in small claims court if it qualifies. Nothing in this §15 prevents either party from seeking injunctive or other provisional relief from a court for misuse of intellectual property, and nothing in this §15 waives any right to seek public injunctive relief that cannot lawfully be waived; a claim for such relief, if any, will be decided by a court and stayed pending arbitration of the individual claims to the extent required by law.</p>
<p><strong>15.6 Severability of this section.</strong> If any part of this §15 is held unenforceable, the rest of §15 remains in effect, except that if the class-action waiver in §15.3 is held unenforceable as to a claim, that claim — and only that claim — will proceed in court under §16.</p>
<p><strong>15.7 Opting out of arbitration — and what it means.</strong> You may opt out of this §15 (arbitration and the waivers in §15.3) by sending written notice to wc-support@damonini.com within 30 days of the date you first accepted the version of these Terms that contains this §15.7. Your notice must state your name and that you opt out of arbitration. <strong>Read this part carefully before you decide: the license in §2.1 is granted only under these Terms as a whole, including this §15. If you opt out, your permission to use the distributed WovenCut application ends — the software will not run for you, and you must stop using it and delete your copies.</strong> Opting out does not affect your rights, if any, in the source code under its open-source License (§2.2), and §§3–6 and 14 continue to apply to your past use. If you opt out and we later resolve a dispute with you, it will be resolved in court under §16. We state this consequence openly, here, before you accept — not in fine print — because the bargain is all-or-nothing: the software is free, and these Terms are its only price.</p>`,
  },
  {
    title: "Final agreement",
    body: `
<h4>16. Governing law and venue</h4>
<p>These Terms are governed by the laws of the State of California, without regard to its conflict-of-law rules. For any dispute not subject to arbitration under §15, the state and federal courts located in San Diego County, California are the exclusive venue, and you consent to their personal jurisdiction.</p>
<h4>17. General provisions</h4>
<p><strong>17.1 Severability with reformation.</strong> If any provision of these Terms is held unenforceable, it will be reformed to the minimum extent necessary to make it enforceable, or, if that is not possible, severed, and the remaining provisions will continue in full effect.</p>
<p><strong>17.2 Entire agreement.</strong> These Terms, together with the License, are the entire agreement between you and us regarding the distributed application, and supersede any earlier or contemporaneous understandings about it.</p>
<p><strong>17.3 No waiver.</strong> Our failure to enforce any provision is not a waiver of it or of any other provision.</p>
<p><strong>17.4 Assignment.</strong> You may not assign these Terms or your rights under them. We may assign them in connection with a transfer of the project.</p>
<p><strong>17.5 Headings.</strong> Headings are for readability only and do not affect interpretation.</p>
<p><strong>17.6 Notices.</strong> Notices to us under these Terms must be sent to wc-support@damonini.com. We may give you notice through the software, the project repository, or release notes.</p>
<p><strong>17.7 No third-party beneficiaries.</strong> Except as stated in §§5 and 14, there are no third-party beneficiaries of these Terms.</p>`,
  },
];

// The final screen's checkbox carries this longer label (Screen Map).
export const FINAL_CHECKBOX_LABEL =
  "I have read every section above, each of my checkboxes is checked, and I agree to these Terms";
export const SCREEN_CHECKBOX_LABEL = "I have read and understand this section";

// --- Acceptance record (§1.3) -------------------------------------------------
// Storage-agnostic: pass anything with getItem/setItem/removeItem
// (window.localStorage in the app; a fake in the node tests).

// FNV-1a fingerprint of the exact text being accepted — any wording
// change anywhere in the screens changes the fingerprint, which is what
// makes "changed terms re-trigger the gate" work even if the version
// string were forgotten.
export function fingerprintText(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

export function termsFingerprint() {
  return fingerprintText(
    TERMS_VERSION + "\n" + TERMS_SCREENS.map((s) => s.title + "\n" + s.body).join("\n===\n")
  );
}

export function readAcceptance(storage) {
  try {
    const raw = storage.getItem(ACCEPTANCE_KEY);
    if (!raw) return null;
    const rec = JSON.parse(raw);
    if (!rec || typeof rec !== "object") return null;
    return rec;
  } catch {
    return null;
  }
}

// Current = same version AND same text fingerprint AND every screen
// acknowledged. Anything else re-runs the full gate (§12).
export function isAcceptanceCurrent(storage) {
  const rec = readAcceptance(storage);
  if (!rec) return false;
  if (rec.version !== TERMS_VERSION) return false;
  if (rec.hash !== termsFingerprint()) return false;
  if (!Array.isArray(rec.screens) || rec.screens.length !== TERMS_SCREENS.length) return false;
  return rec.screens.every(Boolean);
}

export function recordAcceptance(storage, screens, when = new Date()) {
  const rec = {
    version: TERMS_VERSION,
    hash: termsFingerprint(),
    acceptedAt: when.toISOString(),
    screens: screens.slice(),
  };
  storage.setItem(ACCEPTANCE_KEY, JSON.stringify(rec));
  return rec;
}

// --- Gate controller (DOM) ------------------------------------------------------
// Wires the overlay markup in index.html to the record logic above.
// Returns { isBlocking, openView } so app.js can (a) swallow editor
// keyboard shortcuts while the gate is up, and (b) open the reading
// copy from the "📜 Terms of Use" button (§1.2: the full text is
// viewable from within the software at any time).

export function initTermsGate() {
  const gate = document.getElementById("terms-gate");
  const closed = document.getElementById("terms-closed");
  const stepEl = document.getElementById("terms-step");
  const titleEl = document.getElementById("terms-screen-title");
  const bodyEl = document.getElementById("terms-body");
  const checkRow = document.getElementById("terms-check-row");
  const checkbox = document.getElementById("terms-checkbox");
  const checkLabel = document.getElementById("terms-checkbox-label");
  const hintEl = document.getElementById("terms-scroll-hint");
  const btnDecline = document.getElementById("terms-decline");
  const btnBack = document.getElementById("terms-back");
  const btnNext = document.getElementById("terms-next");
  const btnAgree = document.getElementById("terms-agree");
  const btnClose = document.getElementById("terms-close");
  if (!gate || !bodyEl || !checkbox) return { isBlocking: () => false, openView: () => {} };

  const N = TERMS_SCREENS.length;
  let mode = null; // "accept" | "view" | null (gate hidden)
  let idx = 0;
  let lastIdx = -1;
  let checked = new Array(N).fill(false);
  let unlocked = new Array(N).fill(false);

  function atBottom() {
    return bodyEl.scrollTop + bodyEl.clientHeight >= bodyEl.scrollHeight - 4;
  }

  function measureUnlock() {
    if (mode !== "accept") return;
    if (atBottom()) unlocked[idx] = true;
  }

  function render() {
    const screen = TERMS_SCREENS[idx];
    const keepScroll = idx === lastIdx;
    const prevScroll = bodyEl.scrollTop;
    stepEl.textContent =
      `Screen ${idx + 1} of ${N}` +
      (mode === "view" ? " — reading copy (you already agreed to these Terms)" : "");
    titleEl.textContent = screen.title;
    let html = screen.body;
    if (idx === N - 1) {
      const recap = TERMS_SCREENS.slice(0, N - 1)
        .map((s, i) => {
          const done = mode === "view" ? true : checked[i];
          return `<li>${done ? "✅" : "⬜"} Screen ${i + 1} — ${s.title}</li>`;
        })
        .join("");
      html = `<h4>Recap — every screen, in order</h4><ul class="terms-recap">${recap}</ul>` + html;
    }
    bodyEl.innerHTML = html;
    // Same-screen re-renders (a checkbox tick, an unlock flip) keep the
    // reader's place; only a screen CHANGE starts at the top.
    bodyEl.scrollTop = keepScroll ? prevScroll : 0;
    lastIdx = idx;
    // A screen whose text fits without scrolling is already "at the end".
    unlocked[idx] = unlocked[idx] || bodyEl.scrollHeight <= bodyEl.clientHeight + 4;
    // Layout may settle a frame after innerHTML swaps (a taller screen
    // replacing a shorter one) — re-measure then, so a scroll-to-bottom
    // that landed during layout still registers.
    requestAnimationFrame(() => {
      if (mode !== "accept" || gate.hidden) return;
      const was = unlocked[idx];
      measureUnlock();
      if (unlocked[idx] !== was) syncControls();
    });
    syncControls();
  }

  // Control states only — no innerHTML rewrite. Scroll/checkbox events
  // use this so the reader's place and the DOM survive an unlock flip.
  function syncControls() {
    const accepting = mode === "accept";
    checkRow.hidden = !accepting;
    checkbox.checked = checked[idx];
    checkbox.disabled = !unlocked[idx];
    checkLabel.textContent = idx === N - 1 ? FINAL_CHECKBOX_LABEL : SCREEN_CHECKBOX_LABEL;
    hintEl.hidden = !accepting || unlocked[idx];
    hintEl.textContent = "📜 Scroll to the bottom of this screen to unlock its checkbox.";

    btnBack.disabled = idx === 0;
    btnNext.hidden = idx === N - 1;
    btnNext.disabled = accepting && !checked[idx];
    btnNext.textContent = idx === N - 2 ? "Next — Final Screen ➡️" : "Next ➡️";
    btnAgree.hidden = !(accepting && idx === N - 1);
    btnAgree.disabled = !checked.every(Boolean);
    btnClose.hidden = mode !== "view";
    btnDecline.hidden = !accepting;
  }

  function show(nextMode) {
    mode = nextMode;
    idx = 0;
    lastIdx = -1;
    checked = new Array(N).fill(false);
    unlocked = new Array(N).fill(mode === "view");
    gate.hidden = false;
    render();
  }

  bodyEl.addEventListener("scroll", () => {
    const was = unlocked[idx];
    measureUnlock();
    if (unlocked[idx] !== was) syncControls();
  });
  window.addEventListener("resize", () => {
    if (mode === "accept" && !gate.hidden) {
      const was = unlocked[idx];
      unlocked[idx] = unlocked[idx] || bodyEl.scrollHeight <= bodyEl.clientHeight + 4 || atBottom();
      if (unlocked[idx] !== was) syncControls();
    }
  });
  checkbox.addEventListener("change", () => {
    checked[idx] = checkbox.checked;
    syncControls();
  });
  btnNext.addEventListener("click", () => {
    if (idx < N - 1) { idx++; render(); }
  });
  btnBack.addEventListener("click", () => {
    if (idx > 0) { idx--; render(); }
  });
  btnAgree.addEventListener("click", () => {
    if (!checked.every(Boolean)) return;
    recordAcceptance(window.localStorage, checked);
    mode = null;
    gate.hidden = true;
  });
  btnClose.addEventListener("click", () => {
    mode = null;
    gate.hidden = true;
  });
  btnDecline.addEventListener("click", () => {
    // Declining closes the app (spec §2 of the gate design). In the
    // desktop shell the main process quits; in a plain browser we show
    // the closed screen — there is no editor behind either one.
    mode = null;
    gate.hidden = true;
    if (closed) closed.hidden = false;
    try {
      window.wovencut?.declineTerms?.();
    } catch { /* the closed screen above is the fallback */ }
  });

  // First run, or Terms changed (version or exact text): the full gate
  // runs before the editor can be used (§1.1, §12).
  if (!isAcceptanceCurrent(window.localStorage)) show("accept");

  return {
    isBlocking: () => mode === "accept" && !gate.hidden,
    openView: () => { if (gate.hidden) show("view"); },
  };
}
