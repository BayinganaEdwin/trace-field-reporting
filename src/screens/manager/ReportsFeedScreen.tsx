import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/layout/Screen';
import { EmptyState } from '../../components/layout/EmptyState';
import { ReportCard } from '../../components/report/ReportCard';
import { Typography } from '../../components/ui/Typography';
import { useReports } from '../../hooks/useReports';
import { colors } from '../../theme/colors';
import { spacing, radii } from '../../theme/spacing';
import type { ManagerStackParamList, ReportStatus } from '../../types';

type Nav = NativeStackNavigationProp<ManagerStackParamList>;

type FilterKey = 'all' | 'needs_review' | 'flagged' | 'approved' | 'rejected';

const NEEDS_REVIEW_STATUSES: ReportStatus[] = ['verified', 'flagged', 'pending'];

function applyFilter(reports: any[], key: FilterKey) {
  switch (key) {
    case 'needs_review': return reports.filter((r) => NEEDS_REVIEW_STATUSES.includes(r.status));
    case 'flagged':      return reports.filter((r) => r.status === 'flagged');
    case 'approved':     return reports.filter((r) => r.status === 'approved');
    case 'rejected':     return reports.filter((r) => r.status === 'rejected');
    default:             return reports;
  }
}

export function ReportsFeedScreen() {
  const navigation = useNavigation<Nav>();
  const { reports, loading, refresh } = useReports();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

  // Counts for badge labels
  const counts: Record<FilterKey, number> = {
    all:          reports.length,
    needs_review: reports.filter((r) => NEEDS_REVIEW_STATUSES.includes(r.status)).length,
    flagged:      reports.filter((r) => r.status === 'flagged').length,
    approved:     reports.filter((r) => r.status === 'approved').length,
    rejected:     reports.filter((r) => r.status === 'rejected').length,
  };

  const FILTERS: { key: FilterKey; label: string; urgentColor?: string }[] = [
    { key: 'all',          label: 'All' },
    { key: 'needs_review', label: 'Needs Review', urgentColor: colors.accent },
    { key: 'flagged',      label: 'Flagged',      urgentColor: colors.warningText },
    { key: 'approved',     label: 'Approved' },
    { key: 'rejected',     label: 'Rejected' },
  ];

  const visible = applyFilter(reports, activeFilter);

  return (
    <Screen padded={false} onRefresh={refresh} refreshing={loading}>
      {/* ── Filter bar ──────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterBar}
      >
        {FILTERS.map((f) => {
          const isActive  = activeFilter === f.key;
          const count     = counts[f.key];
          const isUrgent  = !isActive && count > 0 && f.urgentColor;

          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setActiveFilter(f.key)}
              style={[
                styles.filterChip,
                isActive && styles.filterChipActive,
              ]}
              activeOpacity={0.8}
            >
              <Typography
                variant="subheadMedium"
                color={isActive ? colors.textInverse : colors.textSecondary}
              >
                {f.label}
              </Typography>
              {count > 0 && (
                <View style={[
                  styles.countBadge,
                  isActive
                    ? styles.countBadgeActive
                    : isUrgent
                      ? { backgroundColor: f.urgentColor + '22' }
                      : styles.countBadgeDefault,
                ]}>
                  <Typography
                    variant="overline"
                    color={
                      isActive ? colors.textInverse :
                      isUrgent ? f.urgentColor! :
                      colors.textTertiary
                    }
                  >
                    {count}
                  </Typography>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Summary line ─────────────────────────────────────────── */}
      <View style={styles.summaryRow}>
        <Typography variant="footnote" color={colors.textTertiary}>
          {visible.length} report{visible.length !== 1 ? 's' : ''}
          {activeFilter !== 'all' ? ` · ${FILTERS.find(f => f.key === activeFilter)?.label}` : ''}
        </Typography>
      </View>

      {/* ── List ─────────────────────────────────────────────────── */}
      <View style={styles.list}>
        {loading ? (
          <ActivityIndicator color={colors.accent} style={styles.loader} />
        ) : visible.length === 0 ? (
          <EmptyState
            title={activeFilter === 'all' ? 'No reports yet' : 'Nothing here'}
            subtitle={
              activeFilter === 'needs_review'
                ? "You're all caught up — no reports waiting for review."
                : activeFilter === 'flagged'
                  ? 'No flagged reports right now.'
                  : 'No reports match this filter.'
            }
          />
        ) : (
          visible.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onPress={() => navigation.navigate('ReportDetail', { reportId: report.id })}
            />
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  filterBar: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
    gap: spacing[2],
    flexDirection: 'row',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1] + 2,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radii.full,
    backgroundColor: colors.bgSecondary,
  },
  filterChipActive: {
    backgroundColor: colors.accent,
  },
  countBadge: {
    borderRadius: radii.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  countBadgeDefault: {
    backgroundColor: colors.separator,
  },
  summaryRow: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[2],
  },
  list: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[6],
  },
  loader: {
    marginTop: spacing[12],
  },
});
