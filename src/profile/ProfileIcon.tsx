import React from 'react';
import Svg, { Path } from 'react-native-svg';

const paths = {
  settings: 'M4 7h16M4 17h16M8 4v6m8 4v6',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-14v5l3 2',
  sessions: 'M5 4h11a3 3 0 0 1 3 3v13H7a2 2 0 0 1-2-2V4Zm0 13c0-1 1-2 2-2h12M9 8h6m-6 3h4',
  snow: 'M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 4l3 3 3-3M9 20l3-3 3 3M4 10l4-.7-1-4M17 19l-1-4.3 4-.7M4 14l4 .7-1 4.3M17 5l-1 4.3 4 .7',
  star: 'm12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.4l6.1-.9L12 3Z',
  next: 'm9 6 6 6-6 6',
  back: 'm15 6-6 6 6 6',
  close: 'm6 6 12 12M18 6 6 18',
  heart: 'M20.8 9.4c0 3.2-4.2 6.8-8.8 10-4.6-3.2-8.8-6.8-8.8-10a4.6 4.6 0 0 1 8.8-1.8 4.6 4.6 0 0 1 8.8 1.8Z',
  lock: 'M8 10V7a4 4 0 1 1 8 0v3m-10 0h12v10H6z',
  check: 'm5 12 4 4L19 6',
} as const;

export function ProfileIcon({ name, size = 18, color = '#534872' }: { name: keyof typeof paths; size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
    <Path d={paths[name]} />
  </Svg>;
}
