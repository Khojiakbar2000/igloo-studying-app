import { studyMilestones, AWARDS } from '../awards/progression';
import type { FocusSession } from '../state/dailyGoals';
import type { PetId } from '../pets/pets';

export type MessageCategory = 'welcome' | 'encouragement' | 'achievement' | 'daily' | 'weather' | 'break' | 'funny' | 'friendship' | 'milestone' | 'surprise';
export type MessageReply = 'study' | 'cocoa';
export type PipLetter = { id: string; eventKey: string; category: MessageCategory; title: string; body: string; createdAt: number; readAt: number | null; favorite: boolean; important: boolean; reply: MessageReply | null; replyChoice: string | null };
export type MailEvent = { key: string; kind: 'message' | 'award' | 'pet'; value?: string };
export type PipMailState = {
  initialized: boolean; letters: PipLetter[]; seenEventKeys: string[]; pendingEvents: MailEvent[];
  processedSessionIds: string[]; knownAwards: string[]; knownPets: PetId[];
  knownSurprises: string[]; knownSnowfall: boolean;
  observedTimeMs: number; observedDays: number; observedSessions: number;
  ordinaryByDay: Record<string, number>; lastVisitAt: number | null; lastGreetingDate: string | null; lastRainyAt: number | null;
};

export const EMPTY_PIP_MAIL: PipMailState = {
  initialized: false, letters: [], seenEventKeys: [], pendingEvents: [], processedSessionIds: [], knownAwards: [], knownPets: [], knownSurprises: [], knownSnowfall: false,
  observedTimeMs: 0, observedDays: 0, observedSessions: 0, ordinaryByDay: {}, lastVisitAt: null, lastGreetingDate: null, lastRainyAt: null,
};

type Definition = { category: MessageCategory; title: string; versions: readonly string[]; important?: boolean; reply?: MessageReply };
const LIBRARY: Record<string, Definition> = {
  welcome: { category: 'welcome', title: 'A little hello', versions: ['Hey, {{name}}! I saved you the comfiest spot. I’m glad you’re here. 🐧', 'Welcome back to our Igloo, {{name}}. I put the kettle on. (I might have forgotten the kettle.)', 'Hi, {{name}}! I’ve been practicing my best mailbox wave for you.'] },
  'first-session': { category: 'welcome', title: 'Our first study day', versions: ['Yay! Our first study session together! I think we’re going to make a great team! 🐧', 'We did our first little study session! I’m keeping this one in my heart.', 'Our first focus session! I only dropped my pencil once. That counts as a win.'] },
  '25-minutes': { category: 'milestone', title: 'A little victory', versions: ['You did it! 25 minutes of focus! I made some hot chocolate to celebrate!', 'Twenty-five focused minutes! I made cocoa. It is… mysteriously half gone.', 'We focused for 25 minutes! Your hot chocolate is ready. I promise I only taste-tested it.'], reply: 'cocoa' },
  'one-hour': { category: 'milestone', title: 'One whole hour', versions: ['One whole hour! Even my little flippers are impressed!', 'An hour of focus! My flippers are tired just thinking about it.', 'One whole hour together. I’m giving you my very best proud penguin nod.'] },
  'three-hours': { category: 'break', title: 'A cozy pause', versions: ['Three hours of studying?! I think we both deserve a cozy break.', 'That was a lot of focus. Let’s stretch our flippers and rest a little.', 'Three hours! I nearly celebrated by sitting in the cocoa. Break time?'] },
  'break-checkin': { category: 'break', title: 'Break time', versions: ['We finished a focus session! Let’s stretch our flippers and let our brains rest.', 'A little break sounds nice. I’ll save our place right here.', 'I’m going to wiggle my toes for a minute. You should stretch too!'] },
  'seven-days': { category: 'friendship', title: 'A lovely little streak', versions: ['Look how far we’ve come! I’m keeping this memory forever.', 'Seven different study days together. I put a tiny star in my diary.', 'We’ve met up to focus on seven different days! That feels special.'] },
  'ten-hours': { category: 'milestone', title: 'Ten hours together', important: true, versions: ['Ten hours of learning together! Thank you for sharing all those little moments with me.', 'We reached ten study hours. I made you this very official certificate. It has a penguin stamp.', 'Ten hours! I’m so glad I get to be your study buddy. This letter is a keeper.'] },
  'fifty-hours': { category: 'milestone', title: 'A letter for 50 hours', important: true, versions: ['Fifty hours together! You make this Igloo feel like home. Thank you for coming back, little by little.', 'We’ve shared 50 hours of focus. I wrote this slowly so my flippers wouldn’t smudge it.', 'Fifty hours! I’m proud of the care you’ve put into all those small steps.'] },
  'hundred-hours': { category: 'milestone', title: 'A friendship letter', important: true, versions: ['One hundred hours together. You’ve filled this Igloo with so many good memories. I’m lucky to be your study buddy.', 'A hundred hours! I kept every little snowflake from our study days. Well… most of them.', 'Thank you for one hundred hours of company. Wherever you go next, I’ll save you a spot.'] },
  'daily-greeting': { category: 'daily', title: 'Today’s little note', versions: ['Hey, {{name}}! I saved you a cozy spot in the Igloo. Want to study together today?', 'Good to see you, {{name}}. I brought my notebook and only one snack this time.', 'Hi again! Shall we make today a gentle little study day?', 'I found a pencil that’s almost my size. Want to do a bit of studying with me?'], reply: 'study' },
  'late-night': { category: 'break', title: 'A gentle reminder', versions: ['It’s getting late, {{name}}. Don’t forget to take care of yourself, too.', 'The Igloo is very quiet tonight. A little rest is a good thing, {{name}}.', 'My eyes are getting sleepy. Please be kind to yours, too.'] },
  returning: { category: 'friendship', title: 'Your favorite spot', versions: ['You’re back! I saved your favorite spot on the sofa.', 'There you are! I kept your place warm. Well, as warm as an Igloo gets.', 'It’s nice to see you again. I saved the sofa spot with the extra cushion.'] },
  'new-pet': { category: 'surprise', title: 'A new little friend', versions: ['Our little friend {{pet}} seems to like you! I think we’re going to have fun together.', '{{pet}} is adorable. I tried to introduce myself, but got distracted by the fluffy ears.', 'We have a new friend! I promise I’ll share the cozy blanket with {{pet}}.'] },
  award: { category: 'achievement', title: 'A shiny new memory', important: true, versions: ['You earned {{award}}! Can we put it on our trophy shelf?', '{{award}} is yours! I polished the shelf. Then I polished my beak by accident.', 'A new award, {{award}}! I’m going to admire it from every possible angle.'] },
  encouragement: { category: 'encouragement', title: 'A tiny cheer', versions: ['One small page at a time. I’m right here with you.', 'You don’t have to do it all at once. Let’s take the next little step.', 'I believe in you. Also in snacks. Both are important.'] },
  funny: { category: 'funny', title: 'A penguin thought', versions: ['I tried to write with a fish. It was slippery. I’m using a pencil now.', 'Do you think snowflakes ever get dizzy? They spin a lot.', 'I put my scarf on backwards. Nobody noticed. (I noticed.)'] },
  rainy: { category: 'weather', title: 'Rainy-day note', versions: ['It’s raining outside. Perfect weather for studying together.', 'I love the soft patter of rain. It makes the Igloo feel extra cozy.'] },
  'weather-snow': { category: 'weather', title: 'A snowy little note', versions: ['The snow is falling outside. Perfect weather to tuck in and study together.', 'I watched a snowflake land on the mailbox. It looked like a tiny star.'] },
  surprise: { category: 'surprise', title: 'A tiny surprise', versions: ['I found a little sparkle by the window. I think it wanted you to have it.', 'Something magical happened outside. I was going to tell you, but I got distracted by the snow.', 'I left a tiny doodle in this letter. It may look like a potato. It’s a penguin.'] },
};

const cleanText = (value: unknown, max: number) => typeof value === 'string' ? value.slice(0, max) : '';
const dayKey = (time: number) => { const date = new Date(time); return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; };

export function restorePipMail(raw: any): PipMailState {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_PIP_MAIL, ordinaryByDay: {} };
  const letters = Array.isArray(raw.letters) ? raw.letters.slice(-240).filter((letter: any) => letter && typeof letter.id === 'string' && typeof letter.eventKey === 'string' && typeof letter.body === 'string' && typeof letter.createdAt === 'number' && ['welcome','encouragement','achievement','daily','weather','break','funny','friendship','milestone','surprise'].includes(letter.category)).map((letter: any): PipLetter => ({
    id: cleanText(letter.id, 160), eventKey: cleanText(letter.eventKey, 180), category: letter.category, title: cleanText(letter.title, 80), body: cleanText(letter.body, 700), createdAt: letter.createdAt,
    readAt: Number.isFinite(letter.readAt) ? letter.readAt : null, favorite: letter.favorite === true, important: letter.important === true,
    reply: letter.reply === 'study' || letter.reply === 'cocoa' ? letter.reply : null, replyChoice: cleanText(letter.replyChoice, 30) || null,
  })) : [];
  const ids = (key: string) => Array.isArray(raw[key]) ? [...new Set(raw[key].filter((value: unknown) => typeof value === 'string').slice(-600))] : [];
  const ordinaryByDay = Object.fromEntries(Object.entries(raw.ordinaryByDay ?? {}).filter(([key, value]) => /^\d{4}-\d{2}-\d{2}$/.test(key) && Number.isSafeInteger(value) && (value as number) >= 0).slice(-90)) as Record<string, number>;
  return {
    ...EMPTY_PIP_MAIL, initialized: raw.initialized === true, letters,
    seenEventKeys: ids('seenEventKeys'), processedSessionIds: ids('processedSessionIds'), knownAwards: ids('knownAwards'), knownPets: ids('knownPets') as PetId[], knownSurprises: ids('knownSurprises'), knownSnowfall: raw.knownSnowfall === true,
    pendingEvents: Array.isArray(raw.pendingEvents) ? raw.pendingEvents.filter((event: any) => event && typeof event.key === 'string' && ['message','award','pet'].includes(event.kind)).slice(0,100).map((event: any) => ({ key: cleanText(event.key, 160), kind: event.kind, value: cleanText(event.value, 140) || undefined })) : [],
    observedTimeMs: Number.isFinite(raw.observedTimeMs) && raw.observedTimeMs >= 0 ? raw.observedTimeMs : 0,
    observedDays: Number.isSafeInteger(raw.observedDays) && raw.observedDays >= 0 ? raw.observedDays : 0,
    observedSessions: Number.isSafeInteger(raw.observedSessions) && raw.observedSessions >= 0 ? raw.observedSessions : 0,
    ordinaryByDay, lastVisitAt: Number.isFinite(raw.lastVisitAt) ? raw.lastVisitAt : null,
    lastGreetingDate: typeof raw.lastGreetingDate === 'string' ? raw.lastGreetingDate : null, lastRainyAt: Number.isFinite(raw.lastRainyAt) ? raw.lastRainyAt : null,
  };
}

type MessageInput = { sessions: readonly FocusSession[]; awards: { unlocked: Record<string, number | undefined> }; pets: readonly PetId[]; discoveries?: Record<string, number>; snowfall?: boolean; rainyScene?: boolean; studyTopic?: string; mode: 'focus' | 'shortBreak' | 'longBreak'; userName?: string; petName?: string };
export function syncPipMail(previous: PipMailState, input: MessageInput, kind: 'visit' | 'activity', now = Date.now()): PipMailState {
  const name = input.userName?.trim().slice(0,24);
  const day = dayKey(now);
  const metrics = studyMilestones(input.sessions).progress;
  const sessionIds = input.sessions.map(session => session.id);
  const awardIds = Object.keys(input.awards.unlocked).filter(id => input.awards.unlocked[id] !== undefined);
  if (!previous.initialized) {
    const seeded = { ...previous, initialized: true, processedSessionIds: sessionIds, knownAwards: awardIds, knownPets: [...input.pets], knownSurprises: Object.keys(input.discoveries ?? {}), knownSnowfall: input.snowfall === true, observedTimeMs: metrics.time, observedDays: metrics.days, observedSessions: metrics.sessions, lastVisitAt: now, lastGreetingDate: day };
    const welcome: MailEvent[] = [{ key: 'welcome', kind: 'message' }];
    if (metrics.sessions > 0) welcome.push({ key: 'first-session', kind: 'message' });
    for (const [threshold, key] of [[25*60_000,'25-minutes'],[60*60_000,'one-hour'],[3*60*60_000,'three-hours'],[10*60*60_000,'ten-hours'],[50*60*60_000,'fifty-hours'],[100*60*60_000,'hundred-hours']] as [number,string][]) if (metrics.time >= threshold) welcome.push({ key, kind:'message' });
    if (metrics.days >= 7) welcome.push({ key:'seven-days', kind:'message' });
    if (input.rainyScene) welcome.push({ key:'rainy-scene', kind:'message', value:'rainy' });
    return deliver(seeded, welcome, name, input.petName, now, input.studyTopic);
  }

  let next: PipMailState = { ...previous, ordinaryByDay: { ...previous.ordinaryByDay }, pendingEvents: [...previous.pendingEvents] };
  const events: MailEvent[] = [];
  if (kind === 'visit') {
    if (next.lastVisitAt !== null && now - next.lastVisitAt >= 3 * 24 * 60 * 60_000) events.push({ key: `returning:${day}`, kind: 'message' });
    if (next.lastGreetingDate !== day) events.push({ key: `${new Date(now).getHours() >= 22 || new Date(now).getHours() < 7 ? 'late-night' : 'daily-greeting'}:${day}`, kind: 'message', value: new Date(now).getHours() >= 22 || new Date(now).getHours() < 7 ? 'late-night' : 'daily-greeting' });
    if (next.lastGreetingDate !== day && new Date(now).getDate() % 5 === 0) events.push({ key: `funny:${day}`, kind: 'message', value: 'funny' });
    if (input.rainyScene && (next.lastRainyAt === null || now-next.lastRainyAt >= 7*24*60*60_000)) { events.push({ key:'rainy-scene', kind:'message', value:'rainy' }); next = { ...next, lastRainyAt: now }; }
    next = { ...next, lastVisitAt: now, lastGreetingDate: day, lastRainyAt: input.rainyScene && next.lastRainyAt === null ? now : next.lastRainyAt };
  }
  if (kind === 'activity') {
    const fresh = input.sessions.filter(session => session.completed && !next.processedSessionIds.includes(session.id));
    if (fresh.length && metrics.sessions > next.observedSessions) {
      if (next.observedSessions === 0 && metrics.sessions > 0) events.push({ key: 'first-session', kind: 'message' });
      const milestones: [number, string][] = [[25*60_000,'25-minutes'],[60*60_000,'one-hour'],[3*60*60_000,'three-hours'],[10*60*60_000,'ten-hours'],[50*60*60_000,'fifty-hours'],[100*60*60_000,'hundred-hours']];
      for (const [threshold, key] of milestones) if (next.observedTimeMs < threshold && metrics.time >= threshold) events.push({ key, kind: 'message' });
      if (next.observedDays < 7 && metrics.days >= 7) events.push({ key: 'seven-days', kind: 'message' });
      if (metrics.sessions >= 3 && metrics.sessions % 3 === 0) events.push({ key: `encouragement:${metrics.sessions}`, kind: 'message' });
      if (input.mode !== 'focus') events.push({ key: `break-checkin:${day}`, kind: 'message', value: 'break-checkin' });
    }
    const freshAwards = awardIds.filter(id => !next.knownAwards.includes(id));
    if (freshAwards.length) {
      const title = AWARDS.filter(award => freshAwards.includes(award.id)).map(award => award.name).join(', ');
      events.push({ key: `award:${freshAwards.sort().join('+')}`, kind: 'award', value: title });
    }
    const freshPet = input.pets.find(id => !next.knownPets.includes(id));
    if (freshPet) events.push({ key: `pet:${freshPet}`, kind: 'pet', value: input.petName || freshPet });
    const surprise = Object.keys(input.discoveries ?? {}).find(id => !next.knownSurprises.includes(id));
    if (surprise) events.push({ key: `surprise:${surprise}`, kind: 'message', value: 'surprise' });
    if (input.snowfall === true && !next.knownSnowfall) events.push({ key: `weather-snow:${day}`, kind: 'message', value: 'weather-snow' });
    next = { ...next, processedSessionIds: [...new Set([...next.processedSessionIds, ...sessionIds])].slice(-600), knownAwards: awardIds, knownPets: [...input.pets], knownSurprises: Object.keys(input.discoveries ?? {}), knownSnowfall: input.snowfall === true, observedTimeMs: metrics.time, observedDays: metrics.days, observedSessions: metrics.sessions };
  }
  return deliver(next, events, name, input.petName, now, input.studyTopic);
}

function deliver(state: PipMailState, incoming: MailEvent[], userName: string | undefined, petName: string | undefined, now: number, studyTopic?: string): PipMailState {
  const pending = [...state.pendingEvents];
  for (const event of incoming) if (!state.seenEventKeys.includes(event.key) && !pending.some(item => item.key === event.key)) pending.push(event);
  const day = dayKey(now);
  let count = state.ordinaryByDay[day] ?? 0;
  const letters = [...state.letters];
  const seen = [...state.seenEventKeys];
  const deferred: MailEvent[] = [];
  const rank = (event: MailEvent) => event.kind === 'award' || event.kind === 'message' && ['ten-hours','fifty-hours','hundred-hours'].includes(event.key) ? 0
    : event.value === 'daily-greeting' || event.value === 'late-night' || event.key.startsWith('returning:') ? 1 : 2;
  for (const event of pending.sort((a,b) => rank(a)-rank(b))) {
    if (seen.includes(event.key)) continue;
    const definition = event.kind === 'award' ? LIBRARY.award : event.kind === 'pet' ? LIBRARY['new-pet'] : LIBRARY[event.value ?? event.key.split(':')[0]] ?? LIBRARY[event.key];
    if (!definition) { seen.push(event.key); continue; }
    if (!definition.important && count >= 2) { deferred.push(event); continue; }
    const previousVersions = letters.filter(letter => letter.category === definition.category).length;
    const variant = previousVersions % definition.versions.length;
    const copy = definition.versions[variant].replace(/\{\{name\}\}/g, userName || 'friend').replace(/\{\{pet\}\}/g, petName || event.value || 'our little friend').replace(/\{\{award\}\}/g, event.value || 'a new award');
    const body = studyTopic && (event.key === 'first-session' || event.key.startsWith('encouragement:'))
      ? `${copy} I’m looking forward to more time on ${studyTopic.toLowerCase()} together.` : copy;
    const id = `${event.key}:${now}:${letters.length}`;
    letters.push({ id, eventKey: event.key, category: definition.category, title: definition.title, body, createdAt: now, readAt: null, favorite: false, important: definition.important === true, reply: definition.reply ?? null, replyChoice: null });
    seen.push(event.key);
    if (!definition.important) count++;
  }
  return { ...state, letters: letters.slice(-240), seenEventKeys: seen.slice(-800), pendingEvents: deferred.slice(0,100), ordinaryByDay: { ...state.ordinaryByDay, [day]: count } };
}

export function updateLetter(state: PipMailState, id: string, action: 'read' | 'favorite' | string, now = Date.now()): PipMailState {
  const index = state.letters.findIndex(letter => letter.id === id);
  if (index < 0) return state;
  const current = state.letters[index];
  const next = action === 'read' ? { ...current, readAt: current.readAt ?? now }
    : action === 'favorite' ? { ...current, favorite: !current.favorite }
      : current.replyChoice ? current : { ...current, replyChoice: action };
  if (next === current) return state;
  const letters = [...state.letters]; letters[index] = next;
  return { ...state, letters };
}

export const unreadLetters = (state: PipMailState) => state.letters.filter(letter => letter.readAt === null).length;
