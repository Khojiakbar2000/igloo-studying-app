# IGLOO interior master and occlusion review

## Art direction and result

The refined master uses Study 2 as the layout and navigable-floor foundation, Study 1 for the warm painted storybook finish, and Study 3 for curved cave architecture and soft atmospheric light. The camera was pushed to a three-quarter view: the ceiling and side walls recede around a broad floor that widens toward the viewer. Furniture remains attached to the walls and the center lane is kept open between the entry and the activity areas.

At full resolution the curved blockwork, cool blue-violet environmental shadows, warm desk lantern, and differentiated furniture surfaces read as one illustration. At the 384 × 576 portrait review size, the room silhouette and key landmarks remain legible. The separate penguin scale plate places the existing character on the floor; it is a visual scale check, not a production composite layer.

## Files for review

- [Refined master composition](../assets/environments/igloo/igloo-interior-master.png)
- [Master with penguin for scale](../assets/environments/igloo/igloo-interior-with-penguin.png)
- [Comparison with Study 2](igloo-interior-master-comparison.html)
- [Perspective, navigation, and layer diagram](igloo-interior-navigation.svg)
- [Editable art-direction and prompt record](../assets/environments/igloo/igloo-interior-master-source.md)
- [Occlusion prototype source](../src/scenes/IglooOcclusionPrototype.tsx)

## World and navigation plan

Use normalized world coordinates `X = 0–100` left to right and `Z = 0–100` from the far wall toward the camera. The character origin is the center of its feet. The drawn floor polygon is approximately `(8,8), (95,8), (100,39), (94,77), (86,90), (51,100), (17,90), (4,39)`. These are planning coordinates projected onto the painted master, not final collision data.

| Destination | Anchor `(X,Z)` | Furniture footprint / note |
| --- | --- | --- |
| Entry | `(14,18)` | Back-left arch and clear route into the room |
| Bed | `(21,40)` | Compact against left wall; approach from open center |
| Window | `(48,16)` | Far wall; keep approach lane clear |
| Bookshelf | `(76,24)` | Rear-right curved wall |
| Desk and chair | `(66,47)` | Desk against right wall; chair pulled into floor space |
| Rug / rest | `(43,55)` | Centered in open area, not a movement blocker |

The diagram defines a locked-yaw camera, zoom range `1.00–1.18`, and limited pan (at most 8% of width and 6% of height). Keep a planted foot anchor; use approximately `0.57×` chair height for the penguin at the master position, scaling only from `0.90×` at the far depth to `1.06×` near the camera. Recalibrate all footprints and anchors against separated production art before shipping navigation.

## Occlusion proof

Preview: `http://localhost:8081/?preview=igloo-occlusion` (add `&depth=behind`, `&depth=overlap`, or `&depth=front` to select a fixed pose). With the Expo web server running, this displays the existing Rive penguin and temporary chair. The penguin travels along a single floor path while chair layers change painter order:

1. Behind: penguin is drawn before the chair.
2. Partial cover: chair back and seat, then penguin, then the chair's front legs.
3. In front: all chair pieces, then penguin.

This is sufficient to demonstrate the needed depth behavior in the browser without Skia or added packages. It uses an explicit chair split because one depth value for the whole chair cannot produce the overlap. Browser rendering was visually inspected at all three placements. The crossing is a controlled depth-test glide, not a finished walk cycle; the existing Rive character exposes idle and happy, with no authored walk animation. Native Rive and native React Native compositing still needs a device check before the same layering is committed to the production room.

## Layer plan

- **L0 — static rear environment:** curved cave walls/ceiling, far window, fixed architecture.
- **L1 — rear furniture planes:** chair back and rear rails, deep furniture surfaces.
- **L2 — walkable plane:** floor shading, grounded character sorted by foot-anchor Z, contact shadow.
- **L3 — foreground furniture planes:** chair seat/front legs and any surfaces that must cover the character.
- **L4 — near architecture:** foreground doorway lip or near wall edges.
- **Lighting overlays:** cool ambient fill and window light, separate amber lantern pool, restrained snow/ice sparkle, and character contact shadow.

The exact cut lines must follow the chosen perspective and furniture construction. Do not auto-cut the master painting and ship those edges: the master and scale plate are flattened raster artwork. The prompt record and SVG plan are editable, but a layered paint source and production asset export are not delivered in this stage.

## Comparison and technical boundary

Study 2 established the room zoning and furniture arrangement. The new master retains that utility while changing the view from a flatter isometric study to a deeper, curved interior with an open foreground lane, a more enclosing ceiling, and warmer localized light. The composition is a concept master; the diagram records approximate world-space intent. It is not yet a fully navigable scene, and no complete set of separated furniture or construction assets has been produced.

No Skia dependency or full room system was introduced. The prototype shows that split foreground/background art with sibling painter order is a viable first approach for this single chair case. It does not yet prove every chair angle, native Rive interleaving, occlusion against walls, or production navigation paths.
