import React from 'react';
import Svg, { Circle, Ellipse, Line, Path, Rect } from 'react-native-svg';
import { colors } from '../theme';

export function Egg({ size = 156, cracks = 0 }: { size?: number; cracks?: number }) {
  return (
    <Svg width={size} height={size * 1.15} viewBox="0 0 160 184">
      <Ellipse cx="82" cy="166" rx="57" ry="12" fill="#7D8C8E" opacity=".2" />
      <Path d="M80 15 C49 15 26 72 25 111 C23 146 46 166 80 166 C114 166 137 146 135 111 C134 72 111 15 80 15Z" fill="#F2C18F" stroke="#25242A" strokeWidth="3.5" />
      <Path d="M50 60 C58 46 67 39 78 38" fill="none" stroke="#DDAE7D" strokeWidth="7" strokeLinecap="round" opacity=".7" />
      {cracks > 0 && <Path d="M72 28 C79 22 91 26 93 36 C94 43 86 49 79 45Z" fill="#E99543" />}
      {cracks > 1 && <>
        <Path d="M37 72 C47 65 62 69 67 79 C70 88 58 95 47 91 C37 89 32 80 37 72Z" fill="#E99543" />
        <Path d="M99 109 C107 104 117 109 117 117 C117 125 108 129 101 125 C95 121 94 114 99 109Z" fill="#E99543" />
      </>}
      {cracks > 0 && <Path d="M80 16 L73 31 L84 38 L76 50 L86 59" fill="none" stroke="#19191E" strokeWidth="3.6" strokeLinejoin="miter" />}
      {cracks > 1 && <Path d="M76 50 L63 56 L66 66 L53 72 M84 38 L96 44 L92 54 L105 61" fill="none" stroke="#19191E" strokeWidth="3.2" strokeLinejoin="miter" />}
      <Circle cx="114" cy="72" r="3" fill="#FFFFFF" opacity=".8" />
    </Svg>
  );
}

export function Igloo({ stage = 0, width = 170 }: { stage?: number; width?: number }) {
  return (
    <Svg width={width} height={width * 0.68} viewBox="0 0 220 150">
      <Ellipse cx="110" cy="137" rx="104" ry="10" fill="#7DA8BF" opacity=".24" />
      {stage === 1 && Array.from({ length: 5 }).map((_, i) => <Rect key={i} x={30 + i * 33} y={118 - (i % 2) * 17} width="29" height="17" rx="5" fill="#F6FCFF" stroke="#AACBDD" strokeWidth="2" />)}
      {stage === 2 && <><Path d="M31 127h158" stroke="#A8C8D9" strokeWidth="3" /><Path d="M37 121h37v-15h37v15h37v-15h34v22H37Z" fill="#EFF9FD" stroke="#A8C8D9" strokeWidth="2.5" /><Path d="M76 119v-12m37 12v-12m37 12v-12" stroke="#A8C8D9" strokeWidth="2" /></>}
      {stage === 3 && <><Path d="M34 129V93q0-61 76-67 76 6 76 67v36Z" fill="#EFF9FD" stroke="#A8C8D9" strokeWidth="3" /><Path d="M36 111h144M35 92h151M46 73h128M63 54h94" stroke="#A8C8D9" strokeWidth="2" /><Path d="M74 129v-18m38 18v-18m39 18v-18m-96-1V92m46 19V92m47 19V92M85 92V73m48 19V73m-29-19V54" stroke="#A8C8D9" strokeWidth="2" /></>}
      {stage === 4 && <><Path d="M34 129V96a76 76 0 0 1 152 0v33Z" fill="#EFF9FD" stroke="#A8C8D9" strokeWidth="3" /><Path d="M35 111h150M35 94h150M45 76h130M61 58h98M82 42h56" stroke="#A8C8D9" strokeWidth="2" /><Path d="M51 111V94m43 17V94m39 17V94m31 17V94M67 94V76m47 18V76m40 18V76M83 76V58m50 18V58m-25 0V42" stroke="#A8C8D9" strokeWidth="2" /><Path d="M104 129V99q0-20 19-20t19 20v30" fill="#D5EBF5" stroke="#8BAFC2" strokeWidth="2.5" /></>}
      {stage >= 5 && <><Path d="M26 129 A84 84 0 0 1 194 129Z" fill="#EAF8FF" stroke="#A8C8D9" strokeWidth="3" /><Path d="M37 110h147M48 91h124M65 72h90M85 53h49" stroke="#A8C8D9" strokeWidth="2" /><Path d="M82 129v-20m45 20v-20M60 110V91m53 19V91m47 19V91" stroke="#A8C8D9" strokeWidth="2" /><Path d="M99 129V91q0-24 24-24t24 24v38" fill="#FFD58A" opacity=".35" /><Path d="M105 129v-38q0-18 18-18t18 18v38Z" fill="#8C6952" stroke="#725340" strokeWidth="2.5" /><Path d="M123 75v54m-12-37h23m-23 12h23m-23 12h23" stroke="#B78A65" strokeWidth="1.6" opacity=".8" /><Circle cx="133" cy="104" r="2.5" fill={colors.gold} /><Rect x="157" y="86" width="15" height="15" rx="4" fill="#FFE0A5" stroke="#A8C8D9" strokeWidth="2" /><Path d="M164.5 87v13M158 93.5h13" stroke="#F1B95C" strokeWidth="1" /></>}
    </Svg>
  );
}

export function TimerRing({ progress, size = 70 }: { progress: number; size?: number }) {
  const circumference = 2 * Math.PI * 29;
  const dash = Math.max(0, Math.min(1, progress)) * circumference;
  return (
    <Svg width={size} height={size} viewBox="0 0 70 70">
      <Circle cx="35" cy="35" r="29" fill="none" stroke="#DDECF3" strokeWidth="5" />
      <Circle cx="35" cy="35" r="29" fill="none" stroke={colors.teal} strokeWidth="5" strokeLinecap="round" strokeDasharray={`${dash} ${circumference}`} transform="rotate(-90 35 35)" />
    </Svg>
  );
}

export function SnowDots() {
  return <Svg style={{ position: 'absolute', inset: 0 }} viewBox="0 0 400 300" preserveAspectRatio="none">
    <Circle cx="45" cy="55" r="2.5" fill="#FFF" opacity=".8" />
    <Circle cx="300" cy="38" r="3" fill="#FFF" opacity=".8" />
    <Circle cx="352" cy="112" r="2" fill="#FFF" opacity=".8" />
    <Circle cx="118" cy="21" r="2" fill="#FFF" opacity=".75" />
    <Circle cx="215" cy="99" r="2.4" fill="#FFF" opacity=".75" />
    <Line x1="338" y1="164" x2="338" y2="170" stroke="#FFF" strokeWidth="2" strokeLinecap="round" opacity=".7" />
    <Line x1="80" y1="133" x2="80" y2="139" stroke="#FFF" strokeWidth="2" strokeLinecap="round" opacity=".7" />
  </Svg>;
}
