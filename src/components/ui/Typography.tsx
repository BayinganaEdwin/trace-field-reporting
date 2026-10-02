import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import { textVariants, fontFamilies } from '../../theme/typography';
import { colors } from '../../theme/colors';
import type { TextVariant } from '../../theme/typography';

interface TypographyProps {
  variant?: TextVariant;
  color?: string;
  align?: TextStyle['textAlign'];
  numberOfLines?: number;
  style?: TextStyle | TextStyle[];
  children: React.ReactNode;
}

export function Typography({
  variant = 'body',
  color,
  align,
  numberOfLines,
  style,
  children,
}: TypographyProps) {
  const variantStyle = textVariants[variant];
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        variantStyle,
        color ? { color } : null,
        align ? { textAlign: align } : null,
        style,
      ]}
    >
      {children}
    </Text>
  );
}
