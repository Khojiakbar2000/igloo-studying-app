import React from 'react';
import Slider from '@react-native-community/slider';

export type LevelSliderProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
};

export function LevelSlider({ label, value, onChange }: LevelSliderProps) {
  return <Slider accessibilityLabel={label} accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
    minimumValue={0} maximumValue={1} step={0.01} value={value} onValueChange={onChange}
    minimumTrackTintColor="#a96132" maximumTrackTintColor="#dec6a8" thumbTintColor="#b66d33"
    style={{ width: '100%', height: 44 }} />;
}
