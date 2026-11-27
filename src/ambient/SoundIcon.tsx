import { colors } from '../theme';
import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import type { Sound } from './sounds';

const cloud = 'M7 19h15a4 4 0 0 0 0-8h-1a6 6 0 0 0-11-1 4.6 4.6 0 0 0-3 9Z';

export function SoundIcon({ icon }: { icon: Sound['icon'] }) {
  const art = {
    rain: <><Path d={cloud} fill="#a4b8dc" stroke="#526997" /><Path d="m10 22-1 4m7-4-1 5m7-5-1 4" stroke="#526997" /></>,
    storm: <><Path d={cloud} fill={colors.iceBlue} stroke={colors.link} /><Path d="m16 19-4 5h4l-2 5 7-7h-4l2-3" fill="#f1b85e" stroke="#9a5b2d" /><Path d="m7 22-1 4m18-4-1 4" stroke="#526997" /></>,
    ocean: <><Circle cx="23" cy="10" r="4" fill="#e9bd75" /><Path d="M4 20c4 0 6-9 12-9 4 0 5 3 5 6-2-2-6-1-6 2 1 4 8 4 13 0v6H4Z" fill="#a2c7d8" stroke="#4c718d" /><Path d="M5 25c5-2 7-2 11 0s8 1 11-1" stroke="#597694" /></>,
    forest: <><Path d="m10 6-6 13h4l-4 5h12l-4-5h4Z" fill={colors.iceBlue} stroke={colors.link} /><Path d="m22 9-6 13h4l-3 5h10l-3-5h4Z" fill="#d4c19b" stroke="#877358" /><Path d="M10 24v4" stroke="#816344" /></>,
    fire: <><Path d="M17 4c-1 5-6 7-6 12-1-2-3-3-3-3-4 7-1 14 8 14 10 0 12-9 5-15 0 3-2 3-2 3 2-5-1-9-2-11Z" fill="#e89563" stroke="#a15337" /><Path d="M16 17c-5 4-4 8 0 9 5 0 5-4 0-9Z" fill="#ffe0a0" /></>,
    snow: <><Path d="M4 13h16c5 0 5-7 1-7-2 0-3 1-3 2M5 18h20c4 0 4 6 0 6-2 0-3-1-3-2M3 23h9" stroke="#6685a9" /><Circle cx="8" cy="8" r="1.5" fill="#9ab3cf" /><Circle cx="15" cy="26" r="1.5" fill="#9ab3cf" /></>,
    night: <><Path d="M19 6a10.5 10.5 0 1 0 7 15A9.5 9.5 0 0 1 19 6Z" fill="#f1cc86" stroke="#9c7344" /><Path d="M24 6v6m-3-3h6m-4 5h3" stroke="#806329" /></>,
    white: <NoiseBars color="#9b9b9f" levels={[7, 12, 18, 11, 7]} />,
    brown: <NoiseBars color="#a67558" levels={[13, 18, 15, 10, 6]} />,
    pink: <NoiseBars color="#bf7d8c" levels={[8, 13, 18, 15, 9]} />,
  };
  return <Svg width={28} height={28} viewBox="0 0 32 32" strokeWidth={1.55} strokeLinecap="round" strokeLinejoin="round">{art[icon]}</Svg>;
}

function NoiseBars({ color, levels }: { color: string; levels: number[] }) {
  return <>
    <Rect x="3" y="5" width="26" height="22" rx="6" fill="#f7e7d2" stroke={color} />
    {levels.map((height, index) => <Path key={index} d={`M${8 + index * 4} ${16 - height / 2}v${height}`} stroke={color} />)}
  </>;
}
