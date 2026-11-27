import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import { STUDY_WINDOW_SCENES, type StudyWindowScene } from '../scenes/studyWindowScenes';

export function StudyWindowSelector({ selected, onChange, embedded = false, active = true }: { selected: StudyWindowScene; onChange: (scene: StudyWindowScene) => void; embedded?: boolean; active?: boolean }) {
  return <View accessibilityLabel="Window view controls" style={[styles.section, embedded && styles.embedded]}>
    <View style={styles.choices}>{STUDY_WINDOW_SCENES.map((scene) => <Pressable
      key={scene.id} accessibilityRole="button" accessibilityLabel={`Window view: ${scene.label}`}
      accessibilityState={{ selected: active && scene.id === selected }} onPress={() => onChange(scene.id)}
      style={({ pressed }) => [styles.button, active && selected === scene.id && styles.selected, pressed && styles.pressed]}
    ><Text style={styles.icon}>{scene.icon}</Text><Text numberOfLines={2} style={[styles.buttonText, active && selected === scene.id && styles.selectedText]}>{scene.id === 'zombies' ? 'Zombies' : scene.label}</Text></Pressable>)}</View>
  </View>;
}

const styles = StyleSheet.create({
  section: { position: 'absolute', zIndex: 10, left: '8%', right: '8%', bottom: '1.5%', padding: 7, borderRadius: 19, borderWidth: 3, borderColor: '#B78D62', backgroundColor: '#EFDCBA', boxShadow: '0px 5px 0px #987754, 0px 9px 15px #40302138' },
  embedded: { position: 'relative', left: 0, right: 0, bottom: 0, padding: 0, borderWidth: 0, backgroundColor: 'transparent', boxShadow: 'none' },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  button: { flexBasis: '30%', flexGrow: 1, minHeight: 44, paddingHorizontal: 4, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 10, borderWidth: 1, borderBottomWidth: 3, borderColor: '#CAB18C', backgroundColor: '#FFF4DE' },
  selected: { backgroundColor: colors.link, borderColor: colors.link },
  buttonText: { color: '#614C38', fontSize: 10, fontWeight: '700', flexShrink: 1 },
  selectedText: { color: colors.snow },
  icon: { fontSize: 14 },
  pressed: { opacity: 0.85, transform: [{ translateY: 1 }] },
});
