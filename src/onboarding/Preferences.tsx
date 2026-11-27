import { Button } from '../ui/Controls';
import { colors, type, ui } from '../theme';
import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { localDateKey } from '../state/dailyGoals';
import { enableReminder, disableReminder, supportsReminders } from './reminders';
import { buildPlan, planDates, TARGETS, TOPICS, type DailyTarget, type Profile, type Reminder } from './profile';
import { PROPS } from './StoryArt';
import { useStudyProfile } from './ProfileProvider';
import { usePomodoro } from '../state/PomodoroContext';

export function StoryButton({ label, onPress, quiet, disabled }: { label: string; onPress: () => void; quiet?: boolean; disabled?: boolean }) {
  return <Button label={label} onPress={onPress} disabled={disabled} variant={quiet ? 'secondary' : 'primary'} />;
}
export function Choice({ label, description, image, checked, onPress }: { label:string; description?:string; image?:number; checked:boolean; onPress:()=>void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected:checked }} accessibilityLabel={label} onPress={onPress}
    style={({pressed}) => [styles.choice, checked && styles.checked, pressed && styles.pressed]}>
    {image && <Image accessible={false} source={image} style={styles.icon} resizeMode="contain" />}
    <View style={styles.choiceContent}><Text style={styles.label}>{label}</Text>{description && <Text style={styles.detail}>{description}</Text>}</View>
    {checked && <Text style={styles.check}>✓</Text>}
  </Pressable>;
}
export function TopicChoices({ draft, change }: { draft:Profile; change:(patch:Partial<Profile>)=>void }) {
  return <View style={styles.grid}>
    {TOPICS.map((topic,index) => <Choice key={topic} label={topic} image={PROPS[index]} checked={draft.topics.includes(topic)}
      onPress={() => {
        const topics = draft.topics.includes(topic) ? draft.topics.filter(item => item !== topic) : [...draft.topics, topic];
        const primary = draft.primary && topics.includes(draft.primary) ? draft.primary : topics[0] ?? null;
        change({ topics, primary, ...(primary !== draft.primary ? { plan: [] } : {}) });
      }} />)}
  </View>;
}
export function TargetChoices({ target, onSelect, descriptions = false }: { target:DailyTarget; onSelect:(target:DailyTarget)=>void; descriptions?:boolean }) {
  return <View style={styles.grid}>{TARGETS.map((value,index) => <Choice key={value} label={`${value} minutes`}
    description={descriptions ? ['A little progress','Building a habit','Finding my rhythm','Deep focus'][index] : undefined}
    checked={value===target} onPress={() => onSelect(value)} />)}</View>;
}
export function PlanEditor({ draft, change, showTarget = true }: { draft:Profile; change:(patch:Partial<Profile>)=>void; showTarget?:boolean }) {
  const plan = draft.plan.length === 7 ? draft.plan : buildPlan(draft.primary,draft.age);
  const begin = draft.planStart ?? localDateKey();
  return <View style={styles.stack}>
    {draft.topics.length > 1 && <>
      <Text style={styles.label}>Primary focus</Text>
      <View style={styles.grid}>{draft.topics.map(topic => <Choice key={topic} label={topic} checked={draft.primary===topic}
        onPress={() => change({primary:topic,plan:buildPlan(topic,draft.age)})} />)}</View>
    </>}
    {showTarget && <>
      <Text style={styles.label}>Daily focus target</Text>
      <TargetChoices target={draft.target} onSelect={target => change({ target })} />
    </>}
    <Text style={styles.detail}>Edit any activity. Leave a day blank to keep it free.</Text>
    {planDates(begin).map((date,index) => {
      const [year,month,day]=date.split('-').map(Number);
      const dayLabel=new Date(year,month-1,day,12).toLocaleDateString(undefined,{weekday:'long'});
      return <View key={date} style={styles.planRow}>
        <Text style={styles.day}>{dayLabel}</Text>
        <TextInput accessibilityLabel={`${dayLabel} activity`} value={plan[index]} onChangeText={value => change({plan:plan.map((task,i)=>i===index?value:task)})}
          maxLength={120} placeholder="Rest day" placeholderTextColor={colors.link} style={styles.input} />
      </View>;
    })}
  </View>;
}
const presets = [['Morning',9],['Afternoon',14],['Evening',19]] as const;
const toClock = ({hour,minute}: Reminder) => `${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`;
export function ReminderPicker({ value, onUpdate, onEnabled, preview = false, onBusy }: {
  value:Reminder; onUpdate:(reminder:Reminder)=>void; onEnabled?:()=>void; preview?:boolean; onBusy?:(busy:boolean)=>void;
}) {
  const [custom,setCustom]=useState(!presets.some(([,hour])=>hour===value.hour&&value.minute===0));
  const [time,setTime]=useState(toClock(value));
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState('');
  const choose = (hour:number) => {setCustom(false);setTime(toClock({hour,minute:0,enabled:false}));};
  const enable = async () => {
    const match=time.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
    if (!match) {setNotice('Enter a time like 16:30.');return;}
    const next={hour:Number(match[1]),minute:Number(match[2]),enabled:true};
    setBusy(true);onBusy?.(true);
    try {
      const ok=preview || await enableReminder(next);
      if (!ok) {setNotice('Notifications are off. You can allow them in device settings and try again.');return;}
      onUpdate(next);onEnabled?.();setNotice(preview?'Preview only.':'Daily reminder saved.');
    } catch { setNotice('Couldn’t schedule the reminder. You can try again or skip.'); }
    finally {setBusy(false);onBusy?.(false);}
  };
  if (!supportsReminders && !preview) return <Text style={styles.detail}>Daily reminders are available in the iOS and Android apps.</Text>;
  return <View style={styles.stack}>
    <View style={styles.grid}>{presets.map(([label,hour])=><Choice key={label} label={label}
      description={toClock({hour,minute:0,enabled:false})} checked={!custom&&time===toClock({hour,minute:0,enabled:false})} onPress={()=>choose(hour)} />)}
      <Choice label="Custom time" checked={custom} onPress={()=>setCustom(true)} />
    </View>
    {custom && <TextInput accessibilityLabel="Custom reminder time" placeholder="HH:MM" placeholderTextColor={colors.link} value={time}
      style={styles.input} onChangeText={setTime} autoCorrect={false} maxLength={5} />}
    <StoryButton disabled={busy} label={busy?'Saving…':value.enabled?'Update reminder':'Remind me!'} onPress={()=>void enable()} />
    {value.enabled && <StoryButton disabled={busy} quiet label="Turn off reminders" onPress={()=>{
      setBusy(true);onBusy?.(true);
      void (preview?Promise.resolve():disableReminder()).then(()=>{onUpdate({...value,enabled:false});setNotice('Reminders are off.');})
        .catch(()=>setNotice('Couldn’t turn off reminders. Try again.'))
        .finally(()=>{setBusy(false);onBusy?.(false);});
    }} />}
    {!!notice&&<Text accessibilityLiveRegion="polite" style={styles.detail}>{notice}</Text>}
  </View>;
}
export function StudyPlanSettings() {
  const { profile, update } = useStudyProfile();
  const { importStudyPlan } = usePomodoro();
  const [notice, setNotice] = useState('');
  return <View style={styles.stack}>
    <PlanEditor draft={profile} change={update} showTarget={false} />
    <StoryButton label="Add missing days to checklist" quiet onPress={() => {
      const plan = profile.plan.length === 7 ? profile.plan : buildPlan(profile.primary, profile.age);
      const planStart = profile.planStart ?? localDateKey();
      update({ plan, planStart, usePlan: true });
      importStudyPlan(plan, planStart);
      setNotice('Plan saved. Existing checklist entries stay as you edited them.');
    }} />
    {!!notice && <Text accessibilityLiveRegion="polite" style={styles.detail}>{notice}</Text>}
  </View>;
}
const styles=StyleSheet.create({
  stack:{gap:9}, grid:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',gap:7},
  button:{minHeight:50,backgroundColor:colors.link,justifyContent:'center',alignItems:'center',borderRadius:16,borderBottomWidth:3,borderColor:colors.primaryPressed,paddingHorizontal:13},
  quiet:{backgroundColor:colors.cream,borderColor:colors.line,borderBottomWidth:1},
  buttonText:{color:colors.cream,fontSize:15,fontWeight:'800',textAlign:'center'},dark:{color:colors.link},
  pressed:{opacity:.76,transform:[{translateY:1}]},disabled:{opacity:.52},
  choice:{flexBasis:'47.8%',flexGrow:1,minHeight:54,flexDirection:'row',alignItems:'center',gap:6,borderRadius:14,borderWidth:1,borderColor:colors.line,backgroundColor:colors.cream,paddingHorizontal:9,paddingVertical:7},
  checked:{...ui.selected},choiceContent:{flex:1},icon:{width:27,height:29},
  label:{...type.label,color:colors.ink},detail:{...type.caption,color:colors.muted},check:{color:colors.link,fontWeight:'800'},
  planRow:{gap:4},day:{fontSize:12,fontWeight:'800',color:colors.ink},input:{...ui.field,paddingVertical:8},
});
