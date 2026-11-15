import { isAtmospherePreference, type AtmospherePreference } from './atmosphere';
import { HOME_CATALOG, homeItem } from './catalog';
import { HOME_SLOTS, type HomeSlot } from './slots';
export type HomeLayout = Partial<Record<HomeSlot, string>>;
export type HomeState = { atmosphere: AtmospherePreference; snowfall: boolean; snowflakes: number; owned: string[]; equipped: HomeLayout; saved: HomeLayout; previous: HomeLayout; rewardedSessionIds: string[]; originalRoom: boolean };
const starter = HOME_CATALOG.filter(item => item.price === 0);
const initialLayout = Object.fromEntries(starter.map(item => [item.slot, item.id])) as HomeLayout;
export function createHome(): HomeState { return { atmosphere: 'auto', snowfall: true, snowflakes: 0, owned: starter.map(i => i.id), equipped: {...initialLayout}, saved: {...initialLayout}, previous: {...initialLayout}, rewardedSessionIds: [], originalRoom: false }; }
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
 return { atmosphere: isAtmospherePreference(raw.atmosphere) ? raw.atmosphere : 'auto', snowfall: raw.snowfall !== false, snowflakes: Number.isSafeInteger(raw.snowflakes) && raw.snowflakes >= 0 ? raw.snowflakes : 0, owned, equipped: layout(raw.equipped), saved: layout(raw.saved ?? raw.equipped), previous: layout(raw.previous ?? raw.equipped), rewardedSessionIds: [...new Set([...existingSessionIds, ...(Array.isArray(raw.rewardedSessionIds) ? raw.rewardedSessionIds.filter((s: unknown) => typeof s === 'string') : [])])] as string[], originalRoom: raw.originalRoom === true };
}
export function equipHome(home: HomeState, id: string): HomeState {
 const item = homeItem(id); if (!item || !home.owned.includes(id) || home.equipped[item.slot] === id) return home;
 return {...home, previous: home.equipped, equipped: {...home.equipped, [item.slot]: id}};
}
export function purchaseHome(home: HomeState, id: string): HomeState {
 const item = homeItem(id); if (!item || home.owned.includes(id) || home.snowflakes < item.price) return home;
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
export function arrangeHomeState(home: HomeState, action: 'save' | 'restore' | 'undo' | 'fallback'): HomeState {
 if (action === 'save') return {...home, saved: {...home.equipped}};
 if (action === 'fallback') return {...home, originalRoom: !home.originalRoom};
 return {...home, previous: home.equipped, equipped: {...(action === 'undo' ? home.previous : home.saved)}};
}
