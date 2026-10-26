import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
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
import { getCurrentUserId } from '../../services/config';
import { colors } from '../../theme/colors';
import { spacing, radii, borderWidths } from '../../theme/spacing';
import { STAGE_LABELS } from '../../types';
import type { ManagerStackParamList } from '../../types';

type Props = NativeStackScreenProps<ManagerStackParamList, 'ReportDetail'>;

export function ReportDetailScreen({ route, navigation }: Props) {
  const { reportId } = route.params;
  const { getReport, approve, reject, loading } = useReports();
  const [actionLoading, setActionLoading]     = useState<'approve' | 'reject' | null>(null);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [confirmVisible, setConfirmVisible]   = useState(false);
  const [pendingAction, setPendingAction]     = useState<'approve' | 'reject' | null>(null);
  const [comment, setComment]                 = useState('');
  const commentRef = useRef<TextInput>(null);

  const report = getReport(reportId);

  if (loading || !report) {
    return (
      <Screen withTopInset={false}>
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      </Screen>
    );
  }

  // pending = no photo submitted (AI won't run) — managers can still act on it
  const canAct = ['verified', 'flagged', 'pending'].includes(report.status);

  const openConfirm = (action: 'approve' | 'reject') => {
    if (action === 'reject' && comment.trim().length === 0) {
      commentRef.current?.focus();
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPendingAction(action);
    setConfirmVisible(true);
  };

  const commitAction = async () => {
    if (!pendingAction) return;
    setConfirmVisible(false);
    setActionLoading(pendingAction);
    try {
      if (pendingAction === 'approve') {
        await approve(report.id, getCurrentUserId());
      } else {
        await reject(report.id, getCurrentUserId(), comment.trim());
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch {
      Alert.alert('Error', `Could not ${pendingAction} report.`);
    } finally {
      setActionLoading(null);
      setPendingAction(null);
    }
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

        {/* Site Photo */}
        {report.photoUri ? (
          <>
            <Divider />
            <View style={styles.photoSection}>
              <Typography variant="overline" color={colors.textTertiary} style={styles.photoLabel}>
                Site Photo
              </Typography>
              <TouchableOpacity
                onPress={() => setPhotoModalVisible(true)}
                activeOpacity={0.88}
                style={styles.photoThumbnailWrap}
              >
                <Image
                  source={{ uri: report.photoUri }}
                  style={styles.photoThumbnail}
                  resizeMode="cover"
                />
                <View style={styles.photoExpandBtn}>
                  <Ionicons name="expand-outline" size={14} color={colors.textInverse} />
                </View>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Divider />
            <View style={styles.noPhotoRow}>
              <Ionicons name="image-outline" size={16} color={colors.textQuaternary} />
              <Typography variant="footnote" color={colors.textQuaternary}>
                No photo attached
              </Typography>
            </View>
          </>
        )}

        {/* Geolocation */}
        {report.geoLocation ? (
          <>
            <Divider />
            <View style={styles.geoRow}>
              <View style={styles.geoLeft}>
                <Ionicons
                  name={report.geoLocation.isOnSite ? 'location' : 'location-outline'}
                  size={14}
                  color={report.geoLocation.isOnSite ? colors.successText : colors.warningText}
                />
                <Typography
                  variant="footnote"
                  color={report.geoLocation.isOnSite ? colors.successText : colors.warningText}
                >
                  {report.geoLocation.isOnSite
                    ? `On-site — ${report.geoLocation.distanceFromSite}m from registered coords`
                    : `Off-site — ${report.geoLocation.distanceFromSite}m from registered coords`}
                </Typography>
              </View>
              <Typography variant="mono" color={colors.textTertiary} style={styles.coordsText}>
                {report.geoLocation.lat.toFixed(4)}, {report.geoLocation.lng.toFixed(4)}
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

      {/* AI Verification — tap to drill down */}
      <TouchableOpacity
        onPress={() =>
          report.aiResult
            ? navigation.navigate('AIConfidence', { reportId: report.id })
            : undefined
        }
        activeOpacity={report.aiResult ? 0.88 : 1}
        disabled={!report.aiResult}
      >
        <AIVerificationCard status={report.status} aiResult={report.aiResult} hasPhoto={!!report.photoUri} />
        {report.aiResult && (
          <View style={styles.drillDownHint}>
            <Ionicons name="analytics-outline" size={12} color={colors.accent} />
            <Typography variant="footnote" color={colors.accent}>
              Tap for full AI analysis
            </Typography>
            <Ionicons name="chevron-forward" size={12} color={colors.accent} />
          </View>
        )}
      </TouchableOpacity>

      {/* Approval workflow */}
      {canAct && (
        <Card style={styles.approvalCard}>
          {/* Section label */}
          <View style={styles.approvalHeader}>
            <Ionicons name="shield-checkmark-outline" size={14} color={colors.textTertiary} />
            <Typography variant="overline" color={colors.textTertiary} style={styles.approvalLabel}>
              MANAGER DECISION
            </Typography>
          </View>

          <Divider style={styles.approvalDivider} />

          <View style={styles.approvalBody}>
            <TextInput
              ref={commentRef}
              value={comment}
              onChangeText={setComment}
              placeholder="Add a comment (required to reject)…"
              placeholderTextColor={colors.textQuaternary}
              multiline
              style={styles.commentInput}
              returnKeyType="done"
              blurOnSubmit
            />

            {comment.trim().length === 0 && (
              <Typography variant="overline" color={colors.textQuaternary} style={styles.commentHint}>
                A comment is required before you can reject
              </Typography>
            )}

            <View style={styles.actions}>
              <Button
                label="Approve"
                onPress={() => openConfirm('approve')}
                variant="primary"
                size="lg"
                loading={actionLoading === 'approve'}
                disabled={actionLoading !== null}
                style={styles.actionBtn}
              />
              <Button
                label="Reject"
                onPress={() => openConfirm('reject')}
                variant="danger"
                size="lg"
                loading={actionLoading === 'reject'}
                disabled={actionLoading !== null || comment.trim().length === 0}
                style={styles.actionBtn}
              />
            </View>
          </View>
        </Card>
      )}

      {/* Audit trail chip */}
      {!canAct && report.reviewedAt && (
        <View style={[
          styles.auditChip,
          report.status === 'approved' ? styles.auditApproved : styles.auditRejected,
        ]}>
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
            {' · '}
            {new Date(report.reviewedAt).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric',
            })}
          </Typography>
        </View>
      )}

      {!canAct && !report.reviewedAt && (
        <View style={styles.resolvedNotice}>
          <Typography variant="footnote" color={colors.textSecondary} align="center">
            This report has been{' '}
            <Typography variant="footnoteSemiBold" color={colors.textPrimary}>
              {report.status}
            </Typography>
            .
          </Typography>
        </View>
      )}

      {/* Confirmation sheet */}
      <Modal
        visible={confirmVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View style={styles.sheetBackdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Typography variant="headline" color={colors.textPrimary} style={styles.sheetTitle}>
              {pendingAction === 'approve' ? 'Approve Report?' : 'Reject Report?'}
            </Typography>
            <Typography variant="body" color={colors.textSecondary} style={styles.sheetBody}>
              {pendingAction === 'approve'
                ? "You're confirming this report is accurate. This action cannot be undone."
                : `You're rejecting this report${comment.trim() ? ` with note: "${comment.trim()}"` : ''}. The worker will be notified.`}
            </Typography>
            <View style={styles.sheetActions}>
              <Button
                label="Cancel"
                onPress={() => setConfirmVisible(false)}
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

      {/* Full-screen photo modal */}
      {report.photoUri ? (
        <Modal
          visible={photoModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setPhotoModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setPhotoModalVisible(false)}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={22} color={colors.textInverse} />
            </TouchableOpacity>
            <Image
              source={{ uri: report.photoUri }}
              style={styles.modalImage}
              resizeMode="contain"
            />
            <View style={styles.modalCaption}>
              <Typography variant="footnote" color="rgba(255,255,255,0.75)" align="center">
                {report.siteName} · {STAGE_LABELS[report.reportedStage]}
              </Typography>
            </View>
          </View>
        </Modal>
      ) : null}
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
  approvalCard: {
    marginTop: spacing[4],
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  approvalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
  },
  approvalLabel: {
    letterSpacing: 0.8,
  },
  approvalDivider: {
    marginVertical: 0,
  },
  approvalBody: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[5],
    gap: spacing[3],
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
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  actionBtn: { flex: 1 },
  commentHint: {
    textAlign: 'center',
  },
  auditChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    alignSelf: 'center',
    marginTop: spacing[4],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radii.full,
    borderWidth: borderWidths.thin,
  },
  auditApproved: {
    backgroundColor: colors.successBg,
    borderColor: colors.successBorder,
  },
  auditRejected: {
    backgroundColor: colors.dangerBg,
    borderColor: colors.dangerBorder,
  },
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
    paddingBottom: spacing[8],
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
  drillDownHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1] + 2,
    marginTop: spacing[1],
    marginBottom: spacing[2],
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

  // ── Photo section ────────────────────────────────────────────
  photoSection: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[2],
  },
  photoLabel: {
    letterSpacing: 0.8,
  },
  photoThumbnailWrap: {
    borderRadius: radii.md,
    overflow: 'hidden',
    position: 'relative',
  },
  photoThumbnail: {
    width: '100%',
    height: 200,
    backgroundColor: colors.bgSecondary,
  },
  photoExpandBtn: {
    position: 'absolute',
    bottom: spacing[3],
    right: spacing[3],
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noPhotoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },

  // ── Geo row ──────────────────────────────────────────────────
  geoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[2],
  },
  geoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1] + 2,
    flex: 1,
  },
  coordsText: {
    fontSize: 10,
  },

  // ── Photo modal ──────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 56,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  modalImage: {
    width: '100%',
    height: '70%',
  },
  modalCaption: {
    position: 'absolute',
    bottom: 60,
    left: spacing[4],
    right: spacing[4],
  },
});
