const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function reminders(os, granted = false, canAskAgain = true, accepts = true) {
  const calls = [];
  const Notifications = {
    AndroidImportance: { DEFAULT: 'default' }, IosAuthorizationStatus: { PROVISIONAL: 3 },
    SchedulableTriggerInputTypes: { DAILY: 'daily' },
    getPermissionsAsync: async () => { calls.push(['read']); return { granted, canAskAgain }; },
    requestPermissionsAsync: async args => { calls.push(['permission', args]); return { granted: accepts, canAskAgain }; },
    scheduleNotificationAsync: async request => calls.push(['schedule', request]),
    cancelScheduledNotificationAsync: async id => calls.push(['cancel', id]),
    setNotificationChannelAsync: async (...args) => calls.push(['channel', ...args]),
  };
  const src = fs.readFileSync(path.join(__dirname,'reminders.ts'),'utf8');
  const code = ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
  const module = { exports: {} };
  vm.runInThisContext('(function(require,exports){'+code+'})')(
    name => name === 'react-native' ? { Platform: { OS: os } } : Notifications, module.exports,
  );
  return { calls, ...module.exports };
}
test('local reminders request access only when enabled and schedule a single silent daily identifier', async () => {
  const ios = reminders('ios');
  assert.deepEqual(ios.calls, []);
  assert.equal(await ios.enableReminder({hour:17,minute:45}),true);
  assert.deepEqual(ios.calls.map(args => args[0]), ['read','permission','schedule']);
  const request = ios.calls[2][1];
  assert.deepEqual(request.trigger,{type:'daily',hour:17,minute:45});
  assert.equal(request.content.sound,false);
  await ios.disableReminder();
  assert.deepEqual(ios.calls.at(-1),['cancel',request.identifier]);
});
test('denied or unavailable notification access creates no reminder', async () => {
  const android = reminders('android',false,true,false);
  assert.equal(await android.enableReminder({ hour: 9, minute: 0 }),false);
  assert.deepEqual(android.calls.map(args => args[0]), ['channel','read','permission']);
  const restricted = reminders('android',false,false);
  assert.equal(await restricted.enableReminder({ hour: 9, minute: 0 }),false);
  assert.deepEqual(restricted.calls.map(args => args[0]), ['channel','read']);
  const existing = reminders('android',true);
  assert.equal(await existing.enableReminder({hour:14,minute:0}),true);
  assert.deepEqual(existing.calls.map(args=>args[0]),['channel','read','schedule']);
  const web = reminders('web');
  assert.equal(await web.enableReminder({ hour: 9, minute: 0 }),false);
  assert.deepEqual(web.calls,[]);
});
