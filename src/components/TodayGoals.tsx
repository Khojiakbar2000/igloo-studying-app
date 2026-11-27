import { useCompanionName, useStudyProfile } from '../onboarding/ProfileProvider';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { usePomodoro } from '../state/PomodoroContext';
import { dailySummary, goalsOn, nextLocalDate, pendingGoalSession, type DailyGoal, type GoalCelebration } from '../state/dailyGoals';
import { radii, space, todayColors, type, ui } from '../theme';
import { Penguin } from './Penguin';
import { Button, Chevron, IconButton, ProgressBar } from '../ui/Controls';

function PipGoalReaction({ reaction, onDismiss }: { reaction: GoalCelebration; onDismiss: () => void }) {
  const companion = useCompanionName();
  const [resting, setResting] = useState(false);
  useEffect(() => {
    const settle = setTimeout(() => setResting(true), 2100);
    const dismiss = setTimeout(onDismiss, reaction.kind === 'all' ? 9000 : 5000);
    return () => { clearTimeout(settle); clearTimeout(dismiss); };
  }, [reaction.id]);
  const all = reaction.kind === 'all';
  return <View style={s.reaction}>
    <Penguin compact happy={!resting} emotion={all && resting ? 'sleepy' : 'happy'} action={resting ? 'react' : 'celebrate'} style={{ width: 74, height: 84 }} />
    <View style={s.flex}><Text accessibilityLiveRegion="polite" style={s.reactionTitle}>{all ? 'Your little list is complete!' : 'One lovely thing, done.'}</Text><Text style={s.helper}>{all ? `${companion} is taking a well-earned break.` : `${companion} is cheering for you.`}</Text></View>
    <IconButton style={s.control} label="Dismiss celebration" onPress={onDismiss}><Chevron direction="close" color={todayColors.ink} /></IconButton>
  </View>;
}

function GoalRow({ goal }: { goal: DailyGoal }) {
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
      <View style={s.editActions}><Pressable accessibilityRole="button" onPress={() => setEditing(false)} style={s.textButton}><Text style={s.mutedButton}>Cancel</Text></Pressable><Pressable accessibilityRole="button" disabled={!draft.trim()} onPress={save} style={s.textButton}><Text style={s.link}>Save goal</Text></Pressable></View>
    </View> : <>
      <View style={s.row}>
        <Pressable accessibilityRole="checkbox" accessibilityLabel={goal.title} accessibilityState={{ checked: Boolean(goal.completedAt) }} onPress={() => completeGoal(goal.id, !goal.completedAt)} style={s.iconButton}><View style={[s.checkbox, Boolean(goal.completedAt) && s.checked]}><Text style={s.check}>{goal.completedAt ? '✓' : ''}</Text></View></Pressable>
        <View style={s.flex}><Text style={[s.goalTitle, Boolean(goal.completedAt) && s.done]}>{goal.title}</Text>{linked.length > 0 && <Text style={s.sessionNote}>{linked.length} focus {linked.length === 1 ? 'session' : 'sessions'} · {focusMinutes} min</Text>}{active && <Text style={s.sessionNote}>In this focus session</Text>}</View>
        <Pressable accessibilityRole="button" accessibilityLabel={`Options for ${goal.title}`} accessibilityState={{ expanded: menu }} onPress={() => setMenu(!menu)} style={s.iconButton}><Text style={s.more}>···</Text></Pressable>
      </View>
      {menu && <View style={s.menu}>
        <Pressable accessibilityRole="button" onPress={() => { setDraft(goal.title); setEditing(true); setMenu(false); }} style={s.textButton}><Text style={s.link}>Edit</Text></Pressable>
        {!goal.completedAt && <Pressable accessibilityRole="button" disabled={active} accessibilityState={{ disabled: active }} onPress={() => { moveGoal(goal.id); setMenu(false); }} style={s.textButton}><Text style={active ? s.disabledText : s.link}>Move to tomorrow</Text></Pressable>}
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
      <View style={s.rowBetween}><View style={s.flex}><Text accessibilityRole="header" style={s.title}>Today’s goals</Text></View><Text accessibilityLiveRegion="polite" style={s.progress}>{goals.length ? `${completed} of ${goals.length} completed` : 'Optional'}</Text></View>
      {!hydrated && <Text style={s.helper}>Getting your day ready…</Text>}
      {goals.map((goal) => <GoalRow key={goal.id} goal={goal} />)}
      {hydrated && !goals.length && <Text style={s.empty}>Add a task you’d like to focus on today.</Text>}
      <View style={s.addRow}><TextInput editable={hydrated} accessibilityLabel="New daily goal" placeholder="One thing I’d like to do…" placeholderTextColor={todayColors.muted} value={draft} onChangeText={setDraft} onSubmitEditing={add} maxLength={180} returnKeyType="done" style={[s.input, s.flex]} /><IconButton style={s.control} label="Add daily goal" disabled={!hydrated || !draft.trim()} onPress={add}><Text style={s.more}>+</Text></IconButton></View>
      {earlier.length > 0 && <View style={s.carrySection}><Text style={s.smallTitle}>Still on your mind?</Text><Text style={s.helper}>Nothing is overdue. Bring it along when you’re ready.</Text>{earlier.map((goal) => <View style={s.carryRow} key={goal.id}><Text style={[s.flex, s.goalTitle]}>{goal.title}</Text><Pressable accessibilityRole="button" disabled={timer.activeFocus?.goalId === goal.id} onPress={() => moveGoal(goal.id, 'today')} style={s.textButton}><Text style={s.link}>Today</Text></Pressable><Pressable accessibilityRole="button" disabled={timer.activeFocus?.goalId === goal.id} onPress={() => moveGoal(goal.id)} style={s.textButton}><Text style={s.link}>Tomorrow</Text></Pressable></View>)}</View>}
      {tomorrow.length > 0 && <View style={s.carrySection}><Text style={s.smallTitle}>A soft start for tomorrow</Text>{tomorrow.map((goal) => <View key={goal.id} style={s.carryRow}><Text style={[s.flex, s.helper]}>{goal.title}</Text><Pressable accessibilityRole="button" onPress={() => moveGoal(goal.id, 'today')} style={s.textButton}><Text style={s.link}>Bring back</Text></Pressable></View>)}</View>}
      {storageError && <View style={s.saveError}><Text accessibilityRole="alert" style={[s.helper, s.flex]}>Your changes haven’t saved yet.</Text><Pressable accessibilityRole="button" onPress={retrySave} style={s.textButton}><Text style={s.link}>Retry</Text></Pressable></View>}
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

export function FocusGoalPicker({ onAddGoal }: { onAddGoal: () => void }) {
  const { timer, today, selectGoal, hydrated } = usePomodoro();
  const [expanded, setExpanded] = useState(false);
  const options = goalsOn(timer, today).filter((g) => !g.completedAt);
  const selected = options.find((g) => g.id === timer.selectedGoalId);
  if (timer.activeFocus) {
    const title = timer.goals.find((g) => g.id === timer.activeFocus?.goalId)?.title ?? timer.activeFocus.goalTitle;
    return <View style={s.picker}><Text style={s.eyebrow}>{timer.status === 'paused' ? 'READY WHEN YOU ARE' : 'FOCUSING ON'}</Text><Text style={s.pickerTitle}>{title ?? 'Just a little time to focus'}</Text></View>;
  }
  if (!options.length) return <Pressable accessibilityRole="button" disabled={!hydrated} onPress={onAddGoal}
    style={({ pressed }) => [s.optionalGoal, pressed && ui.pressed, !hydrated && ui.disabled]}>
    <Text style={s.link}>Add an optional goal</Text>
  </Pressable>;
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
    <Text style={s.title}>Did you finish your goal?</Text><Text style={s.reviewGoal}>{goal?.title ?? session.goalTitle}</Text>
    <View style={s.reviewActions}><Button winter label="Finished!" onPress={() => reviewSession(session.id, true)} /><Button winter label="Still working" variant="secondary" onPress={() => reviewSession(session.id, false)} /></View>
    <Text style={s.helper}>Either way, your focus time counts.</Text>
  </View>;
}

export function DailyFocusSummary() {
  const { profile }=useStudyProfile();
  const { timer, today } = usePomodoro();
  const summary = dailySummary(timer, today, Date.now(), timer.endAt);
  const minutes = Math.floor(summary.focusMs / 60_000);
  const time = minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`;
  return <View style={s.summary}>
    <View style={s.rowBetween}>
      <Text accessibilityRole="header" style={[s.title, s.flex]}>Today’s progress</Text>
      <Text style={s.summaryLabel}>{minutes} / {profile.target} min</Text>
    </View>
    <ProgressBar progress={minutes / profile.target} label="Daily focus target" tone="winter" />
    <View style={s.summaryRow}>
      {[[time, 'Focused'], [String(summary.sessions), 'Sessions'], [summary.goalsTotal ? `${summary.goalsCompleted}/${summary.goalsTotal}` : '0', 'Goals done']].map(([value, label]) =>
        <View key={label} style={s.summaryStat}><Text style={s.summaryValue}>{value}</Text><Text style={s.summaryLabel}>{label}</Text></View>)}
    </View>
  </View>;
}

const s = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 }, row: { flexDirection: 'row', alignItems: 'center' }, rowBetween: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  card: { ...ui.card, padding: space.md, backgroundColor: todayColors.paper, borderColor: todayColors.line },
  control: { backgroundColor: todayColors.wash, borderColor: todayColors.line },
  optionalGoal: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { ...type.eyebrow, color: todayColors.link }, title: { ...type.heading, color: todayColors.ink },
  progress: { ...type.caption, color: todayColors.link }, helper: { ...type.caption, color: todayColors.muted }, empty: { ...type.body, color: todayColors.muted },
  goal: { borderBottomWidth: 1, borderBottomColor: todayColors.line, paddingVertical: 5 }, goalTitle: { color: todayColors.ink, fontSize: 14, lineHeight: 21 }, done: { color: todayColors.muted, textDecorationLine: 'line-through' },
  iconButton: { width: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }, checkbox: { width: 23, height: 23, borderRadius: 8, borderWidth: 1.5, borderColor: todayColors.muted, backgroundColor: todayColors.wash, alignItems: 'center', justifyContent: 'center' }, checked: { backgroundColor: todayColors.link, borderColor: todayColors.link }, check: { color: todayColors.onPrimary, fontSize: 15, fontWeight: '800' },
  more: { color: todayColors.muted, fontSize: 22, fontWeight: '700' }, sessionNote: { color: todayColors.muted, fontSize: 10, marginTop: 3 }, menu: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end' }, textButton: { minHeight: 44, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' }, link: { color: todayColors.link, fontSize: 12, fontWeight: '700' }, mutedButton: { color: todayColors.muted, fontSize: 12 }, deleteText: { color: '#A27065', fontSize: 12 }, disabledText: { color: todayColors.muted, fontSize: 12 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }, input: { ...ui.field, paddingVertical: space.sm, backgroundColor: todayColors.snow, borderColor: todayColors.line, color: todayColors.ink }, disabled: { opacity: .48 }, editActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  carrySection: { paddingTop: 14, marginTop: 12, borderTopWidth: 1, borderTopColor: todayColors.line }, smallTitle: { color: todayColors.ink, fontSize: 13, fontWeight: '700' }, carryRow: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingTop: 5 }, saveError: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  picker: { marginTop: space.xs, padding: space.sm, backgroundColor: todayColors.wash, borderRadius: 14 }, pickerButton: { flexDirection: 'row', alignItems: 'center', minHeight: 44, gap: 8 }, pickerTitle: { color: todayColors.link, fontSize: 13, lineHeight: 18, fontWeight: '600', marginTop: 5 }, chevron: { color: todayColors.link, fontSize: 21 }, goalOptions: { maxHeight: 220, marginTop: 7 }, option: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingVertical: 8, borderTopWidth: 1, borderTopColor: todayColors.line }, radio: { width: 17, height: 17, borderRadius: 9, borderWidth: 1.5, borderColor: todayColors.muted }, radioSelected: { borderWidth: 5, borderColor: todayColors.link },
  review: { ...ui.card, padding: space.md, backgroundColor: todayColors.paper, borderColor: todayColors.line, gap: space.sm }, reviewGoal: { color: todayColors.ink, fontSize: 14, lineHeight: 21, marginTop: 9 }, reviewActions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  summary: { ...ui.card, padding: space.md, backgroundColor: todayColors.paper, borderColor: todayColors.line, gap: space.sm }, summaryRow: { flexDirection: 'row', marginTop: space.xs }, summaryStat: { flex: 1, alignItems: 'center' }, summaryValue: { ...type.title, color: todayColors.link }, summaryLabel: { ...type.caption, color: todayColors.muted },
  reaction: { flexDirection: 'row', alignItems: 'center', padding: 9, borderRadius: radii.card, backgroundColor: todayColors.wash, marginBottom: 12 }, reactionTitle: { color: todayColors.link, fontSize: 15, lineHeight: 21, fontWeight: '800' },
  celebrationOverlay: { position: 'absolute', bottom: 4, left: 14, right: 14, zIndex: 20, boxShadow: '0px 8px 24px #27384B22', borderRadius: radii.card },
});
