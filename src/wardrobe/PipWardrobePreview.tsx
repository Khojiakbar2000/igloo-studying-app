import React, { useEffect, useMemo, useState } from 'react';
import { Image, type ImageSourcePropType, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming, type SharedValue } from 'react-native-reanimated';
import { WinterLottie } from '../home/winter/WinterLottie';
import type { CharacterAction, CharacterSkinId, EquipmentSlot, PipPose } from './catalog';
import { wardrobeEquipment, type Attachment } from './catalog';
import type { WardrobeLayout } from '../home/state';
import { PipAccessoryLayer } from '../components/PipAccessoryLayer';

const ACTIONS: Record<CharacterAction, any> = {
  idle: require('../../assets/wardrobe/lottie/idle.json'),
  wave: require('../../assets/wardrobe/lottie/wave.json'),
  shiver: require('../../assets/wardrobe/lottie/shiver.json'),
  celebrate: require('../../assets/wardrobe/lottie/celebrate.json'),
};
const SKIN_ACTIONS: Partial<Record<CharacterSkinId, Record<CharacterAction, any>>> = {
  'knight-storybook': {
    idle: require('../../assets/wardrobe/lottie/knight-storybook/idle.json'),
    wave: require('../../assets/wardrobe/lottie/knight-storybook/wave.json'),
    shiver: require('../../assets/wardrobe/lottie/knight-storybook/shiver.json'),
    celebrate: require('../../assets/wardrobe/lottie/knight-storybook/celebrate.json'),
  },
};

type Key = { t: number; s: number[]; o?: { x?: number | number[]; y?: number | number[] }; i?: { x?: number | number[]; y?: number | number[] } };
type TrackPoint = { t: number; value: number; o?: Key['o']; i?: Key['i'] };
type TransformLayer = { nm: string; parent?: number; ind: number; refId?: string; ks: any };
type AnimationData = { w: number; h: number; fr: number; ip: number; op: number; layers: TransformLayer[]; assets: { id: string; w: number; h: number }[] };
const CONTROLLER_LAYER = 'Pip reusable motion controller';
const REST = { x: 360, y: 610 };

function staticVec(value: any, fallback: number[]) {
  if (Array.isArray(value?.k) && typeof value.k[0] === 'number') return value.k;
  const first = Array.isArray(value?.k) ? value.k[0] : undefined;
  return Array.isArray(first?.s) ? first.s : fallback;
}
function trackKeys(value: any): Key[] {
  if (!value?.a || !Array.isArray(value.k) || !value.k.length || typeof value.k[0] !== 'object') return [];
  return value.k.filter((key: any) => Number.isFinite(key.t) && Array.isArray(key.s)).map((key: any) => ({ t: key.t, s: key.s, o: key.o, i: key.i }));
}
function frameKeys(layer: TransformLayer | undefined, property: 'p' | 'r' | 's', dimension: 0 | 1 = 0): TrackPoint[] {
  if (!layer) return [];
  return trackKeys(layer.ks[property]).map((key) => ({ t: key.t, value: Number(key.s[dimension] ?? 0), o: key.o, i: key.i }));
}
function controlPoint(value: number | number[] | undefined, fallback: number) {
  return Array.isArray(value) ? Number(value[0] ?? fallback) : Number(value ?? fallback);
}
function assignTrack(shared: SharedValue<number>, values: TrackPoint[], fps: number, frames: number, fallback = 0) {
  if (!values.length) {
    shared.value = fallback;
    return;
  }
  const ordered = [...values].sort((a, b) => a.t - b.t);
  shared.value = ordered[0].value;
  const steps: any[] = [];
  let at = ordered[0].t;
  for (let index = 1; index < ordered.length; index += 1) {
    const point = ordered[index];
    const previous = ordered[index - 1];
    const duration = Math.max(1, ((point.t - at) / fps) * 1000);
    const easing = previous.o && point.i
      ? Easing.bezier(
        controlPoint(previous.o.x, 0),
        controlPoint(previous.o.y, 0),
        controlPoint(point.i.x, 1),
        controlPoint(point.i.y, 1),
      )
      : Easing.linear;
    steps.push(withTiming(point.value, { duration, easing }));
    at = point.t;
  }
  const tail = Math.max(0, ((frames - at) / fps) * 1000);
  if (tail > 1) steps.push(withDelay(tail, withTiming(ordered[ordered.length - 1].value, { duration: 1 })));
  if (steps.length) shared.value = withRepeat(withSequence(...steps), -1, false);
}

export function PipWardrobePreview({ equipped, action, onReady, pose = 'standing', conceptImage, style, motion = true, headphones = false, onFinish }: {
  equipped: WardrobeLayout; action: CharacterAction; onReady?: () => void; pose?: PipPose;
  conceptImage?: ImageSourcePropType; style?: StyleProp<ViewStyle>; motion?: boolean; headphones?: boolean; onFinish?: () => void;
}) {
  const [readyTick, setReadyTick] = useState(0);
  const skinAction = pose === 'standing' && equipped.skin ? SKIN_ACTIONS[equipped.skin]?.[action] : undefined;
  const data = (skinAction ?? ACTIONS[action]) as AnimationData;
  const showConcept = Boolean(equipped.skin && !skinAction && conceptImage);
  const geometry = useMemo(() => {
    const root = data.layers.find((layer) => layer.nm === CONTROLLER_LAYER);
    const rootPos = staticVec(root?.ks.p, [REST.x, REST.y]);
    const byFrame: Record<string, any> = {};
    for (const name of ['body', 'leftArm', 'rightArm', 'leftFoot', 'rightFoot']) {
      const layer = data.layers.find((candidate) => candidate.nm === name);
      if (!layer) continue;
      const asset = data.assets.find((candidate) => candidate.id === layer.refId);
      if (!asset) continue;
      const local = staticVec(layer.ks.p, [0, 0]);
      const anchor = staticVec(layer.ks.a, [asset.w / 2, asset.h / 2]);
      byFrame[name] = {
        layer,
        width: asset.w,
        height: asset.h,
        pivotX: rootPos[0] + local[0],
        pivotY: rootPos[1] + local[1],
        anchorX: anchor[0],
        anchorY: anchor[1],
        topX: rootPos[0] + local[0] - anchor[0],
        topY: rootPos[1] + local[1] - anchor[1],
      };
    }
    return { root, rootPos, byFrame };
  }, [data]);

  const stageScaleX = useSharedValue(1), stageScaleY = useSharedValue(1);
  const rootX = useSharedValue(0), rootY = useSharedValue(0), rootRotation = useSharedValue(0);
  const rootScaleX = useSharedValue(1), rootScaleY = useSharedValue(1);
  const armLeft = useSharedValue(0), armRight = useSharedValue(0), footLeft = useSharedValue(0), footRight = useSharedValue(0);
  const rootMotion = useAnimatedStyle(() => ({
    transformOrigin: [`${(REST.x / data.w) * 100}%`, `${(REST.y / data.h) * 100}%`, 0],
    transform: [
      { translateX: rootX.value * stageScaleX.value },
      { translateY: rootY.value * stageScaleY.value },
      { scaleX: rootScaleX.value },
      { scaleY: rootScaleY.value },
      { rotate: `${rootRotation.value}deg` },
    ],
  }));
  const leftArmMotion = useAnimatedStyle(() => ({ transform: [{ rotate: `${armLeft.value}deg` }] }));
  const rightArmMotion = useAnimatedStyle(() => ({ transform: [{ rotate: `${armRight.value}deg` }] }));
  const leftFootMotion = useAnimatedStyle(() => ({ transform: [{ rotate: `${footLeft.value}deg` }] }));
  const rightFootMotion = useAnimatedStyle(() => ({ transform: [{ rotate: `${footRight.value}deg` }] }));

  useEffect(() => {
    if (!readyTick) return;
    if (!motion) {
      rootX.value = rootY.value = rootRotation.value = 0;
      armLeft.value = armRight.value = footLeft.value = footRight.value = 0;
      rootScaleX.value = rootScaleY.value = 1;
      return;
    }
    const root = geometry.root;
    const p0 = Number(staticVec(root?.ks.p, [REST.x, REST.y])[0]);
    const p1 = Number(staticVec(root?.ks.p, [REST.x, REST.y])[1]);
    const rootPositionX = frameKeys(root, 'p', 0).map((p) => ({ ...p, value: p.value - p0 }));
    const rootPositionY = frameKeys(root, 'p', 1).map((p) => ({ ...p, value: p.value - p1 }));
    const totalFrames = data.op - data.ip;
    const lookup = (name: string) => data.layers.find((layer) => layer.nm === name);
    assignTrack(rootX, rootPositionX, data.fr, totalFrames, 0);
    assignTrack(rootY, rootPositionY, data.fr, totalFrames, 0);
    assignTrack(rootRotation, frameKeys(root, 'r'), data.fr, totalFrames, 0);
    assignTrack(rootScaleX, frameKeys(root, 's', 0).map((point) => ({ ...point, value: point.value / 100 })), data.fr, totalFrames, 1);
    assignTrack(rootScaleY, frameKeys(root, 's', 1).map((point) => ({ ...point, value: point.value / 100 })), data.fr, totalFrames, 1);
    assignTrack(armLeft, frameKeys(lookup('leftArm'), 'r'), data.fr, totalFrames, 0);
    assignTrack(armRight, frameKeys(lookup('rightArm'), 'r'), data.fr, totalFrames, 0);
    assignTrack(footLeft, frameKeys(lookup('leftFoot'), 'r'), data.fr, totalFrames, 0);
    assignTrack(footRight, frameKeys(lookup('rightFoot'), 'r'), data.fr, totalFrames, 0);
    return () => {
      cancelAnimation(rootX); cancelAnimation(rootY); cancelAnimation(rootRotation);
      cancelAnimation(rootScaleX); cancelAnimation(rootScaleY);
      cancelAnimation(armLeft); cancelAnimation(armRight); cancelAnimation(footLeft); cancelAnimation(footRight);
    };
  }, [action, data, geometry, motion, readyTick, rootX, rootY, rootRotation, rootScaleX, rootScaleY, stageScaleX, stageScaleY, armLeft, armRight, footLeft, footRight]);

  useEffect(() => { if (readyTick) onReady?.(); }, [readyTick, onReady]);

  const placements = useMemo(() => {
    const result: { id: string; slot: EquipmentSlot; attachment: Attachment; z: number }[] = [];
    for (const [slot, id] of Object.entries(equipped) as [EquipmentSlot, string][]) {
      if (!id || (equipped.skin && id.startsWith('knight-'))) continue;
      const definition = wardrobeEquipment(id);
      if (!definition) continue;
      result.push({ id, slot, attachment: definition.attachment, z: definition.attachment.order });
    }
    return result.sort((a, b) => a.z - b.z);
  }, [equipped]);

  const renderBody = (item: typeof placements[number]) => {
    const frame = geometry.byFrame[item.attachment.frame];
    if (!frame) return null;
    const { canvas, anchor } = item.attachment;
    return <Image key={item.id} source={item.attachment.image} resizeMode="stretch" style={{
      position: 'absolute',
      left: `${((frame.pivotX - anchor.x) / data.w) * 100}%`,
      top: `${((frame.pivotY - anchor.y) / data.h) * 100}%`,
      width: `${(canvas.width / data.w) * 100}%`,
      height: `${(canvas.height / data.h) * 100}%`,
    }} />;
  };
  const renderLimb = (frameName: string, slot: EquipmentSlot, animatedStyle: any) => {
    const item = placements.find((entry) => entry.slot === slot);
    const frame = geometry.byFrame[frameName];
    if (!item || !frame || item.attachment.frame !== frameName) return null;
    const { canvas, anchor } = item.attachment;
    const left = `${(frame.pivotX / data.w) * 100}%`, top = `${(frame.pivotY / data.h) * 100}%`;
    const reachX = Math.max(anchor.x, canvas.width - anchor.x);
    const reachY = Math.max(anchor.y, canvas.height - anchor.y);
    const wrapWidth = reachX * 2;
    const wrapHeight = reachY * 2;
    const wrapperLeft = `${((frame.pivotX - reachX) / data.w) * 100}%`;
    const wrapperTop = `${((frame.pivotY - reachY) / data.h) * 100}%`;
    return <Animated.View key={slot} pointerEvents="none" style={[{
      position: 'absolute', left: wrapperLeft, top: wrapperTop,
      width: `${(wrapWidth / data.w) * 100}%`, height: `${(wrapHeight / data.h) * 100}%`, overflow: 'visible',
    }, animatedStyle]}>
      <Image source={item.attachment.image} resizeMode="stretch" style={{
        position: 'absolute',
        left: `${((reachX - anchor.x) / wrapWidth) * 100}%`,
        top: `${((reachY - anchor.y) / wrapHeight) * 100}%`,
        width: `${(canvas.width / wrapWidth) * 100}%`,
        height: `${(canvas.height / wrapHeight) * 100}%`,
      }} />
    </Animated.View>;
  };
  const bodyBehind = placements.filter((item) => item.attachment.frame === 'body' && item.attachment.layer === 'behind').map(renderBody);
  const bodyFront = placements.filter((item) => item.attachment.frame === 'body' && item.attachment.layer === 'front').map(renderBody);

  return <View testID="pip-wardrobe-preview" style={[styles.stage, style]} onLayout={(event) => {
    stageScaleX.value = event.nativeEvent.layout.width / data.w;
    stageScaleY.value = event.nativeEvent.layout.height / data.h;
  }}>
    {showConcept ? <Image source={conceptImage} resizeMode="contain" style={StyleSheet.absoluteFill} /> : <>
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, rootMotion]}>{bodyBehind}</Animated.View>
    <WinterLottie data={data} playing={motion} loop={!onFinish} progress={motion ? undefined : 0} onFinish={onFinish} onLoaded={() => setReadyTick((tick) => tick + 1)} />
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, rootMotion]}>
      {bodyFront}
      {headphones && !equipped.head && !skinAction && <View pointerEvents="none" style={styles.headphones}><PipAccessoryLayer kind="headphones" style="my-igloo" /></View>}
      {renderLimb('leftArm', 'leftFlipper', leftArmMotion)}
      {renderLimb('rightArm', 'rightFlipper', rightArmMotion)}
      {renderLimb('leftFoot', 'leftFoot', leftFootMotion)}
      {renderLimb('rightFoot', 'rightFoot', rightFootMotion)}
    </Animated.View>
    </>}
  </View>;
}

const styles = StyleSheet.create({
  stage: { width: '100%', aspectRatio: 1, position: 'relative', overflow: 'hidden' },
  headphones: { position: 'absolute', left: '13.75%', top: '3.05%', width: '72.5%', height: '84.6%' },
});
