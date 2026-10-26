import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Clipboard,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../../components/layout/EmptyState';
import { SectionHeader } from '../../components/layout/SectionHeader';
import { ReportCard } from '../../components/report/ReportCard';
import { Typography } from '../../components/ui/Typography';
import { useReports } from '../../hooks/useReports';
// getCurrentUserId no longer needed — reports scoped centrally in useReports
import { colors } from '../../theme/colors';
import { spacing, radii, layout, borderWidths } from '../../theme/spacing';
import { STAGE_LABELS } from '../../types';
import type { ReportStatus, WorkerStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<WorkerStackParamList>;

type FilterKey = 'all' | ReportStatus;
type SortKey = 'newest' | 'oldest' | 'stage';
type DateRange = 'all' | '7d' | '30d' | '90d';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',      label: 'All' },
  { key: 'pending',  label: 'Pending' },
  { key: 'verified', label: 'Verified' },
  { key: 'flagged',  label: 'Flagged' },
  { key: 'approved', label: 'Approved' },
];

const SORT_OPTIONS: { key: SortKey; label: string; icon: string }[] = [
  { key: 'newest', label: 'Newest', icon: 'arrow-down' },
  { key: 'oldest', label: 'Oldest', icon: 'arrow-up' },
  { key: 'stage',  label: 'Stage',  icon: 'layers-outline' },
];

const STAGE_ORDER: Record<string, number> = {
  formwork_erected: 1,
  reinforcement_placed: 2,
  concrete_poured: 3,
  structure_complete: 4,
};

const DATE_RANGES: { key: DateRange; label: string }[] = [
  { key: 'all', label: 'All time' },
  { key: '7d',  label: 'Last 7d' },
  { key: '30d', label: 'Last 30d' },
  { key: '90d', label: 'Last 90d' },
];

function dateRangeStart(range: DateRange): Date | null {
  if (range === 'all') return null;
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

export function WorkerHistoryScreen() {
  const navigation = useNavigation<Nav>();
  const { reports, loading, refresh } = useReports();
  const insets = useSafeAreaInsets();

  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [activeSort, setActiveSort]     = useState<SortKey>('newest');
  const [activeDateRange, setDateRange] = useState<DateRange>('all');
  const [showSort, setShowSort]         = useState(false);

  // reports is already scoped to this worker by useReports (scopeReports)
  const allMyReports = reports;

  const myReports = useMemo(() => {
    let filtered = [...allMyReports];

    // Date range filter
    const since = dateRangeStart(activeDateRange);
    if (since) {
      filtered = filtered.filter(
        (r) => new Date(r.submittedAt).getTime() >= since.getTime(),
      );
    }

    // Status filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter((r) => r.status === activeFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      if (activeSort === 'newest') {
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      }
      if (activeSort === 'oldest') {
        return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
      }
      return (STAGE_ORDER[a.reportedStage] ?? 0) - (STAGE_ORDER[b.reportedStage] ?? 0);
    });

    return filtered;
  }, [allMyReports, activeFilter, activeSort, activeDateRange]);

  // Summary stats (scoped to date range, ignoring status filter)
  const rangedReports = useMemo(() => {
    const since = dateRangeStart(activeDateRange);
    if (!since) return allMyReports;
    return allMyReports.filter(
      (r) => new Date(r.submittedAt).getTime() >= since.getTime(),
    );
  }, [allMyReports, activeDateRange]);

  const approvedInRange  = rangedReports.filter((r) => r.status === 'approved').length;
  const reviewableInRange = rangedReports.filter(
    (r) => r.status !== 'uploading' && r.status !== 'pending',
  ).length;
  const approvalRate = reviewableInRange > 0
    ? Math.round((approvedInRange / reviewableInRange) * 100)
    : 0;

  const totalCount   = allMyReports.length;
  const currentLabel = SORT_OPTIONS.find((s) => s.key === activeSort)?.label ?? 'Newest';

  // CSV export to clipboard
  const handleExport = () => {
    const header = 'ID,Site,Stage,Status,Submitted At';
    const rows = myReports.map((r) =>
      [
        r.id,
        `"${r.siteName}"`,
        STAGE_LABELS[r.reportedStage],
        r.status,
        new Date(r.submittedAt).toISOString(),
      ].join(','),
    );
    const csv = [header, ...rows].join('\n');
    Clipboard.setString(csv);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      'Copied to clipboard',
      `${myReports.length} report${myReports.length !== 1 ? 's' : ''} exported as CSV.`,
    );
  };

  return (
    <View style={styles.root}>
      {/* Date range chips */}
      <View style={[styles.dateBar, { paddingTop: insets.top + spacing[3] }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {DATE_RANGES.map((dr) => {
            const active = activeDateRange === dr.key;
            return (
              <TouchableOpacity
                key={dr.key}
                onPress={() => { Haptics.selectionAsync(); setDateRange(dr.key); }}
                activeOpacity={0.8}
                style={[styles.chip, active && styles.chipDateActive]}
              >
                <Typography
                  variant="footnoteSemiBold"
                  color={active ? colors.accent : colors.textTertiary}
                >
                  {dr.label}
                </Typography>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Export button */}
        <TouchableOpacity
          onPress={handleExport}
          activeOpacity={0.8}
          style={styles.exportBtn}
        >
          <Ionicons name="share-outline" size={14} color={colors.accent} />
          <Typography variant="footnoteSemiBold" color={colors.accent}>
            CSV
          </Typography>
        </TouchableOpacity>
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Typography variant="title3" color={colors.textPrimary}>
            {rangedReports.length}
          </Typography>
          <Typography variant="overline" color={colors.textTertiary}>
            Submitted
          </Typography>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Typography
            variant="title3"
            color={approvalRate >= 70 ? colors.successText : colors.textPrimary}
          >
            {approvalRate}%
          </Typography>
          <Typography variant="overline" color={colors.textTertiary}>
            Approval Rate
          </Typography>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Typography variant="title3" color={colors.warningText}>
            {rangedReports.filter((r) => r.status === 'flagged').length}
          </Typography>
          <Typography variant="overline" color={colors.textTertiary}>
            Flagged
          </Typography>
        </View>
      </View>

      {/* Status filter chips row */}
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTERS.map((f) => {
            const active = activeFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setActiveFilter(f.key)}
                activeOpacity={0.8}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Typography
                  variant="footnoteSemiBold"
                  color={active ? colors.textInverse : colors.textSecondary}
                >
                  {f.label}
                </Typography>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Sort button */}
        <TouchableOpacity
          onPress={() => setShowSort((v) => !v)}
          activeOpacity={0.8}
          style={[styles.sortBtn, showSort && styles.sortBtnActive]}
        >
          <Ionicons
            name="swap-vertical-outline"
            size={14}
            color={showSort ? colors.textInverse : colors.textSecondary}
          />
          <Typography
            variant="footnoteSemiBold"
            color={showSort ? colors.textInverse : colors.textSecondary}
          >
            {currentLabel}
          </Typography>
        </TouchableOpacity>
      </View>

      {/* Sort dropdown */}
      {showSort && (
        <View style={styles.sortDropdown}>
          {SORT_OPTIONS.map((opt) => {
            const active = activeSort === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                onPress={() => { setActiveSort(opt.key); setShowSort(false); }}
                activeOpacity={0.8}
                style={[styles.sortOption, active && styles.sortOptionActive]}
              >
                <Ionicons
                  name={opt.icon as any}
                  size={14}
                  color={active ? colors.accent : colors.textSecondary}
                />
                <Typography
                  variant="subheadMedium"
                  color={active ? colors.accent : colors.textPrimary}
                >
                  {opt.label}
                </Typography>
                {active && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark" size={12} color={colors.accent} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* List */}
      <ScrollView
        contentContainerStyle={[
          styles.list,
          { paddingBottom: layout.tabBarHeight + spacing[4] },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.accent} />
        }
      >
        <SectionHeader
          title={`${myReports.length} of ${totalCount} reports`}
          style={styles.listHeader}
        />

        {myReports.length === 0 && !loading ? (
          <EmptyState
            title={activeFilter === 'all' ? 'No reports yet' : `No ${activeFilter} reports`}
            subtitle={
              activeFilter === 'all'
                ? 'Your submitted reports will appear here.'
                : 'Try a different filter to see other reports.'
            }
          />
        ) : (
          myReports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onPress={() =>
                navigation.navigate('WorkerReportDetail', { reportId: report.id })
              }
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgSecondary,
  },

  // ── Date bar ─────────────────────────────────────────────────
  dateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.screenPaddingH,
    paddingBottom: spacing[2],
    gap: spacing[2],
    backgroundColor: colors.bgSecondary,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1] + 2,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.full,
    backgroundColor: colors.accentLight,
    flexShrink: 0,
  },
  chipDateActive: {
    backgroundColor: colors.accentLight,
    borderWidth: borderWidths.thin,
    borderColor: colors.accent,
  },

  // ── Stats bar ─────────────────────────────────────────────────
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: layout.screenPaddingH,
    marginBottom: spacing[2],
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderWidth: borderWidths.thin,
    borderColor: colors.separator,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: colors.separator,
  },

  // ── Filter bar ──────────────────────────────────────────────
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.screenPaddingH,
    paddingBottom: spacing[3],
    gap: spacing[2],
    backgroundColor: colors.bgSecondary,
  },
  filterScroll: {
    flexDirection: 'row',
    gap: spacing[2],
    paddingRight: spacing[2],
  },
  chip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radii.full,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.accent,
  },

  // ── Sort ─────────────────────────────────────────────────────
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1] + 2,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    flexShrink: 0,
  },
  sortBtnActive: {
    backgroundColor: colors.textSecondary,
  },
  sortDropdown: {
    marginHorizontal: layout.screenPaddingH,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    overflow: 'hidden',
    marginBottom: spacing[2],
    // shadow
    shadowColor: '#1A1833',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
  },
  sortOptionActive: {
    backgroundColor: colors.accentLight,
  },
  checkmark: {
    flex: 1,
    alignItems: 'flex-end',
  },

  // ── List ─────────────────────────────────────────────────────
  list: {
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: spacing[3],
  },
  listHeader: {
    marginBottom: spacing[2],
  },
});
