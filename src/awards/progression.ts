import type { FocusSession, FocusSpan } from '../state/dailyGoals';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
export const AWARDS = [
  { id: 'first-steps', name: 'First Steps', trophy: 'Golden Pip', metric: 'longest', target: 25 * MINUTE, description: 'Complete a focus session of at least 25 minutes.' },
  { id: 'focus-explorer', name: 'Focus Explorer', trophy: 'Snowflake on a Stand', metric: 'time', target: 5 * HOUR, description: 'Accumulate 5 hours in completed focus sessions.' },
  { id: 'dedicated-learner', name: 'Dedicated Learner', trophy: 'Silver Penguin Medal', metric: 'time', target: 10 * HOUR, description: 'Accumulate 10 hours in completed focus sessions.' },
  { id: 'winter-scholar', name: 'Winter Scholar', trophy: 'Crystal Book', metric: 'time', target: 25 * HOUR, description: 'Accumulate 25 hours in completed focus sessions.' },
  { id: 'focus-master', name: 'Focus Master', trophy: 'Golden Hourglass', metric: 'time', target: 50 * HOUR, description: 'Accumulate 50 hours in completed focus sessions.' },
  { id: 'igloo-legend', name: 'Igloo Legend', trophy: 'Ice Crown', metric: 'time', target: 100 * HOUR, description: 'Accumulate 100 hours in completed focus sessions.' },
  { id: 'consistency-star', name: 'Consistency Star', trophy: 'Glowing Star', metric: 'days', target: 7, description: 'Complete a focus session on 7 different study days.' },
  { id: 'deep-focus', name: 'Deep Focus', trophy: 'Crystal Lantern', metric: 'uninterrupted', target: 10, description: 'Complete 10 focus sessions without pausing.' },
] as const;

export type Award = typeof AWARDS[number];
export type AwardId = Award['id'];
type Milestones = Record<Award['metric'] | 'sessions', number>;
export type AwardState = {
  unlocked: Partial<Record<AwardId, number>>;
  order: AwardId[];
  hidden: AwardId[];
  pending: AwardId[];
};
export type AwardAction = 'hide' | 'show' | 'earlier' | 'later' | 'presented';
export const EMPTY_AWARDS: AwardState = { unlocked: {}, order: [], hidden: [], pending: [] };
export const findAward = (id: AwardId) => AWARDS.find(award => award.id === id)!;
const isAwardId = (id: unknown): id is AwardId => AWARDS.some(award => award.id === id);

export function studyMilestones(history: readonly FocusSession[]) {
  const progress: Milestones = { time: 0, longest: 0, days: 0, sessions: 0, uninterrupted: 0 };
  const earned: AwardState['unlocked'] = {};
  const seen = new Set<string>();
  const days = new Set<string>();
  const verifiedSpans: FocusSpan[] = [];
  const completed = history.filter(session => session.completed === true && Number.isFinite(session.endedAt))
    .sort((a, b) => a.endedAt - b.endedAt);
  for (const session of completed) {
    const { startedAt, endedAt, focusMs } = session;
    if (!Number.isFinite(startedAt) || !Number.isFinite(focusMs) || focusMs <= 0 || seen.has(session.id)) continue;
    const spans = session.spans.filter(span => span && Number.isFinite(span.start) && Number.isFinite(span.end) && span.start < span.end)
      .sort((a, b) => a.start - b.start);
    let lastEnd = startedAt;
    let activeMs = 0;
    for (const span of spans) {
      const end = Math.min(endedAt, span.end);
      const start = Math.max(lastEnd, span.start, startedAt);
      const elapsed = Math.max(0, end - start);
      const credited = Math.min(elapsed, Math.max(0, focusMs - activeMs));
      if (credited > 0) verifiedSpans.push({ start, end: start + credited });
      activeMs += elapsed;
      lastEnd = Math.max(lastEnd, end);
    }
    const verifiedMs = Math.min(focusMs, activeMs);
    if (verifiedMs <= 0) continue;
    seen.add(session.id);
    progress.time += verifiedMs;
    progress.longest = Math.max(progress.longest, verifiedMs);
    progress.sessions++;
    if (/^\d{4}-\d{2}-\d{2}$/.test(session.date)) days.add(session.date);
    progress.days = days.size;
    if (!session.interrupted && spans.length === 1 && verifiedMs === endedAt - startedAt) progress.uninterrupted++;
    for (const award of AWARDS) {
      if (earned[award.id] === undefined && progress[award.metric] >= award.target) earned[award.id] = endedAt;
    }
  }
  return { progress, earned, verifiedDays: [...days].sort(), verifiedSpans };
}

function addEarned(current: AwardState, earned: AwardState['unlocked'], celebrate: boolean): AwardState {
  const newAwards = AWARDS.map(award => award.id).filter(id => earned[id] !== undefined && current.unlocked[id] === undefined)
    .sort((a, b) => earned[a]! - earned[b]!);
  if (!newAwards.length) return current;
  return {
    ...current,
    unlocked: { ...earned, ...current.unlocked },
    order: [...current.order, ...newAwards],
    pending: celebrate ? [...current.pending, ...newAwards] : current.pending,
  };
}

export function recordAwards(current: AwardState, sessions: readonly FocusSession[]) {
  return addEarned(current, studyMilestones(sessions).earned, true);
}

export function restoreAwards(raw: unknown, sessions: readonly FocusSession[]): AwardState {
  const saved = raw && typeof raw === 'object' ? raw as Partial<AwardState> : EMPTY_AWARDS;
  const unlocked = Object.fromEntries(Object.entries(saved.unlocked ?? {})
    .filter(([id, date]) => isAwardId(id) && typeof date === 'number' && Number.isFinite(date) && date >= 0 && date < 8.64e15));
  const ids = (value: unknown): AwardId[] => Array.isArray(value)
    ? [...new Set(value.filter((id): id is AwardId => isAwardId(id) && unlocked[id] !== undefined))] : [];
  const order = ids(saved.order);
  const missing = AWARDS.map(award => award.id).filter(id => unlocked[id] !== undefined && !order.includes(id));
  return addEarned({ unlocked, order: [...order, ...missing], hidden: ids(saved.hidden), pending: ids(saved.pending) },
    studyMilestones(sessions).earned, false);
}

export function changeAward(state: AwardState, id: AwardId, action: AwardAction): AwardState {
  if (state.unlocked[id] === undefined) return state;
  if (action === 'presented') return state.pending[0] === id ? { ...state, pending: state.pending.slice(1) } : state;
  if (action === 'hide' || action === 'show') {
    const hidden = state.hidden.includes(id);
    if (hidden === (action === 'hide')) return state;
    return { ...state, hidden: hidden ? state.hidden.filter(item => item !== id) : [...state.hidden, id] };
  }
  const displayed = state.order.filter(item => !state.hidden.includes(item));
  const index = displayed.indexOf(id);
  const other = displayed[index + (action === 'earlier' ? -1 : 1)];
  if (index < 0 || !other) return state;
  return { ...state, order: state.order.map(item => item === id ? other : item === other ? id : item) };
}

export function milestoneText(award: Award, progress: Milestones, earned = false) {
  const value = earned ? award.target : Math.min(award.target, progress[award.metric]);
  if (award.metric === 'time') {
    const hours = Math.floor(value / HOUR);
    const minutes = Math.floor(value % HOUR / MINUTE);
    return `${hours}h${minutes ? ` ${minutes}m` : ''} / ${award.target / HOUR}h focused`;
  }
  if (award.metric === 'longest') return `${Math.floor(value / MINUTE)} / 25 minutes in one session`;
  return `${value} / ${award.target} ${award.metric === 'days' ? 'study days' : 'uninterrupted sessions'}`;
}
