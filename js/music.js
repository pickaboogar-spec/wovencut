// WovenCut (working title) — music track (Phase 3 wires playback)
// ---------------------------------------------------------------------------
// The project model stores music as a FILE REFERENCE ONLY:
//   project.music = { src: "user-chosen file path", volume: 0.8 }
// WovenCut never bundles, uploads, or proxies audio. Phase 1 desktop: the
// reference can be set (drop an audio file on the timeline, or the
// 🎵 Add Music button) and its volume edited in the inspector. Playback
// synced with the preview is Phase 3.
//
// OPEN QUESTION for Paul's Phase 3 review gate: may the music bed fade IN
// under the first still? Default is NO — the first-frame rule is about the
// picture opening at full strength, and the conservative reading extends it
// to the whole open. Fade-OUT at the end is unrestricted.
// TODO(Phase 3): file picker, sync playback, trim points, volume control.

export function describeMusic(project) {
  const m = project.music;
  return m && m.src
    ? `${m.src} at ${Math.round(m.volume * 100)}% volume`
    : "No music file chosen yet.";
}

export function mountMusicPanel(project, container) {
  container.innerHTML =
    `<p class="stub-note">${describeMusic(project)} ` +
    `Set it by dropping an audio file on the timeline or with the ` +
    `🎵 Add Music button; playback sync arrives in Phase 3.</p>`;
}
