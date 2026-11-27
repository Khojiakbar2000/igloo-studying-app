import { studyMilestones } from '../awards/progression';
import { addPlanToGoals } from '../onboarding/profile';
import type { GiftId, GiftState } from '../gifts/progression';
import { changeGarden, type GardenAction } from '../garden/progression';
import type { SurpriseId } from '../window-surprises/events';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { changeAward, type AwardAction, type AwardId } from '../awards/progression';
import { changePet, type PetAction } from '../pets/pets';
import { AppState } from 'react-native';
import { defaultTimerState, loadTimerState, reconcileTimer, saveTimerState, startTimer, pauseTimer, finishTimer, startFocusTimer, prepareFocusTimer, setFocusDuration, type TimerState } from './timer';
import { addDailyGoal, editDailyGoal, completeDailyGoal, deleteDailyGoal, moveGoalToTomorrow, moveGoalToToday, reviewGoalSession, localDateKey } from './dailyGoals';

import { switchStudyRoom, type StudyRoomId, claimMysteryGift, moveHomeDecoration, equipHome, purchaseHome, removeHome, arrangeHomeState, purchaseWardrobe, equipWardrobe, removeWardrobeEquipment, removeWardrobeSkin, saveWardrobeOutfit, equipWardrobeOutfit, deleteWardrobeOutfit, type HomeState } from '../home/state';
import type { AtmospherePreference } from '../home/atmosphere';
import { presetLighting, type LightSource, type LightingPreset } from '../home/lighting';
import type { HomeSlot } from '../home/slots';
import type { EquipmentSlot } from '../wardrobe/catalog';
import { syncPipMail, updateLetter } from '../messages/pipMessages';

type PomodoroApi = {
  importStudyPlan: (plan: readonly string[], start: string) => void;
  claimGift: (id: GiftId) => void;
  savedGifts: GiftState;
  moveDecoration: (slot: HomeSlot, direction: -1 | 1) => void;
  setFurnitureSounds: (enabled: boolean) => void;
  updateGarden: (action: GardenAction) => void;
  discoverSurprise: (event: SurpriseId) => void;
  setSurpriseSounds: (enabled: boolean) => void;
  updatePet: (action: PetAction) => void;
  arrangeAward: (id: AwardId, action: AwardAction) => void;
  setAtmosphere: (value: AtmospherePreference) => void; setSnowfall: (value: boolean) => void;
  setLightingPreset: (value: LightingPreset) => void; setLightingBrightness: (value: number) => void; toggleRoomLight: (value: LightSource) => void;
  syncPipMessages: (kind: 'visit' | 'activity', userName: string, rainyScene?: boolean, studyTopic?: string) => void; updatePipLetter: (id: string, action: string) => void;
  buyFurniture: (id: string) => void; equipFurniture: (id: string) => void; removeFurniture: (slot: HomeSlot) => void; arrangeHome: (action: 'save' | 'restore' | 'undo' | 'fallback' | 'default') => void; selectStudyRoom: (id: StudyRoomId) => void;
  buyWardrobeItem: (id: string) => void; equipWardrobeItem: (id: string) => void; removeWardrobeSlot: (slot: EquipmentSlot) => void; removeWardrobeSkin: () => void;
  saveWardrobeLook: (name: string) => void; equipWardrobeLook: (id: string) => void; deleteWardrobeLook: (id: string) => void;
  timer: TimerState; hydrated: boolean; today: string; storageError: boolean; retrySave: () => void;
  start: () => void; pause: () => void; finish: () => void; prepareFocus: () => void; setFocusMinutes: (minutes: number, preferred?: boolean) => void; startFocus: (minutes?: number) => void;
  addGoal: (title: string) => void; editGoal: (id: string, title: string) => void; deleteGoal: (id: string) => void;
  completeGoal: (id: string, completed: boolean) => void; moveGoal: (id: string, target?: 'today' | 'tomorrow') => void;
  selectGoal: (id: string | null) => void; reviewSession: (id: string, finished: boolean) => void;
};
const PomodoroContext = createContext<PomodoroApi | null>(null);

export function PomodoroProvider({ children }: { children: React.ReactNode }) {
  const [timer, setTimer] = useState(defaultTimerState);
  const [savedGifts, setSavedGifts] = useState<GiftState>(defaultTimerState.home.gifts);
  const [hydrated, setHydrated] = useState(false);
  const [today, setToday] = useState(localDateKey());
  const [storageError, setStorageError] = useState(false);
  const lastSaved = useRef<TimerState | null>(null);
  useEffect(() => {
    let alive = true;
    loadTimerState().then((restored) => { if (alive) { setTimer(restored); setSavedGifts(restored.home.gifts); setHydrated(true); } }).catch(() => { if (alive) setStorageError(true); });
    return () => { alive = false; };
  }, []);

  const retrySave = useCallback(() => {
    if (!hydrated) {
      void loadTimerState().then((restored) => { setTimer(restored); setSavedGifts(restored.home.gifts); setHydrated(true); setStorageError(false); }).catch(() => setStorageError(true));
      return;
    }
    void saveTimerState(timer).then(() => { setSavedGifts(timer.home.gifts); setStorageError(false); }).catch(() => setStorageError(true));
  }, [timer, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    // Running timers restore from endAt; don't rewrite growing history every second.
    const previous = lastSaved.current;
    const keys = Object.keys(timer) as (keyof TimerState)[];
    if (previous && keys.every((key) => (key === 'remainingMs' && timer.status === 'running') || timer[key] === previous[key])) return;
    lastSaved.current = timer;
    void saveTimerState(timer).then(() => { setSavedGifts(timer.home.gifts); setStorageError(false); }).catch(() => { lastSaved.current = null; setStorageError(true); });
  }, [timer, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const tick = () => { const now = Date.now(); setToday(localDateKey(now)); setTimer((current) => reconcileTimer(current, now)); };
    const interval = setInterval(tick, 1000);
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') tick(); });
    return () => { clearInterval(interval); subscription.remove(); };
  }, [hydrated]);
  const update = useCallback((recipe: (current: TimerState) => TimerState) => {
    if (hydrated) setTimer(recipe);
  }, [hydrated]);
  const claimGift = useCallback((id: GiftId) => update(state => {
    const home = claimMysteryGift(state.home, state.sessions, id);
    return home === state.home ? state : { ...state, home };
  }), [update]);
  const start = useCallback(() => update((s) => startTimer(s)), [update]);
  const pause = useCallback(() => update((s) => pauseTimer(s)), [update]);
  const prepareFocus = useCallback(() => update(prepareFocusTimer), [update]);
  const finish = useCallback(() => update((s) => finishTimer(s)), [update]);
  const setFocusMinutes = useCallback((minutes: number, preferred?: boolean) => update((s) => setFocusDuration(s, minutes, preferred)), [update]);
  const startFocus = useCallback((minutes?: number) => update((s) => startFocusTimer(s, minutes)), [update]);
  const importStudyPlan = useCallback((plan: readonly string[], start: string) => update(state => addPlanToGoals(state, plan, start)), [update]);
  const addGoal = useCallback((title: string) => update((s) => addDailyGoal(s, title)), [update]);
  const editGoal = useCallback((id: string, title: string) => update((s) => editDailyGoal(s, id, title)), [update]);
  const deleteGoal = useCallback((id: string) => update((s) => deleteDailyGoal(s, id)), [update]);
  const completeGoal = useCallback((id: string, complete: boolean) => update((s) => completeDailyGoal(s, id, complete)), [update]);
  const moveGoal = useCallback((id: string, target: 'today' | 'tomorrow' = 'tomorrow') => update((s) => s.activeFocus?.goalId === id ? s : target === 'today' ? moveGoalToToday(s, id) : moveGoalToTomorrow(s, id)), [update]);
  const selectGoal = useCallback((id: string | null) => update((s) => {
    if (s.activeFocus) return s;
    if (id !== null && !s.goals.some((g) => g.id === id && !g.completedAt && !g.deletedAt && g.date === localDateKey())) return s;
    return { ...s, selectedGoalId: id };
  }), [update]);
  const reviewSession = useCallback((id: string, finished: boolean) => update((s) => reviewGoalSession(s, id, finished)), [update]);
  const changeHome = useCallback((recipe: (home: HomeState) => HomeState) => update(s => { const home = recipe(s.home); return home === s.home ? s : {...s, home}; }), [update]);
  const setAtmosphere = useCallback((value: AtmospherePreference) => changeHome(h => ({...h, atmosphere: value})), [changeHome]);
  const setLightingPreset = useCallback((value: LightingPreset) => changeHome(h => ({...h, lighting: presetLighting(h.lighting, value)})), [changeHome]);
  const setLightingBrightness = useCallback((value: number) => changeHome(h => ({...h, lighting: {...h.lighting, brightness: Math.max(.2, Math.min(1, value))}})), [changeHome]);
  const toggleRoomLight = useCallback((source: LightSource) => changeHome(h => ({...h, lighting: {...h.lighting, sources: {...h.lighting.sources, [source]: !h.lighting.sources[source]}}})), [changeHome]);
  const syncPipMessages = useCallback((kind: 'visit' | 'activity', userName: string, rainyScene = false, studyTopic?: string) => update(state => {
    const mailbox = syncPipMail(state.home.mailbox, { sessions: state.sessions, awards: state.awards, pets: state.home.pets.adopted, discoveries: state.discoveries, snowfall: state.home.snowfall, rainyScene, studyTopic, mode: state.mode, userName, petName: state.home.pets.active ? state.home.pets.names[state.home.pets.active] : undefined }, kind);
    return mailbox === state.home.mailbox ? state : { ...state, home: { ...state.home, mailbox } };
  }), [update]);
  const updatePipLetter = useCallback((id: string, action: string) => update(state => {
    const mailbox = updateLetter(state.home.mailbox, id, action);
    return mailbox === state.home.mailbox ? state : { ...state, home: { ...state.home, mailbox } };
  }), [update]);
  const moveDecoration = useCallback((slot: HomeSlot, direction: -1 | 1) => changeHome(home => moveHomeDecoration(home, slot, direction)), [changeHome]);
  const setFurnitureSounds = useCallback((furnitureSounds: boolean) => changeHome(home => ({ ...home, furnitureSounds })), [changeHome]);
  const setSnowfall = useCallback((value: boolean) => changeHome(h => ({...h, snowfall: value})), [changeHome]);
  const buyFurniture = useCallback((id: string) => changeHome(h => purchaseHome(h, id)), [changeHome]);
  const equipFurniture = useCallback((id: string) => changeHome(h => equipHome(h, id)), [changeHome]);
  const removeFurniture = useCallback((slot: HomeSlot) => changeHome(h => removeHome(h, slot)), [changeHome]);
  const arrangeHome = useCallback((action: 'save' | 'restore' | 'undo' | 'fallback' | 'default') => changeHome(h => arrangeHomeState(h, action)), [changeHome]);
  const selectStudyRoom = useCallback((id: StudyRoomId) => update(state => {
    const home = switchStudyRoom(state.home, id, studyMilestones(state.sessions).progress.sessions);
    return home === state.home ? state : {...state, home};
  }), [update]);
  const buyWardrobeItem = useCallback((id: string) => changeHome(h => purchaseWardrobe(h, id)), [changeHome]);
  const equipWardrobeItem = useCallback((id: string) => changeHome(h => equipWardrobe(h, id)), [changeHome]);
  const removeWardrobeSlot = useCallback((slot: EquipmentSlot) => changeHome(h => removeWardrobeEquipment(h, slot)), [changeHome]);
  const clearWardrobeSkin = useCallback(() => changeHome(removeWardrobeSkin), [changeHome]);
  const saveWardrobeLook = useCallback((name: string) => changeHome(h => saveWardrobeOutfit(h, name)), [changeHome]);
  const equipWardrobeLook = useCallback((id: string) => changeHome(h => equipWardrobeOutfit(h, id)), [changeHome]);
  const deleteWardrobeLook = useCallback((id: string) => changeHome(h => deleteWardrobeOutfit(h, id)), [changeHome]);
  const arrangeAward = useCallback((id: AwardId, action: AwardAction) => update(s => {
    const awards = changeAward(s.awards, id, action);
    return awards === s.awards ? s : { ...s, awards };
  }), [update]);
  const updatePet = useCallback((action: PetAction) => update(s => { const pets=changePet(s.home.pets,s.sessions,action); return pets===s.home.pets?s:{...s,home:{...s.home,pets}}; }),[update]);
  const discoverSurprise = useCallback((event: SurpriseId) => {
    const date = Date.now();
    update(state => state.discoveries[event] !== undefined ? state : {
      ...state, discoveries: { ...state.discoveries, [event]: date },
    });
  }, [update]);
  const setSurpriseSounds = useCallback((enabled: boolean) => update(state =>
    state.surpriseSounds === enabled ? state : { ...state, surpriseSounds: enabled }), [update]);
  const updateGarden = useCallback((action: GardenAction) => update(current => {
    const state = reconcileTimer(current, Date.now());
    const garden = changeGarden(state.home.garden, action, state.sessions);
    return garden === state.home.garden ? state : { ...state, home: { ...state.home, garden } };
  }), [update]);
  const value = useMemo(() => ({ importStudyPlan, claimGift, savedGifts, moveDecoration, setFurnitureSounds, updateGarden, discoverSurprise, setSurpriseSounds, updatePet, arrangeAward, setAtmosphere, setSnowfall, setLightingPreset, setLightingBrightness, toggleRoomLight, syncPipMessages, updatePipLetter, buyFurniture, equipFurniture, removeFurniture, arrangeHome, selectStudyRoom, buyWardrobeItem, equipWardrobeItem, removeWardrobeSlot, removeWardrobeSkin: clearWardrobeSkin, saveWardrobeLook, equipWardrobeLook, deleteWardrobeLook, timer, hydrated, today, storageError, retrySave, start, pause, finish, prepareFocus, setFocusMinutes, startFocus, addGoal, editGoal, deleteGoal, completeGoal, moveGoal, selectGoal, reviewSession }), [importStudyPlan, claimGift, savedGifts, moveDecoration, setFurnitureSounds, updateGarden, discoverSurprise, setSurpriseSounds, updatePet, arrangeAward, setAtmosphere, setSnowfall, setLightingPreset, setLightingBrightness, toggleRoomLight, syncPipMessages, updatePipLetter, buyFurniture, equipFurniture, removeFurniture, arrangeHome, selectStudyRoom, buyWardrobeItem, equipWardrobeItem, removeWardrobeSlot, clearWardrobeSkin, saveWardrobeLook, equipWardrobeLook, deleteWardrobeLook, timer, hydrated, today, storageError, retrySave, start, pause, finish, prepareFocus, setFocusMinutes, startFocus, addGoal, editGoal, deleteGoal, completeGoal, moveGoal, selectGoal, reviewSession]);
  return <PomodoroContext.Provider value={value}>{children}</PomodoroContext.Provider>;
}
export function usePomodoro() {
  const value = useContext(PomodoroContext);
  if (!value) throw new Error('usePomodoro must be used inside PomodoroProvider');
  return value;
}
