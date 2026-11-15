# Study Together: ten illustrated environments

The nine new background plates are ImageGen illustrations based on the existing 1024×1536 igloo plate. Snowy Igloo uses the existing original background directly. `provenance.json` records the prompts and generated source locations. Each room was inspected as a composite with the existing sofa and the four original penguin cels before continuing to the next room. `room-review.jpg` collects the ten compositions; these are still-art reviews, not app screenshots.

Foreground contract is unchanged: sofa `(52,680,920,438)`; penguin seats at x `62,290,518,746`, y `685`, each `220×277`. No character, scarf, accessory, sofa, cel or study timeline was regenerated or changed for these environments.

Background JPEGs are 1024×1536. The small illustrated thumbnails crop the architecture above the sofa so the rooms remain recognisable in the in-room horizontal selector. Snowy Igloo also exposes the previous six window themes through the Window views button.

The selected room is stored at `igloo.study-room.v1` using the existing AsyncStorage dependency. Selection waits for its image to download/decode before committing. Thumbnails and room files warm in the background; the web decoder retains at most three full plates. A 260 ms opacity crossfade replaces the background independently of the shared foreground. Character activity components retain their keys and timing effects throughout switches. Failed room loads retain the current room and allow retry.

Independent environmental Lottie loops live in `assets/animations/study-together-rooms`. They use the existing Lottie runtime. Only the selected environmental loop plays. Native background state and browser visibility pause playback; reduced-motion mode retains the still illustrations. No new dependency or animation tool was installed.

Validation: all ten still compositions were inspected, the room asset references and Lottie timing/dimensions were checked, and Metro compiled the live development bundle. Repository TypeScript checking still reports the existing PipAccessoryLayer, RiveIglooConstruction.web, WindowStormOverlay and OnboardingFlow errors; the new room modules reported no type errors. No full application build was run. Live browser interaction and device playback have not been automatically verified in this session.

Preview: http://127.0.0.1:4174/?preview=study-together
