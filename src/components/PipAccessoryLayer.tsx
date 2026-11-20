import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';

/** Fixed-canvas accessory cel; it is rendered beside the same indexed Synfig drawing. */
export function PipAccessoryLayer({ kind, style = 'study' }: { kind: 'glasses' | 'headphones'; style?: 'study' | 'my-igloo' }) {
  const myIgloo = style === 'my-igloo';
  const viewBox = myIgloo ? '0 0 480 560' : '0 0 430 541';
  if (kind === 'glasses') {
    if (myIgloo) return <View pointerEvents="none" style={StyleSheet.absoluteFill}><Image source={require('../../assets/animations/pip-customization/my-igloo/glasses/aligned.png')} resizeMode="stretch" style={StyleSheet.absoluteFill} /></View>;
    return <Svg pointerEvents="none" viewBox={viewBox} style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id="frame" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#825535" /><Stop offset="0.45" stopColor="#4D3025" /><Stop offset="1" stopColor="#2B201C" /></LinearGradient>
      </Defs>
      {myIgloo ? <>
        <Path d="M164 250 Q163 218 194 216 Q226 214 229 248 Q230 278 199 281 Q168 281 164 250Z" fill="rgba(255,255,255,0.04)" stroke="url(#frame)" strokeWidth="7" />
        <Path d="M236 248 Q235 218 267 216 Q296 216 300 247 Q300 276 270 279 Q239 279 236 248Z" fill="rgba(255,255,255,0.04)" stroke="url(#frame)" strokeWidth="7" />
        <Path d="M229 242 Q233 236 237 242 M164 239 Q151 236 145 230 M300 239 Q313 237 320 232" fill="none" stroke="#38251F" strokeWidth="6" strokeLinecap="round" />
        <Path d="M173 226 Q185 219 197 221 M245 226 Q257 219 270 220" fill="none" stroke="#E2B783" strokeWidth="2" strokeLinecap="round" opacity="0.72" />
      </> : <>
        <Ellipse cx="226" cy="264" rx="29" ry="25" fill="rgba(255,255,255,0.035)" stroke="url(#frame)" strokeWidth="7" />
        <Ellipse cx="292" cy="264" rx="21" ry="24" fill="rgba(255,255,255,0.035)" stroke="url(#frame)" strokeWidth="7" />
        <Path d="M255 260 Q261 255 271 260 M197 256 Q185 250 177 250 M313 258 Q322 253 329 249" fill="none" stroke="#38251F" strokeWidth="6" strokeLinecap="round" />
        <Path d="M205 246 Q218 238 230 240 M278 246 Q288 239 299 241" fill="none" stroke="#E2B783" strokeWidth="2" strokeLinecap="round" opacity="0.72" />
      </>}
    </Svg>;
  }

  return <Svg pointerEvents="none" viewBox={viewBox} style={StyleSheet.absoluteFill}>
    <Defs>
      <LinearGradient id="band" x1="0" y1="0" x2="1" y2="0"><Stop offset="0" stopColor="#D8C6D8" /><Stop offset="0.5" stopColor="#F7EEE8" /><Stop offset="1" stopColor="#D8C6D8" /></LinearGradient>
      <LinearGradient id="cup" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#FFF6EF" /><Stop offset="0.55" stopColor="#EBDDE8" /><Stop offset="1" stopColor="#BCAFC7" /></LinearGradient>
    </Defs>
    {myIgloo ? <>
      <Path d="M135 230 C128 45 352 45 345 230" fill="none" stroke="#9587A5" strokeWidth="23" strokeLinecap="round" />
      <Path d="M135 225 C130 50 350 50 345 225" fill="none" stroke="url(#band)" strokeWidth="15" strokeLinecap="round" />
      <Ellipse cx="135" cy="234" rx="31" ry="48" fill="#9587A5" /><Ellipse cx="135" cy="234" rx="22" ry="38" fill="url(#cup)" />
      <Ellipse cx="345" cy="234" rx="31" ry="48" fill="#9587A5" /><Ellipse cx="345" cy="234" rx="22" ry="38" fill="url(#cup)" />
    </> : <>
      <Path d="M112 235 C109 55 320 55 318 235" fill="none" stroke="#9587A5" strokeWidth="22" strokeLinecap="round" />
      <Path d="M112 231 C111 61 318 61 318 231" fill="none" stroke="url(#band)" strokeWidth="14" strokeLinecap="round" />
      <Ellipse cx="112" cy="239" rx="30" ry="46" fill="#9587A5" /><Ellipse cx="112" cy="239" rx="21" ry="36" fill="url(#cup)" />
      <Ellipse cx="318" cy="239" rx="30" ry="46" fill="#9587A5" /><Ellipse cx="318" cy="239" rx="21" ry="36" fill="url(#cup)" />
    </>}
    <Ellipse cx={myIgloo ? 126 : 103} cy={myIgloo ? 217 : 216} rx="7" ry="12" fill="#FFFFFF" opacity="0.56" />
  </Svg>;
}

