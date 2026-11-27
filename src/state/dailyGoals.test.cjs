const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
process.env.TZ = 'Asia/Seoul';
const storage = new Map();
let failNext = false;
const cache = new Map();
function load(file) {
  file = path.resolve(__dirname, file);
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} }; cache.set(file, module);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const requireModule = (name) => name === '@react-native-async-storage/async-storage' ? {
    getItem: async (key) => storage.get(key) ?? null,
    setItem: async (key, value) => { if (failNext) { failNext = false; throw new Error('disk unavailable'); } const state = JSON.parse(value); await new Promise((resolve) => setTimeout(resolve, state.focusTotalMs === 111 ? 25 : 0)); storage.set(key, value); },
  } : name.startsWith('.') ? load(path.resolve(path.dirname(file), name + '.ts')) : require(name);
  vm.runInThisContext('(function(require,module,exports){' + code + '\n})', { filename: file })(requireModule, module, module.exports);
  return module.exports;
}
const timer = load('timer.ts'), goals = load('dailyGoals.ts');
const home = load('../home/state.ts');
const atmosphere = load('../home/atmosphere.ts');
const ambient = load('../home/ambientLottie.ts');
const now = () => new Date(2026, 10, 15, 12).getTime();
const fresh = () => structuredClone(timer.defaultTimerState);
const add = (state, title = 'Finish React assignment', date = goals.localDateKey(now())) => goals.addDailyGoal(state, title, date, now());
const linkedStart = (state, at = now()) => timer.startTimer({ ...state, selectedGoalId: state.goals[0]?.id ?? null }, at);

test('study journal splits completed focus at local midnight and switches Monday-based weeks', () => {
 const { studyMilestones } = load('../awards/progression.ts');
 const { journalWeek } = load('../profile/studyJournal.ts');
 const begin = new Date(2026, 10, 15, 23, 50).getTime();
 const monday = goals.localDateKey(begin + 20 * 60_000);
 let state = timer.startFocusTimer(fresh(), 20, begin);
 state = timer.reconcileTimer(state, state.endAt);
 state = timer.startFocusTimer(state, 25, begin + 30 * 60_000);
 state = timer.finishTimer(state, begin + 40 * 60_000);
 const study = studyMilestones(state.sessions);
 assert.equal(study.progress.sessions, 1);
 assert.equal(journalWeek(monday, false, study.verifiedSpans)[0].focusMs, 10 * 60_000);
 assert.equal(journalWeek(monday, true, study.verifiedSpans)[6].focusMs, 10 * 60_000);
 assert.deepEqual(study.verifiedDays, [monday]);
});

test('current study streak includes yesterday until today ends and preserves the longest streak', () => {
 const verified = ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-07', '2026-11-08', '2026-11-08'];
 assert.deepEqual(goals.studyStreak(verified, '2026-11-09'), { current: 2, longest: 3 });
 assert.deepEqual(goals.studyStreak(verified, '2026-11-10'), { current: 0, longest: 3 });
});

test('changing a profile focus preference preserves the current session and applies to the next', () => {
 const active = timer.startTimer(fresh(), now());
 assert.equal(timer.setFocusDuration(active, 50), active);
 const updated = timer.setFocusDuration(active, 50, true);
 assert.equal(updated.durationMs, active.durationMs);
 assert.equal(updated.endAt, active.endAt);
 const next = timer.startFocusTimer(timer.reconcileTimer(updated, updated.endAt), undefined, updated.endAt + 1);
 assert.equal(next.durationMs, 50 * 60_000);
});

test('local daylight boundaries and persisted atmosphere preserve purchased furniture', () => {
 assert.deepEqual([0,5,6,11,12,16,17,20,21,23].map(atmosphere.localDayPhase),['night','night','morning','morning','afternoon','afternoon','evening','evening','night','night']);
 let h=home.purchaseHome({...home.createHome(),snowflakes:100},'desk-walnut');
 const restored=timer.restoreTimerState(JSON.stringify({...fresh(),home:{...h,atmosphere:'night',snowfall:false}}),now());
 assert.equal(restored.home.atmosphere,'night');assert.equal(restored.home.snowfall,false);assert.equal(restored.home.equipped.desk,'desk-walnut');
 assert.equal(restored.home.snowflakes,0);assert.equal(home.restoreHome({...h,atmosphere:'invalid'},[]).atmosphere,'auto');
 delete h.atmosphere;delete h.snowfall;const old=home.restoreHome(h,[]);assert.equal(old.atmosphere,'auto');assert.equal(old.snowfall,true);assert.equal(old.equipped.desk,'desk-walnut');
});
test('snow loops are bounded, seamless and masked away from window frames', () => {
 for(const shape of ['round','arch']){
  const data=ambient.snowAnimation(shape),flakes=data.assets[0].layers;
  assert.equal(flakes.length,16);assert.ok(JSON.stringify(data).length<30000);
  assert.equal(data.layers[0].masksProperties[0].mode,'a');assert.equal(data.layers[0].masksProperties.filter(m=>m.mode==='s').length,2);
  for(const flake of flakes){const keys=flake.ks.p.k;assert.deepEqual(keys[0].s,keys.at(-1).s);assert.equal(keys.at(-1).t,data.op);assert.ok(keys.every(k=>Number.isFinite(k.t)&&k.s.every(Number.isFinite)));}
  const wind=ambient.gustAnimation(shape);assert.equal(wind.op/wind.fr,60);assert.equal(wind.assets[0].layers.length,5);assert.ok(wind.assets[0].layers.every(l=>l.ks.o.k[0].s[0]===0&&l.ks.o.k.at(-1).s[0]===0));
 }
});
test('the blink overlay is small and restricted to the approved seated eye regions', async () => {
 const sharp=require('sharp'),file=path.join(__dirname,'../../assets/animations/pip-home-idle/blink-eyes.png');
 assert.ok(fs.statSync(file).size<20000);
 const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});assert.equal(info.width,480);assert.equal(info.height,560);
 let pixels=0;for(let y=0;y<560;y++)for(let x=0;x<480;x++)if(data[(y*480+x)*4+3]){pixels++;assert.ok(x>=160&&x<322&&y>=205&&y<277);assert.ok(!(x>=225&&x<=273&&y>=240),'approved beak must remain untouched');}
 assert.ok(pixels>1500&&pixels<6000);
});

test('focus → earn → buy and equip → persist retains furniture and a single payout', async () => {
 let s = timer.startTimer(fresh(), now()); const running = structuredClone(s);
 s = timer.reconcileTimer(s, s.endAt);
 assert.equal(s.home.snowflakes,25);
 const id=s.sessions[0].id;
 s={...s,home:home.purchaseHome(s.home,'decor-plant')};
 assert.equal(s.home.snowflakes,0); assert.equal(s.home.equipped.plant,'decor-plant');
 assert.equal(home.purchaseHome(s.home,'decor-plant'),s.home);
 await timer.saveTimerState(s);
 const restored=await timer.loadTimerState();
 assert.equal(restored.home.equipped.plant,'decor-plant');assert.equal(restored.home.snowflakes,0);
 assert.equal(home.rewardHome(restored.home,restored.sessions[0]),restored.home);
 const replay=timer.reconcileTimer({...running,sessions:restored.sessions,home:restored.home},running.endAt);
 assert.equal(replay.home.snowflakes,0);assert.equal(replay.sessions.length,1);
 assert.ok(restored.home.rewardedSessionIds.includes(id));
});
test('breaks, partial focus and repeated goal checks never issue Snowflakes', () => {
 let s=timer.startTimer(add(fresh()),now());s=timer.finishTimer(s,now()+600000);assert.equal(s.home.snowflakes,0);
 s=timer.startTimer(s,now()+600000);s=timer.reconcileTimer(s,s.endAt);assert.equal(s.home.snowflakes,0);
 for(let i=0;i<4;i++)s=goals.completeDailyGoal(s,s.goals[0].id,i%2===0,now());
 assert.equal(s.home.snowflakes,0);
});
test('unlimited Snowflakes survive purchases in both shops and a save reload', async () => {
 const state = fresh();
 state.home.snowflakes = Infinity;
 state.home = home.purchaseHome(state.home, 'desk-walnut');
 state.home = home.purchaseWardrobe(state.home, 'royal-crown');
 await timer.saveTimerState(state);
 const restored = await timer.loadTimerState();
 assert.equal(restored.home.snowflakes, Infinity);
 assert.ok(restored.home.owned.includes('desk-walnut'));
 assert.ok(restored.home.wardrobe.owned.includes('royal-crown'));
});

test('Boutique try-on matches purchased and equipped outfits through costume changes', () => {
 const { wardrobeProductData } = load('../wardrobe/model.ts');
 const knight = wardrobeProductData('knight-set');
 const glasses = wardrobeProductData('round-glasses');
 const scarf = wardrobeProductData('scarf-berry');
 let current = { ...home.createHome(), snowflakes: 500 };
 for (const product of [glasses, knight, scarf]) {
  const before = current.wardrobe.equipped;
  const preview = home.outfitWithProduct(before, product);
  current = home.purchaseWardrobe(current, product.id);
  assert.notEqual(current.wardrobe.equipped, before);
  assert.deepEqual(current.wardrobe.equipped, preview);
  assert.equal(current.wardrobe.equipped.face, 'round-glasses');
 }
 assert.equal(current.wardrobe.equipped.skin, undefined);
 current = home.equipWardrobe(current, knight.id);
 assert.equal(current.wardrobe.equipped.skin, 'knight-storybook');
 assert.equal(current.wardrobe.equipped.neck, undefined);
 assert.equal(current.wardrobe.equipped.face, 'round-glasses');
 const restored = home.restoreHome(JSON.parse(JSON.stringify(current)), []);
 assert.deepEqual(restored.wardrobe.equipped, current.wardrobe.equipped);
});
test('ownership, affordability, fixed slots and optional removals are enforced', () => {
 let h=home.createHome(); assert.equal(home.purchaseHome(h,'skylight'),h);assert.equal(home.equipHome(h,'desk-sage'),h);
 assert.equal(home.purchaseHome(h,'missing'),h);assert.equal(home.removeHome(h,'bed'),h);
 h=home.purchaseHome({...h,snowflakes:100},'desk-walnut');assert.equal(h.snowflakes,0);assert.equal(h.equipped.desk,'desk-walnut');assert.equal(h.previous.desk,'desk-oak');
 h=home.removeHome(h,'sofa');assert.equal(h.equipped.sofa,undefined);
 const restored=home.restoreHome({...h,equipped:{bed:'skylight',desk:'desk-sage',window:'missing',sofa:'sofa-rose'},snowflakes:-50},[]);
 assert.equal(restored.snowflakes,0);assert.equal(restored.equipped.bed,'bed-blue');assert.equal(restored.equipped.desk,'desk-oak');assert.equal(restored.equipped.sofa,undefined);
});
test('legacy sessions do not produce retroactive rewards and offline completion pays once', () => {
 let s=timer.startTimer(fresh(),now());
 s=timer.restoreTimerState(JSON.stringify(s),s.endAt+600000);assert.equal(s.home.snowflakes,25);
 s=timer.restoreTimerState(JSON.stringify(s),s.endAt+900000);assert.equal(s.home.snowflakes,25);
 const legacy={...s};delete legacy.home;
 const migrated=timer.restoreTimerState(JSON.stringify(legacy),now());assert.equal(migrated.home.snowflakes,0);
 assert.equal(home.rewardHome(migrated.home,migrated.sessions[0]),migrated.home);
});
test('saved arrangements, undo and original-room fallback survive reload independently', () => {
 let h={...home.createHome(),snowflakes:200};
 h=home.purchaseHome(h,'skylight');h=home.arrangeHomeState(h,'save');
 h=home.removeHome(h,'ceiling');assert.equal(h.equipped.ceiling,undefined);
 h=home.arrangeHomeState(h,'undo');assert.equal(h.equipped.ceiling,'skylight');
 h=home.removeHome(h,'sofa');h=home.arrangeHomeState(h,'restore');assert.equal(h.equipped.sofa,'sofa-cream');
 h=home.arrangeHomeState(h,'fallback');
 const restored=timer.restoreTimerState(JSON.stringify({...fresh(),home:h}),now());
 assert.equal(restored.home.originalRoom,true);assert.equal(restored.home.equipped.ceiling,'skylight');assert.equal(restored.home.saved.ceiling,'skylight');
});
test('restoring an older home without arrangements supplies the furnished room and respects saved removals', () => {
 const oldHome = home.restoreHome({ snowflakes: 120 }, []);
 assert.equal(oldHome.equipped.sofa, 'sofa-cream');
 assert.equal(oldHome.saved.bookshelf, 'shelf-oak');
 const edited = home.arrangeHomeState(home.removeHome(oldHome, 'sofa'), 'save');
 const restored = home.restoreHome(JSON.parse(JSON.stringify(edited)), []);
 assert.equal(restored.equipped.sofa, undefined);
 assert.equal(restored.saved.sofa, undefined);
 assert.equal(restored.snowflakes, 120);
});
test('every furniture silhouette fits its panorama slot without stretching or clipping', async () => {
 const sharp=require('sharp'),catalog=load('../home/catalog.ts');
 const { PANORAMA, PANORAMA_SLOTS, fittedSprite } = load('../home/panorama.ts');
 const footprints = require('../../assets/home-customization/panorama/footprints.json');
 const HOME_CATALOG = catalog.HOME_CATALOG.filter(item => !item.giftOnly);
 assert.equal(HOME_CATALOG.length,25);assert.equal(new Set(HOME_CATALOG.map(i=>i.id)).size,25);
 for(const [category,count]of Object.entries({Beds:3,Sofas:3,Desks:3,Rugs:3,Lighting:3,Windows:2,Ceiling:1,Shelves:2,Decor:5}))assert.equal(HOME_CATALOG.filter(i=>i.category===category).length,count);
 for(const item of HOME_CATALOG){
  const box=PANORAMA_SLOTS[item.slot],meta=await sharp(path.join(__dirname,'../../assets/home-customization/items',item.id+'.png')).metadata();
  const footprint = footprints[item.id];
  assert.ok(footprint, item.id);
  const [canvasWidth, canvasHeight, left, top, right, bottom] = footprint;
  assert.deepEqual([meta.hasAlpha, meta.width, meta.height], [true, canvasWidth, canvasHeight], item.id);
  assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=PANORAMA.width&&box.y+box.height<=PANORAMA.height,item.id);
  const frame = fittedSprite(box, footprint);
  const scale = frame.width / canvasWidth;
  const tolerance = 0.001;
  assert.ok(Math.abs(frame.height / canvasHeight - scale) < tolerance, item.id);
  assert.ok(frame.x + left * scale >= box.x - tolerance && frame.x + right * scale <= box.x + box.width + tolerance, item.id);
  assert.ok(frame.y + top * scale >= box.y - tolerance, item.id);
  assert.ok(Math.abs(frame.y + bottom * scale - box.y - box.height) < tolerance, item.id);
 }
});

test('legacy lifetime totals survive migration without fabricated past sessions', () => {
  const restored = timer.restoreTimerState(JSON.stringify({ mode: 'focus', status: 'idle', focusMinutes: 25, durationMs: 1500000, remainingMs: 1500000, endAt: null, focusTotalMs: 5400000, completedSessions: 7 }), now());
  assert.equal(restored.focusTotalMs, 5400000); assert.equal(restored.completedSessions, 7); assert.equal(restored.sessions.length, 0); assert.equal(restored.goals.length, 0);
});
test('goals allow more than three, edit, delete and completion without focus rewards', () => {
  let s = fresh(); for (let i = 0; i < 5; i++) s = add(s, 'Goal ' + i);
  assert.equal(s.goals.length, 5); s = goals.editDailyGoal(s, s.goals[0].id, '  Read a chapter  '); assert.equal(s.goals[0].title, 'Read a chapter');
  s = goals.completeDailyGoal(s, s.goals[0].id, true, now()); assert.ok(s.goals[0].completedAt);
  assert.equal(s.focusTotalMs, 0); assert.equal(s.completedSessions, 0);
  s = goals.deleteDailyGoal(s, s.goals[1].id, now()); assert.equal(goals.goalsOn(s, goals.localDateKey(now())).length, 4);
  assert.equal(goals.addDailyGoal(s, '   '), s);
});
test('goal link and stable session identity survive pause, restore and resume', () => {
  let s = linkedStart(add(fresh())); const id = s.activeFocus.id, goalId = s.activeFocus.goalId;
  s = timer.pauseTimer(s, now() + 120000); s = timer.restoreTimerState(JSON.stringify(s), now() + 3600000);
  assert.equal(s.activeFocus.id, id); assert.equal(s.activeFocus.goalId, goalId);
  s = timer.startTimer(s, now() + 3600000); s = timer.reconcileTimer(s, s.endAt);
  assert.equal(s.sessions.length, 1); assert.equal(s.sessions[0].id, id); assert.equal(s.sessions[0].goalId, goalId);
  assert.equal(s.sessions[0].focusMs, 1500000); assert.equal(s.focusTotalMs, 1500000);
  assert.equal(goals.dailySummary(s, goals.localDateKey(now())).focusMs, 1500000);
});
test('completing, finishing and reopening cannot duplicate an already recorded session', () => {
  let s = linkedStart(add(fresh())); s = timer.reconcileTimer(s, s.endAt + 900000);
  const again = timer.finishTimer(s, now() + 9999999); assert.equal(again, s);
  s = timer.restoreTimerState(JSON.stringify(s), now() + 9999999); assert.equal(s.sessions.length, 1); assert.equal(s.completedSessions, 1); assert.equal(s.focusTotalMs, 1500000);
});
test('active goal remains bound even if next-goal selection differs', () => {
  let s = add(add(fresh()), 'Another goal'); s = linkedStart(s); const bound = s.activeFocus.goalId;
  s = timer.pauseTimer(s, now() + 1000); s = { ...s, selectedGoalId: s.goals[1].id }; s = timer.startTimer(s, now() + 3000); s = timer.reconcileTimer(s, s.endAt);
  assert.equal(s.sessions[0].goalId, bound);
});
test('focus without any goal remains a complete optional path', () => {
  let s = timer.startTimer(fresh(), now()); s = timer.reconcileTimer(s, s.endAt);
  assert.equal(s.sessions[0].goalId, null); assert.equal(s.sessions[0].review, null); assert.equal(goals.pendingGoalSession(s), undefined);
});
test('still-working preserves the goal and its selection; finished checks it off', () => {
  let s = linkedStart(add(fresh())); s = timer.reconcileTimer(s, s.endAt);
  s = goals.reviewGoalSession(s, s.sessions[0].id, false, now()); assert.equal(s.goals[0].completedAt, null); assert.equal(s.selectedGoalId, s.goals[0].id); assert.equal(goals.pendingGoalSession(s), undefined);
  s = timer.startFocusTimer(s, 25, now() + 2000000); s = timer.reconcileTimer(s, s.endAt);
  const total = s.focusTotalMs; s = goals.reviewGoalSession(s, s.sessions[1].id, true, now() + 3600000);
  assert.ok(s.goals[0].completedAt); assert.equal(s.focusTotalMs, total); assert.equal(s.lastGoalCelebration.kind, 'all');
  s = goals.completeDailyGoal(s, s.goals[0].id, false, now() + 3600001); assert.equal(goals.pendingGoalSession(s), undefined);
});
test('rechecking goals grants no repeated celebration or time credit', () => {
  let s = add(fresh()); s = goals.completeDailyGoal(s, s.goals[0].id, true, now()); const event = s.lastGoalCelebration.id;
  s = goals.completeDailyGoal(s, s.goals[0].id, false, now() + 1); s = goals.completeDailyGoal(s, s.goals[0].id, true, now() + 2);
  assert.equal(s.lastGoalCelebration.id, event); assert.equal(s.celebratedDates.length, 1); assert.equal(s.focusTotalMs, 0);
});
test('moving unfinished goals retains their IDs and completed goals stay put', () => {
  let s = add(add(fresh()), 'Second goal'); const id = s.goals[0].id, today = goals.localDateKey(now());
  s = goals.moveGoalToTomorrow(s, id, today); assert.equal(s.goals[0].date, '2026-11-16'); assert.equal(s.goals.length, 2);
  s = goals.moveGoalToToday(s, id, today); assert.equal(s.goals[0].date, today); assert.equal(s.goals[0].id, id);
  s = goals.completeDailyGoal(s, id, true, now()); s = goals.moveGoalToTomorrow(s, id, today); assert.equal(s.goals[0].date, today);
});
test('cross-midnight focus time splits by local date, completion belongs to the ending day', () => {
  const start = new Date(2026, 10, 15, 23, 55).getTime(); let s = timer.setFocusDuration(add(fresh()), 10); s = linkedStart(s, start); s = timer.reconcileTimer(s, s.endAt);
  assert.equal(s.sessions[0].date, '2026-11-16'); assert.equal(goals.dailySummary(s, '2026-11-15').focusMs, 300000); assert.equal(goals.dailySummary(s, '2026-11-16').focusMs, 300000);
  assert.equal(goals.dailySummary(s, '2026-11-15').sessions, 0); assert.equal(goals.dailySummary(s, '2026-11-16').sessions, 1);
});
test('local date keys are not UTC dates and calendar-day boundaries respect DST', () => {
  assert.equal(goals.localDateKey(Date.parse('2026-11-14T15:30:00Z')), '2026-11-15');
  process.env.TZ = 'America/New_York';
  try { const spring = goals.goalDayBounds('2026-03-08'), fall = goals.goalDayBounds('2026-11-01'); assert.equal(spring[1] - spring[0], 23 * 3600000); assert.equal(fall[1] - fall[0], 25 * 3600000); assert.equal(goals.nextLocalDate('2026-03-08'), '2026-03-09'); } finally { process.env.TZ = 'Asia/Seoul'; }
});
test('early finish credits actual focus but does not invent a full Pomodoro', () => {
  let s = linkedStart(add(fresh())); s = timer.finishTimer(s, now() + 120000);
  assert.equal(s.focusTotalMs, 120000); assert.equal(s.sessions[0].completed, false); assert.equal(goals.dailySummary(s, '2026-11-15').sessions, 0); assert.equal(goals.dailySummary(s, '2026-11-15').focusMs, 120000);
  assert.equal(s.completedSessions, 1); // Keep the pre-existing lifetime timer semantics.
});
test('breaks add no focus history and every fourth focus still gives a long break', () => {
  let s = fresh(), at = now(); for (let i = 0; i < 4; i++) { s = timer.startFocusTimer(s, 25, at); at = s.endAt; s = timer.reconcileTimer(s, at); if (i < 3) { s = timer.startTimer(s, at); at = s.endAt; s = timer.reconcileTimer(s, at); } }
  assert.equal(s.mode, 'longBreak'); assert.equal(s.durationMs, 900000); assert.equal(s.sessions.length, 4); assert.equal(s.focusTotalMs, 6000000);
});
test('deleting an active goal preserves the session audit link without an orphan prompt', () => {
  let s = linkedStart(add(fresh())); const goalId = s.goals[0].id; s = goals.deleteDailyGoal(s, goalId, now() + 1000); s = timer.reconcileTimer(s, s.endAt);
  assert.equal(s.sessions[0].goalId, goalId); assert.equal(s.sessions[0].goalTitle, 'Finish React assignment'); assert.equal(goals.pendingGoalSession(s), undefined);
});
test('duplicate stored IDs are deduplicated and completion is atomic on offline restoration', () => {
  const running = linkedStart(add(fresh())); const restored = timer.restoreTimerState(JSON.stringify(running), running.endAt + 50000);
  assert.equal(restored.sessions.length, 1); assert.ok(goals.pendingGoalSession(restored));
  const duplicate = timer.restoreTimerState(JSON.stringify({ ...restored, sessions: [...restored.sessions, ...restored.sessions] })); assert.equal(duplicate.sessions.length, 1);
});
test('serialized AsyncStorage writes preserve the latest snapshot and recover after errors', async () => {
  const first = timer.saveTimerState({ ...fresh(), focusTotalMs: 111 }); const second = timer.saveTimerState({ ...fresh(), focusTotalMs: 222 }); await Promise.all([first, second]); assert.equal((await timer.loadTimerState()).focusTotalMs, 222);
  failNext = true; await assert.rejects(timer.saveTimerState(fresh())); await timer.saveTimerState({ ...fresh(), focusTotalMs: 333 }); assert.equal((await timer.loadTimerState()).focusTotalMs, 333);
});

test('Living Awards backfill all milestones from verified history with their original dates', () => {
 const { AWARDS, studyMilestones } = load('../awards/progression.ts');
 const hour = 60 * 60_000;
 const history = Array.from({ length: 100 }, (_, index) => {
  const startedAt = new Date(2026, 8, 1 + Math.floor(index / 5), 8 + index % 5).getTime();
  return { id: 'award-' + index, startedAt, endedAt: startedAt + hour, date: goals.localDateKey(startedAt),
   focusMs: hour, spans: [{ start: startedAt, end: startedAt + hour }], completed: true };
 });
 const { progress, earned } = studyMilestones([...history].reverse().concat(history[0]));
 assert.deepEqual(progress, { time: 100 * hour, longest: hour, sessions: 100, days: 20, uninterrupted: 100 });
 const milestoneSessions = [0, 4, 9, 24, 49, 99, 30, 9];
 AWARDS.forEach((award, index) => assert.equal(earned[award.id], history[milestoneSessions[index]].endedAt));
 const legacy = fresh();
 delete legacy.awards;
 const restored = timer.restoreTimerState(JSON.stringify({ ...legacy, sessions: history }));
 assert.deepEqual(restored.awards.unlocked, earned);
 assert.deepEqual(restored.awards.pending, []);
 assert.deepEqual(timer.restoreTimerState(JSON.stringify(restored)).awards, restored.awards);
});

test('Living Awards exclude early finishes and paused time from verified milestone progress', () => {
 const { studyMilestones } = load('../awards/progression.ts');
 const opened = timer.startTimer(fresh(), now());
 const early = timer.finishTimer(opened, now() + 20 * 60_000);
 const paused = timer.pauseTimer(opened, now() + 9 * 60_000);
 const resumed = timer.startTimer(paused, now() + 60 * 60_000);
 const complete = timer.reconcileTimer(resumed, resumed.endAt);
 assert.equal(complete.sessions[0].interrupted, true);
 assert.equal(complete.awards.unlocked['first-steps'], resumed.endAt);
 assert.deepEqual(studyMilestones([...early.sessions, ...complete.sessions]).progress, {
  time: 25 * 60_000, longest: 25 * 60_000, sessions: 1, days: 1, uninterrupted: 0,
 });
 const zeroPause = timer.pauseTimer(opened, now());
 const immediatelyResumed = timer.startTimer(zeroPause, now());
 const finished = timer.reconcileTimer(immediatelyResumed, immediatelyResumed.endAt);
 assert.equal(studyMilestones(finished.sessions).progress.uninterrupted, 0);
 assert.deepEqual(timer.restoreTimerState(JSON.stringify({ ...fresh(), focusTotalMs: 1000 * 60 * 60_000 })).awards.pending, []);
 assert.equal(Object.keys(early.awards.unlocked).length, 0);
});

test('simultaneous award reveals, display customization and session replay survive atomic saves', async () => {
 const { changeAward } = load('../awards/progression.ts');
 const duration = 30 * 60_000;
 const history = Array.from({ length: 9 }, (_, index) => {
  const startedAt = now() - (10 - index) * duration;
  return { id: 'queue-' + index, startedAt, endedAt: startedAt + duration, date: goals.localDateKey(startedAt),
   focusMs: duration, spans: [{ start: startedAt, end: startedAt + duration }], completed: true };
 });
 const before = timer.restoreTimerState(JSON.stringify({ ...fresh(), sessions: history, focusMinutes: 30 }));
 const running = timer.startFocusTimer(before, 30, now());
 const finished = timer.reconcileTimer(running, running.endAt);
 assert.deepEqual(finished.awards.pending, ['focus-explorer', 'deep-focus']);
 assert.equal(changeAward(finished.awards, 'deep-focus', 'presented'), finished.awards);
 let awards = changeAward(finished.awards, 'focus-explorer', 'presented');
 awards = changeAward(awards, 'deep-focus', 'earlier');
 awards = changeAward(awards, 'first-steps', 'hide');
 await timer.saveTimerState({ ...finished, awards });
 const restored = await timer.loadTimerState();
 assert.deepEqual(restored.awards, awards);
 assert.deepEqual(awards.order, ['first-steps', 'deep-focus', 'focus-explorer']);
 assert.deepEqual(awards.hidden, ['first-steps']);
 assert.deepEqual(awards.pending, ['deep-focus']);
 const replayed = timer.reconcileTimer({ ...running, sessions: restored.sessions, awards }, running.endAt);
 assert.deepEqual(replayed.awards, awards);
 assert.equal(replayed.sessions.length, 10);
});

test('pet adoption uses verified milestones and saves names, active pet, and following', async () => {
 const { changePet } = load('../pets/pets.ts');
 const startedAt = now();
 const hour = 3_600_000;
 const history = Array.from({ length: 30 }, (_, index) => ({
  id: String(index), startedAt: startedAt + index * hour, endedAt: startedAt + (index + 1) * hour,
  date: goals.localDateKey(startedAt + index * hour), completed: true, focusMs: hour,
  spans: [{ start: startedAt + index * hour, end: startedAt + (index + 1) * hour }],
 }));
 const empty = fresh().home.pets;
 let pets = changePet(empty, [], { type: 'adopt', pet: 'seal', name: ' Pebble ' });
 assert.deepEqual(pets, { adopted: ['seal'], active: 'seal', names: { seal: 'Pebble' }, following: false });
 assert.equal(changePet(pets, history.slice(0, 4).concat(history[0]), { type: 'adopt', pet: 'fox', name: 'Flurry' }), pets);
 const early = { ...history[4], completed: false };
 assert.equal(changePet(pets, history.slice(0, 4).concat(early), { type: 'adopt', pet: 'fox', name: 'Flurry' }), pets);
 for (const [pet, name, threshold] of [['fox','Flurry',5],['bunny','Puff',15],['bear','Snowcap',30]]) {
  const command = { type: 'adopt', pet, name };
  assert.equal(changePet(pets, history.slice(0, threshold-1), command), pets);
  pets = changePet(pets, history.slice(0, threshold), command);
  assert.equal(pets.active, pet);
 }
 pets = changePet(pets, history, { type: 'activate', pet: 'seal' });
 pets = changePet(pets, history, { type: 'following', value: true });
 const snapshot = fresh();
 await timer.saveTimerState({ ...snapshot, sessions: history, home: { ...snapshot.home, pets } });
 assert.deepEqual((await timer.loadTimerState()).home.pets, pets);
});

test('window surprises are unique to their scenes and respect cooldowns and quiet periods', () => {
 const { SURPRISES, pickSurprise, surpriseDelay } = load('../window-surprises/events.ts');
 assert.equal(SURPRISES.length, 33);
 assert.equal(new Set(SURPRISES.map(event => event.id)).size, 33);
 for (const scene of ['blizzard','aquarium','beach','moon','spaceship','zombies']) {
  const sceneEvents = SURPRISES.filter(event => event.scene === scene);
  assert.ok(sceneEvents.length >= 5);
  const first = pickSurprise(scene, [], false, false, () => .2);
  assert.equal(first.scene, scene);
  assert.equal(first.rarity, 'small');
  assert.notEqual(pickSurprise(scene, [first.id], true, true, () => .2).id, first.id);
  assert.equal(pickSurprise(scene, [], true, true, () => 0), undefined);
 }
 assert.equal(surpriseDelay(() => 0), 8 * 60_000);
 assert.equal(surpriseDelay(() => 1), 15 * 60_000);
});

test('window journal discoveries and explicit sound preferences share the timer snapshot', async () => {
 const date = now();
 await timer.saveTimerState({ ...fresh(), discoveries: { 'snow-fox': date, 'baby-whale': date + 1, troll: date, aurora: -1 }, surpriseSounds: true });
 const restored = await timer.loadTimerState();
 assert.deepEqual(restored.discoveries, { 'snow-fox': date, 'baby-whale': date + 1 });
 assert.equal(restored.surpriseSounds, true);
 const legacy = fresh();
 delete legacy.discoveries;
 delete legacy.surpriseSounds;
 const migrated = timer.restoreTimerState(JSON.stringify(legacy));
 assert.deepEqual(migrated.discoveries, {});
 assert.equal(migrated.surpriseSounds, false);
});

test('Winter Garden unlocks from verified history and grows one plot atomically through all five stages', () => {
  const garden = load('../garden/progression.ts');
  const awards = load('../awards/progression.ts');
  let state = fresh();
  const plant = (slot, kind) => garden.changeGarden(state.home.garden, { type: 'plant', slot, kind }, state.sessions);
  assert.equal(plant(0, 0), state.home.garden);
  let at = now();
  const complete = () => {
    const running = timer.startFocusTimer(state, 25, at);
    at = running.endAt + 10;
    state = timer.reconcileTimer(running, at);
    return running;
  };
  complete();
  assert.equal(plant(0, 1), state.home.garden);
  state.home.garden = plant(0, 0);
  assert.equal(state.home.garden.active, 0);
  assert.equal(state.home.garden.plots[0].ms, 0);
  const running = timer.startFocusTimer(state, 25, at);
  state = timer.finishTimer(timer.pauseTimer(running, at + 5000), at + 10_000);
  assert.equal(state.home.garden.plots[0].ms, 0);
  at += 20_000;
  for (const expected of [1, 2, 2, 3, 3, 4, 4, 5]) {
    const previous = complete();
    const snapshot = JSON.stringify(state);
    state = timer.restoreTimerState(snapshot, at);
    assert.equal(garden.stage(state.home.garden.plots[0]), expected);
    assert.deepEqual(timer.reconcileTimer(state, at + 1000).home.garden, state.home.garden);
    const replay = { ...previous, home: state.home, sessions: state.sessions };
    assert.deepEqual(timer.reconcileTimer(replay, at).home.garden, state.home.garden);
  }
  assert.equal(garden.minutes(state.home.garden.plots[0]), 200);
  const moved = garden.changeGarden(state.home.garden, { type: 'move', slot: 0, to: 5 }, state.sessions);
  const decorated = garden.changeGarden(moved, { type: 'decorate', slot: 5 }, state.sessions);
  assert.equal(garden.restoreGarden(JSON.parse(JSON.stringify(decorated))).plots[5].decoration, 1);
  assert.equal(decorated.active, 5);
  assert.equal(decorated.plots[0], null);
  const { progress } = awards.studyMilestones(state.sessions);
  assert.equal(garden.canPlant(1, progress), false);
  assert.ok(garden.PLANTS.every((item, i) => garden.canPlant(i, { ...progress, time: 75 * 3600000 })));
});

test('Winter Garden uses actual focus spans and credits a closed app completion once', () => {
  const garden = load('../garden/progression.ts');
  const state = fresh();
  state.home.garden.plots[0] = { kind: 0, ms: 0, decoration: 0, seenStage: 0 };
  state.home.garden.plots[1] = { kind: 0, ms: 0, decoration: 0, seenStage: 0 };
  state.home.garden.active = 1;
  const started = timer.startFocusTimer(state, 25, now());
  const paused = timer.pauseTimer(started, now() + 60_000);
  const resumed = timer.startTimer(paused, now() + 660_000);
  const restored = timer.restoreTimerState(JSON.stringify(resumed), resumed.endAt + 5000);
  assert.equal(restored.home.garden.plots[0].ms, 0);
  assert.equal(restored.home.garden.plots[1].ms, 25 * 60_000);
  assert.equal(garden.stage(restored.home.garden.plots[1]), 1);
  const savedAgain = timer.restoreTimerState(JSON.stringify(restored), resumed.endAt + 6000);
  assert.deepEqual(savedAgain.home.garden, restored.home.garden);
});

test('furniture decor positions and independent sound settings survive restoration', () => {
 const saved = fresh();
 const equipped = home.purchaseHome({...saved.home,snowflakes:500},'decor-tea');
 const placed = home.moveHomeDecoration(equipped,'tabletop',1);
 assert.equal(placed.decorPlacement.tabletop,1);
 assert.equal(home.moveHomeDecoration(placed,'tabletop',1).decorPlacement.tabletop,1);
 assert.equal(home.moveHomeDecoration(placed,'bed',-1),placed);
 const restored = timer.restoreTimerState(JSON.stringify({...saved,home:{...placed,furnitureSounds:false}}),now());
 assert.equal(restored.home.furnitureSounds,false);
 assert.equal(restored.home.equipped.tabletop,placed.equipped.tabletop);
 assert.equal(restored.home.decorPlacement.tabletop,1);
 const defaults=home.arrangeHomeState(restored.home,'default');
 assert.deepEqual(defaults.decorPlacement,{});
 assert.deepEqual(defaults.equipped,home.createHome().equipped);
 assert.equal(defaults.furnitureSounds,false);
});

test('furniture activities defer while focused or paused and never mutate the timer', () => {
 const {canPerformFurnitureActivity, intersects, roomBox}=load('../furniture/catalog.ts');
 const current=timer.startFocusTimer(fresh(),25,now());
 const before=JSON.stringify(current);
 assert.equal(canPerformFurnitureActivity(current.mode,current.status),false);
 assert.equal(canPerformFurnitureActivity('shortBreak','paused'),false);
 assert.equal(canPerformFurnitureActivity('shortBreak','running'),true);
 assert.equal(canPerformFurnitureActivity('focus','idle'),true);
 assert.equal(JSON.stringify(current),before);
 assert.equal(intersects(roomBox(2,89,17,10),roomBox(21,87.7,17,11.3)),false);
 assert.equal(intersects(roomBox(2,89,17,10),roomBox(11,81,17,12)),true);
});


test('gift milestones use verified completions and can be claimed only once', () => {
 const gifts=load('../gifts/progression.ts');
 const history=Array.from({length:100},(_,i)=>{
   const startedAt=now()+i*4_000_000, endedAt=startedAt+3_600_000;
   return { id:`gift-history-${i}`, completed:true, focusMs:3_600_000, startedAt, endedAt,
     date:goals.localDateKey(endedAt), spans:[{start:startedAt,end:endedAt}], interrupted:false, review:null };
 });
 assert.deepEqual(gifts.pendingGifts(history.slice(0,1),{}).map(g=>g.id),['first']);
 assert.equal(gifts.pendingGifts([{...history[0],completed:false},{...history[1],spans:[]}],{}).length,0);
 assert.equal(gifts.pendingGifts([history[0],history[0],history[0]],{}).length,1);
 const paused={...history[0], spans:[{start:history[0].startedAt,end:history[0].startedAt+60_000}]};
 assert.equal(gifts.pendingGifts([paused,...history.slice(1,5)],{}).some(g=>g.id==='five'),false);
 for(const milestone of gifts.GIFTS) {
   const threshold=milestone.metric==='sessions'?milestone.target:milestone.target/3_600_000;
   assert.equal(gifts.pendingGifts(history.slice(0,threshold-1),{}).some(g=>g.id===milestone.id),false);
   assert.equal(gifts.pendingGifts(history.slice(0,threshold),{}).some(g=>g.id===milestone.id),true);
 }
 assert.equal(gifts.pendingGifts(history,{}).length,7);
 let state={...fresh(),sessions:history};
 state.home=home.claimMysteryGift(state.home,state.sessions,'first');
 assert.equal(state.home.gifts.first.rewardId,'gift-scarf');
 assert.ok(state.home.wardrobe.owned.includes('scarf-berry'));
 assert.equal(state.home.wardrobe.equipped.neck,'scarf-teal');
 state=timer.restoreTimerState(JSON.stringify(state),history.at(-1).endedAt);
 assert.equal(home.claimMysteryGift(state.home,state.sessions,'first'),state.home);
 state.home=home.equipWardrobe(state.home,'scarf-berry');
 assert.equal(state.home.wardrobe.equipped.neck,'scarf-berry');
 state.home=home.claimMysteryGift(state.home,state.sessions,'five');
 assert.equal(state.home.gifts.five.rewardId,'gift-globe');
 assert.equal(state.home.equipped.tabletop,undefined);
 state.home=home.equipHome(state.home,'gift-globe');
 assert.equal(timer.restoreTimerState(JSON.stringify(state),history.at(-1).endedAt).home.equipped.tabletop,'gift-globe');
 for(const gift of gifts.pendingGifts(state.sessions,state.home.gifts)) state.home=home.claimMysteryGift(state.home,state.sessions,gift.id);
 const rewards=Object.values(state.home.gifts).map(claim=>claim.rewardId);
 assert.equal(new Set(rewards).size,7);
 assert.equal(state.home.gifts.hundred.rewardId,'gift-statue');
 assert.equal(gifts.pendingGifts(state.sessions,state.home.gifts).length,0);
});

test('a completed gift pool pays saved Snowflakes and gift-only items cannot be bought', () => {
 const gifts=load('../gifts/progression.ts');
 const { REWARDS }=load('../gifts/catalog.ts');
 let wardrobe=home.createWardrobe();
 wardrobe.owned.push(...REWARDS.filter(r=>r.wardrobe).map(r=>r.wardrobe));
 const start=now(),end=start+25*60_000;
 const sessions=[{id:'full-pool',completed:true,focusMs:end-start,startedAt:start,endedAt:end,spans:[{start,end}]}];
 const initial={...home.createHome(),wardrobe,owned:[...home.createHome().owned,...REWARDS.filter(r=>r.slot).map(r=>r.id)]};
 const result=home.claimMysteryGift(initial,sessions,'first');
 assert.deepEqual(result.gifts.first,{snowflakes:gifts.ALTERNATIVE.Common});
 assert.equal(result.snowflakes,gifts.ALTERNATIVE.Common);
 assert.equal(home.claimMysteryGift(result,sessions,'first'),result);
 assert.equal(home.restoreHome(result,[]).gifts.first.snowflakes,gifts.ALTERNATIVE.Common);
 const freshHome=home.createHome();
 assert.equal(home.purchaseHome(freshHome,'gift-globe'),freshHome);
 assert.equal(home.purchaseWardrobe(freshHome,'gift-hat'),freshHome);
});

test('all 20 rewards and four articulated gifts use distinct transparent artwork', async () => {
 const sharp=require('sharp');
 const { REWARDS }=load('../gifts/catalog.ts');
 const base=path.join(__dirname,'../../assets/environments/igloo/gifts');
 assert.equal(REWARDS.length,20);
 assert.equal(new Set(REWARDS.map(item=>item.art)).size,20);
 for(const item of REWARDS) {
   const metadata=await sharp(path.join(base,item.art+'.webp')).metadata();
   assert.equal(metadata.hasAlpha,true);
 }
 for(let i=0;i<4;i++){
   const animation=JSON.parse(fs.readFileSync(path.join(base,`open-${i}.json`),'utf8'));
   assert.deepEqual(animation.assets.map(item=>item.id),['body','lid']);
   assert.equal(animation.op/animation.fr,2.6);
   assert.ok(animation.layers.find(item=>item.refId==='lid').ks.p.k.length>6);
 }
});

test('onboarding resumes saved story and preserves existing users and legacy names', () => {
 const onboarding=load('../onboarding/profile.ts');
 const draft=onboarding.restoreProfile({version:3,step:'hatch',hatchTaps:2,penguinName:'Mochi',age:'18–24',topics:['Languages','Coding','Coding'],primary:'Coding',target:90});
 assert.equal(draft.step,'hatch');
 assert.equal(draft.hatchTaps,2);
 assert.equal(onboarding.companionName(draft),'Mochi');
 assert.deepEqual(draft.topics,['Languages','Coding']);
 assert.equal(draft.target,90);
 assert.deepEqual(onboarding.restoreProfile(JSON.parse(JSON.stringify(draft))),draft);
 const legacy=onboarding.restoreProfile({step:'duration',penguinName:'Pipo',userName:'Ada',activity:'Reading'},true,false,true);
 assert.equal(legacy.penguinName,'Pipo');
 assert.equal(legacy.userName,'Ada');
 assert.equal(legacy.completed,true);
 assert.equal(legacy.firstDaySeen,true);
 const building=onboarding.restoreProfile({step:'tutorial',placedBlock:true,duration:15,penguinName:'Pipo'});
 assert.equal(building.step,'tutorial');
 assert.equal(building.placedBlock,true);
 assert.equal(building.sessionMinutes,15);
 assert.equal(building.target,25);
 assert.equal(onboarding.restoreProfile(null,false,true,false).completed,true);
 assert.equal(onboarding.restoreProfile(null).completed,false);
});

test('the seven day plan uses regular checklist entries and can be imported once without overwriting edits', () => {
 const onboarding=load('../onboarding/profile.ts');
 const today=goals.localDateKey(now());
 const days=onboarding.planDates(today);
 assert.equal(new Set(days).size,7);
 for(const topic of onboarding.TOPICS) assert.equal(onboarding.buildPlan(topic,null).length,7);
 assert.equal(onboarding.buildPlan(null,'Under 18')[0],'Review notes');
 const plan=onboarding.buildPlan('Coding',null);
 plan[0]='Build a timer';
 plan[6]='';
 const initial=add(fresh(),'Existing task');
 let state=onboarding.addPlanToGoals(initial,plan,today,now());
 assert.equal(state.goals.length,7);
 assert.equal(state.goals[1].title,'Build a timer');
 assert.equal(onboarding.addPlanToGoals(state,plan,today,now()),state);
 state=goals.editDailyGoal(state,state.goals[1].id,'Existing edit');
 state=onboarding.addPlanToGoals(state,plan,today,now());
 assert.equal(state.goals[1].title,'Existing edit');
 state=timer.startFocusTimer({...state,selectedGoalId:state.goals[1].id},25,now());
 assert.equal(state.activeFocus.goalTitle,'Existing edit');
});

test('first-day streak dates reflect completed active spans and not merely opening or early finish', () => {
 const milestones=load('../awards/progression.ts').studyMilestones;
 const start=now(), day=goals.localDateKey(start);
 const running=timer.startFocusTimer(fresh(),25,start);
 assert.deepEqual(milestones(running.sessions).verifiedDays,[]);
 assert.deepEqual(milestones(timer.finishTimer(running,start+10_000).sessions).verifiedDays,[]);
 const complete=timer.reconcileTimer(running,running.endAt);
 assert.deepEqual(milestones(complete.sessions).verifiedDays,[day]);
 assert.deepEqual(milestones([ {...complete.sessions[0],spans:[]} ]).verifiedDays,[]);
});

test('returning from an idle break restores the shared focus preference without starting a session', () => {
 const initial = { ...fresh(), mode: 'shortBreak', durationMs: 300_000, remainingMs: 300_000, focusMinutes: 45 };
 const prepared = timer.prepareFocusTimer(initial);
 assert.equal(prepared.mode, 'focus');
 assert.equal(prepared.status, 'idle');
 assert.equal(prepared.remainingMs, 45 * 60_000);
 assert.equal(prepared.activeFocus, null);
 assert.equal(timer.prepareFocusTimer({ ...initial, status: 'running' }).mode, 'shortBreak');
});

test('early finish remains in activity, while completed focus grows the igloo and earns rewards', () => {
 const start = now();
 const legacy = { ...fresh(), focusTotalMs: 10 * 60_000 };
 let current = timer.startTimer(legacy, start);
 current = timer.finishTimer(current, start + 8 * 60_000);
 assert.equal(timer.iglooConstruction(current).minutes, 10);
 assert.equal(current.home.snowflakes, 0);
 assert.equal(goals.dailySummary(current, goals.localDateKey(start)).focusMs, 8 * 60_000);
 current = timer.startTimer(timer.prepareFocusTimer(current), start + 9 * 60_000);
 current = timer.reconcileTimer(current, current.endAt);
 assert.equal(timer.iglooConstruction(current).minutes, 35);
 assert.equal(current.home.snowflakes, 25);
 assert.equal(goals.dailySummary(current, goals.localDateKey(start)).focusMs, 33 * 60_000);
});

test('study worlds unlock at completed focus milestones and persist through storage', async () => {
 const initial = fresh();
 assert.equal(home.switchStudyRoom(initial.home, 'bedroom', 2), initial.home);
 let state = initial;
 for (let index = 0; index < 2; index++) {
  state = timer.startFocusTimer(state, 20, now() + index * 3_600_000);
  state = timer.reconcileTimer(state, state.endAt);
 }
 state = timer.startFocusTimer(state, 20, now() + 2 * 3_600_000);
 const early = timer.finishTimer(state, state.endAt - 60_000);
 assert.equal(home.roomUnlocked(early.home, 'bedroom', 0), false);
 state = timer.reconcileTimer(state, state.endAt);
 assert.equal(home.roomUnlocked(state.home, 'bedroom', 0), true);
 assert.equal(home.roomUnlocked(state.home, 'library', 0), false);

 let room = home.switchStudyRoom({...state.home, snowflakes:300}, 'bedroom', 3);
 room = home.purchaseHome(room, 'desk-walnut');
 room = home.arrangeHomeState(room, 'save');
 room = home.switchStudyRoom(room, 'igloo', 3);
 assert.equal(room.equipped.desk, 'desk-oak');
 assert.equal(room.saved.desk, 'desk-oak');
 assert.ok(room.owned.includes('desk-walnut'));
 room = home.switchStudyRoom(room, 'bedroom', 3);
 assert.equal(room.equipped.desk, 'desk-walnut');
 assert.equal(room.saved.desk, 'desk-walnut');
 assert.equal(room.previous.desk, 'desk-oak');
 assert.deepEqual(room.wardrobe, state.home.wardrobe);

 await timer.saveTimerState({...state, home:room});
 const restored = await timer.loadTimerState();
 assert.equal(restored.home.activeRoom, 'bedroom');
 assert.equal(restored.home.equipped.desk, 'desk-walnut');
 assert.equal(restored.home.roomLayouts.igloo.equipped.desk, 'desk-oak');
});
