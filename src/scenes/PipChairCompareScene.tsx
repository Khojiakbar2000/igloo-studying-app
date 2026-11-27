import { colors } from '../theme';
import React, { useState } from 'react';
import { Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { RoomCharacter } from '../components/RoomCharacter';
import { RoomCharacterOverlay } from '../components/RoomCharacterOverlay';

const ROOM = require('../../assets/environments/igloo/concepts/my-igloo-clean-plate.png');

/** Review-only scene: compare the current Rive seated loop with the drawn chair action. */
export function PipChairCompareScene() {
  const [take, setTake] = useState(0);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>PIP · ANIMATION REVIEW</Text>
        <Text style={styles.title}>Chair moment</Text>
        <Text style={styles.subtitle}>Same room and scale. The left panel is the current Rive seated loop; the right panel plays the 14 drawing chair action.</Text>
      </View>
      <View style={styles.columns}>
        <View style={styles.panel}>
          <View style={styles.panelHeading}>
            <Text style={styles.panelTitle}>CURRENT RIVE</Text>
            <Text style={styles.panelSub}>Seated idle loop</Text>
          </View>
          <View style={styles.scene}>
            <ImageBackground source={ROOM} resizeMode="cover" style={StyleSheet.absoluteFill} />
            <View style={styles.riveSeat}>
              <RoomCharacter />
            </View>
          </View>
        </View>
        <View style={styles.panel}>
          <View style={styles.panelHeading}>
            <Text style={styles.panelTitle}>DRAWN ACTION</Text>
            <Text style={styles.panelSub}>14 transparent PNG drawings</Text>
          </View>
          <View style={styles.scene}>
            <ImageBackground source={ROOM} resizeMode="cover" style={StyleSheet.absoluteFill} />
            <RoomCharacterOverlay key={take} mode="personal" />
          </View>
        </View>
      </View>
      <Pressable onPress={() => setTake((value) => value + 1)} style={styles.replay} accessibilityRole="button">
        <Text style={styles.replayText}>REPLAY DRAWN ACTION</Text>
      </Pressable>
      <View style={styles.note}>
        <Text style={styles.noteTitle}>What this comparison shows</Text>
        <Text style={styles.noteBody}>The Rive asset provides the seated idle. The drawn sequence adds the notice, approach, hop, landing, and settle. The PNGs preserve transparency and Pip’s palette, but are flattened illustrations rather than editable drawing layers.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EDF3F7' },
  content: { paddingHorizontal: 14, paddingTop: 20, paddingBottom: 28, alignItems: 'center' },
  heading: { width: '100%', maxWidth: 760, marginBottom: 14 },
  eyebrow: { color: colors.link, fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: colors.ink, fontSize: 27, lineHeight: 33, fontWeight: '800', marginTop: 5 },
  subtitle: { color: colors.link, fontSize: 12, lineHeight: 18, marginTop: 5 },
  columns: { width: '100%', maxWidth: 760, flexDirection: 'row', gap: 10 },
  panel: { flex: 1, minWidth: 0, padding: 8, borderRadius: 18, backgroundColor: '#FFFEFC', borderWidth: 1, borderColor: '#E1E9EA' },
  panelHeading: { minHeight: 40, paddingHorizontal: 3, paddingBottom: 6 },
  panelTitle: { color: colors.link, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  panelSub: { color: colors.muted, fontSize: 9, marginTop: 3 },
  scene: { width: '100%', aspectRatio: 2 / 3, position: 'relative', overflow: 'hidden', borderRadius: 12, backgroundColor: '#DCE8F1' },
  riveSeat: { position: 'absolute', width: '46%', height: '43%', left: '34%', top: '34.5%' },
  replay: { width: '100%', maxWidth: 360, height: 46, marginTop: 14, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.link },
  replayText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  note: { width: '100%', maxWidth: 760, marginTop: 13, padding: 13, borderRadius: 15, backgroundColor: '#F8FBFA' },
  noteTitle: { color: colors.link, fontSize: 11, fontWeight: '800' },
  noteBody: { color: colors.link, fontSize: 10, lineHeight: 15, marginTop: 5 },
});
