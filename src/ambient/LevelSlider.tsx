import { colors } from '../theme';
import React from 'react';
import Slider from '@react-native-community/slider';

export type LevelSliderProps = {
  label: string;
  accent?: string;
  value: number;
  onChange: (value: number) => void;
};

export function LevelSlider({ label, value, onChange, accent = colors.primary }: LevelSliderProps) {
  return <Slider accessibilityLabel={label} accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
    minimumValue={0} maximumValue={1} step={0.01} value={value} onValueChange={onChange}
    minimumTrackTintColor={accent} maximumTrackTintColor={colors.ice} thumbTintColor={accent}
    style={{ width: '100%', height: 44 }} />;
}
