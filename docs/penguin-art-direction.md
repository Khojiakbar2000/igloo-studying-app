# IGLOO penguin art direction and behavior contract

## Identity lock

- Keep the existing round baby-penguin proportions and stable head/body ratio.
- Preserve navy plumage, warm cream face and belly, round brown eyes, small orange beak/feet, peach cheeks, and the chunky muted-teal scarf.
- Preserve the painterly gouache grain, soft cool highlights, and clean dark silhouette edge.
- No new outfit, accessory, species redesign, or face geometry change. Props belong to the scene or action, not the character redesign.
- Keep the full figure and feet/contact area visible at mobile size. For travel, move the complete character as one subject; do not rotate the whole penguin as a substitute for walking.

## Acting vocabulary

| State | Intent | Pose/action cue | Recovery |
|---|---|---|---|
| curious | Notice something new | lean and head tilt; eyes lead toward object | soft centered attention |
| excited | Share a discovery | open beak, lifted flippers, brief buoyant stretch | small landing and settle |
| surprised | Unexpected reveal | widen eyes, raise flippers, hold a short beat | blink and relax |
| confused | Unsure what an object is | asymmetric brow, tilted head, one flipper up | look again or ask user |
| thinking | Consider a choice | gaze up, flipper near beak, still pause | return gaze to user |
| happy | A choice fits | warm open expression, small body lift | calm smile |
| proud | A task is done | chest forward, stable feet, confident look | relax without repeating celebration |
| playful | Invite a shared action | reach/nudge an object; track it with eyes | wait for touch/result |
| sleepy | Low-energy pause | relaxed eyelids and gentle side lean | wake only on a story cue |
| focused | Work alongside user | grounded posture, downward task gaze, minimal motion | look up when session ends |
| encouraging | Reassure | gentle wave, soft smile, eye contact | hands settle beside body |

## Performance rules

- Every one-shot has a cause, anticipation, action, reaction, and settle. Do not loop celebratory movement.
- Prefer eye lead → head/body follow → feet/contact response. Keep scarf secondary and subtle.
- Keep feet on the ground through idle and listening poses. Let the center of mass move before flippers.
- Story actions take priority over idle. Queue or ignore duplicate triggers during hatching, placement, and scene travel; interruption returns to the current chapter's calm pose.
- Keep dialogue short and cue it to the visible action. Taps advance immediately; automatic action beats never gate navigation for more than a brief readable pause.
- Reduced Motion removes repeated loops and travel/squash. It retains static emotional poses, dialogue, choices, and immediate state changes.

## Production layer contract

- App owns semantic state (`curious`, `focused`, `carrying-block`, `celebrating`) and chapter identity.
- Rive owns the authored rig and its motion. The app must not address internal bones as behavior.
- Raster pose sheet is a low-memory, transparent fallback/acting atlas; the master image remains unchanged.
- Stage scenery and props are separate from character pose art. Preserve relative size and a consistent ground line when changing backgrounds.
- Runtime fallback must show a character if Rive fails. Avoid keeping invisible/offscreen looping animations alive.
