# Igloo continuation note

## Wardrobe · 2026-11-28

Headwear fittings in `src/wardrobe/fitting.ts` now span Pip’s head and draw the headphone band in front. The direct wardrobe preview saves real equipment by default; `demo=1` enables samples. RoomCharacter preserves equipped headwear at rest. Mobile Chrome verified Equip, three poses, Today, profile, room, and reload for both items. Captures are `/private/tmp/headwear-*.png`. Typecheck and five fitting tests pass. Native rendering remains unverified.

## Palette and Today · 2026-11-27

App-wide winter tokens live in `src/theme.ts`. Today uses half-scale Pip and a scene progress footer. Typecheck, 50 state tests, and web export passed.

## Onboarding · 2026-11-22

Pip’s layered animation is implemented in `src/onboarding/OnboardingPip.tsx` and `pipStorybookMotion.ts`. The flow retains authored Lottie story clips. Chrome (390×844) covered all 20 screens, wave, breathing, blinking, celebration, name and goal selection, discovery taps, and reduced motion. Typecheck and both onboarding reminder tests passed. If onboarding resumes, verify native iOS and Android playback.



## Room concepts · 2026-11-14

`App.tsx` wires My Igloo and Study Together concepts through `RoomCharacterOverlay`. The chair sequence uses constant root scale and raster contact, settle, and rest poses under `assets/animations/pip-chair-performance/`. `RoomCharacter.web.tsx` preloads via hidden `Image` elements, and the overlay sets the initial floor anchor before preloading finishes. Web export passed after the preload fix. Supabase multiplayer remains unimplemented.



## Working tree and Git

Release verified on 2026-11-28 with TypeScript, 55 tests, and web export. Deployment follows develop commit/push, master merge/push, then Vercel production verification. Local agent tooling stays uncommitted.
