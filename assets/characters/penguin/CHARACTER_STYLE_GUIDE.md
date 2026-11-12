# IGLOO Baby Penguin — Character Style Guide

## Master reference

Use [`igloo-penguin-front-gaze.png`](./igloo-penguin-front-gaze.png) as the current source of truth until the design is approved. Preserve its recognizable front-facing baby silhouette, navy-and-cream plumage, warm brown eyes, orange beak and feet, and muted teal braided scarf. The generated [character sheet v1](./review/igloo-penguin-character-sheet-v1.png) and [v2 review sheet](./review/igloo-penguin-character-sheet-v2-review.png) are concept references only; neither replaces the master or serves as a production rig source.

## Design evaluation

The design already reads as a baby penguin at small sizes: the head is large, body round, wings short, feet close to the ground, and eye/beak contrast is strong. Its scarf is a useful signature. Keep the identity and palette. The v2 review sheet adds front, three-quarter, side, and back views plus curious, happy, blink, and sleepy face references without adding accessories. It is an art-direction target, not approved production artwork.

Refinement opportunities for the next approved production pass:

1. Reduce fine fur/paper grain on small features so eyes, beak, and scarf stay crisp at widget scale. Keep the soft painted finish on the large navy and ivory masses, with detail concentrated at larger display sizes.
2. Keep the eyes on a consistent shared baseline and preserve their size and spacing when changing gaze or head angle.
3. Clarify the scarf-to-body overlap and keep its hanging end on the viewer's right in the master pose.
4. Separate head, face patch, eyes/lids, beak, torso, belly, flippers, feet, scarf loop, and scarf tail into clean, overlapping rig layers.
5. Use the feet as a stable ground anchor. Keep idle motion in the torso/head and secondary scarf/flipper motion, rather than translating the whole character upward.
6. Match the head-to-body ratio, eye baseline and spacing, belly width, scarf thickness, and foot spacing across every view. Treat the front master as the proportion anchor; the v2 three-quarter and side images are guides, not exact model sheets.

These are production polish notes, not a request to alter the character's identity.

## Shape and proportion locks

- Front master is upright and symmetrical in its body mass, with a slightly oversized head and a short, softly tapered torso.
- Head tufts are small, rounded, and part of the silhouette; do not turn them into hair or ears.
- Face patch is warm cream and broad, with large round brown eyes and a small centered orange beak.
- Rosy cheeks are subtle accents, not large makeup circles.
- Flippers remain short and paddle-shaped; feet stay small and orange.
- The teal scarf is thick, softly knitted, wraps once, and has one short tail on the viewer's right.
- Keep the character's navy, cream, teal, orange, warm-brown, and blush palette. Avoid adding new signature colors.

## Rendering language

- Soft hand-painted 2D illustration with clean, legible contours and restrained texture.
- Rounded, appealing forms; soft highlights; gentle contact shadow under both feet.
- Avoid photoreal feathers, hard 3D gloss, noisy texture on facial features, sharp spikes, or thin limbs.
- At 64 px tall, check silhouette, eye expression, scarf identity, and foot contact. Simplify details before shrinking the character.

## Pose and expression references

The v1 review sheet explores: front neutral, three-quarter, curious head tilt, happy with raised flippers, blink, and wave. Keep these as acting references only. Before production, redraw or rig each pose from the same layered master so proportions, scarf weave, eye spacing, and outline weight stay consistent.

## Rive handoff

Recommended hierarchy: `root` → `body` → `head`; attach face patch, eyes/lids, beak, and tufts to `head`; attach flippers and scarf to their anatomical pivots; anchor feet to the ground plane. Use small body compression for anticipation/landing, eye direction for attention, and delayed scarf-tail motion for follow-through. Keep the ground anchor fixed in idle, blink, look, and wave states. Blend back through a neutral pose instead of snapping between poses.

Suggested initial states: `idle_breathe`, `blink`, `look_curious`, `wave`, and `happy_bounce`. Allow randomized blink spacing and subtle head/eye offsets. Keep the torso movement low amplitude; the character should remain calm during focus sessions.

### Layer contract for the first editable master

Create clean, named source layers before rigging: `body_back`, `head`, `tufts`, `face_patch`, `eyes`, `eyelids`, `beak_upper`, `beak_lower`, `belly_patch`, `flipper_left`, `flipper_right`, `scarf_back`, `scarf_front`, `scarf_tail`, `feet`, and `ground_shadow`. Split eyes and lids for gaze and blink changes. Draw hidden overlap areas under the scarf and flippers so rotations do not expose gaps. Keep a single ground pivot between the feet. Preserve the original editable source and treat generated images as references; do not slice the review sheet into rig layers.

### Review sheet status

`review/igloo-penguin-character-sheet-v2-review.png` is a generated proposal for human review. It demonstrates the preserved design across views and expressions, but small view-to-view differences remain possible. Approve the visual direction before redrawing the master as editable vector or layered artwork. Then compare the source at 64 px tall and verify the feet remain grounded in representative Rive poses.

## Review gates

- Does the silhouette still match the front master?
- Are both feet visibly grounded, with no unintended floating?
- Do eye size, spacing, and gaze direction remain coherent?
- Does the scarf stay attached and preserve its established side/tail?
- Are shape deformation and texture clean at 1× mobile scale?
- Can the acting pose read without relying on motion blur or background effects?
- Is each generated pose a reference, or has it been rebuilt as editable layers before use in Rive?

