import fs from 'node:fs/promises';
import path from 'node:path';

const dir = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(dir, '../../../..');
const lottie = {};
for (const action of ['idle', 'wave', 'shiver', 'celebrate']) {
  lottie[action] = JSON.parse(await fs.readFile(path.join(dir, 'lottie', `${action}.json`), 'utf8'));
}
const imageData = async file => `data:image/png;base64,${(await fs.readFile(file)).toString('base64')}`;
const original = await imageData(path.join(root, 'assets/animations/pip/storybook/character/standing-fallback.png'));
const complete = await imageData(path.join(dir, 'complete-armored-pip.png'));
const layered = await imageData(path.join(dir, 'complete-vs-layered-720-right.png'));
const actions = JSON.stringify(lottie).replaceAll('<', '\\u003c');
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pip Knight Skin — Animation Preview</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#eaf0f7;color:#384954;font:16px/1.45 system-ui,-apple-system,sans-serif}.wrap{max-width:1120px;margin:auto;padding:28px 20px 54px}h1{margin:0 0 6px;font-size:28px}.sub{margin:0 0 22px;color:#657782}.controls{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px}.controls button{border:1px solid #c9d5d9;border-radius:999px;padding:9px 16px;background:#fffaf0;color:#485c63;font-weight:700;cursor:pointer}.controls button.active{background:#536f70;color:white;border-color:#536f70}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px}.card{border:1px solid #d7d1c4;border-radius:20px;padding:12px;background:#fffaf0;box-shadow:0 5px 16px #38506312}.card h2{font-size:15px;margin:0 0 8px}.stage{width:100%;aspect-ratio:1;border-radius:14px;background:#f5f2e8;overflow:hidden}.stage img,.stage svg{width:100%;height:100%;display:block}.stage svg{background:#f5f2e8}.note{margin-top:20px;padding:16px 18px;border-radius:16px;background:#fffaf0;color:#60727b}.note strong{color:#485c63}.status{font-size:13px;color:#6d7f85;min-height:20px}
</style></head><body><main class="wrap"><h1>Pip’s fitted knight skin</h1><p class="sub">One complete costume, separated into reusable layers. Choose an existing action to play it on the reconstructed character.</p><div class="controls" id="controls"></div><div class="grid"><article class="card"><h2>Approved Pip · reference</h2><div class="stage"><img alt="Approved Pip reference" src="${original}"></div></article><article class="card"><h2>Complete armored illustration</h2><div class="stage"><img alt="Complete armored Pip illustration" src="${complete}"></div></article><article class="card"><h2>Layered base reconstruction</h2><div class="stage"><img alt="Layered Pip composite" src="${layered}"></div></article><article class="card"><h2>Reusable Lottie · <span id="action-name">Idle</span></h2><div class="stage lottie" id="player"></div></article></div><div class="note"><strong>Layer fidelity:</strong> source art and reconstructed layers use the same 720×720 coordinates. Idle, Wave, Shiver, and Celebrate reuse the existing body/limb transforms. <div class="status" id="status">Loading Lottie…</div></div></main>
<script src="/node_modules/lottie-web/build/player/lottie.min.js"></script>
<script type="application/json" id="actions">${actions}</script>
<script>
const data=JSON.parse(document.getElementById('actions').textContent);const buttons=document.getElementById('controls');const container=document.getElementById('player');let instance;let selected='idle';
function show(action,seek){selected=action;for(const x of buttons.children)x.classList.toggle('active',x.dataset.action===action);document.getElementById('action-name').textContent=action[0].toUpperCase()+action.slice(1);if(instance)instance.destroy();instance=lottie.loadAnimation({container,renderer:'svg',loop:true,autoplay:seek===undefined,animationData:data[action],rendererSettings:{preserveAspectRatio:'xMidYMid meet',progressiveLoad:false}});if(seek!==undefined)instance.goToAndStop(seek,true)}
for(const action of Object.keys(data)){const b=document.createElement('button');b.textContent=action[0].toUpperCase()+action.slice(1);b.dataset.action=action;b.onclick=()=>show(action);buttons.appendChild(b)}
if(!window.lottie){document.getElementById('status').textContent='Could not load local lottie-web. Open this page from the project folder with node_modules installed.'}else{const params=new URLSearchParams(location.search),initial=params.get('action')||'idle',seek=Number(params.get('seek'));show(data[initial]?initial:'idle',params.has('seek')&&Number.isFinite(seek)?seek:undefined);document.getElementById('status').textContent='Rendered with lottie-web '+(window.lottie.version||'')+'. Only the selected action plays.'}
</script></body></html>`;
await fs.writeFile(path.join(dir, 'preview.html'), html);
console.log(`Wrote ${path.join(dir, 'preview.html')} (${Buffer.byteLength(html)} bytes)`);
