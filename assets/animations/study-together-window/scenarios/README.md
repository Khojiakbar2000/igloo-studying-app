# Study Together window scenarios

Five ImageGen panoramas with LottieFiles Creator motion, used only in Study Together. The original blizzard remains a sixth option. Character assets, timing, proportions, accessories and seat coordinates are unchanged.

Each motion file is a transparent 660×234, 24 fps, eight-second loop. Only the selected loop mounts. Reduced motion retains the still panorama. Native animations pause when the app backgrounds; web animations pause when the tab is hidden.

Creator documents: `igloo-window-{aquarium,zombies,beach,moon,spaceship}-v1`. Aquarium and spaceship use revision 2; the others use revision 1. `creator-source.js` is the Creator sandbox script with `params.scene` selecting a scene. It is not a local Node script. Original illustrations were generated as wide storybook panoramas, then resized and JPEG-compressed for the room. Final app assets are all in this folder.

After Creator export, each JSON was wrapped in one precomposition with an additive mask matching `WINDOW_CLIP` in `src/scenes/studyWindowScenes.ts`. That mask and the SVG still-image clip keep the animation and panorama inside the same arched window. The room image, frosted trim, lantern, sofa and four characters are separate existing layers. Aquarium artwork is slightly overscanned to exclude its generated outer trim.

Motion: three swimming fish and seven bubbles; three distant shamblers with mist; five sea ripples and a gull; lunar stars with a passing satellite; cosmic stars with drifting stardust. No particle engine or new runtime dependency.

Validation: Metro development bundle compiled, JSON dimensions/timing/masks checked, aquarium Creator filmstrip inspected, and still composites checked for room alignment. Browser automation was unavailable, so live button interaction and native device rendering were not visually verified. Repository typecheck remains blocked by pre-existing errors in PipAccessoryLayer, RiveIglooConstruction.web, WindowStormOverlay and OnboardingFlow; no errors were reported for the new components.

Live preview: http://127.0.0.1:4174/?preview=study-together
