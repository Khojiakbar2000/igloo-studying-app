import React,{useEffect,useMemo,useRef}from'react';
import {Animated,Easing,StyleSheet,View}from'react-native';
import Svg,{Circle,Defs,Ellipse,G,LinearGradient,Mask,Path,RadialGradient,Rect,Stop}from'react-native-svg';
import {DAY_LIGHT,glassAnchor,type DayPhase}from'../home/atmosphere';
import {snowAnimation,gustAnimation,STEAM_ANIMATION}from'../home/ambientLottie';
import type {HomeLayout}from'../home/state';
import {HomeLottie}from'./HomeLottie';

function GlassMask({id,shape}:{id:string;shape:'round'|'arch'}){
 return <Mask id={id} x="0" y="0" width="100" height="100" maskUnits="userSpaceOnUse"><Path fill="white" d={shape==='round'?'M50 1 A49 49 0 1 1 49.99 1Z':'M2 98V43C2 19 24 2 50 2S98 19 98 43V98Z'}/>{(shape==='round'?[47]:[31,65]).map(x=><Rect key={x} x={x} y={0} width={5} height={100} fill="black"/>)}{shape==='round'&&<Rect x={0} y={48} width={100} height={6} fill="black"/>}</Mask>;
}
function PhaseLight({phase,selected,motion,glass,lamp,original,skylight}:{phase:DayPhase;selected:DayPhase;motion:boolean;glass:ReturnType<typeof glassAnchor>;lamp?:string;original:boolean;skylight:boolean}){
 const opacity=useRef(new Animated.Value(phase===selected?1:0)).current;
 useEffect(()=>{const a=Animated.timing(opacity,{toValue:phase===selected?1:0,duration:motion?1800:0,easing:Easing.inOut(Easing.sin),useNativeDriver:true});a.start();return()=>a.stop();},[phase,selected,motion,opacity]);
 const light=DAY_LIGHT[phase],id='home-'+phase;
 const lampX=original?760:lamp==='lamp-lantern'?937:965,lampY=original?650:lamp==='lamp-lantern'?725:665;
 return <Animated.View style={[StyleSheet.absoluteFill,{opacity}]}><Svg width="100%" height="100%" viewBox="0 0 1024 1536" preserveAspectRatio="none"><Defs>
  <LinearGradient id={id+'-ceiling'} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#101E4B" stopOpacity={light.shade}/><Stop offset=".85" stopColor="#101E4B" stopOpacity="0"/></LinearGradient>
  <LinearGradient id={id+'-sky'} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={light.sky} stopOpacity={light.skyOpacity}/><Stop offset="1" stopColor={light.sky} stopOpacity={light.skyOpacity*.25}/></LinearGradient>
  <RadialGradient id={id+'-pool'}><Stop offset="0" stopColor="#FFD493" stopOpacity={light.glow}/><Stop offset="1" stopColor="#FFD493" stopOpacity="0"/></RadialGradient>
  <LinearGradient id={id+'-sun'} x1="0" y1="0" x2=".6" y2="1"><Stop offset="0" stopColor="#FFF6D8" stopOpacity={phase==='morning'?.13:phase==='afternoon'?.07:0}/><Stop offset="1" stopColor="#FFF6D8" stopOpacity="0"/></LinearGradient>
  <GlassMask id={id+'-glass'} shape={glass.shape}/>
 </Defs><Rect width="1024" height="1536" fill={light.wash} opacity={light.opacity}/><Rect width="1024" height="1536" fill={`url(#${id}-ceiling)`}/>
 <Path d={`M${glass.x} ${glass.y+glass.height*.5}L${glass.x+glass.width} ${glass.y+glass.height*.5}L1000 1390L60 1330Z`} fill={`url(#${id}-sun)`}/>
 {(lamp||original)&&<Circle cx={lampX} cy={lampY} r="265" fill={`url(#${id}-pool)`}/>}
 <G transform={`translate(${glass.x} ${glass.y}) scale(${glass.width/100} ${glass.height/100})`} mask={`url(#${id}-glass)`}><Rect width="100" height="100" fill={`url(#${id}-sky)`}/></G>
 {skylight&&<Ellipse cx="512" cy="185" rx="145" ry="76" fill={`url(#${id}-sky)`}/>}
 </Svg></Animated.View>;
}
export function HomeAtmosphere({phase,layout,original,motion,snowfall,gusts}:{phase:DayPhase;layout:HomeLayout;original:boolean;motion:boolean;snowfall:boolean;gusts:boolean}){
 const glass=glassAnchor(original,layout.window);
 const snow=useMemo(()=>snowAnimation(glass.shape),[glass.shape]);
 const wind=useMemo(()=>gustAnimation(glass.shape),[glass.shape]);
 const flicker=useRef(new Animated.Value(.7)).current;
 useEffect(()=>{if(!motion){flicker.setValue(.7);return;}const loop=Animated.loop(Animated.sequence([Animated.timing(flicker,{toValue:.88,duration:1370,useNativeDriver:true,easing:Easing.inOut(Easing.sin)}),Animated.timing(flicker,{toValue:.73,duration:820,useNativeDriver:true}),Animated.timing(flicker,{toValue:.83,duration:1920,useNativeDriver:true}),Animated.timing(flicker,{toValue:.7,duration:1310,useNativeDriver:true})]));loop.start();return()=>loop.stop();},[motion,flicker]);
 const lampX=original?760:layout.lighting==='lamp-lantern'?937:965,lampY=original?650:layout.lighting==='lamp-lantern'?725:665;
 return <View pointerEvents="none" accessible={false} style={StyleSheet.absoluteFill}>
  {(['morning','afternoon','evening','night'] as DayPhase[]).map(p=><PhaseLight key={p} phase={p} selected={phase} motion={motion} glass={glass} lamp={layout.lighting} original={original} skylight={!original&&layout.ceiling==='skylight'}/>)}
  <View style={{position:'absolute',left:`${glass.x/10.24}%`,top:`${glass.y/15.36}%`,width:`${glass.width/10.24}%`,height:`${glass.height/15.36}%`}}><HomeLottie data={snow} active={motion&&snowfall}/><HomeLottie data={wind} active={motion&&snowfall&&gusts}/></View>
  {(layout.lighting||original)&&<Animated.View style={[StyleSheet.absoluteFill,{opacity:flicker}]}><Svg width="100%" height="100%" viewBox="0 0 1024 1536"><Defs><RadialGradient id="home-lantern-flicker"><Stop offset="0" stopColor="#FFF2C3" stopOpacity={phase==='evening'||phase==='night'?.11:.045}/><Stop offset="1" stopColor="#FFD395" stopOpacity="0"/></RadialGradient></Defs><Circle cx={lampX} cy={lampY} r="125" fill="url(#home-lantern-flicker)"/></Svg></Animated.View>}
  {!original&&layout.tabletop==='decor-tea'&&<View style={{position:'absolute',left:'85.8%',top:'55%',width:'4.8%',height:'4.8%'}}><HomeLottie data={STEAM_ANIMATION} active={motion}/></View>}
  {!original&&layout.ceiling==='skylight'&&phase==='night'&&<Animated.View style={[StyleSheet.absoluteFill,{opacity:flicker}]}><Svg width="100%" height="100%" viewBox="0 0 1024 1536">{[[475,170],[530,130],[567,207],[427,201],[610,172]].map(([x,y],i)=><G key={i}><Circle cx={x} cy={y} r={i%2?1.7:2.3} fill="#FFF5D5"/><Path d={`M${x-5} ${y}h10M${x} ${y-5}v10`} stroke="#FFF5D5" strokeWidth=".7" opacity=".6"/></G>)}</Svg></Animated.View>}
 </View>;
}
