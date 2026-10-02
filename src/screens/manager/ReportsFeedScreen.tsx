import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/layout/Screen';
import { EmptyState } from '../../components/layout/EmptyState';
import { ReportCard } from '../../components/report/ReportCard';
import { Typography } from '../../components/ui/Typography';
import { useReports } from '../../hooks/useReports';
import { colors } from '../../theme/colors';
import { spacing, radii, borderWidths } from '../../theme/spacing';
import type { ManagerStackParamList, ReportStatus } from '../../types';

type Nav = NativeStackNavigationProp<ManagerStackParamList>;

type FilterKey = 'all' | 'needs_review' | 'flagged' | 'approved';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',          label: 'All' },
  { key: 'needs_review', label: 'Needs Review' },
  { key: 'flagged',      label: 'Flagged' },
  { key: 'approved',     label: 'Approved' },
];

const NEEDS_REVIEW_STATUSES: ReportStatus[] = ['verified', 'flagged', 'pending'];

function applyFilter(reports: any[], key: FilterKey) {
  switch (key) {
    case 'needs_review': return reports.filter((r) => NEEDS_REVIEW_STATUSES.includes(r.status));
    case 'flagged':      return reports.filter((r) => r.status === 'flagged');
    case 'approved':     return reports.filter((r) => r.status === 'approved');
    default:             return reports;
  }
}

export function ReportsFeedScreen() {
  const navigation   = useNavigation<Nav>();
  const { reports, loading, refresh } = useReports();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

  const visible = applyFilter(reports, activeFilter);

  return (
    <Screen padded={false} onRefresh={refresh} refreshing={loading}>
      {/* Filter bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterBar}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setActiveFilter(f.key)}
            style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
            activeOpacity={0.8}
          >
            <Typography
              variant="subheadMedium"
              color={activeFilter === f.key ? colors.surface : colors.textSecondary}
            >
              {f.label}
            </Typography>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.list}>
        {loading ? (
          <ActivityIndicator color={colors.accent} style={styles.loader} />
        ) : visible.length === 0 ? (
          <EmptyState
            title="No reports"
            subtitle="No reports match the selected filter."
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
    paddingVertical: spacing[3],
    gap: spacing[2],
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radii.full,
    // No border — background fill IS the chip
    backgroundColor: colors.surface,
  },
  filterChipActive: {
    backgroundColor: colors.accent,
  },
  list: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[6],
  },
  loader: {
    marginTop: spacing[12],
  },
});
