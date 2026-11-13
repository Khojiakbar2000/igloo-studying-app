# IGLOO continuation note

Last updated: 2026-11-14

## Current state

- The working branch is `develop`; the latest world-concept commit is local and ahead of `origin/develop`.
- My Igloo and Study Together concept screens are wired into `App.tsx` with room art and the `RoomCharacterOverlay`.
- Pip's chair sequence uses a constant root scale and ImageGen-created contact, settle, and seated-rest poses. Prompt and source art are under `assets/animations/pip-chair-performance/`.
- The web preview was blank because `RoomCharacter.web.tsx` called `Image.resolveAssetSource`, which React Native Web does not provide. It now preloads the frames with hidden React Native `Image` elements instead.
- The overlay now sets Pip's initial floor anchor before the preloader finishes, avoiding a clipped character at the top-left during startup.
- The current local preview is `http://localhost:8085/?preview=igloo-room`. The existing Expo process can disappear between sessions; start it with `npm run web -- --port 8085` and use a free port if 8085 is occupied.
- `npm run build:web` succeeds after the web-preload fix.

## Next work

1. Open the local Igloo preview and review Pip's full walk-to-chair sequence at normal speed, including the web preload period.
2. Improve the walk-to-chair path and chair contact/foot placement if the rendered acting still feels like a pose sequence instead of a natural climb.
3. Keep Pip's scale constant and use the existing room perspective and floor anchors as references.
4. Do not claim a polished Rive animation: the added chair beats are raster key poses; the existing Rive rig is still separate.
5. If multiplayer work resumes, treat Study Together as concept art/local animation only; Supabase multiplayer is not implemented.

## Git workflow preference

Only push when the user explicitly asks. For an authorized push, update `develop` first, then merge `develop` into `master`, and push `master`.
