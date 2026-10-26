/**
 * SiteDetailScreen
 * Per-site deep-dive: hero stats, REI, stage progress, full report history for the site.
 * Accessible by tapping a site card on ManagerHomeScreen.
 */
import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '../../components/ui/Typography';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { ReportCard } from '../../components/report/ReportCard';
import { EmptyState } from '../../components/layout/EmptyState';
import { useReports } from '../../hooks/useReports';
import { colors } from '../../theme/colors';
import { spacing, radii, borderWidths } from '../../theme/spacing';
import { STAGE_LABELS } from '../../types';
import type { ManagerStackParamList, ReportStatus } from '../../types';

type Props = NativeStackScreenProps<ManagerStackParamList, 'SiteDetail'>;
type Nav   = NativeStackNavigationProp<ManagerStackParamList>;

// ── Filter ────────────────────────────────────────────────────────────────────

type FilterKey = 'all' | 'verified' | 'flagged' | 'approved' | 'pending';
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',      label: 'All' },
  { key: 'verified', label: 'Verified' },
  { key: 'flagged',  label: 'Flagged' },
  { key: 'approved', label: 'Approved' },
  { key: 'pending',  label: 'Pending' },
];

// ── Stat chip ─────────────────────────────────────────────────────────────────

interface StatChipProps {
  label: string;
  value: string | number;
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  iconBg: string;
}

function StatChip({ label, value, iconName, iconColor, iconBg }: StatChipProps) {
  return (
    <View style={chip.wrap}>
      <View style={[chip.icon, { backgroundColor: iconBg }]}>
        <Ionicons name={iconName} size={15} color={iconColor} />
      </View>
      <Typography variant="title3" color={colors.textPrimary}>{value}</Typography>
      <Typography variant="footnote" color={colors.textTertiary}>{label}</Typography>
    </View>
  );
}

const chip = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    gap: spacing[1],
  },
  icon: {
    width: 30,
    height: 30,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[1],
  },
});

// ── Stage timeline ────────────────────────────────────────────────────────────

const STAGE_ORDER = [
  'formwork_erected',
  'reinforcement_placed',
  'concrete_poured',
  'structure_complete',
] as const;

interface StageTimelineProps {
  currentStage: string;
}

function StageTimeline({ currentStage }: StageTimelineProps) {
  const currentIdx = STAGE_ORDER.indexOf(currentStage as typeof STAGE_ORDER[number]);
  return (
    <View style={timeline.wrap}>
      {STAGE_ORDER.map((stage, idx) => {
        const done    = idx <= currentIdx;
        const active  = idx === currentIdx;
        return (
          <View key={stage} style={timeline.item}>
            <View style={[timeline.dot, done && timeline.dotDone, active && timeline.dotActive]}>
              {done && !active && (
                <Ionicons name="checkmark" size={10} color={colors.textInverse} />
              )}
              {active && <View style={timeline.activePip} />}
            </View>
            {idx < STAGE_ORDER.length - 1 && (
              <View style={[timeline.line, done && idx < currentIdx && timeline.lineDone]} />
            )}
            <Typography
              variant="overline"
              color={active ? colors.accent : done ? colors.successText : colors.textQuaternary}
              style={timeline.label}
              numberOfLines={2}
            >
              {STAGE_LABELS[stage]}
            </Typography>
          </View>
        );
      })}
    </View>
  );
}

const timeline = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: spacing[1],
    position: 'relative',
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: borderWidths.thin,
    borderColor: colors.separator,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  dotDone: {
    backgroundColor: colors.successText,
    borderColor: colors.successText,
  },
  dotActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  activePip: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.textInverse,
  },
  line: {
    position: 'absolute',
    top: 10,
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: colors.separator,
    zIndex: 0,
  },
  lineDone: {
    backgroundColor: colors.successText,
  },
  label: {
    textAlign: 'center',
    letterSpacing: 0.4,
    marginTop: spacing[1],
  },
});

// ── Screen ────────────────────────────────────────────────────────────────────

export function SiteDetailScreen({ route }: Props) {
  const { siteId } = route.params;
  const navigation  = useNavigation<Nav>();
  const { sites, reports, loading, refresh } = useReports();
  const insets = useSafeAreaInsets();

  const [filter, setFilter] = useState<FilterKey>('all');

  const site = sites.find((s) => s.id === siteId);
  if (!site) return null;

  const siteReports  = reports.filter((r) => r.siteId === siteId);
  const reviewed     = siteReports.filter((r) => !['uploading', 'pending', 'ai_processing'].includes(r.status));
  const approved     = siteReports.filter((r) => r.status === 'approved');
  const flagged      = siteReports.filter((r) => r.status === 'flagged');
  const rei          = reviewed.length > 0 ? Math.round((approved.length / reviewed.length) * 100) : 0;
  const avgConf      = (() => {
    const withAI = siteReports.filter((r) => r.aiResult);
    if (withAI.length === 0) return null;
    return Math.round(withAI.reduce((s, r) => s + (r.aiResult!.confidenceScore), 0) / withAI.length);
  })();

  const displayed = filter === 'all'
    ? siteReports
    : siteReports.filter((r) => r.status === filter);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.accent} />
      }
    >
      {/* Hero card */}
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.heroMeta}>
            <Typography variant="title3" color={colors.textPrimary}>{site.name}</Typography>
            <View style={styles.heroLoc}>
              <Ionicons name="location-outline" size={12} color={colors.textTertiary} />
              <Typography variant="footnote" color={colors.textTertiary}>{site.location}</Typography>
            </View>
          </View>
          <Typography variant="title2" color={colors.accent}>{site.progressPercent}%</Typography>
        </View>
        <ProgressBar value={site.progressPercent} style={styles.heroBar} />
        <View style={styles.heroBadgeRow}>
          <View style={styles.workerBadge}>
            <Ionicons name="people-outline" size={12} color={colors.infoText} />
            <Typography variant="footnote" color={colors.infoText}>
              {site.workerCount} worker{site.workerCount !== 1 ? 's' : ''}
            </Typography>
          </View>
          <View style={[styles.stageBadge, { backgroundColor: colors.successBg }]}>
            <Typography variant="footnote" color={colors.successText}>
              {STAGE_LABELS[site.currentStage]}
            </Typography>
          </View>
        </View>
      </View>

      {/* Stage timeline */}
      <View style={styles.card}>
        <Typography variant="headline" color={colors.textPrimary} style={styles.cardTitle}>
          Stage Progress
        </Typography>
        <StageTimeline currentStage={site.currentStage} />
      </View>

      {/* Stat chips */}
      <View style={styles.statRow}>
        <StatChip label="REI Score" value={`${rei}%`} iconName="bar-chart" iconColor={colors.accent} iconBg={colors.accentLight} />
        <View style={styles.statDivider} />
        <StatChip label="Reports" value={siteReports.length} iconName="document-text" iconColor={colors.infoText} iconBg={colors.infoBg} />
        <View style={styles.statDivider} />
        <StatChip label="Flagged" value={flagged.length} iconName="flag" iconColor={colors.warningText} iconBg={colors.warningBg} />
        {avgConf !== null && (
          <>
            <View style={styles.statDivider} />
            <StatChip label="Avg Conf." value={`${avgConf}%`} iconName="sparkles" iconColor={colors.successText} iconBg={colors.successBg} />
          </>
        )}
      </View>

      {/* Report history */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Typography variant="headline" color={colors.textPrimary}>Reports</Typography>
          <Typography variant="footnote" color={colors.textTertiary}>
            {displayed.length} of {siteReports.length}
          </Typography>
        </View>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => { Haptics.selectionAsync(); setFilter(f.key); }}
                activeOpacity={0.75}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Typography variant="subheadMedium" color={active ? colors.textInverse : colors.textSecondary}>
                  {f.label}
                </Typography>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {displayed.length === 0 ? (
          <EmptyState title="No reports" subtitle="Nothing matches this filter." />
        ) : (
          displayed.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onPress={() => navigation.navigate('ReportDetail', { reportId: report.id })}
            />
          ))
        )}
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
    paddingTop: spacing[4],
    paddingBottom: spacing[14],
    gap: spacing[4],
  },

  // Hero
  hero: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing[5],
    gap: spacing[3],
    ...Platform.select({
      ios:     { shadowColor: '#1A1833', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10 },
      android: { elevation: 2 },
    }),
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  heroMeta: { flex: 1, gap: spacing[1], marginRight: spacing[3] },
  heroLoc: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
  heroBar: { marginVertical: spacing[1] },
  heroBadgeRow: { flexDirection: 'row', gap: spacing[2], alignItems: 'center' },
  workerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.infoBg, borderRadius: radii.full,
    paddingHorizontal: spacing[3], paddingVertical: 4,
  },
  stageBadge: {
    borderRadius: radii.full, paddingHorizontal: spacing[3], paddingVertical: 4,
  },

  // Stage timeline card
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing[5],
    gap: spacing[4],
    ...Platform.select({
      ios:     { shadowColor: '#1A1833', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10 },
      android: { elevation: 2 },
    }),
  },
  cardTitle: { marginBottom: spacing[1] },

  // Stat chips
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing[4],
    ...Platform.select({
      ios:     { shadowColor: '#1A1833', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10 },
      android: { elevation: 2 },
    }),
  },
  statDivider: {
    width: borderWidths.hairline,
    height: 40,
    backgroundColor: colors.separator,
    marginHorizontal: spacing[2],
  },

  // Section + filter
  section: { gap: spacing[3] },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterRow: { gap: spacing[2] },
  filterChip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: borderWidths.thin,
    borderColor: colors.separator,
  },
  filterChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
});
