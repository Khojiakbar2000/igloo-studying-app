import { PANORAMA_PROPS, PANORAMA_SLOTS, panoramaBounds } from '../home/panorama';
import { PANORAMA_FIXTURES } from '../home/panoramaArt';
import { PanoramaSprite } from '../home/PanoramaSprite';
import { Chevron, IconButton } from '../ui/Controls';
import { Overlay } from '../ui/Overlay';
import { colors, type, ui } from '../theme';
import { GIFT_ART } from '../gifts/art';
import { useFurniture } from '../furniture/Furniture';
import { boxStyle, roomBox } from '../furniture/catalog';
import { IGLOO_FURNITURE } from '../study-together/iglooLayout';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { studyMilestones } from '../awards/progression';
import { usePipReactions } from '../character/reactions/PipReactionsProvider';
import { StudyRoomPerformance } from '../components/StudyRoomPerformance';
import { useHomeMotionState } from '../home/useHomeMotion';
import { usePomodoro } from '../state/PomodoroContext';
import { petAnimation, petStill, type PetPose } from './motion';
import { PETS, choosePetMood, petInfo, petUnlocked, type PetId, type PetMood } from './pets';

const art = {
 seal: require('../../assets/animations/igloo-pets/idle.png'),
 fox: require('../../assets/animations/igloo-pets/fox-idle.png'),
 bunny: require('../../assets/animations/igloo-pets/bunny-idle.png'),
 bear: require('../../assets/animations/igloo-pets/bear-idle.png'),
};
const bowl = require('../../assets/animations/igloo-pets/bowl.png');
const toy = require('../../assets/animations/study-together-breaks/toy.png');
const corner = require('../../assets/animations/igloo-pets/corner-warm-nordic.png');
type Point = [number, number];
type Layout = { widthRatio?: number; bed:Point; aisle:Point; browse:Point; pip:Point; window:Point; bowl:Point; corner:Point; garden?:Point; gardenPath?:Point[] };
const layouts:Record<'studyIgloo'|'shared'|'personal'|'original'|'panorama',Layout> = {
 studyIgloo:{garden:[.215,.905],gardenPath:[[.60,.92],[.46,.92],[.22,.82]],corner:[.835,.97],bed:[.795,.96],aisle:[.60,.92],browse:[.59,.845],pip:[.235,.735],window:[.285,.72],bowl:[.916,.962]},
 shared:{garden:[.25,.965],corner:[.50,.965],bed:[.465,.946],aisle:[.285,.915],browse:[.255,.835],pip:[.24,.735],window:[.10,.76],bowl:[.535,.937]},
 panorama:{widthRatio:.082,corner:[.885,.88],bed:[.862,.864],aisle:[.781,.87],browse:[.787,.765],pip:[.49,.701],window:[.57,.53],bowl:[.937,.871],garden:[.94,.613]},
 personal:{corner:[.23,.60],bed:[.22,.60],aisle:[.28,.60],browse:[.31,.56],pip:[.40,.57],window:[.37,.51],bowl:[.29,.63]},
 original:{corner:[.20,.90],bed:[.17,.89],aisle:[.31,.89],browse:[.39,.87],pip:[.43,.80],window:[.43,.68],bowl:[.27,.90]},
};
const actions = [['Pet','happy'],['Play','play'],['Feed','feed'],['Nap','sleep'],['Follow Pip','follow']] as const;
const percent=(value:number)=>`${value*100}%` as const;

export function PetCorner({ room, visible=true, pipBusy=false, pipMoving=false, previewBed }: {
 room:keyof typeof layouts; visible?:boolean; pipBusy?:boolean; pipMoving?:boolean; previewBed?:string;
}) {
 const {timer,hydrated}=usePomodoro();
 const [show,setShow]=useState(false);
 const [actionMenuVisible,setActionMenuVisible]=useState(false);
 const [ask,setAsk]=useState(0);
 const [size,setSize]=useState({width:0,height:0});
 const layout=layouts[room];
 const customBed = (room==='personal'||room==='original'||room==='panorama') && (previewBed ?? timer.home.equipped.petBed)==='gift-pet-bed';
 const bounds = room === 'studyIgloo' ? IGLOO_FURNITURE.pets : room === 'panorama' ? panoramaBounds(PANORAMA_SLOTS.petBed) : roomBox((layout.corner[0]-.10)*100,(layout.corner[1]-.095)*100,20,13);
 const pet=timer.home.pets.active;
 const openPets=useFurniture('pets',()=>{
   if (pet && timer.status !== 'paused' && !(timer.mode === 'focus' && timer.status === 'running')) setAsk(value => value + 1);
   else setShow(true);
 },{disabled:!hydrated,state:pet ? 'Companion adopted' : 'Available for adoption',
   bounds});

 return <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, room==='studyIgloo' && actionMenuVisible && s.aboveFurniture]} onLayout={({nativeEvent:{layout:{width,height}}})=>setSize(value=>value.width===width&&value.height===height?value:{width,height})}>
   {room==='panorama' && customBed && <>
     <PanoramaSprite id="gift-pet-bed" source={GIFT_ART['room-12']} box={PANORAMA_SLOTS.petBed} z={0} shadow />
     <PanoramaSprite id="petToy" source={PANORAMA_FIXTURES.petToy} box={PANORAMA_PROPS.petToy} z={1} />
     <PanoramaSprite id="petBowl" source={PANORAMA_FIXTURES.petBowl} box={PANORAMA_PROPS.petBowl} z={1} />
   </>}
   <Pressable accessibilityLabel="Pet adoption" accessibilityRole="button" disabled={!hydrated} accessibilityHint="Adopt or change your companion"
     onPress={openPets} style={[s.corner,room==='studyIgloo'&&s.studyIglooCorner,boxStyle(bounds)]}>
     {!(room==='panorama' && customBed) && <Image source={customBed ? GIFT_ART['room-12'] : corner} style={s.fill} resizeMode="contain" />}
   </Pressable>
   {pet&&size.width>0&&size.height>0&&<RoomPet key={pet+'-'+room} id={pet} layout={layout} size={size} visible={visible&&!show} pipBusy={pipBusy} pipMoving={pipMoving} request={ask} onChangePet={()=>setShow(true)} onMenuVisibility={setActionMenuVisible} />}
   {show&&<Adoption onClose={()=>setShow(false)} />}
 </View>;
}

function RoomPet({ id, layout, size, visible, pipBusy, pipMoving, request, onChangePet, onMenuVisibility }: {
 id:PetId; layout:Layout; size:{width:number;height:number}; visible:boolean; pipBusy:boolean; pipMoving:boolean; request:number; onChangePet:()=>void; onMenuVisibility:(open:boolean)=>void;
}) {
 const {timer,updatePet}=usePomodoro();
 const {cue,requestRestReaction}=usePipReactions();
 const {active,motion}=useHomeMotionState(visible);
 const {following,names}=timer.home.pets;
 const gardenOpenForVisits=timer.mode !== 'focus' && timer.status === 'running' && timer.home.garden.plots.some(Boolean);
 const name=names[id]??petInfo(id).name;
 const blocked=timer.status==='paused'||(timer.mode==='focus'&&timer.status==='running');
 const [pose,setPose]=useState<PetPose>('idle');
 const [menu,setMenu]=useState(false);
 const [facing,setFacing]=useState(1);
 const [task,setTask]=useState<{pose:PetPose;path:Point[];greet?:boolean;prop?:'bowl'|'toy'}|null>(null);
 const [arrival,setArrival]=useState(false);
 const roll=useRef(new Animated.Value(0)).current;
 const position=useRef<Point>(layout.bed);
 const [greeting,setGreeting]=useState(false);
 const previous=useRef<PetMood>('idle');
 const x=useRef(new Animated.Value(layout.bed[0])).current;
 const y=useRef(new Animated.Value(layout.bed[1])).current;
 const lastSession=timer.sessions.at(-1);
 const seen=useRef(lastSession?.id);
 const allowed=active&&!blocked;
 const wasMoving=useRef(false);
 const lastRequest=useRef(request);
 useEffect(()=>{
   if(request===lastRequest.current)return;
   lastRequest.current=request;
   if(allowed)setMenu(true);
 },[request,allowed]);
 const width=Math.max(43,size.width*(layout.widthRatio ?? .142));
 useEffect(()=>{
   onMenuVisibility(menu);
   return ()=>onMenuVisibility(false);
 },[menu,onMenuVisibility]);

 useEffect(()=>{
   const a=x.addListener(({value})=>{position.current=[value,position.current[1]];});
   const b=y.addListener(({value})=>{position.current=[position.current[0],value];});
   return ()=>{x.removeListener(a);y.removeListener(b);};
 },[x,y]);

 useEffect(()=>{
   if(!allowed){setTask(null);setPose('sleep');setMenu(false);setGreeting(false);return;}
   setPose('idle');
 },[allowed]);

 useEffect(()=>{
   if(!task||!allowed)return;
   const timers:ReturnType<typeof setTimeout>[]=[];
   const moves:Animated.CompositeAnimation[]=[];
   let cancelled=false;
   const later=(callback:()=>void,ms:number)=>{timers.push(setTimeout(callback,ms));};
   const place=(index:number)=>{
     if(cancelled)return;
     const point=task.path[index];
     if(!point||!motion){
       setArrival(true);
       setPose(task.pose);
       if(task.greet&&motion)setGreeting(true);
       later(()=>{setTask(null);setPose(task.pose==='sleep'?'sleep':'idle');},task.pose==='sleep'?11000:3000);
       return;
     }
     const [fromX,fromY]=position.current;
     const dx=point[0]-fromX;
     const dy=point[1]-fromY;
     if(Math.hypot(dx,dy)<.01){place(index+1);return;}
     if(Math.abs(dx)>.008)setFacing(dx>0?-1:1);
     setPose('walk');
     const duration=Math.max(260,Math.hypot(dx,dy)*8500);
     const move=Animated.parallel([
       Animated.timing(x,{toValue:point[0],duration,easing:Easing.linear,useNativeDriver:false}),
       Animated.timing(y,{toValue:point[1],duration,easing:Easing.linear,useNativeDriver:false}),
     ]);
     moves.push(move);
     move.start(({finished})=>{if(finished)place(index+1);});
   };
   setArrival(false);
   place(0);
   return ()=>{cancelled=true;moves.forEach(move=>move.stop());timers.forEach(clearTimeout);};
 },[allowed,motion,task,x,y]);

 useEffect(()=>{
   if(!allowed||!motion||!greeting||pipBusy||cue)return;
   setGreeting(false);
   requestRestReaction(id==='fox'?'look':'smile');
 },[allowed,cue,greeting,id,motion,pipBusy,requestRestReaction]);

 useEffect(()=>{
   if(!allowed||!lastSession?.completed||seen.current===lastSession.id)return;
   seen.current=lastSession.id;
   setTask({pose:'happy',path:[]});
 },[allowed,lastSession]);

 useEffect(()=>{
   const stopped = wasMoving.current && !pipMoving;
   wasMoving.current = pipMoving;
   if(!allowed||!motion||!following||menu||(!pipMoving&&!stopped))return;
   setTask({pose:'look',path:[layout.aisle,layout.browse,pipMoving?layout.window:layout.pip]});
 },[allowed,following,layout,menu,motion,pipMoving]);

 useEffect(()=>{
   if(!allowed||!motion||task||menu)return;
   const timeout=setTimeout(()=>{
     const choice=choosePetMood(id,previous.current);
     previous.current=choice;
     const towardPip=!pipBusy&&(following||choice==='interact');
     if(towardPip){setTask({pose:'look',path:[layout.aisle,layout.browse,layout.pip],greet:true});return;}
     if (layout.garden && gardenOpenForVisits && !pipBusy && Math.random() < .18) {
       setTask({ pose: id === 'seal' || id === 'bear' ? 'sleep' : id === 'bunny' ? 'play' : 'look', path: [...(layout.gardenPath ?? [layout.aisle]), layout.garden] });
       return;
     }
     if(choice==='walk'){setTask({pose:'look',path:[layout.aisle,layout.window]});return;}
     if(choice==='sleep'){setTask({pose:'sleep',path:[layout.aisle,layout.bed]});return;}
     if(choice==='play'){setTask({pose:'play',path:[layout.aisle,layout.browse],prop:'toy'});return;}
     setTask({pose:choice,path:[]});
   },(pose==='sleep'?17000:7000)+Math.random()*11000);
   return ()=>clearTimeout(timeout);
 },[allowed,following,gardenOpenForVisits,id,layout,menu,motion,pipBusy,pose,task]);

 const command=(action:typeof actions[number][1])=>{
   setMenu(false);
   if(action==='follow'){
     updatePet({type:'following',value:!following});
     if(!following)setTask({pose:'look',path:[layout.aisle,layout.browse,layout.pip],greet:true});
   }else if(action==='sleep')setTask({pose:'sleep',path:[layout.aisle,layout.bed]});
   else if(action==='feed')setTask({pose:'feed',path:[layout.aisle,[layout.bowl[0]-.055,layout.bowl[1]]],prop:'bowl'});
   else if(action==='play')setTask({pose:'play',path:[layout.aisle,layout.browse],prop:'toy'});
   else setTask({pose:'happy',path:[],greet:true});
 };
 useEffect(()=>{
   roll.setValue(0);
   if(!motion||!arrival||task?.prop!=='toy')return;
   const animation=Animated.timing(roll,{toValue:1,duration:1400,easing:Easing.out(Easing.quad),useNativeDriver:true});
   animation.start();
   return ()=>animation.stop();
 },[arrival,motion,roll,task]);
 const propPoint=task?.prop==='bowl'?layout.bowl:[layout.browse[0]+.06,layout.browse[1]];
 return <>
   {allowed&&task?.prop&&<View pointerEvents="none" testID={`pet-${task.prop}`} style={[s.prop,{left:percent(propPoint[0]-.025),top:percent(propPoint[1]-.025)}]}>
     {task.prop==='bowl' ? <Image source={bowl} resizeMode="contain" style={s.propArt} /> :
       <Animated.Image source={toy} resizeMode="contain" style={[s.propArt,{transform:[
         {translateX:roll.interpolate({inputRange:[0,1],outputRange:[-8,16]})},
         {rotate:roll.interpolate({inputRange:[0,1],outputRange:['0deg','180deg']})},
       ]}]} />}
   </View>}
   <Animated.View style={[s.actor,{width,height:width,left:x.interpolate({inputRange:[0,1],outputRange:[-width/2,size.width-width/2]}),top:y.interpolate({inputRange:[0,1],outputRange:[-width*.93,size.height-width*.93]})}]}>
     <View pointerEvents="none" style={s.shadow} />
     <Pressable style={s.fill} accessibilityRole="button" accessibilityLabel={`Interact with ${name}`} disabled={!allowed}
       accessibilityState={{expanded:menu}} onPress={()=>setMenu(!menu)}>
       <View pointerEvents="none" style={[s.fill,{transform:[{scaleX:pose==='walk'?facing:1}]}]}>
         <PetPortrait id={id} pose={pose} motion={motion}/>
       </View>
     </Pressable>
   </Animated.View>
   {menu&&allowed&&<View style={s.menu}>
     <Text style={s.title}>{name}</Text>
     <View style={s.row}>{actions.map(([label,action])=><Pressable key={action} accessibilityRole="button" onPress={()=>command(action)} style={s.button}>
       <Text style={s.buttonText}>{action==='follow'&&following?'Stop following':label}</Text>
     </Pressable>)}<Pressable accessibilityRole="button" onPress={()=>{setMenu(false);onChangePet();}} style={s.button}>
       <Text style={s.buttonText}>Change pet</Text>
     </Pressable></View>
   </View>}
 </>;
}

function PetPortrait({id,pose,motion}:{id:PetId;pose:PetPose;motion:boolean}) {
 const source=useMemo(()=>motion?petAnimation(id,pose):null,[id,motion,pose]);
 const [loaded,setLoaded]=useState<typeof source>(null);
 return <>
   {(!source||loaded!==source)&&<Image source={petStill(id,pose)} style={s.still} resizeMode="contain" />}
   {source&&<StudyRoomPerformance key={id+pose} source={source} motion loop onLoaded={()=>setLoaded(source)} testID={`pet-pose-${id}-${pose}`} />}
 </>;
}

function Adoption({onClose}:{onClose:()=>void}) {
 const {timer,updatePet}=usePomodoro();
 const {motion}=useHomeMotionState();
 const pets=timer.home.pets;
 const [selected,setSelected]=useState<PetId>(pets.active??'seal');
 const [name,setName]=useState(pets.names[selected]??'');
 const [preview,setPreview]=useState<PetPose>('idle');
 const progress=useMemo(()=>studyMilestones(timer.sessions).progress.time,[timer.sessions]);
 const pet=petInfo(selected);
 const adopted=pets.adopted.includes(selected);
 const unlocked=adopted||petUnlocked(selected,progress);
 return <Overlay visible transparent animationType={motion?'fade':'none'} onRequestClose={onClose}>
   <View style={s.shade}><View style={s.sheet} accessibilityViewIsModal>
     <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
       <View style={s.header}><Text style={s.title}>Igloo companions</Text><IconButton label="Close pet adoption" onPress={onClose}><Chevron direction="close" /></IconButton></View>
       <View style={s.row}>{PETS.map(item=><Pressable key={item.id} accessibilityRole="button" accessibilityLabel={item.name}
         accessibilityState={{selected:selected===item.id}} style={[s.option,selected===item.id&&s.selected]}
         onPress={()=>{setSelected(item.id);setName(pets.names[item.id]??'');setPreview('idle');}}>
         <Image source={art[item.id]} style={s.thumb} resizeMode="contain"/><Text style={s.optionText}>{item.name}</Text>
       </Pressable>)}</View>
       <View style={s.preview}><PetPortrait id={selected} pose={preview} motion={motion}/></View>
       <Text style={s.description}>{pet.personality}</Text>
       <View style={s.row}>{(['idle','walk','sleep','play','happy','interact'] as const).map(pose=><Pressable key={pose} accessibilityRole="button" accessibilityState={{selected:preview===pose}} onPress={()=>setPreview(pose)} style={[s.button,preview===pose&&s.selected]}><Text style={s.buttonText}>{pose}</Text></Pressable>)}</View>
       {unlocked?<><TextInput accessibilityLabel="Pet name" placeholder="Give your companion a name" value={name} maxLength={20} onChangeText={setName} style={s.input} />
         <View style={s.row}>
           <Pressable disabled={!name.trim()} accessibilityRole="button" onPress={()=>{updatePet({type:adopted?'rename':'adopt',pet:selected,name});onClose();}} style={[s.primary,!name.trim()&&s.disabled]}><Text style={s.primaryText}>{adopted?'Save name':'Adopt '+pet.name}</Text></Pressable>
           {adopted&&pets.active!==selected&&<Pressable accessibilityRole="button" onPress={()=>{updatePet({type:'activate',pet:selected});onClose();}} style={s.button}><Text style={s.buttonText}>Make active</Text></Pressable>}
         </View>
       </>:<Text style={s.description}>{Math.floor(progress/360000)/10} / {pet.unlockHours} hours in completed focus sessions</Text>}
     </ScrollView>
   </View></View>
 </Overlay>;
}

const s=StyleSheet.create({
 fill:{width:'100%',height:'100%'}, still:{position:'absolute',width:'89%',height:'88%',left:'5.5%',bottom:'10%'}, corner:{position:'absolute',width:'20%',height:'13%',minHeight:44,minWidth:44,zIndex:6},
 aboveFurniture:{zIndex:14}, studyIglooCorner:{minHeight:0},
 actor:{position:'absolute',zIndex:7}, prop:{position:'absolute',zIndex:6,width:'7%',alignItems:'center'}, propArt:{width:'100%',aspectRatio:1.15},shadow:{position:'absolute',bottom:'7%',width:'61%',left:'19.5%',height:'10%',borderRadius:30,backgroundColor:'#36234e30'},
 menu:{position:'absolute',bottom:'13%',left:'5%',right:'5%',zIndex:14,borderRadius:18,backgroundColor:'#fff0d5',borderWidth:1,borderColor:'#be9063',padding:12,gap:8},
 shade:{ ...ui.shade, backgroundColor: 'transparent' }, sheet:{ ...ui.dialog, maxHeight:'90%' },
 content:{padding:16,gap:10}, header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}, title:{ ...type.heading, color: colors.ink },
 row:{flexDirection:'row',flexWrap:'wrap',gap:6}, button:{minHeight:44,paddingHorizontal:10,justifyContent:'center',backgroundColor:'#f2dcba',borderRadius:20},buttonText:{color:'#63402c',fontSize:12,fontWeight:'800',textTransform:'capitalize'},
 option:{flex:1,minWidth:64,alignItems:'center',padding:4,borderRadius:13,backgroundColor:'#f6e5c9'},selected:{backgroundColor:'#eed0a2'},thumb:{width:'100%',height:49},optionText:{fontSize:10,color:'#684532',textAlign:'center',fontWeight:'700'},
 preview:{width:130,height:122,alignSelf:'center',backgroundColor:'#f9e5c1',borderRadius:24},description:{color:'#6d503e',fontSize:13,textAlign:'center'},
 input:{minHeight:44,borderWidth:1,borderColor:'#b88a63',backgroundColor:'#fff8ec',borderRadius:12,paddingHorizontal:10,color:'#4f3424'},primary:{minHeight:44,paddingHorizontal:14,justifyContent:'center',borderRadius:19,backgroundColor:'#875338'},primaryText:{color:'#fff8ec',fontWeight:'800'},disabled:{opacity:.5},
});
