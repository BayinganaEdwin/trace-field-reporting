import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Typography } from '../components/ui/Typography';
import { colors } from '../theme/colors';
import { spacing, radii, borderWidths } from '../theme/spacing';
import { MOCK_WORKER, MOCK_MANAGER } from '../data/mockData';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'RoleSelect'>;

interface RoleTileProps {
  title: string;
  subtitle: string;
  detail: string;
  onPress: () => void;
  accent?: boolean;
}

function RoleTile({ title, subtitle, detail, onPress, accent }: RoleTileProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.82}
      style={[styles.tile, accent && styles.tileAccent]}
    >
      <Typography
        variant="title3"
        color={accent ? colors.surface : colors.textPrimary}
      >
        {title}
      </Typography>
      <Typography
        variant="subhead"
        color={accent ? 'rgba(255,255,255,0.75)' : colors.textSecondary}
        style={styles.tileSubtitle}
      >
        {subtitle}
      </Typography>
      <View style={styles.tileDivider} />
      <Typography
        variant="footnote"
        color={accent ? 'rgba(255,255,255,0.6)' : colors.textTertiary}
      >
        {detail}
      </Typography>
    </TouchableOpacity>
  );
}

export function RoleSelectScreen({ navigation }: Props) {
  return (
    <SafeAreaView
      style={styles.safe}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <View style={styles.container}>
        {/* Wordmark */}
        <View style={styles.header}>
          <Typography variant="title1" color={colors.textPrimary}>
            Trace
          </Typography>
          <Typography
            variant="subhead"
            color={colors.textSecondary}
            style={styles.tagline}
          >
            Construction Field Reporting & AI Verification
          </Typography>
        </View>

        {/* Role tiles */}
        <View style={styles.tiles}>
          <RoleTile
            title="Site Worker"
            subtitle="Submit daily field reports with photo evidence"
            detail={`Signed in as ${MOCK_WORKER.name}`}
            onPress={() => navigation.replace('WorkerApp')}
            accent
          />
          <RoleTile
            title="Project Manager"
            subtitle="Review, verify, and approve field reports"
            detail={`Signed in as ${MOCK_MANAGER.name}`}
            onPress={() => navigation.replace('ManagerApp')}
          />
        </View>

        {/* Prototype notice */}
        {/* <Typography variant="footnote" color={colors.textTertiary} align="center" style={styles.notice}>
          Prototype · ALU Capstone 2025 · Mock data only
        </Typography> */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bgSecondary,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing[5],
    justifyContent: 'center',
    gap: spacing[8],
  },
  header: {
    gap: spacing[2],
  },
  tagline: {
    maxWidth: 260,
  },
  tiles: {
    gap: spacing[3],
  },
  tile: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: borderWidths.thin,
    borderColor: colors.separator,
    padding: spacing[5],
  },
  tileAccent: {
    backgroundColor: colors.accent,
    borderColor: colors.accentDark,
  },
  tileSubtitle: {
    marginTop: spacing[1],
  },
  tileDivider: {
    height: borderWidths.thin,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginVertical: spacing[3],
  },
  notice: {
    paddingBottom: spacing[4],
  },
});
