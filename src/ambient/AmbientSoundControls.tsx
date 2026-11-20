import { useFurniture } from '../furniture/Furniture';
import { boxStyle, roomBox } from '../furniture/catalog';
import { IGLOO_FURNITURE } from '../study-together/iglooLayout';
import React from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View, useWindowDimensions, type ViewStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { LevelSlider } from './LevelSlider';
import LottiePlayer from '../components/StudyTogetherLottiePlayer';
import { useAmbientSound, trackVolume } from './AmbientSoundProvider';
import { SoundIcon } from './SoundIcon';
import { MAX_TRACKS, SOUNDS, soundById } from './sounds';

const machine = require('../../assets/environments/igloo/ambient-sound-machine.png');
const stand = require('../../assets/environments/study-together/radio-stand.webp');
const glow = require('../../assets/animations/study-together-rooms/console-ignition.json');

export function AmbientSoundTrigger({ placement }: { placement: 'igloo' | 'shared' | 'studyIgloo' | 'timer' }) {
  const { setOpen, playing } = useAmbientSound();
  const reducedMotion = useReducedMotion();
  const isTimer = placement === 'timer';
  const hasStand = placement === 'studyIgloo';
  const press = useFurniture('radio', () => setOpen(true), { registered: !isTimer, state: playing ? 'Playing' : 'Quiet',
    bounds: hasStand ? IGLOO_FURNITURE.radio : placement === 'shared' ? roomBox(21, 87.7, 17, 11.3) : roomBox(70, 78, 20, 13) });
  const playingGlow = !isTimer && playing && <View pointerEvents="none" style={styles.propGlow}>
    {reducedMotion ? <View style={styles.lit} /> : <LottiePlayer source={glow} autoPlay loop style={StyleSheet.absoluteFill} />}
  </View>;
  return <Pressable accessibilityRole="button" accessibilityLabel={playing ? 'Ambient sounds, playing' : 'Ambient sounds'}
    onPress={press}
    style={({ pressed }) => [
      isTimer ? styles.timerTrigger : styles.prop,
      placement === 'shared' && styles.shared,
      hasStand && [styles.withStand, boxStyle(IGLOO_FURNITURE.radio)],
      pressed && styles.pressed,
    ]}>
    {hasStand ? <>
      <Image accessible={false} source={stand} resizeMode="stretch" fadeDuration={0} style={styles.stand} />
      <View pointerEvents="none" style={styles.standRadio}>
        <Image accessible={false} source={machine} resizeMode="contain" fadeDuration={0} style={styles.propArt} />
        {playingGlow}
      </View>
    </> : <>
      <Image accessible={false} source={machine} resizeMode="contain" fadeDuration={0} style={isTimer ? styles.timerArt : styles.propArt} />
      {playingGlow}
    </>}
    {isTimer && <Text style={styles.triggerLabel}>Ambient sounds{playing ? ' · On' : ''}</Text>}
  </Pressable>;
}

export function AmbientSoundPanel() {
  const audio = useAmbientSound();
  const { prefs } = audio;
  const reducedMotion = useReducedMotion();
  const { height } = useWindowDimensions();
  const canPause = prefs.enabled && !audio.needsGesture && !audio.pausedByMedia;
  const mixFull = prefs.selected.length === MAX_TRACKS;
  const status = audio.error ?? (audio.breakPaused ? 'Paused during this break' :
    prefs.muted ? 'Mix muted' : audio.pausedByMedia ? 'Playback paused' : audio.playing ? 'Playing' : 'Ready to play');

  return <Modal transparent visible={audio.open} animationType={reducedMotion ? 'none' : 'fade'} onRequestClose={() => audio.setOpen(false)}>
    <View style={styles.scrim}>
      <Pressable accessibilityLabel="Dismiss ambient sounds" accessibilityRole="button" style={StyleSheet.absoluteFill} onPress={() => audio.setOpen(false)} />
      <View style={[styles.panel, { maxHeight: height * 0.86 }]} accessibilityViewIsModal>
        <View style={styles.header}>
          <Image accessible={false} source={machine} style={styles.headerArt} resizeMode="contain" />
          <View style={styles.heading}>
            <Text style={styles.title}>Ambient sounds</Text>
            <Text accessibilityLiveRegion="polite" style={styles.status}>{status}</Text>
          </View>
          <Control label="Close" onPress={() => audio.setOpen(false)} />
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.master}>
            <Volume label="Master volume" value={prefs.master} onChange={audio.setVolume} />
            <View style={styles.transport}>
              <Control label={canPause && prefs.selected.length > 0 ? 'Pause mix' : 'Play mix'} disabled={!audio.ready || !prefs.selected.length} onPress={audio.togglePlayback} />
              <Control label={prefs.muted ? 'Unmute' : 'Mute'} disabled={!audio.ready} onPress={() => audio.setOption('muted', !prefs.muted)} />
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Sound library</Text>
            <Text style={styles.count}>{prefs.selected.length} / {MAX_TRACKS} in mix</Text>
          </View>
          <View style={styles.library}>
            {SOUNDS.map(sound => {
              const selected = prefs.selected.includes(sound.id);
              const disabled = !audio.ready || (mixFull && !selected);
              return <Pressable key={sound.id} accessibilityRole="button" accessibilityLabel={sound.label}
                accessibilityState={{ selected, disabled }} disabled={disabled} onPress={() => audio.toggleTrack(sound.id)}
                style={({ pressed }) => [styles.soundKey, selected && styles.selected, disabled && styles.disabled, pressed && styles.pressed]}>
                <SoundIcon icon={sound.icon} />
                <Text style={styles.soundLabel}>{sound.label}</Text>
                <View style={[styles.keyLight, selected && styles.lit]} />
              </Pressable>;
            })}
          </View>
          {mixFull && <Text style={styles.hint}>Remove a sound to make room for another.</Text>}

          {prefs.selected.length > 0 && <View style={styles.mix}>
            <Text style={styles.sectionTitle}>Track levels</Text>
            {prefs.selected.map(id => <Volume key={id} label={soundById(id).label} value={trackVolume(prefs, id)} onChange={value => audio.setVolume(value, id)} />)}
          </View>}

          <View style={styles.options}>
            <Text style={styles.sectionTitle}>Focus timer</Text>
            <Option label="Fade out when focus ends" value={prefs.stopAtEnd} onChange={value => audio.setOption('stopAtEnd', value)} disabled={!audio.ready} />
            <Option label="Keep playing during breaks" value={prefs.duringBreaks} onChange={value => audio.setOption('duringBreaks', value)} disabled={!audio.ready} />
          </View>
        </ScrollView>
      </View>
    </View>
  </Modal>;
}

function Volume({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <View style={styles.volume}>
    <View style={styles.span}><Text style={styles.volumeLabel}>{label}</Text><Text style={styles.count}>{Math.round(value * 100)}%</Text></View>
    <LevelSlider label={label} value={value} onChange={onChange} />
  </View>;
}

function Control({ label, disabled, onPress }: { label: string; disabled?: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.control, disabled && styles.disabled, pressed && styles.pressed]}>
    <Text style={styles.controlText}>{label}</Text>
  </Pressable>;
}

function Option({ label, value, disabled, onChange }: { label: string; value: boolean; disabled: boolean; onChange: (value: boolean) => void }) {
  return <View style={styles.option}><Text style={styles.optionLabel}>{label}</Text>
    <Switch accessibilityLabel={label} disabled={disabled} value={value} onValueChange={onChange} trackColor={{ false: '#dbcaaf', true: '#bd874f' }} thumbColor="#fff4df" />
  </View>;
}

const settingsBlock: ViewStyle = { borderTopWidth: 1, borderColor: '#e8d5b8', paddingTop: 10, marginTop: 9 };
const styles = StyleSheet.create({
  prop: { position: 'absolute', zIndex: 9, right: '10%', bottom: '9%', width: '20%', aspectRatio: 1, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  shared: { left: '21%', right: undefined, bottom: '1%', width: '17%' },
  withStand: { right: undefined, bottom: undefined, aspectRatio: undefined, minWidth: 0 },
  stand: { position: 'absolute', bottom: 0, width: '100%', height: '48%' },
  standRadio: { position: 'absolute', top: 0, alignSelf: 'center', width: '74%', height: '73%' },
  propArt: { width: '100%', height: '100%' },
  propGlow: { position: 'absolute', width: '40%', height: '40%', left: '24%', bottom: '3%', alignItems: 'center', justifyContent: 'center' },
  timerTrigger: { flexDirection: 'row', gap: 8, alignItems: 'center', alignSelf: 'flex-start', minHeight: 44, paddingRight: 9, marginTop: 6 },
  timerArt: { width: 30, height: 32 },
  triggerLabel: { color: '#815432', fontWeight: '800', fontSize: 12 },
  pressed: { opacity: 0.82, transform: [{ translateY: 1 }] },
  scrim: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16, backgroundColor: 'rgba(42,25,29,0.52)' },
  panel: { width: '100%', maxWidth: 400, flexShrink: 1, backgroundColor: '#fff4e3', borderRadius: 23, borderWidth: 2, borderColor: '#cf9a62', overflow: 'hidden', boxShadow: '0px 16px 42px #2c1b2955' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 9, gap: 9, borderBottomWidth: 1, borderColor: '#dfba8b', backgroundColor: '#f4dfbf' },
  headerArt: { width: 48, height: 48 },
  heading: { flex: 1, minWidth: 0 },
  title: { color: '#543422', fontWeight: '900', fontSize: 20, letterSpacing: -0.4 },
  status: { color: '#754f36', fontWeight: '600', fontSize: 11, marginTop: 2 },
  scroll: { flexShrink: 1 },
  content: { paddingHorizontal: 13, paddingTop: 8, paddingBottom: 14 },
  master: { marginBottom: 10 },
  transport: { flexDirection: 'row', gap: 8 },
  control: { minHeight: 44, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12, borderRadius: 9, backgroundColor: '#eed0a2', borderWidth: 1, borderBottomWidth: 3, borderColor: '#d1a36b' },
  controlText: { color: '#623b22', fontWeight: '800', fontSize: 11 },
  volume: { paddingTop: 3 },
  span: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  volumeLabel: { color: '#62412d', fontSize: 12, fontWeight: '700' },
  count: { color: '#856344', fontSize: 11, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 },
  sectionTitle: { color: '#533321', fontSize: 13, fontWeight: '900' },
  library: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  soundKey: { flexBasis: '18%', flexGrow: 1, minHeight: 63, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 2, paddingVertical: 3, backgroundColor: '#f9e9d1', borderColor: '#dec19d', borderWidth: 1, borderBottomWidth: 2, borderRadius: 8 },
  selected: { backgroundColor: '#f4d292', borderColor: '#b87941' },
  disabled: { opacity: 0.5 },
  soundLabel: { color: '#62412d', textAlign: 'center', fontWeight: '800', fontSize: 9, lineHeight: 11 },
  keyLight: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#cfb18e', marginTop: 3 },
  lit: { backgroundColor: '#ffb849', borderColor: '#fff1bf', borderWidth: 1, width: 7, height: 7, borderRadius: 4 },
  hint: { color: '#856344', fontSize: 10, marginTop: 6 },
  mix: settingsBlock,
  options: settingsBlock,
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 43, gap: 8 },
  optionLabel: { color: '#62412d', fontSize: 12, flexShrink: 1 },
});
