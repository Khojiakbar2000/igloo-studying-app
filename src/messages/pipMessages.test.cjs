const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
process.env.TZ = 'Asia/Seoul';
const cache = new Map();
function load(file) {
  file = path.resolve(__dirname, file);
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} }; cache.set(file, module);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const requireModule = name => name.startsWith('.') ? load(path.resolve(path.dirname(file), name + '.ts')) : require(name);
  vm.runInThisContext('(function(require,module,exports){' + code + '\n})', { filename:file })(requireModule, module, module.exports);
  return module.exports;
}
const mail = load('pipMessages.ts');
const session = (id, start, ms) => ({ id, goalId:null, goalTitle:null, startedAt:start, endedAt:start+ms, date:new Date(start).toISOString().slice(0,10), focusMs:ms, spans:[{start,end:start+ms}], completed:true, interrupted:false, review:null });
const input = (sessions=[], extra={}) => ({ sessions, awards:{unlocked:{}}, pets:[], discoveries:{}, snowfall:true, mode:'focus', userName:'Ada', ...extra });

test('welcome, session milestones, daily limits, replies and favorites persist without duplicate mail', () => {
  const day1 = new Date(2026,10,20,10).getTime();
  let state = mail.syncPipMail(mail.EMPTY_PIP_MAIL, input(), 'visit', day1);
  assert.equal(state.letters.length, 1);
  assert.match(state.letters[0].body, /Ada/);
  const first = session('s1', day1-30*60_000, 25*60_000);
  state = mail.syncPipMail(state, input([first], {mode:'shortBreak'}), 'activity', day1+1_000);
  assert.equal(state.ordinaryByDay['2026-11-20'], 2);
  assert.equal(state.letters.filter(letter => !letter.important).length, 2);
  assert.ok(state.pendingEvents.some(event => event.key === '25-minutes'));
  state = mail.syncPipMail(state, input([first], {awards:{unlocked:{'first-steps':day1}}, mode:'shortBreak'}), 'activity', day1+2_000);
  assert.equal(state.letters.filter(letter => letter.category === 'achievement').length, 1);
  const day2 = new Date(2026,10,21,10).getTime();
  state = mail.syncPipMail(state, input([first], {awards:{unlocked:{'first-steps':day1}}}), 'visit', day2);
  const cocoa = state.letters.find(letter => letter.reply === 'cocoa');
  assert.ok(cocoa);
  state = mail.updateLetter(state, cocoa.id, 'read', day1+3_000);
  state = mail.updateLetter(state, cocoa.id, 'favorite');
  state = mail.updateLetter(state, cocoa.id, 'yes');
  assert.equal(state.letters.find(letter => letter.id === cocoa.id).replyChoice, 'yes');
  assert.equal(state.letters.find(letter => letter.id === cocoa.id).favorite, true);
  const restored = mail.restorePipMail(JSON.parse(JSON.stringify(state)));
  const repeated = mail.syncPipMail(restored, input([first], {awards:{unlocked:{'first-steps':day1}}, mode:'shortBreak'}), 'activity', day2+4_000);
  assert.equal(repeated.letters.length, restored.letters.length);
  assert.equal(mail.unreadLetters(repeated), mail.unreadLetters(restored));

  const next = mail.syncPipMail(repeated, input([first], {awards:{unlocked:{'first-steps':day1}}}), 'visit', day2+10_000);
  assert.ok(next.letters.some(letter => letter.eventKey === '25-minutes'));
  assert.ok(next.letters.some(letter => letter.eventKey.startsWith('daily-greeting:')));
  assert.ok(next.ordinaryByDay['2026-11-21'] <= 2);
});

test('special hour letters use verified sessions and historical progress is backfilled once', () => {
  const start = new Date(2026,10,20,8).getTime();
  const sessions = Array.from({length:100}, (_, index) => session(`hour-${index}`, start+index*24*60*60_000, 60*60_000));
  const state = mail.syncPipMail(mail.EMPTY_PIP_MAIL, input(sessions), 'visit', start+101*24*60*60_000);
  assert.equal(state.letters.filter(letter => letter.eventKey === 'ten-hours').length, 1);
  assert.equal(state.letters.find(letter => letter.eventKey === 'ten-hours').important, true);
  assert.equal(state.letters.filter(letter => letter.eventKey === 'fifty-hours').length, 1);
  assert.equal(state.letters.filter(letter => letter.eventKey === 'hundred-hours').length, 1);
  assert.ok(state.pendingEvents.some(event => event.key === 'seven-days'));
  assert.equal(state.letters.filter(letter => !letter.important).length <= 2, true);
  const again = mail.syncPipMail(state, input(sessions), 'activity', start+102*24*60*60_000);
  assert.equal(again.letters.filter(letter => letter.eventKey === 'ten-hours').length, 1);
});

test('partial or paused sessions do not invent study milestone letters', () => {
  const now = new Date(2026,10,20,10).getTime();
  const partial = { ...session('paused',now-26*60_000,26*60_000), completed:false, interrupted:true };
  const noSpan = { ...session('bad-span',now-26*60_000,26*60_000), spans:[] };
  const state = mail.syncPipMail(mail.EMPTY_PIP_MAIL, input([partial,noSpan]), 'visit', now);
  assert.equal(state.letters.some(letter => letter.eventKey === '25-minutes'), false);
  assert.equal(state.letters.some(letter => letter.eventKey === 'first-session'), false);
});
