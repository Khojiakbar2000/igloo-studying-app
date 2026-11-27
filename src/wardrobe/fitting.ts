import type { WardrobeLayout } from '../home/state';
import { WARDROBE_EQUIPMENT_DATA, type EquipmentSlot } from './model';
import type { PoseAnchors } from './poseAnchors';

type Art = { w: number; h: number; p: string };
const artwork: Record<string, Art> = require('../../assets/wardrobe/items/fitted-lottie-art.json');
const bootAnchors: Record<string, [number, number, number, number][]> = require('../../assets/wardrobe/items/boot-anchors.json');
const dyes: Record<string, Record<string, Art & { x: number; y: number }>> = require('../../assets/wardrobe/items/seated-scarf-colors.json');
export type Fit = { id: string; art: Art; x: number; y: number; width: number; height: number; rotation: number; behind: boolean };
type Perspective = 'standing' | 'chair' | 'laptop';

const bodySlots: EquipmentSlot[] = ['back', 'body', 'neck', 'face', 'head'];

export function bodyFittings(outfit: WardrobeLayout, pose: Perspective, points: PoseAnchors, usePaintedKnight = false, cel?: string): Fit[] {
  const [left, top, headWidth, eyeX, eyeY, farEyeX, farEyeY] = points;
  const result: Fit[] = [];
  const standing = pose === 'standing';
  const laptop = pose === 'laptop';
  const x = left + headWidth / 2;
  const unit = headWidth / 304;
  const add = (id: string, cx: number, cy: number, width: number, height: number, behind = false, rotation = 0) => {
    const art = artwork[id];
    if (art) result.push({ id, art, x: cx, y: cy, width, height, behind, rotation });
  };

  for (const slot of bodySlots) {
    let id = outfit[slot];
    if (outfit.skin === 'knight-storybook' && !usePaintedKnight) {
      if (slot === 'head') id = 'knight-helmet';
      if (slot === 'back') id = 'knight-cape';
      if (slot === 'body') id = 'knight-chest';
    }
    if (!id) continue;
    switch (id) {
      case 'round-glasses': {
        const angled = laptop || (pose === 'chair' && (eyeX - left) / headWidth > .46);
        // Lens centers measured in each piece of source artwork.
        const [nearX, nearY, farX, farY] = angled ? [.468, .571, .847, .433] : [.253, .485, .731, .485];
        const dx = farEyeX - eyeX;
        const dy = farEyeY - eyeY;
        const span = Math.hypot(dx, dy);
        const height = span * (angled ? .88 : .64);
        const artworkDy = height * (farY - nearY);
        const artworkDx = Math.sqrt(span ** 2 - artworkDy ** 2);
        const width = artworkDx / (farX - nearX);
        const rotation = Math.atan2(dy, dx) - Math.atan2(artworkDy, artworkDx);
        const localX = (.5 - nearX) * width;
        const localY = (.5 - nearY) * height;
        add(angled ? 'study-glasses' : id,
          eyeX + localX * Math.cos(rotation) - localY * Math.sin(rotation),
          eyeY + localX * Math.sin(rotation) + localY * Math.cos(rotation),
          width, height, false, rotation * 180 / Math.PI);
        break;
      }
      case 'cozy-headphones': {
        const turned = laptop || (eyeX - left) / headWidth > .45;
        const cupY = eyeY - (turned ? 18 : 8) * unit;
        const bandTop = top - 10 * unit;
        const bandHeight = Math.max(65 * unit, cupY - bandTop);
        const center = x - (turned ? 12 : 0) * unit;
        add(id + '-band', center, bandTop + bandHeight / 2, headWidth * 1.06, bandHeight, false);
        add(id + '-far', left + headWidth - (turned ? 16 : 7) * unit, cupY - 7 * unit, (turned ? 50 : 58) * unit, 96 * unit, turned);
        add(id + '-near', left + (turned ? 24 : 8) * unit, cupY, (turned ? 96 : 88) * unit, 110 * unit, false, turned ? 8 : -8);
        break;
      }
      case 'gift-hat':
        add(id, x + (laptop ? 5 : 0) * unit, top + 4 * unit, 322 * unit, 242 * unit, false, laptop ? 8 : -5);
        break;
      case 'royal-crown':
        add(id, x + (laptop ? 16 : -3) * unit, top + 42 * unit, 116 * unit, 70 * unit, false, laptop ? 8 : -5);
        break;
      case 'gift-backpack':
        add(id, x + (standing ? 112 : -112) * unit, eyeY + (standing ? 171 : 155) * unit, 151 * unit, 146 * unit, true, standing ? -9 : 11);
        break;
      case 'knight-helmet':
        add(id, x + (laptop ? 13 : 0) * unit, top + 94 * unit, 272 * unit, 139 * unit, false, laptop ? 7 : 0);
        break;
      case 'knight-cape':
        add(id, x - 36 * unit, eyeY + 133 * unit, 380 * unit, 445 * unit, true);
        break;
      case 'knight-chest':
        if (!laptop) add(id, x, eyeY + 53 * unit, 257 * unit, 490 * unit);
        break;
      default:
        if (slot === 'neck' && standing && !usePaintedKnight) add(id, 152, 250, 304, 500);
    }
  }
  if (cel && (outfit.skin === 'knight-storybook' || outfit.leftFoot || outfit.rightFoot || outfit.leftFlipper || outfit.rightFlipper)) {
    const fullSet = outfit.skin === 'knight-storybook';
    const [nearFoot, farFoot] = bootAnchors[cel] ?? [];
    if (nearFoot && (fullSet || outfit.leftFoot)) {
      const [cx, cy, w, h] = nearFoot;
      const height = h + 18 * unit;
      add('knight-boot-left', cx, Math.min(cy - 5 * unit, (laptop ? 541 : 560) - height / 2), w * 1.16, height);
    }
    if (farFoot && (fullSet || outfit.rightFoot)) {
      const [cx, cy, w, h] = farFoot;
      const height = h + 17 * unit;
      add('knight-boot-right', cx, Math.min(cy - 5 * unit, (laptop ? 541 : 560) - height / 2), w * 1.18, height);
    }
    if (laptop && nearFoot && farFoot && (fullSet || outfit.body)) {
      const [nx, ny] = nearFoot;
      const [fx] = farFoot;
      add('knight-chest', (nx + fx) / 2 - 28 * unit, ny - 130 * unit, 148 * unit, 290 * unit);
    }
    if (fullSet || outfit.leftFlipper) {
      const raised = laptop && ['asset_025', 'asset_026', 'asset_029', 'asset_030', 'asset_041', 'asset_042'].includes(cel);
      const cx = left + (laptop ? 88 : 53) * unit;
      const cy = eyeY + (raised ? 80 : laptop ? 128 : 171) * unit;
      add('knight-flipper-left', cx, cy, 80 * unit, 70 * unit, false, raised ? 150 : laptop ? -45 : 32);
    }
    if (!laptop && (fullSet || outfit.rightFlipper)) {
      add('knight-flipper-right', left + headWidth - 54 * unit, eyeY + 170 * unit, 80 * unit, 70 * unit, false, -35);
    }
  }
  return result;
}

export function scarfFitting(cel: string, neck: string | undefined): Fit | undefined {
  const color = neck === 'scarf-berry' ? 'berry' : neck === 'scarf-lavender' ? 'lavender' : undefined;
  const art = color ? dyes[cel]?.[color] : undefined;
  return art && { id: neck!, art, x: art.x + art.w / 2, y: art.y + art.h / 2, width: art.w, height: art.h, rotation: 0, behind: false };
}

export function limbFitting(id: string): Fit | undefined {
  const art = artwork[id];
  const attachment = WARDROBE_EQUIPMENT_DATA[id]?.attachment;
  if (!art || !attachment || attachment.frame === 'body') return undefined;
  return { id, art, x: art.w / 2 - attachment.anchor.x, y: art.h / 2 - attachment.anchor.y, width: art.w, height: art.h, rotation: 0, behind: false };
}
