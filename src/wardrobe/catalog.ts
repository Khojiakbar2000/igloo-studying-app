import type { ImageSourcePropType } from 'react-native';
import {
  WARDROBE_CATALOG_DATA,
  WARDROBE_CATEGORIES,
  WARDROBE_EQUIPMENT_DATA,
  type EquipmentDefinitionData,
  type WardrobeAssetId,
  type WardrobeCategoryId,
  type WardrobeProductData,
} from './model';

export { WARDROBE_ACTIONS } from './model';
export type { CharacterAction, CharacterSkinId, EquipmentSlot, PipPose, WardrobeCategoryId } from './model';
export type Attachment = Omit<EquipmentDefinitionData['attachment'], 'asset'> & { image: ImageSourcePropType };
export type EquipmentDefinition = Omit<EquipmentDefinitionData, 'attachment'> & { attachment: Attachment };
export type WardrobeProduct = Omit<WardrobeProductData, 'thumbnail'> & { thumbnail: ImageSourcePropType };

const ART: Record<WardrobeAssetId, ImageSourcePropType> = {
  giftHat: require('../../assets/environments/igloo/gifts/hat-fit.png'),
  giftBackpack: require('../../assets/environments/igloo/gifts/backpack-fit.png'),
  giftHatThumb: require('../../assets/environments/igloo/gifts/wear-1.webp'),
  giftBackpackThumb: require('../../assets/environments/igloo/gifts/wear-3.webp'),
  crown: require('../../assets/wardrobe/items/crown-body-layer-v2.png'),
  crownThumb: require('../../assets/wardrobe/items/crown-art.png'),
  glasses: require('../../assets/wardrobe/items/glasses-body-layer-v2.png'),
  glassesThumb: require('../../assets/wardrobe/items/round-glasses-art.png'),
  helmet: require('../../assets/wardrobe/items/knight-helmet-body-layer-v2.png'),
  helmetThumb: require('../../assets/wardrobe/items/knight-helmet-art.png'),
  chest: require('../../assets/wardrobe/items/knight-chest-body-layer-v2.png'),
  knightThumb: require('../../assets/wardrobe/items/knight-storybook-thumb.png'),
  winterExplorerThumb: require('../../assets/wardrobe/items/winter-explorer-thumb.png'),
  wizardThumb: require('../../assets/wardrobe/items/wizard-thumb.png'),
  royalThumb: require('../../assets/wardrobe/items/royal-thumb.png'),
  scholarThumb: require('../../assets/wardrobe/items/scholar-thumb.png'),
  cape: require('../../assets/wardrobe/items/knight-cape-body-layer.png'),
  leftArm: require('../../assets/wardrobe/items/knight-left-arm-layer-v2.png'),
  rightArm: require('../../assets/wardrobe/items/knight-right-arm-layer-v2.png'),
  leftFoot: require('../../assets/wardrobe/items/knight-left-foot-layer-v2.png'),
  rightFoot: require('../../assets/wardrobe/items/knight-right-foot-layer-v2.png'),
  crownV2: require('../../assets/wardrobe/items/crown-body-layer-v2.png'),
  glassesV2: require('../../assets/wardrobe/items/glasses-body-layer-v2.png'),
  helmetV2: require('../../assets/wardrobe/items/knight-helmet-body-layer-v2.png'),
  chestV2: require('../../assets/wardrobe/items/knight-chest-body-layer-v2.png'),
  leftArmV2: require('../../assets/wardrobe/items/knight-left-arm-layer-v2.png'),
  rightArmV2: require('../../assets/wardrobe/items/knight-right-arm-layer-v2.png'),
  leftFootV2: require('../../assets/wardrobe/items/knight-left-foot-layer-v2.png'),
  rightFootV2: require('../../assets/wardrobe/items/knight-right-foot-layer-v2.png'),
  scarfTeal: require('../../assets/wardrobe/items/scarves/scarf-teal.png'),
  scarfBerry: require('../../assets/wardrobe/items/scarves/scarf-red.png'),
  scarfLavender: require('../../assets/wardrobe/items/scarves/scarf-lavender.png'),
};

export { WARDROBE_CATEGORIES };
export const WARDROBE_EQUIPMENT: Record<string, EquipmentDefinition> = Object.fromEntries(
  Object.entries(WARDROBE_EQUIPMENT_DATA).map(([id, equipment]) => [id, {
    ...equipment,
    attachment: { ...equipment.attachment, image: ART[equipment.attachment.asset] },
  }]),
);
export const WARDROBE_CATALOG: WardrobeProduct[] = WARDROBE_CATALOG_DATA.map(({ thumbnail, ...item }) => ({ ...item, thumbnail: ART[thumbnail] }));

export function wardrobeProduct(id: string) { return WARDROBE_CATALOG.find((item) => item.id === id); }
export function wardrobeEquipment(id: string) { return WARDROBE_EQUIPMENT[id]; }
export function isKnownWardrobeId(id: string) { return Boolean(wardrobeProduct(id) || wardrobeEquipment(id)); }
