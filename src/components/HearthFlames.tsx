import React from 'react';
import { Ellipse, G, Path } from 'react-native-svg';

export function HearthFlames({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return <G transform={`translate(${x}, ${y}) scale(${scale})`}>
    <Ellipse cy="-14" rx="50" ry="32" fill="#FFAF4C" opacity=".18" />
    <Path d="M-24 0q-10-17 2-31 1 10 8 13 2-20 14-31 3 19 12 27 7 6 11-9 13 18 4 31z" fill="#FFAA50" />
    <Path d="M-12 0q-5-11 4-20 1 7 6 8 2-10 9-15 0 12 8 18 3 4 1 9z" fill="#FFE5A0" />
  </G>;
}
