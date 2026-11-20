import { restoreGifts, nextReward, pendingGifts, type GiftState, type GiftId } from '../gifts/progression';
import { rewardById } from '../gifts/catalog';
import type { FocusSession } from '../state/dailyGoals';
import { restoreDecorPlacement, isMovableDecor, type DecorPlacement } from '../furniture/catalog';
import { restoreGarden, type Garden } from '../garden/progression';
import type { PetId } from '../pets/pets';
import { isAtmospherePreference, type AtmospherePreference } from './atmosphere';
import { HOME_CATALOG, homeItem } from './catalog';
import { HOME_SLOTS, type HomeSlot } from './slots';
import { WARDROBE_CATALOG_DATA, WARDROBE_EQUIPMENT_DATA, isKnownWardrobeId, wardrobeProductData, type CharacterSkinId, type EquipmentSlot } from '../wardrobe/model';
import { DEFAULT_LIGHTING, restoreLighting, type RoomLighting } from './lighting';
import { EMPTY_PIP_MAIL, restorePipMail, type PipMailState } from '../messages/pipMessages';
export type HomeLayout = Partial<Record<HomeSlot, string>>;
export type WardrobeLayout = Partial<Record<EquipmentSlot, string>> & { skin?: CharacterSkinId };
export type WardrobeOutfit = { id: string; name: string; equipped: WardrobeLayout };
export type WardrobeState = { owned: string[]; equipped: WardrobeLayout; outfits: WardrobeOutfit[] };
export type PetState = { adopted: PetId[]; active: PetId | null; names: Partial<Record<PetId,string>>; following: boolean };
export type HomeState = { gifts: GiftState; furnitureSounds: boolean; decorPlacement: DecorPlacement; garden: Garden; pets: PetState; atmosphere: AtmospherePreference; lighting: RoomLighting; mailbox: PipMailState; snowfall: boolean; snowflakes: number; owned: string[]; equipped: HomeLayout; saved: HomeLayout; previous: HomeLayout; rewardedSessionIds: string[]; originalRoom: boolean; wardrobe: WardrobeState };
const starter = HOME_CATALOG.filter(item => item.price === 0 && !item.giftOnly);
const initialLayout = Object.fromEntries(starter.map(item => [item.slot, item.id])) as HomeLayout;
export function createWardrobe(): WardrobeState { return { owned: ['scarf-teal'], equipped: { neck: 'scarf-teal' }, outfits: [{ id: 'cozy-pip', name: 'Cozy Pip', equipped: { neck: 'scarf-teal' } }] }; }
export const UNLIMITED_SNOWFLAKES = 'unlimited';

export function createHome(): HomeState { return { gifts: {}, furnitureSounds: true, decorPlacement: {}, garden: restoreGarden(), pets:{adopted:[],active:null,names:{},following:false}, atmosphere: 'auto', lighting: { ...DEFAULT_LIGHTING, sources: { ...DEFAULT_LIGHTING.sources } }, mailbox: { ...EMPTY_PIP_MAIL, ordinaryByDay: {} }, snowfall: true, snowflakes: 0, owned: starter.map(i => i.id), equipped: {...initialLayout}, saved: {...initialLayout}, previous: {...initialLayout}, rewardedSessionIds: [], originalRoom: false, wardrobe: createWardrobe() }; }
const wardrobeSlotKeys: EquipmentSlot[] = ['head','face','neck','body','back','leftFlipper','rightFlipper','leftFoot','rightFoot'];
const legacyKnightParts: Partial<Record<EquipmentSlot, string>> = {
 head: 'knight-helmet', body: 'knight-chest', back: 'knight-cape',
 leftFlipper: 'knight-flipper-left', rightFlipper: 'knight-flipper-right',
 leftFoot: 'knight-boot-left', rightFoot: 'knight-boot-right',
};
function restoreWardrobe(raw: any): WardrobeState {
 const base = createWardrobe();
 const owned = [...new Set([...base.owned, ...(Array.isArray(raw?.owned) ? raw.owned.filter((id: unknown) => typeof id === 'string' && isKnownWardrobeId(id)) : [])])];
 const layout = (value: any): WardrobeLayout => {
  const result: WardrobeLayout = {};
  for (const slot of wardrobeSlotKeys) {
   const id = value?.[slot];
   if (typeof id === 'string' && owned.includes(id) && WARDROBE_EQUIPMENT_DATA[id]?.slot === slot) result[slot] = id;
  }
  const restoredSkin = typeof value?.skin === 'string' && owned.includes(wardrobeProductDataForSkin(value.skin)?.id ?? '') && Boolean(wardrobeProductDataForSkin(value.skin));
  const legacyKnightOutfit = owned.includes('knight-set') && Object.entries(legacyKnightParts).some(([slot, id]) => value?.[slot] === id);
  if (restoredSkin || legacyKnightOutfit) {
   result.skin = restoredSkin ? value.skin : 'knight-storybook';
   // The full illustration replaces its old independently overlaid armor parts.
   const skinProduct = wardrobeProductDataForSkin(result.skin);
   for (const slot of skinProduct?.skinCovers ?? []) delete result[slot];
  }
  return result;
 };
 const outfits = Array.isArray(raw?.outfits) ? raw.outfits.filter((o: any) => o && typeof o.id === 'string' && typeof o.name === 'string').slice(0, 24).map((o: any) => ({ id: o.id.slice(0, 80), name: o.name.trim().slice(0, 32), equipped: layout(o.equipped) })).filter((o: WardrobeOutfit) => o.name) : base.outfits;
 return { owned, equipped: layout(raw?.equipped ?? base.equipped), outfits };
}
export function restoreHome(raw: any, existingSessionIds: string[]): HomeState {
 const base = createHome();
 if (!raw || typeof raw !== 'object') return {...base, rewardedSessionIds: existingSessionIds};
 const owned = [...new Set([...base.owned, ...(Array.isArray(raw.owned) ? raw.owned.filter((id: unknown) => typeof id === 'string' && homeItem(id)) : [])])] as string[];
 const layout = (value: any): HomeLayout => {
  const result: HomeLayout = {};
  for (const slot of Object.keys(HOME_SLOTS) as HomeSlot[]) {
   const id = value?.[slot];
   if (typeof id === 'string' && owned.includes(id) && homeItem(id)?.slot === slot) result[slot] = id;
   else if (!HOME_SLOTS[slot].optional) result[slot] = base.equipped[slot];
  }
  return result;
 };
 const rawPets = raw.pets && typeof raw.pets === 'object' ? raw.pets : {};
 const adopted = [...new Set((Array.isArray(rawPets.adopted) ? rawPets.adopted : []).filter((id: unknown): id is PetId => typeof id === 'string' && ['seal','fox','bunny','bear'].includes(id)))] as PetId[];
 const active = adopted.includes(rawPets.active) ? rawPets.active as PetId : adopted[0] ?? null;
 const names = Object.fromEntries(adopted.map(id => [id, (typeof rawPets.names?.[id] === 'string' ? rawPets.names[id] : '').trim().slice(0,20) || id]));
 const pets = { adopted, active, names, following: rawPets.following === true };
 return { gifts: restoreGifts(raw.gifts), furnitureSounds: raw.furnitureSounds !== false, decorPlacement: restoreDecorPlacement(raw.decorPlacement), garden: restoreGarden(raw.garden), pets, atmosphere: isAtmospherePreference(raw.atmosphere) ? raw.atmosphere : 'auto', lighting: restoreLighting(raw.lighting), mailbox: restorePipMail(raw.mailbox), snowfall: raw.snowfall !== false, snowflakes: raw.snowflakes === UNLIMITED_SNOWFLAKES ? Infinity : Number.isSafeInteger(raw.snowflakes) && raw.snowflakes >= 0 ? raw.snowflakes : 0, owned, equipped: layout(raw.equipped), saved: layout(raw.saved ?? raw.equipped), previous: layout(raw.previous ?? raw.equipped), rewardedSessionIds: [...new Set([...existingSessionIds, ...(Array.isArray(raw.rewardedSessionIds) ? raw.rewardedSessionIds.filter((s: unknown) => typeof s === 'string') : [])])] as string[], originalRoom: raw.originalRoom === true, wardrobe: restoreWardrobe(raw.wardrobe) };
}
export function equipHome(home: HomeState, id: string): HomeState {
 const item = homeItem(id); if (!item || !home.owned.includes(id) || home.equipped[item.slot] === id) return home;
 return {...home, previous: home.equipped, equipped: {...home.equipped, [item.slot]: id}};
}
export function purchaseHome(home: HomeState, id: string): HomeState {
 const item = homeItem(id); if (!item || item.giftOnly || home.owned.includes(id) || home.snowflakes < item.price) return home;
 return equipHome({...home, snowflakes: home.snowflakes-item.price, owned: [...home.owned,id]}, id);
}
export function removeHome(home: HomeState, slot: HomeSlot): HomeState {
 if (!HOME_SLOTS[slot].optional || !home.equipped[slot]) return home;
 const equipped = {...home.equipped}; delete equipped[slot];
 return {...home, previous: home.equipped, equipped};
}
export function rewardHome(home: HomeState, session: {id: string; completed: boolean; focusMs: number}): HomeState {
 if (!session.completed || session.focusMs <= 0 || home.rewardedSessionIds.includes(session.id)) return home;
 return {...home, snowflakes: home.snowflakes + Math.floor(session.focusMs / 60000), rewardedSessionIds: [...home.rewardedSessionIds, session.id]};
}
function equipWardrobeParts(wardrobe: WardrobeState, parts: Partial<Record<EquipmentSlot, string>>): WardrobeState {
 const equipped = { ...wardrobe.equipped };
 const conflictsWithSkin = Object.keys(parts).some((slot) => slot !== 'face');
 if (conflictsWithSkin) delete equipped.skin;
 for (const [slot, id] of Object.entries(parts) as [EquipmentSlot, string][]) {
  if (wardrobe.owned.includes(id) && WARDROBE_EQUIPMENT_DATA[id]?.slot === slot) equipped[slot] = id;
 }
 return { ...wardrobe, equipped };
}
function equipWardrobeSkin(wardrobe: WardrobeState, skin: CharacterSkinId): WardrobeState {
 const equipped: WardrobeLayout = { skin };
 const product = wardrobeProductDataForSkin(skin);
 for (const slot of wardrobeSlotKeys) {
  const current = wardrobe.equipped[slot];
  if (current && !product?.skinCovers?.includes(slot)) equipped[slot] = current;
 }
 return { ...wardrobe, equipped };
}
function wardrobeProductDataForSkin(skin: unknown) {
 return typeof skin === 'string' ? WARDROBE_CATALOG_DATA.find((item) => item.skin === skin && item.available !== false) : undefined;
}
export function purchaseWardrobe(home: HomeState, id: string): HomeState {
 const item = wardrobeProductData(id);
 if (!item || item.giftOnly || item.available === false || home.wardrobe.owned.includes(id) || home.snowflakes < item.price) return home;
 const granted = item.skin ? [] : Object.values(item.parts).filter((piece): piece is string => Boolean(piece));
 const owned = [...new Set([...home.wardrobe.owned, id, ...granted])];
 const withOwnership = { ...home.wardrobe, owned };
 const wardrobe = item.skin ? equipWardrobeSkin(withOwnership, item.skin) : equipWardrobeParts(withOwnership, item.parts);
 return { ...home, snowflakes: home.snowflakes - item.price, wardrobe };
}
export function equipWardrobe(home: HomeState, id: string): HomeState {
 const product = wardrobeProductData(id);
 const wardrobe = home.wardrobe;
 if (product && product.available !== false && wardrobe.owned.includes(id)) {
  if (product.skin) return { ...home, wardrobe: equipWardrobeSkin(wardrobe, product.skin) };
  if (Object.values(product.parts).some((piece) => !piece || !wardrobe.owned.includes(piece))) return home;
  const next = equipWardrobeParts(wardrobe, product.parts);
  return next.equipped === wardrobe.equipped ? home : { ...home, wardrobe: next };
 }
 const piece = WARDROBE_EQUIPMENT_DATA[id];
 if (!piece || !wardrobe.owned.includes(id) || wardrobe.equipped[piece.slot] === id) return home;
 return { ...home, wardrobe: { ...wardrobe, equipped: { ...wardrobe.equipped, [piece.slot]: id } } };
}
export function removeWardrobeEquipment(home: HomeState, slot: EquipmentSlot): HomeState {
 if (slot === 'neck' && home.wardrobe.equipped.neck === 'scarf-teal') return home;
 if (!home.wardrobe.equipped[slot]) return home;
 const equipped = { ...home.wardrobe.equipped };
 delete equipped[slot];
 return { ...home, wardrobe: { ...home.wardrobe, equipped } };
}
export function removeWardrobeSkin(home: HomeState): HomeState {
 if (!home.wardrobe.equipped.skin) return home;
 const equipped = { ...home.wardrobe.equipped };
 delete equipped.skin;
 return { ...home, wardrobe: { ...home.wardrobe, equipped } };
}
export function saveWardrobeOutfit(home: HomeState, name: string): HomeState {
 const cleaned = name.trim().slice(0, 32);
 if (!cleaned || home.wardrobe.outfits.length >= 24) return home;
 const id = `look-${Date.now().toString(36)}-${home.wardrobe.outfits.length.toString(36)}`;
 return { ...home, wardrobe: { ...home.wardrobe, outfits: [...home.wardrobe.outfits, { id, name: cleaned, equipped: { ...home.wardrobe.equipped } }] } };
}
export function equipWardrobeOutfit(home: HomeState, id: string): HomeState {
 const look = home.wardrobe.outfits.find((outfit) => outfit.id === id);
 if (!look) return home;
 const equipped = Object.fromEntries(Object.entries(look.equipped).filter(([slot, piece]) => {
  if (slot === 'skin') {
   const product = wardrobeProductDataForSkin(piece);
   return Boolean(product && home.wardrobe.owned.includes(product.id));
  }
  return typeof piece === 'string' && home.wardrobe.owned.includes(piece);
 })) as WardrobeLayout;
 return { ...home, wardrobe: { ...home.wardrobe, equipped } };
}
export function deleteWardrobeOutfit(home: HomeState, id: string): HomeState {
 if (id === 'cozy-pip') return home;
 const outfits = home.wardrobe.outfits.filter((outfit) => outfit.id !== id);
 return outfits.length === home.wardrobe.outfits.length ? home : { ...home, wardrobe: { ...home.wardrobe, outfits } };
}
export function arrangeHomeState(home: HomeState, action: 'save' | 'restore' | 'undo' | 'fallback' | 'default'): HomeState {
 if (action === 'save') return {...home, saved: {...home.equipped}};
 if (action === 'fallback') return {...home, originalRoom: !home.originalRoom};
 return {...home, ...(action === 'default' ? { decorPlacement: {} } : {}), previous: home.equipped, equipped: {...(action === 'undo' ? home.previous : action === 'default' ? initialLayout : home.saved)}};
}

export function moveHomeDecoration(home: HomeState, slot: HomeSlot, direction: -1 | 1): HomeState {
 if (!isMovableDecor(slot) || !home.equipped[slot]) return home;
 const value = Math.max(-1, Math.min(1, (home.decorPlacement[slot] ?? 0) + direction));
 const decorPlacement = { ...home.decorPlacement };
 if (value === 0) delete decorPlacement[slot];
 else decorPlacement[slot] = value as -1 | 1;
 return { ...home, decorPlacement };
}

export function claimMysteryGift(home: HomeState, sessions: readonly FocusSession[], id: GiftId): HomeState {
 const gift = pendingGifts(sessions, home.gifts).find(item => item.id === id);
 if (!gift) return home;
 const claim = nextReward(gift, home.owned, home.wardrobe.owned);
 const gifts = { ...home.gifts, [id]: claim };
 if ('snowflakes' in claim) return { ...home, gifts, snowflakes: home.snowflakes + claim.snowflakes };
 const reward = rewardById(claim.rewardId)!;
 return reward.wardrobe
   ? { ...home, gifts, wardrobe: { ...home.wardrobe, owned: [...home.wardrobe.owned, reward.wardrobe] } }
   : { ...home, gifts, owned: [...home.owned, reward.id] };
}
