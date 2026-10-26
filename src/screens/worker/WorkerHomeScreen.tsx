import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/layout/Screen';
import { SectionHeader } from '../../components/layout/SectionHeader';
import { SitePickerBanner } from '../../components/layout/SitePickerBanner';
import { EmptyState } from '../../components/layout/EmptyState';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Typography } from '../../components/ui/Typography';
import { Avatar } from '../../components/ui/Avatar';
import { useReports } from '../../hooks/useReports';
import { getCurrentUserName } from '../../services/config';
import { colors } from '../../theme/colors';
import { spacing, radii, borderWidths } from '../../theme/spacing';
import { STAGE_LABELS } from '../../types';
import type { WorkerStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<WorkerStackParamList>;

// ── Offline sync hook ─────────────────────────────────────────────────────────

function useOfflineSync() {
  const [isOffline, setIsOffline] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [isSyncing, setSyncing] = useState(false);
  const syncAnim = useRef(new Animated.Value(0)).current;

  const toggleOffline = () => {
    Haptics.selectionAsync();
    if (!isOffline) {
      // Going offline — seed the queue with 2 reports for the demo
      setIsOffline(true);
      setQueueCount(2);
    } else {
      setIsOffline(false);
      setQueueCount(0);
      setSyncing(false);
    }
  };

  // Spin animation for syncing icon
  useEffect(() => {
    if (isSyncing) {
      Animated.loop(
        Animated.timing(syncAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ).start();
    } else {
      syncAnim.stopAnimation();
      syncAnim.setValue(0);
    }
  }, [isSyncing, syncAnim]);

  const sync = () => {
    if (queueCount === 0 || isSyncing) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSyncing(true);
    // Drain the queue in steps
    const interval = setInterval(() => {
      setQueueCount((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setSyncing(false);
          setIsOffline(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          return 0;
        }
        return prev - 1;
      });
    }, 1200);
  };

  const spin = syncAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return { isOffline, queueCount, isSyncing, sync, toggleOffline, spin };
}

// ── Screen ────────────────────────────────────────────────────────────────────

export function WorkerHomeScreen() {
  const navigation = useNavigation<Nav>();
  const { reports, activeSite, loading, refresh } = useReports();
  const offline = useOfflineSync();

  const userName = getCurrentUserName();
  const mySite = activeSite;
  // reports is already scoped to this worker by useReports (scopeReports)
  const myReports = reports.slice(0, 3);

  const pendingCount = myReports.filter(
    (r) => r.status === 'uploading' || r.status === 'pending',
  ).length;

  return (
    <Screen onRefresh={refresh} refreshing={loading}>
      {/* Offline sync banner ──────────────────────────────────── */}
      {(offline.isOffline || offline.queueCount > 0) && (
        <View style={styles.syncBanner}>
          <Animated.View style={{ transform: [{ rotate: offline.spin }] }}>
            <Ionicons
              name={offline.isSyncing ? 'sync-outline' : 'cloud-offline-outline'}
              size={16}
              color={offline.isSyncing ? colors.accent : colors.warningText}
            />
          </Animated.View>
          <View style={styles.syncBannerText}>
            <Typography
              variant="subheadMedium"
              color={offline.isSyncing ? colors.accent : colors.warningText}
            >
              {offline.isSyncing
                ? `Syncing… ${offline.queueCount} left`
                : `${offline.queueCount} report${offline.queueCount !== 1 ? 's' : ''} queued`}
            </Typography>
            <Typography variant="footnote" color={colors.textTertiary}>
              {offline.isSyncing ? 'Uploading to cloud' : 'Waiting for connection'}
            </Typography>
          </View>
          {!offline.isSyncing && (
            <TouchableOpacity
              onPress={offline.sync}
              activeOpacity={0.75}
              style={styles.syncNowBtn}
            >
              <Ionicons name="cloud-upload-outline" size={14} color={colors.textInverse} />
              <Typography variant="subheadMedium" color={colors.textInverse}>
                Sync now
              </Typography>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Greeting ──────────────────────────────────────────────── */}
      <View style={styles.greeting}>
        <Avatar name={userName} size={40} />
        <View style={styles.greetingText}>
          <Typography variant="headline" color={colors.textPrimary}>
            {userName.split(' ')[0]}
          </Typography>
          <Typography variant="footnote" color={colors.textTertiary}>
            Site Worker
          </Typography>
        </View>
        {/* Demo toggle: simulate going offline */}
        <TouchableOpacity
          onPress={offline.toggleOffline}
          activeOpacity={0.75}
          style={[
            styles.wifiBtn,
            offline.isOffline && styles.wifiBtnOffline,
          ]}
        >
          <Ionicons
            name={offline.isOffline ? 'wifi-outline' : 'wifi'}
            size={16}
            color={offline.isOffline ? colors.warningText : colors.accent}
          />
        </TouchableOpacity>
      </View>

      {/* Site selector ─────────────────────────────────────────── */}
      <SitePickerBanner style={styles.sitePicker} />

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
  // ── Sync banner ──────────────────────────────────────────────
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.warningBg,
    borderRadius: radii.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    marginBottom: spacing[4],
    borderWidth: borderWidths.thin,
    borderColor: colors.warningBorder,
  },
  syncBannerText: { flex: 1, gap: 1 },
  syncNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1] + 2,
    backgroundColor: colors.accent,
    borderRadius: radii.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },

  greeting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[5],
  },
  greetingText: { gap: 1, flex: 1 },

  // ── Wifi demo toggle ─────────────────────────────────────────
  wifiBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wifiBtnOffline: {
    backgroundColor: colors.warningBg,
  },

  // ── Site picker ───────────────────────────────────────────────
  sitePicker: {
    marginBottom: spacing[4],
  },

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
