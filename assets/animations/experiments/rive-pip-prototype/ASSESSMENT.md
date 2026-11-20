# Pip Rive Prototype: Feasibility Assessment

**Status: initial feasibility assessment; superseded by [PROTOTYPE_REPORT.md](./PROTOTYPE_REPORT.md).** This note records why the first Rive attempt stopped. A later isolated pass reconstructed the flattened source as layered vector shapes and exported a real `.riv`; the report documents its results and remaining fidelity gaps.

This assessment is on `experiment/rive-pip-prototype`. It preserves the pre-existing uncommitted A/B/C experiment and the pre-existing `src/components/StudyTogetherCharacters.tsx` edit. Production animation components and source art were not changed. No dependency or paid service was added or used.

## Approved visual reference

Inspected `assets/animations/pip-sofa-study/source/baseline.png` (1176×1337 RGBA PNG). Preserve its seated three-quarter pose, soft plush navy/periwinkle body and feather texture, warm cream face and belly, rosy cheeks, large glossy brown eyes, orange beak and feet, layered teal knitted scarf, small feather tufts, soft painted highlights/shadows, and laptop typing pose. These traits distinguish Pip from a generic flat-vector penguin.

## Reusable artwork found

| Asset | What it contains | Rigging value |
|---|---|---|
| `pip-sofa-study/source/baseline.png` | Approved full-character study still, transparent raster | High-fidelity reference; flattened, no independent parts |
| `pip-sofa-study/pip-study-typing.sif` | 16 Synfig import layers | Each layer is a complete flattened animation cel, not body-part artwork |
| `study-together-pip`, `study-together-reading`, `study-together-writing`, `study-together-headphones`, `synfig-shiver` `.sif` files | 16 import layers apiece, each importing a whole-character PNG cel | Reusable action timing/art; no character rig layers |
| `pip-home-idle/source/blink.png` | Full character in a different closed-eye/hugging pose | Useful expression reference, not an eyelid cutout or aligned overlay |
| `pip-neutral-standard.png`, `rig-sources/igloo-penguin-small.png` | Smaller full-character transparent PNGs in the established painted style | Useful pose/proportion references; flattened |
| `igloo-penguin-companion-v2.riv` and `experiments/*.riv` | Existing Rive work; see structure below | Reusable runtime/state-machine examples, but not a separated production rig |
| Accessory PNGs and frame variants under `pip-customization/` | Glasses, headphones, scarf variants, some aligned per-frame overlays | Useful placement references; variants are raster, not editable Rive outfit parts |

There is no Pip layered SVG, PSD, Illustrator, Krita, OpenRaster, or equivalent source in the animation asset tree. The available `.sif` files preserve exposure timing and cel order, but their layers are full-frame imports.

## Existing Rive work

`igloo-penguin-companion-v2.riv` was inspected and rendered with the connected Rive tooling. It contains one artboard (`Character`, 600×657), `idle` (4 seconds, looping), `happy` (1.5 seconds, one-shot), and a `Character.happy` trigger. It embeds a 1199×1312 PNG (~1.1 MB), one image mesh (81 vertices), two bones, several vector shapes, and two animations. The inspected experimental Rive files expose the same idle/happy state-machine contract. This is useful proof that the project already has a real Rive playback path and authored motion; it is **not** a body/head/eyes/flippers/feet/scarf layer rig and has no studying clip.

The embedded Rive character is a standing, front-facing adaptation. It shares Pip’s established palette, tuft, face, blush, beak, feet, and knitted scarf, but it is not the approved seated laptop pose in the study baseline. I did not relabel its idle or happy animation as the requested new studying prototype.

## Tooling and runtime feasibility

- The connected Rive MCP exposes inspection, rigging, `.riv` creation/editing, rendering, linting, and official-WASM file validation. The existing `.riv` files load and render through that tooling.
- No Rive desktop Editor app or `rive` CLI was found on this Mac. The Rive website documents MCP connections through its desktop Editor, so the available connected tooling is the authoring path used for inspection here, but direct editor UI/weight painting is unavailable in this session.
- Project dependencies already include `@rive-app/react-native` 0.5.12, `react-native-nitro-modules` 0.35.10, legacy `rive-react-native` 9.8.6, `@rive-app/react-canvas`, Lottie, and Reanimated. Expo SDK 54 / React Native 0.81.5 / Nitro 0.35.10 meet the new React Native runtime’s documented minimum versions. The app’s native Pip currently requires the legacy package; a prototype would need an isolated screen using the already installed new runtime. This was not changed.
- Rive’s current React Native docs require a native development build (not Expo Go). No iOS Simulator tooling is available here (`xcrun simctl` is missing), so native playback cannot be verified in this environment.
- Current Rive pricing lists a free option that can ship runtime `.riv` files with a Rive splash screen; removing the splash is a paid Cadet feature. No payment is required for this assessment, and no paid service was used. Confirm the current plan terms before a release decision.

## Why the initial authoring attempt stopped

The automated character rig tool can place a mesh over the flattened image, approximate blinks, and optionally extract manually specified polygon cutouts. That does not create accurate hidden body surfaces, independently shaded body/head/eye/beak/flipper/foot/scarf layers, or a reusable accessory structure. The approved seated pose also has both flippers contacting the laptop; moving a cutout requires repaired artwork beneath each flipper and the laptop overlap. Scarf movement or recoloring requires clean scarf art and the obscured neck/body artwork beneath it. Those are illustration tasks; pixel masks or simple polygon cuts cannot supply them without visible seams, holes, doubled outlines, or a changed painted texture.

The existing Rive asset does not remove this blocker: the full character is one embedded raster image on a mesh. It only supplies a reusable `idle` and `happy` performance. A studying timeline built by animating the whole image would not meet the requested flipper/typing motion or layered rig requirement.

## Smallest handoff that unlocks a proper prototype

Ask an illustrator to prepare the approved seated Pip pose as aligned, transparent layers in the same 1176×1337 canvas, preserving the exact source appearance and supplying the occluded art needed for movement:

1. Body/base including repaired shoulder and torso areas beneath scarf and flippers.
2. Head shell and feather tufts, with an overlap/neck cap.
3. Face patch and cheeks.
4. Left and right eyes plus matching closed lids (or eyelid paths), separately controllable pupils if gaze is needed.
5. Beak with mouth/expression states.
6. Left and right flippers with complete shoulder roots behind the foreground layer; keep the laptop as its own prop layer.
7. Feet, scarf collar, scarf tail, and laptop/keyboard as separate layers, with matching contact edges.

Deliver a layered SVG or PSD plus the neutral assembled PNG, and provide maximum movement poses for head tilt, blink, flipper typing, scarf follow-through, and celebration. Preserve the source palette/texture and add hidden overlap rather than drawing new visible design details. Once those layers exist, use the current Rive workflow to create a compact transform/bone rig, then author `idle`, `studying`, and a `celebrate` one-shot returning to idle; expose `mode` plus a `celebrate` trigger. Compare in the development lab only after actual `.riv` playback is available.

## Architecture findings and recommendation

- **Rive for Pip:** technically compatible with the project’s Expo/RN versions and already available dependencies; adoption is not proven at character quality until the layered source exists and a native development build is tested.
- **Synfig:** keep as the current authoring/fallback path. Its cels provide faithful complete poses and working loop playback while the manual layer-prep task is outstanding.
- **Optimized atlas:** remains the low-risk transparent renderer for continuous study animation and four characters until a Rive file is visually and natively verified.
- **Reanimated:** already installed and used for character/room/UI motion. Existing environmental implementations include React Native Animated and Lottie; do not rewrite them as part of this blocked Rive artwork task.
- **Lottie:** `lottie-react-native` and `lottie-web` are already installed; existing Lottie effects are present. No reward-animation dependency work is needed here.
- **Comparison:** A/B/C were preserved. At the time of this assessment, D was not added because only a different-pose Rive character was available. The later vector prototype and D comparison are documented in `PROTOTYPE_REPORT.md`.

## Checks and rollback

- Checked Git state before branch creation; all existing edits and untracked A/B/C artifacts remain present.
- Created `experiment/rive-pip-prototype` from the same current commit, carrying the existing worktree changes forward.
- Inspected the approved PNG, source inventories, six Synfig project layer types, Rive metadata, rendered Rive artwork, Expo/RN dependencies, and current runtime requirements.
- No production component, original asset, A/B/C artifact, app dependency, or native project was changed by this assessment.

This assessment was written before the Rive prototype was authored. For the current files, test results, and rollback notes, use `PROTOTYPE_REPORT.md`. To return to the previous experiment branch while retaining the report in the worktree:

```sh
git switch experiment/video-animation
```

To move this untracked report out of the repo before switching (preserving it under `/private/tmp`):

```sh
mkdir -p /private/tmp/igloo-rive-prototype
mv assets/animations/experiments/rive-pip-prototype/ASSESSMENT.md /private/tmp/igloo-rive-prototype/ASSESSMENT.md
git switch experiment/video-animation
```

No files need to be deleted, and the existing A/B/C rollback procedure remains unchanged.

## References

- [Rive React Native runtime requirements and setup](https://rive.app/docs/runtimes/react-native/react-native)
- [Rive MCP Integration](https://rive.app/docs/editor/ai/mcp)
- [Current Rive pricing and runtime exports](https://rive.app/pricing)
