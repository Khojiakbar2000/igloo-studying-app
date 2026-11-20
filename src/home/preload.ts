import { Image, Platform } from 'react-native';
import { Asset } from 'expo-asset';
import { HOME_ART, HOME_FOUNDATION } from './art';

const loaded = new Set<string>();
const pending = new Map<string, Promise<void>>();

function preloadOne(key: string, source: number): Promise<void> {
 if (loaded.has(key)) return Promise.resolve();
 const existing = pending.get(key);
 if (existing) return existing;
 const request = (async () => {
  const asset = Asset.fromModule(source);
  await asset.downloadAsync();
  const uri = asset.localUri ?? asset.uri;
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
   const image = new window.Image();
   image.src = uri;
   if (typeof image.decode === 'function') await image.decode();
   else await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('Furniture image unavailable')); });
  } else if (!await Image.prefetch(uri)) {
   throw new Error('Furniture image unavailable');
  }
  loaded.add(key);
 })();
 pending.set(key, request);
 request.catch(() => { loaded.delete(key); }).finally(() => { if (pending.get(key) === request) pending.delete(key); });
 return request;
}

/** Preload the room foundation and only the requested equipped or preview furniture. */
export function preloadHome(itemIds: readonly string[] = []): Promise<void> {
 const ids = [...new Set(itemIds)].filter((id) => Boolean(HOME_ART[id]));
 return Promise.all([
  preloadOne('foundation', HOME_FOUNDATION),
  ...ids.map((id) => preloadOne(id, HOME_ART[id])),
 ]).then(() => undefined);
}
