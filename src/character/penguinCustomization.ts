export type ScarfColor = 'teal' | 'berry' | 'lilac';

export type PenguinCustomization = {
  scarf: ScarfColor;
  glasses: boolean;
  headphones: boolean;
};

export const DEFAULT_PENGUIN_CUSTOMIZATION: PenguinCustomization = {
  scarf: 'teal',
  glasses: false,
  headphones: false,
};

