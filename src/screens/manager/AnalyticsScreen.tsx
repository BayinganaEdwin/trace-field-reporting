/**
 * AnalyticsScreen
 *
 * Manager-only analytics dashboard.
 * Charts built with plain View + StyleSheet — no charting library.
 *
 * Sections:
 *  1. REI trend (7-day bar chart)
 *  2. Stage distribution (horizontal stacked bar)
 *  3. Reports per day (spark bars)
 *  4. Top sites summary table
 */
import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '../../components/ui/Typography';
import { Card } from '../../components/ui/Card';
import { Divider } from '../../components/ui/Divider';
import { useReports } from '../../hooks/useReports';
import { colors } from '../../theme/colors';
import { spacing, radii, borderWidths } from '../../theme/spacing';
import { STAGE_LABELS, type ConstructionStage } from '../../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function dayLabel(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2);
}

/** Generate mock 7-day REI trend values based on live REI */
function buildReiTrend(liveRei: number): { label: string; value: number }[] {
  const seed = [0.78, 0.82, 0.75, 0.88, 0.84, 0.91, 1.0];
  return seed.map((factor, i) => ({
    label: dayLabel(6 - i),
    value: Math.min(100, Math.round(liveRei * factor)),
  }));
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface SectionCardProps {
  title: string;
  subtitle?: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  children: React.ReactNode;
}

function SectionCard({ title, subtitle, icon, children }: SectionCardProps) {
  return (
    <Card style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <View style={styles.sectionIconWrap}>
            <Ionicons name={icon} size={16} color={colors.accent} />
          </View>
          <View>
            <Typography variant="subheadMedium" color={colors.textPrimary}>
              {title}
            </Typography>
            {subtitle ? (
              <Typography variant="footnote" color={colors.textTertiary}>
                {subtitle}
              </Typography>
            ) : null}
          </View>
        </View>
      </View>
      <Divider style={styles.sectionDivider} />
      {children}
    </Card>
  );
}

// ── REI Trend Bar Chart ───────────────────────────────────────────────────────

function ReiTrendChart({ data }: { data: { label: string; value: number }[] }) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const lastBar = data[data.length - 1];

  return (
    <View style={styles.barChartWrap}>
      {/* Y-axis guides */}
      <View style={styles.yGuides} pointerEvents="none">
        {[100, 75, 50, 25].map((v) => (
          <View key={v} style={[styles.yGuide, { bottom: `${v}%` as unknown as number }]}>
            <Typography variant="overline" color={colors.textQuaternary}>
              {v}
            </Typography>
            <View style={styles.yGuideLine} />
          </View>
        ))}
      </View>

      {/* Bars */}
      <View style={styles.barsRow}>
        {data.map((d, i) => {
          const isToday = i === data.length - 1;
          const heightPct = Math.max(4, (d.value / maxVal) * 100);
          return (
            <View key={d.label} style={styles.barCol}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { height: `${heightPct}%` as unknown as number },
                    isToday && styles.barFillToday,
                  ]}
                />
              </View>
              <Typography
                variant="overline"
                color={isToday ? colors.accent : colors.textTertiary}
                style={styles.barLabel}
              >
                {d.label}
              </Typography>
            </View>
          );
        })}
      </View>

      {/* Current REI callout */}
      <View style={styles.reiCallout}>
        <Typography variant="title1" color={colors.accent}>
          {lastBar.value}
        </Typography>
        <Typography variant="footnote" color={colors.textTertiary}>
          Today's REI
        </Typography>
      </View>
    </View>
  );
}

// ── Stage Distribution ────────────────────────────────────────────────────────

const STAGE_COLORS: Record<ConstructionStage, string> = {
  formwork_erected:    colors.warningText,
  reinforcement_placed: '#6B8DD6',
  concrete_poured:     colors.infoText,
  structure_complete:  colors.successText,
};

const STAGE_BG: Record<ConstructionStage, string> = {
  formwork_erected:    colors.warningBg,
  reinforcement_placed: '#EDF2FC',
  concrete_poured:     colors.infoBg,
  structure_complete:  colors.successBg,
};

const STAGE_ORDER: ConstructionStage[] = [
  'formwork_erected',
  'reinforcement_placed',
  'concrete_poured',
  'structure_complete',
];

function StageDistributionChart({
  counts,
  total,
}: {
  counts: Record<ConstructionStage, number>;
  total: number;
}) {
  if (total === 0) {
    return (
      <Typography variant="footnote" color={colors.textTertiary} style={styles.emptyNote}>
        No reports yet
      </Typography>
    );
  }

  return (
    <View style={styles.stageDistWrap}>
      {/* Stacked bar */}
      <View style={styles.stackedBar}>
        {STAGE_ORDER.map((stage) => {
          const pct = (counts[stage] / total) * 100;
          if (pct < 0.5) return null;
          return (
            <View
              key={stage}
              style={[
                styles.stackSegment,
                {
                  width: `${pct}%` as unknown as number,
                  backgroundColor: STAGE_COLORS[stage],
                },
              ]}
            />
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.stageLegend}>
        {STAGE_ORDER.map((stage) => {
          const count = counts[stage];
          if (count === 0) return null;
          const pct = Math.round((count / total) * 100);
          return (
            <View key={stage} style={styles.legendRow}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: STAGE_COLORS[stage] },
                ]}
              />
              <Typography variant="footnote" color={colors.textSecondary} style={styles.legendLabel}>
                {STAGE_LABELS[stage]}
              </Typography>
              <View style={[styles.legendPctBadge, { backgroundColor: STAGE_BG[stage] }]}>
                <Typography variant="overline" color={STAGE_COLORS[stage]}>
                  {pct}%
                </Typography>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ── Spark bars (reports per day) ──────────────────────────────────────────────

function SparkBars({ data }: { data: number[] }) {
  const maxVal = Math.max(...data, 1);
  return (
    <View style={styles.sparkWrap}>
      {data.map((v, i) => {
        const isToday = i === data.length - 1;
        const heightPct = Math.max(8, (v / maxVal) * 100);
        return (
          <View key={i} style={styles.sparkBarCol}>
            <View style={styles.sparkTrack}>
              <View
                style={[
                  styles.sparkFill,
                  { height: `${heightPct}%` as unknown as number },
                  isToday && styles.sparkFillToday,
                ]}
              />
            </View>
            <Typography variant="overline" color={isToday ? colors.accent : colors.textTertiary}>
              {dayLabel(6 - i).slice(0, 1)}
            </Typography>
          </View>
        );
      })}
    </View>
  );
}

// ── Top Sites Table ───────────────────────────────────────────────────────────

interface SiteRow {
  id: string;
  name: string;
  reportCount: number;
  approvedCount: number;
  flaggedCount: number;
  rei: number;
}

function TopSitesTable({ rows }: { rows: SiteRow[] }) {
  return (
    <View style={styles.tableWrap}>
      {/* Header */}
      <View style={[styles.tableRow, styles.tableHeader]}>
        <Typography variant="overline" color={colors.textTertiary} style={styles.colSite}>
          Site
        </Typography>
        <Typography variant="overline" color={colors.textTertiary} style={styles.colNum}>
          Reports
        </Typography>
        <Typography variant="overline" color={colors.textTertiary} style={styles.colNum}>
          Flagged
        </Typography>
        <Typography variant="overline" color={colors.textTertiary} style={styles.colNum}>
          REI
        </Typography>
      </View>
      {rows.map((row, i) => (
        <View key={row.id}>
          {i > 0 && <Divider />}
          <View style={styles.tableRow}>
            <Typography
              variant="footnote"
              color={colors.textPrimary}
              numberOfLines={1}
              style={styles.colSite}
            >
              {row.name}
            </Typography>
            <Typography variant="footnote" color={colors.textSecondary} style={styles.colNum}>
              {row.reportCount}
            </Typography>
            <Typography
              variant="footnote"
              color={row.flaggedCount > 0 ? colors.warningText : colors.textTertiary}
              style={styles.colNum}
            >
              {row.flaggedCount}
            </Typography>
            <Typography
              variant="footnoteSemiBold"
              color={row.rei >= 70 ? colors.successText : colors.accent}
              style={styles.colNum}
            >
              {row.rei}
            </Typography>
          </View>
        </View>
      ))}
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { reports, sites, loading, refresh } = useReports();

  const {
    stageCounts,
    totalReports,
    approvedCount,
    flaggedCount,
    rei,
    reiTrend,
    perDayCounts,
    siteRows,
  } = useMemo(() => {
    const stageCounts: Record<ConstructionStage, number> = {
      formwork_erected: 0,
      reinforcement_placed: 0,
      concrete_poured: 0,
      structure_complete: 0,
    };

    let approved = 0;
    let flagged = 0;

    // Reports per day — last 7 days
    const dayMap: Record<string, number> = {};
    for (let d = 6; d >= 0; d--) {
      const dt = new Date();
      dt.setDate(dt.getDate() - d);
      dayMap[dt.toDateString()] = 0;
    }

    for (const r of reports) {
      stageCounts[r.reportedStage]++;
      if (r.status === 'approved') approved++;
      if (r.status === 'flagged') flagged++;
      const key = new Date(r.submittedAt).toDateString();
      if (key in dayMap) dayMap[key]++;
    }

    const reviewable = reports.filter(
      (r) => r.status !== 'uploading' && r.status !== 'pending',
    );
    const rei =
      reviewable.length > 0
        ? Math.round((approved / reviewable.length) * 100)
        : 72; // demo fallback

    const perDayCounts = Object.values(dayMap);

    const siteRows: SiteRow[] = sites.map((site) => {
      const siteReports = reports.filter((r) => r.siteId === site.id);
      const siteApproved = siteReports.filter((r) => r.status === 'approved').length;
      const siteFlagged = siteReports.filter((r) => r.status === 'flagged').length;
      const siteReviewable = siteReports.filter(
        (r) => r.status !== 'uploading' && r.status !== 'pending',
      );
      const siteRei =
        siteReviewable.length > 0
          ? Math.round((siteApproved / siteReviewable.length) * 100)
          : 0;
      return {
        id:            site.id,
        name:          site.name,
        reportCount:   siteReports.length,
        approvedCount: siteApproved,
        flaggedCount:  siteFlagged,
        rei:           siteRei,
      };
    });

    return {
      stageCounts,
      totalReports: reports.length,
      approvedCount: approved,
      flaggedCount: flagged,
      rei,
      reiTrend:   buildReiTrend(rei),
      perDayCounts,
      siteRows,
    };
  }, [reports, sites]);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + spacing[8] },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={refresh}
          tintColor={colors.accent}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Summary chips ──────────────────────────────────────────── */}
      <View style={styles.chipsRow}>
        <View style={[styles.chip, { backgroundColor: colors.accentLight }]}>
          <Typography variant="title3" color={colors.accent}>
            {totalReports}
          </Typography>
          <Typography variant="footnote" color={colors.infoText}>
            Total
          </Typography>
        </View>
        <View
          style={[
            styles.chip,
            { backgroundColor: flaggedCount > 0 ? colors.warningBg : colors.bgSecondary },
          ]}
        >
          <Typography
            variant="title3"
            color={flaggedCount > 0 ? colors.warningText : colors.textPrimary}
          >
            {flaggedCount}
          </Typography>
          <Typography
            variant="footnote"
            color={flaggedCount > 0 ? colors.warningText : colors.textSecondary}
          >
            Flagged
          </Typography>
        </View>
        <View
          style={[
            styles.chip,
            { backgroundColor: approvedCount > 0 ? colors.successBg : colors.bgSecondary },
          ]}
        >
          <Typography
            variant="title3"
            color={approvedCount > 0 ? colors.successText : colors.textPrimary}
          >
            {approvedCount}
          </Typography>
          <Typography
            variant="footnote"
            color={approvedCount > 0 ? colors.successText : colors.textSecondary}
          >
            Approved
          </Typography>
        </View>
      </View>

      {/* REI Trend ──────────────────────────────────────────────── */}
      <SectionCard
        title="REI Trend"
        subtitle="Last 7 days · Reporting Evaluation Index"
        icon="trending-up-outline"
      >
        <View style={styles.sectionBody}>
          <ReiTrendChart data={reiTrend} />
        </View>
      </SectionCard>

      {/* Stage Distribution ─────────────────────────────────────── */}
      <SectionCard
        title="Stage Distribution"
        subtitle={`${totalReports} reports across ${sites.length} sites`}
        icon="layers-outline"
      >
        <View style={styles.sectionBody}>
          <StageDistributionChart counts={stageCounts} total={totalReports} />
        </View>
      </SectionCard>

      {/* Reports Per Day ────────────────────────────────────────── */}
      <SectionCard
        title="Reports per Day"
        subtitle="Submission activity — last 7 days"
        icon="bar-chart-outline"
      >
        <View style={[styles.sectionBody, styles.sparkSection]}>
          <SparkBars data={perDayCounts} />
          <View style={styles.sparkMeta}>
            <Typography variant="title2" color={colors.textPrimary}>
              {perDayCounts[perDayCounts.length - 1]}
            </Typography>
            <Typography variant="footnote" color={colors.textTertiary}>
              reports today
            </Typography>
          </View>
        </View>
      </SectionCard>

      {/* Top Sites ──────────────────────────────────────────────── */}
      <SectionCard
        title="Sites Overview"
        subtitle="Compliance summary per active site"
        icon="business-outline"
      >
        <TopSitesTable rows={siteRows} />
      </SectionCard>
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgSecondary,
  },
  content: {
    padding: spacing[5],
    gap: spacing[4],
  },

  // ── Summary chips ─────────────────────────────────────────────
  chipsRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[1],
  },
  chip: {
    flex: 1,
    borderRadius: radii.xl,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[4],
    gap: 3,
    alignItems: 'flex-start',
  },

  // ── Section card ──────────────────────────────────────────────
  sectionCard: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    overflow: 'hidden',
  },
  sectionHeader: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  sectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionDivider: {
    marginVertical: 0,
  },
  sectionBody: {
    padding: spacing[4],
  },
  emptyNote: {
    padding: spacing[4],
    textAlign: 'center',
  },

  // ── REI bar chart ─────────────────────────────────────────────
  barChartWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing[3],
  },
  yGuides: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: spacing[5],
    pointerEvents: 'none',
  } as never,
  yGuide: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  yGuideLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
  },
  barsRow: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing[2],
    height: 120,
    alignItems: 'flex-end',
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: spacing[1],
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTrack: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: radii.xs,
    backgroundColor: colors.accentLight,
    minHeight: 4,
  },
  barFillToday: {
    backgroundColor: colors.accent,
  },
  barLabel: {
    marginTop: 2,
  },
  reiCallout: {
    alignItems: 'center',
    gap: 2,
    paddingLeft: spacing[2],
  },

  // ── Stage distribution ────────────────────────────────────────
  stageDistWrap: {
    gap: spacing[4],
  },
  stackedBar: {
    height: 12,
    borderRadius: radii.full,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: colors.bgSecondary,
  },
  stackSegment: {
    height: '100%',
  },
  stageLegend: {
    gap: spacing[2],
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
    flexShrink: 0,
  },
  legendLabel: {
    flex: 1,
  },
  legendPctBadge: {
    borderRadius: radii.xs,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },

  // ── Spark bars ────────────────────────────────────────────────
  sparkSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  sparkWrap: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing[1] + 2,
    height: 56,
    alignItems: 'flex-end',
  },
  sparkBarCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    height: '100%',
    justifyContent: 'flex-end',
  },
  sparkTrack: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  sparkFill: {
    width: '100%',
    borderRadius: radii.xs,
    backgroundColor: colors.accentLight,
    minHeight: 4,
  },
  sparkFillToday: {
    backgroundColor: colors.accent,
  },
  sparkMeta: {
    alignItems: 'flex-end',
    gap: 2,
  },

  // ── Top sites table ───────────────────────────────────────────
  tableWrap: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
  },
  tableHeader: {
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
  },
  colSite: {
    flex: 1,
    marginRight: spacing[3],
  },
  colNum: {
    width: 56,
    textAlign: 'right',
  },
});
