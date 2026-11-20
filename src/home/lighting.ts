export const LIGHTING_PRESETS = ['auto', 'daylight', 'cozy', 'midnight', 'fireplace', 'magical'] as const;
export type LightingPreset = typeof LIGHTING_PRESETS[number];
export const LIGHT_SOURCES = ['lamp', 'lantern', 'fairy', 'fireplace'] as const;
export type LightSource = typeof LIGHT_SOURCES[number];
export type RoomLighting = { preset: LightingPreset; brightness: number; sources: Record<LightSource, boolean> };
export const DEFAULT_LIGHTING: RoomLighting = { preset: 'auto', brightness: .82, sources: { lamp: false, lantern: true, fairy: false, fireplace: false } };
export const LIGHTING_LABELS: Record<LightingPreset, string> = {
  auto: 'Local time', daylight: 'Daylight', cozy: 'Cozy Evening', midnight: 'Midnight Focus', fireplace: 'Fireplace Night', magical: 'Magical Night',
};
const validPreset = (value: unknown): value is LightingPreset => LIGHTING_PRESETS.includes(value as LightingPreset);
export function restoreLighting(raw: any): RoomLighting {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_LIGHTING, sources: { ...DEFAULT_LIGHTING.sources } };
  return {
    preset: validPreset(raw.preset) ? raw.preset : 'auto',
    brightness: typeof raw.brightness === 'number' && Number.isFinite(raw.brightness) ? Math.max(.2, Math.min(1, raw.brightness)) : DEFAULT_LIGHTING.brightness,
    sources: Object.fromEntries(LIGHT_SOURCES.map(source => [source, typeof raw.sources?.[source] === 'boolean' ? raw.sources[source] : DEFAULT_LIGHTING.sources[source]])) as Record<LightSource, boolean>,
  };
}
export function presetLighting(current: RoomLighting, preset: LightingPreset): RoomLighting {
  const sources: Record<LightSource, boolean> = preset === 'daylight' ? { lamp: false, lantern: false, fairy: false, fireplace: false }
    : preset === 'cozy' ? { lamp: true, lantern: true, fairy: false, fireplace: false }
    : preset === 'midnight' ? { lamp: true, lantern: false, fairy: false, fireplace: false }
    : preset === 'fireplace' ? { lamp: false, lantern: false, fairy: false, fireplace: true }
    : preset === 'magical' ? { lamp: false, lantern: false, fairy: true, fireplace: false }
    : current.sources;
  return { ...current, preset, sources };
}
