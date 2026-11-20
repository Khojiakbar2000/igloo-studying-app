// Small vector-only Lottie compositions shared across the native and web players.
type Effect = 'water' | 'sparkle' | 'butterfly' | 'snow';
export function gardenMotion(effect: Effect, color: string) {
  const water = effect === 'water';
  const rgb = color.match(/\w\w/g)!.map(channel => parseInt(channel, 16) / 255);
  const layers = Array.from({ length: water ? 7 : 5 }, (_, i) => {
    const x = 27 + (i * 13) % 53;
    const y = 32 + (i * 17) % 48;
    const start = 4 + i * 3;
    const end = start + 24;
    return {
      ty: 4, ind: i + 1, nm: effect, sr: 1, ip: 0, op: 60, st: 0,
      ks: {
        a: { a: 0, k: [0, 0, 0] }, r: { a: 0, k: 0 }, s: { a: 0, k: [100, 100, 100] },
        p: { a: 1, k: [
          { t: start, s: water ? [61 - i * .8, 25, 0] : [x, y, 0] },
          { t: end, s: water ? [x, 88, 0] : [x + (effect === 'butterfly' ? 25 : 6), y + (effect === 'snow' ? 18 : -18), 0] },
        ] },
        o: { a: 1, k: [{ t: start, s: [0] }, { t: start + 7, s: [92] }, { t: end, s: [0] }] },
      },
      shapes: [
        ...(effect === 'butterfly' ? [-2, 2].map(wing => (
          { ty: 'el', p: { a: 0, k: [wing, -1] }, s: { a: 0, k: [4, 5] } }
        )) : [{ ty: 'el', p: { a: 0, k: [0, 0] }, s: { a: 0, k: water ? [3, 6] : [i % 2 ? 3 : 5, 3] } }]),
        { ty: 'fl', c: { a: 0, k: [...rgb, 1] }, o: { a: 0, k: 100 }, r: 1 },
      ],
    };
  });
  for (const layer of layers) {
    for (const frames of [layer.ks.p.k, layer.ks.o.k]) {
      for (const frame of frames.slice(0, -1)) Object.assign(frame, { i: { x: [0.67], y: [1] }, o: { x: [0.33], y: [0] } });
    }
  }
  return { v: '5.7.4', fr: 30, ip: 0, op: 60, w: 100, h: 100, assets: [], layers };
}
