# Pip study video playback experiment

This directory contains only derivative experiment artifacts. Original Synfig source files and PNG cels remain in `assets/animations/pip-sofa-study/` and are not edited.

Source: `pip-sofa-study/exports/pip-typing_000.png` through `_041.png`, 430×541, 12 fps, 42 timeline ticks (3.5 seconds). A uses the 16 held PNG cels with their original Synfig exposure lengths. B uses a lossless 4×4 sprite sheet made from those same cels; all 16 atlas cells were pixel-compared against their sources (zero differing pixels), and the atlas preserves alpha. C plays all 42 exported timeline frames. All 42 PNG exports total 11,311,648 bytes; the 16 cels used by A total 4,309,936 bytes; the transparent sprite sheet is 2,881,109 bytes. The MP4 is H.264 Constrained Baseline, level 3.2, yuv420p at 860×1082, 12 fps, with a pale blue matte (`#EAF1F8`) because baseline H.264 does not preserve the PNG alpha channel. The character pixels are scaled 2× to meet even-dimension H.264 requirements while maintaining the original 430:541 aspect ratio. A and C use the same matte; B composites transparently over it. This tests playback cost, not transparent video compositing fidelity.

Generate with `npm run experiment:video`. The command uses the repository's installed FFmpeg. The MP4 is not referenced by production screens.

Development comparison: open `/?preview=video-animation` in the web dev app, or tap **Playback lab** in a development app build. The lab contains three mutually exclusive modes: A (original held-PNG sequence), B (preloaded transparent sprite sheet, advanced with Reanimated transforms instead of React frame-state updates), and C (local H.264 video). Only C creates a video player, so frame runs do not also load/decode the MP4. The readout shows time from selecting each mode through the first rendered frame (including B's preload). A **Compare four Study Together penguins** control opens a second isolated benchmark using typing, reading, writing, and headphones assets. Its A mode reproduces the existing first-cels preload and background batch warm-up; B loads four atlases; C runs four muted video players. The control is hidden in production builds.

## Device measurement


No physical phone was connected for this run, so runtime performance, loop flashes, CPU, memory, battery, and heat have not been measured. On the target phone, open the development build and tap **Playback lab**. Switch A, B, C in turn. For each mode, record first-visible latency, any blank frame at loop, and obvious stutter during a 60-second observation. Repeat each mode three times, relaunching the app before a run and noting whether the OS image cache is warm. Then run each mode alone for 25 minutes; record battery change and device temperature if available. Use Xcode Instruments (Core Animation / Allocations) or Android Studio Profiler (CPU / Memory / Energy) for per-mode CPU and memory. Keep other apps and device brightness consistent. The app does not expose reliable cross-platform CPU or GPU counters.

## Rollback

Instant: select **A · Frames** in the comparison screen, or navigate away. Production renderers are unchanged.

Complete (current worktree state): reverse only the experiment's tracked hunks with `git apply -R assets/experiments/video-animation/tracked-changes.patch`, then remove its untracked files with `rm -r -- assets/experiments/video-animation src/experiments/videoAnimation src/components/VideoAnimationExperiment.tsx src/components/FourCharacterAnimationBenchmark.tsx`. The patch contains only this experiment's changes to `App.tsx`, `package.json`, and `package-lock.json`; it leaves the pre-existing uncommitted `src/components/StudyTogetherCharacters.tsx` change untouched. Review `git status --short`. `git apply -R` will stop if those lines have changed since this patch was recorded; preserve any newer edits before resolving it. Do not reset, clean, or delete the branch.
