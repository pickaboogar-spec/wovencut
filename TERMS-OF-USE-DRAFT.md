# WovenCut — Terms of Use (DRAFT for Paul's review)
Status: DRAFT, written Nov 4, 2026 at Paul's direction. Not legal advice; Paul reviews and approves before any release. Pairs with the software license Paul chooses (MIT and GPL both carry their own no-warranty language — the license decision is still Paul's).

## Terms of Use

**1. Free software, as-is.** WovenCut is freeware provided "AS IS", without warranty of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, and non-infringement.

**2. Use at your own risk.** You use this software entirely at your own risk. To the maximum extent permitted by law, the authors and distributors are not liable for any claim, damages, or other liability arising from the use of, or inability to use, this software — including lost files, lost work, or losses connected to videos you create, edit, or publish with it.

**3. Your content is your responsibility.** You are solely responsible for the media you edit and publish. That includes having the rights or permissions for the footage, music, images, and logos you use, and complying with copyright, trademark, privacy, and platform rules that apply to what you publish.

**4. The "Hide a Logo" tool is a convenience, not a guarantee.** The logo-obscuring feature is designed to make logos unrecognizable to the human eye. It is not legal advice and it does not guarantee that any use complies with trademark or copyright law, or that any platform or rights holder will treat a video as non-infringing. Whether and how to obscure content, and whether to publish, is your decision and your responsibility.

**5. The logo-overlay tool and your marks.** If you overlay your own logo or branding, you warrant it is yours to use. Do not use the overlay or tracking tools to imitate another party's branding or to mislead viewers.

**6. Optional third-party services.** Features that connect to third-party services (for example, your own Muse or Replicate accounts) use YOUR accounts and credentials, under those services' own terms, and any costs they charge are yours. WovenCut does not provide those services and is not responsible for them.

**7. No support obligation.** The software is a freeware experiment offered without any promise of updates, fixes, or support. It may change or be discontinued at any time.

**8. Acceptance.** By installing or using WovenCut, you accept these terms. If you do not accept them, do not use the software.

---
Notes for Paul (not part of the terms):
- The standard free-software shield is the pair: (a) license warranty disclaimer + (b) terms like these. Most open-source releases rely mainly on the license; a click-through terms screen in the installer is the belt-and-suspenders version — the workflow should note adding a terms page to the installer/first-run screen.
- One sentence worth keeping verbatim in spirit: blurring is framed as "unrecognizable to the human eye" per Paul's own framing (Nov 4, 2026) — never as a legal guarantee.

## Acceptance gate — Paul's requirement (Nov 4, 2026)
- The app must NOT open until the user has agreed to these terms. Implementation spec for the build:
  1. **First-run gate:** on first launch, the app shows the full Terms of Use in a scrollable window with an enabled-after-scroll "I Agree" button and a "Decline" button. Declining closes the app. The editor UI is unreachable before acceptance.
  2. **Acceptance record:** on agreement, the app writes a small local marker (terms version + date accepted) in its local app data — entirely on the user's machine, nothing transmitted anywhere.
  3. **Re-prompt on change:** if a future update ships a new terms version, the gate appears again before the editor opens.
  4. **Installer layer:** the Windows installer also presents the terms as a license page the user must accept to install — two gates, same text.
  5. **Portable build:** the first-run gate still applies (the gate lives in the app, not only the installer).
