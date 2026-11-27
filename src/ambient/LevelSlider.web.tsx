import { colors } from '../theme';
import React from 'react';
import type { LevelSliderProps } from './LevelSlider';

export function LevelSlider({ label, value, onChange, accent = colors.primary }: LevelSliderProps) {
  return <input type="range" aria-label={label} min={0} max={100} step={1} value={Math.round(value * 100)}
    onChange={event => onChange(Number(event.currentTarget.value) / 100)}
    style={{ width: '100%', height: 44, margin: 0, accentColor: accent, cursor: 'pointer' }} />;
}
