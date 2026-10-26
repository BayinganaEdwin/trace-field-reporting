/**
 * AIConfidenceScreen
 *
 * Full-page AI result drill-down — pushed from ReportDetailScreen when the
 * manager taps the AI Verification card.
 *
 * Sections:
 *  - Hero confidence gauge (arc-style View)
 *  - Stage comparison (Reported vs Detected)
 *  - Inference metadata (mode, model version, processed at)
 *  - AI text observations
 *  - Manager override — Approve / Reject with required comment
 *  - Confirmation sheet before committing
 */
import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../components/layout/Screen';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { StatusBadge } from '../../components/ui/Badge';
import { Typography } from '../../components/ui/Typography';
import { Divider } from '../../components/ui/Divider';
import { useReports } from '../../hooks/useReports';
import { getCurrentUserId } from '../../services/config';
import { colors } from '../../theme/colors';
import { spacing, radii, borderWidths } from '../../theme/spacing';
import { STAGE_LABELS } from '../../types';
import type { ManagerStackParamList } from '../../types';

type Props = NativeStackScreenProps<ManagerStackParamList, 'AIConfidence'>;

// ── Confidence gauge (visual arc via stacked Views) ───────────────────────────

function ConfidenceGauge({ value }: { value: number }) {
  const color =
    value >= 90 ? colors.successText :
    value >= 75 ? colors.warningText :
    colors.dangerText;

  const bg =
    value >= 90 ? colors.successBg :
    value >= 75 ? colors.warningBg :
    colors.dangerBg;

  const label =
    value >= 90 ? 'High confidence' :
    value >= 75 ? 'Moderate confidence' :
    'Low confidence';

  return (
    <View style={[styles.gauge, { backgroundColor: bg }]}>
      <View style={styles.gaugeInner}>
        <Typography variant="largeTitle" color={color}>
          {value}
        </Typography>
        <Typography variant="title3" color={color}>
          %
        </Typography>
      </View>
      <Typography variant="subheadMedium" color={color} style={styles.gaugeLabel}>
        {label}
      </Typography>
      <ProgressBar
        value={value}
        fillColor={
          value >= 90 ? '#10B981' :
          value >= 75 ? '#F59E0B' :
          '#EF4444'
        }
        style={styles.gaugeBar}
      />
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

type OverrideAction = 'approve' | 'reject';

export function AIConfidenceScreen({ route, navigation }: Props) {
  const { reportId } = route.params;
  const { getReport, approve, reject } = useReports();
  const insets = useSafeAreaInsets();

  const [comment, setComment]           = useState('');
  const [pendingAction, setPending]     = useState<OverrideAction | null>(null);
  const [actionLoading, setLoading]     = useState(false);
  const [confirmVisible, setConfirm]    = useState(false);
  const commentRef = useRef<TextInput>(null);

  const report = getReport(reportId);

  if (!report || !report.aiResult) {
    return (
      <Screen withTopInset={false}>
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      </Screen>
    );
  }

  const ai = report.aiResult;
  const canAct = report.status === 'verified' || report.status === 'flagged';

  const openConfirm = (action: OverrideAction) => {
    if (action === 'reject' && comment.trim().length === 0) {
      commentRef.current?.focus();
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPending(action);
    setConfirm(true);
  };

  const commitAction = async () => {
    if (!pendingAction) return;
    setConfirm(false);
    setLoading(true);
    try {
      if (pendingAction === 'approve') {
        await approve(report.id, getCurrentUserId());
      } else {
        await reject(report.id, getCurrentUserId(), comment.trim());
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
      setPending(null);
    }
  };

  const metaItems: { label: string; value: string }[] = [
    { label: 'Model',      value: `MobileNetV2 · ${ai.modelVersion}` },
    { label: 'Inference',  value: ai.inferenceMode === 'on_device' ? 'On-Device' : 'Server' },
    { label: 'Processed',  value: new Date(ai.processedAt).toLocaleString() },
    { label: 'Match',      value: ai.isMatch ? 'Yes — stages agree' : 'No — mismatch detected' },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing[8] },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Report context strip */}
        <View style={styles.contextStrip}>
          <StatusBadge status={report.status} />
          <Typography variant="footnote" color={colors.textTertiary}>
            {report.siteName} · {report.submittedByName}
          </Typography>
        </View>

        {/* Confidence gauge */}
        <ConfidenceGauge value={ai.confidenceScore} />

        {/* Stage comparison card */}
        <Card style={styles.card} padded={false}>
          <View style={styles.cardHeader}>
            <Ionicons name="git-compare-outline" size={16} color={colors.accent} />
            <Typography variant="subheadMedium" color={colors.textPrimary}>
              Stage Comparison
            </Typography>
          </View>
          <Divider />
          <View style={styles.compRow}>
            <View style={styles.compCell}>
              <Typography variant="overline" color={colors.textTertiary}>
                Reported by Worker
              </Typography>
              <Typography variant="headline" color={colors.textPrimary}>
                {STAGE_LABELS[ai.reportedStage]}
              </Typography>
            </View>
            <View style={styles.compDivider}>
              <Typography
                variant="title2"
                color={ai.isMatch ? colors.successText : colors.warningText}
              >
                {ai.isMatch ? '=' : '≠'}
              </Typography>
            </View>
            <View style={styles.compCell}>
              <Typography variant="overline" color={colors.textTertiary}>
                Detected by AI
              </Typography>
              <Typography
                variant="headline"
                color={ai.isMatch ? colors.textPrimary : colors.warningText}
              >
                {STAGE_LABELS[ai.detectedStage]}
              </Typography>
            </View>
          </View>
          <View
            style={[
              styles.verdictStrip,
              ai.isMatch ? styles.verdictMatch : styles.verdictMismatch,
            ]}
          >
            <Ionicons
              name={ai.isMatch ? 'checkmark-circle' : 'warning'}
              size={14}
              color={ai.isMatch ? colors.successText : colors.warningText}
            />
            <Typography
              variant="footnoteSemiBold"
              color={ai.isMatch ? colors.successText : colors.warningText}
            >
              {ai.isMatch
                ? `Stages confirmed — ${ai.confidenceScore}% confidence`
                : `Mismatch detected — manual review required`}
            </Typography>
          </View>
        </Card>

        {/* Inference metadata */}
        <Card style={styles.card} padded={false}>
          <View style={styles.cardHeader}>
            <Ionicons name="hardware-chip-outline" size={16} color={colors.accent} />
            <Typography variant="subheadMedium" color={colors.textPrimary}>
              Inference Details
            </Typography>
          </View>
          <Divider />
          {metaItems.map((item, i) => (
            <View key={item.label}>
              {i > 0 && <Divider style={styles.innerDivider} />}
              <View style={styles.metaRow}>
                <Typography variant="footnote" color={colors.textTertiary} style={styles.metaLabel}>
                  {item.label}
                </Typography>
                <Typography variant="footnote" color={colors.textPrimary}>
                  {item.value}
                </Typography>
              </View>
            </View>
          ))}
        </Card>

        {/* AI observations */}
        {ai.textFeedback ? (
          <Card style={styles.card}>
            <View style={styles.obsHeader}>
              <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.accent} />
              <Typography variant="subheadMedium" color={colors.textPrimary}>
                AI Observations
              </Typography>
            </View>
            <Typography variant="body" color={colors.textSecondary} style={styles.obsText}>
              {ai.textFeedback}
            </Typography>
          </Card>
        ) : null}

        {/* Override section */}
        {canAct ? (
          <Card style={styles.card}>
            <View style={styles.overrideHeader}>
              <Ionicons name="shield-checkmark-outline" size={16} color={colors.accent} />
              <Typography variant="subheadMedium" color={colors.textPrimary}>
                Manager Override
              </Typography>
            </View>
            <Typography variant="footnote" color={colors.textTertiary} style={styles.overrideNote}>
              Add a comment (required for rejection), then approve or reject this report.
            </Typography>

            <TextInput
              ref={commentRef}
              value={comment}
              onChangeText={setComment}
              placeholder="Reviewer comment (required to reject)…"
              placeholderTextColor={colors.textQuaternary}
              multiline
              style={styles.commentInput}
              returnKeyType="done"
              blurOnSubmit
            />

            <View style={styles.overrideActions}>
              <Button
                label="Approve"
                onPress={() => openConfirm('approve')}
                variant="primary"
                size="md"
                loading={actionLoading && pendingAction === 'approve'}
                disabled={actionLoading}
                style={styles.overrideBtn}
              />
              <Button
                label="Reject"
                onPress={() => openConfirm('reject')}
                variant="danger"
                size="md"
                loading={actionLoading && pendingAction === 'reject'}
                disabled={actionLoading || comment.trim().length === 0}
                style={styles.overrideBtn}
              />
            </View>
            {pendingAction === 'reject' && comment.trim().length === 0 && (
              <Typography variant="footnote" color={colors.dangerText} style={styles.commentError}>
                A comment is required before rejecting.
              </Typography>
            )}
          </Card>
        ) : (
          <View style={styles.resolvedChip}>
            <Ionicons
              name={report.status === 'approved' ? 'checkmark-circle' : 'close-circle'}
              size={14}
              color={report.status === 'approved' ? colors.successText : colors.dangerText}
            />
            <Typography
              variant="footnoteSemiBold"
              color={report.status === 'approved' ? colors.successText : colors.dangerText}
            >
              {report.status === 'approved' ? 'Approved' : 'Rejected'}
              {report.reviewedAt
                ? ` · ${new Date(report.reviewedAt).toLocaleDateString()}`
                : ''}
            </Typography>
          </View>
        )}
      </ScrollView>

      {/* Confirmation sheet */}
      <Modal
        visible={confirmVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setConfirm(false)}
      >
        <View style={styles.sheetBackdrop}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing[4] }]}>
            <View style={styles.sheetHandle} />
            <Typography variant="headline" color={colors.textPrimary} style={styles.sheetTitle}>
              {pendingAction === 'approve' ? 'Approve Report?' : 'Reject Report?'}
            </Typography>
            <Typography variant="body" color={colors.textSecondary} style={styles.sheetBody}>
              {pendingAction === 'approve'
                ? `You're confirming this report is accurate and the site is in the reported stage. This cannot be undone.`
                : `You're rejecting this report${comment.trim() ? ` with the note: "${comment.trim()}"` : ''}. The worker will be notified.`}
            </Typography>
            <View style={styles.sheetActions}>
              <Button
                label="Cancel"
                onPress={() => setConfirm(false)}
                variant="secondary"
                size="lg"
                style={styles.sheetBtn}
              />
              <Button
                label={pendingAction === 'approve' ? 'Approve' : 'Reject'}
                onPress={commitAction}
                variant={pendingAction === 'approve' ? 'primary' : 'danger'}
                size="lg"
                style={styles.sheetBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1, backgroundColor: colors.bgSecondary },
  content: {
    padding: spacing[5],
    gap: spacing[4],
  },
  loader: { marginTop: spacing[12] },

  contextStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[1],
  },

  // ── Gauge ──────────────────────────────────────────────────────
  gauge: {
    borderRadius: radii['2xl'],
    padding: spacing[6],
    alignItems: 'center',
    gap: spacing[2],
  },
  gaugeInner: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing[1],
  },
  gaugeLabel: { marginTop: spacing[1] },
  gaugeBar: { width: '100%', marginTop: spacing[2] },

  // ── Cards ──────────────────────────────────────────────────────
  card: { paddingHorizontal: 0, paddingVertical: 0, overflow: 'hidden' },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2] + 2,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
  },

  // Stage comparison
  compRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    gap: spacing[3],
  },
  compCell: { flex: 1, gap: 4 },
  compDivider: {
    width: 32,
    alignItems: 'center',
  },
  verdictStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  verdictMatch: { backgroundColor: colors.successBg },
  verdictMismatch: { backgroundColor: colors.warningBg },

  // Meta rows
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  metaLabel: { flex: 1, marginRight: spacing[3] },
  innerDivider: { marginVertical: 0 },

  // Observations
  obsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2] + 2,
    marginBottom: spacing[3],
  },
  obsText: { lineHeight: 22 },

  // Override
  overrideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2] + 2,
    marginBottom: spacing[2],
  },
  overrideNote: {
    marginBottom: spacing[3],
    lineHeight: 18,
  },
  commentInput: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radii.md,
    borderWidth: borderWidths.thin,
    borderColor: colors.separator,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    color: colors.textPrimary,
    minHeight: 72,
    textAlignVertical: 'top',
    marginBottom: spacing[3],
  },
  overrideActions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  overrideBtn: { flex: 1 },
  commentError: {
    marginTop: spacing[2],
  },

  // Resolved chip
  resolvedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    alignSelf: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: colors.bgSecondary,
    borderRadius: radii.full,
    borderWidth: borderWidths.thin,
    borderColor: colors.separator,
  },

  // Confirmation sheet
  sheetBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii['2xl'],
    borderTopRightRadius: radii['2xl'],
    padding: spacing[6],
    gap: spacing[4],
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.separator,
    alignSelf: 'center',
    marginBottom: spacing[2],
  },
  sheetTitle: { textAlign: 'center' },
  sheetBody: { textAlign: 'center', lineHeight: 22 },
  sheetActions: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[2],
  },
  sheetBtn: { flex: 1 },
});
