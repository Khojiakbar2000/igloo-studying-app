import { restoreGifts, nextReward, pendingGifts, type GiftState, type GiftId } from '../gifts/progression';
import { rewardById } from '../gifts/catalog';
import type { FocusSession } from '../state/dailyGoals';
import { restoreDecorPlacement, isMovableDecor, type DecorPlacement } from '../furniture/catalog';
import { restoreGarden, type Garden } from '../garden/progression';
import type { PetId } from '../pets/pets';
import { isAtmospherePreference, type AtmospherePreference } from './atmosphere';
import { HOME_CATALOG, homeItem } from './catalog';
import { HOME_SLOTS, type HomeSlot } from './slots';
import { WARDROBE_CATALOG_DATA, WARDROBE_EQUIPMENT_DATA, isKnownWardrobeId, wardrobeProductData, type CharacterSkinId, type EquipmentSlot, type WardrobeProductData } from '../wardrobe/model';
import { DEFAULT_LIGHTING, restoreLighting, type RoomLighting } from './lighting';
import { EMPTY_PIP_MAIL, restorePipMail, type PipMailState } from '../messages/pipMessages';
export type HomeLayout = Partial<Record<HomeSlot, string>>;
export type StudyRoomId = 'igloo' | 'bedroom' | 'library' | 'ocean' | 'treehouse' | 'observatory' | 'train';
export const STUDY_ROOMS: {id: StudyRoomId; name: string; description: string; unlockSessions: number}[] = [
 {id:'igloo',name:'Snowy Igloo',description:'Your warm winter home',unlockSessions:0},
 {id:'bedroom',name:'Cozy Bedroom',description:'A gentle, personal hideaway',unlockSessions:3},
 {id:'library',name:'Grand Library',description:'A golden, book-filled hall',unlockSessions:8},
 {id:'ocean',name:'Ocean Sanctuary',description:'An open-air library at sea',unlockSessions:15},
 {id:'treehouse',name:'Forest Treehouse',description:'A leafy study among the trees',unlockSessions:22},
 {id:'observatory',name:'Moonlight Observatory',description:'A quiet room beneath the stars',unlockSessions:30},
 {id:'train',name:'Midnight Train',description:'A cozy carriage on the move',unlockSessions:40},
];
type RoomArrangement = Pick<HomeState, 'equipped' | 'saved' | 'previous' | 'decorPlacement'>;
const roomIds = STUDY_ROOMS.map(room => room.id);
export function roomUnlocked(home: HomeState, id: StudyRoomId, sessions: number) {
 const room = STUDY_ROOMS.find(room => room.id === id);
 return !!room && (sessions >= room.unlockSessions || !!home.unlockedRooms?.includes(id));
}

export function recordStudyRoomUnlocks(home: HomeState, sessions: number): HomeState {
 const unlockedRooms = roomIds.filter(id => roomUnlocked(home, id, sessions));
 if (unlockedRooms.length === home.unlockedRooms?.length) return home;
 return {...home, unlockedRooms};
}

export function switchStudyRoom(home: HomeState, id: StudyRoomId, sessions: number): HomeState {
 const current = home.activeRoom ?? 'igloo';
 if (current === id || !roomUnlocked(home, id, sessions)) return home;
 const {equipped, saved, previous, decorPlacement} = home;
 const roomLayouts = {...home.roomLayouts, [current]: {equipped, saved, previous, decorPlacement}};
 const next = roomLayouts[id] ?? {equipped: {...initialLayout}, saved: {...initialLayout}, previous: {...initialLayout}, decorPlacement: {}};
 return {...recordStudyRoomUnlocks(home, sessions), ...next, activeRoom: id, roomLayouts};
}

export type WardrobeLayout = Partial<Record<EquipmentSlot, string>> & { skin?: CharacterSkinId };
export type WardrobeOutfit = { id: string; name: string; equipped: WardrobeLayout };
export type WardrobeState = { legacyAccessoriesImported?: true; owned: string[]; equipped: WardrobeLayout; outfits: WardrobeOutfit[] };
export const MAX_WARDROBE_OUTFITS = 24;
export type PetState = { adopted: PetId[]; active: PetId | null; names: Partial<Record<PetId,string>>; following: boolean };
export type HomeState = { gifts: GiftState; furnitureSounds: boolean; decorPlacement: DecorPlacement; garden: Garden; pets: PetState; atmosphere: AtmospherePreference; lighting: RoomLighting; mailbox: PipMailState; snowfall: boolean; snowflakes: number; owned: string[]; equipped: HomeLayout; saved: HomeLayout; previous: HomeLayout; rewardedSessionIds: string[]; originalRoom: boolean; activeRoom?: StudyRoomId; unlockedRooms?: StudyRoomId[]; roomLayouts?: Partial<Record<StudyRoomId, RoomArrangement>>; wardrobe: WardrobeState };
const starter = HOME_CATALOG.filter(item => item.price === 0 && !item.giftOnly);
const initialLayout = Object.fromEntries(starter.map(item => [item.slot, item.id])) as HomeLayout;
export function createWardrobe(): WardrobeState { return { owned: ['scarf-teal', 'cozy-headphones'], equipped: { neck: 'scarf-teal' }, outfits: [{ id: 'cozy-pip', name: 'Cozy Pip', equipped: { neck: 'scarf-teal' } }] }; }
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
  if (!result.skin) result.neck ??= 'scarf-teal';
  return result;
 };
 const outfits = Array.isArray(raw?.outfits) ? raw.outfits.filter((o: any) => o && typeof o.id === 'string' && typeof o.name === 'string').slice(0, MAX_WARDROBE_OUTFITS).map((o: any) => ({ id: o.id.slice(0, 80), name: o.name.trim().slice(0, 32), equipped: layout(o.equipped) })).filter((o: WardrobeOutfit) => o.name) : base.outfits;
 return { owned, equipped: layout(raw?.equipped ?? base.equipped), outfits, ...(raw?.legacyAccessoriesImported === true && { legacyAccessoriesImported: true as const }) };
}
export function importLegacyAccessories(home: HomeState, legacy: unknown): HomeState {
 const wardrobe = home.wardrobe;
 if (wardrobe.legacyAccessoriesImported) return home;
 const previous = legacy as Partial<import('../character/penguinCustomization').PenguinCustomization> | null;
 const equipped = { ...wardrobe.equipped };
 const owned = new Set(wardrobe.owned);
 if (previous && typeof previous === 'object') {
  for (const id of ['scarf-berry', 'scarf-lavender', 'round-glasses', 'cozy-headphones']) owned.add(id);
 }
 const scarf = previous?.scarf === 'berry' ? 'scarf-berry' : previous?.scarf === 'lilac' ? 'scarf-lavender' : undefined;
 if (scarf && !equipped.skin && equipped.neck === 'scarf-teal') equipped.neck = scarf;
 if (previous?.glasses === true) equipped.face ??= 'round-glasses';
 if (previous?.headphones === true && !equipped.skin) equipped.head ??= 'cozy-headphones';
 return { ...home, wardrobe: { ...wardrobe, owned: [...owned], equipped, legacyAccessoriesImported: true } };
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
 const equipped = layout(raw.equipped ?? base.equipped);
 const activeRoom = roomIds.find(id => id === raw.activeRoom) ?? 'igloo';
 const unlockedRooms = roomIds.filter(id => id === activeRoom || id === 'igloo' || (Array.isArray(raw.unlockedRooms) && raw.unlockedRooms.includes(id)));
 const roomLayouts: HomeState['roomLayouts'] = {};
 for (const id of roomIds) {
  const value = raw.roomLayouts?.[id];
  if (!value || typeof value !== 'object') continue;
  const equipped = layout(value.equipped ?? value);
  roomLayouts[id] = {equipped, saved: layout(value.saved ?? equipped), previous: layout(value.previous ?? equipped), decorPlacement: restoreDecorPlacement(value.decorPlacement)};
 }
 return { gifts: restoreGifts(raw.gifts), furnitureSounds: raw.furnitureSounds !== false, decorPlacement: restoreDecorPlacement(raw.decorPlacement), garden: restoreGarden(raw.garden), pets, atmosphere: isAtmospherePreference(raw.atmosphere) ? raw.atmosphere : 'auto', lighting: restoreLighting(raw.lighting), mailbox: restorePipMail(raw.mailbox), snowfall: raw.snowfall !== false, snowflakes: raw.snowflakes === UNLIMITED_SNOWFLAKES ? Infinity : Number.isSafeInteger(raw.snowflakes) && raw.snowflakes >= 0 ? raw.snowflakes : 0, owned, equipped, saved: layout(raw.saved ?? equipped), previous: layout(raw.previous ?? equipped), rewardedSessionIds: [...new Set([...existingSessionIds, ...(Array.isArray(raw.rewardedSessionIds) ? raw.rewardedSessionIds.filter((s: unknown) => typeof s === 'string') : [])])] as string[], originalRoom: raw.originalRoom === true, activeRoom, unlockedRooms, roomLayouts, wardrobe: restoreWardrobe(raw.wardrobe) };
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
function wearWardrobeParts(current: WardrobeLayout, parts: WardrobeProductData['parts']): WardrobeLayout {
 const equipped = { ...current, ...parts };
 const covered = wardrobeProductDataForSkin(current.skin)?.skinCovers;
 if (covered?.some(slot => parts[slot])) {
  delete equipped.skin;
  equipped.neck ??= 'scarf-teal';
 }
 return equipped;
}
export function outfitWithProduct(current: WardrobeLayout, product: Pick<WardrobeProductData, 'skin' | 'skinCovers' | 'parts'>): WardrobeLayout {
 if (!product.skin) return wearWardrobeParts(current, product.parts);
 const equipped: WardrobeLayout = { ...current, skin: product.skin };
 for (const slot of product.skinCovers ?? []) delete equipped[slot];
 return equipped;
}
function wardrobeProductDataForSkin(skin: unknown) {
 return typeof skin === 'string' ? WARDROBE_CATALOG_DATA.find((item) => item.skin === skin && item.available !== false) : undefined;
}
export function purchaseWardrobe(home: HomeState, id: string): HomeState {
 const item = wardrobeProductData(id);
 if (!item || item.giftOnly || item.available === false || home.wardrobe.owned.includes(id) || home.snowflakes < item.price) return home;
 const granted = item.skin ? [] : Object.values(item.parts).filter((piece): piece is string => Boolean(piece));
 const owned = [...new Set([...home.wardrobe.owned, id, ...granted])];
 const wardrobe = { ...home.wardrobe, owned, equipped: outfitWithProduct(home.wardrobe.equipped, item) };
 return { ...home, snowflakes: home.snowflakes - item.price, wardrobe };
}
export function equipWardrobe(home: HomeState, id: string): HomeState {
 const product = wardrobeProductData(id);
 const wardrobe = home.wardrobe;
 if (product && product.available !== false && wardrobe.owned.includes(id)) {
  if (!product.skin && Object.values(product.parts).some((piece) => !piece || !wardrobe.owned.includes(piece))) return home;
  return { ...home, wardrobe: { ...wardrobe, equipped: outfitWithProduct(wardrobe.equipped, product) } };
 }
 const piece = WARDROBE_EQUIPMENT_DATA[id];
 if (!piece || !wardrobe.owned.includes(id) || wardrobe.equipped[piece.slot] === id) return home;
 return { ...home, wardrobe: { ...wardrobe, equipped: wearWardrobeParts(wardrobe.equipped, { [piece.slot]: id }) } };
}
export function removeWardrobeEquipment(home: HomeState, slot: EquipmentSlot): HomeState {
 if (slot === 'neck' && home.wardrobe.equipped.neck === 'scarf-teal') return home;
 if (!home.wardrobe.equipped[slot]) return home;
 const equipped = { ...home.wardrobe.equipped };
 if (slot === 'neck') equipped.neck = 'scarf-teal';
 else delete equipped[slot];
 return { ...home, wardrobe: { ...home.wardrobe, equipped } };
}
export function removeWardrobeSkin(home: HomeState): HomeState {
 if (!home.wardrobe.equipped.skin) return home;
 const equipped = { ...home.wardrobe.equipped };
 delete equipped.skin;
 equipped.neck ??= 'scarf-teal';
 return { ...home, wardrobe: { ...home.wardrobe, equipped } };
}
export function saveWardrobeOutfit(home: HomeState, name: string): HomeState {
 const cleaned = name.trim().slice(0, 32);
 if (!cleaned || home.wardrobe.outfits.length >= MAX_WARDROBE_OUTFITS) return home;
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
