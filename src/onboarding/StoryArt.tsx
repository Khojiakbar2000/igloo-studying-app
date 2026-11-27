import React, { useMemo } from 'react';
import { Animated, Image, Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import type { AnimationObject } from 'lottie-react-native';
import { StudyRoomPerformance } from '../components/StudyRoomPerformance';
import { useHomeMotionState } from '../home/useHomeMotion';
import { colors } from '../theme';
import type { CharacterAction, CharacterEmotion } from '../character/CharacterBehaviorController';
import { OnboardingPip } from './OnboardingPip';

export const EGG = require('../../assets/environments/onboarding/story-0.png');
const CRACK = require('../../assets/environments/onboarding/story-1.png');
const SHELL = require('../../assets/environments/onboarding/story-2.png');
export const BABY = require('../../assets/environments/onboarding/story-3.png');
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

export type EggClip = Extract<Clip, 'crack' | 'shake' | 'hatch'>;

// Match the resting keyframes of the three 320 × 320 egg clips.
const eggArtboard = 320;
const eggSprite = (x: number, bottom: number, width: number, height: number) => ({
  left: `${(x - width / 2) / eggArtboard * 100}%` as const,
  top: `${(bottom - height) / eggArtboard * 100}%` as const,
  width: `${width / eggArtboard * 100}%` as const,
  height: `${height / eggArtboard * 100}%` as const,
});
const eggPose = eggSprite(160, 280, 183 * .88, 225 * .88);
const babyPose = eggSprite(159, 275, 181 * .85, 225 * .85);
const shellPose = eggSprite(260, 288, 225 * .35, 156 * .35);

export function EggHatchingArt({ clip, taps, small, onFinish }: {
  clip?: EggClip; taps: number; small: boolean; onFinish: () => void;
}) {
  const { motion } = useHomeMotionState();
  const [size, setSize] = React.useState(0);
  const [readyClip, setReadyClip] = React.useState<EggClip>();
  const loaded = React.useCallback(() => setReadyClip(clip), [clip]);
  const animation = useMemo(() => clip ? JSON.parse(JSON.stringify(clips[clip]())) as AnimationObject : null, [clip]);
  const restingTap = clip === 'crack' ? 0 : clip ? 1 : taps;
  const hatched = restingTap >= 3;
  const glow = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    if (hatched) {
      glow.setValue(1);
      return;
    }
    if (clip !== 'hatch' || readyClip !== 'hatch' || !motion) {
      glow.setValue(0);
      return;
    }
    // The shell opens at about the one-second mark in the authored clip.
    const fade = Animated.timing(glow, { toValue: 1, delay: 850, duration: 450, useNativeDriver: Platform.OS !== 'web' });
    fade.start();
    return () => fade.stop();
  }, [clip, glow, hatched, motion, readyClip]);

  return <View pointerEvents="none" accessible={false}
    style={[styles.stage, styles.hero, styles.clear, styles.eggStage, small && styles.compactEgg]}
    onLayout={({ nativeEvent: { layout } }) => setSize(Math.min(layout.width, layout.height))}>
    {size > 0 && <View style={{ width: size, height: size }}>
      {(clip === 'hatch' || hatched) && <Animated.View style={[StyleSheet.absoluteFill, { opacity: glow }]}>
        <Svg width="100%" height="100%" viewBox="0 0 320 320">
          <Defs><RadialGradient id="hatch-sunrise">
            <Stop offset="0" stopColor="#fff4cb" stopOpacity=".9" />
            <Stop offset=".58" stopColor="#ffedc2" stopOpacity=".39" />
            <Stop offset="1" stopColor="#ffedc2" stopOpacity="0" />
          </RadialGradient></Defs>
          <Circle cx="160" cy="159" r="138" fill="url(#hatch-sunrise)" />
          <Path d="M88 105q0 10 10 10-10 0-10 10 0-10-10-10 10 0 10-10ZM232 77q0 9 9 9-9 0-9 9 0-9-9-9 9 0 9-9ZM247 148q0 6 6 6-6 0-6 6 0-6-6-6 6 0 6-6Z" fill="#fff6dc" />
        </Svg>
      </Animated.View>}
      <View style={styles.eggShadow} />
      {(!clip || readyClip !== clip) && <>
        <Image accessible={false} source={hatched ? BABY : restingTap ? CRACK : EGG}
          style={[styles.eggArt, hatched ? babyPose : eggPose]} fadeDuration={0} resizeMode="stretch" />
        {hatched && <Image accessible={false} source={SHELL} style={[styles.eggArt, shellPose]} fadeDuration={0} resizeMode="stretch" />}
      </>}
      {animation && <StudyRoomPerformance key={clip} source={animation} motion={motion} onLoaded={loaded} onFinish={onFinish} />}
    </View>}
  </View>;
}

export function StoryArt({ clip, onFinish, small, hero = false, exterior = false, transparent = false,
  emotion = 'curious', action = 'idle', reactionKey, prop }: {
  clip?: Clip; onFinish?: () => void; small?: boolean; hero?: boolean; exterior?: boolean; transparent?: boolean;
  emotion?: CharacterEmotion; action?: CharacterAction; reactionKey?: string | number; prop?: 'clock' | 'notebook';
}) {
  const { width }=useWindowDimensions();
  const exteriorHeight=Math.round((Math.min(535,width)-38)/1.25);
  const { reduced, motion } = useHomeMotionState();
  const data = useMemo(() => clip && !reduced ? JSON.parse(JSON.stringify(clips[clip]())) as AnimationObject : null, [clip, reduced]);
  const [played, setPlayed] = React.useState<AnimationObject | null>(null);
  const [loaded, setLoaded] = React.useState<AnimationObject | null>(null);
  const showMotion = data && played !== data;
  const showPip = !showMotion || loaded !== data;
  const pipHeight = small ? 122 : hero ? 260 : 180;
  const pipWidth = Math.round(pipHeight * .74);
  return <View accessible={false} pointerEvents="none" style={[styles.stage, hero && styles.hero, transparent && styles.clear, small && styles.small, exterior && { height: exteriorHeight }]}>
    {!transparent&&<Image source={exterior ? EXTERIOR : LANDSCAPE} resizeMode={exterior ? 'stretch' : 'cover'} style={styles.backdrop} />}
    {!exterior&&<View style={styles.groundShadow} />}
    {exterior&&showPip&&<Image source={DOOR} style={styles.door} resizeMode="stretch" />}
    {showPip && <>
        {!exterior && <View style={styles.characterAnchor}>
          <OnboardingPip emotion={emotion} action={showMotion ? 'idle' : action} reactionKey={reactionKey}
            style={{ width: pipWidth, height: pipHeight }} />
        </View>}
        {exterior && <OnboardingPip emotion={emotion} action={showMotion ? 'idle' : action} reactionKey={reactionKey}
          style={styles.doorway} />}
        {(prop ?? clip) === 'clock' && <Image source={PROPS[7]} style={styles.prop} resizeMode="contain" />}
        {(prop ?? clip) === 'notebook' && <Image source={PROPS[0]} style={styles.prop} resizeMode="contain" />}
      </>}
    {showMotion && <StudyRoomPerformance key={clip} source={data} motion={motion}
      onLoaded={() => setLoaded(data)} onFinish={() => {setPlayed(data); onFinish?.();}} />}
  </View>;
}

const styles = StyleSheet.create({
  stage:{width:'100%',height:249,borderRadius:23,borderWidth:1,borderColor:colors.line,overflow:'hidden',position:'relative',backgroundColor:colors.iceBlue},
  hero:{height:362}, clear:{backgroundColor:'transparent',borderWidth:0},
  small:{height:157},
  compactEgg:{height:258},
  eggStage:{alignItems:'center',justifyContent:'center'},
  eggArt:{position:'absolute'},
  eggShadow:{position:'absolute',left:'32%',top:'86%',width:'36%',height:'3.5%',borderRadius:20,backgroundColor:'#35454D23'},
  groundShadow:{position:'absolute',bottom:'2%',left:'35%',width:'30%',height:12,borderRadius:14,backgroundColor:'#35454D23'},
  backdrop:{...StyleSheet.absoluteFillObject,width:'100%',height:'100%'},
  door:{position:'absolute',left:'18%',top:'54%',width:'21%',height:'22%'},
  prop:{position:'absolute',width:'23%',height:'34%',right:'13%',bottom:'10%'},
  characterAnchor:{position:'absolute',left:0,right:0,bottom:'2%',alignItems:'center',height:'100%',justifyContent:'flex-end'},
  doorway:{width:'24%',height:'35%',left:'43%',bottom:'8%'},
});
