import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isPersonalIglooStage, PERSONAL_IGLOO_STAGES, personalIglooStage, type PersonalIglooStage } from '../scenes/personalIglooStages';
import { preloadRoomAsset } from './useStudyRooms';

const KEY = 'igloo.personal-room-style.v1';
export function usePersonalIgloo() {
  const [stage, setStage] = useState<PersonalIglooStage>('little');
  const [pending, setPending] = useState<PersonalIglooStage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const request = useRef(0);
  const interacted = useRef(false);
  const alive = useRef(true);
  const chooseStage = useCallback(async (id: PersonalIglooStage, persist = true) => {
    if (persist) interacted.current = true;
    const token = ++request.current;
    setPending(id); setError(null);
    try {
      await preloadRoomAsset(personalIglooStage(id).source);
      if (!alive.current || token !== request.current) return;
      setStage(id); setPending(null);
      if (persist) void AsyncStorage.setItem(KEY, id).catch(() => { if (alive.current && token === request.current) setError('This room choice hasn’t saved yet. Tap it to try again.'); });
    } catch {
      if (alive.current && token === request.current) { setPending(null); setError('This room couldn’t load. Your current room is safe. Tap to try again.'); }
    }
  }, []);
  useEffect(() => {
    alive.current = true;
    void (async () => {
      const saved = await AsyncStorage.getItem(KEY).catch(() => null);
      if (!alive.current) return;
      if (isPersonalIglooStage(saved) && !interacted.current) await chooseStage(saved, false);
      for (const room of PERSONAL_IGLOO_STAGES) {
        if (!alive.current) return;
        await Promise.allSettled([preloadRoomAsset(room.thumbnail), preloadRoomAsset(room.source)]);
      }
    })();
    return () => { alive.current = false; request.current += 1; };
  }, [chooseStage]);
  return { stage, pending, error, chooseStage: (id: PersonalIglooStage) => { void chooseStage(id); } };
}
