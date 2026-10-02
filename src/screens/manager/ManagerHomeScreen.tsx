import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Screen } from '../../components/layout/Screen';
import { SectionHeader } from '../../components/layout/SectionHeader';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Typography } from '../../components/ui/Typography';
import { Avatar } from '../../components/ui/Avatar';
import { useReports } from '../../hooks/useReports';
import { MOCK_MANAGER } from '../../data/mockData';
import { colors } from '../../theme/colors';
import { spacing, radii } from '../../theme/spacing';
import { STAGE_LABELS } from '../../types';
import type { ReportStatus } from '../../types';

const STATUSES_NEEDING_REVIEW: ReportStatus[] = ['verified', 'flagged'];

export function ManagerHomeScreen() {
  const { reports, sites, loading, refresh } = useReports();

  const pendingReview = reports.filter((r) =>
    STATUSES_NEEDING_REVIEW.includes(r.status),
  );
  const flaggedCount = reports.filter((r) => r.status === 'flagged').length;
  const approvedCount = reports.filter((r) => r.status === 'approved').length;

  const reviewable = reports.filter(
    (r) => r.status !== 'uploading' && r.status !== 'pending',
  );
  const rei =
    reviewable.length > 0
      ? Math.round((approvedCount / reviewable.length) * 100)
      : 0;

  return (
    <Screen onRefresh={refresh} refreshing={loading}>
      {/* Greeting ──────────────────────────────────────────────── */}
      <View style={styles.greeting}>
        <Avatar name={MOCK_MANAGER.name} size={40} />
        <View style={styles.greetingText}>
          <Typography variant="headline" color={colors.textPrimary}>
            {MOCK_MANAGER.name.split(' ')[0]}
          </Typography>
          <Typography variant="footnote" color={colors.textTertiary}>
            Project Manager
          </Typography>
        </View>
      </View>

      {/* Stats row — three distinct tiles with colour context ──── */}
      <View style={styles.statsRow}>
        {/* Needs Review — accent highlight */}
        <View
          style={[styles.statTile, { backgroundColor: colors.accentLight }]}
        >
          <Typography variant="title2" color={colors.accent}>
            {pendingReview.length}
          </Typography>
          <Typography variant="footnote" color={colors.infoText}>
            Needs Review
          </Typography>
        </View>

        {/* Flagged — warning colour context */}
        <View
          style={[
            styles.statTile,
            {
              backgroundColor:
                flaggedCount > 0 ? colors.warningBg : colors.bgSecondary,
            },
          ]}
        >
          <Typography
            variant="title2"
            color={flaggedCount > 0 ? colors.warningText : colors.textPrimary}
          >
            {flaggedCount}
          </Typography>
          <Typography
            variant="footnote"
            color={flaggedCount > 0 ? colors.warningText : colors.textSecondary}
          >
            Flagged
          </Typography>
        </View>

        {/* REI Score — success colour when high */}
        <View
          style={[
            styles.statTile,
            {
              backgroundColor:
                rei >= 70 ? colors.successBg : colors.bgSecondary,
            },
          ]}
        >
          <Typography
            variant="title2"
            color={rei >= 70 ? colors.successText : colors.textPrimary}
          >
            {rei}
          </Typography>
          <Typography
            variant="footnote"
            color={rei >= 70 ? colors.successText : colors.textSecondary}
          >
            REI Score
          </Typography>
        </View>
      </View>

      {/* REI detail card ─────────────────────────────────────────── */}
      <Card style={styles.reiCard}>
        <View style={styles.reiHeader}>
          <View style={styles.reiMeta}>
            <Typography variant="subheadMedium" color={colors.textPrimary}>
              Reporting Evaluation Index
            </Typography>
            <Typography variant="footnote" color={colors.textTertiary}>
              Composite compliance score — 0 to 100
            </Typography>
          </View>
          <Typography variant="title2" color={colors.accent}>
            {rei}
          </Typography>
        </View>
        <ProgressBar value={rei} style={styles.reiBar} />
        <Typography variant="footnote" color={colors.textTertiary}>
          Based on {reviewable.length} reviewed report
          {reviewable.length !== 1 ? 's' : ''}
        </Typography>
      </Card>

      {/* Site summaries ──────────────────────────────────────────── */}
      <SectionHeader title="Active Sites" style={styles.sectionHeader} />

      {loading ? (
        <ActivityIndicator color={colors.accent} />
      ) : (
        sites.map((site) => (
          <Card key={site.id} style={styles.siteCard}>
            <View style={styles.siteHeader}>
              <View style={styles.siteMeta}>
                <Typography variant="subheadMedium" color={colors.textPrimary}>
                  {site.name}
                </Typography>
                <Typography variant="footnote" color={colors.textTertiary}>
                  {site.location}
                </Typography>
              </View>
              <Typography variant="title3" color={colors.accent}>
                {site.progressPercent}%
              </Typography>
            </View>
            <ProgressBar
              value={site.progressPercent}
              style={styles.siteProgress}
            />
            <View style={styles.siteFooter}>
              <Typography variant="footnote" color={colors.textTertiary}>
                {STAGE_LABELS[site.currentStage]}
              </Typography>
              <Typography variant="footnote" color={colors.textTertiary}>
                {site.workerCount} worker{site.workerCount !== 1 ? 's' : ''}
              </Typography>
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  greeting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[5],
  },
  greetingText: { gap: 1 },

  // ── Stats row ─────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  statTile: {
    flex: 1,
    borderRadius: radii.xl,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[4],
    gap: 3,
    alignItems: 'flex-start',
  },

  // ── REI card ──────────────────────────────────────────────────
  reiCard: {
    marginBottom: spacing[5],
    gap: spacing[2],
  },
  reiHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing[1],
  },
  reiMeta: { flex: 1, marginRight: spacing[3], gap: 2 },
  reiBar: { marginBottom: spacing[1] },

  sectionHeader: { marginBottom: spacing[2] },

  // ── Site cards ────────────────────────────────────────────────
  siteCard: { marginBottom: spacing[3] },
  siteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },
  siteMeta: { flex: 1, marginRight: spacing[3], gap: 2 },
  siteProgress: { marginBottom: spacing[3] },
  siteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
