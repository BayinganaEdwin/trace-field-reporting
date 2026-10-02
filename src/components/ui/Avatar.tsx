import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { colors } from '../../theme/colors';
import { Typography } from './Typography';

interface AvatarProps {
  name: string;
  size?: number;
  style?: ViewStyle;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Curated palette — richer than generic pastels, cohesive with the design system
const PALETTE = [
  { bg: '#E6EDF8', text: '#1B3F7A' },  // navy (matches accent)
  { bg: '#E5F3EA', text: '#14673A' },  // forest green
  { bg: '#F3EDE0', text: '#7A4B00' },  // warm amber
  { bg: '#EDE8F5', text: '#5B21A8' },  // rich purple
  { bg: '#F5E8E8', text: '#C11D1D' },  // warm coral
];

function colorForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function Avatar({ name, size = 36, style }: AvatarProps) {
  const { bg, text } = colorForName(name);
  const fontSize = Math.round(size * 0.34);
  const ringSize = size + 4;  // 2px ring on each side

  return (
    <View
      style={[
        styles.ring,
        {
          width: ringSize,
          height: ringSize,
          borderRadius: ringSize / 2,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.base,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
        ]}
      >
        <Typography
          variant="footnoteSemiBold"
          color={text}
          style={{ fontSize, lineHeight: size }}
        >
          {getInitials(name)}
        </Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Subtle white ring — adds depth, separates from any background
  ring: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#1A1833',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
