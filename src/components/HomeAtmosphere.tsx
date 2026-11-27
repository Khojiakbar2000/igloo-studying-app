import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Mask, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { boxStyle, type Bounds } from '../furniture/catalog';
import { DAY_LIGHT, glassAnchor, type DayPhase } from '../home/atmosphere';
import { snowAnimation, gustAnimation, STEAM_ANIMATION } from '../home/ambientLottie';
import { PANORAMA, PANORAMA_PROPS, PANORAMA_SLOTS } from '../home/panorama';
import { HOME_CANVAS } from '../home/slots';
import type { HomeLayout } from '../home/state';
import { HomeLottie } from './HomeLottie';
import { HearthFlames } from './HearthFlames';

type Glass = ReturnType<typeof glassAnchor>;
type Point = { x: number; y: number };
type AtmosphereLayout = { width: number; height: number; glass: Glass; lamp: Point; skylight?: Bounds; tea: Bounds };

function geometry(original: boolean, panoramic: boolean, layout: HomeLayout): AtmosphereLayout {
  if (panoramic) {
    const { window, lighting, ceiling, tabletop } = PANORAMA_SLOTS;
    const arch = layout.window === 'window-panorama';
    const glassWidth = arch ? window.width * .86 : window.height * .7;
    const glassHeight = arch ? window.width * .50 : glassWidth;
    const glass = {
      x: window.x + (window.width - glassWidth) / 2, y: window.y + window.height - (arch ? 156 : 192),
      width: glassWidth, height: glassHeight, shape: arch ? 'arch' as const : 'round' as const,
    };
    return {
      ...PANORAMA, glass, lamp: { x: lighting.x + lighting.width / 2, y: lighting.y + 52 },
      skylight: layout.ceiling === 'skylight' ? ceiling : undefined,
      tea: { x: tabletop.x + 14, y: tabletop.y - 28, width: 44, height: 55 },
    };
  }
  return {
    ...HOME_CANVAS, glass: glassAnchor(original, layout.window),
    lamp: { x: original ? 760 : layout.lighting === 'lamp-lantern' ? 937 : 965, y: original ? 650 : layout.lighting === 'lamp-lantern' ? 725 : 665 },
    skylight: !original && layout.ceiling === 'skylight' ? { x: 367, y: 109, width: 290, height: 152 } : undefined,
    tea: { x: 878, y: 845, width: 49, height: 74 },
  };
}
function GlassMask({ id, shape }: { id: string; shape: Glass['shape'] }) {
  return <Mask id={id} x="0" y="0" width="100" height="100" maskUnits="userSpaceOnUse">
    <Path fill="white" d={shape === 'round' ? 'M50 1 A49 49 0 1 1 49.99 1Z' : 'M2 98V43C2 19 24 2 50 2S98 19 98 43V98Z'} />
    {(shape === 'round' ? [47] : [31, 65]).map(x => <Rect key={x} x={x} y={0} width={5} height={100} fill="black" />)}
    {shape === 'round' && <Rect x={0} y={48} width={100} height={6} fill="black" />}
  </Mask>;
}

function PhaseLight({ phase, selected, motion, scene, lampOn, fireplace }: {
  phase: DayPhase; selected: DayPhase; motion: boolean; scene: AtmosphereLayout; lampOn: boolean; fireplace: boolean;
}) {
  const opacity = useRef(new Animated.Value(phase === selected ? 1 : 0)).current;
  useEffect(() => {
    const fade = Animated.timing(opacity, { toValue: phase === selected ? 1 : 0, duration: motion ? 1800 : 0, easing: Easing.inOut(Easing.sin), useNativeDriver: true });
    fade.start();
    return () => fade.stop();
  }, [phase, selected, motion, opacity]);
  const light = DAY_LIGHT[phase];
  const id = 'home-' + phase;
  const { glass, lamp, skylight, width, height } = scene;
  return <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>
    <Svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <Defs>
        <LinearGradient id={id + '-ceiling'} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#101E4B" stopOpacity={light.shade} /><Stop offset=".85" stopColor="#101E4B" stopOpacity="0" /></LinearGradient>
        <LinearGradient id={id + '-sky'} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={light.sky} stopOpacity={light.skyOpacity} /><Stop offset="1" stopColor={light.sky} stopOpacity={light.skyOpacity * .25} /></LinearGradient>
        <RadialGradient id={id + '-pool'}><Stop offset="0" stopColor="#FFD493" stopOpacity={light.glow} /><Stop offset="1" stopColor="#FFD493" stopOpacity="0" /></RadialGradient>
        <RadialGradient id={id + '-hearth'}><Stop offset="0" stopColor="#FFAC61" stopOpacity=".35" /><Stop offset="1" stopColor="#FFAC61" stopOpacity="0" /></RadialGradient>
        <LinearGradient id={id + '-sun'} x1="0" y1="0" x2=".6" y2="1"><Stop offset="0" stopColor="#FFF6D8" stopOpacity={phase === 'morning' ? .13 : phase === 'afternoon' ? .07 : 0} /><Stop offset="1" stopColor="#FFF6D8" stopOpacity="0" /></LinearGradient>
        <GlassMask id={id + '-glass'} shape={glass.shape} />
      </Defs>
      <Rect width={width} height={height} fill={light.wash} opacity={light.opacity} />
      <Rect width={width} height={height} fill={`url(#${id}-ceiling)`} />
      <Path d={`M${glass.x} ${glass.y + glass.height * .5}L${glass.x + glass.width} ${glass.y + glass.height * .5}L${width * .98} ${height * .91}L${width * .06} ${height * .86}Z`} fill={`url(#${id}-sun)`} />
      {lampOn && <Circle cx={lamp.x} cy={lamp.y} r="265" fill={`url(#${id}-pool)`} />}
      {fireplace && <Ellipse cx={PANORAMA_PROPS.fireplace.x + PANORAMA_PROPS.fireplace.width / 2} cy={PANORAMA_PROPS.fireplace.y + 118} rx="212" ry="180" fill={`url(#${id}-hearth)`} />}
      <G transform={`translate(${glass.x} ${glass.y}) scale(${glass.width / 100} ${glass.height / 100})`} mask={`url(#${id}-glass)`}>
        <Rect width="100" height="100" fill={`url(#${id}-sky)`} />
      </G>
      {skylight && <Ellipse cx={skylight.x + skylight.width / 2} cy={skylight.y + skylight.height / 2} rx={skylight.width / 2} ry={skylight.height / 2} fill={`url(#${id}-sky)`} />}
    </Svg>
  </Animated.View>;
}

export function HomeAtmosphere({ lampOn = true, phase, layout, original, panoramic = false, fireplace = false, motion, snowfall, gusts }: {
  lampOn?: boolean; phase: DayPhase; layout: HomeLayout; original: boolean; panoramic?: boolean; fireplace?: boolean; motion: boolean; snowfall: boolean; gusts: boolean;
}) {
  const scene = geometry(original, panoramic, layout);
  const { glass, lamp, skylight, width, height } = scene;
  const position = (box: Bounds) => boxStyle({ x: box.x / width * 100, y: box.y / height * 100, width: box.width / width * 100, height: box.height / height * 100 });
  const snow = useMemo(() => snowAnimation(glass.shape), [glass.shape]);
  const wind = useMemo(() => gustAnimation(glass.shape), [glass.shape]);
  const flicker = useRef(new Animated.Value(.7)).current;
  useEffect(() => {
    if (!motion) { flicker.setValue(.7); return; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(flicker, { toValue: .88, duration: 1370, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      Animated.timing(flicker, { toValue: .61, duration: 1840, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      Animated.timing(flicker, { toValue: .7, duration: 1270, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [motion, flicker]);
  const hasLamp = lampOn && Boolean(layout.lighting || original);
  return <View pointerEvents="none" accessible={false} style={[StyleSheet.absoluteFill, panoramic && { zIndex: 7 }]}>
    {(['morning', 'afternoon', 'evening', 'night'] as const).map(current =>
      <PhaseLight key={current} phase={current} selected={phase} motion={motion} scene={scene} lampOn={hasLamp} fireplace={panoramic && fireplace} />)}
    {panoramic && fireplace && <Animated.View testID="my-igloo-hearth-flames" style={[StyleSheet.absoluteFill, { opacity: flicker }]}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
        <HearthFlames x={PANORAMA_PROPS.fireplace.x + PANORAMA_PROPS.fireplace.width / 2} y={PANORAMA_PROPS.fireplace.y + PANORAMA_PROPS.fireplace.height - 16} scale={.65} />
      </Svg>
    </Animated.View>}
    <View style={{ position: 'absolute', ...position(glass) }}>
      <HomeLottie data={snow} active={motion && snowfall} />
      <HomeLottie data={wind} active={motion && snowfall && gusts} />
    </View>
    {hasLamp && <Animated.View style={[StyleSheet.absoluteFill, { opacity: flicker }]}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
        <Defs><RadialGradient id="home-lantern-flicker"><Stop offset="0" stopColor="#FFF2C3" stopOpacity={phase === 'evening' || phase === 'night' ? .11 : .045} /><Stop offset="1" stopColor="#FFD395" stopOpacity="0" /></RadialGradient></Defs>
        <Circle cx={lamp.x} cy={lamp.y} r="125" fill="url(#home-lantern-flicker)" />
      </Svg>
    </Animated.View>}
    {!original && layout.tabletop === 'decor-tea' && <View style={{ position: 'absolute', ...position(scene.tea) }}>
      <HomeLottie data={STEAM_ANIMATION} active={motion} />
    </View>}
    {skylight && phase === 'night' && <Animated.View style={[StyleSheet.absoluteFill, { opacity: flicker }]}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
        {[[.37, .4], [.56, .13], [.61, .64], [.20, .50], [.84, .45]].map(([u, v], i) => {
          const x = skylight.x + skylight.width * u;
          const y = skylight.y + skylight.height * v;
          return <G key={i}><Circle cx={x} cy={y} r={i % 2 ? 1.7 : 2.3} fill="#FFF5D5" /><Path d={`M${x - 5} ${y}h10M${x} ${y - 5}v10`} stroke="#FFF5D5" strokeWidth=".7" opacity=".6" /></G>;
        })}
      </Svg>
    </Animated.View>}
  </View>;
}
