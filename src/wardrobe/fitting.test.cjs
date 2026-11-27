const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  module._compile(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
};

const { bodyFittings } = require('./fitting.ts');
const { fitStanding, fitStudy } = require('./lottieEquipment.ts');
const { chairAnchors, studyAnchors } = require('./poseAnchors.ts');
const { WARDROBE_CATALOG_DATA } = require('./model.ts');
const standing = require('../../assets/wardrobe/lottie/wave.json');
const study = require('../../assets/animations/study-together-lottie/lottie/typing.json');
const { createHome, importLegacyAccessories, outfitWithProduct, removeWardrobeEquipment, restoreHome } = require('../home/state.ts');

const frameFits = (animation) => animation.layers.filter((layer) => layer.cl === 'pip-equipment');

test('headwear fits the full head in standing, chair and study perspectives', () => {
  for (const [pose, points] of [
    ['standing', [0, 0, 304, 112, 194, 232, 185]],
    ...chairAnchors.map(points => ['chair', points]),
    ['laptop', studyAnchors('asset_000')],
  ]) {
    const hat = bodyFittings({ head: 'gift-hat' }, pose, points)[0];
    assert.ok(hat.width >= points[2], 'hat brim spans the head');
    assert.ok(hat.y - hat.height / 2 < points[1], 'hat has crown clearance');
    const band = bodyFittings({ head: 'cozy-headphones' }, pose, points)
      .find(fit => fit.id === 'cozy-headphones-band');
    assert.equal(band.behind, false, 'band stays visible across the crown');
    assert.ok(band.width >= points[2]);
  }
});

test('standing accessories inherit the painted body and limb animation transforms', () => {
  const fitted = fitStanding(standing, { face: 'round-glasses', leftFlipper: 'knight-flipper-left' }, false);
  const body = standing.layers.find((layer) => layer.nm === 'body');
  const limb = standing.layers.find((layer) => layer.nm === 'leftArm');
  const [glasses, guard] = frameFits(fitted);
  assert.equal(glasses.parent, body.ind);
  assert.equal(guard.parent, limb.ind);
  assert.ok(glasses.ks.p.k[0] > 150 && glasses.ks.p.k[1] > 175);
  const original = fitted.layers.filter((layer) => layer.cl !== 'pip-equipment').slice(0, -1);
  assert.deepEqual(original.map(({ parent, ...layer }) => layer), standing.layers.map(({ parent, ...layer }) => layer));
  assert.ok(fitted.h > standing.h, 'headwear has clearance on the highest jump');
  assert.notEqual(standing.layers.length, fitted.layers.length);
});

test('each painted study cel has fitting coordinates and synchronized equipment through every clip', () => {
  const outfit = { face: 'round-glasses', neck: 'scarf-lavender', head: 'cozy-headphones', back: 'gift-backpack' };
  const fitted = fitStudy(study, outfit);
  const baseCels = study.layers.filter((layer) => layer.refId);
  assert.ok(baseCels.length > 60);
  for (const cel of baseCels) {
    assert.ok(studyAnchors(cel.refId), cel.refId);
    const tracks = frameFits(fitted).filter((layer) => layer.ip === cel.ip && layer.op === cel.op);
    assert.equal(tracks.length, 6, cel.refId);
    for (const layer of tracks) assert.ok(fitted.assets.some((asset) => asset.id === layer.refId));
  }
  assert.deepEqual(fitted.layers.filter((layer) => layer.cl !== 'pip-equipment'), study.layers);
});

test('available products draw with finite chair and standing fits without altering the catalog', () => {
  const home = createHome();
  for (const product of WARDROBE_CATALOG_DATA.filter((item) => item.available !== false)) {
    const outfit = outfitWithProduct(home.wardrobe.equipped, product);
    assert.ok(frameFits(fitStanding(standing, outfit, false)).length, product.id);
    for (const [index, anchors] of chairAnchors.entries()) {
      for (const fit of bodyFittings(outfit, 'chair', anchors, false, String(index))) {
        assert.ok([fit.x, fit.y, fit.width, fit.height, fit.rotation].every(Number.isFinite), product.id);
      }
    }
  }
});

test('legacy toggles retain ownership without spending and cannot override later removal', () => {
  const home = createHome();
  const old = { scarf: 'lilac', glasses: true, headphones: true };
  const migrated = importLegacyAccessories(home, old);
  assert.deepEqual(migrated.wardrobe.equipped, { neck: 'scarf-lavender', face: 'round-glasses', head: 'cozy-headphones' });
  assert.equal(migrated.snowflakes, home.snowflakes);
  let changed = removeWardrobeEquipment(migrated, 'head');
  changed = removeWardrobeEquipment(changed, 'face');
  changed = restoreHome(changed, []);
  assert.equal(importLegacyAccessories(changed, old), changed);
  assert.deepEqual(changed.wardrobe.equipped, { neck: 'scarf-lavender' });
  assert.ok(changed.wardrobe.owned.includes('round-glasses'));
  const crowned = { ...home, wardrobe: { ...home.wardrobe, owned: [...home.wardrobe.owned, 'royal-crown'], equipped: { head: 'royal-crown' } } };
  assert.equal(importLegacyAccessories(crowned, old).wardrobe.equipped.head, 'royal-crown');
});
