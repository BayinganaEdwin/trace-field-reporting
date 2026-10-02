import React from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';
import { Typography } from './Typography';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize    = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}: ButtonProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const labelColor =
    variant === 'primary'
      ? colors.textInverse
      : variant === 'danger'
      ? colors.dangerText
      : colors.accent;

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.78}
      style={[
        styles.base,
        styles[variant],
        styles[size],
        variant === 'primary' && styles.primaryShadow,
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.textInverse : colors.accent}
        />
      ) : (
        <Typography
          variant={size === 'sm' ? 'footnoteSemiBold' : 'subheadMedium'}
          color={labelColor}
        >
          {label}
        </Typography>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.xl,  // 20px — premium, confident
  },
  fullWidth: { alignSelf: 'stretch' },

  // Variants
  primary: {
    backgroundColor: colors.accent,
  },
  // Subtle lift on primary — depth without heavy shadow
  primaryShadow: Platform.select({
    ios: {
      shadowColor: colors.accentDark,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.22,
      shadowRadius: 8,
    },
    android: {
      elevation: 4,
    },
  }) ?? {},

  secondary: {
    // No border — the tinted fill IS the button
    backgroundColor: colors.accentLight,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.dangerBg,
  },

  // Sizes — taller than before: confidence through proportion
  sm: { height: 36, paddingHorizontal: spacing[3] },
  md: { height: 50, paddingHorizontal: spacing[5] },
  lg: { height: 58, paddingHorizontal: spacing[6] },

  disabled: { opacity: 0.4 },
});
