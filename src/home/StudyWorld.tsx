import React, { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { cancelAnimation, Easing, FadeIn, useAnimatedProps, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, ClipPath, Defs, G, Path } from 'react-native-svg';
import { usePipReactions } from '../character/reactions/PipReactionsProvider';
import { SeatedPipReactions } from '../character/reactions/SeatedPipReactions';
import { boxStyle, decorOffset } from '../furniture/catalog';
import { GiftDecorAnimation } from '../gifts/MysteryGifts';
import { HOME_ART } from './art';
import { PANORAMA_FIXTURES, PANORAMA_FOOTPRINTS } from './panoramaArt';
import { fittedSprite } from './panorama';
import { RoomGuideHighlights } from './RoomGuide';
import type { HomeSlot } from './slots';
import type { HomeLayout, HomeState } from './state';
import { furniturePositions, worldBox, worlds, type WorldId } from './studyWorlds';

const MovingLandscape = Animated.createAnimatedComponent(G);
const enter = FadeIn.duration(390).easing(Easing.out(Easing.cubic));

export function StudyWorld({id, layout, home, moving, visible, inspectDesk, toggleLamp, onWardrobe, decorate, interactive, discover, showObjects, onDiscover}: {
  id: WorldId; layout: HomeLayout; home: HomeState; moving: boolean; visible: boolean;
  inspectDesk: () => void; toggleLamp: () => void; onWardrobe: () => void;
  decorate: (slot: HomeSlot) => void; interactive: boolean; discover: boolean; showObjects: boolean; onDiscover: () => void;
}) {
  const world = worlds[id];
  const {requestRestReaction} = usePipReactions();
  const [effect, setEffect] = useState(true);
  const [hintExpired, setHintExpired] = useState(false);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!discover || !visible || !interactive || hintExpired) return;
    const timeout = setTimeout(() => setHintExpired(true), 7000);
    return () => clearTimeout(timeout);
  }, [discover, visible, interactive, hintExpired]);
  const positions = furniturePositions(world);
  const [x,y,w,h] = world.desk;
  // Put Pip on the near-left side of the desk, with the laptop above the tabletop edge.
  const seatX = x - w * .20;
  const pipY = y - h * .17;
  const layers = (Object.entries(positions) as [HomeSlot, Parameters<typeof worldBox>[0]][]).filter(([slot]) => layout[slot] && HOME_ART[layout[slot]!] && !(slot === 'window' && layout[slot] === 'window-round'));
  const lamp = layout.lighting === 'lamp-lantern' ? 'lantern' : 'lamp';
  const pipBounds = worldBox([seatX + w*.17, pipY - h*.55, w*.51, h*.56]);
  const wardrobeBounds = id === 'bedroom' ? worldBox([76,35,20,26]) : undefined;
  const effectsBounds = worldBox([68,8,25,29]);
  const activate = (action: () => void) => () => { onDiscover(); action(); };
  const highlights = interactive && visible && (showObjects || (discover && !hintExpired)) ? [
    ...layers.flatMap(([slot, position]) => {
      const label = slot === 'desk' ? 'Study timer' : slot === 'lighting' ? 'Reading light' : undefined;
      return label || showObjects ? [{
        bounds: spriteBounds(position, decorOffset(home.decorPlacement, slot) / 12), label, labelInside: slot === 'desk',
      }] : [];
    }),
    { bounds: pipBounds, label: 'Say hello' },
    ...(wardrobeBounds ? [{ bounds: wardrobeBounds, label: 'Wardrobe' }] : []),
    ...(showObjects ? [{ bounds: effectsBounds, label: 'Room effects' }] : []),
  ] : [];
  return <Animated.View testID={`study-world-${id}`} entering={moving ? enter : undefined} style={StyleSheet.absoluteFill}>
    <Image source={world.art} style={[StyleSheet.absoluteFill, styles.fill]} resizeMode="stretch" fadeDuration={0} />
    {(effect || id === 'library') && <WorldMotion id={id} moving={moving && effect} />}
    {id === 'bedroom' && !layout.plant && <WorldSprite source={PANORAMA_FIXTURES.evergreen} item="evergreen" position={[45,60,11,20]} />}
    {id === 'ocean' && !layout.plant && <WorldSprite source={PANORAMA_FIXTURES.evergreen} item="evergreen" position={[5,72,13,20]} />}
    <WorldSprite source={PANORAMA_FIXTURES.chair} item="chair" position={[seatX + w*.13,y - h*.23,w*.52,h*1.10]} />
    {world.spare && <>
      <WorldSprite source={PANORAMA_FIXTURES.chair} item="chair" position={[world.spare[0] + 3, world.spare[1]-5, world.spare[2]*.65, world.spare[3]]} />
      {layout.desk && <WorldSprite source={HOME_ART[layout.desk]} item={layout.desk} position={world.spare} />}
    </>}
    {layers.filter(([slot]) => slot !== 'desk' && slot !== 'lighting' && slot !== 'books' && slot !== 'tabletop').map(([slot, position]) => {
      const item = layout[slot]!;
      return <WorldSprite key={slot} source={HOME_ART[item]} item={item} position={position} offset={decorOffset(home.decorPlacement, slot) / 12}
        onPress={interactive ? activate(() => decorate(slot)) : undefined} label={`Customize ${slot}`}>
        {item.startsWith('gift-') && <GiftDecorAnimation id={item} active={moving} />}
      </WorldSprite>;
    })}
    {visible && <View pointerEvents="none" style={[styles.absolute,boxStyle(worldBox([seatX + w*.04,pipY-h*.88,w*.79,h*1.55]))]}>
      <SeatedPipReactions enabled={visible} equipped={home.wardrobe.equipped} alwaysStudying allowAmbientCoffee={false} />
    </View>}
    {layers.filter(([slot]) => ['desk','lighting','books','tabletop'].includes(slot)).map(([slot, position]) => {
      const item = layout[slot]!;
      return <WorldSprite key={slot} source={HOME_ART[item]} item={item} position={position} offset={decorOffset(home.decorPlacement,slot)/12}
        onPress={interactive ? activate(slot === 'desk' ? inspectDesk : slot === 'lighting' ? toggleLamp : () => decorate(slot)) : undefined}
        label={slot === 'desk' ? 'Start a focus session' : slot === 'lighting' ? `Turn reading light ${home.lighting.sources[lamp] ? 'off' : 'on'}` : `Customize ${slot}`} />;
    })}
    {interactive && <Pressable accessibilityRole="button" accessibilityLabel="Say hello to Pip"
      onPress={activate(() => requestRestReaction('wave'))} style={[styles.absolute,boxStyle(pipBounds)]} />}
    {home.lighting.sources[lamp] && <View pointerEvents="none" style={[styles.light, boxStyle(worldBox([x+w*.73,y-h*.19,w*.17,h*.27]))]} />}
    {interactive && <Pressable accessibilityRole="switch" accessibilityLabel="Room effects" accessibilityState={{checked:effect}}
      onPress={activate(() => setEffect(value => !value))} style={[styles.absolute,boxStyle(effectsBounds)]} />}
    {interactive && wardrobeBounds && <Pressable accessibilityRole="button" accessibilityLabel="Open Pip’s wardrobe"
      onPress={activate(onWardrobe)} style={[styles.absolute,boxStyle(wardrobeBounds)]} />}
    <RoomGuideHighlights highlights={highlights} reduced={reduced} />
  </Animated.View>;
}

function spriteBounds(position: Parameters<typeof worldBox>[0], offset: number) {
  const box = worldBox(position);
  return { ...box, x: box.x + offset };
}

function WorldSprite({source,item,position,offset=0,onPress,label,children}: {
  source: number; item: string; position: Parameters<typeof worldBox>[0]; offset?: number;
  onPress?: () => void; label?: string; children?: React.ReactNode;
}) {
  const box = spriteBounds(position, offset);
  const footprint = PANORAMA_FOOTPRINTS[item];
  const imageBox = footprint ? fittedSprite(box, footprint) : box;
  return <>
    <View pointerEvents="none" style={[styles.absolute, boxStyle(imageBox)]}>
      <Image source={source} style={styles.fill} resizeMode={footprint ? 'stretch' : 'contain'} fadeDuration={0} />
      {children}
    </View>
    {onPress && <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={[styles.absolute,boxStyle(box)]} />}
  </>;
}

const timings = {bedroom:5600, library:1500, ocean:5400, treehouse:3600, observatory:2800, train:2400};
function WorldMotion({id,moving}: {id: WorldId; moving: boolean}) {
  const phase = useSharedValue(.45);
  useEffect(() => {
    if (moving) phase.value = withRepeat(withTiming(1,{duration:timings[id],easing:Easing.inOut(Easing.sin)}),-1,true);
    else phase.value = .45;
    return () => cancelAnimation(phase);
  },[id,moving,phase]);
  const shimmer = useAnimatedStyle(() => ({opacity:.15 + phase.value*.63}));
  const drift = useAnimatedStyle(() => ({transform:[{translateX:(phase.value-.5)*(13)}],opacity:.3+phase.value*.5}));
  const trainScenery = useAnimatedProps(() => ({
    x: 4 - phase.value * 8,
    opacity: .22 + phase.value * .45,
  }));
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <Animated.View style={[StyleSheet.absoluteFill, shimmer]}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100">
        {id === 'bedroom' && <Path d="M35 23H54L77 86H53Z" fill="#ffe5a1" opacity=".21" />}
        {id === 'library' && <Path d="M88 68q-2-5 2-10q0 3 2 5q3-4 4-6q3 7 1 11z" fill="#ffbb57" opacity=".63" />}
        {id === 'ocean' && <Path d="M9 49h10m25 2h12m13-5h16m-27 9h16m11-4h8M24 54h7" stroke="#efffff" strokeWidth=".34" strokeLinecap="round" />}
        {id === 'treehouse' && [[21,51],[34,44],[58,54],[63,30],[76,46],[28,34]].map(([x,y])=><Circle key={x} cx={x} cy={y} r=".51" fill="#ffe7a4" />)}
        {id === 'observatory' && [[20,32],[35,23],[45,35],[52,18],[65,28],[75,40],[44,42]].map(([x,y])=><Path key={x} d={`M${x-1} ${y}h2m-1-1v2`} stroke="#fff4ca" strokeWidth=".25" />)}
      </Svg>
    </Animated.View>
    {['ocean','treehouse'].includes(id) && <Animated.View style={[StyleSheet.absoluteFill,drift]}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100">
        {id === 'ocean' && <><Path d="M45 20q2-2 4 0q2-2 4 0m7 5q2-2 4 0q2-2 4 0" fill="none" stroke="#244961" strokeWidth=".34" /><Path d="M60 17q0-1 3-1q1-2 4-1q1-3 6-2q2 1 3 3q2-1 4 1q-7 2-20 0z" fill="#fff9e8" opacity=".45" /></>}
        {id === 'treehouse' && <Path d="M22 42q4-4 5 0q-3 4-5 0m37 5q3-2 4 1q-3 2-4-1m12-5q-4-4-4 1q2 1 4-1q3-4 4 0q-1 2-4 0" fill="#e8bb62" />}

      </Svg>
    </Animated.View>}
    {id === 'train' && <View style={StyleSheet.absoluteFill}>
      <View style={StyleSheet.absoluteFill}>
        <Svg width="100%" height="100%" viewBox="0 0 100 100">
          <Defs><ClipPath id="train-window-motion">
            <Path d="M0 17L9 23V44L0 43ZM13 27L21 31V44H13ZM79 31L86 27V44H79ZM91 23L100 17V43L91 44Z" />
          </ClipPath></Defs>
          <G clipPath="url(#train-window-motion)"><MovingLandscape animatedProps={trainScenery}>
            <Path d="M-10 39L1 26l8 8l4-5l10 9h49l8-7l4 4l11-9l11 12v11H-10Z" fill="#c0d8df" opacity=".42" />
            <Path d="M-10 45l10-8l3 3l6-9l6 10l4-5l7 9h50l7-8l3 4l7-9l7 8l8-2v10H-10Z" fill="#638aa3" opacity=".6" />
          </MovingLandscape></G>
        </Svg>
      </View>
    </View>}
  </View>;
}

const styles = StyleSheet.create({
  absolute: {position:'absolute'},
  fill: {width:'100%',height:'100%'},
  light: {position:'absolute',borderRadius:100,backgroundColor:'#ffcc6e36'},
});
