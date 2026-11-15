export const DAY_PHASES = ['morning', 'afternoon', 'evening', 'night'] as const;
export type DayPhase = typeof DAY_PHASES[number];
export type AtmospherePreference = 'auto' | DayPhase;
export function isAtmospherePreference(value: unknown): value is AtmospherePreference {
 return value === 'auto' || DAY_PHASES.includes(value as DayPhase);
}
export function localDayPhase(hour: number): DayPhase {
 return hour >= 6 && hour < 12 ? 'morning' : hour >= 12 && hour < 17 ? 'afternoon' : hour >= 17 && hour < 21 ? 'evening' : 'night';
}
export const DAY_LIGHT = {
 morning: {wash:'#FFE8BA',opacity:.09,sky:'#FFE2A5',skyOpacity:.42,shade:0,glow:.12},
 afternoon: {wash:'#EDF8FF',opacity:.06,sky:'#DBF3FF',skyOpacity:.48,shade:0,glow:.06},
 evening: {wash:'#FFBD70',opacity:.14,sky:'#F0B0A8',skyOpacity:.20,shade:.08,glow:.29},
 night: {wash:'#263B73',opacity:.21,sky:'#142A59',skyOpacity:.20,shade:.10,glow:.35},
} as const;
// Glass apertures only. These anchors exclude the painted frames and mullions.
export function glassAnchor(original: boolean, windowId?: string) {
 if(original) return {x:395,y:475,width:166,height:151,shape:'round' as const};
 return windowId === 'window-panorama'
  ? {x:385,y:455,width:257,height:157,shape:'arch' as const}
  : {x:435,y:455,width:155,height:155,shape:'round' as const};
}
export const FOCUS_STORM_UNLOCK_MS = 60 * 60_000;
