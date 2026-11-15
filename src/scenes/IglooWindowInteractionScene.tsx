import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { usePomodoro } from '../state/PomodoroContext';

const POSES = [
  require('../../assets/animations/igloo-window/synfig/cels/pip-window_00.png'), require('../../assets/animations/igloo-window/synfig/cels/pip-window_01.png'),
  require('../../assets/animations/igloo-window/synfig/cels/pip-window_02.png'), require('../../assets/animations/igloo-window/synfig/cels/pip-window_03.png'),
  require('../../assets/animations/igloo-window/synfig/cels/pip-window_04.png'), require('../../assets/animations/igloo-window/synfig/cels/pip-window_05.png'),
  require('../../assets/animations/igloo-window/synfig/cels/pip-window_06.png'), require('../../assets/animations/igloo-window/synfig/cels/pip-window_07.png'),
  require('../../assets/animations/igloo-window/synfig/cels/pip-window_08.png'), require('../../assets/animations/igloo-window/synfig/cels/pip-window_09.png'),
  require('../../assets/animations/igloo-window/synfig/cels/pip-window_10.png'), require('../../assets/animations/igloo-window/synfig/cels/pip-window_11.png'),
  require('../../assets/animations/igloo-window/synfig/cels/pip-window_12.png'), require('../../assets/animations/igloo-window/synfig/cels/pip-window_13.png'),
  require('../../assets/animations/igloo-window/synfig/cels/pip-window_14.png'), require('../../assets/animations/igloo-window/synfig/cels/pip-window_15.png'),
];
const WINDOW_TIMELINE = require('../../assets/animations/igloo-window/synfig/timeline.json') as {
  fps: number; cels: { id: string; pose: number; exposure: number }[];
};
const ACircle = Animated.createAnimatedComponent(Circle);
// Percentage offsets within the existing My Igloo art frame.
// Values are percentages of the room frame. The walker's seated anchor is at 57%;
// the round window center is about 46.8%, so travel must cover the full 10.2%.
const WINDOW_REACH_X = -10.2;
const WINDOW_REACH_Y = -16.7;
const STORM_FLAKES = Array.from({ length: 24 }, (_, i) => ({ x: (i * 37 + 7) % 100, y: (i * 61 + 12) % 100, r: 0.45 + (i % 4) * 0.25, dur: 2400 + (i % 5) * 650, drift: 15 + (i % 6) * 12 }));
const ROOM_FLAKES = Array.from({ length: 12 }, (_, i) => ({ x: 8 + (i * 29) % 82, y: 34 + (i * 17) % 40, r: 1.6 + (i % 3) * 1.2, dur: 900 + (i % 6) * 270 }));
type Beat = 'idle' | 'notice_window' | 'approach_window' | 'reach_handle' | 'open_window' | 'wind_reaction' | 'shiver' | 'close_window' | 'recover' | 'return_to_idle';

export function IglooWindowInteraction({ ready, onRunStateChange }: { ready: boolean; onRunStateChange: (active: boolean) => void }) {
  const { timer } = usePomodoro();
  const [roomSize, setRoomSize] = useState({ width: 0, height: 0 });
  const [beat, setBeat] = useState<Beat>('idle');
  const [pose, setPose] = useState(15);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [muted, setMuted] = useState(false);
  const [caption, setCaption] = useState('A little world is waiting outside');
  const busy = beat !== 'idle';
  const focusActive = timer.status === 'running';
  const sash = useRef(new Animated.Value(0)).current;
  const wind = useRef(new Animated.Value(0)).current;
  const cold = useRef(new Animated.Value(0)).current;
  const px = useRef(new Animated.Value(0)).current;
  const py = useRef(new Animated.Value(0)).current;
  const cancel = useRef(false);
  const playId = useRef(0);
  const timerIds = useRef<ReturnType<typeof setTimeout>[]>([]);
  const audio = {
    wind: useAudioPlayer(require('../../assets/audio/igloo-window/wind.wav')),
    latch: useAudioPlayer(require('../../assets/audio/igloo-window/latch.wav')),
    creak: useAudioPlayer(require('../../assets/audio/igloo-window/window-creak.wav')),
    gust: useAudioPlayer(require('../../assets/audio/igloo-window/gust.wav')),
    peep: useAudioPlayer(require('../../assets/audio/igloo-window/pip-peep.wav')),
    shiver: useAudioPlayer(require('../../assets/audio/igloo-window/shiver.wav')),
    close: useAudioPlayer(require('../../assets/audio/igloo-window/window-close.wav')),
    room: useAudioPlayer(require('../../assets/audio/igloo-window/warm-room.wav')),
  };
  const audioRef = useRef(audio); audioRef.current = audio;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion).catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => { sub.remove(); cancel.current = true; timerIds.current.forEach(clearTimeout); };
  }, []);
  useEffect(() => {
    Object.values(audio).forEach((player) => { player.volume = muted ? 0 : player === audio.wind || player === audio.room ? .055 : .16; });
  }, [muted]);
  const sound = useCallback((name: keyof typeof audio, loop = false) => {
    const player = audioRef.current[name];
    player.loop = loop;
    player.volume = muted ? 0 : name === 'wind' || name === 'room' ? .055 : .16;
    if (!loop) void player.seekTo(0);
    player.play();
  }, [muted]);
  const stopAmbience = useCallback(() => { audioRef.current.wind.pause(); audioRef.current.room.pause(); }, []);
  const stormOpacity = useMemo(() => cold.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.76] }), [cold]);
  const roomSnowOpacity = useMemo(() => wind.interpolate({ inputRange: [0, .28, 1], outputRange: [0, 0, .9] }), [wind]);

  const wait = (ms: number) => new Promise<void>((resolve) => {
    const id = setTimeout(() => { timerIds.current = timerIds.current.filter((item) => item !== id); resolve(); }, ms);
    timerIds.current.push(id);
  });
  const move = (value: Animated.Value, toValue: number, duration: number, easing = Easing.inOut(Easing.cubic)) => new Promise<void>((resolve) => {
    Animated.timing(value, { toValue, duration, easing, useNativeDriver: true }).start(({ finished }) => { if (finished) resolve(); else resolve(); });
  });
  const setBeatCaption = (next: Beat, line: string) => { setBeat(next); setCaption(line); };
  const complete = useCallback(() => {
    setPose(15); setBeat('idle'); setCaption('Pip is back at his desk');
    sash.setValue(0); wind.setValue(0); cold.setValue(0); px.setValue(0); py.setValue(0); cancel.current = false; stopAmbience(); onRunStateChange(false);
  }, [cold, onRunStateChange, px, py, sash, stopAmbience, wind]);

  const play = useCallback(async () => {
    if (busy || !ready) return;
    const runId = ++playId.current;
    const isCancelled = () => cancel.current || playId.current !== runId;
    void setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' });
    sound('room', true); sound('wind', true);
    onRunStateChange(true);
    cancel.current = false;
    const check = isCancelled;
    const showCel = async (id: string) => {
      const cel = WINDOW_TIMELINE.cels.find((item) => item.id === id);
      if (!cel) throw new Error(`Missing Synfig cel timing: ${id}`);
      setPose(cel.pose);
      await wait(cel.exposure * 1000 / WINDOW_TIMELINE.fps);
    };
    const say = (name: Beat, line: string) => setBeatCaption(name, line);
    if (reducedMotion) {
      say('notice_window', 'Pip hears the wind…'); await showCel('notice'); await showCel('eye_line'); if (check()) return;
      say('approach_window', 'Pip waddles over to the window…'); await showCel('anticipation');
      for (let i = 0; i < 4; i++) {
        const progress = (i + 1) / 4;
        await Promise.all([showCel(i % 2 === 0 ? 'waddle_a' : 'waddle_b'), move(px, WINDOW_REACH_X * progress, 167), move(py, WINDOW_REACH_Y * progress, 167)]);
      }
      await showCel('arrival');
      say('reach_handle', 'Pip reaches the latch'); sound('latch'); await showCel('reach_latch');
      sound('creak'); say('open_window', 'A chilly little gust!');
      await Promise.all([showCel('resist_latch'), move(sash, .17, 250)]);
      await Promise.all([showCel('gust_surprise'), move(sash, 1, 500), move(cold, 1, 500)]); sound('gust');
      say('wind_reaction', 'WHOOOOSH!'); await showCel('scarf_in_wind');
      say('shiver', 'That is a very cold breeze…'); sound('peep'); sound('shiver'); await showCel('shiver_compress');
      sound('creak'); say('close_window', 'Quick, back into the warm!');
      await Promise.all([showCel('close_push'), move(sash, .77, 333)]);
      await Promise.all([showCel('close_strain'), move(sash, 0, 500), move(cold, 0, 500), move(wind, 0, 500)]); sound('close');
      say('return_to_idle', 'Pip waddles back to his chair');
      await Promise.all([showCel('return_step_a'), move(px, WINDOW_REACH_X * .5, 167), move(py, WINDOW_REACH_Y * .5, 167)]);
      await Promise.all([showCel('return_step_b'), move(px, 0, 250), move(py, 0, 250)]);
      await showCel('settle'); complete(); return;
    }
    say('notice_window', 'Did you hear that?'); await showCel('notice'); if (check()) return;
    await showCel('eye_line'); if (check()) return;
    await showCel('curious_tilt'); if (check()) return;
    say('approach_window', 'Pip waddles over to peek…'); await showCel('anticipation'); if (check()) return;
    for (let i = 0; i < 4; i++) {
      const cel = i % 2 === 0 ? 'waddle_a' : 'waddle_b';
      const progress = (i + 1) / 4;
      await Promise.all([showCel(cel), move(px, WINDOW_REACH_X * progress, 167, Easing.inOut(Easing.quad)), move(py, WINDOW_REACH_Y * progress, 167, Easing.inOut(Easing.quad))]);
      if (check()) return;
    }
    await showCel('arrival'); if (check()) return;
    say('reach_handle', 'A tiny flipper finds the latch'); sound('latch');
    await showCel('reach_latch'); if (check()) return;
    sound('creak'); say('open_window', 'He gives the stubborn latch a tug…');
    await Promise.all([showCel('resist_latch'), move(sash, .17, 250, Easing.out(Easing.quad))]); if (check()) return;
    await Promise.all([showCel('gust_surprise'), move(sash, 1, 500), move(cold, 1, 500)]); if (check()) return;
    sound('gust');
    setBeat('wind_reaction'); setCaption('WHOOOOSH!');
    await Promise.all([showCel('scarf_in_wind'), move(wind, 1, 180)]); if (check()) return;
    setBeat('shiver'); setCaption('That is a very cold breeze…'); sound('peep'); sound('shiver');
    await showCel('shiver_compress'); if (check()) return;
    await showCel('wide_eyes_brace'); if (check()) return;
    await showCel('shiver_follow'); if (check()) return;
    sound('creak'); say('close_window', 'Quick, back into the warm!');
    await Promise.all([showCel('close_push'), move(sash, .77, 333), move(cold, .72, 233)]); if (check()) return;
    setCaption('One last push…');
    await Promise.all([showCel('close_strain'), move(sash, 0, 500, Easing.out(Easing.back(1.1))), move(wind, 0, 900), move(cold, .12, 850)]); if (check()) return;
    sound('close');
    say('recover', 'Safe and snug again.');
    await showCel('relief'); if (check()) return;
    say('return_to_idle', 'Pip has a little wink for you');
    await Promise.all([showCel('return_step_a'), move(px, WINDOW_REACH_X * .5, 167, Easing.inOut(Easing.cubic)), move(py, WINDOW_REACH_Y * .5, 167, Easing.inOut(Easing.cubic))]); if (check()) return;
    await Promise.all([showCel('return_step_b'), move(px, 0, 250, Easing.inOut(Easing.cubic)), move(py, 0, 250, Easing.inOut(Easing.cubic))]); if (check()) return;
    await showCel('settle'); if (check()) return; complete();
  }, [busy, cold, complete, onRunStateChange, px, py, ready, reducedMotion, sash, sound, wind]);

  const skip = useCallback(() => {
    cancel.current = true; playId.current += 1;
    stopAmbience();
    [sash, wind, cold, px, py].forEach((value) => value.stopAnimation());
    setBeat('recover'); setCaption('Back in the warm, safe and snug.'); setPose(15);
    Animated.parallel([
      Animated.timing(sash, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(wind, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(cold, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(px, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(py, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => complete());
  }, [cold, complete, px, py, sash, stopAmbience, wind]);

  const characterX = px.interpolate({ inputRange: [-20, 0], outputRange: [-roomSize.width * .2, 0] });
  const characterY = py.interpolate({ inputRange: [-20, 0], outputRange: [-roomSize.height * .2, 0] });
  const sashAngle = sash.interpolate({ inputRange: [0, .17, 1], outputRange: ['0deg', '-18deg', '-76deg'] });

  return <View pointerEvents="box-none" onLayout={(event) => {
    const { width: nextWidth, height: nextHeight } = event.nativeEvent.layout;
    if (nextWidth !== roomSize.width || nextHeight !== roomSize.height) setRoomSize({ width: nextWidth, height: nextHeight });
  }} style={StyleSheet.absoluteFill}>
    <View style={s.windowBox}>
      {busy && <WindowArtwork stormOpacity={stormOpacity} flakeDrift={wind} sashAngle={sashAngle} open={sash} />}
      <Pressable accessibilityRole="button" accessibilityLabel={ready ? 'Tap the round window. Pip will walk over and open it.' : 'Pip is getting ready at his desk'} onPress={() => void play()} disabled={!ready || busy} style={s.windowTap} />
    </View>
    <RoomSnow opacity={roomSnowOpacity} wind={wind} active={beat === 'wind_reaction' || beat === 'shiver' || beat === 'close_window'} />
    {busy && <Animated.View pointerEvents="none" style={[s.pip, { transform: [{ translateX: characterX }, { translateY: characterY }] }]}>
      <View style={s.pipScale}><Image source={POSES[pose]} resizeMode="contain" style={s.pipImage} /></View>
    </Animated.View>}
    {busy && <View pointerEvents="none" style={s.sceneCaption}><Text style={s.captionText}>{caption}</Text></View>}
    {focusActive && busy && <View pointerEvents="none" style={s.focusPill}><Text style={s.focusText}>Your focus timer keeps running</Text></View>}
    {busy && <Pressable accessibilityRole="button" accessibilityLabel={muted ? 'Turn sound on' : 'Mute sounds'} onPress={() => setMuted((value) => !value)} style={s.soundButton}><Text style={s.soundText}>{muted ? '♪̸' : '♪'}</Text></Pressable>}
    {busy && <Pressable accessibilityRole="button" onPress={skip} style={s.skip}><Text style={s.skipText}>SKIP</Text></Pressable>}
  </View>;
}

function WindowArtwork({ stormOpacity, flakeDrift, sashAngle, open }: { stormOpacity: Animated.AnimatedInterpolation<number>; flakeDrift: Animated.Value; sashAngle: Animated.AnimatedInterpolation<string>; open: Animated.Value }) {
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    <Svg viewBox="0 0 180 168" preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id="iglooNight" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#293B68" /><Stop offset=".58" stopColor="#718DAF" /><Stop offset="1" stopColor="#D9C5D0" /></LinearGradient>
        <LinearGradient id="iglooFrost" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#F3F7F2" stopOpacity=".9" /><Stop offset="1" stopColor="#9DBBD1" stopOpacity=".6" /></LinearGradient>
        <ClipPath id="iglooWindowGlass"><Circle cx="90" cy="84" r="65" /></ClipPath>
      </Defs>
      <Circle cx="90" cy="84" r="79" fill="#665868" opacity=".22" />
      <Circle cx="90" cy="84" r="77" fill="#99775F" stroke="#D1B699" strokeWidth="5" />
      <Circle cx="90" cy="84" r="69" fill="#594A50" stroke="#72594D" strokeWidth="3" />
      <G clipPath="url(#iglooWindowGlass)">
        <Rect x="20" y="10" width="140" height="150" fill="url(#iglooNight)" />
        <Circle cx="48" cy="45" r="1.5" fill="#FFF4D9" /><Circle cx="124" cy="39" r="1.2" fill="#FFF4D9" /><Circle cx="84" cy="30" r="1" fill="#FFF4D9" />
        <Path d="M18 108 Q42 85 65 103 T112 99 T165 108 L165 168 L18 168Z" fill="#AFC5D1" opacity=".88" />
        <Path d="M18 120 Q47 102 76 117 T134 111 L168 168 L18 168Z" fill="#E9F0EC" />
        <Path d="M44 116 L54 81 L65 116 M54 88 L39 101 M55 95 L70 107 M119 116 L129 76 L142 116 M129 87 L113 102 M130 95 L148 108" fill="none" stroke="#5C6E76" strokeWidth="5" strokeLinejoin="round" />
      </G>
      <Circle cx="90" cy="84" r="66" fill="none" stroke="url(#iglooFrost)" strokeWidth="3" opacity=".8" />
    </Svg>
    <StormSnow opacity={stormOpacity} drift={flakeDrift} />
    <Animated.View style={[s.sash, { transform: [{ perspective: 360 }, { rotateY: sashAngle }] }]}>
      <Svg viewBox="0 0 180 168" preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
        <Defs><LinearGradient id="iglooPane" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#E0F5FA" stopOpacity=".34" /><Stop offset=".55" stopColor="#B8D9E1" stopOpacity=".24" /><Stop offset="1" stopColor="#F5F4E9" stopOpacity=".42" /></LinearGradient></Defs>
        <Circle cx="90" cy="84" r="64" fill="url(#iglooPane)" stroke="#9A7459" strokeWidth="5" />
        <Circle cx="90" cy="84" r="59" fill="none" stroke="#D6B895" strokeWidth="2" />
        <Path d="M90 24 L90 144 M31 84 L149 84" stroke="#98745F" strokeWidth="4" />
        <Path d="M45 48 Q54 34 67 32" fill="none" stroke="#FFF" strokeWidth="3" opacity=".6" />
        <Circle cx="42" cy="84" r="5" fill="#D9B677" stroke="#745741" strokeWidth="2" />
      </Svg>
    </Animated.View>
    <Animated.View pointerEvents="none" style={[s.openGlow, { opacity: open.interpolate({ inputRange: [0, .45, 1], outputRange: [0, .38, .12] }) }]} />
  </View>;
}

function StormSnow({ opacity, drift }: { opacity: Animated.AnimatedInterpolation<number>; drift: Animated.Value }) {
  const loops = useRef(STORM_FLAKES.map(() => new Animated.Value(Math.random()))).current;
  useEffect(() => {
    const animations = loops.map((value, i) => Animated.loop(Animated.sequence([
      Animated.timing(value, { toValue: 1, duration: STORM_FLAKES[i].dur, easing: Easing.linear, useNativeDriver: false }),
      Animated.timing(value, { toValue: 0, duration: 0, useNativeDriver: false }),
    ])));
    animations.forEach((animation) => animation.start()); return () => animations.forEach((animation) => animation.stop());
  }, [loops]);
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }] }>
    <Svg viewBox="0 0 180 168" style={StyleSheet.absoluteFill}>
      <Defs><ClipPath id="stormMask"><Circle cx="90" cy="84" r="64" /></ClipPath></Defs>
      <G clipPath="url(#stormMask)">{STORM_FLAKES.map((flake, i) => {
        const localX = loops[i].interpolate({ inputRange: [0, 1], outputRange: [flake.x * 1.8 - 8, flake.x * 1.8 + 8] });
        const gust = drift.interpolate({ inputRange: [0, 1], outputRange: [-2, flake.drift] });
        const x = Animated.add(localX, gust);
        const y = loops[i].interpolate({ inputRange: [0, 1], outputRange: [flake.y * 1.48 + 15, flake.y * 1.48 + 24] });
        return <ACircle key={i} cx={x as any} cy={y as any} r={flake.r} fill="#F5FEFF" opacity={i % 3 === 0 ? .95 : .62} />;
      })}</G>
    </Svg>
  </Animated.View>;
}

function RoomSnow({ opacity, wind, active }: { opacity: Animated.AnimatedInterpolation<number>; wind: Animated.Value; active: boolean }) {
  const drivers = useRef(ROOM_FLAKES.map(() => new Animated.Value(0))).current;
  useEffect(() => {
    if (!active) return undefined;
    const loops = drivers.map((driver, i) => Animated.loop(Animated.sequence([
      Animated.timing(driver, { toValue: 1, duration: ROOM_FLAKES[i].dur, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(driver, { toValue: 0, duration: 0, useNativeDriver: true }),
    ])));
    loops.forEach((loop) => loop.start()); return () => loops.forEach((loop) => loop.stop());
  }, [active, drivers]);
  return <Animated.View pointerEvents="none" style={[s.roomSnowClip, { opacity }]}>
    <Svg width="100%" height="100%" viewBox="0 0 360 430">
      <Defs><ClipPath id="roomEntry"><Path d="M123 0 L237 0 L350 430 L10 430Z" /></ClipPath></Defs>
      <G clipPath="url(#roomEntry)">{ROOM_FLAKES.map((flake, i) => {
        const y = drivers[i].interpolate({ inputRange: [0, 1], outputRange: [-14, 430] });
        const origin = 150 + ((i * 17) % 62);
        const x = drivers[i].interpolate({ inputRange: [0, 1], outputRange: [origin, origin - 60 + (i % 5) * 24] });
        const alpha = wind.interpolate({ inputRange: [0, .2, 1], outputRange: [0, .75, .95] });
        return <ACircle key={i} cx={x as any} cy={y as any} r={flake.r} fill="#F7FFFF" opacity={alpha as any} />;
      })}</G>
    </Svg>
  </Animated.View>;
}

const s = StyleSheet.create({
  windowBox: { position: 'absolute', width: '16.5%', height: '10.2%', left: '38.5%', top: '30.9%', zIndex: 3 },
  windowTap: { position: 'absolute', width: '100%', height: '100%', borderRadius: 60 },
  sash: { position: 'absolute', left: '5%', top: '4%', width: '90%', height: '92%', zIndex: 2, transformOrigin: 'right center' as any, backfaceVisibility: 'hidden' },
  openGlow: { position: 'absolute', width: '74%', height: '80%', left: '13%', top: '10%', borderRadius: 99, backgroundColor: '#9DE1FF', zIndex: 0 },
  roomSnowClip: { position: 'absolute', left: '43%', top: '38%', width: '26%', height: '30%', zIndex: 4, overflow: 'hidden' },
  pip: { position: 'absolute', zIndex: 5, left: '34%', top: '34.5%', width: '46%', height: '43%', alignItems: 'center', justifyContent: 'center' },
  pipScale: { width: '100%', height: '100%', transform: [{ scale: 0.93 }] },
  pipImage: { width: '100%', height: '100%' },
  sceneCaption: { position: 'absolute', top: 12, left: '18%', right: '18%', alignItems: 'center', zIndex: 8 },
  captionText: { color: '#F5F7F1', fontSize: 10, fontWeight: '700', textAlign: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14, overflow: 'hidden', backgroundColor: '#243A50B8' },
  focusPill: { position: 'absolute', bottom: 48, alignSelf: 'center', borderRadius: 16, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#17304BCC', zIndex: 9 },
  focusText: { color: '#F6F3E9', fontSize: 10 },
  soundButton: { position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: 12, backgroundColor: '#17304BCC', alignItems: 'center', justifyContent: 'center', zIndex: 9 },
  soundText: { color: '#F6F3E9', fontSize: 16, fontWeight: '700' },
  skip: { position: 'absolute', right: 12, bottom: 10, zIndex: 10, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#243B52C9' },
  skipText: { color: '#F5FAF7', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
});
