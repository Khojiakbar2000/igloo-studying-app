import { localDateKey, nextLocalDate, type DailyGoalData } from '../state/dailyGoals';

export const ONBOARDING_KEY = 'igloo.onboarding.v2';
export const COMPLETION_KEY = 'igloo.onboarding-complete.v2';
export const TOPICS = ['School & Exams', 'Languages', 'Coding', 'Work & Career', 'Reading', 'Creative Projects', 'Something Else'] as const;
export const AGE_RANGES = ['Under 18', '18–24', '25–34', '35–44', '45+'] as const;
export const REFERRALS = ['Instagram', 'TikTok', 'YouTube', 'Friends or Family', 'App Store', 'Google Play', 'Other'] as const;
export const TARGETS = [25, 50, 90, 120] as const;
export type Topic = typeof TOPICS[number];
export type DailyTarget = typeof TARGETS[number];
export type Reminder = { hour: number; minute: number; enabled: boolean };
export const BEATS = ['welcome', 'hatch', 'hatched', 'greeting', 'name', 'heart', 'curiosity', 'age', 'topics',
  'discovery', 'tutorial', 'progress', 'duration', 'target', 'plan', 'celebrate', 'reminders', 'premium', 'referral', 'home'] as const;
export const CHAPTER: Record<typeof BEATS[number],number> = {
  welcome:1,hatch:1,hatched:1,greeting:2,name:2,heart:3,curiosity:3,age:3,topics:4,discovery:5,tutorial:6,progress:7,
  duration:8,target:8,plan:8,celebrate:9,reminders:9,premium:9,referral:9,home:10,
};
export type Beat = typeof BEATS[number];

export type Profile = {
  version: 3; step: Beat; hatchTaps: number; completed: boolean; firstDaySeen: boolean;
  userName: string; penguinName: string; placedBlock: boolean; sessionMinutes: 15 | 25 | 50; age: typeof AGE_RANGES[number] | null;
  topics: Topic[]; primary: Topic | null; target: DailyTarget;
  plan: string[]; usePlan: boolean; planStart: string | null; reminder: Reminder;
  referral: typeof REFERRALS[number] | null;
};
const choice = <T>(items: readonly T[], value: unknown): value is T => items.includes(value as T);
type LegacyDraft = Record<string, unknown>;
const legacySteps: Record<string, Beat> = {
  intro:'welcome', egg:'hatch', hatching:'hatch', celebration:'hatched', userName:'greeting', penguinName:'name',
  personality:'curiosity', activity:'topics', discovery:'discovery', tutorial:'tutorial', progress:'progress', duration:'duration',
  commitment:'plan', firstFocus:'home', focusRunning:'home', completion:'home',
};
const legacyTopics: Record<string, Topic> = { Studying: 'School & Exams', Coding:'Coding', Reading:'Reading', Writing:'Creative Projects' };
const clean = (value: unknown, max: number) => typeof value === 'string' ? value.slice(0, max) : '';
export const companionName = (profile: Pick<Profile,'penguinName'>) => profile.penguinName.trim() || 'Pip';

// The old marker and existing timer data protect anyone who has already used Igloo.
export function restoreProfile(raw: unknown, wasComplete = false, hasExistingActivity = false, hasVerifiedDay = false): Profile {
  const data = (raw && typeof raw === 'object' ? raw : {}) as LegacyDraft;
  const current = data.version === 3;
  const oldStep = typeof data.step === 'string' ? legacySteps[data.step] : undefined;
  const step = current && choice(BEATS, data.step) ? data.step : oldStep ?? 'welcome';
  const topics = Array.isArray(data.topics)
    ? [...new Set(data.topics.filter((topic): topic is Topic => choice(TOPICS, topic)))]
    : typeof data.activity === 'string' && legacyTopics[data.activity] ? [legacyTopics[data.activity]] : [];
  const reminder = data.reminder as Partial<Reminder> | null | undefined;
  const validTime = Number.isInteger(reminder?.hour) && reminder!.hour! >= 0 && reminder!.hour! <= 23
    && Number.isInteger(reminder?.minute) && reminder!.minute! >= 0 && reminder!.minute! <= 59;
  const completed = wasComplete || data.completed === true || (!current && hasExistingActivity);
  return {
    version: 3, step, completed, placedBlock: data.placedBlock === true,
    sessionMinutes: choice([15,25,50] as const,data.sessionMinutes) ? data.sessionMinutes : choice([15,25,50] as const,data.duration) ? data.duration : 25,
    firstDaySeen: data.firstDaySeen === true || (!current && completed && hasVerifiedDay),
    hatchTaps: current && Number.isInteger(data.hatchTaps) ? Math.max(0, Math.min(3, Number(data.hatchTaps))) : BEATS.indexOf(step) >= 2 ? 3 : 0,
    userName: clean(data.userName, 24), penguinName: clean(data.penguinName, 24) || 'Pip',
    age: choice(AGE_RANGES, data.age) ? data.age : null, topics,
    primary: choice(topics, data.primary) ? data.primary : topics[0] ?? null,
    target: choice(TARGETS, data.target) ? data.target : choice(TARGETS, data.duration) ? data.duration : 25,
    plan: Array.isArray(data.plan) && data.plan.length === 7 ? data.plan.map(value => clean(value, 120)) : [],
    usePlan: data.usePlan === true,
    planStart: typeof data.planStart === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data.planStart) ? data.planStart : null,
    reminder: { hour: validTime ? reminder!.hour! : 9, minute: validTime ? reminder!.minute! : 0, enabled: validTime && reminder?.enabled === true },
    referral: choice(REFERRALS, data.referral) ? data.referral : null,
  };
}

const templates: Record<Topic, string[]> = {
  'School & Exams':['Review notes', 'Practice questions', 'Study a difficult topic', 'Revise one unit', 'Try a practice test', 'Review mistakes', 'Light review or rest'],
  Languages:['Vocabulary and grammar', 'Listening and speaking', 'Reading and vocabulary', 'Grammar and listening', 'Speaking and review', 'Practice a conversation', 'Light review or rest'],
  Coding:['Learn a concept', 'Practice exercises', 'Build a small feature', 'Debug and improve', 'Build another feature', 'Practice on a project', 'Review code or rest'],
  'Work & Career':['Choose a skill to work on', 'Read one reference', 'Practice a work skill', 'Draft a small project', 'Review and revise', 'Document what you learned', 'Light review or rest'],
  Reading:['Pick a book and start', 'Read one section', 'Make a few notes', 'Read the next chapter', 'Revisit a favorite passage', 'Read at your own pace', 'Reflect or rest'],
  'Creative Projects':['Collect a few ideas', 'Make a rough sketch', 'Try a small experiment', 'Develop an idea', 'Refine the details', 'Finish a practice piece', 'Reflect or rest'],
  'Something Else':['Set a small intention', 'Practice one skill', 'Work on a small task', 'Review what you learned', 'Try a fresh approach', 'Make a little progress', 'Light review or rest'],
};
export function buildPlan(topic: Topic | null, age: Profile['age']) {
  return [...templates[topic ?? (age === 'Under 18' ? 'School & Exams' : 'Something Else')]];
}
export function planDates(start = localDateKey()) {
  const dates = [start];
  while (dates.length < 7) dates.push(nextLocalDate(dates[dates.length - 1]));
  return dates;
}
export function addPlanToGoals<T extends DailyGoalData>(state: T, plan: readonly string[], start: string, now = Date.now()): T {
  const goals = [...state.goals];
  const today = localDateKey(now);
  for (const [index, date] of planDates(start).entries()) {
    const id = `igloo-plan-${date}`;
    const title = plan[index]?.trim().slice(0,120);
    if (!title || date < today || goals.some(goal => goal.id === id)) continue;
    goals.push({ id, title, date, createdAt: now, completedAt: null, firstCompletedAt: null, deletedAt: null });
  }
  return goals.length === state.goals.length ? state : { ...state, goals };
}
