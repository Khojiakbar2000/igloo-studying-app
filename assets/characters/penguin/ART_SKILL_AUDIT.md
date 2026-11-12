# IGLOO character art skill audit

Reviewed 2026-11-13 before installing or running third-party code. No third-party installer or helper script was run.

## Findings

| Source | License and dependencies | Codex fit | Decision |
| --- | --- | --- | --- |
| [Game Art Director](https://github.com/roohe/agentic-super-skills/tree/master/skills_library/game-art-director) | No repository license file was found. The skill itself has no package dependencies; it describes optional Figma, Hugging Face, Blender MCP, and ComfyUI integrations. | The folder format is readable, but its frontmatter requires the Claude `opus` model and Claude-style `allowed-tools`; its workflow also assumes companion director roles. | Do not install or copy without a license. Apply its useful principles manually: preserve silhouette, document visual rules, and make feedback specific. |
| [Art Director Loop](https://github.com/Atmosaero/art-director-loop) | No repository license file was found. No runtime package dependencies are listed. It needs image inspection and rendered artifacts; its full validation prefers independent maker/judge contexts. | The `SKILL.md` is a portable Codex-readable skill. The judge fallback permits disclosed self-review, though independent validation is unavailable in this session. | Do not install without a license. Its preserve-identity refinement workflow informed the review sheet. |
| [img2game2d](https://github.com/MrFaraidun/img2game2d) | Apache-2.0. Python 3.9+; required packages include Pillow and NumPy, with `jsonschema`, `rembg`, and OpenAI support optional. | Explicitly supports Codex. Already installed globally at `/Users/aaaaa/.codex/skills/img2game2d`. The local checkout is v3.0.0 while `SKILL.md` frontmatter still says 2.0.0; verify step instructions against the current files before running its pipeline. Its exporters target sprite/Spine/Godot/Unity/Phaser/PixiJS, not Rive. | No extra install needed. Use its layer contracts and evidence gates as guidance; keep the existing Rive workflow for animation. No pipeline scripts were run. |
| [Illustration Skills](https://github.com/mkottaichamy/UX_Skills) | MIT license; the repository is a fork of MengTo/Skills. The selected `illustration-grainy-gouache` skill is hand-authored SVG with optional repository render/lint helpers; the skill text does not declare external package requirements. | The repository explicitly supports Codex. | Do not install this style for IGLOO: its fixed hot-pink background and rules forbid blue/teal, directly conflicting with the approved navy-and-teal character palette. |

## Pipeline choice

Use the existing `igloo-penguin-front-gaze.png` as the identity anchor, ImageGen for controlled visual exploration, a reviewed editable layer source for the production master, and Rive for authored movement. ImageGen review sheets are references rather than layer sources. The current `.riv` workflow remains the animation path; do not use a sprite exporter as a substitute for Rive.

The installed `img2game2d` skill, ImageGen guidance, and Rive guidance were already available in this Codex environment. None of the newly reviewed repositories met both the licensing and project-fit bar for a new installation.

## Current character assessment

- **Keep:** rounded baby silhouette, large navy head, cream face/belly, warm brown eyes, centered orange beak, small feet, subtle blush, and the viewer-right teal scarf tail.
- **Refine:** reduce texture on small facial features and scarf stitches; hold eye baseline/spacing and head-to-body ratio across views; clarify scarf overlap and retain a fixed foot anchor.
- **Production gap:** `igloo-penguin-rig.png` is a flattened raster image despite its filename. The current art set does not provide the named editable layers needed for reliable Rive deformation. Draw hidden overlap under scarf and flippers before building the production rig.
- **Review proposal:** [character sheet v2](./review/igloo-penguin-character-sheet-v2-review.png) shows a front, three-quarter, side, and back view plus curious, happy, blink, and sleepy expressions. Treat it as a provisional review concept; approve before replacing or redrawing the production master.

## Page 9 note

In `src/onboarding/OnboardingFlow.tsx`, page index 9 is the final `completion` step. Its footer action is named **SEE OUR WORLD** and calls `onComplete`; there is no later onboarding page. This is a final-step label change, not a missing transition in the flow.
