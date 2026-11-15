# Pip's My Igloo window storm

## Preview

In the running Expo app, finish onboarding and open My Igloo. Tap the round window in the existing room art to play; use **Skip** to return Pip to his chair. The focused room illustration remains the background throughout. The interaction includes mute and reduced-motion behavior.

Rendered previews: `synfig/pip-window-storm-preview.gif` and `synfig/pip-window-storm-preview.mp4` (both composited on pale blue for convenient viewing). The exported PNG sequence remains transparent. A 4×4 pose contact sheet is at `synfig/rendered-contact.png`.

## Editable animation source

- `synfig/source/pip-window-interaction-16.png` is the ImageGen pose sheet based on the approved front-gaze Pip master.
- `synfig/cels/pip-window_00.png` through `pip-window_15.png` are consistently sized transparent drawings. Preparation crops the grid, removes stray disconnected pixels, and aligns each intact whole-character drawing to a shared foot line.
- `synfig/timeline.json` defines 22 timed exposures, including alternating walk steps and distinct reach, gust, shiver, closing, and return beats.
- `synfig/pip-window-storm.sif` is the editable Synfig project with named cel layers and stepped visibility keyframes (500×500, 12 fps, 6.75 seconds).
- `synfig/exports/` contains 81 transparent PNGs rendered from the SIF. Expo displays the 16 unique aligned cels and uses the same exposure timings, avoiding bundling duplicate exposures.
- `synfig/prepare_cels.mjs`, `build_project.mjs`, and `export_animation.mjs` regenerate the preparation, editable project, and rendered outputs. The render script uses the Synfig and FFmpeg Homebrew Cellar paths from the Apple Silicon experiment; adjust those executable paths on another machine.

## Interactive scene and sync

`src/scenes/IglooWindowInteractionScene.tsx` is mounted as a transparent interaction layer inside the existing My Igloo room frame. The room art and seated Pip stay in place; the original Pip is hidden only while the Synfig cels play. The current beat state machine is:

`idle → notice_window → approach_window → reach_handle → open_window → wind_reaction → shiver → close_window → recover → return_to_idle`

The scene reads cel durations from `synfig/timeline.json`. Each waddle cel advances Pip's floor anchor along the room perspective, keeping the shared Synfig foot line grounded from chair to window and back. The existing round window position is overlaid with storm glass, a hinged sash, frost, and clipped snow only during the interaction. Skip returns Pip to his original chair anchor. A direct tap plays the interaction while the focus timer continues.

The round window remains a separate SVG assembly over the untouched igloo illustration: storm view, frost ring, glass reflections, divided opening panel, hinges, and snow-covered sill. Existing synthesized sample-free WAV audio is retained and is dedicated to CC0 use.

## Character and production notes

The original Rive system remains unchanged. The approved Pip master and existing older window pose sheet are preserved. The new cels use full-character drawings rather than a cut-up raster or mesh warp, so Pip's silhouette and scarf do not deform through joint rotations. The Synfig project is editable as a timed cel stack; individual body parts are not independently rigged because no approved layered master exists.

Tools used: ImageGen for the pose drawings, the `2dimg2motion` and `natural-2d-character-animation` workflows for consistency and acting beats, Synfig 1.5.5 CLI for the editable timeline and transparent PNG render, sharp for crop/alignment/contact sheets, FFmpeg for previews, and existing Expo/RN Animated/SVG/audio code for the interaction. No new runtime dependency or MCP server was added. The desktop Synfig Studio GUI was not installed because the checked upstream macOS package was unsigned and Intel-only; CLI render was verified on Apple Silicon.
