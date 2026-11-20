# Pip knight skin experiment

This directory retains the complete-art-first source experiment. The resulting skin is now connected to the existing wardrobe product and character preview. The earlier separate-piece armor artwork and source experiments remain in place.

## Source and layers

- `complete-armored-pip.png` is the approved full-costume illustration generated from `assets/animations/pip/storybook/character/standing-fallback.png`.
- `body-layer-source.png`, `flippers-pair-layer-source.png`, and `feet-pair-layer-source.png` retain the ImageGen layer-preparation sources.
- `layers/` contains five transparent 720×720 composition-space source images: armored body, left/right flipper, and left/right foot. All layers share one measured affine fit, preserving the existing 720×720 character composition and limb pivot positions. The Lottie JSON uses tight-alpha crops with adjusted anchors to keep runtime textures smaller.
- `original-vs-complete-720.png` compares the approved Pip and complete armor at the same composition size.
- `complete-vs-layered-720.png` compares the approved complete armor to the same pose rebuilt from layers. The mean absolute RGB difference is 2.82 levels/channel over 720×720 pixels; most residual difference is at generated layer edges and compositing seams.
- `previews/` contains browser captures of the comparison and selected rendered Wave, Shiver, and Celebrate poses.

## Lottie actions

`lottie/{idle,wave,shiver,celebrate}.json` reuse the matching existing `assets/wardrobe/lottie/` action timing and transforms. Only the image assets and image anchors were changed to the shared-canvas layers. The old painted eyelid overlay was removed because it contains face-specific pixels from the old artwork and would cover the armor character's face. These exports therefore do not include blinking. Production copies are in `assets/wardrobe/lottie/knight-storybook/`.

The old `assets/animations/pip/lottie/dance.json` is layered, but its embedded body is the different plush-rendered character. It is not suitable for this approved storybook skin, so Dance is intentionally not retargeted.

## Preview and verification

The shop's Little Snow Knight item selects the complete character skin and keeps compatible face accessories layered above it. Purchases and equipped looks persist through the existing wardrobe state; old saves that had equipped any piece of the purchased knight set migrate to the complete skin. Removing the skin returns Pip to the regular character. The original separate-piece knight overlays are retained as legacy assets and are no longer surfaced as individual wearable parts.

Open `preview.html` from the project web server to compare the approved Pip, full costume, layered reconstruction, and a single playing Lottie action. Idle, Wave, Shiver, and Celebrate are selectable. The preview uses Lottie Web 5.13.0. The existing Expo web wardrobe screen was also visually inspected with the knight item selected; native device playback has not been tested.

Rebuild the derived composition layers and JSON with:

```sh
node assets/wardrobe/experiments/knight-skin/prepare-skin.mjs
node assets/wardrobe/experiments/knight-skin/make-preview.mjs
```

The source experiment is preserved. Production integration is limited to the knight product's skin marker and thumbnail, its four derived Lottie action files, persistence/equipment selection, and the existing wardrobe preview component.
