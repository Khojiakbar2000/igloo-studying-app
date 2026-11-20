# IGLOO animation playback benchmark

**Status: no native performance winner yet.** Asset and source-code checks are complete, and an isolated four-actor A/B/C lab is available. The lab could not be run in this environment: the REA browser runner failed to start, `xcrun simctl` is unavailable, `adb` is not installed, and no physical phone is connected. Loading time, frame pacing, flicker, CPU, app memory, battery, and long-session behavior are therefore **unknown**, not zero or inferred from file size.


Production animation code and original Synfig art remain unchanged. Work is on `experiment/video-animation`. The pre-existing uncommitted edit in `src/components/StudyTogetherCharacters.tsx` was preserved and inspected.

## Evidence collected

- The Pip typing source is 42 timeline exports at 430×541 and 12 fps, lasting 3.5 seconds. The current renderer uses 16 held cels with the original exposure durations.
- Per character, source PNG cels total **4,309,936 bytes**, the transparent atlas is **2,881,109 bytes**, and H.264 is **499,710 bytes**. For all four Study Together actions, totals are **17,643,633 bytes**, **11,667,249 bytes**, and **2,254,952 bytes**, respectively.
- All **64 cells** in the four atlases were compared to their source cels; each cell is pixel-identical. Alpha is preserved.
- H.264 outputs contain 42 frames each: typing 12 fps/3.5 s, reading 10 fps/4.2 s, writing 12 fps/3.5 s, and headphones 9 fps/4.667 s. They are H.264 Constrained Baseline, level 3.2, yuv420p, 860×1082. The 2× size preserves the source aspect ratio and satisfies H.264 even-dimension requirements.
- Comparing each video’s first frame with its source, scaled and composited over the same pale-blue matte, gives **1.90–1.96 mean absolute RGB difference per channel on a 0–255 scale**. This is a one-frame offline image comparison, not a full-animation or display measurement.
- H.264 has no alpha in this encoding. It uses an opaque `#EAF1F8` matte. It cannot composite naturally over arbitrary room backgrounds without a matching matte or a different alpha-capable format.
- First-to-last source-frame comparison over that matte gives mean absolute RGB differences of **42.48** (typing), **8.65** (reading), **7.04** (writing), and **7.37** (headphones). This indicates source-pose discontinuity, especially for typing; it does not measure a player’s loop flash. A, B, and C preserve the same source loop content, so changing renderers does not repair the authored seam.
- The four-actor lab measures first visible actor and time until all four have rendered. It presents A, B, and C one at a time and pauses playback when the app backgrounds. It uses the existing distinct typing, reading, writing, and headphones art at their individual rates and offsets. The four videos are matte-backed; the lab is for playback load, not room-background compositing.

## Comparison

Labels: **Measured** means an offline asset/image result; **Verified** means confirmed from source or metadata; **Estimated** is arithmetic, not observed device memory; **Unknown** requires playback on a target device.

| Metric | A: PNG frames | B: Transparent atlas | C: H.264 video |
|---|---|---|---|
| Asset size | **Measured:** 4.31 MB per character; 17.64 MB for four | **Measured:** 2.88 MB each; 11.67 MB for four | **Measured:** 0.50 MB for typing; 2.25 MB for four |
| Loading time | **Unknown:** lab timer is ready; not run | **Unknown:** includes atlas preload in timer; not run | **Unknown:** first-presented-frame timer is ready; not run |
| FPS stability | **Verified target:** 9–12 fps source schedules; **Unknown observed FPS** | **Verified target:** same exposures; **Unknown observed FPS** | **Verified file rate:** 9–12 fps; **Unknown presented FPS** |
| Flickering | **Unknown observed.** Source replacement can request a new image each cel. | **Unknown observed.** One image remains mounted and changes transform; alpha and frames are verified. | **Unknown observed.** Native player loop is enabled; no loop playback observed. |
| CPU utilization | **Unknown** | **Unknown** | **Unknown** |
| Memory | **Estimated:** 14.2 MiB of decoded RGBA pixels per 16-cel set; 56.8 MiB for four. Current web loader can retain 96 animation images (including scarf variants): about 85.2 MiB decoded-pixel estimate. Native cache residency is **Unknown**. | **Estimated:** 14.2 MiB decoded per 1720×2164 atlas; 56.8 MiB for four. Actual GPU/OS residency **Unknown**. | **Estimated only:** a 860×1082 RGBA output surface is 3.6 MiB per video, about 14.2 MiB for four before decoder buffers/surfaces. Actual decoder memory **Unknown**. |
| Transparency | **Verified:** PNG alpha | **Verified:** alpha preserved; 64/64 cells exact | **Verified:** not preserved; matte is baked in |
| Loop quality | **Verified source order/timing.** Source seam difference measured above; player transition **Unknown**. | **Verified:** same source sequence as A; player transition **Unknown**. | **Verified:** 42 ordered frames and looping configured; inherits source seam. Decoder gap/flash **Unknown**. |
| Four-character performance | **Verified code:** current Study Together already runs four image actors. Actual performance **Unknown**. | Four-actor lab is implemented; actual performance **Unknown**. Texture dimensions are 1720×2164; support on devices limited to a 2048 max texture is **Unknown**. | Four local videos and lab mode are implemented; actual performance **Unknown**. Simultaneous hardware decoder availability is **Unknown**. |
| Battery efficiency | **Unknown** | **Unknown** | **Unknown** |
| Customization | **Verified:** existing frame sets support teal/berry/lilac scarf frames and accessory overlays. Best-supported option today. | Alpha enables overlays; each baked-in outfit/scarf needs a corresponding atlas unless separated into layers. | Scarf is baked into the video; alternate outfits need alternate encodes or extra overlay work. Opaque matte limits room placement. |

The decoded-pixel figures are upper-bound-style arithmetic (`width × height × 4`), not process memory measurements. GPU formats, cache eviction, video decoder reference frames, and duplicate native surfaces change real memory use. The atlas reduces compressed file bytes but not the amount of uncompressed pixel data it contains.

## Flicker investigation

### Confirmed from code

- `StudyActivity` advances local React state with `setFrame`; that rerenders that actor and changes the `Image` source. The four actors target about **15.36 cel changes per second combined** (15 transitions per 42 exposure ticks at 12, 10, 12, and 9 fps). The parent scene does not rerender for every cel.
- Actors have stable keys and are wrapped in `memo`. The image is not keyed by frame, so React does not intentionally remount the actor component on every frame. Navigation away from the Friends screen does unmount the scene and its timers; changing a room does not key/remount the character layer.
- `StudyTogetherCharacters` preloads each actor’s first three cels, starts playback, and then warms remaining cels in batches of four with 32 ms gaps. It also schedules both alternate scarf sets. The web path calls `HTMLImage.decode` and retains image elements in `decodedFrames`; the native path calls `Image.prefetch`.
- The current worktree’s pre-existing edit makes this loader depend on scarf color and marks frames ready after the first set. Its cleanup sets an `active` flag, but the async batch loop and `preloadCel` do not check that flag. A scarf change or unmount can therefore leave old preload work running; on web, that work can append image elements after `decodedFrames` was cleared. This is a confirmed lifecycle weakness and a plausible contributor to startup/memory contention, not proof that it caused the reported flicker.
- The frame timer schedules the next timeout from the previous callback. Under JS-thread load it can run late and accumulate timing drift; no actual drift was measured.
- The source cels are 430×541; the four atlases are 1720×2164; the room background is 1024×1536 and sofa is 1817×866. Their raw decoded pixel sizes are moderate individually, but preloading many cels plus room layers can raise memory use. Actual device pressure is unknown.

### Suspected, not confirmed

- A delayed uncached decode or GPU texture upload after an `Image` source change could cause a late frame or flash. The code prefetches, but source inspection cannot prove a specific platform reuses the same decoded bitmap/texture for the rendered numeric asset.
- Initial background preloading can compete with animation work, especially if loading is repeated after scarf changes or unmounts.
- Four independent actors, their image transitions, room/sofa layers, environmental effects, and other React Native work may compete for CPU/GPU time. This is not established without a device trace.

### Does B or C fix it?

- **B directly avoids per-cel `Image` source replacement and per-frame React state updates** in the experiment; it updates a Reanimated transform on one retained atlas. It does not reduce decoded atlas pixels and could encounter a GPU max-texture limitation. Flicker reduction remains unverified.
- **C avoids React image changes** and lets the native video stack schedule decoded frames. It trades them for continuous video decode and output surfaces, and its matte prevents natural placement on different room scenes. Whether hardware decode reduces CPU or battery on this iPhone is unknown.
- Neither method has been shown to eliminate the user’s flicker. The loader cancellation weakness is separate and should be addressed only with approval for production changes.

## Native compatibility and product fit

- A and B use bundled PNG assets through React Native `Image`; they work offline and preserve alpha. B uses the already installed Reanimated package. A is the current, known integration; B is an isolated experiment.
- C uses the newly added `expo-video` dependency (Expo SDK 54 compatible in the package manifest) with locally bundled MP4s, mute, looping, no controls, and AppState pause. Expo Video uses native playback on iOS/Android; the encoded H.264 Baseline/yuv420p files are broadly hardware-decodable, but actual hardware path, multi-decoder capacity, battery, and frame timing must be confirmed on the phone.
- Four-video playback requires four active native player instances. That may perform well on a recent phone, but it may also use more decoder buffers or encounter decoder concurrency limits. Smaller files do not answer this.
- The atlas texture is 1720×2164 before device scaling. A device with a 2048 maximum texture dimension may reject it; the target phone’s supported texture size should be checked. Splitting the atlas is possible but should wait for device evidence.
- A and B are easier to customize. C is least compatible with arbitrary room backgrounds and scarf variants. The single-video file is only 0.50 MB, but keeping PNGs alongside it in this experimental branch adds rather than removes bundle assets.

## Recommendations

### Direct answers

1. **Pip’s continuous study loop:** keep A in production for now. B is the strongest candidate to test next because it preserves alpha and exact pixels while avoiding repeated source changes. The available evidence does not establish that B is faster on the iPhone.
2. **Four Study Together penguins:** A remains the lowest-risk production option today because it already runs all four actors. B is the preferred experiment if native measurements show better pacing and the texture limit is supported. Do not pick C for room-integrated characters unless a matching scene background is intentionally acceptable.
3. **Short celebration:** prefer B or A when Pip must overlay different rooms. C is reasonable only for a fixed opaque scene where its matte is not visible.
4. **Customization:** A is best supported today; B can retain alpha but needs outfit-specific atlases or separated accessory layers. C requires pre-encoded outfit variants or compositing work and has no ordinary alpha.
5. **Most likely to reduce image-source flicker:** B is the best architectural hypothesis. It does not prove flicker is solved. C removes image source swaps but introduces a video decoder and matte limitations.
6. **Animation authoring:** keep Synfig. The experiment compares playback formats; it gives no evidence that changing the creation tool improves playback.
7. **Higgsfield video:** no inherent playback advantage over the same Synfig animation encoded to the same codec, size, frame rate, and bitrate. It could change motion/artwork, but that is a content difference, not a decoder advantage.
8. **Fourth option:** avoid adding another runtime. The atlas is already the simpler transparent alternative. Revisit other formats only if B and C both fail measured requirements.

### Provisional rankings (runtime performance is unmeasured)

| Category | Rank | Basis |
|---|---|---|
| Visual quality | A = B > C | B is pixel-identical with alpha. C has small measured color error on first frames, but compression and opaque matte reduce fidelity/composability. |
| Performance potential | B ≈ C > A | **Estimated only:** B avoids React/source changes; C delegates timing to native video; A performs JS/React cel updates. No measured winner. Four-player decoder and atlas memory risks remain. |
| Maintainability today | A > B > C | A already uses the current workflow. B adds deterministic atlas generation and transform code. C adds video assets, Expo Video dependency, and outfit/scene variants. |
| Production suitability today | A > B > C | A is integrated and transparent. B is promising but unverified. C is poor for arbitrary room compositing. |

## Remaining device tests and next steps

1. Use a development iPhone build on `experiment/video-animation`; in the lab, run A, B, C for one Pip, then all four actors. The four-person lab is under **Compare four Study Together penguins**.
2. For each mode, repeat three process launches. Record first actor and all-four-visible time. Note whether the image cache is warm; relaunching the app does not guarantee an OS disk/image cache is cold.
3. Observe 60 seconds per mode and record dropped/stale frames, visible flashes at every loop, and any launch stalls. Test the scarf/customization scene separately for A/B; C’s matte should be evaluated against multiple room backgrounds.
4. On the same iPhone and brightness, run each four-actor mode for 25 minutes. Capture battery level and device temperature before/after. Use Xcode Instruments (Core Animation, Time Profiler, Allocations, Energy Log) to record frame pacing, CPU, and resident memory. Keep the phone foregrounded and use the same room/session.
5. Check `GL_MAX_TEXTURE_SIZE`/Metal texture support for the 1720×2164 atlas on the target device. Repeat on the oldest supported iPhone if that is a release target.
6. Compare the results before approving any production renderer change. Do not infer native iOS behavior from a browser run.

## Environment and checks

- REA controlled-browser startup failed and returned instructions not to retry that startup. Its suggested `rea doctor` command is not installed.
- A Chrome application is present, but the available browser automation surface did not expose a controllable Chrome browser; the web lab could not be opened for playback measurements. No browser performance result is claimed.
- `xcrun simctl` reports that `simctl` is unavailable; `adb` is not installed. No attached physical phone was exposed in this environment.
- `npm run experiment:video` generated all four atlases and MP4s. FFprobe confirmed frame counts, codec, dimensions, frame rates, and durations. Pixel comparison verified all atlas cells. The video/source first-frame comparison is offline image analysis only.
- `npm run typecheck -- --pretty false` reports five diagnostics in untouched files: `PipAccessoryLayer.tsx`, `RiveIglooConstruction.web.tsx` (two), `WindowStormOverlay.tsx`, and `OnboardingFlow.tsx` (duplicate object property). It reports no errors in the experiment components.
- No app build, production screen, original frame, or animation source was changed by this benchmark.

## Reversal

Instantly choose **A · Frames** in the one-character lab. The production renderer was never switched.

For full rollback from this worktree, reverse only the tracked experiment hunks, then remove the experiment assets and screens:

```sh
git apply -R assets/experiments/video-animation/tracked-changes.patch
rm -r -- assets/experiments/video-animation src/experiments/videoAnimation src/components/VideoAnimationExperiment.tsx src/components/FourCharacterAnimationBenchmark.tsx
git status --short
git switch master
```

This preserves the pre-existing uncommitted `src/components/StudyTogetherCharacters.tsx` change. Do not run `git reset`, `git clean`, or delete the experiment branch.
