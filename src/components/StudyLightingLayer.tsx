import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';
import LottiePlayer from './StudyTogetherLottiePlayer';
import type { LightSource, RoomLighting } from '../home/lighting';
import { localDayPhase } from '../home/atmosphere';
import type { StudyWindowScene } from '../scenes/studyWindowScenes';
import { boxStyle } from '../furniture/catalog';
import { IGLOO_FIRE, IGLOO_FLOOR_CONTACTS, IGLOO_FURNITURE } from '../study-together/iglooLayout';

const fireplaceArt = require('../../assets/environments/study-together/fireplace.png');
const activation = require('../../assets/animations/study-together-rooms/console-ignition.json');
const SIZE = { width: 1024, height: 1536 };
const sourceNames: Record<LightSource, string> = { lamp: 'Study lamp', lantern: 'Wall lantern', fairy: 'Fairy lights', fireplace: 'Fireplace' };

export function StudyLightingLayer({ lighting, scene = 'blizzard', interactive = false, visual = true, onToggle, reducedMotion = false }: {
  lighting: RoomLighting; scene?: StudyWindowScene; interactive?: boolean; visual?: boolean; onToggle?: (source: LightSource) => void; reducedMotion?: boolean;
}) {
  const flicker = useRef(new Animated.Value(.84)).current;
  const stringGlow = useRef(new Animated.Value(.62)).current;
  const pulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pulse, setPulse] = React.useState<{ source: LightSource; key: number } | null>(null);
  useEffect(() => {
    if (!visual || reducedMotion) { flicker.setValue(.84); stringGlow.setValue(.62); return; }
    const fire = Animated.loop(Animated.sequence([
      Animated.timing(flicker, { toValue: .98, duration: 470, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(flicker, { toValue: .78, duration: 610, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(flicker, { toValue: .9, duration: 380, useNativeDriver: true }),
    ]));
    const twinkle = Animated.loop(Animated.sequence([
      Animated.timing(stringGlow, { toValue: .95, duration: 1900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(stringGlow, { toValue: .55, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    if (lighting.sources.fireplace) fire.start();
    if (lighting.sources.fairy) twinkle.start();
    return () => { fire.stop(); twinkle.stop(); };
  }, [flicker, stringGlow, lighting.sources.fireplace, lighting.sources.fairy, reducedMotion, visual]);
  useEffect(() => () => { if (pulseTimer.current) clearTimeout(pulseTimer.current); }, []);

  const phase = localDayPhase(new Date().getHours());
  const preset = lighting.preset;
  const colors = preset === 'magical' ? { wash: '#5944AA', tint: .17, glow: '#A78AFF' }
    : preset === 'midnight' ? { wash: '#1A2C62', tint: .31, glow: '#FFCF83' }
      : preset === 'fireplace' ? { wash: '#302342', tint: .21, glow: '#FF8738' }
        : preset === 'cozy' ? { wash: '#FFBE73', tint: .15, glow: '#FFD186' }
          : preset === 'daylight' ? { wash: '#FFF2D1', tint: .1, glow: '#FFF1CC' }
            : phase === 'morning' ? { wash: '#FFF0D5', tint: .09, glow: '#FFD997' }
              : phase === 'afternoon' ? { wash: '#F6FBFF', tint: .045, glow: '#FFE6B3' }
                : phase === 'evening' ? { wash: '#FFB66B', tint: .13, glow: '#FFD08B' }
                  : { wash: '#273C68', tint: .18, glow: '#FFD28B' };
  const outdoor = scene === 'aquarium' ? '#5BB4C9' : scene === 'moon' || scene === 'blizzard' ? '#9CB9FF' : scene === 'spaceship' ? '#9B7FEB' : scene === 'beach' ? '#FFC074' : '#B69BCB';
  const b = lighting.brightness;
  const shade = Math.max(0, 1 - b) * .42 + (preset === 'midnight' ? .1 : 0);
  const pools: [LightSource, number, number, number, string][] = [
    ['lantern', 512, 302, 330, '#FFCA73'], ['lamp', 842, 650, 255, '#FFE29D'], ['fireplace', IGLOO_FIRE.x, IGLOO_FIRE.y, 310, '#FF8738'],
  ];
  const hit = (source: LightSource, x: number, y: number, w: number, h: number, label: string) => interactive && <React.Fragment key={source}>
    <Pressable accessibilityRole="switch" accessibilityLabel={`Toggle ${label}`} accessibilityState={{ checked: lighting.sources[source] }} onPress={() => { setPulse(value => ({ source, key: (value?.key ?? 0) + 1 })); if (pulseTimer.current) clearTimeout(pulseTimer.current); pulseTimer.current = setTimeout(() => setPulse(null), 1050); onToggle?.(source); }} style={[styles.hit, { left: `${x / SIZE.width * 100}%`, top: `${y / SIZE.height * 100}%`, width: `${w / SIZE.width * 100}%`, height: `${h / SIZE.height * 100}%` }]} />
    {pulse?.source === source && !reducedMotion && <View pointerEvents="none" style={[styles.hitPulse, { left: `${(x + w / 2 - 32) / SIZE.width * 100}%`, top: `${(y + h / 2 - 32) / SIZE.height * 100}%` }]}><LottiePlayer key={pulse.key} source={activation} autoPlay style={StyleSheet.absoluteFill} /></View>}
  </React.Fragment>;
  return <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
    {visual && <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 1024 1536" preserveAspectRatio="none"><Defs>
        <RadialGradient id="study-light-pool"><Stop offset="0" stopColor="#FFF1C5" stopOpacity={.27 * b}/><Stop offset=".53" stopColor="#FFD08A" stopOpacity={.11 * b}/><Stop offset="1" stopColor="#FFD08A" stopOpacity="0"/></RadialGradient>
        <RadialGradient id="study-fire-pool"><Stop offset="0" stopColor="#FF8A36" stopOpacity={.34 * b}/><Stop offset=".5" stopColor="#FFA24B" stopOpacity={.13 * b}/><Stop offset="1" stopColor="#FFA24B" stopOpacity="0"/></RadialGradient>
        <RadialGradient id="study-window-pool"><Stop offset="0" stopColor={outdoor} stopOpacity={.13 * b}/><Stop offset="1" stopColor={outdoor} stopOpacity="0"/></RadialGradient>
        <RadialGradient id="study-floor-contact"><Stop offset="0" stopColor="#34203D" stopOpacity=".32"/><Stop offset=".56" stopColor="#3B2947" stopOpacity=".17"/><Stop offset="1" stopColor="#3B2947" stopOpacity="0"/></RadialGradient>
        <LinearGradient id="study-room-shade" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#101936" stopOpacity={shade * .68}/><Stop offset="1" stopColor="#101936" stopOpacity={shade * .2}/></LinearGradient>
      </Defs>
        <Path d="M0 0H1024V1536H0Z" fill={colors.wash} opacity={colors.tint}/>
        <Path d="M0 0H1024V1536H0Z" fill={`url(#study-room-shade)`}/>
        <Ellipse cx="512" cy="510" rx="430" ry="410" fill="url(#study-window-pool)"/>
        {pools.map(([source, x, y, r, color]) => lighting.sources[source] && <Circle key={source} cx={x} cy={y} r={r} fill={source === 'fireplace' ? 'url(#study-fire-pool)' : 'url(#study-light-pool)'} />)}
        {IGLOO_FLOOR_CONTACTS.map(([x, y, rx, ry]) => <Ellipse key={x} cx={x} cy={y} rx={rx} ry={ry} fill="url(#study-floor-contact)" />)}
        <G opacity={lighting.sources.fairy ? .78 * b : .3}><Path d="M90 438 Q280 490 510 425 Q750 360 935 435" fill="none" stroke={lighting.sources.fairy ? '#D6BAFF' : '#6E607C'} strokeWidth="5" opacity=".62"/>{Array.from({ length: 14 }, (_, i) => { const x = 110 + i * 61, y = 448 + Math.sin(i * .56) * 25; return <G key={i}><Circle cx={x} cy={y} r={lighting.sources.fairy ? 14 : 9} fill={lighting.sources.fairy ? '#BDA7FF' : '#5E6178'} opacity={lighting.sources.fairy ? .19 : .16}/><Circle cx={x} cy={y} r={lighting.sources.fairy ? 5 : 3} fill={lighting.sources.fairy ? (i % 3 === 0 ? '#FFEDB0' : '#C8B9FF') : '#77788C'} opacity={lighting.sources.fairy ? .9 : .6}/></G>; })}</G>
        <G><Path d="M823 629l-43 15 8 8h74l7-8-42-15v-42h-4z" fill="#7A4931"/><Path d="M788 585q37-54 75 0z" fill={lighting.sources.lamp ? '#F1C86F' : '#866B54'} stroke="#E2B66E" strokeWidth="5"/><Path d="M812 578q13-16 28 0" fill="none" stroke={lighting.sources.lamp ? '#FFF4CC' : '#544A4C'} strokeWidth="6"/></G>
        {!lighting.sources.lantern && <Circle cx="512" cy="300" r="78" fill="#35465E" opacity={preset === 'midnight' ? .25 : .12}/>}
        {lighting.sources.lantern && <G opacity={.85}><Circle cx="512" cy="294" r="38" fill="#FFD77A" opacity=".18"/><Path d="M497 301q15-24 30 0v27h-30z" fill="#FFD178" opacity=".2"/></G>}
      </Svg>
    </View>}
    {visual && <Image source={fireplaceArt} resizeMode="stretch" style={[styles.fireplace, boxStyle(IGLOO_FURNITURE.fireplace)]} />}
    {visual && lighting.sources.fireplace && <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: flicker }]}>
      <Svg width="100%" height="100%" viewBox="0 0 1024 1536" preserveAspectRatio="none">
        <G transform={`translate(${IGLOO_FIRE.x}, ${IGLOO_FIRE.y})`}>
          <Ellipse cy="-14" rx="50" ry="32" fill="#FFAF4C" opacity=".18" />
          <Path d="M-24 0q-10-17 2-31 1 10 8 13 2-20 14-31 3 19 12 27 7 6 11-9 13 18 4 31z" fill="#FFAA50" />
          <Path d="M-12 0q-5-11 4-20 1 7 6 8 2-10 9-15 0 12 8 18 3 4 1 9z" fill="#FFE5A0" />
        </G>
      </Svg>
    </Animated.View>}
    {visual && lighting.sources.fairy && <Animated.View pointerEvents="none" style={[styles.fairyTwinkle, { opacity: stringGlow }]} />}
    {interactive && <>
      {hit('lantern', 450, 198, 125, 170, sourceNames.lantern)}
      {hit('lamp', 760, 560, 145, 140, sourceNames.lamp)}
      {hit('fairy', 62, 400, 900, 100, sourceNames.fairy)}
      {hit('fireplace', IGLOO_FURNITURE.fireplaceTarget.x * 10.24, IGLOO_FURNITURE.fireplaceTarget.y * 15.36,
        IGLOO_FURNITURE.fireplaceTarget.width * 10.24, IGLOO_FURNITURE.fireplaceTarget.height * 15.36, sourceNames.fireplace)}
    </>}
  </View>;
}

const styles = StyleSheet.create({
  hit: { position: 'absolute', minWidth: 44, minHeight: 44 },
  hitPulse: { position: 'absolute', width: '6.25%', aspectRatio: 1 },
  fireplace: { position: 'absolute' },
  fairyTwinkle: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(183,159,255,.025)' },
});
