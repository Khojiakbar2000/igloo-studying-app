import { useCompanionName } from '../onboarding/ProfileProvider';
import { MysteryGifts, GiftDecorAnimation } from '../gifts/MysteryGifts';
import { FurnitureBounds, FurnitureDirectory, FurnitureHotspot, useFurnitureController } from '../furniture/Furniture';
import { Bookshelf, BedPip, FurnitureLink, SofaActions, useFurnitureRest } from '../furniture/RoomFurniture';
import { boxStyle, decorOffset, isMovableDecor, pixelBox, roomBox } from '../furniture/catalog';
import { RoomGuideHighlights, useRoomGuide } from '../home/RoomGuide';
import { pendingGifts } from '../gifts/progression';
import { studyMilestones } from '../awards/progression';
import { WinterGarden } from '../garden/WinterGarden';
import { PetCorner } from '../pets/PetCorner';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { colors, metrics, radii, space, type, ui } from '../theme';
import { Balance, Button, IconButton, ScreenHeader, Segmented } from '../ui/Controls';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { LivingAwards } from '../awards/LivingAwards';
import { HomeAtmosphere } from './HomeAtmosphere';
import { AmbientSoundTrigger } from '../ambient/AmbientSoundControls';
import { useHomeMotion } from '../home/useHomeMotion';
import { DAY_PHASES, localDayPhase, FOCUS_STORM_UNLOCK_MS, type AtmospherePreference } from '../home/atmosphere';
import { preloadHome } from '../home/preload';
import { usePomodoro } from '../state/PomodoroContext';
import { HOME_CATALOG, HOME_CATEGORIES, homeItem } from '../home/catalog';
import { COFFEE_STATION, HOME_SLOTS, type HomeSlot } from '../home/slots';
import { HOME_ART } from '../home/art';
import { PANORAMA, PANORAMA_SLOTS, PANORAMA_PROPS, PANORAMA_DESK_TARGET, ROOM_ZONES, cameraOffset, panoramaBounds, type RoomZone } from '../home/panorama';
import { PANORAMA_SHELL, PANORAMA_FIXTURES } from '../home/panoramaArt';
import { PanoramaSprite } from '../home/PanoramaSprite';
import { useAmbientSound } from '../ambient/AmbientSoundProvider';
import { RoomCharacterOverlay } from './RoomCharacterOverlay';
import { IglooWindowInteraction } from '../scenes/IglooWindowInteractionScene';
import { PipMailbox } from '../messages/PipMailbox';
import { STUDY_ROOMS } from '../home/state';
import { StudyRoomPicker } from '../home/StudyRoomPicker';
import { StudyWorld } from '../home/StudyWorld';
import { furniturePositions, worlds } from '../home/studyWorlds';

const ORIGINAL = require('../../assets/environments/igloo/concepts/my-igloo-warm-nordic.jpg');
function ToolIcon({ kind }: { kind: 'furniture' | 'shop' | 'wardrobe' | 'help' }) {
 const common = { stroke: colors.ink, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
 return <Svg width={metrics.icon} height={metrics.icon} viewBox="0 0 24 24" {...common}>
  {kind === 'furniture' && <><Path d="M4 12h16v7H4zM6 12V9a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v3M6 19v2m12-2v2"/><Path d="M7 15h10"/></>}
  {kind === 'shop' && <><Path d="M4 9h16l-1.2 11H5.2L4 9ZM3 9l2-5h14l2 5M9 9V6m6 3V6"/><Path d="M10 14h4"/></>}
  {kind === 'wardrobe' && <><Rect x="5" y="3" width="14" height="18" rx="2"/><Path d="M12 3v18M9.5 12h.5m4 0h.5M5 18h14"/></>}
  {kind === 'help' && <><Circle cx="12" cy="12" r="9"/><Path d="M9.5 9a2.5 2.5 0 1 1 4.1 1.9c-.9.7-1.6 1.1-1.6 2.6M12 17h.01"/></>}
 </Svg>;
}
export function CustomizableHome({ onOpenWardrobe, onOpenTimer, onOpenCoffeeMachine, onOpenWindow, request, onRequestHandled }: {onOpenWindow: () => void; request?: 'bed' | 'decorate' | 'help' | null; onRequestHandled?: () => void; onOpenWardrobe: () => void; onOpenTimer: () => void; onOpenCoffeeMachine: () => void}) {
 const {timer, hydrated, storageError, retrySave, buyFurniture, equipFurniture, removeFurniture, arrangeHome, setAtmosphere, setSnowfall, toggleRoomLight, moveDecoration, selectStudyRoom} = usePomodoro();
 const companion=useCompanionName();
 const home = timer.home;
 const activeRoom = home.activeRoom ?? 'igloo';
 const alternate = activeRoom === 'igloo' ? null : activeRoom;
 const worldSlots = alternate ? furniturePositions(worlds[alternate]) : null;
 const availableItems = worldSlots ? HOME_CATALOG.filter(item => worldSlots[item.slot]) : HOME_CATALOG;
 const availableCategories = HOME_CATEGORIES.filter(category => availableItems.some(item => item.category === category));
 const viewport = useWindowDimensions();
 const roomWidth = Math.max(200, Math.min(402, viewport.width - 28));
 const ambientAudio = useAmbientSound();
 const sceneSound = alternate === 'ocean' ? 'ocean' : alternate === 'treehouse' ? 'forest'
  : alternate === 'library' ? 'fireplace' : alternate === 'observatory' ? 'night' : null;
 const remaining = Math.ceil(timer.remainingMs / 1000);
 const focusClock = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
 const [hour,setHour]=useState(new Date().getHours());
 const [roomVisible,setRoomVisible]=useState(true);
 const roomBounds=useRef({y:0,height:0}),viewportHeight=useRef(900),scrollY=useRef(0);
 useEffect(()=>{const tick=setInterval(()=>setHour(new Date().getHours()),60000);return()=>clearInterval(tick);},[]);
 const motion=useHomeMotion(roomVisible);
 const phase=home.atmosphere==='auto'?localDayPhase(hour):home.atmosphere;
 const [editor, setEditor] = useState<'decorate' | 'shop' | null>(null);
 const [category,setCategory] = useState('Beds');
 const [preview,setPreview] = useState<string | null>(null);
 const [ready,setReady] = useState(false), [assetError,setAssetError] = useState(false), [attempt,setAttempt] = useState(0);
 const [readyItemIds,setReadyItemIds] = useState<Set<string>>(() => new Set());
 const [categoryLoading,setCategoryLoading] = useState(false);
 const [settled,setSettled] = useState(false), [windowActive,setWindowActive] = useState(false);
 const [notice,setNotice] = useState('');
 const [discoverySeen,setDiscoverySeen] = useState<string[] | null>(null);
 const seenRooms = useRef<string[] | null>(null);
 const [roomPicker,setRoomPicker]=useState(false);
 useEffect(() => {
  let alive = true;
  void AsyncStorage.getItem('igloo.room-discovery.v1').then(raw => {
   if (!alive) return;
   let saved: unknown;
   try { saved = raw ? JSON.parse(raw) : []; } catch {}
   const seen = Array.isArray(saved) ? saved.filter((id): id is string => typeof id === 'string') : [];
   seenRooms.current = seen;
   setDiscoverySeen(seen);
  }).catch(() => {
   if (!alive) return;
   seenRooms.current = [];
   setDiscoverySeen([]);
  });
  return () => { alive = false; };
 },[]);
 const discoverRoom = () => {
  if (!alternate || !seenRooms.current || seenRooms.current.includes(alternate)) return;
  const seen = [...seenRooms.current, alternate];
  seenRooms.current = seen;
  setDiscoverySeen(seen);
  void AsyncStorage.setItem('igloo.room-discovery.v1', JSON.stringify(seen)).catch(() => undefined);
 };
 const scroll = useRef<ScrollView>(null);
 const categoryItemIds = availableItems.filter(item => item.category===category&&((editor==='shop'&&!item.giftOnly)||home.owned.includes(item.id))).map(item=>item.id);
 const categoryItemKey = categoryItemIds.join('|');
 const markItemsReady = (ids: readonly string[]) => setReadyItemIds(current => new Set([...current,...ids]));
 useEffect(() => {
  if(!hydrated)return;
  let alive=true;
  const equippedIds=Object.values(home.equipped).filter((id):id is string=>typeof id==='string');
  setReady(false);setAssetError(false);
  void preloadHome(equippedIds).then(()=>{if(alive){markItemsReady(equippedIds);setReady(true);}}).catch(()=>{if(alive)setAssetError(true);});
  return()=>{alive=false;};
 },[attempt,hydrated,activeRoom]);
 useEffect(() => {
  if(!ready||!editor)return;
  let alive=true;
  setCategoryLoading(categoryItemIds.length>0);
  void preloadHome(categoryItemIds).then(()=>{if(alive){markItemsReady(categoryItemIds);setCategoryLoading(false);}}).catch(()=>{if(alive){setCategoryLoading(false);setNotice('Some previews are unavailable. Tap an item to retry loading it.');}});
  return()=>{alive=false;};
 },[ready,editor,categoryItemKey]);
 const original = !alternate && (home.originalRoom || !ready || assetError || windowActive);
 const panoramic = !alternate && !original;
 const roomHeight = alternate ? roomWidth : panoramic ? Math.max(330, Math.min(558, viewport.height - 244)) : roomWidth * 1.5;
 const worldWidth = panoramic ? roomHeight * PANORAMA.width / PANORAMA.height : roomWidth;
 const [zone, setZone] = useState<RoomZone>('study');
 const zoneRef = useRef<RoomZone>('study');
 const camera = useRef<ScrollView>(null);
 const moveCamera = (next: RoomZone, animate = true) => {
  zoneRef.current = next;
  setZone(next);
  camera.current?.scrollTo({ x: cameraOffset(next, worldWidth, roomWidth), animated: animate && motion });
 };
 useLayoutEffect(() => {
  if (!panoramic) return;
  const frame = requestAnimationFrame(() => camera.current?.scrollTo({ x: cameraOffset(zoneRef.current, worldWidth, roomWidth), animated: false }));
  return () => cancelAnimationFrame(frame);
 }, [panoramic, roomWidth, worldWidth]);
 const zoneFromOffset = (x: number) => {
  if (!panoramic || worldWidth <= roomWidth) return;
  const fraction = Math.max(0, Math.min(1, x / (worldWidth - roomWidth)));
  const next = ROOM_ZONES[Math.round(fraction * (ROOM_ZONES.length - 1))].id;
  if (zoneRef.current === next) return;
  zoneRef.current = next;
  setZone(next);
 };
 const [sofaOpen, setSofaOpen] = useState(false);
 const openEditor = (kind: 'decorate' | 'shop') => {
  if (!availableCategories.includes(category)) setCategory('Desks');
  setEditor(editor === kind ? null : kind);
  setPreview(null);
 };
 const rest = useFurnitureRest(hydrated && settled && !windowActive);
 const lastFurniture = useFurnitureController()?.last;
 useEffect(() => { if (lastFurniture && lastFurniture.id !== 'sofa') setSofaOpen(false); }, [lastFurniture]);
 useEffect(() => {
  if (!request || request === 'help' || !hydrated) return;
  if (request === 'bed') {
   if (alternate) {selectStudyRoom('igloo'); return;}
   if (!settled) return;
   const { y, height } = roomBounds.current;
   scroll.current?.scrollTo({ y: Math.max(0, y + height * .45), animated: false });
   if (panoramic) moveCamera('lounge');
   rest.queue('bed');
  } else if (!original) {
   setEditor('decorate');
   setCategory(worldSlots?.bed || !alternate ? 'Beds' : 'Desks');
  } else if (home.originalRoom) {
   arrangeHome('fallback');
   return;
  } else return;
  onRequestHandled?.();
 }, [request, hydrated, settled, original, home.originalRoom, rest.queue, arrangeHome, onRequestHandled, alternate, selectStudyRoom]);
 const clearRoom = !windowActive && !editor;
 const inspectDesk = () => {
  if (!home.lighting.sources.lamp) toggleRoomLight('lamp');
  onOpenTimer();
 };
 const restInBed = () => rest.bed ? rest.wake() : rest.queue('bed');
 const studySessions = useMemo(() => studyMilestones(timer.sessions).progress.sessions, [timer.sessions]);
 const giftWaiting = useMemo(() => pendingGifts(timer.sessions, home.gifts).length > 0, [timer.sessions, home.gifts]);
 const focusing = timer.mode === 'focus' && timer.status !== 'idle';
 const furnitureReady = hydrated && !windowActive && ready && !assetError;
 const openFurniture = () => {
  if (!alternate && home.originalRoom) arrangeHome('fallback');
  openEditor('decorate');
 };
 const tip = [
  ...(giftWaiting ? [{ id: 'first-gift', line: 'Tap your gift to see what’s inside!' }] : []),
  ...(home.wardrobe.owned.some(id => id !== 'scarf-teal' && id !== 'cozy-headphones') ? [{ id: 'first-outfit', line: 'Want to try on my new outfit? Open my wardrobe!' }] : []),
  ...(home.garden.plots.some(Boolean) ? [{ id: 'first-plant', line: 'Our garden is growing! Come take a look!' }] : []),
  ...(studySessions > 0 ? [{ id: 'first-session', line: 'Great job! Your studying helps our little world grow!' }] : []),
 ];
 const guide = useRoomGuide({
  ready: hydrated && !windowActive && !editor && !roomPicker && (!!alternate || ready || !!assetError || home.originalRoom),
  snowyIgloo: !alternate,
  focusing, sessions: studySessions, tip, openFurniture: furnitureReady ? openFurniture : undefined,
  directory: !windowActive && <FurnitureDirectory onCustomize={() => {
   if (home.originalRoom) arrangeHome('fallback');
   setEditor('decorate');
  }} />,
 });
 useEffect(() => {
  if (guide.helpOpen) scroll.current?.scrollTo({ y: 0, animated: motion });
 }, [guide.helpOpen, motion]);
 useEffect(() => {
  if (request !== 'help' || !hydrated || windowActive || editor) return;
  if (!guide.helpOpen) guide.toggleHelp();
  onRequestHandled?.();
 }, [request, hydrated, windowActive, editor, guide.helpOpen, guide.toggleHelp, onRequestHandled]);
 const guideTargetX = guide.target ? guide.target.x + guide.target.width / 2 : undefined;
 const guideTargetY = guide.target?.y;
 const guideTargetHeight = guide.target?.height;
 useEffect(() => {
  if (!guide.following) return;
  const frame = requestAnimationFrame(() => {
   if (panoramic && guideTargetX !== undefined) {
    const x = Math.max(0, Math.min(worldWidth - roomWidth, worldWidth * guideTargetX / 100 - roomWidth / 2));
    camera.current?.scrollTo({ x, animated: motion });
    zoneFromOffset(x);
   }
   const { y, height } = roomBounds.current;
   if (guideTargetY !== undefined && guideTargetHeight !== undefined && height) {
    const top = y + height * guideTargetY / 100;
    const bottom = top + height * guideTargetHeight / 100;
    if (top - 32 < scrollY.current || bottom + 16 > scrollY.current + viewportHeight.current) {
     const offset = Math.min(top - 32, bottom + 16 - viewportHeight.current);
     scroll.current?.scrollTo({ y: Math.max(0, offset), animated: false });
    }
   } else {
    scroll.current?.scrollTo({ y: 0, animated: false });
   }
  });
  return () => cancelAnimationFrame(frame);
 }, [guide.following, panoramic, guideTargetX, guideTargetY, guideTargetHeight, worldWidth, roomWidth, motion]);
 const selected = preview ? homeItem(preview) : undefined;
 const layout = {...home.equipped,...(selected ? {[selected.slot]:selected.id} : {})};
 const button = (label: string, action: () => void, disabled = false, subtle = false) =>
  <Button label={label} onPress={action} disabled={disabled} variant={subtle ? 'secondary' : 'primary'} />;

 const tool = (kind: 'furniture' | 'shop' | 'wardrobe' | 'help', label: string, action: () => void, disabled = false, guided = false) =>
  <Pressable key={kind} accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={action}
    style={({ pressed }) => [s.tool, guided && s.guidedTool, disabled && ui.disabled, pressed && ui.pressed]}>
   <ToolIcon kind={kind}/><Text style={s.toolLabel}>{label}</Text>
  </Pressable>;
 const previewItem = (id: string) => {setNotice('Preparing preview…');scroll.current?.scrollTo({y:0,animated:true});void preloadHome([id]).then(()=>{markItemsReady([id]);setPreview(id);const item=homeItem(id);if(item&&panoramic)moveCamera(PANORAMA_SLOTS[item.slot].zone);setNotice('Preview only · your arrangement is safe');}).catch(()=>setNotice('That preview could not be loaded. Tap it again to retry.'));};
 const applySavedArrangement = (kind:'restore'|'undo') => {const ids=Object.values(kind==='restore'?home.saved:home.previous).filter((id):id is string=>typeof id==='string');setNotice('Preparing your saved arrangement…');void preloadHome(ids).then(()=>{markItemsReady(ids);arrangeHome(kind);setPreview(null);setNotice(kind==='restore'?'Saved arrangement restored.':'Previous arrangement restored.');}).catch(()=>setNotice('That arrangement could not be loaded. Try again.'));};
 const world = <View key={panoramic ? 'panorama' : 'original'} testID="my-igloo-world" style={{ width: worldWidth, height: roomHeight }}>
   <Image source={original?ORIGINAL:PANORAMA_SHELL} accessibilityLabel={`${companion}’s cozy personal igloo`} style={s.plate} resizeMode="stretch" onError={()=>setAssetError(true)}/>
   {panoramic && (Object.keys(PANORAMA_SLOTS) as HomeSlot[]).map(slot => {
     const id = layout[slot];
     const box = PANORAMA_SLOTS[slot];
     if (!id || !HOME_ART[id] || slot === 'petBed') return null;
     return <PanoramaSprite key={slot} id={id} source={HOME_ART[id]}
       box={{ ...box, x: box.x + decorOffset(home.decorPlacement, slot) }} z={box.z} shadow={slot === 'bed' || slot === 'sofa' || slot === 'desk' || slot === 'bookshelf'} onError={() => setAssetError(true)}>
       {id.startsWith('gift-') && <GiftDecorAnimation id={id} active={motion && !windowActive} />}
     </PanoramaSprite>;
   })}
   {panoramic && <>
     <PanoramaSprite id="fireplace" source={PANORAMA_FIXTURES.fireplace} box={PANORAMA_PROPS.fireplace} z={2} shadow />
     <PanoramaSprite id="chair" source={PANORAMA_FIXTURES.chair} box={PANORAMA_PROPS.chair} z={2} shadow />
     <PanoramaSprite id="coffeeCabinet" source={PANORAMA_FIXTURES.coffeeCabinet} box={PANORAMA_PROPS.coffeeCabinet} z={3} shadow />
     <PanoramaSprite id="coffee" source={PANORAMA_FIXTURES.coffee} box={PANORAMA_PROPS.coffee} z={4} />
     <PanoramaSprite id="evergreen" source={PANORAMA_FIXTURES.evergreen} box={PANORAMA_PROPS.evergreen} z={2} shadow />
   </>}
   {!panoramic && !windowActive && <View pointerEvents="none" style={[s.roomObject, boxStyle(pixelBox(COFFEE_STATION))]}>
     <Image source={PANORAMA_FIXTURES.coffee} resizeMode="contain" accessibilityLabel="Warm wooden coffee machine" style={s.objectFill} />
   </View>}
   <RoomCharacterOverlay mode="personal" panoramic={panoramic} hidden={windowActive || !!rest.bed} onSettledChange={setSettled} equipped={home.wardrobe.equipped} homeIdle roomVisible={roomVisible&&!roomPicker} ambientMotion={motion&&!windowActive&&!roomPicker}/>
   <HomeAtmosphere lampOn={home.lighting.sources[layout.lighting === 'lamp-lantern' ? 'lantern' : 'lamp']} phase={phase} layout={layout} original={original} panoramic={panoramic} fireplace={home.lighting.sources.fireplace} motion={motion&&!windowActive&&!roomPicker} snowfall={home.snowfall} gusts={timer.focusTotalMs>=FOCUS_STORM_UNLOCK_MS}/>
   {original && <IglooWindowInteraction ready={settled && hydrated} onRunStateChange={setWindowActive}/>}
   {!windowActive && <><AmbientSoundTrigger placement="igloo" bounds={panoramic ? panoramaBounds(PANORAMA_PROPS.radio) : undefined} /><LivingAwards visible={roomVisible} settled={settled} placement={panoramic ? panoramaBounds(PANORAMA_PROPS.awards) : undefined} />{(ready || home.originalRoom || assetError) && <PetCorner room={panoramic ? 'panorama' : 'original'} previewBed={layout.petBed} visible={roomVisible} pipMoving={!settled} pipBusy={!settled} />}<PipMailbox bounds={panoramic ? panoramaBounds(PANORAMA_PROPS.mailbox) : undefined} visible={roomVisible&&!windowActive} onOpenTimer={onOpenTimer} onOpenCoffeeMachine={onOpenCoffeeMachine} /></>}
   {rest.bed && roomVisible && <BedPip panoramic={panoramic} resting={rest.bed === 'away'} onHome={rest.onHome} original={original} />}
   {clearRoom && <>
     <Bookshelf bounds={panoramic && layout.bookshelf ? panoramaBounds(PANORAMA_SLOTS.bookshelf) : undefined} />
     <FurnitureHotspot id="desk" bounds={panoramic ? panoramaBounds(PANORAMA_DESK_TARGET) : roomBox(67, 50, 20, 12)} onPress={inspectDesk} />
     <FurnitureHotspot id="bed" bounds={panoramic ? panoramaBounds(PANORAMA_SLOTS.bed) : roomBox(7, 74, 25, 8)} onPress={restInBed} state={rest.bed ? `${companion} is resting` : rest.queued === 'bed' ? 'Queued' : 'Ready'} />
     {panoramic && layout.sofa ? <FurnitureHotspot id="sofa" bounds={panoramaBounds(PANORAMA_SLOTS.sofa)} onPress={() => setSofaOpen(value => !value)} />
       : <FurnitureLink id="sofa" action={() => setSofaOpen(value => !value)} />}
     {panoramic ? <FurnitureHotspot id="window" bounds={panoramaBounds(PANORAMA_SLOTS.window)} onPress={onOpenWindow} />
       : <FurnitureLink id="window" action={onOpenWindow} />}
     <FurnitureHotspot id={layout.lighting === 'lamp-lantern' ? 'lantern' : 'lamp'} bounds={panoramic ? panoramaBounds(PANORAMA_SLOTS.lighting) : roomBox(88, 41, 11, 7)}
       onPress={() => toggleRoomLight(layout.lighting === 'lamp-lantern' ? 'lantern' : 'lamp')}
       state={home.lighting.sources[layout.lighting === 'lamp-lantern' ? 'lantern' : 'lamp'] ? 'On' : 'Off'} />
     <FurnitureLink id="wardrobe" action={onOpenWardrobe} />
     <FurnitureHotspot id="coffee" bounds={panoramic ? panoramaBounds(PANORAMA_PROPS.coffee) : pixelBox(COFFEE_STATION)} onPress={onOpenCoffeeMachine} />
     {panoramic && <FurnitureHotspot id="fireplace" bounds={panoramaBounds(PANORAMA_PROPS.fireplace)}
       onPress={() => { if (!home.lighting.sources.fireplace) ambientAudio.unlockAudio(); toggleRoomLight('fireplace'); }}
       state={home.lighting.sources.fireplace ? 'On' : 'Off'} />}
   </>}
   {!windowActive && <WinterGarden bounds={panoramic ? panoramaBounds(PANORAMA_PROPS.garden) : undefined} visible={roomVisible} original={original} busy={!settled} />}
   {!windowActive && <MysteryGifts placement={panoramic ? panoramaBounds(PANORAMA_PROPS.gifts) : undefined} visible={roomVisible} />}
   <FurnitureBounds />
   <RoomGuideHighlights highlights={guide.highlights} reduced={guide.reduced} dim={guide.following && !guide.showingObjects} />
 </View>;
 return <View style={s.immersive}>
  <ScrollView ref={scroll} style={s.screen} contentContainerStyle={s.content} onLayout={e=>{viewportHeight.current=e.nativeEvent.layout.height;}} scrollEventThrottle={200} onScroll={e=>{const y=e.nativeEvent.contentOffset.y,b=roomBounds.current;scrollY.current=y;setRoomVisible(y<b.y+b.height&&y+viewportHeight.current>b.y);}}>
  <ScreenHeader title="My Igloo" style={s.header} actions={<>
    <Balance amount={home.snowflakes} />
    <IconButton label="Igloo help and settings" onPress={guide.toggleHelp}><ToolIcon kind="help" /></IconButton>
  </>} />
  {guide.panel && <View style={[s.guidePanel, { width: roomWidth }]}>{guide.panel}</View>}
  <View testID="my-igloo-camera" style={[s.room, { width: roomWidth, height: roomHeight }]}
    onLayout={event => { roomBounds.current = event.nativeEvent.layout; }}>
    {alternate ? <StudyWorld key={alternate} id={alternate} layout={layout} home={home}
      moving={motion && !roomPicker} visible={roomVisible && !roomPicker} interactive={hydrated && !editor}
      discover={!!discoverySeen && !discoverySeen.includes(alternate) && !focusing && !guide.helpOpen}
      showObjects={guide.showingObjects} onDiscover={discoverRoom}
      inspectDesk={onOpenTimer} onWardrobe={onOpenWardrobe}
      toggleLamp={() => toggleRoomLight(layout.lighting === 'lamp-lantern' ? 'lantern' : 'lamp')}
      decorate={slot => {
       const item = availableItems.find(item => item.slot === slot);
       if (item) {setCategory(item.category); setEditor('decorate'); setPreview(null);}
      }} /> : panoramic ? <ScrollView ref={camera} horizontal showsHorizontalScrollIndicator={false} directionalLockEnabled
      decelerationRate="fast" scrollEventThrottle={16} onScroll={event => zoneFromOffset(event.nativeEvent.contentOffset.x)}
      importantForAccessibility="auto" accessibilityLabel="Pan around My Igloo" nestedScrollEnabled style={s.camera}>
        {world}
      </ScrollView> : world}
    {!alternate && <SofaActions open={sofaOpen && clearRoom} onClose={() => setSofaOpen(false)}
      onSelect={action => { setSofaOpen(false); rest.queue(action); }} queued={rest.queued} onCancel={() => rest.queue(null)} />}
    {selected && !original && <View pointerEvents="none" style={s.previewBadge}><Text style={s.previewText}>Preview · {selected.name}</Text></View>}
  </View>
  <View style={{width:roomWidth, marginTop:space.sm}}>
   <Button label={`Change room · ${STUDY_ROOMS.find(room => room.id === activeRoom)?.name}`}
     onPress={() => setRoomPicker(true)} disabled={!hydrated || windowActive} variant="secondary" />
  </View>
  {alternate && <View style={{width:roomWidth,marginTop:space.sm}}>
   <View style={s.soundActions}>
    {sceneSound && <Button label={ambientAudio.prefs.selected.includes(sceneSound) ? `Remove ${sceneSound} sound` : `Play ${sceneSound} sound`}
      disabled={!ambientAudio.ready} variant="secondary" onPress={() => ambientAudio.toggleTrack(sceneSound)} />}
    <Button label="Sound mixer" variant="secondary" onPress={() => ambientAudio.setOpen(true)} />
   </View>
  </View>}
  {roomPicker && <StudyRoomPicker home={home} sessions={studySessions} motion={motion} close={() => setRoomPicker(false)}
    select={id => {
     setRoomPicker(false);
     if (id === activeRoom) return;
     selectStudyRoom(id);
     setEditor(null);
     setPreview(null);
     setNotice('');
     setSettled(false);
     setSofaOpen(false);
     scroll.current?.scrollTo({y:0,animated:false});
    }} />}
  {panoramic && <View style={{ width: roomWidth, marginTop: space.sm }}>
    <Segmented label="Igloo views" options={ROOM_ZONES} value={zone} onChange={moveCamera} />
  </View>}
  <View style={[s.toolDock,{width:Math.min(roomWidth,viewport.width-24)}]}>
   {tool('furniture','Furniture',()=>{guide.onDecorate();openFurniture();},!furnitureReady,guide.decorating)}
   {tool('shop','Shop',()=>{
    if (!alternate && home.originalRoom) arrangeHome('fallback');
    openEditor('shop');
   },!hydrated||windowActive||!ready||assetError)}
   {tool('wardrobe','Wardrobe',()=>{guide.onWardrobe();onOpenWardrobe();},!hydrated||windowActive,guide.wardrobe)}
  </View>
  {timer.mode==='focus'&&timer.status!=='idle'&&<Pressable accessibilityRole="button" accessibilityLabel="Open active focus timer" onPress={onOpenTimer} style={s.focusLink}><Text style={s.focusLinkText}>{timer.status==='paused'?'Focus paused':'Focusing'} · {focusClock} ›</Text></Pressable>}
  {rest.queued && <Text style={s.caption} accessibilityLiveRegion="polite">{companion}’s {rest.queued} is queued.</Text>}
  {selected&&!original&&<View style={s.panel}><Text style={s.cardTitle}>{selected.name}</Text><Text style={s.caption}>{home.owned.includes(selected.id)?'Already yours. Make yourself at home.':`${selected.price} ❄️${home.snowflakes === Infinity ? '' : ` · ${Math.max(0,selected.price-home.snowflakes)} more to save`}`}</Text><View style={s.toolbar}>{button(home.owned.includes(selected.id)?'Equip this item':`Buy & equip · ${selected.price} ❄️`,()=>{if(home.owned.includes(selected.id))equipFurniture(selected.id);else buyFurniture(selected.id);setPreview(null);setNotice('A little more you. Arrangement updated.');},!hydrated||(!home.owned.includes(selected.id)&&home.snowflakes<selected.price))}{home.equipped[selected.slot] === selected.id && isMovableDecor(selected.slot) && <>
    {button('Move left',()=>moveDecoration(selected.slot,-1),home.decorPlacement[selected.slot]===-1,true)}
    {button('Move right',()=>moveDecoration(selected.slot,1),home.decorPlacement[selected.slot]===1,true)}
   </>}{button('Cancel preview',()=>{setPreview(null);setNotice('');},false,true)}</View></View>}
  {!!notice&&<Text accessibilityLiveRegion="polite" style={s.notice}>{notice}</Text>}
  {storageError&&<View style={s.panel}><Text style={s.caption}>Your home couldn’t be saved. Keep this screen open and try again.</Text>{button('Retry saving',retrySave)}</View>}
  {!ready&&!assetError&&<Text style={s.notice}>Warming up your furniture…</Text>}
  {assetError&&<View style={s.panel}><Text style={s.caption}>We’re showing your original igloo while furniture images are unavailable.</Text>{button('Retry images',()=>{setReady(false);setAttempt(n=>n+1);})}</View>}
  {editor&&!original&&<View style={s.panel}><Text style={s.cardTitle}>{editor==='shop'?`${companion}’s Cozy Shop`:'Make yourself at home'}</Text><Text style={s.caption}>{editor==='shop'?'Tap an item to try it in your room.':'Choose a category, then tap an item to preview it.'}</Text>
   <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.categories}>{availableCategories.map(c=><Pressable accessibilityRole="button" accessibilityState={{selected:c===category}} key={c} onPress={()=>{setCategory(c);setPreview(null);}} style={[s.chip,c===category&&s.chipActive]}><Text style={[s.chipText,c===category&&s.chipSelected]}>{c}</Text></Pressable>)}</ScrollView>
   <View style={s.grid}>{category==='Ceiling'&&<View style={s.item}><Text style={s.itemName}>Regular snow ceiling</Text><Text style={s.price}>{!home.equipped.ceiling?'✓ Equipped':'Always yours'}</Text>{button('Use regular ceiling',()=>{removeFurniture('ceiling');setPreview(null);},!hydrated,true)}</View>}{availableItems.filter(i=>i.category===category&&((editor==='shop'&&!i.giftOnly)||home.owned.includes(i.id))).map(item=>{const owned=home.owned.includes(item.id),equipped=home.equipped[item.slot]===item.id;return <View key={item.id} style={s.item}><Pressable accessibilityRole="button" accessibilityLabel={`Preview ${item.name}`} onPress={()=>previewItem(item.id)}>{readyItemIds.has(item.id)?<Image source={HOME_ART[item.id]} style={s.thumbnail} resizeMode="contain"/>:<View style={[s.thumbnail,s.thumbnailPending]}><Text style={s.caption}>{categoryLoading?'Loading preview…':'Preparing preview…'}</Text></View>}<Text style={s.itemName}>{item.name}</Text><Text style={s.price}>{equipped?'✓ Equipped':owned?'Owned':`${item.price} ❄️`}</Text><Text style={s.previewLink}>Preview →</Text></Pressable>{equipped&&HOME_SLOTS[item.slot].optional&&button('Remove',()=>{removeFurniture(item.slot);setPreview(null);},!hydrated,true)}</View>;})}</View>
   {editor==='decorate'&&<><Text style={s.caption}>Optional comforts can be removed from their item card.</Text><View style={s.toolbar}>{button('Save arrangement',()=>{arrangeHome('save');setNotice('Arrangement saved.');},!hydrated)}{button('Restore saved',()=>applySavedArrangement('restore'),!hydrated,true)}{button('Undo last change',()=>applySavedArrangement('undo'),!hydrated,true)}{button('Restore default placement',()=>{arrangeHome('default');setPreview(null);setNotice('Default furniture restored.');},!hydrated,true)}</View></>}
   {editor==='decorate'&&!HOME_CATALOG.some(i=>i.category===category&&home.owned.includes(i.id))&&<><Text style={s.caption}>A little space for something lovely. Find your first piece in the shop.</Text>{button('Browse this category',()=>setEditor('shop'),false,true)}</>}
   {button(editor==='shop'?'Done shopping':'Done decorating',()=>{setEditor(null);setPreview(null);},false,true)}
  </View>}
 </ScrollView>
 </View>;
}
const s=StyleSheet.create({
 soundActions:{flexDirection:'row',flexWrap:'wrap',gap:8},
 camera: { flex: 1 },
 roomObject: { position: 'absolute' },
 objectFill: { width: '100%', height: '100%' },
 header: { alignSelf: 'stretch' },
 toolDock: { flexDirection: 'row', justifyContent: 'space-around', marginTop: space.sm, padding: space.xs, borderRadius: radii.control, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
 tool: { flex: 1, minHeight: metrics.hit, borderRadius: radii.control, alignItems: 'center', justifyContent: 'center', gap: 2 },
 toolLabel: { ...type.caption, color: colors.ink },
 guidedTool: { backgroundColor: colors.goldWash },
 guidePanel:{marginBottom:space.sm},
 focusLink:{width:'100%',maxWidth:390,minHeight:44,justifyContent:'center',paddingHorizontal:13,marginTop:8,borderRadius:12,backgroundColor:colors.ice},
 focusLinkText:{color:colors.link,fontSize:14,fontWeight:'800'},
 atmosphereBar:{width:'100%',maxWidth:390,marginTop:2,marginBottom:12},weatherSwitch:{minHeight:40,justifyContent:'center'},atmosphereHint:{maxWidth:390,color:colors.muted,fontSize:11,lineHeight:17,textAlign:'center',marginTop:10},
 immersive:{flex:1,backgroundColor:'transparent',position:'relative'},furnitureShortcut:{position:'absolute',zIndex:40,bottom:88,alignSelf:'center'},roomFill:{...StyleSheet.absoluteFillObject,width:'100%',height:'100%'},screen:{flex:1,backgroundColor:'transparent'},content:{flexGrow:1,paddingBottom:space.xl,alignItems:'center'},heading:{width:'100%',maxWidth:390,marginVertical:12},eyebrow:{color:colors.link,fontSize:9,fontWeight:'800',letterSpacing:1.4},title:{color:colors.ink,fontSize:27,fontWeight:'800',marginTop:8},caption:{color:colors.muted,fontSize:12,lineHeight:19,marginTop:5},balance:{width:'100%',maxWidth:390,backgroundColor:colors.cream,borderRadius:18,padding:14,borderWidth:1,borderColor:colors.line,shadowColor:colors.shadow,shadowOpacity:.12,shadowRadius:12,shadowOffset:{width:0,height:5},elevation:2},balanceTitle:{color:colors.link,fontWeight:'800',fontSize:17},toolbar:{flexDirection:'row',flexWrap:'wrap',gap:8,marginVertical:12,width:'100%',maxWidth:390},button:{paddingHorizontal:13,paddingVertical:12,borderRadius:13,backgroundColor:colors.link,minHeight:44,justifyContent:'center'},subtle:{backgroundColor:colors.cream},buttonText:{color:colors.primaryInk,fontSize:12,fontWeight:'800'},dark:{color:colors.link},disabled:{opacity:.4},room:{borderRadius:radii.scene,overflow:'hidden',position:'relative'},plate:{position:'absolute',width:'100%',height:'100%'},panel:{...ui.card,width:'92%',maxWidth:390,marginTop:space.md},cardTitle:{fontSize:18,fontWeight:'800',color:colors.ink},notice:{fontSize:12,color:colors.link,marginTop:10,textAlign:'center'},categories:{gap:7,paddingVertical:14},chip:{paddingHorizontal:13,paddingVertical:10,borderRadius:20,backgroundColor:colors.cream,minHeight:40},chipActive:{backgroundColor:colors.link},chipText:{color:colors.ink,fontSize:12,fontWeight:'700'},chipSelected:{color:colors.primaryInk},grid:{flexDirection:'row',flexWrap:'wrap',gap:10},item:{width:'48%',padding:10,borderRadius:15,backgroundColor:colors.cream,marginBottom:4},thumbnail:{width:'100%',height:100},thumbnailPending:{backgroundColor:colors.iceBlue,alignItems:'center',justifyContent:'center'},itemName:{fontSize:13,fontWeight:'800',color:colors.ink,marginTop:7},price:{fontSize:12,color:colors.link,marginTop:5},previewLink:{fontSize:11,fontWeight:'700',color:colors.link,marginVertical:8},previewBadge:{position:'absolute',top:12,left:12,right:12,backgroundColor:colors.goldWash,borderRadius:10,padding:9},previewText:{color:colors.ink,fontSize:10,fontWeight:'800',textAlign:'center'},
});
