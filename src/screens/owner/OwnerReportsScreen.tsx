import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '../../components/ui/Typography';
import { ReportCard } from '../../components/report/ReportCard';
import { EmptyState } from '../../components/layout/EmptyState';
import { useReports } from '../../hooks/useReports';
import { colors } from '../../theme/colors';
import { spacing, radii, borderWidths } from '../../theme/spacing';
import type { ReportStatus } from '../../types';

// ── Filter config ─────────────────────────────────────────────────────────────

type FilterKey = 'all' | 'verified' | 'flagged' | 'approved';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',      label: 'All' },
  { key: 'verified', label: 'Verified' },
  { key: 'flagged',  label: 'Flagged' },
  { key: 'approved', label: 'Approved' },
];

function applyFilter(reports: any[], key: FilterKey) {
  if (key === 'all') return reports;
  return reports.filter((r) => r.status === key);
}

// ── Screen ────────────────────────────────────────────────────────────────────

export function OwnerReportsScreen() {
  const insets = useSafeAreaInsets();
  const { reports, loading, refresh } = useReports();
  const [filter, setFilter] = useState<FilterKey>('all');

  const displayed = applyFilter(reports, filter);

  return (
    <View style={styles.root}>
      {/* Sticky header */}
      <View style={[styles.stickyHeader, { paddingTop: insets.top + spacing[4] }]}>
        <View style={styles.headerRow}>
          <View>
            <Typography variant="title3" color={colors.textPrimary}>
              Reports
            </Typography>
          </View>
          <Typography variant="footnote" color={colors.textTertiary}>
            {displayed.length} of {reports.length}
          </Typography>
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setFilter(f.key)}
                activeOpacity={0.75}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Typography
                  variant="subheadMedium"
                  color={active ? colors.textInverse : colors.textSecondary}
                >
                  {f.label}
                </Typography>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Report list */}
      <ScrollView
        contentContainerStyle={[
          styles.listContent,
          displayed.length === 0 && styles.emptyContent,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={colors.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {displayed.length === 0 ? (
          <EmptyState
            title="No reports"
            subtitle="Nothing matches the current filter."
          />
        ) : (
          displayed.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onPress={() => {}} // owner is read-only — no navigation
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgSecondary,
  },

  // Header
  stickyHeader: {
    backgroundColor: colors.bgSecondary,
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[3],
    gap: spacing[3],
    borderBottomWidth: borderWidths.hairline,
    borderBottomColor: colors.separator,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  // Filters
  filterRow: {
    gap: spacing[2],
    paddingBottom: spacing[1],
  },
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

  // List
  listContent: {
    padding: spacing[5],
    gap: spacing[3],
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});
