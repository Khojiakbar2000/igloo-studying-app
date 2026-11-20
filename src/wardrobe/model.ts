export type EquipmentSlot = 'head' | 'face' | 'neck' | 'body' | 'back' | 'leftFlipper' | 'rightFlipper' | 'leftFoot' | 'rightFoot';
export type WardrobeCategoryId = 'all' | 'costumes' | 'headwear' | 'eyewear' | 'neckwear' | 'clothing' | 'armor' | 'accessories' | 'footwear' | 'outfits';
export type CharacterAction = 'idle' | 'wave' | 'shiver' | 'celebrate';
export type PipPose = 'standing' | 'sitting' | 'walking' | 'sleeping';
export type CharacterSkinId = 'knight-storybook' | 'winter-explorer' | 'little-wizard' | 'royal-pip' | 'sleepy-scholar';
export type WardrobeAssetId =
  | 'giftHat' | 'giftHatThumb' | 'giftBackpack' | 'giftBackpackThumb'
  | 'crown' | 'crownThumb' | 'glasses' | 'glassesThumb' | 'helmet' | 'helmetThumb' | 'chest' | 'knightThumb'
  | 'winterExplorerThumb' | 'wizardThumb' | 'royalThumb' | 'scholarThumb'
  | 'cape' | 'leftArm' | 'rightArm' | 'leftFoot' | 'rightFoot' | 'scarfTeal' | 'scarfBerry' | 'scarfLavender'
  | 'crownV2' | 'glassesV2' | 'helmetV2' | 'chestV2' | 'leftArmV2' | 'rightArmV2' | 'leftFootV2' | 'rightFootV2';
export type EquipmentFrame = 'body' | 'leftArm' | 'rightArm' | 'leftFoot' | 'rightFoot';
export type EquipmentLayer = 'behind' | 'front';
export type EquipmentCanvas = { width: number; height: number };

export type EquipmentDefinitionData = {
  id: string;
  name: string;
  slot: EquipmentSlot;
  attachment: {
    asset: WardrobeAssetId;
    frame: EquipmentFrame;
    canvas: EquipmentCanvas;
    anchor: { x: number; y: number };
    layer: EquipmentLayer;
    order: number;
  };
};
export type WardrobeProductData = {
  id: string;
  name: string;
  description: string;
  price: number;
  rarity: 'everyday' | 'special' | 'legendary';
  categories: WardrobeCategoryId[];
  thumbnail: WardrobeAssetId;
  skin?: CharacterSkinId;
  skinCovers?: EquipmentSlot[];
  available?: boolean;
  giftOnly?: boolean;
  parts: Partial<Record<EquipmentSlot, string>>;
};

export const WARDROBE_CATEGORIES: { id: WardrobeCategoryId; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: '✧' },
  { id: 'costumes', label: 'Costumes', icon: '★' },
  { id: 'headwear', label: 'Hats', icon: '♛' },
  { id: 'eyewear', label: 'Glasses', icon: '◉' },
  { id: 'neckwear', label: 'Scarves', icon: '〰' },
  { id: 'accessories', label: 'Accessories', icon: '✧' },
];

export const WARDROBE_EQUIPMENT_DATA: Record<string, EquipmentDefinitionData> = {
  'gift-hat': { id: 'gift-hat', name: 'Blue knitted hat', slot: 'head', attachment: { asset: 'giftHat', frame: 'body', canvas: { width: 304, height: 500 }, anchor: { x: 152, y: 250 }, layer: 'front', order: 61 } },
  'gift-backpack': { id: 'gift-backpack', name: 'Penguin backpack', slot: 'back', attachment: { asset: 'giftBackpack', frame: 'body', canvas: { width: 304, height: 500 }, anchor: { x: 152, y: 250 }, layer: 'behind', order: -12 } },
  'scarf-teal': { id: 'scarf-teal', name: 'Original teal scarf', slot: 'neck', attachment: { asset: 'scarfTeal', frame: 'body', canvas: { width: 304, height: 500 }, anchor: { x: 152, y: 250 }, layer: 'front', order: 30 } },
  'scarf-berry': { id: 'scarf-berry', name: 'Cozy red scarf', slot: 'neck', attachment: { asset: 'scarfBerry', frame: 'body', canvas: { width: 304, height: 500 }, anchor: { x: 152, y: 250 }, layer: 'front', order: 30 } },
  'scarf-lavender': { id: 'scarf-lavender', name: 'Soft lavender scarf', slot: 'neck', attachment: { asset: 'scarfLavender', frame: 'body', canvas: { width: 304, height: 500 }, anchor: { x: 152, y: 250 }, layer: 'front', order: 30 } },
  'royal-crown': { id: 'royal-crown', name: 'Royal crown', slot: 'head', attachment: { asset: 'crownV2', frame: 'body', canvas: { width: 304, height: 500 }, anchor: { x: 152, y: 250 }, layer: 'front', order: 60 } },
  'round-glasses': { id: 'round-glasses', name: 'Round reading glasses', slot: 'face', attachment: { asset: 'glassesV2', frame: 'body', canvas: { width: 304, height: 500 }, anchor: { x: 152, y: 250 }, layer: 'front', order: 50 } },
  'knight-helmet': { id: 'knight-helmet', name: 'Knight helmet', slot: 'head', attachment: { asset: 'helmetV2', frame: 'body', canvas: { width: 304, height: 500 }, anchor: { x: 152, y: 250 }, layer: 'front', order: 60 } },
  'knight-chest': { id: 'knight-chest', name: 'Knight chestpiece', slot: 'body', attachment: { asset: 'chestV2', frame: 'body', canvas: { width: 304, height: 500 }, anchor: { x: 152, y: 250 }, layer: 'front', order: 10 } },
  'knight-cape': { id: 'knight-cape', name: 'Knight cape', slot: 'back', attachment: { asset: 'cape', frame: 'body', canvas: { width: 304, height: 500 }, anchor: { x: 152, y: 250 }, layer: 'behind', order: -10 } },
  'knight-flipper-left': { id: 'knight-flipper-left', name: 'Left flipper guard', slot: 'leftFlipper', attachment: { asset: 'leftArmV2', frame: 'leftArm', canvas: { width: 85, height: 96 }, anchor: { x: 63.75, y: 16 }, layer: 'front', order: 20 } },
  'knight-flipper-right': { id: 'knight-flipper-right', name: 'Right flipper guard', slot: 'rightFlipper', attachment: { asset: 'rightArmV2', frame: 'rightArm', canvas: { width: 86, height: 96 }, anchor: { x: 21.5, y: 16 }, layer: 'front', order: 20 } },
  'knight-boot-left': { id: 'knight-boot-left', name: 'Left knight boot', slot: 'leftFoot', attachment: { asset: 'leftFootV2', frame: 'leftFoot', canvas: { width: 49, height: 45 }, anchor: { x: 24.5, y: 9 }, layer: 'front', order: 20 } },
  'knight-boot-right': { id: 'knight-boot-right', name: 'Right knight boot', slot: 'rightFoot', attachment: { asset: 'rightFootV2', frame: 'rightFoot', canvas: { width: 48, height: 45 }, anchor: { x: 24, y: 9 }, layer: 'front', order: 20 } },
};

export const WARDROBE_CATALOG_DATA: WardrobeProductData[] = [
  { id:'gift-hat', name:'Blue knitted hat', description:'A soft blue knit from a study gift.', price:0, giftOnly:true, rarity:'everyday', categories:['headwear'], thumbnail:'giftHatThumb', parts:{ head:'gift-hat' } },
  { id:'gift-backpack', name:'Penguin backpack', description:'A little pack for Pip’s winter walks.', price:0, giftOnly:true, rarity:'special', categories:['accessories'], thumbnail:'giftBackpackThumb', parts:{ back:'gift-backpack' } },
  { id: 'scarf-teal', name: 'Sea-glass Knit', description: 'Pip’s original cozy teal scarf.', price: 0, rarity: 'everyday', categories: ['neckwear'], thumbnail: 'scarfTeal', parts: { neck: 'scarf-teal' } },
  { id: 'royal-crown', name: 'The Little Royal', description: 'A golden crown, just the right size for Pip.', price: 80, rarity: 'special', categories: ['headwear'], thumbnail: 'crownThumb', parts: { head: 'royal-crown' } },
  { id: 'round-glasses', name: 'Bookworm Specs', description: 'Warm bronze frames for curious little eyes.', price: 60, rarity: 'everyday', categories: ['eyewear'], thumbnail: 'glassesThumb', parts: { face: 'round-glasses' } },
  { id: 'scarf-berry', name: 'Cranberry Knit', description: 'The familiar cozy scarf in a berry red.', price: 35, rarity: 'everyday', categories: ['neckwear'], thumbnail: 'scarfBerry', parts: { neck: 'scarf-berry' } },
  { id: 'scarf-lavender', name: 'Lavender Snowfall', description: 'A soft lavender take on Pip’s knitted scarf.', price: 35, rarity: 'everyday', categories: ['neckwear'], thumbnail: 'scarfLavender', parts: { neck: 'scarf-lavender' } },
  { id: 'knight-set', name: 'Little Snow Knight', description: 'A complete, animated knight look made just for Pip.', price: 240, rarity: 'legendary', categories: ['costumes'], thumbnail: 'knightThumb', skin: 'knight-storybook', skinCovers: ['head','neck','body','back','leftFlipper','rightFlipper','leftFoot','rightFoot'], available: true, parts: {
    head: 'knight-helmet', body: 'knight-chest', back: 'knight-cape',
    leftFlipper: 'knight-flipper-left', rightFlipper: 'knight-flipper-right', leftFoot: 'knight-boot-left', rightFoot: 'knight-boot-right',
  } },
  { id: 'winter-explorer', name: 'Cozy Winter Explorer', description: 'A warm pine-green coat, knit cap, and sturdy snow boots.', price: 180, rarity: 'special', categories: ['costumes'], thumbnail: 'winterExplorerThumb', skin: 'winter-explorer', skinCovers: ['head','neck','body','back','leftFlipper','rightFlipper','leftFoot','rightFoot'], available: false, parts: {} },
  { id: 'little-wizard', name: 'Little Wizard', description: 'A starry plum robe and a tuft-friendly pointed hat.', price: 220, rarity: 'special', categories: ['costumes'], thumbnail: 'wizardThumb', skin: 'little-wizard', skinCovers: ['head','neck','body','back','leftFlipper','rightFlipper'], available: false, parts: {} },
  { id: 'royal-pip', name: 'Royal Pip', description: 'A tiny crown and a soft cranberry cape with gold trim.', price: 200, rarity: 'special', categories: ['costumes'], thumbnail: 'royalThumb', skin: 'royal-pip', skinCovers: ['head','neck','body','back'], available: false, parts: {} },
  { id: 'sleepy-scholar', name: 'Sleepy Scholar', description: 'A warm cardigan, round glasses, and a cozy knit cap.', price: 160, rarity: 'everyday', categories: ['costumes'], thumbnail: 'scholarThumb', skin: 'sleepy-scholar', skinCovers: ['head','face','neck','body','leftFlipper','rightFlipper'], available: false, parts: {} },
];

export const WARDROBE_ACTIONS: { id: CharacterAction; label: string; file: string }[] = [
  { id: 'idle', label: 'Idle', file: 'idle' },
  { id: 'wave', label: 'Wave', file: 'wave' },
  { id: 'shiver', label: 'Shiver', file: 'shiver' },
  { id: 'celebrate', label: 'Celebrate', file: 'celebrate' },
];

export function wardrobeProductData(id: string) { return WARDROBE_CATALOG_DATA.find((item) => item.id === id); }
export function wardrobeEquipmentData(id: string) { return WARDROBE_EQUIPMENT_DATA[id]; }
export function isKnownWardrobeId(id: string) { return Boolean(wardrobeProductData(id) || wardrobeEquipmentData(id)); }
