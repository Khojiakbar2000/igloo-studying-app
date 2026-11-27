import { Overlay } from '../ui/Overlay';
import { colors, type, ui } from '../theme';
import React, { useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { studyMilestones } from '../awards/progression';
import { dailySummary, localDateKey, studyStreak } from '../state/dailyGoals';
import { usePomodoro } from '../state/PomodoroContext';
import { useHomeMotionState } from '../home/useHomeMotion';
import { useStudyProfile } from './ProfileProvider';
import { BABY, StoryArt } from './StoryArt';
import { companionName } from './profile';
import { StoryButton } from './Preferences';

export function FirstStudyDay({ enabled, onExplore }: { enabled: boolean; onExplore: () => void }) {
  const { timer, today }=usePomodoro();
  const { profile, ready, update }=useStudyProfile();
  const { reduced, active }=useHomeMotionState(enabled);
  const { verifiedDays } = useMemo(() => studyMilestones(timer.sessions), [timer.sessions]);
  const [widget,setWidget]=useState(false);
  const first = verifiedDays[0];
  if (!ready || !profile.completed || profile.firstDaySeen || !first || !active
    || (timer.status !== 'idle' && timer.mode === 'focus')) return null;

  const anchor = first===today ? today : first;
  const [year,month,day] = anchor.split('-').map(Number);
  const weeks = Array.from({length:7},(_,index)=>new Date(year,month-1,day-6+index,12));
  const focused = Math.floor(dailySummary(timer, today).focusMs / 60_000);
  const { current: streak } = studyStreak(verifiedDays, today);
  return <Overlay transparent visible animationType={reduced?'none':'fade'} onRequestClose={()=>update({firstDaySeen:true})}>
    <View style={styles.shade}>
      <View accessibilityViewIsModal style={styles.panel}>
        {widget ? <>
          <Text accessibilityRole="header" style={styles.title}>Take your study buddy everywhere!</Text>
          <View style={styles.widget}>
            <Image accessible={false} source={BABY} resizeMode="contain" style={styles.widgetArt} />
            <View style={styles.widgetDetails}>
              <Text style={styles.widgetName}>{companionName(profile)}</Text>
              <Text style={styles.widgetProgress}>{focused} / {profile.target} minutes today</Text>
              <Text style={styles.widgetProgress}>{streak} {streak===1?'day':'days'} of study in a row</Text>
              <StoryButton quiet label="Open Igloo" onPress={()=>{update({firstDaySeen:true});onExplore();}} />
            </View>
          </View>
          <Text style={styles.subtitle}>Widget preview. Installation isn’t available in this build.</Text>
          <StoryButton label="Maybe later" onPress={()=>update({firstDaySeen:true})} />
        </> : <>
        <StoryArt clip="joy" small />
        <Text accessibilityRole="header" style={styles.title}>1 DAY STREAK!</Text>
        <Text style={styles.subtitle}>Your first day of studying together!</Text>
        <View style={styles.calendar}>{weeks.map(date=>{
          const key = localDateKey(date);
          const done=verifiedDays.includes(key);
          const label=date.toLocaleDateString(undefined,{weekday:'short'});
          return <View key={key} accessibilityLabel={`${label}, ${done?'completed study':'no completed study'}`} style={[styles.day,done&&styles.done]}>
            <Text style={styles.dayText}>{label.slice(0,3)}</Text><Text style={styles.dateText}>{done?'✓':date.getDate()}</Text>
          </View>;
        })}</View>
        <StoryButton label="Let’s go!" onPress={()=>update({firstDaySeen:true})} />
        <StoryButton label="See widget preview" quiet onPress={()=>setWidget(true)} />
        </>}
      </View>
    </View>
  </Overlay>;
}
const styles=StyleSheet.create({
  shade:{ ...ui.shade, backgroundColor: 'transparent' },
  panel:{ ...ui.dialog, padding:14, gap:10 },
  title:{ ...type.heading, color: colors.ink, textAlign:'center' },
  subtitle:{color:colors.ink,fontSize:15,textAlign:'center'},
  widget:{flexDirection:'row',alignItems:'center',backgroundColor:colors.ice,borderRadius:17,padding:8,gap:7},
  widgetArt:{width:84,height:98},widgetDetails:{flex:1,gap:4},widgetName:{color:colors.ink,fontWeight:'900',fontSize:17},
  widgetProgress:{color:colors.link,fontSize:13},
  calendar:{flexDirection:'row',justifyContent:'space-between',gap:3},
  day:{flex:1,alignItems:'center',paddingVertical:7,backgroundColor:colors.ice,borderRadius:8},done:{backgroundColor:colors.gold},
  dayText:{color:colors.ink,fontSize:10,fontWeight:'700'},dateText:{color:colors.ink,fontSize:14,fontWeight:'800',marginTop:3},
});
