import React, { useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../components/layout/Screen';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Typography } from '../../components/ui/Typography';
import { Divider } from '../../components/ui/Divider';
import { AIVerificationCard } from '../../components/report/AIVerificationCard';
import { useReports } from '../../hooks/useReports';
import { MOCK_MANAGER } from '../../data/mockData';
import { colors } from '../../theme/colors';
import { spacing, borderWidths } from '../../theme/spacing';
import { STAGE_LABELS } from '../../types';
import type { ManagerStackParamList } from '../../types';

type Props = NativeStackScreenProps<ManagerStackParamList, 'ReportDetail'>;

export function ReportDetailScreen({ route, navigation }: Props) {
  const { reportId } = route.params;
  const { getReport, approve, flag, loading } = useReports();
  const [actionLoading, setActionLoading] = useState<'approve' | 'flag' | null>(null);

  const report = getReport(reportId);

  if (loading || !report) {
    return (
      <Screen withTopInset={false}>
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      </Screen>
    );
  }

  const canAct = report.status === 'verified' || report.status === 'flagged';

  const handleApprove = async () => {
    setActionLoading('approve');
    try {
      await approve(report.id, MOCK_MANAGER.id);
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Could not approve report.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleFlag = async () => {
    Alert.alert(
      'Flag Report',
      'This will mark the report as flagged and notify the site worker.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Flag',
          style: 'destructive',
          onPress: async () => {
            setActionLoading('flag');
            try {
              await flag(report.id, MOCK_MANAGER.id);
              navigation.goBack();
            } catch {
              Alert.alert('Error', 'Could not flag report.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ],
    );
  };

  return (
    <Screen withTopInset={false}>
      {/* Worker + Status */}
      <Card style={styles.headerCard} padded={false}>
        <View style={styles.workerRow}>
          <Avatar name={report.submittedByName} size={40} />
          <View style={styles.workerMeta}>
            <Typography variant="subheadMedium" color={colors.textPrimary}>
              {report.submittedByName}
            </Typography>
            <Typography variant="footnote" color={colors.textSecondary}>
              {report.siteName} · {new Date(report.submittedAt).toLocaleString()}
            </Typography>
          </View>
          <StatusBadge status={report.status} />
        </View>

        <Divider />

        <View style={styles.stageRow}>
          <Typography variant="overline" color={colors.textTertiary}>Reported Stage</Typography>
          <Typography variant="headline" color={colors.textPrimary}>
            {STAGE_LABELS[report.reportedStage]}
          </Typography>
        </View>

        {report.notes ? (
          <>
            <Divider />
            <View style={styles.notesRow}>
              <Typography variant="overline" color={colors.textTertiary}>Notes</Typography>
              <Typography variant="body" color={colors.textPrimary} style={styles.notesText}>
                {report.notes}
              </Typography>
            </View>
          </>
        ) : null}

        <View style={styles.metaFooter}>
          <MetaChip label="ID" value={report.id} />
          {report.isOfflineSubmission && <MetaChip label="Source" value="Offline" />}
          {report.reviewedAt && (
            <MetaChip
              label="Reviewed"
              value={new Date(report.reviewedAt).toLocaleDateString()}
            />
          )}
        </View>
      </Card>

      {/* AI Verification */}
      <AIVerificationCard status={report.status} aiResult={report.aiResult} />

      {/* Action buttons */}
      {canAct && (
        <View style={styles.actions}>
          <Button
            label="Approve"
            onPress={handleApprove}
            variant="primary"
            size="lg"
            loading={actionLoading === 'approve'}
            disabled={actionLoading !== null}
            style={styles.actionBtn}
          />
          <Button
            label="Flag Issue"
            onPress={handleFlag}
            variant="danger"
            size="lg"
            loading={actionLoading === 'flag'}
            disabled={actionLoading !== null}
            style={styles.actionBtn}
          />
        </View>
      )}

      {!canAct && (
        <View style={styles.resolvedNotice}>
          <Typography variant="footnote" color={colors.textSecondary} align="center">
            This report has been{' '}
            <Typography variant="footnoteSemiBold" color={colors.textPrimary}>
              {report.status}
            </Typography>
            {report.reviewedAt
              ? ` on ${new Date(report.reviewedAt).toLocaleDateString()}`
              : ''}
            .
          </Typography>
        </View>
      )}
    </Screen>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaChip}>
      <Typography variant="overline" color={colors.textTertiary}>{label}</Typography>
      <Typography variant="mono" color={colors.textPrimary} numberOfLines={1}>
        {value}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginTop: spacing[12],
  },
  headerCard: {
    marginBottom: spacing[4],
  },
  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
  },
  workerMeta: { flex: 1 },
  stageRow: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: 3,
  },
  notesRow: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: 4,
  },
  notesText: {
    marginTop: spacing[1],
  },
  metaFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderTopWidth: borderWidths.thin,
    borderTopColor: colors.separator,
  },
  metaChip: {
    gap: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[4],
  },
  actionBtn: {
    flex: 1,
  },
  resolvedNotice: {
    marginTop: spacing[4],
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[5],
    backgroundColor: colors.bgSecondary,
    borderRadius: 10,
    borderWidth: borderWidths.thin,
    borderColor: colors.separator,
  },
});
