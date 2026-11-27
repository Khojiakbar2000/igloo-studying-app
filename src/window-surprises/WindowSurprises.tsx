import { Chevron, IconButton } from '../ui/Controls';
import { Overlay } from '../ui/Overlay';
import { colors, type, ui } from '../theme';
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { useAmbientSound } from '../ambient/AmbientSoundProvider';
import { prepareAudioSession } from '../ambient/audioSession';
import { studyMilestones } from '../awards/progression';
import { usePipReactions } from '../character/reactions/PipReactionsProvider';
import { StudyRoomPerformance } from '../components/StudyRoomPerformance';
import { useHomeMotionState } from '../home/useHomeMotion';
import { STUDY_WINDOW_SCENES, WINDOW_OPENING, type StudyWindowScene } from '../scenes/studyWindowScenes';
import { usePomodoro } from '../state/PomodoroContext';
import { pickSurprise, SURPRISES, surpriseDelay, type Surprise, type SurpriseId } from './events';
import { illustration, respondMotion, surpriseMotion } from './motion';

type Performance = { event: Surprise; id: number; preview: boolean };
const MINUTE = 60_000;
const specialWait = () => (30 + Math.random() * 30) * MINUTE;
const rareWait = () => (65 + Math.random() * 35) * MINUTE;

export function useWindowSurprises(scene: StudyWindowScene | null, visible: boolean, pipBusy: boolean) {
  const {timer, hydrated, discoverSurprise}=usePomodoro();
  const {active, motion}=useHomeMotionState(visible);
  const {requestRestReaction}=usePipReactions();
  const [performance,setPerformance]=useState<Performance|null>(null);
  const [preview,setPreview]=useState<Surprise|null>(null);
  const [journal,setJournal]=useState(false);
  const nextId=useRef(0);
  const recent=useRef<SurpriseId[]>([]);
  const specialAt=useRef(Date.now()+specialWait());
  const rareAt=useRef(Date.now()+rareWait());
  const verified=useMemo(()=>studyMilestones(timer.sessions).progress.time,[timer.sessions]);
  const verifiedMs=useRef(verified);
  verifiedMs.current=verified;
  const canPlay=hydrated&&!!scene&&active&&!journal;
  const matching=performance?.event.scene===scene;
  const {mode,status}=timer;
  const finish=useCallback((id:number)=>setPerformance(current=>current?.id===id?null:current),[]);
  const launch=useCallback((event:Surprise,debug:boolean)=>{
    const id=++nextId.current;
    setPerformance({id,event,preview:debug});
  },[]);

  useEffect(()=>{
    if(!matching||!canPlay) setPerformance(null);
  },[canPlay,matching]);

  useEffect(()=>{
    if(!preview||preview.scene!==scene||!canPlay)return;
    launch(preview,true);
    setPreview(null);
  },[canPlay,launch,preview,scene]);

  useEffect(()=>{
    if(!scene||!canPlay||performance||preview)return;
    let timerId:ReturnType<typeof setTimeout>;
    const schedule=()=>{
      timerId=setTimeout(()=>{
        const now=Date.now();
        const event=pickSurprise(scene,recent.current,now>=specialAt.current,now>=rareAt.current&&verifiedMs.current>=60*MINUTE);
        if(!event){schedule();return;}
        recent.current=[event.id,...recent.current].slice(0,2);
        if(event.rarity==='special')specialAt.current=now+specialWait();
        if(event.rarity==='rare')rareAt.current=now+rareWait();
        launch(event,false);
      },surpriseDelay());
    };
    schedule();
    return ()=>clearTimeout(timerId);
  },[canPlay,launch,performance,preview,scene]);

  const witness=useCallback((item:Performance)=>{
    if(item.preview)return;
    discoverSurprise(item.event.id);
    if(mode!=='focus'&&status==='running'&&!pipBusy&&Math.random()<(item.event.rarity==='small'?.25:.62)){
      requestRestReaction(item.event.id==='penguin-visitor'?'wave':item.event.rarity==='small'?'look':'smile');
    }
  },[discoverSurprise,mode,pipBusy,requestRestReaction,status]);

  return {
    showJournal:()=>setJournal(true),
    preview: (event:Surprise)=>{if(__DEV__)setPreview(event);},
    stage:canPlay&&matching&&performance&&<SurpriseStage key={performance.id} item={performance}
      motion={motion} onWitness={witness} onFinish={finish} />,
    journal:journal&&<DiscoveryJournal scene={scene} onClose={()=>setJournal(false)} />,
  };
}

const effects = {
 magic:require('../../assets/animations/window-surprises/magic.wav'),
 water:require('../../assets/animations/window-surprises/water.wav'),
 space:require('../../assets/animations/window-surprises/space.wav'),
 wind:require('../../assets/animations/window-surprises/wind.wav'),
};

function SurpriseStage({item,motion,onWitness,onFinish}:{
 item:Performance;motion:boolean;onWitness:(item:Performance)=>void;onFinish:(id:number)=>void;
}) {
 const {event}=item;
 const {timer}=usePomodoro();
 const {prefs,ready,needsGesture,breakPaused,pausedByMedia}=useAmbientSound();
 const sound=useAudioPlayer(event.scene==='aquarium'?effects.water:event.scene==='moon'||event.scene==='spaceship'?effects.space:
   event.rarity!=='small'?effects.magic:effects.wind);
 const audible=timer.surpriseSounds&&ready&&prefs.enabled&&!prefs.muted&&!breakPaused&&!pausedByMedia&&!needsGesture&&!(timer.mode==='focus'&&timer.status==='running');
 const volume=audible?prefs.master*.18:0;
 const [response,setResponse]=useState<number|null>(null);
 const started=useRef(0);
 const [loaded,setLoaded]=useState(false);
 const [pausedMs,setPausedMs]=useState(0);
 const pausedAt=useRef(0);
 const witnessed=useRef(false);
 const source=useMemo(()=>motion?surpriseMotion(event):null,[event,motion]);
 const responseSource=useMemo(()=>response===null||!motion?null:respondMotion(event,response),[event,motion,response]);
 const markLoaded=useCallback(()=>{started.current=Date.now();setLoaded(true);},[]);
 const finish=useCallback(()=>onFinish(item.id),[item.id,onFinish]);
 const clearResponse=useCallback(()=>{setPausedMs(value=>value+Date.now()-pausedAt.current);setResponse(null);},[]);
 const latest=useRef({onWitness,volume});
 latest.current={onWitness,volume};

 useEffect(()=>{sound.volume=volume;if(volume===0)sound.pause();},[sound,volume]);
 useEffect(()=>{
   if(motion&&!loaded)return;
   let alive=true;
   const timerId=setTimeout(()=>{
     if(witnessed.current || (motion&&!started.current))return;
     witnessed.current=true;
     latest.current.onWitness(item);
     if(latest.current.volume>0){
       void prepareAudioSession().then(()=>{if(alive&&latest.current.volume>0)sound.play();}).catch(()=>undefined);
     }
   },motion?2200:350);
   return ()=>{alive=false;clearTimeout(timerId);sound.pause();};
 },[item,loaded,motion,sound]);
 useEffect(()=>{
   if(motion)return;
   const timerId=setTimeout(finish,4100);
   return ()=>clearTimeout(timerId);
 },[finish,motion]);
 const react=()=>{
   const elapsed=Date.now()-started.current-pausedMs;
   if(!motion||!loaded||response!==null||elapsed<350)return;
   pausedAt.current=Date.now();
   setResponse(elapsed/1000);
 };

 return <>
   {motion&&loaded&&event.rarity!=='small'&&<WindowLight event={event} />}
   <View pointerEvents="box-none" style={styles.opening} testID={`window-surprise-${event.id}`}>
   {source ? <StudyRoomPerformance source={source} motion={!responseSource} onLoaded={markLoaded}
     onFinish={finish} style={responseSource&&styles.invisible} /> :
     <Image source={illustration(event.id)} style={styles.still} resizeMode="contain" />}
   {responseSource&&<StudyRoomPerformance source={responseSource} motion onFinish={clearResponse} testID="window-surprise-reply" />}
   {event.interactive&&motion&&<Pressable style={styles.hit} accessibilityRole="button" accessibilityLabel={`Greet ${event.name}`} onPress={react} />}
 </View></>;
}

function WindowLight({event}:{event:Surprise}) {
 const id=useId().replace(/[^a-zA-Z0-9]/g,'');
 const opacity=useRef(new Animated.Value(0)).current;
 const color=event.scene==='aquarium'?'#72dcff':event.id==='aurora'?'#a2fde0':event.scene==='spaceship'?'#ada7ff':'#ffca84';
 useEffect(()=>{
   const animation=Animated.sequence([
     Animated.timing(opacity,{toValue:1,duration:1900,easing:Easing.inOut(Easing.sin),useNativeDriver:true}),
     Animated.timing(opacity,{toValue:0,duration:3400,easing:Easing.inOut(Easing.sin),useNativeDriver:true}),
   ]);
   animation.start();
   return()=>animation.stop();
 },[opacity]);
 return <Animated.View pointerEvents="none" style={[styles.spill,{opacity}]}>
   <Svg width="100%" height="100%" viewBox="0 0 240 130" preserveAspectRatio="none">
     <Defs><RadialGradient id={id}><Stop offset="0" stopColor={color} stopOpacity={.19} /><Stop offset=".63" stopColor={color} stopOpacity={.075} /><Stop offset="1" stopColor={color} stopOpacity={0} /></RadialGradient></Defs>
     <Ellipse cx="120" cy="65" rx="120" ry="65" fill={`url(#${id})`} />
   </Svg>
 </Animated.View>;
}

function DiscoveryJournal({scene,onClose}:{scene:StudyWindowScene|null;onClose:()=>void}) {
 const {timer,setSurpriseSounds}=usePomodoro();
 const {unlockAudio}=useAmbientSound();
 const [selection,setSelection]=useState<StudyWindowScene>(scene??'blizzard');
 const [detail,setDetail]=useState<Surprise|null>(null);
 const entries=SURPRISES.filter(event=>event.scene===selection);
 const date=detail?timer.discoveries[detail.id]:undefined;
 return <Overlay visible transparent animationType="none" onRequestClose={onClose}>
   <View style={styles.shade}><View accessibilityViewIsModal style={styles.sheet}>
     <ScrollView contentContainerStyle={styles.content}>
       <View style={styles.header}><View><Text style={styles.title}>Window journal</Text>
         <Text style={styles.caption}>{Object.keys(timer.discoveries).length} / {SURPRISES.length} discovered</Text></View>
         <IconButton label="Close window journal" onPress={onClose}><Chevron direction="close" /></IconButton>
       </View>
       <View style={styles.row}>{STUDY_WINDOW_SCENES.map(item=><Pressable key={item.id} accessibilityRole="button" accessibilityState={{selected:item.id===selection}} style={[styles.chip,item.id===selection&&styles.selected]} onPress={()=>{setSelection(item.id);setDetail(null);}}><Text style={styles.ink}>{item.label}</Text></Pressable>)}</View>
       <View style={styles.grid}>{entries.map(event=>{
         const found=timer.discoveries[event.id]!==undefined;
         return <Pressable key={event.id} accessibilityRole="button" accessibilityLabel={found?event.name:`Undiscovered surprise ${event.slot+1}`} onPress={()=>setDetail(event)} style={styles.entry}>
           <Image source={illustration(event.id)} style={[styles.thumbnail,!found&&styles.silhouette]} resizeMode="contain" />
           <Text style={styles.caption}>{found?event.name:'Undiscovered'}</Text>
         </Pressable>;
       })}</View>
       {detail&&<View style={styles.detail}><Text style={styles.ink}>{date?detail.name:'Undiscovered'}</Text>
         <Text style={styles.caption}>{date?new Date(date).toLocaleDateString(undefined,{month:'long',day:'numeric',year:'numeric'}):'Keep an eye on this window.'}</Text></View>}
       <Pressable accessibilityRole="switch" accessibilityLabel="Window surprise sounds" accessibilityState={{checked:timer.surpriseSounds}}
         onPress={()=>{if(!timer.surpriseSounds)unlockAudio();setSurpriseSounds(!timer.surpriseSounds);}} style={styles.chip}>
         <Text style={styles.ink}>Window sounds · {timer.surpriseSounds?'On':'Off'}</Text>
       </Pressable>
     </ScrollView>
   </View></View>
 </Overlay>;
}

export function WindowJournalButton({onPress}:{onPress:()=>void}) {
 return <Pressable accessibilityRole="button" onPress={onPress} style={styles.journalButton}><Text style={styles.ink}>Window journal</Text></Pressable>;
}

export function WindowSurpriseDebug({onPreview}:{onPreview:(event:Surprise)=>void}) {
 const [open,setOpen]=useState(false);
 const [scene,setScene]=useState<StudyWindowScene>('blizzard');
 if(!__DEV__)return null;
 return <View style={styles.dev}>
   <Pressable accessibilityRole="button" accessibilityState={{expanded:open}} onPress={()=>setOpen(!open)} style={styles.chip}><Text style={styles.ink}>Window surprise lab</Text></Pressable>
   {open&&<><View style={styles.row}>{STUDY_WINDOW_SCENES.map(item=><Pressable key={item.id} accessibilityRole="button" onPress={()=>setScene(item.id)} style={[styles.chip,scene===item.id&&styles.selected]}><Text style={styles.ink}>{item.label}</Text></Pressable>)}</View>
     <View style={styles.row}>{SURPRISES.filter(item=>item.scene===scene).map(event=><Pressable key={event.id} accessibilityRole="button" onPress={()=>onPreview(event)} style={styles.chip}><Text style={styles.ink}>Preview {event.name}</Text></Pressable>)}</View></>}
 </View>;
}

const styles=StyleSheet.create({
 opening:{position:'absolute',left:`${WINDOW_OPENING.x/10.24}%`,top:`${WINDOW_OPENING.y/15.36}%`,width:`${WINDOW_OPENING.width/10.24}%`,height:`${WINDOW_OPENING.height/15.36}%`,zIndex:4,overflow:'hidden'},
 spill:{position:'absolute',left:'15%',top:'22%',width:'77%',height:'24%',zIndex:3},
 still:{position:'absolute',width:'39%',height:'57%',left:'30.5%',top:'26%'},
 invisible:{opacity:0},
 hit:{position:'absolute',left:'4%',right:'4%',top:'21%',bottom:'3%'},
 shade:{ ...ui.shade, backgroundColor: 'transparent' },
 sheet:{ ...ui.dialog, maxHeight:'91%' },
 content:{padding:14,gap:12},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
 title:{ ...type.heading, color: colors.ink },caption:{fontSize:12,color:'#755340'},
 row:{flexDirection:'row',flexWrap:'wrap',gap:6},
 chip:{minHeight:44,paddingHorizontal:10,borderRadius:16,backgroundColor:'#f4dfbe',justifyContent:'center'},
 selected:{backgroundColor:'#e9c995'},ink:{color:'#593a2d',fontWeight:'800',fontSize:12},
 grid:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',gap:5},
 entry:{width:'31%',minHeight:85,alignItems:'center',padding:5,borderRadius:13,backgroundColor:'#f9e5c4'},
 thumbnail:{width:'100%',height:57},silhouette:{tintColor:'#583854',opacity:.68},
 detail:{gap:4,padding:6},
 journalButton:{minHeight:44,backgroundColor:'#fff0d5',borderRadius:15,alignSelf:'flex-start',paddingHorizontal:14,justifyContent:'center',marginTop:9},
 dev:{gap:7,marginTop:12},
});
