/** Fixed artboard and four aligned study seats for the approved Study Together room. */
export const STUDY_TOGETHER_SCENE = {
  artboard: { width: 1024, height: 1536 },
  scaleMode: 'uniform-contain',
  sofa: { x: 52, y: 680, width: 920, height: 438 },
  seats: {
    typing: { x: 62, y: 685, width: 220, height: 277, fps: 12, startDelay: 0, startFrame: 0 },
    reading: { x: 290, y: 685, width: 220, height: 277, fps: 10, startDelay: 180, startFrame: 4 },
    writing: { x: 518, y: 685, width: 220, height: 277, fps: 12, startDelay: 360, startFrame: 10 },
    headphones: { x: 746, y: 685, width: 220, height: 277, fps: 9, startDelay: 540, startFrame: 12 },
  },
} as const;
