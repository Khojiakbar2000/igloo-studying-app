import React, { useMemo } from 'react';
import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import type { AnimationObject } from 'lottie-react-native';
import { StudyRoomPerformance } from '../components/StudyRoomPerformance';
import { useHomeMotionState } from '../home/useHomeMotion';

export const EGG = require('../../assets/environments/onboarding/story-0.png');
const CRACK = require('../../assets/environments/onboarding/story-1.png');
const SHELL = require('../../assets/environments/onboarding/story-2.png');
export const BABY = require('../../assets/environments/onboarding/story-3.png');
const HEART = require('../../assets/environments/onboarding/story-4.png');
const JOY = require('../../assets/environments/onboarding/story-5.png');
export const EXTERIOR = require('../../assets/environments/onboarding/exterior.jpg');
const DOOR = require('../../assets/environments/onboarding/door.png');
const LANDSCAPE = require('../../assets/environments/onboarding/landscape.jpg');
export const SNOWFIELD = require('../../assets/environments/onboarding/snowfield.jpg');
export const PROPS: number[] = [
  require('../../assets/environments/onboarding/prop-0.png'),
  require('../../assets/environments/onboarding/prop-1.png'),
  require('../../assets/environments/onboarding/prop-2.png'),
  require('../../assets/environments/onboarding/prop-3.png'),
  require('../../assets/environments/onboarding/prop-4.png'),
  require('../../assets/environments/onboarding/prop-5.png'),
  require('../../assets/environments/onboarding/prop-6.png'),
  require('../../assets/environments/onboarding/prop-7.png'),
];
const clips = {
  crack: () => require('../../assets/environments/onboarding/crack.json'),
  shake: () => require('../../assets/environments/onboarding/shake.json'),
  hatch: () => require('../../assets/environments/onboarding/hatch.json'),
  heart: () => require('../../assets/environments/onboarding/heart.json'),
  name: () => require('../../assets/environments/onboarding/name.json'),
  joy: () => require('../../assets/environments/onboarding/joy.json'),
  notebook: () => require('../../assets/environments/onboarding/notebook.json'),
  clock: () => require('../../assets/environments/onboarding/clock.json'),
  enter: () => require('../../assets/environments/onboarding/enter.json'),
};
export type Clip = keyof typeof clips;
export function StoryArt({ clip, taps = 0, onFinish, small, hero = false, exterior = false, transparent = false }: {
  clip?: Clip; taps?: number; onFinish?: () => void; small?: boolean; hero?: boolean; exterior?: boolean; transparent?: boolean;
}) {
  const { width }=useWindowDimensions();
  const exteriorHeight=Math.round((Math.min(535,width)-38)/1.25);
  const { reduced, motion } = useHomeMotionState();
  const data = useMemo(() => clip && !reduced ? JSON.parse(JSON.stringify(clips[clip]())) as AnimationObject : null, [clip, reduced]);
  const [played, setPlayed] = React.useState<AnimationObject | null>(null);
  const showMotion = data && played !== data;
  const still = clip === 'heart' ? HEART : clip === 'joy' || clip === 'name' ? JOY : clip === 'notebook' || clip === 'clock' || exterior || taps >= 3 ? BABY : taps > 0 ? CRACK : EGG;
  return <View accessible={false} pointerEvents="none" style={[styles.stage, hero && styles.hero, transparent && styles.clear, small && styles.small, exterior && { height: exteriorHeight }]}>
    {!transparent&&<Image source={exterior ? EXTERIOR : LANDSCAPE} resizeMode={exterior ? 'stretch' : 'cover'} style={styles.backdrop} />}
    {!exterior&&<View style={styles.groundShadow} />}
    {exterior&&!clip&&<Image source={DOOR} style={styles.door} resizeMode="stretch" />}
    {showMotion ? <StudyRoomPerformance source={data} motion={motion} onFinish={() => {setPlayed(data); onFinish?.();}} />
      : <>
        <Image source={still} style={[styles.sprite, exterior && styles.doorway]} resizeMode="contain" />
        {!exterior && taps >= 3 && !clip && <Image source={SHELL} style={styles.shell} resizeMode="contain" />}
        {clip === 'clock' && <Image source={PROPS[7]} style={styles.prop} resizeMode="contain" />}
        {clip === 'notebook' && <Image source={PROPS[0]} style={styles.prop} resizeMode="contain" />}
      </>}
  </View>;
}

const styles = StyleSheet.create({
  stage:{width:'100%',height:249,borderRadius:23,borderWidth:1,borderColor:'#e1e7f4',overflow:'hidden',position:'relative',backgroundColor:'#b5c6ed'},
  hero:{height:362}, clear:{backgroundColor:'transparent',borderWidth:0},
  small:{height:157},
  groundShadow:{position:'absolute',bottom:'8%',left:'35%',width:'30%',height:12,borderRadius:14,backgroundColor:'#485e8e23'},
  backdrop:{...StyleSheet.absoluteFillObject,width:'100%',height:'100%'},
  door:{position:'absolute',left:'18%',top:'54%',width:'21%',height:'22%'},
  sprite:{position:'absolute',width:'68%',height:'72%',left:'16%',bottom:'8%'},
  prop:{position:'absolute',width:'23%',height:'34%',right:'13%',bottom:'10%'},
  shell:{position:'absolute',width:'32%',height:'25%',left:'34%',bottom:'6%'},
  doorway:{width:'24%',height:'35%',left:'43%',bottom:'8%'},
});
