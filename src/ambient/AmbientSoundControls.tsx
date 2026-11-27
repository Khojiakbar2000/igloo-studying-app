import { Button, Chevron, IconButton } from '../ui/Controls';
import { Overlay } from '../ui/Overlay';
import { colors, radii, todayColors, type, ui } from '../theme';
import { useFurniture } from '../furniture/Furniture';
import { boxStyle, roomBox, type Bounds } from '../furniture/catalog';
import { IGLOO_FURNITURE } from '../study-together/iglooLayout';
import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Switch, Text, View, useWindowDimensions, type ViewStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { LevelSlider } from './LevelSlider';
import LottiePlayer from '../components/StudyTogetherLottiePlayer';
import { useAmbientSound, trackVolume } from './AmbientSoundProvider';
import { SoundIcon } from './SoundIcon';
import { MAX_TRACKS, SOUNDS, soundById } from './sounds';

const machine = require('../../assets/environments/igloo/ambient-sound-machine-warm-nordic.png');
const stand = require('../../assets/environments/study-together/radio-stand.webp');
const glow = require('../../assets/animations/study-together-rooms/console-ignition.json');

export function AmbientSoundTrigger({ placement, bounds }: { bounds?: Bounds; placement: 'igloo' | 'shared' | 'studyIgloo' | 'timer' }) {
  const { setOpen, playing } = useAmbientSound();
  const reducedMotion = useReducedMotion();
  const isTimer = placement === 'timer';
  const hasStand = placement === 'studyIgloo';
  const press = useFurniture('radio', () => setOpen(true), { registered: !isTimer, state: playing ? 'Playing' : 'Quiet',
    bounds: bounds ?? (hasStand ? IGLOO_FURNITURE.radio : placement === 'shared' ? roomBox(21, 87.7, 17, 11.3) : roomBox(70, 78, 20, 13)) });
  const playingGlow = !isTimer && playing && <View pointerEvents="none" style={styles.propGlow}>
    {reducedMotion ? <View style={styles.lit} /> : <LottiePlayer source={glow} autoPlay loop style={StyleSheet.absoluteFill} />}
  </View>;
  if (isTimer) return <IconButton label={playing ? 'Ambient sounds, playing' : 'Ambient sounds'} onPress={press} style={styles.winterControl}>
    <Image accessible={false} source={machine} resizeMode="contain" style={styles.timerArt} />
    {playing && <View pointerEvents="none" style={styles.timerPlaying} />}
  </IconButton>;
  return <Pressable accessibilityRole="button" accessibilityLabel={playing ? 'Ambient sounds, playing' : 'Ambient sounds'}
    onPress={press}
    style={({ pressed }) => [
      styles.prop,
      placement === 'shared' && styles.shared,
      hasStand && [styles.withStand, boxStyle(IGLOO_FURNITURE.radio)],
      bounds && [styles.withStand, boxStyle(bounds)],
      pressed && styles.pressed,
    ]}>
    {hasStand ? <>
      <Image accessible={false} source={stand} resizeMode="stretch" fadeDuration={0} style={styles.stand} />
      <View pointerEvents="none" style={styles.standRadio}>
        <Image accessible={false} source={machine} resizeMode="contain" fadeDuration={0} style={styles.propArt} />
        {playingGlow}
      </View>
    </> : <>
      <Image accessible={false} source={machine} resizeMode="contain" fadeDuration={0} style={styles.propArt} />
      {playingGlow}
    </>}
  </Pressable>;
}

export function AmbientSoundPanel({ winter = false }: { winter?: boolean }) {
  const palette = winter ? todayColors : colors;
  const audio = useAmbientSound();
  const { prefs } = audio;
  const reducedMotion = useReducedMotion();
  const { height } = useWindowDimensions();
  const canPause = prefs.enabled && !audio.needsGesture && !audio.pausedByMedia;
  const mixFull = prefs.selected.length === MAX_TRACKS;
  const status = audio.error ?? (audio.breakPaused ? 'Paused during this break' :
    prefs.muted ? 'Mix muted' : audio.pausedByMedia ? 'Playback paused' : audio.playing ? 'Playing' : 'Ready to play');

  return <Overlay transparent visible={audio.open} animationType={reducedMotion ? 'none' : 'fade'} onRequestClose={() => audio.setOpen(false)}>
    <View style={styles.scrim}>
      <Pressable accessibilityLabel="Dismiss ambient sounds" accessibilityRole="button" style={StyleSheet.absoluteFill} onPress={() => audio.setOpen(false)} />
      <View style={[styles.panel, { maxHeight: height * 0.86, backgroundColor: palette.paper, borderColor: palette.line }]} accessibilityViewIsModal>
        <View style={[styles.header, winter && styles.winterControl]}>
          <Image accessible={false} source={machine} style={styles.headerArt} resizeMode="contain" />
          <View style={styles.heading}>
            <Text style={[styles.title, { color: palette.ink }]}>Ambient sounds</Text>
            <Text accessibilityLiveRegion="polite" style={styles.status}>{status}</Text>
          </View>
          <IconButton style={winter && styles.winterControl} label="Close ambient sounds" onPress={() => audio.setOpen(false)}><Chevron direction="close" color={palette.ink} /></IconButton>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.master}>
            <Volume winter={winter} label="Master volume" value={prefs.master} onChange={audio.setVolume} />
            <View style={styles.transport}>
              <Control winter={winter} label={canPause && prefs.selected.length > 0 ? 'Pause mix' : 'Play mix'} disabled={!audio.ready || !prefs.selected.length} onPress={audio.togglePlayback} />
              <Control winter={winter} label={prefs.muted ? 'Unmute' : 'Mute'} disabled={!audio.ready} onPress={() => audio.setOption('muted', !prefs.muted)} />
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: palette.ink }]}>Sound library</Text>
            <Text style={styles.count}>{prefs.selected.length} / {MAX_TRACKS} in mix</Text>
          </View>
          <View style={styles.library}>
            {SOUNDS.map(sound => {
              const selected = prefs.selected.includes(sound.id);
              const disabled = !audio.ready || (mixFull && !selected);
              return <Pressable key={sound.id} accessibilityRole="button" accessibilityLabel={sound.label}
                accessibilityState={{ selected, disabled }} disabled={disabled} onPress={() => audio.toggleTrack(sound.id)}
                style={({ pressed }) => [styles.soundKey, winter && styles.winterControl, selected && (winter ? styles.winterSelected : styles.selected), disabled && styles.disabled, pressed && styles.pressed]}>
                <SoundIcon icon={sound.icon} />
                <Text style={[styles.soundLabel, { color: palette.ink }]}>{sound.label}</Text>
                <View style={[styles.keyLight, selected && styles.lit]} />
              </Pressable>;
            })}
          </View>
          {mixFull && <Text style={styles.hint}>Remove a sound to make room for another.</Text>}

          {prefs.selected.length > 0 && <View style={styles.mix}>
            <Text style={[styles.sectionTitle, { color: palette.ink }]}>Track levels</Text>
            {prefs.selected.map(id => <Volume winter={winter} key={id} label={soundById(id).label} value={trackVolume(prefs, id)} onChange={value => audio.setVolume(value, id)} />)}
          </View>}

          <View style={styles.options}>
            <Text style={[styles.sectionTitle, { color: palette.ink }]}>Focus timer</Text>
            <Option winter={winter} label="Fade out when focus ends" value={prefs.stopAtEnd} onChange={value => audio.setOption('stopAtEnd', value)} disabled={!audio.ready} />
            <Option winter={winter} label="Keep playing during breaks" value={prefs.duringBreaks} onChange={value => audio.setOption('duringBreaks', value)} disabled={!audio.ready} />
          </View>
        </ScrollView>
      </View>
    </View>
  </Overlay>;
}

function Volume({ label, value, onChange, winter }: { winter: boolean; label: string; value: number; onChange: (value: number) => void }) {
  return <View style={styles.volume}>
    <View style={styles.span}><Text style={styles.volumeLabel}>{label}</Text><Text style={styles.count}>{Math.round(value * 100)}%</Text></View>
    <LevelSlider accent={winter ? todayColors.primary : undefined} label={label} value={value} onChange={onChange} />
  </View>;
}

function Control({ label, disabled, onPress, winter }: { winter: boolean; label: string; disabled?: boolean; onPress: () => void }) {
  return <Button winter={winter} label={label} disabled={disabled} onPress={onPress} variant={label.includes('mix') ? 'primary' : 'secondary'} />;
}

function Option({ label, value, disabled, onChange, winter }: { winter: boolean; label: string; value: boolean; disabled: boolean; onChange: (value: boolean) => void }) {
  return <View style={styles.option}><Text style={styles.optionLabel}>{label}</Text>
    <Switch {...{ activeThumbColor: colors.paper }} thumbColor={colors.paper} accessibilityLabel={label} disabled={disabled} value={value} onValueChange={onChange} trackColor={{ false: winter ? todayColors.wash : colors.ice, true: winter ? todayColors.primary : colors.blue }} />
  </View>;
}

const settingsBlock: ViewStyle = { borderTopWidth: 1, borderColor: colors.line, paddingTop: 10, marginTop: 9 };
const styles = StyleSheet.create({
  prop: { position: 'absolute', zIndex: 9, right: '10%', bottom: '9%', width: '20%', aspectRatio: 1, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  shared: { left: '21%', right: undefined, bottom: '1%', width: '17%' },
  withStand: { right: undefined, bottom: undefined, aspectRatio: undefined, minWidth: 0 },
  stand: { position: 'absolute', bottom: 0, width: '100%', height: '48%' },
  standRadio: { position: 'absolute', top: 0, alignSelf: 'center', width: '74%', height: '73%' },
  propArt: { width: '100%', height: '100%' },
  propGlow: { position: 'absolute', width: '40%', height: '40%', left: '24%', bottom: '3%', alignItems: 'center', justifyContent: 'center' },
  timerArt: { width: 24, height: 26 },
  timerPlaying: { position: 'absolute', top: 6, right: 6, width: 6, height: 6, borderRadius: 3, backgroundColor: todayColors.primary },
  pressed: { opacity: 0.82, transform: [{ translateY: 1 }] },
  scrim: { ...ui.shade, backgroundColor: 'transparent' },
  panel: { ...ui.dialog, flexShrink: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 9, gap: 9, borderBottomWidth: 1, borderColor: colors.line, backgroundColor: colors.ice },
  headerArt: { width: 48, height: 48 },
  heading: { flex: 1, minWidth: 0 },
  title: { ...type.heading, color: colors.ink },
  status: { color: '#754f36', fontWeight: '600', fontSize: 11, marginTop: 2 },
  scroll: { flexShrink: 1 },
  content: { paddingHorizontal: 13, paddingTop: 8, paddingBottom: 14 },
  master: { marginBottom: 10 },
  transport: { flexDirection: 'row', gap: 8 },
  control: { minHeight: 44, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12, borderRadius: 9, backgroundColor: '#eed0a2', borderWidth: 1, borderBottomWidth: 3, borderColor: '#d1a36b' },
  controlText: { color: '#623b22', fontWeight: '800', fontSize: 11 },
  volume: { paddingTop: 3 },
  span: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  volumeLabel: { color: colors.ink, fontSize: 12, fontWeight: '700' },
  count: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 },
  sectionTitle: { ...type.heading, color: colors.ink },
  library: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  soundKey: { flexBasis: '18%', flexGrow: 1, minHeight: 63, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 2, paddingVertical: 3, backgroundColor: colors.ice, borderColor: colors.line, borderWidth: 1, borderRadius: radii.control },
  selected: { ...ui.selected },
  winterControl: { backgroundColor: todayColors.wash, borderColor: todayColors.line },
  winterSelected: { backgroundColor: todayColors.wash, borderColor: todayColors.primary },
  disabled: { opacity: 0.5 },
  soundLabel: { color: colors.ink, textAlign: 'center', fontWeight: '800', fontSize: 11, lineHeight: 13 },
  keyLight: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#cfb18e', marginTop: 3 },
  lit: { backgroundColor: '#ffb849', borderColor: '#fff1bf', borderWidth: 1, width: 7, height: 7, borderRadius: 4 },
  hint: { color: colors.muted, fontSize: 10, marginTop: 6 },
  mix: settingsBlock,
  options: settingsBlock,
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 43, gap: 8 },
  optionLabel: { color: colors.ink, fontSize: 12, flexShrink: 1 },
});
