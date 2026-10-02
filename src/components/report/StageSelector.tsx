import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Typography } from '../ui/Typography';
import { colors } from '../../theme/colors';
import { spacing, radii, borderWidths } from '../../theme/spacing';
import { STAGE_OPTIONS } from '../../types';
import type { ConstructionStage } from '../../types';

interface StageSelectorProps {
  selected: ConstructionStage | null;
  onSelect: (stage: ConstructionStage) => void;
  style?: ViewStyle;
}

export function StageSelector({ selected, onSelect, style }: StageSelectorProps) {
  return (
    <View style={[styles.container, style]}>
      {STAGE_OPTIONS.map((option) => {
        const isSelected = selected === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => {
              Haptics.selectionAsync();
              onSelect(option.value);
            }}
            activeOpacity={0.8}
            style={[styles.option, isSelected && styles.optionSelected]}
          >
            <View style={styles.indicator}>
              <View style={[styles.dot, isSelected && styles.dotSelected]} />
            </View>
            <View style={styles.text}>
              <Typography
                variant="subheadMedium"
                color={isSelected ? colors.accent : colors.textPrimary}
              >
                {option.label}
              </Typography>
              <Typography variant="footnote" color={colors.textSecondary}>
                {option.description}
              </Typography>
            </View>
            <Typography variant="footnoteSemiBold" color={colors.textTertiary}>
              {option.order}
            </Typography>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[2],
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: borderWidths.thin,
    borderColor: colors.separator,
    gap: spacing[3],
  },
  optionSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentLight,
  },
  indicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: borderWidths.base,
    borderColor: colors.separator,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'transparent',
  },
  dotSelected: {
    backgroundColor: colors.accent,
  },
  text: {
    flex: 1,
    gap: 2,
  },
});
