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
test('the complete catalog has transparent assets aligned to each fixed slot', async () => {
 const sharp=require('sharp'),{HOME_CATALOG}=load('../home/catalog.ts'),{HOME_SLOTS}=load('../home/slots.ts');
 assert.equal(HOME_CATALOG.length,25);assert.equal(new Set(HOME_CATALOG.map(i=>i.id)).size,25);
 for(const [category,count]of Object.entries({Beds:3,Sofas:3,Desks:3,Rugs:3,Lighting:3,Windows:2,Ceiling:1,Shelves:2,Decor:5}))assert.equal(HOME_CATALOG.filter(i=>i.category===category).length,count);
 for(const item of HOME_CATALOG){
  const box=HOME_SLOTS[item.slot],meta=await sharp(path.join(__dirname,'../../assets/home-customization/items',item.id+'.png')).metadata();
  assert.equal(meta.hasAlpha,true,item.id);assert.equal(meta.width,box.width*2,item.id);assert.equal(meta.height,box.height*2,item.id);
  assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=1024&&box.y+box.height<=1536,item.id);
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
