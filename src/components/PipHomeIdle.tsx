import React,{useEffect,useRef,useState}from'react';
import {Animated,Easing,Image,StyleSheet,View}from'react-native';

const BLINK=require('../../assets/animations/pip-home-idle/blink-eyes.png');
/** An opt-in idle over the approved seated cel; accessories share the same transform. */
export function PipHomeIdle({children,enabled,motion}:{children:(eyes:React.ReactNode)=>React.ReactNode;enabled:boolean;motion:boolean}){
 const breath=useRef(new Animated.Value(0)).current,blink=useRef(new Animated.Value(0)).current;
 const [height,setHeight]=useState(0),[blinkReady,setBlinkReady]=useState(false);
 useEffect(()=>{
  if(!enabled||!motion){breath.setValue(0);return;}
  const loop=Animated.loop(Animated.sequence([Animated.timing(breath,{toValue:1,duration:1900,easing:Easing.inOut(Easing.sin),useNativeDriver:true}),Animated.timing(breath,{toValue:0,duration:2400,easing:Easing.inOut(Easing.sin),useNativeDriver:true})]));loop.start();return()=>loop.stop();
 },[enabled,motion,breath]);
 useEffect(()=>{
  if(!enabled||!motion||!blinkReady){blink.setValue(0);return;}
  // Alternating holds avoid the mechanical regularity of a metronomic blink.
  const close=()=>Animated.sequence([Animated.timing(blink,{toValue:1,duration:55,useNativeDriver:true}),Animated.delay(95),Animated.timing(blink,{toValue:0,duration:80,useNativeDriver:true})]);
  const loop=Animated.loop(Animated.sequence([Animated.delay(4200),close(),Animated.delay(6400),close(),Animated.delay(3100),close()]));loop.start();return()=>{loop.stop();blink.setValue(0);};
 },[enabled,motion,blinkReady,blink]);
 return <View onLayout={e=>setHeight(e.nativeEvent.layout.height)} style={StyleSheet.absoluteFill}><Animated.View style={[StyleSheet.absoluteFill,{transform:[{translateY:breath.interpolate({inputRange:[0,1],outputRange:[0,-height*.0017]})},{scaleY:breath.interpolate({inputRange:[0,1],outputRange:[1,1.005]})}]}]}>{children(<Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill,{opacity:enabled&&motion?blink:0}]}><Image source={BLINK} onLoad={()=>setBlinkReady(true)} resizeMode="contain" style={{width:'100%',height:'100%'}}/></Animated.View>)}</Animated.View></View>;
}
