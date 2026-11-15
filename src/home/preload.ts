import { Image, Platform } from 'react-native';
import { Asset } from 'expo-asset';
import { HOME_ART, HOME_FOUNDATION } from './art';
// Retain decoded sprites while this home is open; swapping equipment needs no network round trip.
let loaded: Promise<void> | null = null;
const decoded: HTMLImageElement[] = [];
export function preloadHome(): Promise<void> {
 if (loaded) return loaded;
 loaded = (async () => {
  const sources = [HOME_FOUNDATION,...Object.values(HOME_ART)];
  for (let i=0;i<sources.length;i+=4) await Promise.all(sources.slice(i,i+4).map(async source => {
   const asset=Asset.fromModule(source); await asset.downloadAsync();
   const uri=asset.localUri??asset.uri;
   if(Platform.OS==='web' && typeof window!=='undefined') {
    const image=new window.Image();image.src=uri;
    if(image.decode)await image.decode();
    else await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(new Error('Furniture image unavailable'));});
    decoded.push(image);
   } else if(!await Image.prefetch(uri)) throw new Error('Furniture image unavailable');
  }));
 })().catch(error=>{loaded=null;decoded.length=0;throw error;});
 return loaded;
}
