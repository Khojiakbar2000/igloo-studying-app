# IGLOO World Direction — Milestone 1 Review

**Status:** concept review. The paintings below are direction studies, not production-ready scene layers.

## Existing art and character audit

- The existing room master already establishes the selected three-quarter view, curved snow architecture, blue-lavender ice shadows, amber lantern light, and a wide central floor. Its bed, desk, chair, bookshelf, entrance, and window give us a sound layout foundation.
- The master is one flattened painting. Furniture cannot yet be moved, characters cannot pass behind it, and personal props cannot be customized independently.
- Pip's identity is well established in `assets/characters/penguin/CHARACTER_STYLE_GUIDE.md`: round navy-and-cream baby silhouette, large warm-brown eyes, orange beak and feet, restrained blush, and the viewer-right knitted teal scarf tail. Keep these as locks; vary only small friend cosmetics.
- `src/character/CharacterBehaviorController.ts` already provided semantic expressions/actions for onboarding. Milestone 1 now adds explicit source priorities, home destinations, focus locking, and return-to-focus behavior. `src/character/PersonalHomeBehavior.ts` defines the personal-home beats and deterministic idle routine. The current home and room screens still show static character art; these semantic events are not yet connected to room movement.

## Shared visual language

- **Projection:** one slightly elevated three-quarter camera; visible floor depth, far curved wall, and enclosing side returns. The personal room and shared hall use the same floor horizon and light direction.
- **Materials:** irregular rounded ice blocks with soft painted texture, cool lavender-blue seams, warm hand-painted wood, woven textiles, and clean silhouettes. Keep texture on large forms and preserve crisp small facial details.
- **Light:** diffuse cool fill from the upper left; one controlled amber light pool around the lantern and nearby work surface; soft contact shadows beneath furniture and feet.
- **Scale:** use Pip's master proportions as the character anchor. Place both feet on the room floor plane. In the communal room, perspective may make the rear pair smaller, but every face and seat must remain readable at portrait mobile size.
- **Depth:** leave a central walk lane and distinct furniture footprints. Future artwork should split rear architecture, floor, interactive furniture, character, and foreground occluders; the concept images are not suitable for pixel-perfect extraction.

## Environment distinction

### My Igloo — familiar and personal

Keep the compact arrangement from the current master: bed along the left wall, desk and chair to the right, round window at the far wall, bookshelf, and back-left entrance. The concept adds a favorite ceramic mug, Pip's small penguin-and-igloo drawing, books, pencils, an open notebook, and a folded blanket. These details tell a personal story while leaving the central path open.

### Study Together — spacious and shared

Make the room visibly larger and more public while keeping the same architecture and materials. Four separate desk-chair stations sit in staggered pairs along the side walls; a central rug and hanging lantern provide a shared center; a panoramic snowy window, side bookshelves, and visible entrance establish the common place. Each penguin has a distinct seat anchor and a small scarf color variation within the existing muted palette.

## Character behavior contract

The room director should issue semantic beats with destination, action, emotion, dialogue, source, and priority. A renderer can then translate each beat into the existing movement and Rive systems.

| Priority | Trigger | Example beat | Rule |
|---|---|---|---|
| 100 — session result | Focus completes | Celebrate once, then settle | Preempts all lower-priority activity |
| 90 — focus mode | Focus starts or resumes | Prepare at desk, then read quietly | Cancels roaming; suppresses ambient movement while the timer runs |
| 80 — direct interaction | User taps an object | Look at it, approach, perform its action | Interrupts low-priority activity and returns to the selected task |
| 40 — arrival/context | Room entry or break starts | Greet at entrance; look out the window on a break | One contextual action, then settle |
| 10 — autonomous | Long idle while not focusing | Visit the window, read, or rest | Deterministic rotation with a cooldown; never random loops or repeated bouncing |
| 0 — quiet idle | No active request | Grounded breath, occasional blink | Minimal movement |

Home beat palette: greet at the entrance; explore to the window; read by the bookshelf; rest on the bed; prepare at the desk; focus with subdued page-turning; celebrate a completed session. A beat follows `anticipate → walk → arrive → interact → settle`; focus and session-result events can interrupt or cancel it. Keep both feet grounded and scarf follow-through small. Reduced motion skips travel while retaining the resulting pose.

Controller priorities are centralized in `CHARACTER_SOURCE_PRIORITY`: autonomous 10, story/context 40, focus 85, direct user interaction 90, and completion 100. `setFocusActive(true)` holds a quiet desk-study state, rejects autonomous events, and restores that state after brief direct reactions. Home presets carry their destination and semantic cue together; autonomous beats rotate deterministically through window, bookshelf, and bed after a 90-second cooldown. The room renderer and movement paths are the next milestone, so this controller is not presented as visible navigation yet.

## Concept review

Both concepts are 1024 × 1536 PNGs generated with the installed ImageGen workflow. The existing room master and Pip master were supplied as labeled layout/style and character-identity references. Each image was inspected at full size.

| Concept | What works | Next refinement before production |
|---|---|---|
| [My Igloo — lived-in concept](../assets/environments/igloo/concepts/my-igloo-lived-in-concept.png) | Preserves the compact room and cool/warm contrast; adds the requested drawing, mug, stationery, and folded blanket. Pip's seated writing pose gives the room an immediate activity. | Keep the desk mug and drawing as separate assets; confirm the walking lane and chair approach in the actual layer plan. |
| [Study Together — four-seat concept](../assets/environments/igloo/concepts/study-together-four-seat-concept.png) | Shows four desks, chairs, and penguins, with the panoramic window, central lantern, shared rug, shelves, entrance, and a broad middle lane. Matching ice and lighting connect it to the home. | Increase the rear pair's character readability slightly and verify all four chair approach paths at the final mobile crop. |

These are concept paintings; furniture edges, hidden surfaces, depth masks, and per-character animation layers have not been separated or repaired. Do not wire these flattened images into the interactive room as final assets.

## Skills and workflow evidence

- **ImageGen:** applied for two separate, reference-guided concept calls; project assets were copied into the repository and visually inspected. Prompts locked the existing room's perspective/materials and Pip's character identity, then specified distinct personal/shared layouts.
- **Game Art Director / Art Director Loop:** no dedicated compatible art-direction skill is installed. The prior repository audit found license or compatibility issues, so this pass uses the project's existing art-direction guide and review criteria rather than claiming either remote skill.
- **Natural 2D character animation:** the installed workflow's inspect-first, semantic state, reusable controller, grounded contact, and anticipation/action/settle guidance informed the home beat contract and priority API. No new Rive performance was authored here.
- **Rive animation:** existing files and React Native/web integration were inspected. No new Rive asset was authored in this concept milestone; the behavior contract above is the handoff for the next scene implementation.
- **img2game2d:** installed but not used for these flattened environment concepts. Its staged sprite pipeline does not provide the room composition or React Native depth integration needed here.

## Milestone boundary

This review locks the proposed visual language and behavior priorities for the next stage. It does not implement furniture navigation, personal-home scene layers, multiplayer presence, Supabase rooms, or shared timers. The next production step is to approve this direction, then prepare an editable My Igloo layer plan and integrate the home behavior events with the actual room scene.
