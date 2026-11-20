# Pip Rive Character Prototype

## Hybrid Study Together continuation (2026-11-15)

This section supersedes earlier statements that the Rive character had no seated pose. The original 430×541 Synfig typing cel `pip-typing_000.png` is now the exact source image in `pip-seated-rig-aligned.riv`. A side-by-side comparison is saved as `pip-seated-frame-comparison.png`; the measured pixel difference is about 0.535% at the comparison dimensions, mainly edge/rendering differences. The full four-actor scene composition is in `pip-hybrid-sofa-scene.png`.

The development-only preview is wired at `?preview=hybrid-study-together` behind `__DEV__`. It includes Original Synfig, Hybrid tap mode, Rive seated pose, Rive happy motion, Return to Synfig, and 200/400 ms transition controls. Hybrid mode waits until the typing sequence returns to frame 0, freezes that frame, fades in the preloaded Rive view, triggers the `happy` input, then fades back and resumes Synfig. The other three Synfig actors continue. Rive is paused while Synfig is active; both renderers pause when the app is inactive.

The Rive WASM state-machine simulation confirmed `idle → happy → idle` after firing the `happy` trigger. `riv_lint` reports 0 errors, 0 warnings, and 1 informational note. The `happy` clip is a small full-character bob/head tilt. **It is not a flipper wave.** This file contains the complete raster cel as one image mesh, a head group, and eyelid overlays; no independently movable flipper exists. Cutting and moving the painted flipper alone would leave an exposed hole or a duplicate limb. The hand-drawn vector flipper from `pip-rig-pink.riv` does not match the approved seated character closely enough to substitute. The tap-to-wave acceptance scenario therefore remains incomplete pending an illustrator-prepared flipper layer and matching underlying body artwork.

A polygon-cutout experiment (`pip-seated-flipper-cutout-test.riv`) was inspected and rejected: it introduces a visible seam/gap, and the generated `happy` animation has no flipper transform. The original cel and seated rig were left unchanged. The 16 held typing cels were also reviewed in `typing-cel-contact-sheet.png`; their flipper remains in the typing pose throughout, so there is no alternate source pose to reuse as a wave.

The React preview could not be launched in this environment: `expo start --web --port 8090 --offline` remained at “Starting project” and did not bind the port. `npm run typecheck` still fails only on the existing errors in `PipAccessoryLayer.tsx`, `RiveIglooConstruction.web.tsx`, `WindowStormOverlay.tsx`, and duplicate styling in `OnboardingFlow.tsx`; it reports no errors in the hybrid preview components. No native app, physical phone, or performance benchmark was run. The Rive art and state machine were rendered and simulated through the official bundled WASM runtime.

Production Study Together components, original Synfig frames, sofa, backgrounds, and A/B/C assets remain unchanged. Work remains on `experiment/rive-pip-prototype`; this worktree also contains earlier uncommitted changes, so do not use broad restore/clean commands. To remove only the hybrid preview, remove `HybridStudyTogetherExperiment.tsx`, the three `HybridRivePip` platform files, its `App.tsx` development route/import, and the `pip-seated-rig-aligned.riv` plus hybrid comparison renders. Keep the other Rive prototypes and A/B/C experiment files unless separately requested.

## Result

An editable, layered SVG reconstruction and two real `.riv` exports were created on `experiment/rive-pip-prototype`. The Rive files validate in the official Rive WASM runtime and contain idle, studying, and celebration clips plus a `PipModes` state machine. The A/B/C experiment remains intact, with Rive added as mode D in its development-only comparison screen.

This is a feasibility prototype, **not a faithful replacement for approved Pip**. The side-by-side render makes the gap visible. The character is recognizable by palette, tufts, eyes, beak, feet, scarf, and laptop, but the pose and rendering style diverge enough that it should not be migrated to production.

## Source artwork and reusable material

The approved reference is `../../pip-sofa-study/source/baseline.png` (1176×1337 RGBA). It is a flattened seated three-quarter illustration. The Synfig files use whole-character PNG cels; the existing customization assets are raster overlays or full poses. No layered source artwork with the hidden body surfaces needed for joint movement was found. The earlier inventory and licensing/runtime notes remain in [ASSESSMENT.md](./ASSESSMENT.md).

`pip-layered.svg` is a hand-authored vector reconstruction, rather than a cut-up PNG. It has named groups for body, belly, head, face, eyes, eyelids, beak, flippers, feet, scarf, laptop, and keyboard. `build-rive-scene.mjs` imports its paths into 23 named Rive transform groups, then authors motion and state transitions. The two scarf colors use the same SVG geometry and animation definitions.

## Deliverables

- `pip-layered.svg` — editable vector character artwork.
- `pip-rig-v2.riv` — teal scarf; 21,158 bytes.
- `pip-rig-pink.riv` — pink scarf; 21,158 bytes.
- `pip-rig-teal.scene.json` / `pip-rig-pink.scene.json` — editable Rive scene specifications.
- `build-rive-scene.mjs` — regenerates the scene specifications from the SVG and selected scarf palette.
- `pip-fidelity-v2.png` — approved source beside reconstructed vector render at the same display size.
- `pip-idle-preview.apng`, `pip-studying-preview.apng`, `pip-celebrate-preview.apng` — animated previews (rendered at 15 fps for review).
- `pip-scarf-variants.gif` — same studying motion with teal and pink scarves side by side.
- `VideoAnimationExperiment.tsx` plus platform-specific `RiveAnimationPreview` components — adds D to the isolated comparison lab. The screen keeps A selected by default.

## Artwork fidelity review

The comparison render is the acceptance evidence; the SVG being valid is not enough. Current issues:

1. **Pose and silhouette:** the source is seated, rounded, and leaning toward a laptop. The reconstruction reads upright and frontal, with a longer torso and different flipper-to-laptop contact. This is the largest mismatch.
2. **Face and gaze:** the source has a softly sculpted three-quarter face with pupils looking down at the keyboard. The vector eyes are larger, more frontal, and less integrated into the face. The scarf sits too close to the beak.
3. **Materials:** the source has plush fibers, soft painted shading, knitted scarf volume, and gentle contact shadows. Gradients and vector highlight strokes approximate the palette but look like a clean outlined sticker at normal display size.
4. **Laptop perspective:** the screen and keyboard are more angular and oversized than the source, changing Pip's seated reading/typing pose.

The required next artwork pass is a manual redraw against the approved source: shorten and broaden the head-to-body silhouette into the seated pose; lower and angle the gaze toward the keyboard; place the scarf below the beak with knit depth; redraw the laptop angle and flipper contact; soften the outlines and add controlled plush/knit texture. For a production-quality result, an illustrator should correct those vector paths and provide completed hidden overlap geometry at the shoulders and neck. The flattened PNG does not contain that missing artwork, so a fully automated reconstruction cannot guarantee source fidelity.

## Rig and motion

The current file uses named nested transform groups and editable vector paths. It has 66 vector shapes under 23 groups, but **no Rive bones, mesh deformation, or constraints**. The current authoring tool exposes group transforms and timeline animation; it does not expose the Rive Editor's manual bone/weight-painting workflow. Calling this a skeletal rig would overstate what was built. Head tilt, flipper rotation, body bob, scarf-tail follow-through, and eyelid opacity are independent transform tracks. Eyes can move separately from the head group.

The clips are:

- `idle`: 8 seconds, 60 fps, looping; gentle body bob, small head/gaze shifts, scarf-tail follow-through, two blinks.
- `studying`: 6 seconds, 60 fps, looping; restrained body/head movement and alternating small flipper strokes, gaze shifts, and blinks.
- `celebrate`: 1.6 seconds, 60 fps, one-shot; small hop, squash/stretch, flipper lift, head and scarf follow-through, then settles.

The clips render without visible joint gaps in the sampled Rive filmstrips. Idle/studying remain subtle; the celebration hop is the most legible. These motion previews do not establish native frame pacing, battery, or long-session performance.

The pink scarf is an asset variant with matching animation tracks, not a live Rive data-binding color property. A runtime color property should be added in the Rive Editor if the product needs arbitrary user-selected colors without loading a variant file.

## Rive and app verification

- `riv_create` exported both `.riv` files and validated each with the official Rive runtime.
- `riv_inspect` confirmed one 1176×1337 artboard, the three animation durations/loop modes, and `PipModes` inputs (`studying` boolean, `celebrate` trigger).
- State-machine simulation changed idle → studying → idle and fired celebration in the WASM runtime.
- `riv_lint`: 0 errors, 0 warnings, 1 informational motion note concerning celebration squash/stretch.
- `npm run typecheck` reports no errors in the new Rive preview files or their D integration. The whole project still fails typecheck on unrelated/pre-existing issues in `PipAccessoryLayer.tsx`, `RiveIglooConstruction.web.tsx`, `WindowStormOverlay.tsx`, and a duplicate style key in `OnboardingFlow.tsx`.
- The comparison screen is available with the existing development preview route `?preview=video-animation`; choose D, select a clip, and switch scarf colors. A browser session could not be opened in this environment, so the React UI itself was not visually exercised. Rive's own WASM renderer did render the actual `.riv` clips and comparison images.
- Native playback/performance remains unverified on device. The project already has a native Rive package, but this experiment was not run in an iOS/Android development build. No native FPS, CPU, memory, or battery numbers are claimed.

## Recommendation

Keep Synfig and the optimized atlas as production paths for now. Continue Rive only after the seated vector artwork is corrected and reviewed. The `.riv` prototype proves that editable vector paths, reusable transform groups, three clips, a state machine, and parallel scarf variants can be exported with the available tooling. It does **not** yet prove production-grade character fidelity, a bone-weighted rig, runtime color customization, or native performance.

No production animation component, Study Together scene, original Synfig frame, or A/B/C asset was changed. No dependency or paid service was added for this prototype.

## Rollback

- **Immediate:** the comparison screen defaults to A (original frames). Select A at any time; production renderers continue using the existing implementation.
- **Remove only Rive mode D:** remove the D choice and `RiveAnimationPreview` branch/control/readout from `src/components/VideoAnimationExperiment.tsx`, then remove the three `RiveAnimationPreview` platform files. Keep the rest of `VideoAnimationExperiment.tsx`; it contains the existing uncommitted A/B/C experiment.
- **Remove the character prototype:** after preserving any desired previews, remove only `assets/animations/experiments/rive-pip-prototype/`. Do not use `git clean` or broad restore commands: this worktree also contains pre-existing uncommitted A/B/C and application changes.

The Rive branch itself is `experiment/rive-pip-prototype`; the prior experiment branch is `experiment/video-animation`. Since the worktree has uncommitted files, keep the prototype branch checked out until you intentionally preserve or remove the Rive-only files.
