import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, Image, TouchableOpacity, Modal } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../components/layout/Screen';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { Typography } from '../../components/ui/Typography';
import { Divider } from '../../components/ui/Divider';
import { AIVerificationCard } from '../../components/report/AIVerificationCard';
import { useReports } from '../../hooks/useReports';
import { colors } from '../../theme/colors';
import { spacing, radii } from '../../theme/spacing';
import { STAGE_LABELS } from '../../types';
import type { WorkerStackParamList } from '../../types';

type Props = NativeStackScreenProps<WorkerStackParamList, 'WorkerReportDetail'>;

export function WorkerReportDetailScreen({ route, navigation }: Props) {
  const { reportId } = route.params;
  const { getReport, deleteReport, loading } = useReports();
  const report = getReport(reportId);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canDelete = report && !['approved', 'rejected'].includes(report.status);

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Delete Report',
      'Are you sure you want to delete this report? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteReport(reportId);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              navigation.goBack();
            } catch {
              Alert.alert('Error', 'Could not delete report. Please try again.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

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

      {/* Photo */}
      {report.photoUri ? (
        <TouchableOpacity
          onPress={() => setPhotoModalVisible(true)}
          activeOpacity={0.88}
          style={styles.photoWrap}
        >
          <Image
            source={{ uri: report.photoUri }}
            style={styles.photo}
            resizeMode="cover"
          />
          <View style={styles.photoOverlay}>
            <Ionicons name="expand-outline" size={14} color={colors.textInverse} />
            <Typography variant="overline" color={colors.textInverse}>
              View Photo
            </Typography>
          </View>
        </TouchableOpacity>
      ) : null}

      {/* Geo */}
      {report.geoLocation ? (
        <Card style={styles.geoCard}>
          <View style={styles.geoRow}>
            <Ionicons
              name={report.geoLocation.isOnSite ? 'location' : 'location-outline'}
              size={16}
              color={report.geoLocation.isOnSite ? colors.successText : colors.warningText}
            />
            <View style={styles.geoText}>
              <Typography
                variant="subheadMedium"
                color={report.geoLocation.isOnSite ? colors.successText : colors.warningText}
              >
                {report.geoLocation.isOnSite ? 'Location verified on-site' : 'Location is off-site'}
              </Typography>
              <Typography variant="footnote" color={colors.textTertiary}>
                {report.geoLocation.distanceFromSite}m from registered site · {report.geoLocation.lat.toFixed(4)}, {report.geoLocation.lng.toFixed(4)}
              </Typography>
            </View>
          </View>
        </Card>
      ) : null}

      {/* AI Verification */}
      <AIVerificationCard
        status={report.status}
        aiResult={report.aiResult}
        hasPhoto={!!report.photoUri}
      />

      {/* Delete report — only available before a manager has made a final decision */}
      {canDelete && (
        <Button
          label="Delete Report"
          onPress={handleDelete}
          variant="danger"
          size="lg"
          loading={deleting}
          style={styles.deleteBtn}
        />
      )}

      {/* Photo modal */}
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
          </View>
        </Modal>
      ) : null}
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
  photoWrap: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    marginBottom: spacing[4],
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: 200,
    backgroundColor: colors.bgSecondary,
  },
  photoOverlay: {
    position: 'absolute',
    bottom: spacing[3],
    right: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1] + 2,
    borderRadius: radii.full,
  },
  geoCard: {
    marginBottom: spacing[4],
  },
  geoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  geoText: {
    flex: 1,
    gap: 2,
  },
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
  deleteBtn: {
    marginTop: spacing[6],
  },
});
