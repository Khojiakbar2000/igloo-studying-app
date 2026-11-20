import { useStudyProfile } from '../onboarding/ProfileProvider';
import React, { useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { usePomodoro } from '../state/PomodoroContext';
import { dailySummary, goalsOn, nextLocalDate, pendingGoalSession, type DailyGoal, type GoalCelebration } from '../state/dailyGoals';
import { colors, radii } from '../theme';
import { Penguin } from './Penguin';

const PIP_GOALS_CUTOUT = require('../../assets/illustrations/today-goals/pip-face-cutout.png');
const WINTER_PINE = require('../../assets/animations/pip/winter/environment/pine.png');

function PipGoalReaction({ reaction, onDismiss }: { reaction: GoalCelebration; onDismiss: () => void }) {
  const [resting, setResting] = useState(false);
  useEffect(() => {
    const settle = setTimeout(() => setResting(true), 2100);
    const dismiss = setTimeout(onDismiss, reaction.kind === 'all' ? 9000 : 5000);
    return () => { clearTimeout(settle); clearTimeout(dismiss); };
  }, [reaction.id]);
  const all = reaction.kind === 'all';
  return <View style={[s.reaction, all && s.allReaction]}>
    <Penguin compact happy={!resting} emotion={all && resting ? 'sleepy' : 'happy'} action={resting ? 'react' : 'celebrate'} style={{ width: 74, height: 84 }} />
    <View style={s.flex}><Text accessibilityLiveRegion="polite" style={s.reactionTitle}>{all ? 'Your little list is complete!' : 'One lovely thing, done.'}</Text><Text style={s.helper}>{all ? 'Pip’s taking a well-earned breather. You can, too.' : 'Pip is proud of your gentle progress.'}</Text></View>
    <Pressable accessibilityRole="button" accessibilityLabel="Dismiss Pip’s celebration" onPress={onDismiss} style={s.iconButton}><Text style={s.more}>×</Text></Pressable>
  </View>;
}

function GoalRow({ goal, showSparkles = false }: { goal: DailyGoal; showSparkles?: boolean }) {
  const { timer, editGoal, deleteGoal, completeGoal, moveGoal } = usePomodoro();
  const [menu, setMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(goal.title);
  const linked = timer.sessions.filter((session) => session.goalId === goal.id);
  const focusMinutes = Math.floor(linked.reduce((sum, session) => sum + session.focusMs, 0) / 60_000);
  const active = timer.activeFocus?.goalId === goal.id;
  const save = () => { if (draft.trim()) { editGoal(goal.id, draft); setEditing(false); } };
  return <View style={s.goal}>
    {editing ? <View>
      <TextInput accessibilityLabel="Edit goal" value={draft} onChangeText={setDraft} maxLength={180} onSubmitEditing={save} autoFocus returnKeyType="done" style={s.input} />
      <View style={s.editActions}><Pressable accessibilityRole="button" onPress={() => setEditing(false)} style={s.textButton}><Text style={s.mutedButton}>Cancel</Text></Pressable><Pressable accessibilityRole="button" disabled={!draft.trim()} onPress={save} style={s.textButton}><Text style={s.tealButton}>Save goal</Text></Pressable></View>
    </View> : <>
      <View style={s.row}>
        {showSparkles ? <View accessibilityElementsHidden style={s.goalSparkles}><Text style={s.sparkleLarge}>✦</Text><Text style={s.sparkleSmall}>✧</Text></View> : null}
        <Pressable accessibilityRole="checkbox" accessibilityLabel={goal.title} accessibilityState={{ checked: Boolean(goal.completedAt) }} onPress={() => completeGoal(goal.id, !goal.completedAt)} style={s.iconButton}><View style={[s.checkbox, Boolean(goal.completedAt) && s.checked]}><Text style={s.check}>{goal.completedAt ? '✓' : ''}</Text></View></Pressable>
        <View style={s.flex}><Text style={[s.goalTitle, Boolean(goal.completedAt) && s.done]}>{goal.title}</Text>{linked.length > 0 && <Text style={s.sessionNote}>{linked.length} focus {linked.length === 1 ? 'session' : 'sessions'} · {focusMinutes} min</Text>}{active && <Text style={s.sessionNote}>In this focus session</Text>}</View>
        <Pressable accessibilityRole="button" accessibilityLabel={`Options for ${goal.title}`} accessibilityState={{ expanded: menu }} onPress={() => setMenu(!menu)} style={s.iconButton}><Text style={s.more}>···</Text></Pressable>
      </View>
      {menu && <View style={s.menu}>
        <Pressable accessibilityRole="button" onPress={() => { setDraft(goal.title); setEditing(true); setMenu(false); }} style={s.textButton}><Text style={s.tealButton}>Edit</Text></Pressable>
        {!goal.completedAt && <Pressable accessibilityRole="button" disabled={active} accessibilityState={{ disabled: active }} onPress={() => { moveGoal(goal.id); setMenu(false); }} style={s.textButton}><Text style={active ? s.disabledText : s.tealButton}>Move to tomorrow</Text></Pressable>}
        <Pressable accessibilityRole="button" onPress={() => deleteGoal(goal.id)} style={s.textButton}><Text style={s.deleteText}>Delete</Text></Pressable>
      </View>}
    </>}
  </View>;
}

export function TodaysGoals() {
  const { timer, today, hydrated, storageError, retrySave, addGoal, moveGoal } = usePomodoro();
  const [draft, setDraft] = useState('');
  const goals = goalsOn(timer, today);
  const completed = goals.filter((g) => g.completedAt).length;
  const earlier = timer.goals.filter((g) => !g.deletedAt && !g.completedAt && g.date < today);
  const tomorrow = goalsOn(timer, nextLocalDate(today));
  const add = () => { if (hydrated && draft.trim()) { addGoal(draft); setDraft(''); } };
  return <View>
    <View style={s.card}>
      <View pointerEvents="none" style={s.bindingRow}><View style={s.bindingTape} />{Array.from({ length: 9 }, (_, index) => <View key={index} style={s.bindingHole} />)}</View>
      <View style={s.rowBetween}><View style={s.flex}><Text style={s.eyebrow}>A LITTLE INTENTION</Text><Text style={s.title}>Today’s goals</Text></View><Text accessibilityLiveRegion="polite" style={s.progress}>{goals.length ? `${completed} of ${goals.length} completed` : 'Optional'}</Text></View>
      <View style={s.subtitleRow}><Text style={[s.helper, s.subtitleCopy]}>Three main goals is a lovely start. More or fewer is okay.</Text><View pointerEvents="none" style={s.pipDoodle}><Image source={PIP_GOALS_CUTOUT} resizeMode="contain" style={s.pipDoodleImage} /><Text style={s.pipDoodleSpark}>✦</Text></View></View>
      {!hydrated && <Text style={s.helper}>Getting your day ready…</Text>}
      {goals.map((goal, index) => <GoalRow key={goal.id} goal={goal} showSparkles={index === 0} />)}
      {hydrated && !goals.length && <Text style={s.empty}>What would make today feel good? Planning is optional.</Text>}
      <View style={s.addRow}><Image source={WINTER_PINE} resizeMode="contain" style={s.pineCutout} /><TextInput editable={hydrated} accessibilityLabel="New daily goal" placeholder="One thing I’d like to do…" placeholderTextColor={colors.muted} value={draft} onChangeText={setDraft} onSubmitEditing={add} maxLength={180} returnKeyType="done" style={[s.input, s.flex]} /><Pressable accessibilityRole="button" accessibilityLabel="Add daily goal" disabled={!hydrated || !draft.trim()} onPress={add} style={[s.addButton, (!hydrated || !draft.trim()) && s.disabled]}><Text style={s.addSymbol}>＋</Text></Pressable></View>
      {earlier.length > 0 && <View style={s.carrySection}><Text style={s.smallTitle}>Still on your mind?</Text><Text style={s.helper}>Nothing is overdue. Bring it along when you’re ready.</Text>{earlier.map((goal) => <View style={s.carryRow} key={goal.id}><Text style={[s.flex, s.goalTitle]}>{goal.title}</Text><Pressable accessibilityRole="button" disabled={timer.activeFocus?.goalId === goal.id} onPress={() => moveGoal(goal.id, 'today')} style={s.textButton}><Text style={s.tealButton}>Today</Text></Pressable><Pressable accessibilityRole="button" disabled={timer.activeFocus?.goalId === goal.id} onPress={() => moveGoal(goal.id)} style={s.textButton}><Text style={s.tealButton}>Tomorrow</Text></Pressable></View>)}</View>}
      {tomorrow.length > 0 && <View style={s.carrySection}><Text style={s.smallTitle}>A soft start for tomorrow</Text>{tomorrow.map((goal) => <View key={goal.id} style={s.carryRow}><Text style={[s.flex, s.helper]}>{goal.title}</Text><Pressable accessibilityRole="button" onPress={() => moveGoal(goal.id, 'today')} style={s.textButton}><Text style={s.tealButton}>Bring back</Text></Pressable></View>)}</View>}
      {storageError && <View style={s.saveError}><Text accessibilityRole="alert" style={[s.helper, s.flex]}>Your changes haven’t saved yet.</Text><Pressable accessibilityRole="button" onPress={retrySave} style={s.textButton}><Text style={s.tealButton}>Retry</Text></Pressable></View>}
    </View>
  </View>;
}

export function TodayGoalCelebration() {
  const { timer, hydrated, today } = usePomodoro();
  const [reaction, setReaction] = useState<GoalCelebration | null>(null);
  const seen = useRef<string | null>(null);
  const firstLoad = useRef(true);
  useEffect(() => {
    if (!hydrated) return;
    const event = timer.lastGoalCelebration;
    if (firstLoad.current) { firstLoad.current = false; seen.current = event?.id ?? null; return; }
    if (event && event.id !== seen.current) { seen.current = event.id; if (event.date === today) setReaction(event); }
  }, [timer.lastGoalCelebration, hydrated, today]);
  return reaction ? <View pointerEvents="box-none" style={s.celebrationOverlay}><PipGoalReaction key={reaction.id} reaction={reaction} onDismiss={() => setReaction(null)} /></View> : null;
}

export function FocusGoalPicker() {
  const { timer, today, selectGoal, hydrated } = usePomodoro();
  const [expanded, setExpanded] = useState(false);
  const options = goalsOn(timer, today).filter((g) => !g.completedAt);
  const selected = options.find((g) => g.id === timer.selectedGoalId);
  if (timer.activeFocus) {
    const title = timer.goals.find((g) => g.id === timer.activeFocus?.goalId)?.title ?? timer.activeFocus.goalTitle;
    return <View style={s.picker}><Text style={s.eyebrow}>{timer.status === 'paused' ? 'READY WHEN YOU ARE' : 'FOCUSING ON'}</Text><Text style={s.pickerTitle}>{title ?? 'Just a little time to focus'}</Text></View>;
  }
  return <View style={s.picker}>
    <Pressable accessibilityRole="button" accessibilityLabel="Choose an optional focus goal" accessibilityState={{ expanded, disabled: !hydrated }} disabled={!hydrated} onPress={() => setExpanded(!expanded)} style={s.pickerButton}><View style={s.flex}><Text style={s.eyebrow}>{timer.mode === 'focus' ? 'FOCUS GOAL · OPTIONAL' : 'NEXT FOCUS · OPTIONAL'}</Text><Text style={s.pickerTitle}>{selected?.title ?? 'Just focus, without a goal'}</Text></View><Text style={s.chevron}>{expanded ? '⌃' : '⌄'}</Text></Pressable>
    {expanded && <ScrollView style={s.goalOptions} keyboardShouldPersistTaps="handled" nestedScrollEnabled>{[{ id: null, title: 'Just focus, without a goal' }, ...options].map((goal) => <Pressable key={goal.id ?? 'none'} accessibilityRole="radio" accessibilityState={{ checked: goal.id === (selected?.id ?? null) }} onPress={() => { selectGoal(goal.id); setExpanded(false); }} style={s.option}><View style={[s.radio, goal.id === (selected?.id ?? null) && s.radioSelected]} /><Text style={[s.flex, s.goalTitle]}>{goal.title}</Text></Pressable>)}</ScrollView>}
  </View>;
}

export function GoalSessionReview() {
  const { timer, reviewSession } = usePomodoro();
  const session = pendingGoalSession(timer);
  if (!session) return null;
  const goal = timer.goals.find((g) => g.id === session.goalId);
  return <View style={s.review}>
    <Text style={s.eyebrow}>A GENTLE CHECK-IN</Text><Text style={s.title}>Did you finish your goal?</Text><Text style={s.reviewGoal}>{goal?.title ?? session.goalTitle}</Text>
    <View style={s.reviewActions}><Pressable accessibilityRole="button" onPress={() => reviewSession(session.id, true)} style={s.finishedButton}><Text style={s.finishedText}>✓ Finished!</Text></Pressable><Pressable accessibilityRole="button" onPress={() => reviewSession(session.id, false)} style={s.workingButton}><Text style={s.tealButton}>↻ Still working</Text></Pressable></View>
    <Text style={s.helper}>Either way, your focus time counts.</Text>
  </View>;
}

export function DailyFocusSummary() {
  const { profile }=useStudyProfile();
  const { timer, today } = usePomodoro();
  const summary = dailySummary(timer, today, Date.now(), timer.endAt);
  const minutes = Math.floor(summary.focusMs / 60_000);
  const time = minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`;
  return <View style={s.summary}><Text style={s.eyebrow}>TODAY, AT YOUR PACE</Text><View style={s.summaryRow}>{[[time, 'FOCUS TIME'], [String(summary.sessions), 'POMODOROS'], [summary.goalsTotal ? `${summary.goalsCompleted}/${summary.goalsTotal}` : '0', 'GOALS DONE']].map(([value, label]) => <View key={label} style={s.summaryStat}><Text style={s.summaryValue}>{value}</Text><Text style={s.summaryLabel}>{label}</Text></View>)}</View><Text accessibilityLabel="Daily focus target" style={s.summaryLabel}>{minutes} / {profile.target} MIN DAILY TARGET</Text></View>;
}

const s = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 }, row: { flexDirection: 'row', alignItems: 'center' }, rowBetween: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  card: { position: 'relative', overflow: 'visible', padding: 18, paddingTop: 34, backgroundColor: 'rgba(255, 250, 239, 0.91)', borderRadius: 24, borderWidth: 1.5, borderColor: 'rgba(145, 173, 214, 0.82)', shadowColor: '#637DAB', shadowOpacity: .12, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  bindingRow: { position: 'absolute', top: 7, left: 18, right: 18, height: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, bindingTape: { position: 'absolute', left: '42%', top: -4, width: '16%', height: 20, borderRadius: 3, backgroundColor: '#9BB8DE', opacity: .84, transform: [{ rotate: '-2deg' }] }, bindingHole: { width: 10, height: 10, borderRadius: 5, borderWidth: 1, borderColor: '#96AED0', backgroundColor: '#DCE7F3' },
  eyebrow: { color: '#5274AA', fontSize: 9, fontWeight: '800', letterSpacing: 1.5 }, title: { color: '#192F56', fontSize: 23, fontWeight: '800', marginTop: 5, letterSpacing: -.4 },
  progress: { color: '#3E7492', fontSize: 13, fontWeight: '700', flexShrink: 1, textAlign: 'right' }, helper: { color: '#5273A4', fontSize: 12, lineHeight: 18, marginTop: 5 }, subtitleRow: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 48, marginTop: 2 }, subtitleCopy: { flex: 1, maxWidth: '78%' }, pipDoodle: { position: 'relative', width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, pipDoodleImage: { width: 46, height: 45 }, pipDoodleSpark: { position: 'absolute', top: 0, right: 0, color: '#D39A43', fontSize: 14 }, goalSparkles: { position: 'relative', width: 20, height: 32, alignItems: 'center', justifyContent: 'center' }, sparkleLarge: { color: '#D49A42', fontSize: 18, lineHeight: 20 }, sparkleSmall: { position: 'absolute', left: 1, bottom: 0, color: '#E2B766', fontSize: 12 }, empty: { color: '#6F86AA', fontSize: 13, lineHeight: 20, marginVertical: 18 },
  goal: { borderBottomWidth: 1, borderBottomColor: '#EEEAE2', paddingVertical: 5 }, goalTitle: { color: colors.ink, fontSize: 14, lineHeight: 21 }, done: { color: '#91A39A', textDecorationLine: 'line-through' },
  iconButton: { width: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }, checkbox: { width: 23, height: 23, borderRadius: 8, borderWidth: 1.5, borderColor: '#C4D6CF', backgroundColor: '#F2F7F1', alignItems: 'center', justifyContent: 'center' }, checked: { backgroundColor: colors.tealDark, borderColor: colors.tealDark }, check: { color: colors.paper, fontSize: 15, fontWeight: '800' },
  more: { color: colors.muted, fontSize: 22, fontWeight: '700' }, sessionNote: { color: colors.teal, fontSize: 10, marginTop: 3 }, menu: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end' }, textButton: { minHeight: 44, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' }, tealButton: { color: colors.tealDark, fontSize: 12, fontWeight: '700' }, mutedButton: { color: colors.muted, fontSize: 12 }, deleteText: { color: '#A27065', fontSize: 12 }, disabledText: { color: '#ACB8B5', fontSize: 12 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }, pineCutout: { width: 34, height: 47, marginLeft: -5, marginRight: -1, alignSelf: 'flex-end' }, input: { minHeight: 50, borderWidth: 1, borderColor: 'rgba(145, 173, 214, 0.85)', backgroundColor: 'rgba(249, 251, 255, 0.84)', color: colors.ink, fontSize: 14, borderRadius: 23, paddingHorizontal: 14, paddingVertical: 10 }, addButton: { width: 50, minHeight: 50, backgroundColor: '#6F96CD', borderRadius: 18, alignItems: 'center', justifyContent: 'center' }, addSymbol: { color: '#FFF9EA', fontSize: 25 }, disabled: { opacity: .48 }, editActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  carrySection: { paddingTop: 14, marginTop: 12, borderTopWidth: 1, borderTopColor: colors.line }, smallTitle: { color: colors.ink, fontSize: 13, fontWeight: '700' }, carryRow: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingTop: 5 }, saveError: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  picker: { marginTop: 14, marginBottom: 5, padding: 12, backgroundColor: 'rgba(239, 247, 243, 0.82)', borderRadius: 14 }, pickerButton: { flexDirection: 'row', alignItems: 'center', minHeight: 44, gap: 8 }, pickerTitle: { color: colors.tealDark, fontSize: 13, lineHeight: 18, fontWeight: '600', marginTop: 5 }, chevron: { color: colors.tealDark, fontSize: 21 }, goalOptions: { maxHeight: 220, marginTop: 7 }, option: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#DDE9E1' }, radio: { width: 17, height: 17, borderRadius: 9, borderWidth: 1.5, borderColor: '#ACBFB8' }, radioSelected: { borderWidth: 5, borderColor: colors.tealDark },
  review: { padding: 18, borderRadius: radii.card, backgroundColor: 'rgba(255, 249, 234, 0.9)', borderWidth: 1, borderColor: 'rgba(235, 220, 188, 0.82)' }, reviewGoal: { color: '#6D6552', fontSize: 14, lineHeight: 21, marginTop: 9 }, reviewActions: { flexDirection: 'row', gap: 8, marginTop: 15, marginBottom: 6 }, finishedButton: { flex: 1, minHeight: 46, borderRadius: 14, backgroundColor: colors.tealDark, alignItems: 'center', justifyContent: 'center' }, finishedText: { color: colors.paper, fontSize: 13, fontWeight: '800' }, workingButton: { flex: 1, minHeight: 46, borderRadius: 14, backgroundColor: 'rgba(255, 255, 255, 0.8)', alignItems: 'center', justifyContent: 'center' },
  summary: { padding: 17, backgroundColor: 'rgba(234, 244, 241, 0.88)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.72)' }, summaryRow: { flexDirection: 'row', marginTop: 14 }, summaryStat: { flex: 1, alignItems: 'center' }, summaryValue: { color: colors.tealDark, fontSize: 21, fontWeight: '800' }, summaryLabel: { color: colors.muted, fontSize: 8, letterSpacing: .7, fontWeight: '700', marginTop: 5 },
  reaction: { flexDirection: 'row', alignItems: 'center', padding: 9, borderRadius: 24, backgroundColor: '#E9F4EB', marginBottom: 12 }, allReaction: { backgroundColor: '#F5EDD6' }, reactionTitle: { color: colors.tealDark, fontSize: 15, lineHeight: 21, fontWeight: '800' },
  celebrationOverlay: { position: 'absolute', bottom: 4, left: 14, right: 14, zIndex: 20, boxShadow: '0px 8px 24px #27384B22', borderRadius: 24 },
});
