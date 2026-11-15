import React, { useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { RoomCharacter } from '../components/RoomCharacter';

const drawings = [
  require('../../assets/animations/synfig-shiver/frames/pip-shiver_00.png'),
  require('../../assets/animations/synfig-shiver/frames/pip-shiver_01.png'),
  require('../../assets/animations/synfig-shiver/frames/pip-shiver_02.png'),
  require('../../assets/animations/synfig-shiver/frames/pip-shiver_03.png'),
  require('../../assets/animations/synfig-shiver/frames/pip-shiver_04.png'),
  require('../../assets/animations/synfig-shiver/frames/pip-shiver_05.png'),
  require('../../assets/animations/synfig-shiver/frames/pip-shiver_06.png'),
  require('../../assets/animations/synfig-shiver/frames/pip-shiver_07.png'),
  require('../../assets/animations/synfig-shiver/frames/pip-shiver_08.png'),
  require('../../assets/animations/synfig-shiver/frames/pip-shiver_09.png'),
  require('../../assets/animations/synfig-shiver/frames/pip-shiver_10.png'),
  require('../../assets/animations/synfig-shiver/frames/pip-shiver_11.png'),
  require('../../assets/animations/synfig-shiver/frames/pip-shiver_12.png'),
  require('../../assets/animations/synfig-shiver/frames/pip-shiver_13.png'),
  require('../../assets/animations/synfig-shiver/frames/pip-shiver_14.png'),
  require('../../assets/animations/synfig-shiver/frames/pip-shiver_15.png'),
];
const exposureFrames = [6, 2, 2, 3, 1, 2, 2, 1, 1, 2, 1, 3, 3, 2, 2, 6];
const totalTicks = exposureFrames.reduce((sum, value) => sum + value, 0);

export function SynfigShiverCompareScene() {
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(true);
  const tick = useRef(0);

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      tick.current += 1;
      if (tick.current >= totalTicks) {
        tick.current = totalTicks - 1;
        setFrame(15);
        setPlaying(false);
        return;
      }
      let cumulative = 0;
      for (let index = 0; index < exposureFrames.length; index++) {
        cumulative += exposureFrames[index];
        if (tick.current < cumulative) {
          setFrame(index);
          break;
        }
      }
    }, 1000 / 12);
    return () => clearInterval(timer);
  }, [playing]);

  const replay = () => {
    tick.current = 0;
    setFrame(0);
    setPlaying(true);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>PIP · ANIMATION EXPERIMENT</Text>
        <Text style={styles.title}>Cold shiver study</Text>
        <Text style={styles.subtitle}>Compare the current Rive idle with the Synfig cel animation. Tap replay to watch the 3.25 second drawn take.</Text>
      </View>
      <View style={styles.columns}>
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>CURRENT RIVE</Text>
          <Text style={styles.panelSub}>Seated idle loop</Text>
          <View style={styles.stage}><RoomCharacter style={styles.riveInset} /></View>
        </View>
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>SYNFIG DRAWN CELLS</Text>
          <Text style={styles.panelSub}>16 cels · 12 fps · 3.25 sec</Text>
          <View style={styles.stage}><Image source={drawings[frame]} resizeMode="contain" style={styles.drawing} /></View>
        </View>
      </View>
      <Pressable onPress={replay} style={styles.button} accessibilityRole="button">
        <Text style={styles.buttonText}>{playing ? 'PLAYING SHIVER…' : 'REPLAY SHIVER'}</Text>
      </Pressable>
      <View style={styles.note}>
        <Text style={styles.noteTitle}>Review notes</Text>
        <Text style={styles.noteBody}>The current Rive file has a seated idle and happy trigger, but no cold reaction. This is a capability comparison, not a matched-action test. Synfig holds 16 independently editable full-character cels on a varied 3.25 second timeline; it does not separate Pip into body, head, eyes, and flippers because the approved artwork is flattened.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EAF1F5' },
  content: { paddingHorizontal: 14, paddingTop: 20, paddingBottom: 28, alignItems: 'center' },
  heading: { width: '100%', maxWidth: 760, marginBottom: 14 },
  eyebrow: { color: '#527F83', fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: '#1E3037', fontSize: 27, lineHeight: 33, fontWeight: '800', marginTop: 5 },
  subtitle: { color: '#657E89', fontSize: 12, lineHeight: 18, marginTop: 5 },
  columns: { width: '100%', maxWidth: 760, flexDirection: 'row', gap: 10 },
  panel: { flex: 1, minWidth: 0, padding: 9, borderRadius: 18, backgroundColor: '#FFFEFC', borderWidth: 1, borderColor: '#E1E9EA' },
  panelTitle: { color: '#416A70', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  panelSub: { color: '#81949A', fontSize: 9, marginTop: 3, minHeight: 22 },
  stage: { width: '100%', aspectRatio: 1, position: 'relative', overflow: 'hidden', borderRadius: 12, backgroundColor: '#EFF5F7', alignItems: 'center', justifyContent: 'center' },
  riveInset: { width: '75%', height: '75%' },
  drawing: { width: '100%', height: '100%' },
  button: { width: '100%', maxWidth: 360, height: 46, marginTop: 14, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#426C70' },
  buttonText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  note: { width: '100%', maxWidth: 760, marginTop: 13, padding: 13, borderRadius: 15, backgroundColor: '#F8FBFA' },
  noteTitle: { color: '#3B6569', fontSize: 11, fontWeight: '800' },
  noteBody: { color: '#6D838C', fontSize: 10, lineHeight: 15, marginTop: 5 },
});
