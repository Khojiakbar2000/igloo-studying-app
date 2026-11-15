# Pip cold shiver study

Review-only animation experiment. The production Rive files and runtime architecture are unchanged.

## Files

- `pip-cold-shiver.sif` — Synfig XML project with 16 named import cel layers, stepped visibility keyframes, varied exposure timing, 500×500 canvas, 12 fps, 3.25 second duration.
- `source/` — standardized approved Pip reference and original generated pose sheet.
- `frames/` — 16 transparent, consistently aligned PNG drawings used by the editable Synfig project and Expo playback.
- `exports/` — 39 transparent PNG frames rendered from the Synfig project at 12 fps. (The renderer includes an endpoint sample; the 3.25 second export keeps the first 39 frames.)
- `pip-cold-shiver-preview.mp4` — H.264 preview composited on a pale blue background because MP4/H.264 does not carry this PNG alpha channel.
- `pip-cold-shiver-preview.gif` — looping transparent preview.
- `contact-sheet.png`, `rendered-contact.png` — normalized pose and rendered sequence review sheets.
- `build_project.mjs`, `export_animation.mjs`, `prepare_frames.mjs` — reproducible project generation, Synfig CLI render/export, and permitted crop/align/contact-sheet preparation.

Run `node assets/animations/synfig-shiver/prepare_frames.mjs`, `node assets/animations/synfig-shiver/build_project.mjs`, then `node assets/animations/synfig-shiver/export_animation.mjs` on the prepared Apple Silicon machine. The last script currently refers to the Homebrew Cellar path used during this experiment; update it to the local Synfig and FFmpeg executable paths on another machine.

The Expo comparison is available at `?preview=pip-synfig-shiver`. It plays the 16 cels at 12 fps with mixed exposures (39 frames total). Rive on the left is the existing seated idle (there is no Rive shiver clip); it is a capability comparison, not a matched-action scorecard.

## Source and limitations

The approved character master is `assets/characters/penguin/igloo-penguin-front-gaze.png`. It is a flattened raster image, and the repository has no approved separate head, eyes, eyelids, beak, feet, or flipper layers. ImageGen produced a contact sheet anchored to a standardized copy of that master. Preparation only crops the grid, scales each whole character uniformly, removes stray disconnected pixels from adjacent cells, and aligns the feet to a common baseline. It does not cut Pip apart or animate by warping the full image.

These are 500 px preview cels and do not meet a high-resolution asset target. The pose changes are readable and stylistically close to Pip, but the limited number of drawings and generated-sheet artifacts make this an early quality study rather than a production-ready professional shiver performance. Synfig supplies an editable timeline and rendering; it cannot repair character-design drift or add missing pose drawings automatically. `timeline.json` contains the 12 fps cel exposures used by the SIF builder and Expo playback.

## Synfig investigation (2026-11-14)

- Apple Silicon: the Homebrew `synfig` 1.5.5 CLI bottle ran natively as arm64 and rendered this project. The formula depends on a large multimedia stack. The installed MLT reports unavailable optional SoX/rubberband modules and the CLI reports a missing JPEG module; PNG render and alpha output still succeeded.
- GUI: upstream Synfig 1.5.5 DMG was checked by checksum against the release page. Its Studio binary was x86_64-only and unsigned. The Homebrew Studio cask was disabled/stale at 1.4.5 and would require Rosetta. Neither GUI was installed or Gatekeeper bypassed. Thus the SIF was validated and rendered by the CLI; opening/editing it in Studio on this Mac remains unverified.
- Project format: SIF is XML and can be written programmatically. Synfig's own documentation says the format is implementation-defined and evolving. Keep imported PNGs beside the project and verify projects in Studio before relying on generated SIF files in production.
- Skeletons: Synfig has skeleton handles for vector art and a mesh deformation layer for raster art. This Pip source is one flattened image, so the mesh would deform the whole penguin instead of independently controlling the flippers, head, or eyelids.
- Security/license: no community MCP server or third-party animation server was installed. The official upstream project and CLI are GPL-3.0-or-later. The GUI DMG's unsigned Intel-only status was treated as a blocker rather than bypassed.

References: [Synfig releases](https://github.com/synfig/synfig/releases), [Homebrew CLI formula](https://formulae.brew.sh/formula/synfig), [Homebrew Studio cask](https://formulae.brew.sh/cask/synfigstudio), [official installation manual](https://synfig.readthedocs.io/en/stable/installation.html), [SIF format documentation](https://synfig-docs-dev.readthedocs.io/en/latest/common/sif_file_format.html), [Skeleton Deformation Layer](https://wiki.synfig.org/Skeleton_Deformation_Layer), [Skeleton Layer](https://wiki.synfig.org/Skeleton_Layer), [render tips](https://wiki.synfig.org/Tips).
