import { colors } from '../theme';
import React,{useEffect,useRef,useState}from'react';
import {AppState,Image,Pressable,ScrollView,StyleSheet,Text,View,type AppStateStatus,type LayoutChangeEvent}from'react-native';
import {Asset}from'expo-asset';
import {useEvent}from'expo';
import {useVideoPlayer,VideoView}from'expo-video';
import Animated,{useAnimatedStyle,useSharedValue}from'react-native-reanimated';
import {FourCharacterAnimationBenchmark} from './FourCharacterAnimationBenchmark';
import {RiveAnimationPreview} from './RiveAnimationPreview';
import {PIP_STUDY_EXPOSURES,PIP_STUDY_FRAMES,PIP_STUDY_FPS,PIP_STUDY_SPRITE,PIP_STUDY_VIDEO}from'../experiments/videoAnimation/frames';

type Mode='A'|'B'|'C'|'D';
type RiveAnimation='idle'|'studying'|'celebrate';
type ScarfVariant='teal'|'pink';
const BACKGROUND='#EAF1F8';
export function VideoAnimationExperiment({onExit}:{onExit?:()=>void}){
 const [mode,setMode]=useState<Mode>('A'),[visibleTime,setVisibleTime]=useState<number|null>(null),[frame,setFrame]=useState(0),[preloading,setPreloading]=useState(false),[preloaded,setPreloaded]=useState(false),[error,setError]=useState(''),[appActive,setAppActive]=useState(AppState.currentState==='active'),[fourBench,setFourBench]=useState(false),[riveAnimation,setRiveAnimation]=useState<RiveAnimation>('idle'),[scarfVariant,setScarfVariant]=useState<ScarfVariant>('teal');
 const startAt=useRef(performance.now()),visibleRef=useRef(false),frameRef=useRef(0);
 const markVisible=()=>{if(!visibleRef.current){visibleRef.current=true;setVisibleTime(performance.now()-startAt.current);}};
 useEffect(()=>{const sub=AppState.addEventListener('change',(state:AppStateStatus)=>setAppActive(state==='active'));return()=>sub.remove();},[]);
 useEffect(()=>{
  frameRef.current=0;setFrame(0);
 },[mode]);
 useEffect(()=>{
  if((mode!=='A'&&mode!=='B')||!appActive||preloading||fourBench)return;
  let current=frameRef.current,alive=true;
  const advance=()=>{if(!alive)return;current=(current+1)%PIP_STUDY_FRAMES.length;frameRef.current=current;setFrame(current);timer=setTimeout(advance,PIP_STUDY_EXPOSURES[current]*1000/PIP_STUDY_FPS);};
  let timer:ReturnType<typeof setTimeout>=setTimeout(advance,PIP_STUDY_EXPOSURES[current]*1000/PIP_STUDY_FPS);
  return()=>{alive=false;clearTimeout(timer);};
 },[mode,appActive,preloading,fourBench]);
 const prepare=async()=>{if(preloading||preloaded)return;setPreloading(true);setError('');try{const a=Asset.fromModule(PIP_STUDY_SPRITE);await a.downloadAsync();await Image.prefetch(a.localUri??a.uri);setPreloaded(true);}catch{setError('The sprite sheet could not be preloaded.');setMode('A');}finally{setPreloading(false);}};
 const select=(m:Mode)=>{if(preloading||m===mode)return;startAt.current=performance.now();visibleRef.current=false;setVisibleTime(null);setMode(m);if(m==='B'&&!preloaded)void prepare();};
 const videoSize=860/1082;
 if(fourBench)return <FourCharacterAnimationBenchmark onExit={()=>setFourBench(false)}/>;
 return <ScrollView contentContainerStyle={s.page}>{onExit&&<Pressable accessibilityRole="button" onPress={onExit} style={s.exit}><Text style={s.exitText}>← Return to IGLOO</Text></Pressable>}<Text style={s.kicker}>DEVELOPMENT EXPERIMENT · ISOLATED</Text><Text style={s.title}>Pip study playback</Text><Text style={s.sub}>42 Synfig export frames · 12 fps · 3.5 second loop</Text>
  <Pressable accessibilityRole="button" onPress={()=>setFourBench(true)} style={{width:'100%',maxWidth:520,backgroundColor:colors.ice,borderRadius:14,padding:13}}><Text style={{color:colors.link,fontSize:12,fontWeight:'800'}}>Compare four Study Together penguins →</Text></Pressable>
  <View style={s.modes}>{(['A','B','C','D'] as const).map(m=><Pressable key={m} disabled={preloading} accessibilityRole="button" accessibilityState={{selected:mode===m,disabled:preloading}} onPress={()=>select(m)} style={[s.mode,mode===m&&s.modeActive,preloading&&s.modeDisabled]}><Text style={[s.modeText,mode===m&&s.modeTextActive]}>{m==='A'?'A · Frames':m==='B'?'B · Atlas':m==='C'?'C · Video':'D · Rive'}</Text></Pressable>)}</View>
  {mode==='D'&&<View style={s.riveControls}><View style={s.riveControlRow}>{(['idle','studying','celebrate'] as const).map(a=><Pressable key={a} onPress={()=>{setRiveAnimation(a);startAt.current=performance.now();visibleRef.current=false;setVisibleTime(null);}} style={[s.riveChoice,riveAnimation===a&&s.riveChoiceActive]}><Text style={[s.riveChoiceText,riveAnimation===a&&s.riveChoiceTextActive]}>{a==='celebrate'?'Celebrate':a[0].toUpperCase()+a.slice(1)}</Text></Pressable>)}</View><View style={s.riveControlRow}>{(['teal','pink'] as const).map(v=><Pressable key={v} onPress={()=>{setScarfVariant(v);startAt.current=performance.now();visibleRef.current=false;setVisibleTime(null);}} style={[s.riveChoice,s.riveChoiceSmall,scarfVariant===v&&s.riveChoiceActive]}><Text style={[s.riveChoiceText,scarfVariant===v&&s.riveChoiceTextActive]}>{v==='teal'?'Teal scarf':'Pink scarf'}</Text></Pressable>)}</View></View>}
  <View style={s.stage}><View style={[s.matte,{aspectRatio:videoSize}]}>
   {mode==='D'?<RiveAnimationPreview key={`${riveAnimation}-${scarfVariant}`} animation={riveAnimation} scarfVariant={scarfVariant} onVisible={markVisible} onError={setError}/>:mode==='C'?<VideoPlayback active={appActive} onVisible={markVisible} onError={setError}/>:mode==='B'&&preloading?<Text style={s.loading}>Preloading sprite sheet…</Text>:mode==='B'?<SpriteSheetPlayback active={appActive} onVisible={markVisible}/>:<Image key={mode} source={PIP_STUDY_FRAMES[frame]} resizeMode="contain" fadeDuration={0} onLoad={markVisible} style={StyleSheet.absoluteFill}/>}
  </View></View>
  <View style={s.readout}><Text style={s.readoutTitle}>{mode==='A'?'Original PNG sequence':mode==='B'?'Preloaded PNG sprite sheet':mode==='C'?'H.264 local video':'Editable vector Rive prototype'}</Text><Text style={s.data}>First visible: {visibleTime===null?(mode==='C'?'waiting for first decoded frame…':mode==='B'?'preloading sprite sheet…':mode==='D'?'waiting for Rive renderer…':'measuring…'):`${visibleTime.toFixed(0)} ms`}</Text>{mode==='D'?<><Text style={s.data}>D: {riveAnimation} · {scarfVariant} scarf · transform rig · 66 vector shapes</Text><Text style={s.note}>Rive is loaded from a separate experiment file. Native preview requires the existing Rive development build; Expo Go will show its fallback.</Text></>:<><Text style={s.data}>A/B playback: {PIP_STUDY_FRAMES.length} held frames · 42 timeline ticks · 12 fps</Text><Text style={s.data}>PNG: 4.31 MB used cels · 11.31 MB full export · Sprite: 2.88 MB · Video: 488 KB</Text><Text style={s.data}>Decoded pixel estimate: PNG/sprite 14.2 MiB · Video 3.6 MiB/frame</Text><Text style={s.data}>Mode B cache: {preloaded?'ready':'not loaded'}</Text><Text style={s.note}>Video uses an opaque pale blue matte because H.264 has no alpha. Compare against frames over the same matte.</Text></>}{preloading&&<Text style={s.note}>Preparing sprite sheet…</Text>}{!!error&&<Text style={s.error}>{error}</Text>}</View>
  <View style={s.readout}><Text style={s.readoutTitle}>Device test checklist</Text><Text style={s.note}>Run A, B, then C for 60 seconds each; repeat after a cold launch. Note first-visible delay, loop flashes, stutters, CPU, memory, heat, and battery. Repeat each for 25 minutes. This screen reports first visible time; OS-level CPU and memory require Xcode Instruments or Android Studio Profiler.</Text><Text style={s.note}>Option A rollback: select A · Frames. Production renderers were not changed.</Text></View>
 </ScrollView>;
}
function SpriteSheetPlayback({active,onVisible}:{active:boolean;onVisible:()=>void}){
 const [size,setSize]=useState({width:0,height:0});
 const index=useSharedValue(0);
 const onLayout=(event:LayoutChangeEvent)=>setSize({width:event.nativeEvent.layout.width,height:event.nativeEvent.layout.height});
 const imageStyle=useAnimatedStyle(()=>({transform:[{translateX:-(index.value%4)*size.width},{translateY:-Math.floor(index.value/4)*size.height}]}),[size.width,size.height]);
 useEffect(()=>{
  if(!active||size.width===0)return;
  let current=index.value,alive=true;
  const advance=()=>{timer=setTimeout(()=>{if(!alive)return;current=(current+1)%PIP_STUDY_EXPOSURES.length;index.value=current;advance();},PIP_STUDY_EXPOSURES[current]*1000/PIP_STUDY_FPS);};
  let timer:ReturnType<typeof setTimeout>;
  advance();
  return()=>{alive=false;clearTimeout(timer);};
 },[active,size.width,index]);
 return <View onLayout={onLayout} style={StyleSheet.absoluteFill}>
  {size.width>0&&<Animated.Image source={PIP_STUDY_SPRITE} resizeMode="stretch" fadeDuration={0} onLoad={onVisible} style={[{position:'absolute',left:0,top:0,width:size.width*4,height:size.height*4},imageStyle]}/>}
 </View>;
}
function VideoPlayback({active,onVisible,onError}:{active:boolean;onVisible:()=>void;onError:(message:string)=>void}){
 const player=useVideoPlayer(PIP_STUDY_VIDEO,p=>{p.loop=true;p.muted=true;p.audioMixingMode='mixWithOthers';});
 const {status,error}=useEvent(player,'statusChange',{status:player.status,error:undefined});
 useEffect(()=>{if(status==='error')onError(error?.message??'Video playback failed on this platform.');},[status,error,onError]);
 useEffect(()=>{if(active)player.play();else player.pause();return()=>player.pause();},[active,player]);
 return <VideoView player={player} nativeControls={false} contentFit="contain" onFirstFrameRender={onVisible} style={StyleSheet.absoluteFill}/>;
}
const s=StyleSheet.create({page:{flexGrow:1,backgroundColor:'#EAF1F8',padding:20,alignItems:'center',gap:12},exit:{width:'100%',maxWidth:520,marginTop:10},exitText:{fontSize:12,fontWeight:'800',color:colors.link},kicker:{width:'100%',maxWidth:520,color:colors.link,fontSize:10,fontWeight:'800',letterSpacing:1.3,marginTop:18},title:{width:'100%',maxWidth:520,color:colors.link,fontSize:28,fontWeight:'800'},sub:{width:'100%',maxWidth:520,color:'#71818A',fontSize:13},modes:{width:'100%',maxWidth:520,flexDirection:'row',gap:6,marginTop:10},mode:{flex:1,minHeight:46,borderRadius:14,backgroundColor:'#F7F1E6',alignItems:'center',justifyContent:'center'},modeActive:{backgroundColor:colors.link},modeDisabled:{opacity:.6},modeText:{fontSize:11,fontWeight:'800',color:colors.link},modeTextActive:{color:'#FFFDF8'},riveControls:{width:'100%',maxWidth:520,gap:7},riveControlRow:{flexDirection:'row',gap:7},riveChoice:{flex:1,minHeight:38,borderRadius:12,alignItems:'center',justifyContent:'center',backgroundColor:'#F7F1E6'},riveChoiceSmall:{flex:0,paddingHorizontal:15},riveChoiceActive:{backgroundColor:colors.line,borderWidth:1,borderColor:colors.muted},riveChoiceText:{fontSize:12,fontWeight:'700',color:colors.link},riveChoiceTextActive:{color:colors.link},stage:{width:'100%',maxWidth:520,borderRadius:22,padding:12,backgroundColor:'#FFFCF5'},matte:{width:'100%',overflow:'hidden',backgroundColor:BACKGROUND,borderRadius:12,alignItems:'center',justifyContent:'center'},loading:{color:colors.link,fontSize:13,fontWeight:'700'},readout:{width:'100%',maxWidth:520,borderRadius:18,padding:14,backgroundColor:'#FFFCF5',gap:6},readoutTitle:{fontSize:15,fontWeight:'800',color:colors.link},data:{fontSize:12,color:colors.link},note:{fontSize:11,lineHeight:17,color:'#71818A',marginTop:5},error:{color:'#A3463D',fontSize:12}});
