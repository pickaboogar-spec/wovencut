// WovenCut — a truly free video editor.
// Copyright (C) 2026 Paul Blanchard (Damonini) and Pepper —
// Damonini and Pepper Software Development.
// This program is free software under the GNU General Public License
// v3.0; see the LICENSE file at the project root.
// WovenCut — About + Donate (built in the pro pass 2 legal audit,
// 2026-11-05, to Paul's Nov 4, 2026 spec in FEATURE-REQUESTS-2026-11-04.md).
// ---------------------------------------------------------------------------
// Paul's design, not negotiable: About sits at the right of the menu bar;
// the Donate section inside it is QUIET and strictly voluntary — a
// suggested $1 or $2, labelled as a suggestion; donating never unlocks,
// nags, or gates anything. Donations go through a PayPal.me link so
// Paul's email address is never published anywhere. The QR image
// (assets/donate-paypal-qr.png) decodes to the same PayPal.me link.
//
// Copy note: the maker-story wording here is plain and factual; the
// final About copy is Paul's to approve (checklist doc, LEGAL workstream).

export const APP_VERSION = "0.2.0"; // mirrors package.json "version"
export const DONATE_URL = "https://paypal.me/PaulDBlanchard";
export const PUBLISHER = "Damonini and Pepper Software Development";
export const COPYRIGHT_LINE =
  "Copyright (C) 2026 Paul Blanchard (Damonini) and Pepper — " +
  "Damonini and Pepper Software Development.";

export function aboutHtml() {
  return `
<p><strong>WovenCut</strong> is a truly free video editor for people who
can't afford the professional tools — no watermark, no upsells, no
account, no telemetry. Your files never leave this computer.</p>
<p>Made by <strong>${PUBLISHER}</strong>.<br>
Web development by Paul Blanchard (Damonini), San Diego, California —
directed by Paul, built with Pepper. WovenCut is an experiment in
building real software by conversation: a person who knows what
creators need, and an AI that does the typing.</p>
<p class="about-note">${COPYRIGHT_LINE}<br>
Licensed under the <strong>GNU General Public License v3</strong> —
free to use and share; the credits stay with the work. The full
license text ships with the program (the LICENSE file).</p>
<p><strong>Beta:</strong> this is a beta test version (${APP_VERSION}).
It may contain defects and it may lose or corrupt project files — keep
backup copies of anything you make with it.</p>
<hr>
<h3>💝 Donate — only if you'd like to</h3>
<p>If WovenCut helped you and you can spare it, a donation of
<strong>$1 or $2</strong> helps Paul keep making free software for
people who can't afford the commercial kind. It's a
<strong>suggestion, never a requirement</strong> — the software is
exactly as free if you never donate a cent.</p>
<p>
  <button type="button" class="tool-btn primary" id="about-donate-btn"
    title="Open Paul's PayPal donation page in your browser — suggested $1 or $2, any amount or none">
    💝 Donate via PayPal</button>
</p>
<p>Or scan this code with your phone to open the same page:</p>
<p><img class="about-qr" src="assets/donate-paypal-qr.png"
     alt="QR code that opens the PayPal donation page"></p>
<p class="about-note">The donation page shows the name "Damonini".
Paul's email address is never published — the link is the whole
address anyone needs.</p>`;
}

export function initAbout() {
  const modal = document.getElementById("about-modal");
  const body = document.getElementById("about-body");
  const versionEl = document.getElementById("about-version");
  const openBtn = document.getElementById("btn-about");
  const closeBtn = document.getElementById("about-close");
  if (!modal || !body || !openBtn) return;
  if (versionEl) versionEl.textContent = `Version ${APP_VERSION} — Beta`;
  body.innerHTML = aboutHtml();
  body.querySelector("#about-donate-btn")?.addEventListener("click", () => {
    if (window.wovencut?.openExternal) {
      window.wovencut.openExternal(DONATE_URL);
    } else {
      window.open(DONATE_URL, "_blank", "noopener");
    }
  });
  openBtn.addEventListener("click", () => { modal.hidden = false; });
  closeBtn?.addEventListener("click", () => { modal.hidden = true; });
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.hidden = true;
  });
}
