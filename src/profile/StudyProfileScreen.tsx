import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { AWARDS, milestoneText, studyMilestones, type Award } from '../awards/progression';
import { awardSprites } from '../awards/LivingAwards';
import type { PenguinCustomization } from '../character/penguinCustomization';
import { Igloo } from '../components/SceneArt';
import { GIFT_ART } from '../gifts/art';
import { rewardById } from '../gifts/catalog';
import { GIFTS, nextReward } from '../gifts/progression';
import type { WardrobeLayout } from '../home/state';
import { useHomeMotionState } from '../home/useHomeMotion';
import { companionName } from '../onboarding/profile';
import { useStudyProfile } from '../onboarding/ProfileProvider';
import { shiftLocalDate, studyStreak } from '../state/dailyGoals';
import { usePomodoro } from '../state/PomodoroContext';
import { CONSTRUCTION_MILESTONES, constructionProgress } from '../state/timer';
import { PipWardrobePreview } from '../wardrobe/PipWardrobePreview';
import { ProfileIcon } from './ProfileIcon';
import { ProfileSettings, type SettingsPage } from './ProfileSettings';
import { duration, journalDate, journalWeek, STREAK_MILESTONES } from './studyJournal';
import { palette, styles as s } from './profileStyles';

const snowyArt = require('../../assets/environments/arctic/arctic-twilight-mobile.jpg');
const standing = require('../../assets/animations/pip/storybook/character/standing-fallback.png');
const iglooArt = require('../../assets/animations/pip/winter/construction/igloo-complete.png');
const snowflakeArt = awardSprites['focus-explorer'];
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const buildStages = ['Breaking ground', 'The first snow blocks', 'A sturdy foundation', 'The walls are rising', 'The dome is taking shape', 'Home, sweet home'];
const constructionFinish = CONSTRUCTION_MILESTONES[CONSTRUCTION_MILESTONES.length - 1];

type Routes = {
  onWardrobe: () => void; onAccessories: () => void; onIgloo: () => void; onHelp: () => void;
  onPreviewOnboarding?: () => void;
};

export function StudyProfileScreen({ customization, ...routes }: Routes & { customization: PenguinCustomization }) {
  const { profile } = useStudyProfile();
  const { timer, today, hydrated } = usePomodoro();
  const study = useMemo(() => studyMilestones(timer.sessions), [timer.sessions]);
  const streak = useMemo(() => studyStreak(study.verifiedDays, today), [study, today]);
  const [settings, setSettings] = useState<SettingsPage | null>(null);
  const [openedFromMenu, setOpenedFromMenu] = useState(false);
  const [portraitVisible, setPortraitVisible] = useState(true);
  const openSettings = (page: SettingsPage) => {
    setOpenedFromMenu(page === 'menu');
    setSettings(page);
  };
  const companion = companionName(profile);
  const equipped = timer.home.wardrobe.equipped;
  const outfit = useMemo<WardrobeLayout>(() => ({
    ...equipped,
    neck: equipped.neck === 'scarf-teal' && customization.scarf !== 'teal'
      ? customization.scarf === 'berry' ? 'scarf-berry' : 'scarf-lavender' : equipped.neck,
    face: equipped.face ?? (customization.glasses ? 'round-glasses' : undefined),
  }), [customization, equipped]);

  return <View style={s.screen}>
    <ScrollView style={s.scroll} contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" pointerEvents={settings ? 'none' : 'auto'}
      aria-hidden={settings !== null} accessibilityElementsHidden={settings !== null} importantForAccessibility={settings ? 'no-hide-descendants' : 'auto'}
      onScroll={event => setPortraitVisible(event.nativeEvent.contentOffset.y < 225)} scrollEventThrottle={100}>
      <ProfileHero outfit={outfit} headphones={customization.headphones} companion={companion}
        name={profile.userName.trim() || 'You'} streak={streak.current} active={!settings && portraitVisible}
        onSettings={() => openSettings('menu')} />
      {hydrated && <>
        <StudyOverview focused={timer.focusTotalMs} completed={study.progress.sessions} streak={streak} />
        <WeeklyActivity today={today} spans={study.verifiedSpans} target={profile.target} />
        <StreakCalendar today={today} verifiedDays={study.verifiedDays} streak={streak} />
        <IglooProgress focusMs={timer.focusTotalMs} study={study.progress} onOpen={routes.onIgloo} />
        <Achievements study={study.progress} />
      </>}
      <View style={[s.card, s.wardrobeCard]}>
        <View style={s.wardrobeCopy}>
          <Text style={s.eyebrow}>WARDROBE</Text>
          <Text accessibilityRole="header" style={s.sectionTitle}>Customize {companion}</Text>
          <Pressable accessibilityRole="button" onPress={routes.onWardrobe} style={({ pressed }) => [s.primary, pressed && s.pressed]}>
            <Text style={s.primaryText}>Open Wardrobe</Text><ProfileIcon name="next" size={15} color={palette.cream} />
          </Pressable>
        </View>
        <View pointerEvents="none" style={s.wardrobeArt}>
          <Portrait outfit={outfit} headphones={customization.headphones} size={176} />
        </View>
      </View>
      <View style={[s.card, s.preferenceCard]}>
        <Text accessibilityRole="header" style={s.sectionTitle}>Study preferences</Text>
        <DashboardLink label="Daily goal and focus" detail={`${profile.target} min daily · ${timer.focusMinutes} min sessions`} onPress={() => openSettings('focus')} />
        <DashboardLink label="Study categories" detail={profile.topics.length ? profile.topics.join(', ') : 'Choose what to study'} onPress={() => openSettings('topics')} />
        <DashboardLink label="Reminders" onPress={() => openSettings('reminders')} />
        <DashboardLink label="Ambient sounds" onPress={() => openSettings('sounds')} />
      </View>
    </ScrollView>
    {settings && <ProfileSettings page={settings} setPage={setSettings} onBack={() => setSettings(null)} openedFromMenu={openedFromMenu} {...routes} />}
  </View>;
}

function ProfileHero({ name, companion, streak, outfit, headphones, active, onSettings }: {
  name: string; companion: string; streak: number; outfit: WardrobeLayout; headphones: boolean; active: boolean; onSettings: () => void;
}) {
  const { motion } = useHomeMotionState(active);
  const [hello, setHello] = useState(false);
  const endHello = useCallback(() => setHello(false), []);
  useEffect(() => {
    if (!hello) return;
    const timeout = setTimeout(endHello, 3250);
    return () => clearTimeout(timeout);
  }, [endHello, hello]);
  return <View style={s.hero}>
    <Image accessible={false} source={snowyArt} resizeMode="cover" style={s.heroLandscape} />
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%">
        <Defs><LinearGradient id="journal-dusk" x1="0%" y1="30%" x2="100%" y2="75%">
          <Stop offset="0" stopColor="#2e2550" stopOpacity=".96" />
          <Stop offset=".48" stopColor="#3e3764" stopOpacity=".82" />
          <Stop offset="1" stopColor="#696db0" stopOpacity=".13" />
        </LinearGradient></Defs>
        <Rect width="100%" height="100%" fill="url(#journal-dusk)" />
      </Svg>
    </View>
    <View style={s.heroCopy} pointerEvents="none">
      <Text style={s.heroEyebrow}>YOUR LITTLE WORLD</Text>
      <Text accessibilityRole="header" style={s.heroTitle}>{name} &amp; {companion}</Text>
      <Text style={s.heroLine}>Growing a little every day.</Text>
      <View style={s.heroStreak}><ProfileIcon name="snow" size={14} color="#ffd98a" />
        <Text style={s.heroStreakText}>{streak}-day streak</Text>
      </View>
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel={`Say hello to ${companion}`} onPress={() => setHello(true)} style={s.heroPortrait}>
      <View pointerEvents="none" style={s.heroPortraitArt}>
        <Portrait outfit={outfit} headphones={headphones} size={239} motion={motion} waving={hello && motion} onFinish={endHello} />
      </View>
      {hello && <View pointerEvents="none" style={s.hello}><ProfileIcon name="heart" size={13} color="#984b74" /><Text accessibilityLiveRegion="polite" style={s.helloText}>Hello!</Text></View>}
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="Profile settings" onPress={onSettings}
      style={({ pressed }) => [s.heroSettings, pressed && s.pressed]}>
      <ProfileIcon name="settings" size={20} color={palette.cream} />
    </Pressable>
  </View>;
}

function Portrait({ outfit, headphones, size, motion = false, waving = false, onFinish }: {
  outfit: WardrobeLayout; headphones: boolean; size: number; motion?: boolean; waving?: boolean; onFinish?: () => void;
}) {
  const [ready, setReady] = useState(false);
  const loaded = useCallback(() => setReady(true), []);
  return <View style={{ width: size, height: size }}>
    {!ready && <Image accessible={false} source={standing} style={StyleSheet.absoluteFill} resizeMode="contain" />}
    <PipWardrobePreview equipped={outfit} headphones={headphones} action={waving ? 'wave' : 'idle'} motion={motion}
      onReady={loaded} onFinish={waving ? onFinish : undefined} />
  </View>;
}

function StudyOverview({ focused, completed, streak }: { focused: number; completed: number; streak: ReturnType<typeof studyStreak> }) {
  const values = [
    { label: 'Total focused', value: duration(focused), icon: 'clock', tone: s.meterViolet },
    { label: 'Completed sessions', value: String(completed), icon: 'sessions', tone: s.meterBlue },
    { label: 'Current streak', value: `${streak.current} ${streak.current === 1 ? 'day' : 'days'}`, icon: 'snow', tone: s.meterIce },
    { label: 'Longest streak', value: `${streak.longest} ${streak.longest === 1 ? 'day' : 'days'}`, icon: 'star', tone: s.meterGold },
  ] as const;
  return <View style={s.overview}>
    <Text accessibilityRole="header" style={s.sectionTitle}>Study overview</Text>
    <View style={s.meters}>{values.map(({ label, icon, value, tone }) =>
      <View key={label} style={[s.meter, tone]}>
        <View style={s.meterIcon}><ProfileIcon name={icon} size={18} /></View>
        <View style={s.meterCopy}><Text style={s.meterValue}>{value}</Text><Text style={s.meterLabel}>{label}</Text></View>
      </View>)}
    </View>
  </View>;
}

function WeeklyActivity({ today, target, spans }: { today: string; target: number; spans: ReturnType<typeof studyMilestones>['verifiedSpans'] }) {
  const [previous, setPrevious] = useState(false);
  const { width } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const week = useMemo(() => journalWeek(today, previous, spans), [today, previous, spans]);
  const total = week.reduce((sum, day) => sum + day.focusMs, 0);
  const goal = target * 60_000;
  const ceiling = Math.max(goal, ...week.map(day => day.focusMs)) * 1.16;
  const range = `${journalDate(week[0].date, { month: 'short', day: 'numeric' })} – ${journalDate(week[6].date, { month: 'short', day: 'numeric' })}`;
  return <View style={[s.card, s.weekCard]}>
    <View style={[s.cardHeading, width < 355 && s.narrowChartHeading]}>
      <View style={[s.headingCopy, width < 355 && s.narrowChartCopy]}><Text accessibilityRole="header" style={s.sectionTitle}>Weekly activity</Text><Text style={s.subtle}>{range}</Text></View>
      <View style={s.segment} accessibilityRole="radiogroup" accessibilityLabel="Activity week">
        {[false, true].map(last => <Pressable key={String(last)} accessibilityRole="radio" accessibilityState={{ checked: previous === last }}
          onPress={() => setPrevious(last)} style={[s.segmentButton, previous === last && s.segmentActive]}>
          <Text style={[s.segmentText, previous === last && s.segmentTextActive]}>{last ? 'Last week' : 'This week'}</Text>
        </Pressable>)}
      </View>
    </View>
    <View style={s.weekSummary}><Text style={s.weekTotal}>{duration(total)}<Text style={s.weekCaption}> studied</Text></Text>
      <View style={s.goalLegend}><View style={s.legendLine} /><Text style={s.subtle}>{target} min daily goal</Text></View>
    </View>
    <Animated.View key={String(previous)} entering={reducedMotion ? undefined : FadeIn.duration(180)} style={s.barChart}>
      <View pointerEvents="none" style={[s.goalLine, { bottom: `${(goal / ceiling) * 100}%` }]} />
      {week.map(({ date, focusMs }, index) => <View key={date} accessible accessibilityLabel={`${days[index]}, ${duration(focusMs)}${date === today ? ', today' : ''}`} style={s.barColumn}>
        <View style={[s.barFill, { height: focusMs ? `${Math.max(4, focusMs / ceiling * 100)}%` : 3 }, date === today && s.todayBar]} />
      </View>)}
    </Animated.View>
    <View style={s.barLabels} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      {week.map(({ date, focusMs }, index) => <View key={date} style={[s.barLabel, date === today && s.todayLabel]}>
        <Text style={s.dayCaption}>{days[index].slice(0, 3)}</Text><Text style={s.dayValue}>{focusMs > 0 && focusMs < 60_000 ? '<1' : Math.floor(focusMs / 60_000)}</Text>
      </View>)}
    </View>
    {total === 0 && <Text style={s.emptyWeek}>Your first little adventure starts today!</Text>}
  </View>;
}

function StreakCalendar({ today, verifiedDays, streak }: { today: string; verifiedDays: readonly string[]; streak: ReturnType<typeof studyStreak> }) {
  const finished = useMemo(() => new Set(verifiedDays), [verifiedDays]);
  const week = Array.from({ length: 7 }, (_, index) => shiftLocalDate(today, index - 6));
  const next = STREAK_MILESTONES.find(target => target > streak.longest);
  return <View style={[s.card, s.streakCard]}>
    <View style={s.cardHeading}>
      <View style={s.headingCopy}><Text accessibilityRole="header" style={s.sectionTitle}>Study streak</Text><Text style={s.subtle}>{streak.current ? `${streak.current} ${streak.current === 1 ? 'day' : 'days'} in a row` : 'A fresh start whenever you’re ready.'}</Text></View>
      <View style={s.streakMark}><ProfileIcon name="snow" size={23} color={palette.goldInk} /></View>
    </View>
    <View style={s.streakCalendar}>
      {week.map(date => {
        const done = finished.has(date);
        return <View key={date} accessible accessibilityLabel={`${journalDate(date, { weekday: 'long', month: 'short', day: 'numeric' })}, ${done ? 'study completed' : 'no completed study'}${date === today ? ', today' : ''}`}
          style={[s.streakDay, done && s.streakDayDone, date === today && s.streakDayToday]}>
          <Text style={s.dayCaption}>{journalDate(date, { weekday: 'short' }).slice(0, 3)}</Text>
          {done ? <ProfileIcon name="snow" size={17} color={palette.goldInk} /> : <Text style={s.inactiveDay}>·</Text>}
          <Text style={s.dayValue}>{Number(date.slice(-2))}</Text>
        </View>;
      })}
    </View>
    <View style={s.milestoneHeading}><Text style={s.smallHeading}>Streak milestones</Text><Text style={s.subtle}>{next ? `Next milestone · ${next} days` : 'All milestones reached'}</Text></View>
    <View style={s.milestones}>
      {STREAK_MILESTONES.map(target => <View key={target} accessible accessibilityLabel={`${target} day milestone, ${target <= streak.longest ? 'reached' : 'upcoming'}`}
        style={[s.milestone, target <= streak.longest && s.milestoneEarned, next === target && s.milestoneNext]}>
        <ProfileIcon name={target <= streak.longest ? 'check' : 'star'} size={12} color={target <= streak.longest ? palette.goldInk : palette.muted} />
        <Text style={s.milestoneLabel}>{target}d</Text>
      </View>)}
    </View>
  </View>;
}

function IglooProgress({ focusMs, study, onOpen }: { focusMs: number; study: ReturnType<typeof studyMilestones>['progress']; onOpen: () => void }) {
  const { timer } = usePomodoro();
  const { minutes, progress, stage, nextMilestone } = constructionProgress(focusMs);
  const gift = GIFTS.find(item => !timer.home.gifts[item.id] && study[item.metric] >= item.target) ?? GIFTS.find(item => !timer.home.gifts[item.id]);
  const claim = gift && nextReward(gift, timer.home.owned, timer.home.wardrobe.owned);
  const reward = claim && 'rewardId' in claim ? rewardById(claim.rewardId) : undefined;
  const waiting = gift && study[gift.metric] >= gift.target;
  const rewardName = reward?.name ?? (claim && 'snowflakes' in claim ? `${claim.snowflakes} Snowflakes` : undefined);
  return <View style={[s.card, s.iglooCard]}>
    <View style={s.iglooTop}>
      <View style={s.headingCopy}>
        <Text accessibilityRole="header" style={s.sectionTitle}>Your Igloo</Text>
        <Text style={s.iglooStage}>{buildStages[stage]}</Text>
        <Text style={s.subtle}>{nextMilestone === null ? `${Math.floor(minutes)} focus minutes · Built` : `${Math.floor(minutes)} / ${nextMilestone} focus minutes to next stage`}</Text>
      </View>
      {stage === 0 || nextMilestone === null
        ? <Image source={iglooArt} accessible={false} resizeMode="contain" style={[s.iglooArt, stage === 0 && s.iglooPlan]} />
        : <Igloo stage={stage} width={88} />}
    </View>
    <View accessibilityRole="progressbar" accessibilityLabel="Igloo construction" accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }} style={s.iglooTrack}>
      <View style={[s.iglooFill, { width: `${progress * 100}%` }]} />
      {CONSTRUCTION_MILESTONES.slice(0, -1).map(stop => <View key={stop} style={[s.iglooTick, { left: `${stop / constructionFinish * 100}%` }]} />)}
    </View>
    {gift && rewardName && <View style={s.reward}>
      <Image accessible={false} source={reward ? GIFT_ART[reward.art] : snowflakeArt} resizeMode="contain" style={s.rewardArt} />
      <View style={s.headingCopy}><Text style={s.subtle}>{waiting ? 'Reward ready in My Igloo' : 'Next reward'}</Text><Text style={s.rewardName}>{rewardName}</Text>
        {!waiting && <Text style={s.subtle}>{gift.label}</Text>}</View>
    </View>}
    <DashboardLink label="Open My Igloo" onPress={onOpen} />
  </View>;
}

function Achievements({ study }: { study: ReturnType<typeof studyMilestones>['progress'] }) {
  const { timer } = usePomodoro();
  const [selected, setSelected] = useState<Award | null>(null);
  const earned = (award: Award) => timer.awards.unlocked[award.id] !== undefined;
  return <View style={[s.card, s.awardCard]}>
    <View style={[s.cardHeading, s.awardHeading]}>
      <Text accessibilityRole="header" style={s.sectionTitle}>Living Awards</Text><Text style={s.subtle}>{AWARDS.filter(earned).length} of {AWARDS.length} earned</Text>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.badges}>
      {AWARDS.map(award => <Pressable key={award.id} accessibilityRole="button" accessibilityLabel={`${award.name}, ${earned(award) ? 'earned' : 'locked'}`} accessibilityState={{ selected: selected?.id === award.id }}
        onPress={() => setSelected(selected?.id === award.id ? null : award)} style={({ pressed }) => [s.badge, selected?.id === award.id && s.badgeSelected, pressed && s.pressed]}>
        <View style={[s.badgeArt, !earned(award) && s.badgeLocked]}>
          <Image accessible={false} source={awardSprites[award.id]} resizeMode="contain" style={s.badgeImage} />
          {!earned(award) && <View style={s.badgeLock}><ProfileIcon name="lock" size={11} /></View>}
        </View>
        <Text style={s.badgeLabel}>{award.name}</Text>
      </Pressable>)}
    </ScrollView>
    {selected && <View style={s.awardDetail} accessibilityLiveRegion="polite">
      <View style={s.headingCopy}><Text style={s.rewardName}>{selected.name} · {earned(selected) ? 'Earned' : 'Locked'}</Text><Text style={s.body}>{selected.description}</Text>
        {!earned(selected) && <Text style={s.subtle}>{milestoneText(selected, study)}</Text>}</View>
      <Pressable accessibilityRole="button" accessibilityLabel="Close award details" style={s.compactButton} onPress={() => setSelected(null)}><ProfileIcon name="close" size={17} /></Pressable>
    </View>}
  </View>;
}

function DashboardLink({ label, detail, onPress }: { label: string; detail?: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [s.link, pressed && s.pressed]}>
    <View style={s.headingCopy}><Text style={s.linkText}>{label}</Text>{detail && <Text numberOfLines={2} style={s.subtle}>{detail}</Text>}</View><ProfileIcon name="next" size={16} />
  </Pressable>;
}
