# Pip costume pipeline

Costumes are full-character skins. The complete illustration is the visual source of truth; animation layers are accepted only after a side-by-side recomposition check.

## Current status

| Costume | Complete art | Standing actions | Shop status | Other poses |
| --- | --- | --- | --- | --- |
| Little Snow Knight (`knight-storybook`) | Existing approved experiment | Idle, wave, shiver, celebrate | Available | Default Pip fallback |
| Cozy Winter Explorer (`winter-explorer`) | Concept ready | Layer alignment review | Preview only | Default Pip fallback |
| Little Wizard (`little-wizard`) | Concept ready | Layer alignment review | Preview only | Default Pip fallback |
| Royal Pip (`royal-pip`) | Concept ready | Layer alignment review | Preview only | Default Pip fallback |
| Sleepy Scholar (`sleepy-scholar`) | Concept ready | Layer alignment review | Preview only | Default Pip fallback |

The four new full illustrations are in each costume's `source/complete.png`. Layer sources and generated recompositions are retained beside them for review. Recomposition comparisons showed attachment/proportion drift, so those draft animations are deliberately not registered as usable variants and the items cannot be bought or equipped. Do not promote them by changing `available` until they pass the visual gate.

The current seated Study Together character stays on its approved renderer. No seated costume was inferred from the standing art. A seated Knight variant is not available yet; character consumers should resolve the requested pose through `PipCharacter` and use its documented default-pose fallback when no variant exists.

## Runtime model

- `model.ts`: stable product IDs, skin IDs, price, categories, and the anatomy slots covered by each complete costume.
- `costumes.ts`: pose-to-action registry. Animation consumers request an action and pose; the registry resolves an asset only when that exact variant exists.
- `PipCharacter.tsx`: shared character entry point. A missing pose/action uses the corresponding approved default pose; it never stretches a standing costume to fit another pose.
- `home/state.ts`: owns and persists the equipped skin with the rest of the wardrobe state. Skin coverage removes conflicting individual equipment while retaining compatible slots.
- `PipWardrobePreview.tsx`: renders the one selected character player. Accessories remain separate transparent overlays for the default character; full costumes own their complete illustration and action assets.

## Adding a costume

1. Add the complete, approved character art under `costumes/<id>/source/complete.png`.
2. Prepare body, left/right flipper, and left/right foot layers from that exact illustration. Paint hidden geometry under joints and preserve the same canvas, pivot, and character bounds.
3. Recompose the layers at the source dimensions and compare against `complete.png`. Reject visible silhouette, position, clothing, or face drift before rigging.
4. Reuse the existing action controller/timing to export each supported pose/action. Keep action files under `costumes/<id>/lottie/` and register only verified variants in `costumes.ts`.
5. Add a catalog product and thumbnail. Leave `available: false` until layer comparisons and movement previews pass. Provide explicit pose fallbacks until each additional pose is authored and verified.
6. Test idle, wave, shiver, and celebrate at multiple timestamps; inspect joints, feet, scarf, clipping, and transparency. Verify persistence and equip conflicts using the existing wardrobe state.

Do not duplicate action logic per costume. A costume supplies artwork for a pose; action semantics and timing remain shared wherever the layer geometry supports them.
