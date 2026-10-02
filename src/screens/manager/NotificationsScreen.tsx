import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Screen } from '../../components/layout/Screen';
import { Card } from '../../components/ui/Card';
import { Typography } from '../../components/ui/Typography';
import { Divider } from '../../components/ui/Divider';
import { EmptyState } from '../../components/layout/EmptyState';
import { useReports } from '../../hooks/useReports';
import { colors } from '../../theme/colors';
import { spacing, radii } from '../../theme/spacing';
import type { Report } from '../../types';

interface NotificationItem {
  id: string;
  type: 'flag' | 'verified' | 'approved' | 'offline';
  title: string;
  body: string;
  time: string;
  read: boolean;
}

function reportToNotification(report: Report): NotificationItem | null {
  if (report.status === 'flagged' && report.aiResult) {
    return {
      id:    report.id,
      type:  'flag',
      title: 'AI Stage Mismatch Detected',
      body:  `${report.submittedByName} reported "${report.aiResult.reportedStage.replace(/_/g, ' ')}" but AI detected "${report.aiResult.detectedStage.replace(/_/g, ' ')}" at ${report.siteName}.`,
      time:  report.submittedAt,
      read:  false,
    };
  }
  if (report.status === 'verified' && report.aiResult) {
    return {
      id:    report.id,
      type:  'verified',
      title: 'Report Verified — Awaiting Your Review',
      body:  `${report.submittedByName} submitted a verified report at ${report.siteName}. Confidence: ${report.aiResult.confidenceScore}%.`,
      time:  report.submittedAt,
      read:  report.aiResult.confidenceScore >= 90,
    };
  }
  if (report.isOfflineSubmission && report.status === 'verified') {
    return {
      id:    `${report.id}-offline`,
      type:  'offline',
      title: 'Offline Report Synced',
      body:  `${report.submittedByName}'s offline report from ${report.siteName} has synced and been verified.`,
      time:  report.submittedAt,
      read:  true,
    };
  }
  return null;
}

const TYPE_CONFIG = {
  flag:     { color: colors.warningText,  bg: colors.warningBg,  icon: '⚠' },
  verified: { color: colors.infoText,     bg: colors.infoBg,     icon: '✓' },
  approved: { color: colors.successText,  bg: colors.successBg,  icon: '✔' },
  offline:  { color: colors.textSecondary,bg: colors.bgSecondary,icon: '⟳' },
};

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min  = Math.floor(diff / 60_000);
  if (min < 60)  return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24)   return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export function NotificationsScreen() {
  const { reports, loading, refresh } = useReports();

  const notifications = reports
    .map(reportToNotification)
    .filter((n): n is NotificationItem => n !== null)
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Screen onRefresh={refresh} refreshing={loading}>
      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <Typography variant="subheadMedium" color={colors.accent}>
            {unreadCount} unread alert{unreadCount > 1 ? 's' : ''}
          </Typography>
        </View>
      )}

      {notifications.length === 0 ? (
        <EmptyState
          title="All clear"
          subtitle="No alerts right now. New flags and verifications will appear here."
        />
      ) : (
        notifications.map((notif, idx) => {
          const cfg = TYPE_CONFIG[notif.type];
          return (
            <Card key={notif.id} padded={false} style={styles.notifCard}>
              <View style={styles.notifRow}>
                <View style={[styles.notifIcon, { backgroundColor: cfg.bg }]}>
                  <Typography variant="headline" color={cfg.color}>
                    {cfg.icon}
                  </Typography>
                </View>
                <View style={styles.notifBody}>
                  <View style={styles.notifHeader}>
                    <Typography
                      variant="subheadMedium"
                      color={colors.textPrimary}
                      numberOfLines={1}
                      style={styles.notifTitle}
                    >
                      {notif.title}
                    </Typography>
                    {!notif.read && <View style={styles.unreadDot} />}
                  </View>
                  <Typography variant="footnote" color={colors.textSecondary} style={styles.notifText}>
                    {notif.body}
                  </Typography>
                  <Typography variant="footnote" color={colors.textTertiary} style={styles.notifTime}>
                    {formatRelativeTime(notif.time)}
                  </Typography>
                </View>
              </View>
            </Card>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  unreadBanner: {
    backgroundColor: colors.accentLight,
    borderRadius: radii.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    marginBottom: spacing[4],
  },
  notifCard: {
    marginBottom: spacing[3],
  },
  notifRow: {
    flexDirection: 'row',
    gap: spacing[3],
    padding: spacing[4],
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  notifBody: {
    flex: 1,
    gap: spacing[1],
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  notifTitle: {
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  notifText: {
    lineHeight: 18,
  },
  notifTime: {
    marginTop: 2,
  },
});
