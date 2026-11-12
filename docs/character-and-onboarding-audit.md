# IGLOO character and onboarding audit

## Baseline

Reviewed the onboarding flow, app entry/navigation, `Penguin` web/native implementations, hatchery, environment art, current character PNG, and `igloo-penguin-front-gaze.riv`. The current character master is worth preserving: its round silhouette, warm face, knitted teal scarf, brown eyes, and soft textured finish are recognizable and cohesive. The existing arctic backgrounds also provide a useful base for a more cinematic story.

## Why the character reads as passive

| Area | Finding | Assessment |
|---|---|---|
| Movement | The character is usually a stationary illustration. Only hatching has a small app-side emergence movement; there is no path between story spaces, approach, prop contact, or weight transfer. | Weak |
| Facial expression | Most scenes reuse one PNG/Rive appearance. App code exposes only `happy` and `hatching`; selections do not set gaze, expression, or pose. | Weak |
| Interaction frequency | The egg and snow block are tactile, but naming, personality, activities, and duration mostly change labels/cards. The penguin does not initiate a meaningful action in response. | Low |
| Animation quality | The authored Rive files do play, but playback alone is not quality evidence. `riv_critique` on the existing idle sampled six frames and reported no transform motion; the frames were nearly identical apart from a blink. The happy pose also barely changes the silhouette. | Weak |
| Dialogue | Copy is friendly but sits as static screen text. It has no speech-bubble treatment, action cue, or clear timing relationship with character behavior. | Basic |
| Composition | The hatch scene uses one pale snowfield with substantial empty space; other chapters often place a centered figure over a UI-like form. Existing twilight and igloo interior art have stronger depth and atmosphere but are not used to carry this story. | Uneven |
| Visual hierarchy | Headlines, detail copy, mascot, choices, and CTA are legible, but many chapters share the same top-copy / center-art / bottom-button layout. | Repetitive |
| Art consistency | The master illustration and environment images share soft textures and a cool palette. The Rive hatchery is simpler and flatter, so hatch-to-character art transitions are especially noticeable. | Mixed |
| Transitions | Chapter changes largely fade the screen content. The character does not travel with the camera or lead the transition. Timed hatch choreography is split between Rive triggers and independent React timers. | Weakly connected |
| Engagement | The current flow has a useful 10-step structure and preserves back/skip navigation, but personality is not demonstrated through play. The story explains the app more often than it lets the player participate in it. | Needs work |

## Current animation and runtime evidence

- `Penguin.web.tsx` and `.native.tsx` bind only the Rive `Character.happy` trigger. A tap anywhere on the character fires the same reaction. The fallback PNG is static.
- `usePenguinMotion` covers hatch emergence only; it is not a general semantic controller.
- The warm hatchery Rive has `tapOne`, `tapTwo`, and `hatch` inputs, while the React flow schedules appearance and celebration separately. Those timers can drift from authored motion.
- The existing master PNG is 1199×1312 RGBA, with soft painterly shading and clean alpha. Its proportions and silhouette are suitable to extend.
- The existing arctic twilight and igloo interior environments are already layered and polished. They should carry chapter staging instead of replacing good artwork gratuitously.
- A new Rive rig was produced from the approved master at `assets/animations/igloo-penguin-companion-v1.riv`. Its render preserves the artwork, adds eyelid shapes and a head-tilt mesh, and has `idle` and `happy` motions plus the existing `happy` trigger. This improves the motion baseline, though semantic story poses are supplied by the acting sheet and app controller.

## Art and animation skills

| Skill | Use and compatibility |
|---|---|
| `natural-2d-character-animation` | Applied its inspect → beat map → light rig → semantic controller → filmstrip review workflow. The Rive critique of the old asset revealed the static idle; the new rig and a 12-pose acting sheet establish a reusable pose vocabulary. |
| `rive-animation` | Applied its existing-reference gate, preserving the visible master artwork; reviewed anatomy, attachment, hierarchy, scale, playback, and runtime responsibilities. New art is a separate versioned file. |
| `imagegen` | Used built-in ImageGen in edit/reference mode with the inspected approved penguin master. Generated an expression/action sheet without changing the master character design. |
| `img2game2d` | Started its mandatory state workflow and ran the documented probe/style intake steps. Both returned an explicit Pillow/NumPy-missing result, so the image-analysis and extraction steps cannot run without installing dependencies. Its documented export targets do not include Rive. No packages or scripts were installed/executed without review. |
| Game Art Director, Art Director Loop | Previously inspected. The repositories did not surface a license file; not installed. Their art-direction checklists can inform critique, but their installability/licensing is not established. |
| UX_Skills illustration | Previously inspected as MIT, but the relevant grainy-gouache guide prescribes a hot-pink palette and disallows IGLOO's blue/teal, so it is not suitable for this character's style. Not installed. |

## Direction for the redesign

1. Keep the approved penguin silhouette, palette, face, and scarf as the identity lock.
2. Give each story beat an authored emotion/action pair; avoid ambient movement that has no cause.
3. Put short dialogue in a consistent speech bubble next to the character, with the CTA available immediately.
4. Use the existing twilight and interior scenes selectively to add narrative depth; reserve the snowfield for the opening.
5. Connect choice events to pose and reaction, then settle to a quiet pose. Keep the app controller semantic; animation files own their internal rig details.
6. Keep Reduced Motion as a first-class path: show the same story state and selected pose without travel, looping movement, or delayed controls.

## Validation still required

The web preview is available locally at `http://localhost:8081/?preview=onboarding`. Every chapter needs a rendered pass at phone width, including forward/back transitions, selection response, timer handoff, and reduced-motion behavior. Native Rive playback still needs an actual device/runtime pass; browser playback is not evidence for native.
