import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { PERSONAL_IGLOO_STAGES, type PersonalIglooStage } from '../scenes/personalIglooStages';
import { colors } from '../theme';

export function PersonalIglooSelector({ selected, pending, disabled, error, onChange }: { selected: PersonalIglooStage; pending: PersonalIglooStage | null; disabled: boolean; error: string | null; onChange: (id: PersonalIglooStage) => void }) {
  return <View style={styles.section}>
    <Text style={styles.label}>MAKE YOURSELF AT HOME</Text>
    <View style={styles.row}>{PERSONAL_IGLOO_STAGES.map((room) => <Pressable key={room.id} accessibilityRole="button" accessibilityLabel={`Choose ${room.label}`} accessibilityState={{ selected: selected === room.id, disabled, busy: pending === room.id }} disabled={disabled} onPress={() => onChange(room.id)} style={({ pressed }) => [styles.choice, selected === room.id && styles.selected, (pressed || disabled) && { opacity: 0.65 }]}>
      <Image source={room.thumbnail} resizeMode="cover" fadeDuration={0} style={styles.thumbnail} />
      <Text style={[styles.name, selected === room.id && styles.selectedName]}>{pending === room.id ? 'Opening…' : room.label}</Text>
      {selected === room.id && <View style={styles.check}><Text style={styles.checkText}>✓</Text></View>}
    </Pressable>)}</View>
    {disabled && <Text style={styles.hint}>Pip will be back in his chair in a moment.</Text>}
    {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
  </View>;
}
const styles = StyleSheet.create({
  section: { width: '100%', maxWidth: 390, marginBottom: 14 },
  label: { color: colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.2, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8 },
  choice: { flex: 1, minHeight: 94, padding: 4, borderRadius: 15, borderWidth: 2, borderColor: '#DCE7E6', backgroundColor: colors.paper },
  selected: { borderColor: colors.tealDark, backgroundColor: '#E2EFEB' },
  thumbnail: { width: '100%', height: 62, borderRadius: 9 },
  name: { color: colors.muted, fontSize: 10, fontWeight: '700', textAlign: 'center', paddingTop: 6, paddingBottom: 3 },
  selectedName: { color: colors.tealDark },
  check: { position: 'absolute', right: 7, top: 7, width: 17, height: 17, borderRadius: 9, backgroundColor: colors.tealDark, alignItems: 'center', justifyContent: 'center' },
  checkText: { color: colors.paper, fontSize: 11, fontWeight: '800' },
  hint: { color: colors.muted, fontSize: 11, marginTop: 7 },
  error: { color: '#9A6052', fontSize: 11, lineHeight: 16, marginTop: 7 },
});
