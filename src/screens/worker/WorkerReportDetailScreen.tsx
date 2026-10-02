import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../components/layout/Screen';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { Typography } from '../../components/ui/Typography';
import { Divider } from '../../components/ui/Divider';
import { AIVerificationCard } from '../../components/report/AIVerificationCard';
import { useReports } from '../../hooks/useReports';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { STAGE_LABELS } from '../../types';
import type { WorkerStackParamList } from '../../types';

type Props = NativeStackScreenProps<WorkerStackParamList, 'WorkerReportDetail'>;

export function WorkerReportDetailScreen({ route }: Props) {
  const { reportId } = route.params;
  const { getReport, loading } = useReports();
  const report = getReport(reportId);

  if (loading || !report) {
    return (
      <Screen withTopInset={false}>
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      </Screen>
    );
  }

  return (
    <Screen withTopInset={false}>
      {/* Status + meta */}
      <Card style={styles.metaCard} padded={false}>
        <View style={styles.metaHeader}>
          <View>
            <Typography variant="headline" color={colors.textPrimary}>
              {STAGE_LABELS[report.reportedStage]}
            </Typography>
            <Typography variant="footnote" color={colors.textSecondary}>
              {report.siteName}
            </Typography>
          </View>
          <StatusBadge status={report.status} />
        </View>

        <Divider />

        <View style={styles.metaRows}>
          <MetaRow label="Report ID" value={report.id} mono />
          <MetaRow
            label="Submitted"
            value={new Date(report.submittedAt).toLocaleString()}
          />
          {report.isOfflineSubmission && (
            <MetaRow label="Sync" value="Submitted offline" />
          )}
        </View>
      </Card>

      {/* Notes */}
      {report.notes ? (
        <Card style={styles.section}>
          <Typography variant="overline" color={colors.textTertiary}>
            Notes
          </Typography>
          <Typography variant="body" color={colors.textPrimary} style={styles.notes}>
            {report.notes}
          </Typography>
        </Card>
      ) : null}

      {/* AI Verification */}
      <AIVerificationCard status={report.status} aiResult={report.aiResult} />
    </Screen>
  );
}

interface MetaRowProps {
  label: string;
  value: string;
  mono?: boolean;
}

function MetaRow({ label, value, mono }: MetaRowProps) {
  return (
    <View style={styles.metaRow}>
      <Typography variant="footnote" color={colors.textSecondary}>
        {label}
      </Typography>
      <Typography
        variant={mono ? 'mono' : 'subheadMedium'}
        color={colors.textPrimary}
        numberOfLines={1}
      >
        {value}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginTop: spacing[12],
  },
  metaCard: {
    marginBottom: spacing[4],
  },
  metaHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
  },
  metaRows: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  section: {
    marginBottom: spacing[4],
    gap: spacing[2],
  },
  notes: {
    marginTop: spacing[1],
  },
});
