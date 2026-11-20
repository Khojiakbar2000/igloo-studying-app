# Pip accessory asset standard

Accessory art is authored against the approved seated Pip Lottie composition. Keep source art and exports versioned; never overwrite the character or animation files while iterating.

## Coordinate and attachment rules

- Base composition: `720 × 720`.
- Body image frame: `304 × 500`; body accessories use anchor `[152, 250]`.
- Left flipper image frame: `85 × 96`; pivot `[63.75, 16]`.
- Right flipper image frame: `86 × 96`; pivot `[21.5, 16]`.
- Left foot image frame: `49 × 45`; pivot `[24.5, 9]`.
- Right foot image frame: `48 × 45`; pivot `[24, 9]`.
- These are the positions and transform origins from the current Lottie assets. Do not substitute screenshot coordinates.
- The current character art has no independent head controller. Head and face items parent to the body/root controller. Do not imply independent head motion until the rig adds that controller.

## Layer order

Use explicit integer `order` values within the scene layer. Lower values render first. Recommended defaults: cape behind body `-10`; chest `10`; limb and footwear pieces `20`; neckwear `30`; face `50`; headwear `60`. Accessories attached to separate limbs must use that limb's frame and pivot, not a body-space offset.

## Image requirements

- PNG with a real alpha channel; lens interiors and empty canvas areas must be transparent.
- Use the exact frame dimensions and anchor from the manifest. Canvas transparency is allowed; avoid black/white matte backgrounds and edge halos.
- Keep decoration within the documented `alphaBoundsMax` to catch accidental full-character artwork and excess canvas margins.
- Eyes, blink artwork, face, scarf, and character colors must remain visible unless the item explicitly belongs in front of them.
- For glasses, leave the lens interiors clear and do not bake face, eye, shadow, or highlight pixels into the asset.
- Keep item art and animation source layers independent. Never bake Pip or an animation frame into a wearable item.

## Adding an accessory

1. Create a transparent accessory image in the appropriate rig frame.
2. Add its canvas, anchor, attachment slot, layer, and order to `accessory-manifest.json` and the data-driven wardrobe catalog.
3. Run `node assets/wardrobe/workspace/validate-accessories.mjs`.
4. Preview the asset against idle, wave, shiver, and celebrate at several points in each clip. For limb equipment, confirm it inherits the real limb transform.
5. Inspect a full-scale image and the alpha channel before accepting it. Validate the React Native renderer on-device before making platform performance claims.

The present rig provides body/root, left/right flipper, and left/right foot frames. It does not provide independent neck, face, or head bones; those slots currently use the body/root transform and are ordered visually within that composition.
