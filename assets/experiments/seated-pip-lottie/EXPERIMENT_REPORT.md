# Seated Pip Lottie Experiment — Initial Art Gate

## Result

Stopped before rigging or authoring a Lottie animation. The ImageGen attempts produced a plausible full-character still, but did not produce animation-ready layers that can be assembled without changing Pip's appearance. No Lottie, MP4, preview screen, or production code was created or changed.

## Preserved source and timing

- Approved source: `assets/animations/pip-sofa-study/source/baseline.png` (1176×1337 RGBA, 1.55 MiB).
- Contact sheet: `assets/animations/pip-sofa-study/source/typing-sheet.png` (16 cels, 4×4).
- Timeline: 12 fps, 16 unique cels, held exposure sequence `[4,2,2,3,2,2,2,3,4,2,2,3,2,2,3,4]` = 42 frames / 3.5 seconds per loop.
- Production renderer references 16 exported cel images totaling 4.11 MiB for the typing character. The complete original exported sequence has 42 PNGs totaling about 11 MiB; the 16 source PNG cels total about 4.2 MiB.
- The cel sheet confirms eye direction, half-lids, and closed-eye blinks are already painted into the full-character cels. Head/scarf/body shape also shifts slightly across poses. Typing motion is held-cel arm/laptop movement, not continuous skeletal animation.

## ImageGen attempts

1. `attempts/imagegen-seated-full-character-v1.png` — transparent full-character reconstruction on the 1176×1337 canvas. Side-by-side: `previews/original-vs-imagegen-v1.png`. The overall seated pose and Pip identity are close, but the result is still a single flattened character image, so it cannot provide independent facial or limb controls.
2. `attempts/imagegen-left-flipper-v1.png` — isolated transparent flipper. It is 1536×1024 rather than aligned to the character artboard; its contour, angle, shoulder shape, and shading differ from the approved flipper. It cannot be attached without a visible mismatch. The image is preserved for reference only.

## Why the prototype did not proceed

There is no clean base character with the face/flippers/laptop removed, no hidden shoulder or torso artwork, and no separate eye/pupil/eyelid/beak layers. Compositing expression art over the cels would double the existing facial features. Replacing or rotating a flipper would expose a hole or create a mismatched edge. Treating the reconstructed full character as an animation would only allow whole-image motion and would not reproduce the original alternating typing or independent expressions.

## Lottie / Expo findings

- Lottie Creator MCP is connected. The account check reported 0 general credits, with free-use counters still showing remaining exports and renders. No export/render operation was used because there was no acceptable layered art to author.
- The installed `lottie-react-native` is 7.3.8. Its local README and implementation expose `progress`, segment playback (`play(startFrame, endFrame)`), pause, and resume. Separate synchronized body and facial Lottie views appear architecturally possible by driving both with a shared progress clock, but this was not implemented or validated with an actual character asset.
- No native or Expo playback test was performed. There is no new `.json` to compare or play.

## Required art handoff to continue

Prepare one fixed 430×541 seated typing artboard (or the 1176×1337 source artboard with a documented scale) with aligned transparent layers: repaired body/head/face base; left and right flippers with hidden shoulder overlaps; feet; laptop/keyboard as a separate occluding prop; scarf; eye whites; pupils; eyelids; and beak. Preserve the approved texture and include the existing neutral, gaze, half-lid, and blink poses. The base must be clean beneath eyes and moving limbs. Provide anchors for shoulders, eyes, and the laptop contact edge. First validate the assembled neutral pose over the approved cel before authoring motion.

## Safety

All files in this directory are isolated experiment artifacts. The Synfig project, PNG cels, Study Together renderer, Rive experiments, scarf customization, and other uncommitted work were left intact. No code or dependency changes were made for this experiment.
