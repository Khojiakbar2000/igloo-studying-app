# Independent room motion

These are environmental layers for the ten Study Together rooms. They never contain or animate the four studying penguins or shared sofa. They use the existing `StudyWindowAnimation` Lottie runtime, with no new dependencies.

All loops are 1024×1536, 24 fps, frames 0–383 (16 seconds). `generate.cjs` rebuilds the ten JSON files from the painted ImageGen sprites and a cropped mirrored strip of the generated train scenery. Rebuild from the repository root with `node assets/animations/study-together-rooms/generate.cjs`. This authoring script does not run in the app.

| Room | Independent motion |
| --- | --- |
| Midnight Library | Floating warm dust, painted open book with an occasional page curl, lamplight |
| Rainy Café | Raindrops sliding over glass, passing distant cars/headlights, pendant glow |
| Snowy Igloo | Lantern glow; the original separate blizzard loop continues outside the window |
| Cherry Blossom Room | Painted falling petals drifting in the spring breeze, lantern glow |
| Underwater Library | Painted fish, bubbles, swaying kelp, shell-lamp glow |
| Forest Cabin | Swaying painted pine boughs, drifting autumn leaves, fire highlights and firelight |
| Stargazing Observatory | Twinkling stars, occasional shooting star, slow star drift, reading-lamp glow |
| Midnight Train | Seamlessly tiled snowy scenery moving behind three separately masked panes, atmospheric light |
| Enchanted Castle | Painted floating candles, magical motes, flickering candle light |
| Aquarium Lounge | Painted fish and pulsing jellyfish, bubbles, swaying kelp, pendant glow |

Painted sprites came from an ImageGen transparent prop atlas, followed by an ImageGen cleanup pass. Low-alpha background residue was removed during technical atlas preparation; the nine objects were cropped and resized into `sprites/`. Embedded image assets make each Lottie self-contained. The source atlas contains only environment props, no penguin or sofa art.

Resetting particles fade to zero opacity at loop boundaries; swaying motion returns to its start value. Train scenery uses a mirrored strip and two copies per window, so the replacement copy meets the original at the seam. Most layers remain static except position, opacity, scale or rotation. No blur filters or particle engine are used. Runtime JSON totals about 683 KB, including embedded painted props.

Static scene composition and JSON structure have been checked. Native device rendering and animated pixel comparisons remain unverified.
