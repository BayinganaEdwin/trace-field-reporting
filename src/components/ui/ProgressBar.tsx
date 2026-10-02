import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';

interface ProgressBarProps {
  value: number;       // 0–100
  height?: number;
  trackColor?: string;
  fillColor?: string;
  style?: ViewStyle;
}

export function ProgressBar({
  value,
  height = 5,
  // Accent-tinted track: ties to the accent color, not neutral gray
  trackColor = colors.accentLight,
  fillColor  = colors.accent,
  style,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const radius  = height / 2;

  return (
    <View
      style={[
        styles.track,
        { height, backgroundColor: trackColor, borderRadius: radius },
        style,
      ]}
    >
      <View
        style={{
          width: `${clamped}%`,
          height,
          backgroundColor: fillColor,
          borderRadius: radius,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    overflow: 'hidden',
    width: '100%',
  },
});
