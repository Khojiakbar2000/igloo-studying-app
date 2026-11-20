import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePipReactions } from '../character/reactions/PipReactionsProvider';
import { REACTION_LABELS, type PipReaction } from '../character/reactions/pipReactions';

export function StudyTogetherAnimationDebugger() {
  const { phase, cue, clip, lastFinished, override, debugPhase, debug } = usePipReactions();
  if (!__DEV__) return null;
  const current = clip in REACTION_LABELS ? REACTION_LABELS[clip as PipReaction] : clip === 'rest-hold' ? 'Resting' : clip;
  return <View style={styles.panel}>
    <Text style={styles.title}>Pip reaction debugger</Text>
    <Text testID="pip-reaction-status" accessibilityLiveRegion="polite" style={styles.status}>Pip: {current} · return to {phase}{cue && clip !== cue.reaction ? ` · queued ${REACTION_LABELS[cue.reaction]}` : ''}</Text>
    {lastFinished && <Text testID="pip-last-reaction" style={styles.last}>Last finished: {REACTION_LABELS[lastFinished]}</Text>}
    <View style={styles.controls}>
      <Control label="Use Pomodoro" selected={override === null} onPress={() => debugPhase(null)} />
      <Control label="Study mode" selected={override === 'study'} onPress={() => debugPhase('study')} />
      <Control label="Break mode" selected={override === 'rest'} onPress={() => debugPhase('rest')} />
      <Control label="Idle pose" selected={override === 'idle'} onPress={() => debugPhase('idle')} />
    </View>
    <View style={styles.controls}>
      {(Object.keys(REACTION_LABELS) as PipReaction[]).map(action => <Control key={action}
        label={REACTION_LABELS[action]} selected={cue?.reaction === action} onPress={() => debug(action)} />)}
    </View>
  </View>;
}

function Control({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[styles.control, selected && styles.controlSelected]}>
    <Text style={[styles.controlText, selected && styles.controlTextSelected]}>{label}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  panel: { width: '100%', marginTop: 12, padding: 13, borderRadius: 18, backgroundColor: 'rgba(255,253,248,0.91)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.85)', gap: 9 },
  title: { color: '#44636e', fontSize: 11, fontWeight: '900' },
  status: { color: '#354e57', fontSize: 12, fontWeight: '800' },
  last: { color: '#4b6973', fontSize: 11 },
  controls: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  control: { minHeight: 44, paddingHorizontal: 11, borderRadius: 12, backgroundColor: '#eef4f2', alignItems: 'center', justifyContent: 'center' },
  controlSelected: { backgroundColor: '#52777a' },
  controlText: { color: '#4b6973', fontSize: 11, fontWeight: '800' },
  controlTextSelected: { color: '#fffdf7' },
});
