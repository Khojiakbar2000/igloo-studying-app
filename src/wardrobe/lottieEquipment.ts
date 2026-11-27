import type { AnimationObject } from 'lottie-react-native';
import type { WardrobeLayout } from '../home/state';
import { bodyFittings, limbFitting, scarfFitting, type Fit } from './fitting';
import { knightAnchors, standingAnchors, studyAnchors } from './poseAnchors';
import { WARDROBE_EQUIPMENT_DATA } from './model';

// Image layers use the character player's own frame range and parent chain.
type Layer = AnimationObject['layers'][number] & { ind?: number; parent?: number; refId?: string; nm?: string };
const value = <T,>(k: T) => ({ a: 0, k });

function attach(source: AnimationObject) {
  const assets = [...(source.assets ?? [])];
  const fittedIds = new Set<string>();
  let nextIndex = Math.max(0, ...source.layers.map((layer: Layer) => layer.ind ?? 0)) + 1;
  function layer(fit: Fit, range: { ip: number; op: number }, parent?: number): Layer {
    const refId = 'wardrobe-' + fit.id;
    if (!fittedIds.has(refId)) {
      assets.push({ id: refId, ...fit.art, u: '', e: 1 });
      fittedIds.add(refId);
    }
    const { w, h } = fit.art;
    return {
      ty: 2, ddd: 0, ind: nextIndex++, nm: refId, cl: 'pip-equipment', refId, parent,
      ip: range.ip, op: range.op, st: 0, sr: 1, bm: 0,
      ks: {
        a: value([w / 2, h / 2, 0]),
        p: value([fit.x, fit.y, 0]),
        s: value([100 * fit.width / w, 100 * fit.height / h, 100]),
        r: value(fit.rotation),
        o: value(100),
      },
    } as Layer;
  }
  return { assets, layer };
}

export function fitStanding(source: AnimationObject, outfit: WardrobeLayout, paintedKnight: boolean) {
  const body = source.layers.find((layer: Layer) => layer.nm === 'body') as Layer | undefined;
  if (!body) return source;
  const { assets, layer } = attach(source);
  const fits = bodyFittings(outfit, 'standing', paintedKnight ? knightAnchors : standingAnchors, paintedKnight);
  const bodyLayer = (fit: Fit) => layer(fit, source, body.ind);
  const onHead = fits.filter((fit) => fit.id === 'round-glasses' || fit.id === outfit.head || fit.id.startsWith('cozy-headphones'));
  const layers = [
    ...onHead.filter((fit) => !fit.behind).reverse().map(bodyLayer),
    ...source.layers.flatMap((original: Layer) => {
      if (original === body) {
        return [
          ...fits.filter((fit) => !fit.behind && !onHead.includes(fit)).reverse().map(bodyLayer),
          original,
          ...fits.filter((fit) => fit.behind).reverse().map(bodyLayer),
        ];
      }
      const limb = Object.values(outfit).find((id) => id && WARDROBE_EQUIPMENT_DATA[id]?.attachment.frame === original.nm);
      const fit = limb && limbFitting(limb);
      if (!fit) return [original];
      const { a } = original.ks as { a: { k: number[] } };
      return [layer({ ...fit, x: fit.x + a.k[0], y: fit.y + a.k[1] }, source, original.ind), original];
    }),
  ];
  // Reserve crown and pom-pom clearance at the top of the existing jump.
  // The same camera framing is used for every standing action and outfit.
  const stageId = Math.max(...layers.map((item: Layer) => item.ind ?? 0)) + 1;
  const stage = {
    ty: 3, ddd: 0, nm: 'Standing outfit framing', ind: stageId,
    ip: source.ip, op: source.op, st: 0, sr: 1,
    ks: { a: value([0, 0, 0]), p: value([0, 44, 0]), s: value([100, 100, 100]), r: value(0), o: value(100) },
  } as Layer;
  return {
    ...source, h: source.h + 52, assets,
    layers: [...layers.map((item: Layer) => item.parent === undefined ? { ...item, parent: stageId } : item), stage],
  };
}

export function fitStudy(source: AnimationObject, outfit: WardrobeLayout): AnimationObject {
  const { assets, layer } = attach(source);
  const layers = source.layers.flatMap((cel: Layer) => {
    const id = cel.refId;
    const anchors = id && studyAnchors(id);
    if (!id || !anchors) return [cel];
    const fits = bodyFittings(outfit, 'laptop', anchors, false, id);
    const scarf = scarfFitting(id, outfit.neck);
    // Each dyed scarf has a different painted silhouette and uses its own asset.
    if (scarf) fits.unshift({ ...scarf, id: scarf.id + '-' + id });
    return [
      ...fits.filter((fit) => !fit.behind).reverse().map((fit) => layer(fit, cel)),
      cel,
      ...fits.filter((fit) => fit.behind).reverse().map((fit) => layer(fit, cel)),
    ];
  });
  return { ...source, layers, assets };
}
