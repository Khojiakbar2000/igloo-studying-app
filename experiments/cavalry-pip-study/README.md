# Cavalry Pip experiment — incomplete technical proof

Cavalry was installed from https://cavalry.studio/downloads/latest/Cavalry.dmg. Its official MCP package came from https://cavalry.studio/docs/files/cavalry-mcp-server.zip. The bundled Node bridge is registered as `cavalry-official` in Codex. Official MCP connection and scene editing succeeded using its bundled MCP SDK. No third-party Cavalry bridge was installed.

## Results

- `pip-study.cv`: editable isolated Cavalry scene referencing the approved original PNG.
- `pip-technical-proof.mp4`: actual Cavalry H.264 render, 720×720, 30 fps, exactly 3 seconds; 631,471 bytes.
- `pip-technical-proof.json`: native Cavalry Lottie export, 1440×1440, 30 fps, frames 0–89; 17,206 bytes.
- `images/baseline0.png`: required external image, 1,620,220 bytes. Combined Lottie delivery is 1,637,426 bytes (about 1.56 MiB), before compression.
- `compare.html`: isolated visual comparison with the existing Synfig frames and Creator export. Open from this repository so its relative assets and installed lottie-web runtime resolve. Browser playback has not been verified.
- `create-proof.js`: authoring script, intended for this specific isolated scene only. It is not idempotent; rerunning creates duplicate accessories.

Motion is subtle scaling/rotation of the complete artwork, including its laptop. Glasses are separately editable vector shapes parented to the artwork. This tests attachment and export structure, not an independently moving head. A rendered frame was visually inspected: glasses fit around the eyes. Motion alignment is supported by shared parent transforms but has not been independently reviewed frame by frame in a Lottie player.

## Unfinished acceptance criteria / blocker

The approved PNG flattens eyes, flippers, scarf, body and laptop together. No independent matching eye/flipper/scarf artwork was identified for this exact baseline. The official MCP can import and transform layers, but supplies no automatic artwork separation or reconstruction operation. Preserving the original textured appearance during independent blinking and typing requires additional layer preparation and hidden-area artwork. Scarf recolouring without changing adjacent pixels likewise needs an accurate scarf separation.

Consequently this proof does NOT contain independent blinking, typing, head movement or interchangeable scarf colours, and it is NOT a Finch-quality finished animation. Glasses can be toggled through layer visibility in Cavalry; no runtime accessory UI is supplied. No alternative artwork-generation or automation tool was introduced to bypass this limitation.

Native Lottie JSON has the expected three-second timing, external image reference and parented vector glasses. Pixel fidelity, mobile playback performance, loop seam and runtime accessory toggling remain unverified. MP4 and JSON use different output resolutions; they are not a pixel comparison.

## Comparison and decision

The current Synfig manifest describes 42 frames at 12 fps (3.5 seconds), from 16 source cels. It already supports illustrated pose changes that this proof does not reproduce. The existing Creator export is 90 frames at 30 fps (3 seconds), with an embedded character/scarf image and separate glasses shapes. It is 2,130,734 bytes; its embedded-image packaging differs from Cavalry's external-image packaging, so raw JSON size alone is misleading.

Cavalry's official MCP successfully imported, edited, saved and rendered the scene. This establishes a functional automation path, not long-term reliability. Its proof preserves the source raster but demonstrates no animation-quality improvement over the working workflows. Do not migrate on this evidence.

All work for this experiment is isolated here. Production screens, existing animations, dependencies and Study Together were not edited during this experiment. No full application build was run. Existing unrelated workspace changes were retained.
