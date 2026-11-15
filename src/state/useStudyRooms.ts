import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Platform } from 'react-native';
import { Asset } from 'expo-asset';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isStudyRoomId, STUDY_ROOMS, studyRoom, type StudyRoomId } from '../scenes/studyRooms';

const STORAGE_KEY = 'igloo.study-room.v1';
const preloads = new Map<number, Promise<void>>();
const decoded = new Map<number, HTMLImageElement>();

export function preloadRoomAsset(source: number) {
  const existing = preloads.get(source);
  if (existing) return existing;
  const task = (async () => {
    const asset = Asset.fromModule(source);
    await asset.downloadAsync();
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const image = new window.Image();
      image.src = asset.localUri ?? asset.uri;
      if (image.decode) await image.decode();
      else await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('Room image unavailable')); });
      decoded.set(source, image);
      // Keep only three decoded full plates; all downloaded files remain cached.
      const fullPlates = [...decoded].filter(([, value]) => value.naturalWidth > 512);
      for (const [oldest] of fullPlates.slice(0, -3)) { decoded.delete(oldest); preloads.delete(oldest); }
    } else if (!await Image.prefetch(asset.localUri ?? asset.uri)) throw new Error('Room image unavailable');
  })().catch((error) => { preloads.delete(source); throw error; });
  preloads.set(source, task);
  return task;
}

export function useStudyRooms() {
  const [roomId, setRoomId] = useState<StudyRoomId>('igloo');
  const [pendingRoom, setPendingRoom] = useState<StudyRoomId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const request = useRef(0);
  const alive = useRef(true);
  const choose = useCallback(async (id: StudyRoomId, persist = true) => {
    const token = ++request.current;
    setPendingRoom(id); setError(null);
    try {
      await preloadRoomAsset(studyRoom(id).background);
      if (!alive.current || token !== request.current) return;
      setRoomId(id); setPendingRoom(null);
      if (persist) void AsyncStorage.setItem(STORAGE_KEY, id).catch(() => undefined);
    } catch {
      if (alive.current && token === request.current) { setPendingRoom(null); setError('This room couldn’t load. Tap it to try again.'); }
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    void (async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY).catch(() => null);
      if (!alive.current) return;
      if (isStudyRoomId(stored) && request.current === 0) await choose(stored, false);
      if (!alive.current) return;
      await Promise.allSettled(STUDY_ROOMS.map((room) => preloadRoomAsset(room.thumbnail)));
      // Warm the room plates in small batches. Selection has its own priority path.
      for (let start = 0; alive.current && start < STUDY_ROOMS.length; start += 2) {
        await Promise.allSettled(STUDY_ROOMS.slice(start, start + 2).map((room) => preloadRoomAsset(room.background)));
      }
    })();
    return () => { alive.current = false; request.current += 1; };
  }, [choose]);
  return { roomId, pendingRoom, error, chooseRoom: (id: StudyRoomId) => { void choose(id); } };
}
