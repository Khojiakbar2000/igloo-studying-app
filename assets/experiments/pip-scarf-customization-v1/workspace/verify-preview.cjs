const fs = require('node:fs');
const WebSocket = require('ws');

const endpoint = 'ws://127.0.0.1:9231/devtools/browser/ad74d673-f202-456b-a454-cbb7805ea4d7';
const socket = new WebSocket(endpoint);
let seq = 0;
const waiting = new Map();
socket.on('message', raw => {
  const m = JSON.parse(raw);
  if (m.id && waiting.has(m.id)) {
    const { resolve, reject } = waiting.get(m.id); waiting.delete(m.id);
    if (m.error) reject(new Error(m.error.message)); else resolve(m.result);
  }
});
function call(method, params = {}, sessionId) {
  const id = ++seq;
  socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  return new Promise((resolve, reject) => waiting.set(id, { resolve, reject }));
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function evaluate(expression, sessionId) {
  const r = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId);
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
  return r.result.value;
}

(async () => {
  await new Promise((resolve,reject)=>{socket.once('open',resolve);socket.once('error',reject)});
  const { targetId } = await call('Target.createTarget', { url:'about:blank' });
  const { sessionId } = await call('Target.attachToTarget', { targetId, flatten:true });
  await call('Page.enable', {}, sessionId);
  await call('Runtime.enable', {}, sessionId);
  await call('Emulation.setDeviceMetricsOverride', { width:1280, height:1120, deviceScaleFactor:1, mobile:false }, sessionId);
  await call('Page.navigate', { url:'http://127.0.0.1:8767/assets/experiments/pip-scarf-customization-v1/' }, sessionId);
  await sleep(1800);
  const initial = await evaluate('({ready:!!window.__pipCustomizationState, state:window.__pipCustomizationState?.(), status:document.getElementById("status")?.textContent, debug:window.__pipCustomizationDebug?.(), errors:window.__errors||[]})', sessionId);
  if (!initial.ready || !initial.state?.hasScarfLayer) throw new Error(`Preview failed to load scarf layer: ${JSON.stringify(initial)}`);
  const actions = ['pip-cold','blink','wave','hopeful-wave','scarf-tuck','curious-look','celebrate'];
  const variants = [];
  const screenshots = [];
  for (const action of actions) {
    await evaluate(`document.getElementById("action").value="${action}";document.getElementById("action").dispatchEvent(new Event("change",{bubbles:true}))`, sessionId);
    await sleep(750);
    let state = await evaluate('window.__pipCustomizationState()', sessionId);
    if (state.action !== action || !state.hasScarfLayer) throw new Error(`Animation ${action} did not load: ${JSON.stringify(state)}`);
    for (const color of ['teal','red','lavender']) {
      const before = state;
      await evaluate(`document.querySelector('[data-scarf="${color}"]').click()`, sessionId);
      await sleep(430);
      state = await evaluate('window.__pipCustomizationState()', sessionId);
      const debug = await evaluate('window.__pipCustomizationDebug()', sessionId);
      const test = { action, color, frameContinued:Math.abs(state.frame-before.frame)>0.5, samePlayer:state.playerId===before.playerId, imageRefsUpdated:debug.matchesApplied && debug.scarfIndices.length===2 };
      variants.push(test);
      if (!test.frameContinued || !test.samePlayer || !test.imageRefsUpdated) throw new Error(`Scarf swap failed: ${JSON.stringify(test)}`);
      if (action === 'wave') {
        const png = await call('Page.captureScreenshot', { format:'png', captureBeyondViewport:false }, sessionId);
        const file = `assets/experiments/pip-scarf-customization-v1/previews/wave-${color}.png`;
        fs.writeFileSync(file, Buffer.from(png.data,'base64')); screenshots.push(file.replace('assets/experiments/pip-scarf-customization-v1/',''));
      }
    }
  }
  const wave = await evaluate('({state:window.__pipCustomizationState(),status:document.getElementById("status").textContent})', sessionId);
  const result = { initial, actionsTested:actions, variants, allPassed:variants.length===21&&variants.every(v=>v.frameContinued&&v.samePlayer&&v.imageRefsUpdated), wave, screenshots };
  fs.writeFileSync('assets/experiments/pip-scarf-customization-v1/workspace/browser-test.json', JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result,null,2));
  await call('Target.closeTarget', { targetId });
  socket.close();
})().catch(error=>{console.error(error);socket.close();process.exitCode=1});
