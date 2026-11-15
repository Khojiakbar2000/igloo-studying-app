import React, { useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { HomeAtmosphere } from './HomeAtmosphere';
import { useHomeMotion } from '../home/useHomeMotion';
import { DAY_PHASES, localDayPhase, FOCUS_STORM_UNLOCK_MS, type AtmospherePreference } from '../home/atmosphere';
import { preloadHome } from '../home/preload';
import { usePomodoro } from '../state/PomodoroContext';
import { HOME_CATALOG, HOME_CATEGORIES, homeItem } from '../home/catalog';
import { HOME_SLOTS, type HomeSlot } from '../home/slots';
import { HOME_ART, HOME_FOUNDATION } from '../home/art';
import { RoomCharacterOverlay } from './RoomCharacterOverlay';
import { IglooWindowInteraction } from '../scenes/IglooWindowInteractionScene';
import type { PenguinCustomization } from '../character/penguinCustomization';

const ORIGINAL = require('../../assets/environments/igloo/concepts/my-igloo-clean-plate.png');
export function CustomizableHome({ customization }: {customization: PenguinCustomization}) {
 const {timer, hydrated, storageError, retrySave, buyFurniture, equipFurniture, removeFurniture, arrangeHome, setAtmosphere, setSnowfall} = usePomodoro();
 const home = timer.home;
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
 const [settled,setSettled] = useState(false), [windowActive,setWindowActive] = useState(false);
 const [notice,setNotice] = useState('');
 const scroll = useRef<ScrollView>(null);
 useEffect(() => { let alive = true; setAssetError(false); void preloadHome().then(() => {if(alive)setReady(true);}).catch(() => {if(alive)setAssetError(true);}); return () => {alive=false;}; },[attempt]);
 const original = home.originalRoom || !ready || assetError || windowActive;
 const selected = preview ? homeItem(preview) : undefined;
 const layout = {...home.equipped,...(selected ? {[selected.slot]:selected.id} : {})};
 const button = (label: string, action: () => void, disabled = false, subtle = false) => <Pressable accessibilityRole="button" disabled={disabled} onPress={action} style={[s.button,subtle&&s.subtle,disabled&&s.disabled]}><Text style={[s.buttonText,subtle&&s.dark]}>{label}</Text></Pressable>;
 const previewItem = (id: string) => {setPreview(id);setNotice('Preview only · your arrangement is safe'); scroll.current?.scrollTo({y:0,animated:true});};
 return <ScrollView ref={scroll} style={s.screen} contentContainerStyle={s.content} onLayout={e=>{viewportHeight.current=e.nativeEvent.layout.height;}} scrollEventThrottle={200} onScroll={e=>{const y=e.nativeEvent.contentOffset.y,b=roomBounds.current;setRoomVisible(y<b.y+b.height&&y+viewportHeight.current>b.y);}}>
  <View style={s.heading}><Text style={s.eyebrow}>MY IGLOO · A HOME THAT FEELS LIKE YOU</Text><Text style={s.title}>Pip’s little sanctuary</Text><Text style={s.caption}>A quiet place for every little thing you love.</Text></View>
  <View style={s.balance}><Text style={s.balanceTitle}>❄️ {home.snowflakes} Snowflakes</Text><Text style={s.caption}>{Math.floor(timer.focusTotalMs/60000)} minutes of care & focus</Text></View>
  <View style={s.toolbar}>{button('Decorate',()=>{setEditor(editor==='decorate'?null:'decorate');setPreview(null);},!hydrated||windowActive||original)}{button('Pip’s Cozy Shop',()=>{setEditor(editor==='shop'?null:'shop');setPreview(null);},!hydrated||windowActive||original,true)}</View>
  <View style={s.atmosphereBar}><Text style={s.eyebrow}>A LITTLE LIGHT · {phase.toUpperCase()}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.categories}>{(['auto',...DAY_PHASES] as AtmospherePreference[]).map(p=><Pressable key={p} accessibilityRole="button" accessibilityLabel={`Use ${p === 'auto' ? 'local time' : p} lighting`} accessibilityState={{selected:home.atmosphere===p}} disabled={!hydrated} onPress={()=>setAtmosphere(p)} style={[s.chip,home.atmosphere===p&&s.chipActive]}><Text style={[s.chipText,home.atmosphere===p&&s.chipSelected]}>{p==='auto'?'Local time':p[0].toUpperCase()+p.slice(1)}</Text></Pressable>)}</ScrollView><Pressable accessibilityRole="switch" accessibilityLabel="Snow falling outside" accessibilityState={{checked:home.snowfall}} disabled={!hydrated} onPress={()=>setSnowfall(!home.snowfall)} style={s.weatherSwitch}><Text style={s.caption}>{home.snowfall?'❄ Snow falling outside':'A still, quiet sky'} · {home.snowfall?'On':'Off'}</Text></Pressable></View>
  <View style={s.room} onLayout={e=>{roomBounds.current=e.nativeEvent.layout;}}>
   <Image source={original?ORIGINAL:HOME_FOUNDATION} accessibilityLabel="Pip’s cozy personal igloo" style={s.plate} resizeMode="stretch" onError={()=>setAssetError(true)}/>
   {!original && (Object.keys(HOME_SLOTS) as HomeSlot[]).sort((a,b)=>HOME_SLOTS[a].z-HOME_SLOTS[b].z).map(slot => {const id=layout[slot], box=HOME_SLOTS[slot];return id&&HOME_ART[id] ? <Image key={slot} source={HOME_ART[id]} resizeMode="contain" style={{position:'absolute',left:`${box.x/10.24}%`,top:`${box.y/15.36}%`,width:`${box.width/10.24}%`,height:`${box.height/15.36}%`}} onError={()=>setAssetError(true)}/> : null;})}
   <RoomCharacterOverlay mode="personal" hidden={windowActive} onSettledChange={setSettled} customization={customization} homeIdle ambientMotion={motion&&!windowActive}/>
   <HomeAtmosphere phase={phase} layout={layout} original={original} motion={motion&&!windowActive} snowfall={home.snowfall} gusts={timer.focusTotalMs>=FOCUS_STORM_UNLOCK_MS}/>
   {original && <IglooWindowInteraction ready={settled && hydrated} onRunStateChange={setWindowActive}/>}
   {selected&&!original&&<View style={s.previewBadge}><Text style={s.previewText}>PREVIEW · {selected.name}</Text></View>}
  </View>
  <Text style={s.atmosphereHint}>{timer.focusTotalMs>=FOCUS_STORM_UNLOCK_MS?'Occasional snowdrifts pass outside. Inside, everything is peaceful.':'After 60 focused minutes, occasional snowdrifts join the view.'}</Text>
  {selected&&!original&&<View style={s.panel}><Text style={s.cardTitle}>{selected.name}</Text><Text style={s.caption}>{home.owned.includes(selected.id)?'Already yours. Make yourself at home.':`${selected.price} ❄️ · ${Math.max(0,selected.price-home.snowflakes)} more to save`}</Text><View style={s.toolbar}>{button(home.owned.includes(selected.id)?'Equip this item':`Buy & equip · ${selected.price} ❄️`,()=>{if(home.owned.includes(selected.id))equipFurniture(selected.id);else buyFurniture(selected.id);setPreview(null);setNotice('A little more you. Arrangement updated.');},!hydrated||(!home.owned.includes(selected.id)&&home.snowflakes<selected.price))}{button('Cancel preview',()=>{setPreview(null);setNotice('');},false,true)}</View></View>}
  {!!notice&&<Text accessibilityLiveRegion="polite" style={s.notice}>{notice}</Text>}
  {storageError&&<View style={s.panel}><Text style={s.caption}>Your home couldn’t be saved. Keep this screen open and try again.</Text>{button('Retry saving',retrySave)}</View>}
  {!ready&&!assetError&&<Text style={s.notice}>Warming up your furniture…</Text>}
  {assetError&&<View style={s.panel}><Text style={s.caption}>We’re showing your original igloo while furniture images are unavailable.</Text>{button('Retry images',()=>{setReady(false);setAttempt(n=>n+1);})}</View>}
  {editor&&!original&&<View style={s.panel}><Text style={s.cardTitle}>{editor==='shop'?'Pip’s Cozy Shop':'Make yourself at home'}</Text><Text style={s.caption}>{editor==='shop'?'Little comforts, earned one focus session at a time.':'Choose a category, then tap an item to preview it.'}</Text>
   <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.categories}>{HOME_CATEGORIES.map(c=><Pressable accessibilityRole="button" accessibilityState={{selected:c===category}} key={c} onPress={()=>{setCategory(c);setPreview(null);}} style={[s.chip,c===category&&s.chipActive]}><Text style={[s.chipText,c===category&&s.chipSelected]}>{c}</Text></Pressable>)}</ScrollView>
   <View style={s.grid}>{category==='Ceiling'&&<View style={s.item}><Text style={s.itemName}>Regular snow ceiling</Text><Text style={s.price}>{!home.equipped.ceiling?'✓ Equipped':'Always yours'}</Text>{button('Use regular ceiling',()=>{removeFurniture('ceiling');setPreview(null);},!hydrated,true)}</View>}{HOME_CATALOG.filter(i=>i.category===category&&(editor==='shop'||home.owned.includes(i.id))).map(item=>{const owned=home.owned.includes(item.id),equipped=home.equipped[item.slot]===item.id;return <View key={item.id} style={s.item}><Pressable accessibilityRole="button" accessibilityLabel={`Preview ${item.name}`} onPress={()=>previewItem(item.id)}><Image source={HOME_ART[item.id]} style={s.thumbnail} resizeMode="contain"/><Text style={s.itemName}>{item.name}</Text><Text style={s.price}>{equipped?'✓ Equipped':owned?'Owned':`${item.price} ❄️`}</Text><Text style={s.previewLink}>Preview →</Text></Pressable>{equipped&&HOME_SLOTS[item.slot].optional&&button('Remove',()=>{removeFurniture(item.slot);setPreview(null);},!hydrated,true)}</View>;})}</View>
   {editor==='decorate'&&<><Text style={s.caption}>Regular ceiling: remove the skylight. Optional comforts can be removed from their item card.</Text><View style={s.toolbar}>{button('Save arrangement',()=>{arrangeHome('save');setNotice('Arrangement saved.');},!hydrated)}{button('Restore saved',()=>{arrangeHome('restore');setPreview(null);setNotice('Saved arrangement restored.');},!hydrated,true)}{button('Undo last change',()=>{arrangeHome('undo');setPreview(null);},!hydrated,true)}</View></>}
   {editor==='decorate'&&!HOME_CATALOG.some(i=>i.category===category&&home.owned.includes(i.id))&&<><Text style={s.caption}>A little space for something lovely. Find your first piece in the shop.</Text>{button('Browse this category',()=>setEditor('shop'),false,true)}</>}
   {button(editor==='shop'?'Done shopping':'Done decorating',()=>{setEditor(null);setPreview(null);},false,true)}
  </View>}
  <View style={s.panel}><Text style={s.cardTitle}>A little focus, a little comfort</Text><Text style={s.caption}>Finish 25 minutes of focus to earn 25 Snowflakes. Your starter furniture is already yours. No rush to collect anything.</Text>{button(home.originalRoom?'Return to customizable home':'Visit original igloo',()=>{arrangeHome('fallback');setPreview(null);setEditor(null);},!hydrated||windowActive,true)}</View>
 </ScrollView>;
}
const s=StyleSheet.create({
 atmosphereBar:{width:'100%',maxWidth:390,marginTop:2,marginBottom:12},weatherSwitch:{minHeight:40,justifyContent:'center'},atmosphereHint:{maxWidth:390,color:'#71818A',fontSize:11,lineHeight:17,textAlign:'center',marginTop:10},
 screen:{flex:1,backgroundColor:'#EAF1F8'},content:{padding:16,paddingBottom:32,alignItems:'center'},heading:{width:'100%',maxWidth:390,marginVertical:12},eyebrow:{color:'#718A92',fontSize:9,fontWeight:'800',letterSpacing:1.4},title:{color:'#30434C',fontSize:27,fontWeight:'800',marginTop:8},caption:{color:'#71818A',fontSize:12,lineHeight:19,marginTop:5},balance:{width:'100%',maxWidth:390,backgroundColor:'#FFF8E8',borderRadius:18,padding:14,borderWidth:1,borderColor:'#E4D6B8'},balanceTitle:{color:'#4C6E74',fontWeight:'800',fontSize:17},toolbar:{flexDirection:'row',flexWrap:'wrap',gap:8,marginVertical:12,width:'100%',maxWidth:390},button:{paddingHorizontal:13,paddingVertical:12,borderRadius:13,backgroundColor:'#52777A',minHeight:44,justifyContent:'center'},subtle:{backgroundColor:'#EAF0EC'},buttonText:{color:'#FFFDF7',fontSize:12,fontWeight:'800'},dark:{color:'#4D6A6C'},disabled:{opacity:.4},room:{width:'100%',maxWidth:390,aspectRatio:2/3,borderRadius:22,overflow:'hidden',position:'relative'},plate:{position:'absolute',width:'100%',height:'100%'},panel:{width:'100%',maxWidth:390,marginTop:14,padding:15,borderRadius:21,backgroundColor:'#FFFCF5',borderColor:'#E2DDD0',borderWidth:1},cardTitle:{fontSize:18,fontWeight:'800',color:'#465C60'},notice:{fontSize:12,color:'#52777A',marginTop:10,textAlign:'center'},categories:{gap:7,paddingVertical:14},chip:{paddingHorizontal:13,paddingVertical:10,borderRadius:20,backgroundColor:'#F0EADC',minHeight:40},chipActive:{backgroundColor:'#52777A'},chipText:{color:'#6C6B5D',fontSize:12,fontWeight:'700'},chipSelected:{color:'#FFFDF7'},grid:{flexDirection:'row',flexWrap:'wrap',gap:10},item:{width:'48%',padding:10,borderRadius:15,backgroundColor:'#F3EEE3',marginBottom:4},thumbnail:{width:'100%',height:100},itemName:{fontSize:13,fontWeight:'800',color:'#455B61',marginTop:7},price:{fontSize:12,color:'#617E7F',marginTop:5},previewLink:{fontSize:11,fontWeight:'700',color:'#57787A',marginVertical:8},previewBadge:{position:'absolute',top:12,left:12,right:12,backgroundColor:'#FFF9ECDD',borderRadius:10,padding:9},previewText:{color:'#506C70',fontSize:10,fontWeight:'800',textAlign:'center'},
});
