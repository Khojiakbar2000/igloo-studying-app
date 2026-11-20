# Pip scarf customization experiment

This experiment is isolated from production. It uses copies of the approved storybook Lottie animations and preserves the original clips and source artwork.

## Preview

Open `index.html` through the local static server. Choose a scarf and animation while Pip is moving. The scarf textures are preloaded, then the preview updates both the SVG definition and visible image node without recreating the Lottie player.

## Artwork

- `source/approved-body-with-scarf.png` is the untouched approved body source.
- `character/body-no-scarf.png` keeps Pip's original face and silhouette. ImageGen supplied a scarf-free underpainting; only the scarf/neck region was used to reconstruct the covered geometry, and a traced local mask removed the original scarf.
- `scarves/scarf-teal.png` is the original teal scarf extracted with its knitted texture and outline.
- Red and lavender use the same extracted scarf pixels, with hue changes that keep the original lighting and stitch texture. ImageGen's standalone scarf concept had a different silhouette, so it is retained in `source/imagegen-scarf-concept.png` for reference and was not substituted for the approved scarf.

## Animation reuse

`lottie/` contains editable JSON copies for `pip-cold`, `blink`, `wave`, `hopeful-wave`, `scarf-tuck`, `curious-look`, and `celebrate`. Each has one separate scarf image layer registered to Pip's existing body controller. The original animation layers, frame rate, frame range, and keyframes match their source files exactly. The color choice changes the single scarf image asset; it does not create per-color motion files.

The current storybook set has no dance clip. The older dance asset uses the previous plush character design and is intentionally not included.

## Verification

- Lottie Creator imported and rendered `lottie/wave.json` as a six-tile, 30 fps filmstrip in document `pip-scarf-customization-review-20261116`.
- Headless Chrome tested all seven available clips with teal, red, and lavender: 21/21 swaps passed. The current player ID stayed the same and its frame advanced for every scarf change. Textures were decoded before they could be selected.
- `workspace/verify-assets.mjs` confirms source keyframes, layer definitions, frame rate, duration, and artboard dimensions are preserved in all seven copies.
- Browser testing confirms no player remount or frame reset in `lottie-web`. Native iOS/Android hot-swapping has not been verified; the browser demo updates SVG image nodes, and the equivalent native path needs a device check before adoption.
- Asset sizes and dimensions are recorded in `workspace/asset-verification.json`.

## Limitations

This proves a reusable image layer and browser hot-swap, not a production-ready native outfit API. The scarf's two ends are part of the same static accessory layer and follow Pip's body controller; they do not have independent animation tracks. The under-scarf area has a small generated paint reconstruction, so review `character/body-no-scarf.png` before extending the same extraction method to other accessories.

Nothing here is wired to the app's production screens. Remove this experiment directory to discard the work; original Pip assets and animations remain separate.
