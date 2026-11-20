import type { CharacterAction, CharacterSkinId, PipPose } from './model';

export type CostumeVariant = { actions: Partial<Record<CharacterAction, string>> };
export type CostumeDefinition = {
  id: CharacterSkinId;
  productId: string;
  name: string;
  variants: Partial<Record<PipPose, CostumeVariant>>;
};

const standingKnight: CostumeVariant = {
  actions: {
    idle: 'knight-storybook/idle.json',
    wave: 'knight-storybook/wave.json',
    shiver: 'knight-storybook/shiver.json',
    celebrate: 'knight-storybook/celebrate.json',
  },
};

export const PIP_COSTUMES: Record<CharacterSkinId, CostumeDefinition> = {
  'knight-storybook': { id: 'knight-storybook', productId: 'knight-set', name: 'Little Snow Knight', variants: { standing: standingKnight } },
  'winter-explorer': { id: 'winter-explorer', productId: 'winter-explorer', name: 'Cozy Winter Explorer', variants: {} },
  'little-wizard': { id: 'little-wizard', productId: 'little-wizard', name: 'Little Wizard', variants: {} },
  'royal-pip': { id: 'royal-pip', productId: 'royal-pip', name: 'Royal Pip', variants: {} },
  'sleepy-scholar': { id: 'sleepy-scholar', productId: 'sleepy-scholar', name: 'Sleepy Scholar', variants: {} },
};

export function costumeVariant(skin: CharacterSkinId | undefined, pose: PipPose) {
  return skin ? PIP_COSTUMES[skin]?.variants[pose] ?? null : null;
}

export function costumeAction(skin: CharacterSkinId | undefined, pose: PipPose, action: CharacterAction) {
  return costumeVariant(skin, pose)?.actions[action] ?? null;
}
