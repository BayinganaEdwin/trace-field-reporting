import React from 'react';
import { View, ScrollView, StyleSheet, Platform, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../../components/ui/Typography';
import { colors } from '../../theme/colors';
import { spacing, radii, borderWidths } from '../../theme/spacing';
import { useReports } from '../../hooks/useReports';
import { STAGE_LABELS } from '../../types';

// ── Sub-components ────────────────────────────────────────────────────────────

interface StatTileProps {
  label: string;
  value: string | number;
  accent?: boolean;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  iconBg: string;
}

function StatTile({ label, value, icon, iconColor, iconBg }: StatTileProps) {
  return (
    <View style={styles.tile}>
      <View style={[styles.tileIconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Typography variant="largeTitle" color={colors.textPrimary} style={styles.tileValue}>
        {value}
      </Typography>
      <Typography variant="footnote" color={colors.textTertiary}>
        {label}
      </Typography>
    </View>
  );
}

interface SiteRowProps {
  name: string;
  location: string;
  stage: string;
  progress: number;
  workerCount: number;
}

function SiteRow({ name, location, stage, progress, workerCount }: SiteRowProps) {
  return (
    <View style={styles.siteRow}>
      <View style={styles.siteLeft}>
        <View style={styles.siteIconWrap}>
          <Ionicons name="business-outline" size={16} color={colors.accent} />
        </View>
        <View style={styles.siteTextGroup}>
          <Typography variant="subheadMedium" color={colors.textPrimary}>{name}</Typography>
          <Typography variant="footnote" color={colors.textTertiary}>{location}</Typography>
        </View>
      </View>
      <View style={styles.siteRight}>
        <Typography variant="footnoteSemiBold" color={colors.accent}>{progress}%</Typography>
        <Typography variant="overline" color={colors.textTertiary}>{stage}</Typography>
      </View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export function OwnerOverviewScreen() {
  const insets = useSafeAreaInsets();
  const { reports, sites, loading, refresh } = useReports();

  const total    = reports.length;
  const approved = reports.filter((r) => r.status === 'approved').length;
  const flagged  = reports.filter((r) => r.status === 'flagged').length;
  const reviewable = reports.filter((r) => !['uploading', 'pending'].includes(r.status)).length;
  const rei      = reviewable > 0 ? Math.round((approved / reviewable) * 100) : 0;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing[6] }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Typography variant="title2" color={colors.textPrimary}>
          Project Overview
        </Typography>
        <Typography variant="subhead" color={colors.textSecondary}>
          Site progress and report status
        </Typography>
      </View>

      {/* Stat grid */}
      <View style={styles.statGrid}>
        <StatTile
          label="Reports"
          value={total}
          icon="document-text"
          iconColor={colors.infoText}
          iconBg={colors.infoBg}
        />
        <StatTile
          label="Approved"
          value={approved}
          icon="checkmark-circle"
          iconColor={colors.successText}
          iconBg={colors.successBg}
        />
        <StatTile
          label="Flagged"
          value={flagged}
          icon="flag"
          iconColor={colors.warningText}
          iconBg={colors.warningBg}
        />
        <StatTile
          label="REI Score"
          value={`${rei}%`}
          icon="bar-chart"
          iconColor={colors.accent}
          iconBg={colors.accentLight}
        />
      </View>

      {/* Sites */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Typography variant="headline" color={colors.textPrimary}>
            Active Sites
          </Typography>
          <Typography variant="footnote" color={colors.textTertiary}>
            {sites.length} site{sites.length !== 1 ? 's' : ''}
          </Typography>
        </View>
        <View style={styles.card}>
          {sites.length === 0 ? (
            <View style={{ padding: spacing[4] }}>
              <Typography variant="footnote" color={colors.textTertiary} align="center">
                No sites available
              </Typography>
            </View>
          ) : (
            sites.map((site, index) => (
              <View key={site.id}>
                {index > 0 && <View style={styles.rowDivider} />}
                <SiteRow
                  name={site.name}
                  location={site.location ?? ''}
                  stage={STAGE_LABELS[site.currentStage ?? 'formwork_erected'] ?? site.currentStage ?? ''}
                  progress={site.progressPercent ?? 0}
                  workerCount={site.workerCount ?? 0}
                />
              </View>
            ))
          )}
        </View>
      </View>

    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgSecondary,
  },
  content: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[16],
    gap: spacing[6],
  },
  header: {
    gap: spacing[2],
  },

  // Stat grid
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  tile: {
    flex: 1,
    minWidth: '44%',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing[4],
    gap: spacing[2],
    ...Platform.select({
      ios: {
        shadowColor: '#1A1833',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  tileIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileValue: {
    marginTop: spacing[1],
  },

  // Sites
  section: {
    gap: spacing[3],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#1A1833',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  siteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
  },
  siteLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    flex: 1,
  },
  siteIconWrap: {
    width: 34,
    height: 34,
    borderRadius: radii.md,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  siteTextGroup: {
    gap: 2,
    flex: 1,
  },
  siteRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  rowDivider: {
    height: borderWidths.hairline,
    backgroundColor: colors.separator,
    marginHorizontal: spacing[4],
  },

});
