import { Chevron, IconButton } from '../ui/Controls';
import { colors, metrics, space, type, ui } from '../theme';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import { useAmbientSound } from '../ambient/AmbientSoundProvider';
import { usePomodoro } from '../state/PomodoroContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { useHomeMotionState } from '../home/useHomeMotion';
import { HomeLottie } from '../components/HomeLottie';
import { gardenMotion } from '../garden/motion';
import { localDateKey } from '../state/dailyGoals';
import { GIFT_ART } from '../gifts/art';
import { EggHatchingArt, SNOWFIELD, StoryArt, type Clip } from './StoryArt';
import { Choice, PlanEditor, ReminderPicker, StoryButton, TargetChoices, TopicChoices } from './Preferences';
import { BuildingProgress, DiscoverHome, FirstBlock, SnowballDiscovery } from './OriginalStoryBeats';
import { useStudyProfile } from './ProfileProvider';
import { AGE_RANGES, BEATS, CHAPTER, REFERRALS, buildPlan, companionName, restoreProfile, type Beat, type Profile } from './profile';

export type PreviewStage = Beat | 'onboarding' | 'egg' | 'hatching' | 'celebration' | 'penguin-name' | 'personality' | 'activity' | 'build' | 'progress' | 'duration' | 'commitment' | 'focus' | 'completion' | null;
const previewAliases: Partial<Record<NonNullable<PreviewStage>,Beat>> = {
  onboarding:'welcome',egg:'hatch',hatching:'hatch',celebration:'hatched','penguin-name':'name',
  personality:'curiosity',activity:'topics',build:'tutorial',commitment:'celebrate',focus:'home',completion:'celebrate',
};
const peep = require('../../assets/audio/igloo-window/pip-peep.wav');
const snow = gardenMotion('snow','#F8FCFF');
const roomArt = require('../../assets/environments/study-together/rooms/igloo-thumb.jpg');
const outfitArt = require('../../assets/wardrobe/items/royal-thumb.png');

export function OnboardingFlow({ previewStage = null, onComplete }: {
  previewStage?: PreviewStage; onComplete: (destination: 'focus' | 'igloo', profile: Profile) => void;
}) {
  const stored = useStudyProfile();
  const sound=useAudioPlayer(peep);
  const {prefs}=useAmbientSound();
  const {timer}=usePomodoro();
  const celebrationSound=()=>{
    if(prefs.muted||!timer.home.furnitureSounds||prefs.master<=0)return;
    sound.volume=prefs.master*.17;
    void sound.seekTo(0).then(()=>sound.play()).catch(()=>undefined);
  };
  const preview = __DEV__ && previewStage !== null;
  const [previewDraft,setPreviewDraft]=useState<Profile>(() => {
    const step=previewStage ? previewAliases[previewStage] ?? (previewStage as Beat) : 'welcome';
    return {...restoreProfile(null),step,hatchTaps:BEATS.indexOf(step)>1?3:0};
  });
  const draft=preview?previewDraft:stored.profile;
  const change=useCallback((patch:Partial<Profile>)=>{
    if (preview) setPreviewDraft(current=>({...current,...patch}));
    else stored.update(patch);
  },[preview,stored.update]);
  const { height }=useWindowDimensions();
  const {motion,reduced}=useHomeMotionState();
  const preferReduced=useReducedMotion();
  const minimal=reduced||preferReduced;
  const scroll=useRef<ScrollView>(null);
  const step=draft.step;
  const index=BEATS.indexOf(step);
  const total=10;
  const chapter=CHAPTER[step];
  const name=companionName(draft);
  const [clip,setClip]=useState<Clip>();
  const [replay,setReplay]=useState(0);
  const [busy,setBusy]=useState(false);
  const [destination,setDestination]=useState<'focus'|'igloo'|null>(null);
  const [notice,setNotice]=useState('');
  const lock=useRef(false);
  const finishing=useRef(false);
  const nameReactionTimer=useRef<ReturnType<typeof setTimeout> | null>(null);

  const move=useCallback((next:Beat)=>{
    if(nameReactionTimer.current){clearTimeout(nameReactionTimer.current);nameReactionTimer.current=null;}
    setClip(undefined);setReplay(0);setNotice('');lock.current=false;change({step:next});
  },[change]);
  const back=useCallback(()=>{
    if (busy||destination) return true;
    if(index<=0)return false;
    move(BEATS[index-1]);
    return true;
  },[busy,destination,index,move]);
  useEffect(()=>()=>{if(nameReactionTimer.current)clearTimeout(nameReactionTimer.current);},[]);
  useEffect(()=>{
    if(Platform.OS==='web')return;
    const subscription=BackHandler.addEventListener('hardwareBackPress',back);
    return ()=>subscription.remove();
  },[back]);
  useEffect(()=>{scroll.current?.scrollTo({y:0,animated:false});},[step]);

  const play=(next:Clip)=>{setClip(next);setReplay(value=>value+1);};
  const hatch=()=>{
    if (lock.current || draft.hatchTaps>=3) return;
    const count=draft.hatchTaps+1;
    change({hatchTaps:count});
    if(count===3)celebrationSound();
    if (!minimal) {lock.current=true;play(count===1?'crack':count===2?'shake':'hatch');}
  };
  const eggDone=useCallback(()=>{setClip(undefined);lock.current=false;},[]);
  const finish=useCallback(async (target:'focus'|'igloo')=>{
    if(finishing.current)return;
    finishing.current=true;
    const completed={...draft,completed:true};
    if (!preview && !await stored.save(completed)) {
      finishing.current=false;setDestination(null);setBusy(false);setNotice('Couldn’t save your setup. Try again.');
      return;
    }
    onComplete(target,completed);
  },[draft,onComplete,preview,stored.save]);
  useEffect(()=>{
    if(!minimal)return;
    if(destination)void finish(destination);
    else if (step==='hatch'&&clip) eggDone();
    else if (step==='name'&&clip==='name') move('heart');
  },[clip,destination,eggDone,finish,minimal,move,step]);
  const enter=(target:'focus'|'igloo')=>{
    if(busy||destination)return;
    setBusy(true);setDestination(target);
    if (!minimal) play('enter');
  };
  const goPlan=()=>{change({step:'plan',planStart:draft.planStart??localDateKey()});};
  const savePlan=(include:boolean)=>{
    change({usePlan:include,plan:include?(draft.plan.length===7?draft.plan:buildPlan(draft.primary,draft.age)):draft.plan,
      ...(include ? {planStart:draft.planStart??localDateKey()} : {}),step:'celebrate'});
  };

  let title='';
  let subtitle='';
  let scene:React.ReactNode=null;
  let fields:React.ReactNode=null;
  let footer:React.ReactNode=null;
  const next=(label:string,beat:Beat)=><StoryButton label={label} onPress={()=>move(beat)} />;
  const small=height<720;
  switch (step) {
    case 'welcome':
      title='Every great journey starts with a little friend.';
      subtitle='Meet your new study companion.';
      scene=<View style={styles.snowScene}><StoryArt transparent hero small={small} emotion="encouraging" action="wave" />
        {motion&&<HomeLottie data={snow} active />}</View>;
      footer=next('Let’s begin!','hatch');
      break;
    case 'hatch': {
      const eggClip = clip === 'crack' || clip === 'shake' || clip === 'hatch' ? clip : undefined;
      const hatched=draft.hatchTaps===3&&!eggClip;
      title=hatched?'Hello, little one.':'Who’s inside?';
      subtitle=hatched?'Your study buddy is here.':eggClip ? 'Someone’s stirring…' : ['Tap the egg to say hello.','A tiny crack! Try another tap.','One more gentle tap.'][draft.hatchTaps];
      scene=<Pressable accessibilityRole={hatched ? undefined : 'button'} accessibilityLabel={hatched ? undefined : 'Tap egg'}
        accessible={!hatched} disabled={!!eggClip||hatched} onPress={hatch}>
        <EggHatchingArt clip={eggClip} taps={draft.hatchTaps} small={small} onFinish={eggDone} />
      </Pressable>;
      footer=hatched?next('Meet your penguin','hatched'):<StoryButton label={eggClip?'Hatching…':'Tap the egg'} disabled={!!eggClip} onPress={hatch} />;
      break;
    }
    case 'hatched':
      title='You hatched a penguin!';
      subtitle='Your little study buddy is ready to meet you.';
      scene=<StoryArt transparent clip="joy" small={small} emotion="excited" action="celebrate" />;
      footer=next('Say hello','greeting');
      break;
    case 'greeting':
      title='A new little friend!';
      subtitle='What should I call you? You can skip this.';
      scene=<StoryArt transparent small emotion="encouraging" action="wave" />;
      fields=<TextInput accessibilityLabel="Your name or nickname" style={styles.nameInput} value={draft.userName}
        placeholder="Your name or nickname" placeholderTextColor={colors.link} maxLength={24}
        onChangeText={userName=>change({userName})} />;
      footer=<>{next('Continue','name')}<StoryButton quiet label="Skip name" onPress={()=>{change({userName:''});move('name');}} /></>;
      break;
    case 'name':
      title='What would you like to name your penguin?';
      scene=<StoryArt transparent key={`${replay}-${clip??'idle'}`} clip={clip} small
        emotion={clip==='name'?'excited':draft.penguinName.trim()?'curious':'thinking'}
        action={clip==='name'?'celebrate':'react'} reactionKey={draft.penguinName}
        onFinish={()=>{if(clip==='name' && !nameReactionTimer.current){nameReactionTimer.current=setTimeout(()=>move('heart'),1500);}}} />;
      fields=<><View style={styles.choices}>{['Pip','Pipo','Mochi','Pebble','Bobo'].map(option=>
        <Choice key={option} label={option} checked={draft.penguinName===option} onPress={()=>change({penguinName:option})} />)}</View>
      <TextInput accessibilityLabel="Penguin name"  style={styles.nameInput} maxLength={24} selectTextOnFocus autoCapitalize="words"
        value={draft.penguinName} placeholder="Pip" placeholderTextColor={colors.muted} onChangeText={penguinName=>change({penguinName})}
        onSubmitEditing={()=>{if(!clip){change({penguinName:name});if(minimal)move('heart');else play('name');}}} /></>;
      footer=<StoryButton label="That’s their name!" disabled={clip==='name'} onPress={()=>{change({penguinName:name});if(minimal)move('heart');else play('name');}} />;
      break;
    case 'heart':
      title=`${name}? I love it!`;
      scene=<StoryArt transparent clip="heart" small={small} emotion="happy" action="celebrate" />;
      fields=<>
        <View style={styles.speech}><Text style={styles.speechText}>Every time you focus, we grow together!</Text></View>
        <Text style={styles.body}>Let’s build something wonderful, one study session at a time.</Text>
        <View style={styles.keepsakes}>{[GIFT_ART['room-5'],GIFT_ART['wear-0'],GIFT_ART['room-14']].map(art=>
          <Image key={art} source={art} resizeMode="contain" style={styles.keepsake} accessible={false} />)}</View>
        <Text style={styles.body}>Completed sessions help your Igloo grow. Your buddy is always happy to see you.</Text>
      </>;
      footer=next('Let’s grow together','curiosity');
      break;
    case 'curiosity':
      title='Curiosity is a kind of magic.';
      subtitle='A tiny snowball catches your penguin’s eye.';
      scene=<SnowballDiscovery />;
      footer=next('Keep exploring','age');
      break;
    case 'age':
      title='How old are you?';
      subtitle='Optional. Your age range can help suggest a starting plan.';
      scene=<StoryArt transparent small emotion={draft.age?'encouraging':'curious'} action="react" reactionKey={draft.age??'age'} />;
      fields=<View style={styles.choices}>{AGE_RANGES.map(age=><Choice key={age} label={age} checked={draft.age===age} onPress={()=>change({age})} />)}
        <Choice label="Prefer not to say" checked={!draft.age} onPress={()=>change({age:null})} /></View>;
      footer=next('Continue','topics');
      break;
    case 'topics':
      title='What are we learning together?';
      subtitle='Pick as many as you like.';
      scene=<StoryArt transparent key={replay} clip={clip??'notebook'} small emotion={draft.topics.length?'excited':'curious'} action="react" reactionKey={draft.topics.join('|')} />;
      fields=<TopicChoices draft={draft} change={patch=>{change(patch);if(!minimal)play('notebook');}} />;
      footer=<>{next('Continue','discovery')}<StoryButton quiet label="Skip for now" onPress={()=>{change({topics:[],primary:null,plan:[]});move('discovery');}} /></>;
      break;
    case 'discovery':
      title='Look what we could build!';
      subtitle='Our very own Igloo, one snowy block at a time.';
      scene=<DiscoverHome />;
      footer=next('Let’s build','tutorial');
      break;
    case 'tutorial':
      title='Can you help me?';
      subtitle='Drag the snow block onto the little foundation.';
      scene=<FirstBlock placed={draft.placedBlock} place={()=>change({placedBlock:true})} />;
      footer=next(draft.placedBlock?'See what we can build':'Continue without placing','progress');
      break;
    case 'progress':
      title='One session at a time, we’ll build it.';
      subtitle='Focus adds a little more. Tap a milestone to preview it.';
      scene=<BuildingProgress />;
      footer=next('Choose a session length','duration');
      break;
    case 'duration':
      title='How long should we start with?';
      subtitle='Pick a timer length that feels kind today.';
      scene=<StoryArt transparent key={replay} clip="clock" small emotion={draft.sessionMinutes===50?'focused':'encouraging'} action="celebrate" reactionKey={draft.sessionMinutes} />;
      fields=<View style={styles.choices}>{([15,25,50] as const).map((minutes,i)=><Choice key={minutes} label={`${minutes} minutes`}
        description={['A little start','Just right','Deep focus'][i]} checked={draft.sessionMinutes===minutes}
        onPress={()=>{change({sessionMinutes:minutes});setReplay(value=>value+1);}} />)}</View>;
      footer=next('Set session length','target');
      break;
    case 'target':
      title='How much time would you like to focus each day?';
      subtitle='Split your daily target into sessions that suit you.';
      scene=<StoryArt transparent prop="clock" small emotion="proud" action={replay ? 'celebrate' : 'react'} reactionKey={replay} />;
      fields=<TargetChoices target={draft.target} onSelect={target=>{change({target});setReplay(value=>value+1);}} descriptions />;
      footer=<StoryButton label="Set daily target" onPress={goPlan} />;
      break;
    case 'plan':
      title='Let’s make a little plan for you!';
      subtitle='Seven days of ideas. Make them yours before adding them to the checklist.';
      fields=<PlanEditor draft={draft} change={change} />;
      footer=<><StoryButton label="Save my plan" onPress={()=>savePlan(true)} /><StoryButton quiet label="Skip the plan" onPress={()=>savePlan(false)} /></>;
      break;
    case 'celebrate':
      title='YOU GOT THIS!';
      subtitle='One little step at a time. I’ll be right here!';
      scene=<StoryArt transparent hero small={small} emotion="excited" action="celebrate" />;
      fields=<View style={styles.speech}><Text style={styles.speechText}>We’ll start when you’re ready.</Text><Text style={styles.body}>No pressure. Just a little time together.</Text></View>;
      footer=<StoryButton label="Let’s do this!" onPress={()=>{celebrationSound();move('reminders');}} />;
      break;
    case 'reminders':
      title='Want me to remind you when it’s time to study?';
      subtitle='I’ll save you a cozy spot!';
      scene=<StoryArt transparent clip="clock" small emotion="sleepy" action="react" />;
      fields=<ReminderPicker value={draft.reminder} onUpdate={reminder=>change({reminder})} onEnabled={()=>move('premium')} onBusy={setBusy} preview={preview} />;
      footer=<StoryButton label={draft.reminder.enabled?'Continue':'Maybe later'} disabled={busy} quiet onPress={()=>move('premium')} />;
      break;
    case 'premium':
      title='Make your little world even more magical!';
      subtitle='A preview of the kinds of rooms and outfits you can explore in Igloo.';
      fields=<>
        <View style={styles.premiumArt}><Image source={roomArt} resizeMode="cover" style={styles.roomPreview} /><Image source={outfitArt} resizeMode="contain" style={styles.outfitPreview} /></View>
        <Text style={styles.body}>Premium is a preview. No subscription or free trial is available in this build.</Text>
        <Text style={styles.body}>Free includes the focus timer, study checklist, and your own Igloo.</Text>
      </>;
      footer=next('Continue with Free','referral');
      break;
    case 'referral':
      title='One last little question!';
      subtitle='How did you hear about Igloo?';
      scene=<StoryArt transparent small emotion={draft.referral?'happy':'playful'} action={draft.referral?'celebrate':'react'} reactionKey={draft.referral??'referral'} />;
      fields=<View style={styles.choices}>{REFERRALS.map(item=><Choice key={item} label={item} checked={draft.referral===item}
        onPress={()=>change({referral:item})} />)}</View>;
      footer=<><StoryButton label="Continue" disabled={!draft.referral} onPress={()=>move('home')} />
        <StoryButton quiet label="Skip" onPress={()=>{change({referral:null});move('home');}} /></>;
      break;
    case 'home':
      title='Welcome home!';
      subtitle=`Ready for your first study session with ${name}?`;
      scene=<StoryArt key={replay} clip={clip} exterior emotion="encouraging" action="wave" onFinish={()=>{if(destination)void finish(destination);}} />;
      footer=<><StoryButton label={busy?'Heading inside…':'Start Focusing'} disabled={busy} onPress={()=>enter('focus')} />
        <StoryButton label="Explore My Igloo" quiet disabled={busy} onPress={()=>enter('igloo')} /></>;
      break;
  }

  return <View style={styles.canvas}>
    <Image accessible={false} source={SNOWFIELD} resizeMode="cover" style={styles.snowfield} />
    <SafeAreaView edges={['top','bottom','left','right']} style={styles.safe}>
      <KeyboardAvoidingView style={styles.frame} behavior={Platform.OS==='ios'?'padding':undefined}>
        <View style={styles.header}>
          {index>0&&<IconButton label="Back to previous step" onPress={back} disabled={busy}><Chevron direction="back" /></IconButton>}
          <Text style={styles.wordmark}>IGLOO</Text>
          <Text style={styles.stepText}>{`CHAPTER ${chapter} OF ${total}`}</Text>
        </View>
        <View style={styles.progress} accessibilityRole="progressbar" accessibilityLabel="Onboarding progress" accessibilityValue={{ min:1,max:total,now:chapter }}>
          {Array.from({length:total},(_,i)=><View key={i} style={[styles.segment,i<chapter&&styles.segmentFilled]} />)}
        </View>
        <ScrollView ref={scroll} style={styles.scroller} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Animated.View key={step} entering={minimal?undefined:FadeInDown.duration(210)} style={styles.story}>
            <View style={styles.topCopy}>
              <Text accessibilityRole="header" style={[styles.title,step==='celebrate'&&styles.celebrate]}>{title}</Text>
              {!!subtitle&&<Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
            {scene}
            {fields}
          </Animated.View>
        </ScrollView>
        <View style={styles.footer}>
          {!!(notice||(!preview&&stored.error))&&<Text accessibilityLiveRegion="polite" style={styles.error}>{notice||'Your changes couldn’t be saved yet.'}</Text>}
          {footer}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </View>;
}

const styles=StyleSheet.create({
  canvas:{flex:1,backgroundColor:colors.ivory},safe:{flex:1,alignItems:'center',width:'100%',maxWidth:430,alignSelf:'center',backgroundColor:colors.ivory},
  snowfield:{...StyleSheet.absoluteFillObject,width:'100%',height:'100%'},
  frame:{flex:1,width:'100%',maxWidth:430,backgroundColor:'transparent'},
  header:{minHeight:metrics.header,flexDirection:'row',alignItems:'center',paddingHorizontal:space.lg,gap:space.sm},
  back:{width:44,height:44,alignItems:'center',justifyContent:'center',marginLeft:-10},
  backText:{fontSize:35,color:colors.link,marginTop:-3},wordmark:{color:colors.primary,fontSize:14,fontWeight:'900',letterSpacing:4,flex:1},
  stepText:{fontSize:12,color:colors.ink,fontWeight:'800',letterSpacing:1},
  progress:{flexDirection:'row',gap:4,paddingHorizontal:19,marginBottom:6},
  segment:{flex:1,height:4,borderRadius:4,backgroundColor:colors.line},segmentFilled:{backgroundColor:colors.blue},
  scroller:{flex:1},content:{flexGrow:1,paddingHorizontal:24,paddingTop:12,paddingBottom:15},story:{gap:11},
  snowScene:{position:'relative'},
  topCopy:{paddingTop:9,minHeight:70,gap:6},
  title:{...type.display,color:colors.ink},
  celebrate:{color:colors.goldInk},subtitle:{...type.body,color:colors.ink,maxWidth:325},
  body:{color:colors.ink,fontSize:14,lineHeight:20,textAlign:'center'},
  speech:{padding:11,borderRadius:15,backgroundColor:colors.ice,borderColor:colors.line,borderWidth:1},
  speechText:{textAlign:'center',fontSize:16,fontWeight:'700',color:colors.ink},
  keepsakes:{flexDirection:'row',justifyContent:'center',gap:18},keepsake:{width:48,height:53},
  choices:{flexDirection:'row',flexWrap:'wrap',gap:7,justifyContent:'space-between'},
  nameInput:{...ui.field,minHeight:metrics.button,fontSize:19,textAlign:'center'},
  premiumArt:{height:183,borderRadius:20,backgroundColor:colors.ice,overflow:'hidden',flexDirection:'row',alignItems:'center'},
  roomPreview:{height:'100%',width:'65%'},outfitPreview:{height:'85%',width:'35%'},
  footer:{gap:6,paddingHorizontal:18,paddingTop:7,paddingBottom:9,borderTopColor:colors.line,borderTopWidth:1,backgroundColor:colors.paper},
  error:{color:colors.coral,fontSize:12},
});
