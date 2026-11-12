# IGLOO environment art direction — exterior concepts

## Existing-art audit

- The present environment language is soft, textured storybook painting: cool arctic blues, quiet lavender shadows, pale cream highlights, sparse snow, and rounded line work. `arctic-twilight.png` has strong depth and a welcoming sky, but intentionally leaves the center foreground empty for future staging.
- `igloo-interior.png` already establishes the warm/cool contrast with amber lantern light, an arched nook, soft stone texture, and a small snowy window. Its furniture is attractive but baked into a single raster, so it is a mood reference rather than a reusable furniture set.
- `SceneArt.tsx` currently draws exterior construction stages from simple SVG paths and rectangles. It is readable as a prototype but does not yet meet the illustrated finish requested here: block variation, sculpted light, material texture, and a distinctive entrance are missing.
- The penguin master is a soft gouache-like cutout. It should be used as a size and style anchor. At the entrance, the penguin should read at roughly one third of the igloo’s outside height, with its feet on the same snow plane.

## Style and composition lock

- Medium: soft hand-painted gouache with fine paper/grain texture and delicate blue-gray contour lines. Build edges from subtle value changes; avoid heavy black line art.
- Projection: eye-level three-quarter front view, with the entrance visible and the side wall receding slightly to the right. Keep this same camera, footprint, and entrance direction across construction stages.
- Composition: vertical mobile story frame. Place the igloo in the lower-middle area, snowdrift and footprints in the foreground, layered hills/ice in the distance, and calm negative space in the upper quarter for interface copy. Keep the entrance as the main focal point.
- Shape: wide, low, handcrafted dome with restrained asymmetry; rounded but individually varied ice courses; a short inviting tunnel arch. Avoid a perfect half-sphere and a straight-on circular hole.
- Light: cool diffuse sky light from upper left; soft blue/lavender snow shadows; warm cream-to-amber interior light visible within the tunnel. Glow should illuminate nearby snow gently, without a bloom halo.
- Material: rounded snow/ice blocks with softened corners, varied widths/heights, restrained blue seams, a few thin top-edge highlights, and tiny hand-painted ice inclusions. No repeated identical bricks, noisy scratches, or realistic crystalline detail.
- Snow: a few edge drifts, short readable footprints approaching the entrance, and at most a handful of small ice glints. Leave clean breathing room around the hero structure.

## Palette guide

Values are art-direction targets sampled by eye from existing artwork, not measured source pixels.

| Role | Target |
|---|---|
| Snow light | `#F4F8FC` |
| Snow blue shadow | `#B9CDE4` |
| Deep ice seam | `#819EBE` |
| Cool arctic midtone | `#8DAFDC` |
| Warm interior cream | `#FFE9B9` |
| Lantern amber | `#F4B967` |
| Muted teal accent, matching scarf | `#78A9A4` |

## Concept review criteria

Score each concept 1–5 for silhouette/readability at phone size, warmth, illustration craft, originality, camera/scale clarity, construction continuity, entrance appeal, and future interior/customization potential. Reject any concept with repeated identical blocks, impossible shadow direction, a disconnected tunnel, character/door scale mismatch, excessive texture, or high-bloom glow. Select the strongest overall concept, then refine only the highest-impact weakness.

## Concept exploration — 2026-11-13

Three independent ImageGen concept illustrations were produced in the approved vertical arctic composition. The existing twilight art and character master were used as style and scale references.

| Concept | Readability | Warmth | Craft | Originality | Construction continuity | Entrance appeal | Review |
|---|---:|---:|---:|---:|---:|---:|---|
| Storybook Cozy | 4 | 4 | 4 | 3 | 4 | 4 | Very inviting. The oversized, brightly lit entrance pulls attention away from the whole dome, and the courses feel more regular than intended. |
| Premium Hand-Painted | 5 | 5 | 5 | 4 | 4 | 5 | Strongest overall composition and material finish. The blocks have depth and the warm entry reads immediately. Refine course variation to reduce the remaining brick rhythm; preserve the entrance, camera, and warm/cool light. |
| Minimal Magical | 4 | 4 | 4 | 3 | 3 | 3 | Calm and clean, but the opening is too wide and the large block shapes read as stacked boulders. The small glints and footprints also compete with the doorway. |

**Selected direction: Premium Hand-Painted.** It has the best phone-size silhouette and cold-to-warm focal path while staying close to the existing arctic environment. Its key refinement is more varied interlocking block sizes and a clearer tunnel depth, with fewer bright glints. This direction is selected for production art; the concept file remains non-production artwork.

Concept files: `assets/illustrations/igloo/concepts/igloo-concept-storybook-cozy.png`, `igloo-concept-premium-painted.png`, and `igloo-concept-minimal-magical.png`.

## Construction continuity contract

The exterior master defines fixed camera, center, baseline, dome outline, tunnel, and light direction. Construction assets must add blocks along that same contour and preserve already completed geometry. At 10/25/40/50 minutes the home remains visibly unfinished; only the 60-minute stage receives the completed entrance glow and celebratory dressing. Keep each block, entrance glow, foreground snow, particles, and distant background separately addressable where practical. Do not assume image generation created valid layer separations; inspect alpha boundaries and occlusion manually.

## Production pass and review

The **Premium Hand-Painted** direction remains selected. The production exterior is an integrated portrait environment rather than a transparent cutout: ImageGen repeatedly returned a visible gray/blue halo when asked for isolated transparent snow, which would look like a bad sticker on the existing background. The integrated scene avoids that defect and was visually reviewed at phone-like portrait proportions. It preserves open sky for interface copy, layered arctic cliffs, a clean foreground for the independently rendered penguin, a readable low dome, and a warm arched entrance. The isolated cutout experiments are retained only in the generation workspace, not shipped as production assets.

New artwork:

- [Exterior environment master](../assets/environments/igloo/igloo-exterior-master.png) — approved full-scene painted exterior, with empty upper sky and foreground character space.
- [Interior concept](../assets/environments/igloo/igloo-interior-concept.png) — warm study-room concept with rounded desk/chair, shelf, lamp, window and rug. It is a single baked illustration, so it is a scene concept rather than a customizable furniture kit. The prior interior remains in the project unchanged.
- [Construction contact sheet](../assets/illustrations/igloo/stages/igloo-construction-contact-sheet.png) — five aligned phases from loose blocks through a glowing completed home. The sheet is cropped into optimized JPEGs `igloo-stage-1.jpg` through `igloo-stage-5.jpg` (about 44–56 KB each) for the app.
- The three concepts remain in `assets/illustrations/igloo/concepts/` as review sources.

The construction views are now selectable from the five milestone labels in onboarding. Each stage keeps the same dusk landscape and approximate igloo position; selecting a milestone also updates the penguin's carry/celebration pose. Reduced motion disables the short art reveal. This is an explanatory stage viewer, not yet a true block-by-block Rive construction animation: the contact sheet does not provide clean, independently occluded snow-block layers, and using it as a moving sequence would imply continuity it does not have. The next animation production step needs separately illustrated block layers and a verified Rive composition with grounded carry/place timing. The onboarding's existing drag interaction is still the direct block-placement moment.

The discovery chapter now uses the painted exterior environment with the existing penguin rendered separately. First-focus scenes use the new interior concept, providing the exterior-to-interior scene change within the existing progression. The environment artwork does not include or alter the character master.

## Skill application and limits

- `imagegen` was applied as documented for three independently generated concept directions, a refined isolated exterior attempt, a new full-scene exterior, an interior concept and a five-phase construction contact sheet. Each was visually inspected. The halo defect in the cutout attempt drove the choice of a full-scene production environment. The contact sheet was manually reviewed before cropping; no automatic layer separation is claimed.
- `rive-animation` and `natural-2d-character-animation` remain applicable to the project's penguin rig and existing expressive behavior system. They informed the requirement to keep character movement separate from the environment, preserve ground contact and use purposeful carry/celebration acting. No new Rive igloo construction animation has been authored in this production pass.
- `img2game2d` was previously invoked for the penguin pipeline; its documented image-analysis scripts could not run because Pillow and NumPy were missing. Its downstream exports did not provide a verified Rive environment animation path. No dependency installation or unreviewed script execution was performed.
- There is no installed dedicated game-art-director, environment-design or professional-illustration skill in the available catalog. The separately investigated Game Art Director and Art Director Loop repositories were not installed because their licensing was not established; they are not claimed as applied skills.
