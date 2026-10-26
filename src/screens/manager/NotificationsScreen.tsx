/**
 * NotificationsScreen (upgraded)
 *
 * Derives notifications from live report state.
 * Features:
 *  - Category tabs: All / AI Flags / Verified / Approved
 *  - Tap a notification to mark it read (opacity change)
 *  - "Mark all read" button
 *  - Ionicons icons (no emoji)
 *  - Unread count in header
 */
import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { EmptyState } from '../../components/layout/EmptyState';
import { Typography } from '../../components/ui/Typography';
import { useReports } from '../../hooks/useReports';
import { colors } from '../../theme/colors';
import { spacing, radii, borderWidths } from '../../theme/spacing';
import type { Report } from '../../types';

// ── Notification model ────────────────────────────────────────────────────────

type NotifCategory = 'flag' | 'verified' | 'approved' | 'offline';

interface NotificationItem {
  id: string;
  category: NotifCategory;
  title: string;
  body: string;
  time: string;
}

function reportToNotification(report: Report): NotificationItem | null {
  if (report.status === 'flagged' && report.aiResult) {
    const reported = report.aiResult.reportedStage.replace(/_/g, ' ');
    const detected = report.aiResult.detectedStage.replace(/_/g, ' ');
    return {
      id:       report.id,
      category: 'flag',
      title:    'AI Stage Mismatch',
      body:     `${report.submittedByName} reported "${reported}" but AI detected "${detected}" at ${report.siteName}.`,
      time:     report.submittedAt,
    };
  }
  if (report.status === 'verified' && report.aiResult) {
    return {
      id:       report.id,
      category: 'verified',
      title:    'Report Verified — Needs Review',
      body:     `${report.submittedByName} submitted a ${report.aiResult.confidenceScore}% confidence report at ${report.siteName}.`,
      time:     report.submittedAt,
    };
  }
  if (report.status === 'approved') {
    return {
      id:       `${report.id}-approved`,
      category: 'approved',
      title:    'Report Approved',
      body:     `${report.siteName} · ${report.submittedByName}'s report has been approved.`,
      time:     report.reviewedAt ?? report.submittedAt,
    };
  }
  if (report.isOfflineSubmission && report.status === 'verified') {
    return {
      id:       `${report.id}-offline`,
      category: 'offline',
      title:    'Offline Report Synced',
      body:     `${report.submittedByName}'s queued report from ${report.siteName} has synced and been verified.`,
      time:     report.submittedAt,
    };
  }
  return null;
}

// ── Config ────────────────────────────────────────────────────────────────────

interface CategoryConfig {
  icon:        React.ComponentProps<typeof Ionicons>['name'];
  color:       string;
  bg:          string;
  borderColor: string;
}

const CATEGORY_CONFIG: Record<NotifCategory, CategoryConfig> = {
  flag:     { icon: 'warning',            color: colors.warningText,  bg: colors.warningBg,  borderColor: colors.warningBorder  },
  verified: { icon: 'checkmark-circle',   color: colors.infoText,     bg: colors.infoBg,     borderColor: colors.infoBorder     },
  approved: { icon: 'shield-checkmark',   color: colors.successText,  bg: colors.successBg,  borderColor: colors.successBorder  },
  offline:  { icon: 'cloud-upload',       color: colors.textSecondary,bg: colors.bgSecondary,borderColor: colors.separator       },
};

// Category tabs
type TabKey = 'all' | NotifCategory;
const TABS: { key: TabKey; label: string }[] = [
  { key: 'all',      label: 'All' },
  { key: 'flag',     label: 'Flags' },
  { key: 'verified', label: 'Verified' },
  { key: 'approved', label: 'Approved' },
];

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min  = Math.floor(diff / 60_000);
  if (min < 1)   return 'Just now';
  if (min < 60)  return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24)   return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

// ── Screen ────────────────────────────────────────────────────────────────────

export function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { reports, loading, refresh } = useReports();

  const [tab, setTab]       = useState<TabKey>('all');
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const allNotifs = useMemo(() => (
    reports
      .map(reportToNotification)
      .filter((n): n is NotificationItem => n !== null)
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  ), [reports]);

  const displayed = tab === 'all' ? allNotifs : allNotifs.filter((n) => n.category === tab);
  const unread    = allNotifs.filter((n) => !readIds.has(n.id)).length;

  const markRead = (id: string) => {
    if (!readIds.has(id)) {
      Haptics.selectionAsync();
      setReadIds((prev) => new Set([...prev, id]));
    }
  };

  const markAllRead = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setReadIds(new Set(allNotifs.map((n) => n.id)));
  };

  return (
    <View style={styles.root}>
      {/* Sticky header */}
      <View style={[styles.stickyHeader, { paddingTop: insets.top + spacing[4] }]}>
        <View style={styles.headerRow}>
          <View>
            <Typography variant="title3" color={colors.textPrimary}>Alerts</Typography>
            {unread > 0 && (
              <Typography variant="footnote" color={colors.accent}>
                {unread} unread
              </Typography>
            )}
          </View>
          {unread > 0 && (
            <TouchableOpacity
              onPress={markAllRead}
              activeOpacity={0.75}
              style={styles.markAllBtn}
            >
              <Ionicons name="checkmark-done-outline" size={14} color={colors.accent} />
              <Typography variant="subheadMedium" color={colors.accent}>Mark all read</Typography>
            </TouchableOpacity>
          )}
        </View>

        {/* Category tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {TABS.map((t) => {
            const active = tab === t.key;
            const count  = t.key === 'all' ? allNotifs.length : allNotifs.filter((n) => n.category === t.key).length;
            return (
              <TouchableOpacity
                key={t.key}
                onPress={() => { Haptics.selectionAsync(); setTab(t.key); }}
                activeOpacity={0.75}
                style={[styles.tabChip, active && styles.tabChipActive]}
              >
                <Typography
                  variant="subheadMedium"
                  color={active ? colors.textInverse : colors.textSecondary}
                >
                  {t.label}
                </Typography>
                {count > 0 && (
                  <View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
                    <Typography
                      variant="overline"
                      color={active ? colors.accent : colors.textTertiary}
                    >
                      {count}
                    </Typography>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* List */}
      <ScrollView
        contentContainerStyle={[
          styles.listContent,
          displayed.length === 0 && styles.emptyContent,
        ]}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.accent} />
        }
        showsVerticalScrollIndicator={false}
      >
        {displayed.length === 0 ? (
          <EmptyState
            title="All clear"
            subtitle={tab === 'all'
              ? 'No alerts right now. Flags and verifications will appear here.'
              : 'No notifications in this category.'}
          />
        ) : (
          displayed.map((notif) => {
            const cfg  = CATEGORY_CONFIG[notif.category];
            const isRead = readIds.has(notif.id);
            return (
              <TouchableOpacity
                key={notif.id}
                onPress={() => markRead(notif.id)}
                activeOpacity={0.82}
                style={[
                  styles.notifCard,
                  { borderLeftColor: cfg.borderColor },
                  isRead && styles.notifCardRead,
                ]}
              >
                <View style={[styles.notifIconWrap, { backgroundColor: cfg.bg }]}>
                  <Ionicons name={cfg.icon} size={18} color={cfg.color} />
                </View>
                <View style={styles.notifBody}>
                  <View style={styles.notifTitleRow}>
                    <Typography
                      variant="subheadMedium"
                      color={isRead ? colors.textTertiary : colors.textPrimary}
                      numberOfLines={1}
                      style={styles.notifTitle}
                    >
                      {notif.title}
                    </Typography>
                    {!isRead && <View style={styles.unreadDot} />}
                  </View>
                  <Typography
                    variant="footnote"
                    color={isRead ? colors.textQuaternary : colors.textSecondary}
                    style={styles.notifText}
                    numberOfLines={2}
                  >
                    {notif.body}
                  </Typography>
                  <Typography variant="footnote" color={colors.textTertiary} style={styles.notifTime}>
                    {formatRelativeTime(notif.time)}
                  </Typography>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgSecondary,
  },

  // Sticky header
  stickyHeader: {
    backgroundColor: colors.bgSecondary,
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[3],
    gap: spacing[3],
    borderBottomWidth: borderWidths.hairline,
    borderBottomColor: colors.separator,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1] + 2,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    backgroundColor: colors.accentLight,
    borderRadius: radii.full,
  },

  // Tabs
  tabs: { gap: spacing[2], paddingBottom: spacing[1] },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: borderWidths.thin,
    borderColor: colors.separator,
  },
  tabChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  tabBadge: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radii.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 1,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  // List
  listContent: {
    padding: spacing[5],
    gap: spacing[3],
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  // Notification card
  notifCard: {
    flexDirection: 'row',
    gap: spacing[3],
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing[4],
    borderLeftWidth: 3,
    ...Platform.select({
      ios:     { shadowColor: '#1A1833', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  notifCardRead: {
    opacity: 0.55,
  },
  notifIconWrap: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  notifBody: { flex: 1, gap: spacing[1] },
  notifTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  notifTitle: { flex: 1 },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.accent,
    flexShrink: 0,
  },
  notifText: { lineHeight: 17 },
  notifTime: { marginTop: 2 },
});
