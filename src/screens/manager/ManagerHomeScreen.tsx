import React from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/layout/Screen';
import { SitePickerBanner } from '../../components/layout/SitePickerBanner';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Typography } from '../../components/ui/Typography';
import { Avatar } from '../../components/ui/Avatar';
import { StatusBadge } from '../../components/ui/Badge';
import { useReports } from '../../hooks/useReports';
import { getCurrentUserName } from '../../services/config';
import { colors } from '../../theme/colors';
import { spacing, radii } from '../../theme/spacing';
import { STAGE_LABELS } from '../../types';
import type { ReportStatus, ManagerStackParamList, Site } from '../../types';

type Nav = NativeStackNavigationProp<ManagerStackParamList>;

const STATUSES_NEEDING_REVIEW: ReportStatus[] = ['verified', 'flagged'];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) return 'No activity yet';
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1)  return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24)  return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7)  return `${diffDay}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// ── Stat tile ─────────────────────────────────────────────────────────────────

interface StatTileProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: number | string;
  label: string;
  tint: string;
  textColor: string;
  onPress?: () => void;
}

function StatTile({ icon, value, label, tint: _tint, textColor, onPress }: StatTileProps) {
  return (
    <TouchableOpacity
      style={styles.statTile}
      activeOpacity={onPress ? 0.75 : 1}
      onPress={onPress}
    >
      <View style={[styles.statIconWrap, { backgroundColor: textColor + '14' }]}>
        <Ionicons name={icon} size={15} color={textColor} />
      </View>
      <Typography variant="title2" color={colors.textPrimary} style={styles.statValue}>
        {value}
      </Typography>
      <Typography variant="footnote" color={colors.textSecondary} style={styles.statLabel} numberOfLines={1}>
        {label}
      </Typography>
    </TouchableOpacity>
  );
}

// ── Site card ─────────────────────────────────────────────────────────────────

interface SiteCardProps {
  site: Site;
  pendingCount: number;
  flaggedCount: number;
  onPress: () => void;
}

function SiteCard({ site, pendingCount, flaggedCount, onPress }: SiteCardProps) {
  const urgentCount = pendingCount + flaggedCount;
  const stageLabel = STAGE_LABELS[site.currentStage] ?? site.currentStage;

  const progressColor =
    site.progressPercent >= 75 ? '#10B981' :
    site.progressPercent >= 40 ? '#F59E0B' :
    colors.accentMid;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.82} style={styles.siteCardOuter}>
      <Card style={styles.siteCard} padded={false}>
        {/* Accent strip — colour-coded by urgency */}
        <View style={[
          styles.siteAccentStrip,
          { backgroundColor: flaggedCount > 0 ? colors.warningText : colors.accent },
        ]} />

        <View style={styles.siteCardInner}>
          {/* Top row */}
          <View style={styles.siteTop}>
            <View style={styles.siteMeta}>
              <Typography variant="subheadMedium" color={colors.textPrimary} numberOfLines={1}>
                {site.name}
              </Typography>
              <Typography variant="footnote" color={colors.textTertiary} numberOfLines={1}>
                {site.location}
              </Typography>
            </View>
            <View style={styles.siteProgress}>
              <Typography variant="title3" color={progressColor}>
                {site.progressPercent}%
              </Typography>
              <Ionicons name="chevron-forward" size={14} color={colors.textQuaternary} />
            </View>
          </View>

          {/* Progress bar */}
          <ProgressBar
            value={site.progressPercent}
            fillColor={progressColor}
            style={styles.siteBar}
          />

          {/* Bottom row */}
          <View style={styles.siteBottom}>
            {/* Stage pill */}
            <View style={styles.stagePill}>
              <Typography variant="overline" color={colors.textTertiary}>
                {stageLabel}
              </Typography>
            </View>

            <View style={styles.siteBottomRight}>
              {/* Last activity */}
              <Typography variant="overline" color={colors.textQuaternary}>
                {formatRelativeTime(site.lastReportAt)}
              </Typography>

              {/* Urgent badge */}
              {urgentCount > 0 && (
                <View style={[
                  styles.urgentBadge,
                  { backgroundColor: flaggedCount > 0 ? colors.warningBg : colors.accentLight },
                ]}>
                  <Ionicons
                    name={flaggedCount > 0 ? 'alert-circle' : 'time-outline'}
                    size={10}
                    color={flaggedCount > 0 ? colors.warningText : colors.infoText}
                  />
                  <Typography
                    variant="overline"
                    color={flaggedCount > 0 ? colors.warningText : colors.infoText}
                  >
                    {urgentCount} to review
                  </Typography>
                </View>
              )}
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export function ManagerHomeScreen() {
  const navigation = useNavigation<Nav>();
  const { reports, sites, loading, refresh } = useReports();
  const { width } = useWindowDimensions();

  // Responsive: 2-column grid on tablets (width >= 600)
  const numColumns = width >= 600 ? 2 : 1;

  // Derived stats
  const pendingReview = reports.filter((r) => STATUSES_NEEDING_REVIEW.includes(r.status));
  const flaggedCount  = reports.filter((r) => r.status === 'flagged').length;
  const approvedCount = reports.filter((r) => r.status === 'approved').length;
  const totalReports  = reports.filter((r) => !['uploading', 'pending'].includes(r.status)).length;

  const rei = totalReports > 0 ? Math.round((approvedCount / totalReports) * 100) : 0;

  // Per-site report counts
  const sitePendingCounts = Object.fromEntries(
    sites.map((s) => [
      s.id,
      reports.filter((r) => r.siteId === s.id && STATUSES_NEEDING_REVIEW.includes(r.status)).length,
    ]),
  );
  const siteFlaggedCounts = Object.fromEntries(
    sites.map((s) => [
      s.id,
      reports.filter((r) => r.siteId === s.id && r.status === 'flagged').length,
    ]),
  );

  // Most recent flagged reports for "Needs Attention"
  const urgent = reports
    .filter((r) => r.status === 'flagged')
    .slice(0, 3);

  const reiColor =
    rei >= 75 ? colors.successText :
    rei >= 50 ? colors.warningText :
    colors.dangerText;

  return (
    <Screen onRefresh={refresh} refreshing={loading}>

      {/* ── Greeting ───────────────────────────────────────────── */}
      <View style={styles.greeting}>
        <Avatar name={getCurrentUserName()} size={44} />
        <View style={styles.greetingText}>
          <Typography variant="footnote" color={colors.textTertiary}>
            {getGreeting()}
          </Typography>
          <Typography variant="headline" color={colors.textPrimary}>
            {getCurrentUserName().split(' ')[0]}
          </Typography>
          <Typography variant="overline" color={colors.textQuaternary}>
            {formatDate()}
          </Typography>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => navigation.navigate('SitesMap')}
            activeOpacity={0.75}
            style={styles.headerBtn}
          >
            <Ionicons name="map-outline" size={18} color={colors.accent} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Analytics')}
            activeOpacity={0.75}
            style={styles.headerBtn}
          >
            <Ionicons name="stats-chart-outline" size={18} color={colors.accent} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Site selector ──────────────────────────────────────── */}
      <SitePickerBanner style={styles.sitePicker} />

      {/* ── Stats row ──────────────────────────────────────────── */}
      <View style={styles.statsRow}>
        <StatTile
          icon="time-outline"
          value={pendingReview.length}
          label="Needs Review"
          tint={pendingReview.length > 0 ? colors.accentLight : colors.bgSecondary}
          textColor={pendingReview.length > 0 ? colors.accent : colors.textSecondary}
          onPress={() => navigation.navigate('ReportsFeed')}
        />
        <StatTile
          icon="alert-circle-outline"
          value={flaggedCount}
          label="Flagged"
          tint={flaggedCount > 0 ? colors.warningBg : colors.bgSecondary}
          textColor={flaggedCount > 0 ? colors.warningText : colors.textSecondary}
          onPress={() => navigation.navigate('ReportsFeed')}
        />
        <StatTile
          icon="trending-up-outline"
          value={`${rei}%`}
          label="Approval Rate"
          tint={rei >= 70 ? colors.successBg : colors.bgSecondary}
          textColor={rei >= 70 ? colors.successText : colors.textSecondary}
          onPress={() => navigation.navigate('Analytics')}
        />
      </View>

      {/* ── REI summary bar ────────────────────────────────────── */}
      <View style={styles.reiRow}>
        <View style={styles.reiLabels}>
          <Typography variant="footnote" color={colors.textTertiary}>
            Overall approval rate
          </Typography>
          <Typography variant="footnoteSemiBold" color={reiColor}>
            {approvedCount} of {totalReports} reports approved
          </Typography>
        </View>
        <ProgressBar
          value={rei}
          fillColor={reiColor === colors.successText ? '#10B981' : reiColor === colors.warningText ? '#F59E0B' : '#EF4444'}
          style={styles.reiBar}
        />
      </View>

      {/* ── Needs attention ────────────────────────────────────── */}
      {urgent.length > 0 && (
        <View style={styles.urgentSection}>
          {/* Amber left accent strip */}
          <View style={styles.urgentStrip} />
          <View style={styles.urgentContent}>
            <View style={styles.urgentHeader}>
              <Ionicons name="alert-circle-outline" size={14} color={colors.warningText} />
              <Typography variant="subheadMedium" color={colors.textPrimary}>
                Needs attention
              </Typography>
            </View>
            {urgent.map((r, i) => (
              <TouchableOpacity
                key={r.id}
                onPress={() => navigation.navigate('ReportDetail', { reportId: r.id })}
                activeOpacity={0.8}
                style={[styles.urgentItem, i > 0 && styles.urgentItemBorder]}
              >
                <View style={styles.urgentItemLeft}>
                  <Typography variant="subheadMedium" color={colors.textPrimary} numberOfLines={1}>
                    {STAGE_LABELS[r.reportedStage]}
                  </Typography>
                  <Typography variant="footnote" color={colors.textTertiary} numberOfLines={1}>
                    {r.siteName} · {formatRelativeTime(r.submittedAt)}
                  </Typography>
                </View>
                <View style={styles.urgentItemRight}>
                  {r.aiResult && !r.aiResult.isMatch && (
                    <View style={styles.mismatchPill}>
                      <Typography variant="overline" color={colors.warningText}>
                        Stage mismatch
                      </Typography>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={14} color={colors.textQuaternary} />
                </View>
              </TouchableOpacity>
            ))}
            {flaggedCount > 3 && (
              <TouchableOpacity
                onPress={() => navigation.navigate('ReportsFeed')}
                style={styles.seeAllBtn}
                activeOpacity={0.8}
              >
                <Typography variant="footnote" color={colors.accent}>
                  See all {flaggedCount} flagged →
                </Typography>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* ── Active Sites ───────────────────────────────────────── */}
      <View style={styles.sitesHeader}>
        <Typography variant="headline" color={colors.textPrimary}>
          Active Sites
        </Typography>
        <TouchableOpacity
          onPress={() => navigation.navigate('CreateProject')}
          activeOpacity={0.75}
          style={styles.newProjectBtn}
        >
          <Ionicons name="add" size={15} color={colors.textInverse} />
          <Typography variant="subheadMedium" color={colors.textInverse}>
            New
          </Typography>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : sites.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="business-outline" size={32} color={colors.textQuaternary} />
          <Typography variant="subheadMedium" color={colors.textTertiary}>
            No active sites yet
          </Typography>
          <Typography variant="footnote" color={colors.textQuaternary}>
            Tap "New" to create your first project
          </Typography>
        </View>
      ) : (
        <View style={[styles.sitesGrid, numColumns === 2 && styles.sitesGridTwo]}>
          {sites.map((site) => (
            <View key={site.id} style={numColumns === 2 ? styles.siteGridCell : undefined}>
              <SiteCard
                site={site}
                pendingCount={sitePendingCounts[site.id] ?? 0}
                flaggedCount={siteFlaggedCounts[site.id] ?? 0}
                onPress={() => navigation.navigate('SiteDetail', { siteId: site.id })}
              />
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  // ── Greeting ──────────────────────────────────────────────────
  greeting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[5],
  },
  greetingText: {
    flex: 1,
    gap: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#1A1833',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: { elevation: 1 },
    }),
  },

  // ── Site picker ───────────────────────────────────────────────
  sitePicker: {
    marginBottom: spacing[4],
  },

  // ── Stats ─────────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  statTile: {
    flex: 1,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing[3],
    paddingTop: spacing[3],
    paddingBottom: spacing[3] + 2,
    gap: spacing[1],
    ...Platform.select({
      ios: {
        shadowColor: '#1A1833',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: { elevation: 1 },
    }),
  },
  statIconWrap: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[1],
  },
  statValue: {
    marginTop: 0,
  },
  statLabel: {},

  // ── REI ───────────────────────────────────────────────────────
  reiRow: {
    marginBottom: spacing[5],
    gap: spacing[2],
  },
  reiLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reiBar: {},

  // ── Urgent section ────────────────────────────────────────────
  urgentSection: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    marginBottom: spacing[5],
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#1A1833',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: { elevation: 1 },
    }),
  },
  urgentStrip: {
    width: 4,
    backgroundColor: colors.warningText,
    alignSelf: 'stretch',
  },
  urgentContent: {
    flex: 1,
    paddingVertical: spacing[1],
  },
  urgentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
  },
  urgentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  urgentItemBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
  },
  urgentItemLeft: {
    flex: 1,
    gap: 2,
    marginRight: spacing[3],
  },
  urgentItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  mismatchPill: {
    backgroundColor: colors.warningBg,
    borderRadius: radii.xs,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  seeAllBtn: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
    alignItems: 'center',
  },

  // ── Sites section ─────────────────────────────────────────────
  sitesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  newProjectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1] + 2,
    backgroundColor: colors.accent,
    borderRadius: radii.full,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  loader: {
    marginTop: spacing[8],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing[12],
    gap: spacing[2],
  },

  // ── Site grid ─────────────────────────────────────────────────
  sitesGrid: {
    gap: spacing[3],
  },
  sitesGridTwo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  siteGridCell: {
    width: '50%',
    paddingRight: spacing[1] + 2,  // half gap between cells
  },

  // ── Site card ─────────────────────────────────────────────────
  siteCardOuter: {
    // no marginBottom here — handled by sitesGrid gap
  },
  siteCard: {
    flexDirection: 'row',
    overflow: 'hidden',
  },
  siteAccentStrip: {
    width: 4,
    alignSelf: 'stretch',
  },
  siteCardInner: {
    flex: 1,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3] + 2,
    gap: spacing[2],
  },
  siteTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  siteMeta: {
    flex: 1,
    gap: 2,
    marginRight: spacing[3],
  },
  siteProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  siteBar: {},
  siteBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  stagePill: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radii.xs,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  siteBottomRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    borderRadius: radii.xs,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
});
