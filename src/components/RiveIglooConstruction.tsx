import React from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

const stageOne = require('../../assets/illustrations/igloo/stages/igloo-stage-1.jpg');

export function RiveIglooConstruction({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.wrap, style]} accessible accessibilityRole="image" accessibilityLabel="The penguin carries and places a snow block"><Image source={stageOne} resizeMode="stretch" style={StyleSheet.absoluteFill} /></View>;
}

const styles = StyleSheet.create({ wrap: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' } });
