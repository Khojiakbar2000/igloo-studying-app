# IGLOO Interior — Phase 1 Audit and Concept Review

Date: 2026-11-13  
Status: **concept review only**. No scene renderer, furniture layers, or navigation have been implemented in this phase.

## Existing project audit

- The installed stack is Expo 54.0.38, React Native 0.81.5, React 19, with the New Architecture enabled. `App.tsx` is the app shell and currently switches among home, igloo, friends, and profile screens.
- The current igloo view composes a static background image, a simple `Igloo` component, and the penguin. `assets/environments/igloo/igloo-interior.png`, `igloo-interior-mobile.jpg`, and `igloo-interior-concept.png` are complete flattened illustrations. They are not independently movable room layers.
- The penguin has native and web implementations. Native uses `rive-react-native` 9.8.6; web uses `@rive-app/react-canvas` 4.39.0. `@rive-app/react-native` 0.5.13 is also installed, so two native Rive packages are present. Existing `.riv` character and construction assets are under `assets/animations/`.
- Reanimated 4.1.7 is installed. React Native Skia and React Native Gesture Handler are not installed. There is no existing world-coordinate scene graph, depth sorter, camera controller, or furniture interaction registry.
- The project contains an exterior master and a penguin master, which are the visual anchors used for these studies. The existing room concept is a useful mood reference, not a dimensional or animation-ready scene.

## Rendering feasibility

The app can support a 2.5D room without introducing a 3D engine. A scene made from perspective-matched raster layers, a single Rive view, and a shared room-space coordinate model is a plausible first implementation. A small number of explicit depth bands can let the whole penguin pass behind or in front of selected furniture. Furniture that must occlude only part of the penguin will need split foreground/background artwork or a verified compositor.

Skia is not installed, so there is no current Skia/Rive interoperability evidence in this app. Rive is currently rendered as a separate native view (and a canvas-backed component on web); it cannot be depth-sorted internally with individual pixels from a Skia scene merely by changing React sibling order. Before choosing Skia, prototype compositing on native and web. If that prototype is not reliable, use ordered React Native image/Rive layers for the first version. Keep camera transforms, object anchors, penguin feet, and interaction targets in one room-space coordinate system, then project into screen coordinates once. Reanimated is already available for camera easing; a gesture dependency can be evaluated only if the selected interaction design needs it.

The main technical risk is not drawing the room. It is getting trustworthy partial occlusion and keeping the same perspective and touch mapping on native and web. The concept approval should lock the room projection and major object footprints before layered art production.

## Skill audit

| Candidate | Verification and useful guidance | Decision |
| --- | --- | --- |
| Built-in `imagegen` | Local skill instructions were read and followed: use separate calls for distinct concepts, label references, inspect results, and copy project-bound outputs into the workspace. No external script or dependency was used. | **Applied** to create the three review studies. |
| Local `rive-animation` | Installed skill instructions were read. Its scene-scale, depth, runtime, and visual-playback verification guidance is relevant to later character integration. | **Keep and use in the next phase.** No Rive animation was authored for this static-concept phase. |
| Local `natural-2d-character-animation` | Installed and read. Relevant to character acting, foot contact, anticipation, and transitions once the character is moving through the room. | **Keep for navigation/interaction animation.** Not claimed as an animation deliverable here. |
| Local `img2game2d` | Installed and read; its staged asset pipeline is real and potentially useful for sprite/object prep. It is aimed at character/object processing and exports such as Godot, Unity, Spine, Phaser, and PixiJS, rather than a perspective room scene for React Native. It requires its own Python pipeline and state gate. | **Inspect only; do not run its scripts or add dependencies for this phase.** Reassess for a clearly bounded asset task later. |
| `0xheycat/isometric-game-skills` | Repository, MIT license, and `SKILL.md` files for art direction, Canvas2D rendering, depth sorting, and pan/zoom were verified. The art guide gives a useful style-sheet sequence (projection, light, palette, scale, shading, reference). The renderer assumes a Canvas2D tilemap and the art guide fixes a strict dimetric projection, which may not match the existing painterly three-quarter character. | **Use selected principles as planning guidance; do not install the renderer or its pipeline.** Not an Expo/Rive scene system. No third-party scripts executed. |
| `Atmosaero/art-director-loop` | Repository and `SKILL.md` exist; installation documents `npx skills add` or cloning. No repository license was visible in the inspected root, so reuse terms are unclear. Its full validation expects fresh maker and judge contexts; the README says self-review is provisional. | **Do not install.** Three visible concepts and this disclosed review are not a claim of a fully validated Style Kit. |
| `roohe/agentic-super-skills` Game Art Director | Repository and `SKILL.md` exist. The skill gives useful style-guide and reference-board discipline, but its workflow assumes Figma/HuggingFace/Blender/ComfyUI MCPs and tool names/model routing that are not part of this project's configured workflow. No root license was found in the inspected repository listing. | **Do not install.** We can use its concrete art-direction principles without importing an unlicensed, MCP-dependent bundle. |
| `mkottaichamy/UX_Skills` Illustration Skills | Repository is MIT and advertises Codex support. Its library targets broad product/web illustration and UI workflows; the previously inspected illustration recipe pushes a grainy gouache/hot-pink visual treatment that conflicts with IGLOO's established cool snow and warm lantern palette. | **Do not install for this environment.** It would impose a mismatched style and duplicate available image/illustration workflows. |
| Remote Rive animation skill | `jeongjin98/rive-animation-skill` has a Codex-ready `SKILL.md`, MIT license, and no bundled runtime dependency. The repository provides instructions only. | **Do not install; redundant** with the installed local `rive-animation` skill. |

No external skill was installed, and no unreviewed installation script was run. The candidate repository/install details are linked in the review response.

## Provisional perspective and lighting guide

These are working constraints for concept comparison, not an approved production bible:

- **Camera:** front-left, slightly elevated three-quarter cutaway; show the floor plane, back wall, and both side returns. Keep one camera for the room, penguin, furniture, and future props. Do not call the concept true isometric until the projection is measured and locked.
- **Scale and anchors:** use the supplied penguin master for proportions. Place its ground anchor at the feet. Furniture footprints and tap targets should be attached to the same floor plane; nearer floor objects can grow slightly, but no freehand per-object scale changes.
- **Light:** soft cool upper-left fill across the ice, consistent contact shadows under all floor objects, and a local cream/amber pool from the lantern. Avoid bright bloom and unrelated light directions.
- **Palette:** snow cream and pale cyan for lit ice; lavender-blue for shadow; restrained warm wood, muted peach/rust textiles, and amber at the lantern. Keep the warm interior as an accent, not an overall orange wash.
- **Material and shape:** irregular rounded ice blocks with legible seams; furniture has soft painted wood and fabric, rounded corners, and imperfect hand-painted edges. Preserve silhouettes and open walking lanes between entrance, bed, desk, shelf, and window.
- **Depth plan to prototype later:** rear architecture/furniture, walkable floor and character, then foreground architecture/furniture. Any chair or desk that the penguin needs to pass partly behind must be split at a natural silhouette boundary or verified with a masking solution.

## Three original composition studies

All three are 1024 × 1536 PNG concept images generated with ImageGen and reviewed at full resolution. Existing penguin and exterior illustrations were supplied as references. Each image is a concept painting; none is approved production art or separated into layers.

1. **Cozy storybook interior** — [View study](../assets/environments/igloo/interior-concepts/igloo-interior-storybook.png). Warmest narrative read, clear welcome from the doorway, and the penguin has generous floor space. The room reads more like a front-facing storybook cutaway than an isometric space; the outside scenery and large front snow lip would need simplifying for a navigable room.
2. **Premium hand-painted isometric interior** — [View study](../assets/environments/igloo/interior-concepts/igloo-interior-handpainted-isometric.png). Strongest object separation and clearest visible floor, furniture footprints, and likely walk paths. It gives the best starting point for a depth-layer prototype, though the projected camera and crowded foreground rim still need a controlled redraw.
3. **Soft dimensional winter sanctuary** — [View study](../assets/environments/igloo/interior-concepts/igloo-interior-winter-sanctuary.png). Strongest sense of enclosure, dimensional snow forms, and lantern warmth. Its closer crop and narrower floor make it less suitable for navigation until the room is opened up and furniture spacing increases.

### Comparison (1–5, concept-stage visual review)

| Study | Appeal | Originality | Silhouette/readability | Warmth | Navigation/layer potential | Construction consistency | Interior customization |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Storybook | 5 | 4 | 4 | 5 | 3 | 3 | 4 |
| Hand-painted isometric | 5 | 4 | 5 | 4 | 4 | 4 | 5 |
| Winter sanctuary | 5 | 4 | 4 | 5 | 3 | 4 | 4 |

**Provisional recommendation:** develop Study 2's floor readability and object placement, borrowing Study 1's welcoming warmth and Study 3's soft snow depth. This is a recommendation for the next composition pass, not a locked direction. The full scene build remains gated on your approval.

## Next approval gate

Choose a study (1, 2, or 3), or approve the provisional blend. The approved direction will be refined into a mobile-size master composition and a perspective/lighting sheet before any furniture is separated or scene code is built.
