import React,{useEffect}from'react';
import {Image,StyleSheet,View}from'react-native';
import Animated,{cancelAnimation,Easing,useAnimatedStyle,useSharedValue,withRepeat,withTiming,type SharedValue}from'react-native-reanimated';
const pine=require('../../../assets/animations/pip/winter/environment/pine.png'),thin=require('../../../assets/animations/pip/winter/environment/pine-thin.png'),fox=require('../../../assets/animations/pip/winter/environment/fox.png'),rabbit=require('../../../assets/animations/pip/winter/environment/rabbit.png');
export function WinterEnvironment({active}:{active:boolean}){
 const clock=useSharedValue(0);
 useEffect(()=>{if(active)clock.value=withRepeat(withTiming(1,{duration:60000,easing:Easing.linear}),-1,false);else cancelAnimation(clock);return()=>cancelAnimation(clock);},[active,clock]);
 const tree=useAnimatedStyle(()=>({transform:[{rotate:`${Math.sin(clock.value*Math.PI*8)*.65}deg`}]}));
 const foxStyle=useAnimatedStyle(()=>{const t=clock.value;return {opacity:t>.48&&t<.68?Math.min(1,(t-.48)*40,(.68-t)*40):0,transform:[{translateX:Math.sin(t*6)*5}]};});
 const rabbitStyle=useAnimatedStyle(()=>{const t=clock.value;return {opacity:t>.12&&t<.24?Math.min(1,(t-.12)*50,(.24-t)*50):0,transform:[{translateY:t>.12&&t<.24?Math.max(0,6-Math.min(t-.12,.24-t)*160):6}]};});
 const birds=useAnimatedStyle(()=>{const t=clock.value;return{opacity:t>.76&&t<.87?.5:0,transform:[{translateX:(t-.76)*1500},{translateY:Math.sin(t*80)*2}]};});
 const cloud=useAnimatedStyle(()=>({transform:[{translateX:clock.value*18}],opacity:.12+Math.sin(clock.value*Math.PI*2)*.02}));
 return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
  <Animated.View style={[styles.cloud,cloud]}/>
  <Animated.Image source={pine} resizeMode="contain" style={[styles.pine,tree]}/><Image source={thin} resizeMode="contain" style={styles.thin}/>
  <Animated.Image source={fox} resizeMode="contain" style={[styles.fox,foxStyle]}/><Animated.Image source={rabbit} resizeMode="contain" style={[styles.rabbit,rabbitStyle]}/>
  <Animated.Text style={[styles.birds,birds]}>⌁   ⌁</Animated.Text>
  {Array.from({length:16},(_,i)=><Flake key={i} i={i} clock={clock}/>)}
  <Gust clock={clock}/>
 </View>;
}
function Flake({i,clock}:{i:number;clock:SharedValue<number>}){const style=useAnimatedStyle(()=>{const t=(clock.value*(i%3===0?5:3)+(i*37%100)/100)%1;return{opacity:Math.min(1,t*12,(1-t)*12)*(i%4===0?.65:.35),transform:[{translateY:t*420-20},{translateX:Math.sin(t*5+i)*12+t*14}]};});return <Animated.View style={[styles.flake,{left:`${(i*31+7)%100}%`,width:i%4===0?4:2,height:i%4===0?4:2},style]}/>;}
function Gust({clock}:{clock:SharedValue<number>}){const style=useAnimatedStyle(()=>{const t=clock.value;return{opacity:t>.34&&t<.4?Math.sin((t-.34)/.06*Math.PI)*.18:0,transform:[{translateX:(t-.34)*2500}]};});return <Animated.View style={[styles.gust,style]}/>;}
const styles=StyleSheet.create({pine:{position:'absolute',left:'1%',bottom:'28%',width:50,height:76,opacity:.7},thin:{position:'absolute',right:'2%',bottom:'36%',width:30,height:60,opacity:.55},fox:{position:'absolute',left:'57%',bottom:'39%',width:30,height:30},rabbit:{position:'absolute',left:'7%',bottom:'36%',width:24,height:25},birds:{position:'absolute',top:'12%',left:'10%',fontSize:18,color:'#8b99b2'},cloud:{position:'absolute',top:'7%',left:'8%',width:90,height:18,borderRadius:30,backgroundColor:'#f4f1fb'},flake:{position:'absolute',top:0,borderRadius:4,backgroundColor:'#f5fbff'},gust:{position:'absolute',left:'-20%',bottom:20,width:80,height:4,borderRadius:10,backgroundColor:'#edf6ff'}});
