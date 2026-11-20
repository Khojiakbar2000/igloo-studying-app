import React, { useEffect, useRef, useState } from 'react';
import { BackHandler, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { useAmbientSound } from '../ambient/AmbientSoundProvider';
import { ReminderPicker, StudyPlanSettings, TopicChoices } from '../onboarding/Preferences';
import { AGE_RANGES, companionName, TARGETS, type DailyTarget, type Profile } from '../onboarding/profile';
import { useStudyProfile } from '../onboarding/ProfileProvider';
import { supportsReminders } from '../onboarding/reminders';
import { usePomodoro } from '../state/PomodoroContext';
import { ProfileIcon } from './ProfileIcon';
import { palette, styles as s } from './profileStyles';

const titles = {
  menu: 'Settings', focus: 'Focus preferences', topics: 'Study categories', plan: 'Study plan',
  reminders: 'Reminders', sounds: 'Ambient sounds', penguin: 'Penguin name', room: 'Room preferences',
  details: 'Profile details', privacy: 'Privacy', about: 'About Igloo',
} as const;
export type SettingsPage = keyof typeof titles;

type Props = {
  page: SettingsPage; setPage: (page: SettingsPage) => void; onBack: () => void;
  onWardrobe: () => void; onAccessories: () => void; onIgloo: () => void; onHelp: () => void;
  onPreviewOnboarding?: () => void; openedFromMenu: boolean;
};

export function ProfileSettings({ page, setPage, onBack, onWardrobe, onAccessories, onIgloo, onHelp, onPreviewOnboarding, openedFromMenu }: Props) {
  const { profile, update, error } = useStudyProfile();
  const { timer, setFocusMinutes, setSnowfall, setFurnitureSounds } = usePomodoro();
  const ambient = useAmbientSound();
  const [reminderBusy, setReminderBusy] = useState(false);
  const backButton = useRef<React.ElementRef<typeof Pressable>>(null);
  const backToDashboard = page === 'menu' || !openedFromMenu;
  const back = () => {
    if (reminderBusy && page === 'reminders') return;
    if (backToDashboard) onBack();
    else setPage('menu');
  };
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { back(); return true; });
    return () => subscription.remove();
  }, [page, reminderBusy, onBack, setPage, backToDashboard]);
  useEffect(() => { backButton.current?.focus(); }, [page]);

  const open = (id: SettingsPage) => () => setPage(id);
  const durationOptions = [...new Set([15, 25, 45, 50, 60, timer.focusMinutes])].sort((a, b) => a - b);
  const time = [profile.reminder.hour, profile.reminder.minute].map(value => String(value).padStart(2, '0')).join(':');

  return <ScrollView key={page} style={s.settingsOverlay} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
    <View style={s.settingsHeading}>
      <Pressable ref={backButton} accessibilityRole="button" accessibilityLabel={backToDashboard ? 'Back to You' : 'Back to settings'}
        onPress={back} disabled={reminderBusy && page === 'reminders'} style={({ pressed }) => [s.backButton, pressed && s.pressed]}>
        <ProfileIcon name="back" />
      </Pressable>
      <Text accessibilityRole="header" style={s.settingsTitle}>{titles[page]}</Text>
    </View>

    {page === 'menu' && <>
      <SettingGroup title="Study" rows={[
        ['Focus preferences', `${profile.target} min daily goal`, open('focus')],
        ['Study categories', profile.topics.length ? `${profile.topics.length} selected` : undefined, open('topics')],
        ['Study plan', 'Edit your seven-day checklist', open('plan')],
        ['Reminders', supportsReminders ? profile.reminder.enabled ? time : 'Off' : 'iOS and Android', open('reminders')],
        ['Ambient sounds', undefined, open('sounds')],
      ]} />
      <SettingGroup title="Personalization" rows={[
        ['Penguin name', companionName(profile), open('penguin')],
        ['Wardrobe', undefined, onWardrobe],
        ['Scarves, glasses & headphones', undefined, onAccessories],
        ['Room preferences', undefined, open('room')],
      ]} />
      <SettingGroup title="Account" rows={[
        ['Profile details', 'On-device profile', open('details')],
        ['Privacy', undefined, open('privacy')],
      ]} />
      <SettingGroup title="Support" rows={[
        ['Igloo help', 'Room tour and how rewards work', onHelp],
        ['About Igloo', undefined, open('about')],
        ...(onPreviewOnboarding ? [['Preview onboarding', undefined, onPreviewOnboarding] as [string, undefined, () => void]] : []),
      ]} />
    </>}

    {page === 'focus' && <>
      <View style={s.card}><Text style={s.sectionTitle}>Daily study goal</Text>
        <ChoiceRow values={TARGETS} selected={profile.target} label={n => `${n} min`} choose={(target: DailyTarget) => update({ target })} />
      </View>
      <View style={s.card}><Text style={s.sectionTitle}>Preferred focus duration</Text>
        <ChoiceRow values={durationOptions} selected={timer.focusMinutes} label={n => `${n} min`} choose={minutes => setFocusMinutes(minutes, true)} />
      </View>
    </>}

    {page === 'topics' && <View style={s.card}><TopicChoices draft={profile} change={update} /></View>}
    {page === 'plan' && <View style={s.card}><StudyPlanSettings /></View>}
    {page === 'reminders' && <View style={s.card}><ReminderPicker value={profile.reminder} onUpdate={reminder => update({ reminder })} onBusy={setReminderBusy} /></View>}
    {page === 'sounds' && <View style={s.card}>
      <Text style={s.body}>Choose your sound mix, volume, and playback during breaks.</Text>
      <Pressable accessibilityRole="button" onPress={() => { ambient.unlockAudio(); ambient.setOpen(true); }} style={s.primary}>
        <Text style={s.primaryText}>Open sound mixer</Text><ProfileIcon name="next" size={15} color={palette.cream} />
      </Pressable>
    </View>}
    {page === 'penguin' && <View style={s.card}><NameInput label="Penguin name" value={profile.penguinName} onSave={penguinName => update({ penguinName: penguinName || 'Pip' })} /></View>}
    {page === 'room' && <View style={s.card}>
      <RoomSwitch label="Snowfall" value={timer.home.snowfall} onChange={setSnowfall} />
      <RoomSwitch label="Furniture sounds" value={timer.home.furnitureSounds} onChange={setFurnitureSounds} />
      <Pressable accessibilityRole="button" onPress={onIgloo} style={s.primary}><Text style={s.primaryText}>Open My Igloo</Text></Pressable>
    </View>}
    {page === 'details' && <View style={s.card}>
      <NameInput label="Your name" value={profile.userName} onSave={userName => update({ userName })} />
      <Text style={s.settingLabel}>Age range · optional</Text>
      <ChoiceRow values={[...AGE_RANGES, null]} selected={profile.age} label={(age: Profile['age']) => age ?? 'Prefer not to say'} choose={age => update({ age })} />
    </View>}
    {page === 'privacy' && <View style={s.card}><Text style={s.body}>Igloo stores your profile, study history, and room progress on this device. Browser previews save progress in the current browser.</Text></View>}
    {page === 'about' && <View style={s.card}><Text style={s.sectionTitle}>IGLOO</Text><Text style={s.body}>A cozy focus timer where study sessions build a little home for you and your penguin.</Text></View>}
    {error && <Text accessibilityLiveRegion="polite" style={s.body}>Your profile couldn’t save. Try changing the preference again.</Text>}
  </ScrollView>;
}

function SettingGroup({ title, rows }: { title: string; rows: [string, string | undefined, () => void][] }) {
  return <View>
    <Text accessibilityRole="header" style={s.eyebrow}>{title.toUpperCase()}</Text>
    <View style={s.settingList}>{rows.map(([label, value, onPress], index) =>
      <Pressable key={label} accessibilityRole="button" onPress={onPress}
        style={({ pressed }) => [s.settingRow, index > 0 && s.settingRowDivider, pressed && s.pressed]}>
        <View style={s.headingCopy}><Text style={s.settingLabel}>{label}</Text>{value && <Text style={s.settingValue}>{value}</Text>}</View>
        <ProfileIcon name="next" size={16} />
      </Pressable>)}</View>
  </View>;
}

function ChoiceRow<T>({ values, selected, label, choose }: {
  values: readonly T[]; selected: T; label: (value: T) => string; choose: (value: T) => void;
}) {
  return <View style={s.choiceRow} accessibilityRole="radiogroup">
    {values.map(value => <Pressable key={String(value)} accessibilityRole="radio" accessibilityState={{ checked: value === selected }}
      onPress={() => choose(value)} style={[s.choice, value === selected && s.choiceSelected]}>
      <Text style={s.choiceLabel}>{label(value)}</Text>
    </Pressable>)}
  </View>;
}

function NameInput({ label, value, onSave }: { label: string; value: string; onSave: (value: string) => void }) {
  const [draft, setDraft] = useState(value);
  const save = () => {
    const next = draft.trim();
    if (next !== value) onSave(next);
  };
  return <>
    <Text style={s.settingLabel}>{label}</Text>
    <TextInput accessibilityLabel={label} value={draft} onChangeText={setDraft} onBlur={save} onSubmitEditing={save}
      maxLength={24} autoCapitalize="words" returnKeyType="done" style={s.input} placeholderTextColor={palette.muted} />
    {draft.trim() !== value && <Pressable accessibilityRole="button" onPress={save} style={s.primary}><Text style={s.primaryText}>Save name</Text></Pressable>}
  </>;
}

function RoomSwitch({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return <View style={s.settingRow}>
    <Text style={[s.settingLabel, s.headingCopy]}>{label}</Text>
    <Switch accessibilityLabel={label} value={value} onValueChange={onChange} trackColor={{ false: '#b5a8c8', true: '#8c72b5' }} />
  </View>;
}
