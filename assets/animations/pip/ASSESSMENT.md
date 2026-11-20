# Pip reusable animation library

Animation-quality experiment, not integrated into production.

## Deliverables

| Clip | Duration | MP4 bytes | Lottie bytes |
|---|---:|---:|---:|
| Wave | 3 s | 132,306 | 378,702 |
| Dance | 6 s | 367,216 | 383,249 |
| Celebrate | 3 s | 157,461 | 381,360 |
| Comparison, Wave → Dance → Celebrate | 12 s | 913,673 | — |

All videos are H.264 MP4, 720×720, 30 fps, with the same framing and pale background. Lottie files have transparent composition backgrounds and five embedded PNG assets.

## Reuse and preservation

The five files in `character/` are byte-for-byte copies of the successful standing dance layers in `assets/experiments/pip-lottie-dance/`. The original source sheet is preserved in `workspace/source-sheet.png`; the approved seated reference remains at `assets/animations/pip-sofa-study/source/baseline.png`. No new artwork was generated for this library. Existing experiments, source assets, application changes, and production components were left untouched.

Pixel hashes verified that every animation uses the same five underlying artwork assets. Each contains five image layers plus one parent motion controller. No animation frame sequences, masks, effects, expressions, footage, or time remapping are used. Shoulder anchors are [80,28] and [26,28]; both ankle anchors are [58,20]. The head, scarf, face and torso are one image and move together; these are raster layers with editable transforms, not vector drawings or an independently editable facial rig.

`workspace/build-library.mjs` reuses the successful dance JSON, retains its main choreography, normalizes the initial resting pose, and authors wave and celebration transform tracks. `lottie/` contains these editable source files. Each was imported into its own Lottie Creator MCP document, rendered and exported; the matching Creator JSON exports are preserved as `workspace/*-creator.json`. Creator documents are `pip-library-wave-20261115`, `pip-library-dance-20261115`, and `pip-library-celebrate-20261115`.

## Quality review

Inspected the Creator pose strips, then contact sheets spanning the actual exported MP4 motion at 10 samples/second, and a contact sheet from the final combined video. The wave has three raised-flipper arcs; dance retains alternating flippers, foot taps and sway; celebration has a preparatory dip, both flippers raised, compact jump, foot wiggles and landing compression. No duplicate flippers, exposed shoulder/ankle gaps, or scarf detachment were apparent in the reviewed samples. The last settle was revised to include a rest hold.

Limitations: the flippers are rigid textured parts rotating at their roots, with no elbow/mesh deformation. Facial expression stays at the original happy expression. Dance uses stylized toe turns and weight shifts, not foot IK or physically locked contacts. Visual approval is still the user's decision; this does not establish parity with professionally illustrated and rigged companion-app characters.

## Verification

`workspace/verification.json`: pixel identity of all five layers, identical pivots, matching start/end transforms, consistent framing, and no inspected unsupported feature fields. `workspace/browser-verification.json`: actual lottie-web Canvas playback of the source JSONs, visible pixels and moving middle poses for all three; first and last displayed frames are pixel-identical for every clip. Web verification is not native iOS/Android verification.

Commands, from repository root:

    node assets/animations/pip/workspace/build-library.mjs
    node assets/animations/pip/workspace/verify-library.mjs

The browser check is `workspace/verify.html` served from the repository root and uses the already installed lottie-web runtime. MP4s were rendered by Creator, not by the build script. `workspace/concat.txt` records the comparison order; concatenate with ffmpeg using the same 720×720 / 30fps inputs.

## Expo / React Native compatibility

The project already includes `lottie-react-native`. The files use image layers, parenting, anchor points, position, rotation, scale and eased keyframes. These are standard supported Lottie features, per the [official feature matrix](https://github.com/airbnb/lottie/blob/master/supported-features.md). No known unsupported feature was deliberately introduced.

Native compatibility remains provisional. Verify embedded base64 PNG decoding, image layer ordering/transparency, parenting, clip completion/idle holds, and load/decode memory on the project's actual iOS and Android runtimes. If external image packaging becomes necessary, follow the [React Native image-assets instructions](https://github.com/lottie-react-native/lottie-react-native/blob/master/docs/api.md). Do not infer native FPS, memory or battery behavior from the browser result; none was measured. Existing source textures limit useful enlargement beyond the current artwork size.

## Rollback

No application route or production renderer references this library. To undo, remove only the newly created `assets/animations/pip/` directory after saving any wanted files. Do not use broad Git restore/clean commands: the workspace contains unrelated uncommitted work. No dependency, build, installation, or production migration was performed.
