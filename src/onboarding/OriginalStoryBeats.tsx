import { colors } from '../theme';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { Igloo } from '../components/SceneArt';
import { useHomeMotionState } from '../home/useHomeMotion';
import { WinterLottie } from '../home/winter/WinterLottie';
import { StoryArt } from './StoryArt';
import { OnboardingPip } from './OnboardingPip';

const exterior = require('../../assets/environments/igloo/igloo-exterior-master.png');
const construction = require('../../assets/animations/pip/winter/lottie/igloo-construction.json');
const milestones = [[10,'First blocks'],[25,'Foundation'],[40,'Walls'],[50,'Dome'],[60,'First home']] as const;

export function SnowballDiscovery() {
  const [found,setFound]=useState(false);
  return <View style={s.stack}>
    <StoryArt transparent clip={found?'name':undefined} emotion={found?'excited':'curious'}
      action={found?'celebrate':'react'} reactionKey={found?'snowball-found':'snowball'} />
    <Text style={s.note}>{found?'A tiny rolling experiment!':'A snowball with a little blue sparkle.'}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="Tap the unusual snowball" onPress={()=>setFound(true)} style={s.snowball}>
      <Svg width={64} height={64} viewBox="0 0 66 66">
        <Circle cx="33" cy="35" r="23" fill="#F9FEFF" stroke="#9EC3CE" strokeWidth="2" />
        <Ellipse cx="25" cy="23" rx="7" ry="4" fill="#FFFFFF" opacity=".85" />
        <Path d="M33 23v24m-10-12h20m-17-7 14 14m0-14L26 42" stroke="#B8D8DF" strokeWidth="2" strokeLinecap="round" />
        <Path d="m13 7 2.5 5L21 14.5 15.5 17 13 22l-2.5-5-5.5-2.5 5.5-2.5Z" fill="#E4B86A" />
      </Svg>
    </Pressable>
  </View>;
}
export function DiscoverHome() {
  const [visits, setVisits] = useState(0);
  return <Pressable accessibilityRole="button" accessibilityLabel="Show Pip the Igloo"
    onPress={() => setVisits(count => count + 1)} style={s.world}>
    <Image source={exterior} resizeMode="cover" style={s.fill} />
    <OnboardingPip emotion={visits ? 'excited' : 'curious'} action={visits ? 'celebrate' : 'react'}
      reactionKey={visits} style={s.companion} />
    <Text style={s.caption}>OUR FIRST LITTLE HOME</Text>
  </Pressable>;
}

export function FirstBlock({ placed, place }: { placed: boolean; place: () => void }) {
  const { reduced }=useHomeMotionState();
  const drag=useRef(new Animated.ValueXY(placed?{x:95,y:-62}:{x:0,y:0})).current;
  const state=useRef({placed,place,reduced});
  state.current={placed,place,reduced};
  useEffect(()=>{
    if (placed) {
      if(reduced)drag.setValue({x:95,y:-62});
      else Animated.spring(drag,{toValue:{x:95,y:-62},useNativeDriver:false,damping:12,stiffness:130}).start();
    }
    return ()=>drag.stopAnimation();
  },[drag,placed,reduced]);
  const pan=useRef(PanResponder.create({
    onStartShouldSetPanResponder:()=>!state.current.placed&&!state.current.reduced,
    onPanResponderMove:(_event,gesture)=>drag.setValue({x:gesture.dx,y:gesture.dy}),
    onPanResponderRelease:(_event,gesture)=>{
      if(gesture.dy< -48&&gesture.dx>10)state.current.place();
      else Animated.spring(drag,{toValue:{x:0,y:0},useNativeDriver:false}).start();
    },
    onPanResponderTerminate:()=>drag.setValue({x:0,y:0}),
  })).current;
  return <View style={s.build}>
    <Text style={s.note}>{placed?'A perfect fit!':'Place the block here'}</Text>
    <View style={s.foundation}><Igloo stage={1} width={210} /></View>
    <OnboardingPip emotion={placed?'proud':'encouraging'} action={placed?'celebrate':'wave'} reactionKey={placed?'placed':'ready'} style={s.helper} />
    <Animated.View {...pan.panHandlers} style={[s.block,{transform:drag.getTranslateTransform()}]}>
      <Svg width={84} height={62} viewBox="0 0 84 62"><Path d="M9 11 23 4l51 6-13 9-51-2Z" fill="#fffdfa" />
        <Path d="M10 17 61 19v34l-52-2Z" fill="#D9EEF5" stroke={colors.muted} strokeWidth="2" />
        <Path d="m61 19 13-9v35l-13 8Z" fill="#BCD9E3" stroke={colors.muted} strokeWidth="2" /></Svg>
    </Animated.View>
    {!placed&&<Pressable accessibilityRole="button" onPress={place} style={s.place}><Text style={s.link}>Place the block without dragging</Text></Pressable>}
  </View>;
}
export function BuildingProgress() {
  const [selection,setSelection]=useState<number|null>(null);
  const [progress,setProgress]=useState(0);
  const { motion }=useHomeMotionState();
  useEffect(()=>{
    if(selection!==null||!motion)return;
    const start=Date.now();
    const timer=setInterval(()=>{
      const value=Math.min(1,(Date.now()-start)/4000);
      setProgress(value);
      if(value===1)clearInterval(timer);
    },50);
    return ()=>clearInterval(timer);
  },[selection,motion]);
  return <View style={s.stack}>
    <View style={s.construction}><WinterLottie data={construction} playing={false} progress={selection!==null?milestones[selection][0]/60:motion?progress:1} /></View>
    {milestones.map(([minutes,label],i)=><Pressable key={minutes} accessibilityRole="button" accessibilityState={{selected:i===selection}}
      onPress={()=>setSelection(i)} style={s.milestone}><Text style={[s.note,i===selection&&s.bold]}>{minutes} min · {label}</Text></Pressable>)}
  </View>;
}
const s=StyleSheet.create({
  stack:{alignItems:'center',width:'100%',gap:4},snowball:{width:76,height:76,alignItems:'center',justifyContent:'center',borderRadius:40,backgroundColor:'#F7FCFC',borderWidth:1,borderColor:'#D7E8E9'},
  note:{color:colors.link,fontSize:13},bold:{fontWeight:'800'},world:{width:'100%',height:310,borderRadius:22,overflow:'hidden'},fill:{...StyleSheet.absoluteFillObject,width:'100%',height:'100%'},
  companion:{position:'absolute',left:'5%',bottom:'14%',width:'23%',height:'28%'},caption:{position:'absolute',bottom:12,alignSelf:'center',fontSize:10,fontWeight:'800',color:colors.link,letterSpacing:1.2},
  build:{width:'100%',height:310,position:'relative',alignItems:'center',paddingTop:12},foundation:{position:'absolute',top:56},helper:{position:'absolute',left:5,bottom:53,width:97,height:120},
  block:{position:'absolute',left:27,bottom:49},place:{minHeight:44,justifyContent:'center',position:'absolute',bottom:0},link:{color:colors.link,fontSize:12,fontWeight:'800',textDecorationLine:'underline'},
  construction:{position:'relative',width:'90%',height:215,backgroundColor:'#d8ebf6',borderRadius:18,overflow:'hidden'},milestone:{minHeight:44,justifyContent:'center',width:'85%',paddingHorizontal:12,borderBottomWidth:1,borderColor:'#cfdee4'},
});
