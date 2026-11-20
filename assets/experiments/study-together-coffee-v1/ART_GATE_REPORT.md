# Study Together Seated Pip — Coffee Action Art Gate

## Decision: do not rig or integrate these drafts

Two ImageGen layer-sheet attempts were made using `assets/animations/pip-sofa-study/source/baseline.png` as the visual reference. Neither is accurate enough to replace or transition from the approved Synfig character. They are preserved under `attempts/` for review only.

## Source animation inspected

- Approved still: `assets/animations/pip-sofa-study/source/baseline.png` (1176×1337).
- Runtime cel canvas: 430×541 with common scale and bottom alignment (`assets/animations/pip-sofa-study/manifest.json`).
- The typing loop has 16 unique cels at 12 fps, held for 42 frames total (3.5 seconds); its laptop is integrated in each full-character cel (`assets/animations/pip-sofa-study/timeline.json`).
- Production currently renders those existing cels in `src/components/StudyTogetherCharacters.tsx`.

## ImageGen review

- `attempts/seated-layer-sheet-v1.png` follows the requested parts-sheet layout, but the body reads as a standing/front-facing character. The head/body balance, scarf drape, flipper angles, feet and laptop registration differ from the approved down-looking three-quarter seated typing pose.
- `attempts/seated-layer-sheet-v2.png` improved the footed silhouette but still changes the seated pose and facial/head proportions. The body sheet includes limb/foot shapes that conflict with the separately drawn limb assets, and the laptop and mug are not registered to the original character canvas or keyboard contact points.
- Neither sheet provides dependable 430×541 attachment coordinates or clean, matching hidden geometry for the shoulders and lap. Compositing the extracted parts would show mismatched seams or duplicate limbs. An assembled neutral render would not match the Synfig frame closely enough for a clean transition.

## Work intentionally not done

No parts were cropped or cleaned into production-ready layers, no Lottie composition/MP4 was authored, and no component, debugger, dependency, or production animation was changed. Expo web/native playback was not tested because there is no visually acceptable prototype asset to render.

## What unlocks the next attempt

The seated artwork needs a manually corrected, aligned layer source on the existing 430×541 artboard (or a documented 1176×1337 artboard that can be mapped exactly): clean seated body/head/scarf base, flippers with hidden shoulder overlap, feet, laptop occlusion layer, and a mug/flipper contact pose. It must preserve the original downward gaze, laptop angle, torso silhouette, and scarf placement. The neutral assembly should be overlaid on the approved typing cel and visually accepted before retargeting any Lottie motion.

The original Synfig cels remain the comparison and fallback path. This directory contains only the two rejected ImageGen drafts and this report.
