import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/layout/Screen';
import { SectionHeader } from '../../components/layout/SectionHeader';
import { EmptyState } from '../../components/layout/EmptyState';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Typography } from '../../components/ui/Typography';
import { Avatar } from '../../components/ui/Avatar';
import { useReports } from '../../hooks/useReports';
import { MOCK_WORKER, MOCK_SITES } from '../../data/mockData';
import { colors } from '../../theme/colors';
import { spacing, radii } from '../../theme/spacing';
import { STAGE_LABELS } from '../../types';
import type { WorkerStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<WorkerStackParamList>;

export function WorkerHomeScreen() {
  const navigation = useNavigation<Nav>();
  const { reports, loading, refresh } = useReports();

  const mySite = MOCK_SITES.find((s) => s.id === MOCK_WORKER.siteId);
  const myReports = reports
    .filter((r) => r.submittedById === MOCK_WORKER.id)
    .slice(0, 3);

  const pendingCount = myReports.filter(
    (r) => r.status === 'uploading' || r.status === 'pending',
  ).length;

  return (
    <Screen onRefresh={refresh} refreshing={loading}>
      {/* Greeting ──────────────────────────────────────────────── */}
      <View style={styles.greeting}>
        <Avatar name={MOCK_WORKER.name} size={40} />
        <View style={styles.greetingText}>
          <Typography variant="headline" color={colors.textPrimary}>
            {MOCK_WORKER.name.split(' ')[0]}
          </Typography>
          <Typography variant="footnote" color={colors.textTertiary}>
            Site Worker · {mySite?.name ?? '—'}
          </Typography>
        </View>
      </View>

      {/* Site progress card ─────────────────────────────────────── */}
      {mySite ? (
        <Card style={styles.siteCard}>
          {/* Subtle accent top stripe for brand context */}
          <View style={styles.siteInner}>
            <View style={styles.siteHeader}>
              <View style={styles.siteMeta}>
                <Typography
                  variant="subheadMedium"
                  color={colors.textSecondary}
                >
                  Active Site
                </Typography>
                <Typography variant="headline" color={colors.textPrimary}>
                  {mySite.name}
                </Typography>
                <Typography variant="footnote" color={colors.textTertiary}>
                  {mySite.location}
                </Typography>
              </View>
              <View style={styles.percentBadge}>
                <Typography variant="title2" color={colors.accent}>
                  {mySite.progressPercent}
                </Typography>
                <Typography variant="footnote" color={colors.accentMid}>
                  %
                </Typography>
              </View>
            </View>
            <ProgressBar
              value={mySite.progressPercent}
              style={styles.progress}
            />
            <View style={styles.siteFooter}>
              <Typography variant="footnote" color={colors.textTertiary}>
                Current stage
              </Typography>
              <Typography
                variant="footnoteSemiBold"
                color={colors.textSecondary}
              >
                {STAGE_LABELS[mySite.currentStage]}
              </Typography>
            </View>
          </View>
        </Card>
      ) : null}

      {/* CTA ───────────────────────────────────────────────────── */}
      <Button
        label="Submit Field Report"
        onPress={() => navigation.navigate('SubmitReport')}
        variant="primary"
        size="lg"
        fullWidth
        style={styles.cta}
      />

      {/* Pending banner ─────────────────────────────────────────── */}
      {pendingCount > 0 && (
        <View style={styles.pendingBanner}>
          <ActivityIndicator size="small" color={colors.accent} />
          <Typography variant="footnote" color={colors.infoText}>
            {pendingCount} report{pendingCount > 1 ? 's' : ''} being verified by
            AI
          </Typography>
        </View>
      )}

      {/* Recent reports ──────────────────────────────────────────── */}
      <SectionHeader title="Recent Reports" style={styles.sectionHeader} />

      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : myReports.length === 0 ? (
        <EmptyState
          title="No reports yet"
          subtitle="Submit your first field report to get started."
        />
      ) : (
        myReports.map((report) => (
          <TouchableOpacity
            key={report.id}
            onPress={() =>
              navigation.navigate('WorkerReportDetail', { reportId: report.id })
            }
            activeOpacity={0.82}
          >
            <Card style={styles.reportCard} padded={false}>
              <View style={styles.reportRow}>
                <View style={styles.reportLeft}>
                  <Typography
                    variant="subheadMedium"
                    color={colors.textPrimary}
                  >
                    {STAGE_LABELS[report.reportedStage]}
                  </Typography>
                  <Typography variant="footnote" color={colors.textTertiary}>
                    {report.siteName}
                  </Typography>
                </View>
                <View style={styles.reportRight}>
                  <StatusBadge status={report.status} />
                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color={colors.textQuaternary}
                    style={styles.chevron}
                  />
                </View>
              </View>
            </Card>
          </TouchableOpacity>
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

  // ── Site card ──────────────────────────────────────────────────
  siteCard: {
    marginBottom: spacing[4],
    paddingTop: 0,
    paddingHorizontal: 0,
    paddingBottom: 0,
    overflow: 'hidden',
  },
  siteInner: {
    padding: spacing[4],
  },
  siteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },
  siteMeta: { flex: 1, marginRight: spacing[3], gap: 2 },
  percentBadge: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 1,
  },
  progress: { marginBottom: spacing[3] },
  siteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // ── CTA ─────────────────────────────────────────────────────
  cta: { marginBottom: spacing[3] },

  // ── Pending banner ──────────────────────────────────────────
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.infoBg,
    borderRadius: radii.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    marginBottom: spacing[5],
  },

  sectionHeader: { marginBottom: spacing[2] },
  loader: { marginTop: spacing[8] },

  // ── Report row ───────────────────────────────────────────────
  reportCard: {
    marginBottom: spacing[2],
  },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
  },
  reportLeft: { gap: 2, flex: 1 },
  reportRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  chevron: {
    marginLeft: 2,
  },
});
