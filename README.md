# IGLOO

An Expo + React Native + TypeScript Pomodoro prototype with a Rive penguin, an Arctic scene, and local focus-time progress.

## Run

```sh
npm install
npm run ios
npm run android
npm run web
```

The iOS and Android targets need a native development build for Rive; Expo Go does not include that native module. The web build is a visual fallback and uses the still character illustration. Friend presence is simulated. Focus sessions, completed focus time, and onboarding state are stored on-device.

## Onboarding preview

Start the browser preview with `npx expo start --web --port 8081`, then open [http://localhost:8081/?preview=onboarding](http://localhost:8081/?preview=onboarding). The `onboarding` route always starts a fresh, non-persisting walkthrough, so it also works as the restart link.

Jump directly to a chapter by changing `preview` in the URL:

| `preview` value | Opens |
| --- | --- |
| `egg`, `hatching`, `celebration` | Egg and hatch moments |
| `name`, `penguin-name`, `activity` | Companion introduction and choices |
| `home`, `build`, `progress` | Igloo discovery, block tutorial, construction preview |
| `duration`, `focus`, `completion` | Session choice, live focus timer, completion celebration |

Append any value to the same base URL, for example `?preview=build`. Preview progress does not change saved onboarding or igloo progress. The `focus` route starts a real timer; the other preview routes use a short demo transition where appropriate.

See [docs/social-architecture.md](docs/social-architecture.md) for the planned private-friends and widget architecture.
