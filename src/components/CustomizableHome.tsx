import { useCompanionName } from '../onboarding/ProfileProvider';
import { MysteryGifts, GiftDecorAnimation } from '../gifts/MysteryGifts';
import { FurnitureBounds, FurnitureDirectory, FurnitureHotspot, useFurnitureController } from '../furniture/Furniture';
import { Bookshelf, BedPip, FurnitureLink, SofaActions, useFurnitureRest } from '../furniture/RoomFurniture';
import { decorOffset, isMovableDecor, pixelBox, roomBox } from '../furniture/catalog';
import { RoomGuideHighlights, useRoomGuide } from '../home/RoomGuide';
import { pendingGifts } from '../gifts/progression';
import { studyMilestones } from '../awards/progression';
import { WinterGarden } from '../garden/WinterGarden';
import { PetCorner } from '../pets/PetCorner';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { LivingAwards } from '../awards/LivingAwards';
import { HomeAtmosphere } from './HomeAtmosphere';
import { AmbientSoundTrigger } from '../ambient/AmbientSoundControls';
import { useHomeMotion } from '../home/useHomeMotion';
import { DAY_PHASES, localDayPhase, FOCUS_STORM_UNLOCK_MS, type AtmospherePreference } from '../home/atmosphere';
import { preloadHome } from '../home/preload';
import { usePomodoro } from '../state/PomodoroContext';
import { HOME_CATALOG, HOME_CATEGORIES, homeItem } from '../home/catalog';
import { COFFEE_STATION, HOME_SLOTS, STUDY_DESK_TARGET, type HomeSlot } from '../home/slots';
import { HOME_ART, HOME_FOUNDATION } from '../home/art';
import { RoomCharacterOverlay } from './RoomCharacterOverlay';
import { IglooWindowInteraction } from '../scenes/IglooWindowInteractionScene';
import type { PenguinCustomization } from '../character/penguinCustomization';
import { PipMailbox } from '../messages/PipMailbox';

const ORIGINAL = require('../../assets/environments/igloo/concepts/my-igloo-clean-plate.png');
const COFFEE_MACHINE = require('../../assets/environments/study-together/coffee/machine.png');
function ToolIcon({ kind }: { kind: 'furniture' | 'shop' | 'wardrobe' | 'help' }) {
 const common = { stroke: '#624c68', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
 return <Svg width={22} height={22} viewBox="0 0 24 24" {...common}>
  {kind === 'furniture' && <><Path d="M4 12h16v7H4zM6 12V9a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v3M6 19v2m12-2v2"/><Path d="M7 15h10"/></>}
  {kind === 'shop' && <><Path d="M4 9h16l-1.2 11H5.2L4 9ZM3 9l2-5h14l2 5M9 9V6m6 3V6"/><Path d="M10 14h4"/></>}
  {kind === 'wardrobe' && <><Rect x="5" y="3" width="14" height="18" rx="2"/><Path d="M12 3v18M9.5 12h.5m4 0h.5M5 18h14"/></>}
  {kind === 'help' && <><Circle cx="12" cy="12" r="9"/><Path d="M9.5 9a2.5 2.5 0 1 1 4.1 1.9c-.9.7-1.6 1.1-1.6 2.6M12 17h.01"/></>}
 </Svg>;
}
export function CustomizableHome({ customization, onOpenWardrobe, onOpenTimer, onOpenCoffeeMachine, onOpenWindow, request, onRequestHandled }: {onOpenWindow: () => void; request?: 'bed' | 'decorate' | 'help' | null; onRequestHandled?: () => void; customization: PenguinCustomization; onOpenWardrobe: () => void; onOpenTimer: () => void; onOpenCoffeeMachine: () => void}) {
 const {timer, hydrated, storageError, retrySave, buyFurniture, equipFurniture, removeFurniture, arrangeHome, setAtmosphere, setSnowfall, toggleRoomLight, moveDecoration} = usePomodoro();
 const companion=useCompanionName();
 const home = timer.home;
 const viewport = useWindowDimensions();
 const insets = useSafeAreaInsets();
 const roomWidth = Math.min(390, viewport.width, Math.max(220, (viewport.height - insets.top - 210) * 2 / 3));
 const remaining = Math.ceil(timer.remainingMs / 1000);
 const focusClock = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
 const [hour,setHour]=useState(new Date().getHours());
 const [roomVisible,setRoomVisible]=useState(true);
 const roomBounds=useRef({y:0,height:0}),viewportHeight=useRef(900);
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
 const scroll = useRef<ScrollView>(null);
 const categoryItemIds = HOME_CATALOG.filter(item => item.category===category&&((editor==='shop'&&!item.giftOnly)||home.owned.includes(item.id))).map(item=>item.id);
 const categoryItemKey = categoryItemIds.join('|');
 const markItemsReady = (ids: readonly string[]) => setReadyItemIds(current => new Set([...current,...ids]));
 useEffect(() => {
  if(!hydrated)return;
  let alive=true;
  const equippedIds=Object.values(home.equipped).filter((id):id is string=>typeof id==='string');
  setReady(false);setAssetError(false);
  void preloadHome(equippedIds).then(()=>{if(alive){markItemsReady(equippedIds);setReady(true);}}).catch(()=>{if(alive)setAssetError(true);});
  return()=>{alive=false;};
 },[attempt,hydrated]);
 useEffect(() => {
  if(!ready||!editor)return;
  let alive=true;
  setCategoryLoading(categoryItemIds.length>0);
  void preloadHome(categoryItemIds).then(()=>{if(alive){markItemsReady(categoryItemIds);setCategoryLoading(false);}}).catch(()=>{if(alive){setCategoryLoading(false);setNotice('Some previews are unavailable. Tap an item to retry loading it.');}});
  return()=>{alive=false;};
 },[ready,editor,categoryItemKey]);
 const original = home.originalRoom || !ready || assetError || windowActive;
 const [sofaOpen, setSofaOpen] = useState(false);
 const rest = useFurnitureRest(hydrated && settled && !windowActive);
 const lastFurniture = useFurnitureController()?.last;
 useEffect(() => { if (lastFurniture && lastFurniture.id !== 'sofa') setSofaOpen(false); }, [lastFurniture]);
 useEffect(() => {
  if (!request || request === 'help' || !hydrated) return;
  if (request === 'bed') {
   if (!settled) return;
   const { y, height } = roomBounds.current;
   scroll.current?.scrollTo({ y: Math.max(0, y + height * .45), animated: false });
   rest.queue('bed');
  } else if (!original) {
   setEditor('decorate');
   setCategory('Beds');
  } else if (home.originalRoom) {
   arrangeHome('fallback');
   return;
  } else return;
  onRequestHandled?.();
 }, [request, hydrated, settled, original, home.originalRoom, rest.queue, arrangeHome, onRequestHandled]);
 const clearRoom = !windowActive && !editor;
 const inspectDesk = () => {
  if (!home.lighting.sources.lamp) toggleRoomLight('lamp');
  onOpenTimer();
 };
 const restInBed = () => rest.bed ? rest.wake() : rest.queue('bed');
 const studySessions = useMemo(() => studyMilestones(timer.sessions).progress.sessions, [timer.sessions]);
 const giftWaiting = useMemo(() => pendingGifts(timer.sessions, home.gifts).length > 0, [timer.sessions, home.gifts]);
 const tip = [
  ...(giftWaiting ? [{ id: 'first-gift', line: 'Tap your gift to see what’s inside!' }] : []),
  ...(home.wardrobe.owned.length > 1 ? [{ id: 'first-outfit', line: 'Want to try on my new outfit? Open my wardrobe!' }] : []),
  ...(home.garden.plots.some(Boolean) ? [{ id: 'first-plant', line: 'Our garden is growing! Come take a look!' }] : []),
  ...(studySessions > 0 ? [{ id: 'first-session', line: 'Great job! Your studying helps our little world grow!' }] : []),
 ];
 const guide = useRoomGuide({
  ready: hydrated && !windowActive && !editor,
  focusing: timer.mode === 'focus' && timer.status !== 'idle',
  sessions: studySessions, tip,
  directory: !windowActive && <FurnitureDirectory onCustomize={() => {
   if (home.originalRoom) arrangeHome('fallback');
   setEditor('decorate');
  }} />,
 });
 useEffect(() => {
  if (request !== 'help' || !hydrated || windowActive || editor) return;
  if (!guide.helpOpen) guide.toggleHelp();
  onRequestHandled?.();
 }, [request, hydrated, windowActive, editor, guide.helpOpen, guide.toggleHelp, onRequestHandled]);
 const guideTargetY = guide.target?.y;
 const guideTargetHeight = guide.target?.height;
 useEffect(() => {
  if (!guide.following) return;
  const frame = requestAnimationFrame(() => {
   const { y, height } = roomBounds.current;
   if (guideTargetY !== undefined && guideTargetHeight !== undefined && height) {
    const center = y + height * (guideTargetY + guideTargetHeight / 2) / 100;
    scroll.current?.scrollTo({ y: Math.max(0, center - viewportHeight.current * .39), animated: false });
   } else if (guide.decorating || guide.wardrobe) {
    scroll.current?.scrollTo({ y: 0, animated: false });
   }
  });
  return () => cancelAnimationFrame(frame);
 }, [guide.following, guideTargetY, guideTargetHeight, guide.decorating, guide.wardrobe]);
 const selected = preview ? homeItem(preview) : undefined;
 const layout = {...home.equipped,...(selected ? {[selected.slot]:selected.id} : {})};
 const button = (label: string, action: () => void, disabled = false, subtle = false) => <Pressable accessibilityRole="button" disabled={disabled} onPress={action} style={[s.button,subtle&&s.subtle,disabled&&s.disabled]}><Text style={[s.buttonText,subtle&&s.dark]}>{label}</Text></Pressable>;
 const tool = (kind: 'furniture' | 'shop' | 'wardrobe' | 'help', label: string, action: () => void, disabled = false, guided = false) =>
  <Pressable key={kind} accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={action}
    style={[s.tool, guided && s.guidedTool, disabled && s.disabled]}>
   <ToolIcon kind={kind}/><Text style={s.toolLabel}>{label}</Text>
  </Pressable>;
 const previewItem = (id: string) => {setNotice('Preparing preview…');scroll.current?.scrollTo({y:0,animated:true});void preloadHome([id]).then(()=>{markItemsReady([id]);setPreview(id);setNotice('Preview only · your arrangement is safe');}).catch(()=>setNotice('That preview could not be loaded. Tap it again to retry.'));};
 const applySavedArrangement = (kind:'restore'|'undo') => {const ids=Object.values(kind==='restore'?home.saved:home.previous).filter((id):id is string=>typeof id==='string');setNotice('Preparing your saved arrangement…');void preloadHome(ids).then(()=>{markItemsReady(ids);arrangeHome(kind);setPreview(null);setNotice(kind==='restore'?'Saved arrangement restored.':'Previous arrangement restored.');}).catch(()=>setNotice('That arrangement could not be loaded. Try again.'));};
 return <View style={s.immersive}>
  <ScrollView ref={scroll} style={s.screen} contentContainerStyle={[s.content, {paddingTop: insets.top + 7, paddingHorizontal:0, paddingBottom:84, minHeight: viewport.height, justifyContent: editor ? 'flex-start' : 'center'}]} onLayout={e=>{viewportHeight.current=e.nativeEvent.layout.height;}} scrollEventThrottle={200} onScroll={e=>{const y=e.nativeEvent.contentOffset.y,b=roomBounds.current;setRoomVisible(y<b.y+b.height&&y+viewportHeight.current>b.y);}}>
  <View style={[s.heading,{width:Math.min(viewport.width-24,390),marginVertical:0,marginBottom:9,maxWidth:390,minHeight:44,flexDirection:'row',alignItems:'center',justifyContent:'space-between'}]}>
   <Text style={[s.title,{marginTop:0,fontSize:23,color:'#393253',letterSpacing:-.5}]}>My Igloo</Text>
   <View style={s.headerActions}>
    <View accessibilityLabel={`${home.snowflakes === Infinity ? 'Unlimited' : home.snowflakes} Snowflakes`} style={s.snowflakes}><Text style={s.snowflakeGlyph}>❄</Text><Text style={s.snowflakeCount}>{home.snowflakes === Infinity ? '∞' : home.snowflakes}</Text></View>
    <Pressable accessibilityRole="button" accessibilityLabel="Igloo help and settings" onPress={guide.toggleHelp} style={s.headerHelp}><ToolIcon kind="help"/></Pressable>
   </View>
  </View>
  {timer.mode==='focus'&&timer.status!=='idle'&&<Pressable accessibilityRole="button" accessibilityLabel="Open active focus timer" onPress={onOpenTimer} style={s.focusLink}><Text style={s.focusLinkText}>{timer.status==='paused'?'Focus paused':'Focusing'} · {focusClock} ›</Text></Pressable>}
  <View style={[s.room,{width:roomWidth,borderRadius:18}]} onLayout={e=>{roomBounds.current=e.nativeEvent.layout;}}>
   <Image source={original?ORIGINAL:HOME_FOUNDATION} accessibilityLabel={`${companion}’s cozy personal igloo`} style={s.plate} resizeMode="stretch" onError={()=>setAssetError(true)}/>
   {!original && (Object.keys(HOME_SLOTS) as HomeSlot[]).sort((a,b)=>HOME_SLOTS[a].z-HOME_SLOTS[b].z).map(slot => {const id=layout[slot], box=HOME_SLOTS[slot];return id&&HOME_ART[id]&&slot!=='petBed' ? <View key={slot} pointerEvents="none" style={{position:'absolute',left:`${(box.x+decorOffset(home.decorPlacement,slot))/10.24}%`,top:`${box.y/15.36}%`,width:`${box.width/10.24}%`,height:`${box.height/15.36}%`}}>
    <Image source={HOME_ART[id]} resizeMode="contain" style={{width:'100%',height:'100%'}} onError={()=>setAssetError(true)}/>
    {id.startsWith('gift-')&&<GiftDecorAnimation id={id} active={motion&&!windowActive}/>}
  </View> : null;})}
   {!windowActive && <View pointerEvents="none" style={{position:'absolute',left:`${COFFEE_STATION.x/10.24}%`,top:`${COFFEE_STATION.y/15.36}%`,width:`${COFFEE_STATION.width/10.24}%`,height:`${COFFEE_STATION.height/15.36}%`}}><Image source={COFFEE_MACHINE} resizeMode="contain" accessibilityLabel="Warm wooden coffee machine" style={{width:'100%',height:'100%'}}/></View>}
   <RoomCharacterOverlay mode="personal" hidden={windowActive || !!rest.bed} onSettledChange={setSettled} customization={customization} homeIdle roomVisible={roomVisible} ambientMotion={motion&&!windowActive}/>
   <HomeAtmosphere lampOn={home.lighting.sources[layout.lighting === 'lamp-lantern' ? 'lantern' : 'lamp']} phase={phase} layout={layout} original={original} motion={motion&&!windowActive} snowfall={home.snowfall} gusts={timer.focusTotalMs>=FOCUS_STORM_UNLOCK_MS}/>
   {original && <IglooWindowInteraction ready={settled && hydrated} onRunStateChange={setWindowActive}/>}
   {!windowActive && <><AmbientSoundTrigger placement="igloo" /><LivingAwards visible={roomVisible} settled={settled} />{(ready || home.originalRoom || assetError) && <PetCorner room={original ? 'original' : 'personal'} visible={roomVisible} pipMoving={!settled} pipBusy={!settled} />}<PipMailbox visible={roomVisible&&!windowActive} onOpenTimer={onOpenTimer} onOpenCoffeeMachine={onOpenCoffeeMachine} /></>}
   {rest.bed && roomVisible && <BedPip resting={rest.bed === 'away'} onHome={rest.onHome} original={original} />}
   {clearRoom && <>
     <Bookshelf bounds={!original && layout.bookshelf ? roomBox(77.1,29.6,16.6,18.2) : undefined} />
     <FurnitureHotspot id="desk" bounds={!original ? pixelBox(STUDY_DESK_TARGET) : roomBox(67, 50, 20, 12)} onPress={inspectDesk} />
     <FurnitureHotspot id="bed" bounds={!original ? roomBox(0, 70, 38, 28) : roomBox(7, 74, 25, 8)} onPress={restInBed} state={rest.bed ? 'Pip is resting' : rest.queued === 'bed' ? 'Queued' : 'Ready'} />
     {!original && layout.sofa ? <FurnitureHotspot id="sofa" bounds={roomBox(10, 37, 29, 14)} onPress={() => setSofaOpen(value => !value)} />
       : <FurnitureLink id="sofa" action={() => setSofaOpen(value => !value)} />}
     {!original ? <FurnitureHotspot id="window" bounds={roomBox(35, 28, 29, 11)} onPress={onOpenWindow} />
       : <FurnitureLink id="window" action={onOpenWindow} />}
     <FurnitureHotspot id={layout.lighting === 'lamp-lantern' ? 'lantern' : 'lamp'} bounds={roomBox(88, 41, 11, 7)}
       onPress={() => toggleRoomLight(layout.lighting === 'lamp-lantern' ? 'lantern' : 'lamp')}
       state={home.lighting.sources[layout.lighting === 'lamp-lantern' ? 'lantern' : 'lamp'] ? 'On' : 'Off'} />
     <FurnitureLink id="wardrobe" action={onOpenWardrobe} />
     <FurnitureHotspot id="coffee" bounds={pixelBox(COFFEE_STATION)} onPress={onOpenCoffeeMachine} />
     <SofaActions open={sofaOpen} onClose={() => setSofaOpen(false)} onSelect={action => { setSofaOpen(false); rest.queue(action); }}
       queued={rest.queued} onCancel={() => rest.queue(null)} />
   </>}
   {!windowActive && <WinterGarden visible={roomVisible} original={original} busy={!settled} />}
   {!windowActive && <MysteryGifts visible={roomVisible} />}
   <FurnitureBounds />
   <RoomGuideHighlights bounds={guide.bounds} reduced={guide.reduced} dim={guide.following} />
   {selected&&!original&&<View style={s.previewBadge}><Text style={s.previewText}>PREVIEW · {selected.name}</Text></View>}
  </View>
  <View style={[s.toolDock,{width:Math.min(roomWidth,viewport.width-24)}]}>
   {tool('furniture','Furniture',()=>{
    guide.onDecorate();
    if (home.originalRoom) arrangeHome('fallback');
    setEditor(editor==='decorate'?null:'decorate');setPreview(null);
   },!hydrated||windowActive||!ready||assetError,guide.decorating)}
   {tool('shop','Shop',()=>{
    if (home.originalRoom) arrangeHome('fallback');
    setEditor(editor==='shop'?null:'shop');setPreview(null);
   },!hydrated||windowActive||!ready||assetError)}
   {tool('wardrobe','Wardrobe',()=>{guide.onWardrobe();onOpenWardrobe();},!hydrated||windowActive,guide.wardrobe)}
   {tool('help','Help',guide.toggleHelp,false,guide.helpOpen)}
  </View>
  {rest.queued && <Text style={s.caption} accessibilityLiveRegion="polite">{companion}’s {rest.queued} is queued.</Text>}
  {selected&&!original&&<View style={s.panel}><Text style={s.cardTitle}>{selected.name}</Text><Text style={s.caption}>{home.owned.includes(selected.id)?'Already yours. Make yourself at home.':`${selected.price} ❄️${home.snowflakes === Infinity ? '' : ` · ${Math.max(0,selected.price-home.snowflakes)} more to save`}`}</Text><View style={s.toolbar}>{button(home.owned.includes(selected.id)?'Equip this item':`Buy & equip · ${selected.price} ❄️`,()=>{if(home.owned.includes(selected.id))equipFurniture(selected.id);else buyFurniture(selected.id);setPreview(null);setNotice('A little more you. Arrangement updated.');},!hydrated||(!home.owned.includes(selected.id)&&home.snowflakes<selected.price))}{home.equipped[selected.slot] === selected.id && isMovableDecor(selected.slot) && <>
    {button('Move left',()=>moveDecoration(selected.slot,-1),home.decorPlacement[selected.slot]===-1,true)}
    {button('Move right',()=>moveDecoration(selected.slot,1),home.decorPlacement[selected.slot]===1,true)}
   </>}{button('Cancel preview',()=>{setPreview(null);setNotice('');},false,true)}</View></View>}
  {!!notice&&<Text accessibilityLiveRegion="polite" style={s.notice}>{notice}</Text>}
  {storageError&&<View style={s.panel}><Text style={s.caption}>Your home couldn’t be saved. Keep this screen open and try again.</Text>{button('Retry saving',retrySave)}</View>}
  {!ready&&!assetError&&<Text style={s.notice}>Warming up your furniture…</Text>}
  {assetError&&<View style={s.panel}><Text style={s.caption}>We’re showing your original igloo while furniture images are unavailable.</Text>{button('Retry images',()=>{setReady(false);setAttempt(n=>n+1);})}</View>}
  {editor&&!original&&<View style={s.panel}><Text style={s.cardTitle}>{editor==='shop'?`${companion}’s Cozy Shop`:'Make yourself at home'}</Text><Text style={s.caption}>{editor==='shop'?'Little comforts, earned one focus session at a time.':'Choose a category, then tap an item to preview it.'}</Text>
   <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.categories}>{HOME_CATEGORIES.map(c=><Pressable accessibilityRole="button" accessibilityState={{selected:c===category}} key={c} onPress={()=>{setCategory(c);setPreview(null);}} style={[s.chip,c===category&&s.chipActive]}><Text style={[s.chipText,c===category&&s.chipSelected]}>{c}</Text></Pressable>)}</ScrollView>
   <View style={s.grid}>{category==='Ceiling'&&<View style={s.item}><Text style={s.itemName}>Regular snow ceiling</Text><Text style={s.price}>{!home.equipped.ceiling?'✓ Equipped':'Always yours'}</Text>{button('Use regular ceiling',()=>{removeFurniture('ceiling');setPreview(null);},!hydrated,true)}</View>}{HOME_CATALOG.filter(i=>i.category===category&&((editor==='shop'&&!i.giftOnly)||home.owned.includes(i.id))).map(item=>{const owned=home.owned.includes(item.id),equipped=home.equipped[item.slot]===item.id;return <View key={item.id} style={s.item}><Pressable accessibilityRole="button" accessibilityLabel={`Preview ${item.name}`} onPress={()=>previewItem(item.id)}>{readyItemIds.has(item.id)?<Image source={HOME_ART[item.id]} style={s.thumbnail} resizeMode="contain"/>:<View style={[s.thumbnail,s.thumbnailPending]}><Text style={s.caption}>{categoryLoading?'Loading preview…':'Preparing preview…'}</Text></View>}<Text style={s.itemName}>{item.name}</Text><Text style={s.price}>{equipped?'✓ Equipped':owned?'Owned':`${item.price} ❄️`}</Text><Text style={s.previewLink}>Preview →</Text></Pressable>{equipped&&HOME_SLOTS[item.slot].optional&&button('Remove',()=>{removeFurniture(item.slot);setPreview(null);},!hydrated,true)}</View>;})}</View>
   {editor==='decorate'&&<><Text style={s.caption}>Regular ceiling: remove the skylight. Optional comforts can be removed from their item card.</Text><View style={s.toolbar}>{button('Save arrangement',()=>{arrangeHome('save');setNotice('Arrangement saved.');},!hydrated)}{button('Restore saved',()=>applySavedArrangement('restore'),!hydrated,true)}{button('Undo last change',()=>applySavedArrangement('undo'),!hydrated,true)}{button('Restore default placement',()=>{arrangeHome('default');setPreview(null);setNotice('Default furniture restored.');},!hydrated,true)}</View></>}
   {editor==='decorate'&&!HOME_CATALOG.some(i=>i.category===category&&home.owned.includes(i.id))&&<><Text style={s.caption}>A little space for something lovely. Find your first piece in the shop.</Text>{button('Browse this category',()=>setEditor('shop'),false,true)}</>}
   {button(editor==='shop'?'Done shopping':'Done decorating',()=>{setEditor(null);setPreview(null);},false,true)}
  </View>}
 </ScrollView>
  <View pointerEvents="box-none" style={s.guidePanel}>{guide.panel}</View>
 </View>;
}
const s=StyleSheet.create({
 headerActions:{flexDirection:'row',alignItems:'center',gap:8},
 snowflakes:{height:36,minWidth:60,borderRadius:18,backgroundColor:'rgba(246,239,255,.86)',borderWidth:1,borderColor:'rgba(255,255,255,.75)',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:5,paddingHorizontal:10},
 snowflakeGlyph:{color:'#748fc7',fontSize:18,lineHeight:23},snowflakeCount:{color:'#554b78',fontWeight:'800',fontSize:14},
 headerHelp:{width:36,height:36,borderRadius:18,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(246,239,255,.86)',borderWidth:1,borderColor:'rgba(255,255,255,.75)'},
 toolDock:{flexDirection:'row',justifyContent:'space-around',alignSelf:'center',marginTop:8,padding:4,borderRadius:19,backgroundColor:'rgba(243,232,255,.82)',borderWidth:1,borderColor:'rgba(255,255,255,.68)',shadowColor:'#4e3d77',shadowOpacity:.12,shadowRadius:10,shadowOffset:{width:0,height:4},elevation:3},
 tool:{flex:1,minHeight:49,borderRadius:15,alignItems:'center',justifyContent:'center',gap:1},toolLabel:{fontSize:10,fontWeight:'800',color:'#5a4a69'},guidedTool:{backgroundColor:'rgba(255,222,157,.72)'},
 guidePanel:{position:'absolute',right:12,left:12,bottom:85,zIndex:40,alignItems:'flex-end',gap:5},
 guidedControl:{borderRadius:13,backgroundColor:'#ffe1a0',shadowColor:'#ffdb91',shadowOpacity:1,shadowOffset:{width:0,height:0},shadowRadius:8},
 focusLink:{width:'100%',maxWidth:390,minHeight:44,justifyContent:'center',paddingHorizontal:13,marginTop:8,borderRadius:12,backgroundColor:'#ebe0f6'},
 focusLinkText:{color:'#604878',fontSize:14,fontWeight:'800'},
 atmosphereBar:{width:'100%',maxWidth:390,marginTop:2,marginBottom:12},weatherSwitch:{minHeight:40,justifyContent:'center'},atmosphereHint:{maxWidth:390,color:'#71818A',fontSize:11,lineHeight:17,textAlign:'center',marginTop:10},
 immersive:{flex:1,backgroundColor:'transparent',position:'relative'},furnitureShortcut:{position:'absolute',zIndex:40,bottom:88,alignSelf:'center'},roomFill:{...StyleSheet.absoluteFillObject,width:'100%',height:'100%'},screen:{flex:1,backgroundColor:'transparent'},content:{padding:16,paddingBottom:120,alignItems:'center'},heading:{width:'100%',maxWidth:390,marginVertical:12},eyebrow:{color:'#526F7D',fontSize:9,fontWeight:'800',letterSpacing:1.4},title:{color:'#263E4B',fontSize:27,fontWeight:'800',marginTop:8},caption:{color:'#526D7B',fontSize:12,lineHeight:19,marginTop:5},balance:{width:'100%',maxWidth:390,backgroundColor:'rgba(255,250,235,0.91)',borderRadius:18,padding:14,borderWidth:1,borderColor:'rgba(255,255,255,0.86)',shadowColor:'#68859A',shadowOpacity:.12,shadowRadius:12,shadowOffset:{width:0,height:5},elevation:2},balanceTitle:{color:'#3F646B',fontWeight:'800',fontSize:17},toolbar:{flexDirection:'row',flexWrap:'wrap',gap:8,marginVertical:12,width:'100%',maxWidth:390},button:{paddingHorizontal:13,paddingVertical:12,borderRadius:13,backgroundColor:'#52777A',minHeight:44,justifyContent:'center'},subtle:{backgroundColor:'rgba(246,250,246,0.92)'},buttonText:{color:'#FFFDF7',fontSize:12,fontWeight:'800'},dark:{color:'#4D6A6C'},disabled:{opacity:.4},room:{width:'100%',maxWidth:390,aspectRatio:2/3,borderRadius:22,overflow:'hidden',position:'relative'},plate:{position:'absolute',width:'100%',height:'100%'},panel:{width:'100%',maxWidth:390,marginTop:14,padding:15,borderRadius:21,backgroundColor:'rgba(255,253,247,0.91)',borderColor:'rgba(255,255,255,0.84)',borderWidth:1,shadowColor:'#68859A',shadowOpacity:.13,shadowRadius:14,shadowOffset:{width:0,height:6},elevation:2},cardTitle:{fontSize:18,fontWeight:'800',color:'#3B555B'},notice:{fontSize:12,color:'#426A71',marginTop:10,textAlign:'center'},categories:{gap:7,paddingVertical:14},chip:{paddingHorizontal:13,paddingVertical:10,borderRadius:20,backgroundColor:'rgba(248,249,241,0.92)',minHeight:40},chipActive:{backgroundColor:'#52777A'},chipText:{color:'#586B69',fontSize:12,fontWeight:'700'},chipSelected:{color:'#FFFDF7'},grid:{flexDirection:'row',flexWrap:'wrap',gap:10},item:{width:'48%',padding:10,borderRadius:15,backgroundColor:'rgba(243,238,227,0.96)',marginBottom:4},thumbnail:{width:'100%',height:100},thumbnailPending:{backgroundColor:'#EAE5D9',alignItems:'center',justifyContent:'center'},itemName:{fontSize:13,fontWeight:'800',color:'#455B61',marginTop:7},price:{fontSize:12,color:'#617E7F',marginTop:5},previewLink:{fontSize:11,fontWeight:'700',color:'#57787A',marginVertical:8},previewBadge:{position:'absolute',top:12,left:12,right:12,backgroundColor:'#FFF9ECDD',borderRadius:10,padding:9},previewText:{color:'#506C70',fontSize:10,fontWeight:'800',textAlign:'center'},
});
