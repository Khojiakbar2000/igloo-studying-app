# Igloo development guide

Read this file first for each task. If it is already in the current context, use that copy. Check for instructions nearer the files you edit.

## Architecture map

Igloo is a React Native and Expo app with TypeScript. `App.tsx` mounts the providers, routes first-run onboarding, and switches tabs through `src/ui/BottomNav.tsx`.

| Tab | Route | Start here |
| --- | --- | --- |
| Today | `home` | `HomeScreen` in `App.tsx`; goals and focus progress in `src/components/TodayGoals.tsx` |
| My Igloo | `igloo` | `src/components/CustomizableHome.tsx`; room layout and lighting in `src/home/`, furniture in `src/furniture/` |
| Study Together / Friends | `friends` | `FriendsScreen` in `App.tsx`; room selection in `src/components/StudyRoomSelector.tsx`, room data in `src/scenes/studyRooms.ts` |
| You | `profile` | `src/profile/StudyProfileScreen.tsx` and `ProfileSettings.tsx` |

- **My Igloo worlds:** `src/home/StudyRoomPicker.tsx` owns room previews and selection. `src/home/StudyWorld.tsx` renders the six alternate environments using placements from `studyWorlds.ts`. The original Snowy Igloo is rendered in `CustomizableHome.tsx`. Room selection, unlocks, and separate layouts live in `src/home/state.ts`.
- **Shared state:** `src/state/PomodoroContext.tsx` exposes the timer, completed sessions, goals, rewards, and equipment. See `timer.ts` and `dailyGoals.ts` beside it. `src/onboarding/ProfileProvider.tsx` owns the saved profile and companion name. Reuse these sources and preserve existing saved data.
- **Onboarding:** `src/onboarding/OnboardingFlow.tsx` coordinates steps, events, and completion. `profile.ts` defines steps, defaults, and restoration. `StoryArt.tsx` renders story scenes and clips, `OriginalStoryBeats.tsx` handles discovery and building, and `Preferences.tsx` contains setup controls. `FirstStudyDay.tsx` handles the follow-up.
- **Pip animation:** `src/onboarding/OnboardingPip.tsx` animates layered storybook art and painted eyelids with Reanimated tracks in `pipStorybookMotion.ts`. `StoryArt.tsx` plays authored Lottie story clips. Elsewhere, `src/components/Penguin.{native,web}.tsx` provides standing Rive rendering and fallback art, and `StudyTogetherLottieCharacters.tsx` renders study performances. Check the renderer used by the affected scene before editing. Preserve Pip’s design, teal scarf, and working animations. Respect reduced motion and visibility via `src/home/useHomeMotion.ts` where applicable.
- **Wardrobe:** `src/wardrobe/PipWardrobeScreen.tsx` is a secondary route. Reuse the catalog, pose anchors, and fitting code in `src/wardrobe/` so preview and equipped appearances agree. Preserve purchases and unlocks.
- **Shared UI:** `src/theme.ts` defines Warm Nordic colors, typography, spacing, radii, metrics, and motion. Reuse `src/ui/Controls.tsx`, `Overlay.tsx`, and `BottomNav.tsx` for common UI.

## Development workflow

Follow [`docs/CODEX_WORKFLOW.md`](docs/CODEX_WORKFLOW.md) for task execution, verification, and handoff.

Use `npm run typecheck` for TypeScript, `node --test <relevant-test-file>` for focused tests, `npm run web` for browser checks, and `npm run build:web` when export needs verification.

Update the architecture map when entry points, state ownership, or rendering paths change.
