/**
 * SitesMapScreen
 *
 * A View-based pseudo-map of active construction sites.
 * Uses mock Kigali coordinates projected onto a fixed canvas —
 * no map packages required, works fully offline.
 *
 * Tap a pin → navigate to SiteDetail.
 * Entry point: Analytics icon in ManagerHomeScreen, or a "Map" button
 * accessible from the ManagerHome header (wired separately).
 */
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Typography } from '../../components/ui/Typography';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { useReports } from '../../hooks/useReports';
import { colors } from '../../theme/colors';
import { spacing, radii, borderWidths } from '../../theme/spacing';
import { STAGE_LABELS } from '../../types';
import type { ManagerStackParamList } from '../../types';

type Props = NativeStackScreenProps<ManagerStackParamList, 'SitesMap'>;

const { width: SCREEN_W } = Dimensions.get('window');
const MAP_W = SCREEN_W - spacing[5] * 2;
const MAP_H = 260;

// Bounding box that snugly fits our two Kigali sites (with generous padding)
const BOUNDS = {
  latMin: -1.960,
  latMax: -1.920,
  lngMin:  30.050,
  lngMax:  30.125,
};

function latLngToXY(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng - BOUNDS.lngMin) / (BOUNDS.lngMax - BOUNDS.lngMin)) * MAP_W;
  // lat increases southward on screen
  const y = ((lat - BOUNDS.latMax) / (BOUNDS.latMin - BOUNDS.latMax)) * MAP_H;
  return { x, y };
}

/** Deterministic pseudo-coords from a site ID so pins don't jump between renders */
function siteIdToCoords(id: string): { lat: number; lng: number } {
  let hash = 5381;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) + hash) ^ id.charCodeAt(i);
  }
  const h1 = Math.abs(hash) / 2147483647;
  const h2 = Math.abs((hash * 1103515245 + 12345) & 0x7fffffff) / 2147483647;
  const lat = BOUNDS.latMin + h1 * (BOUNDS.latMax - BOUNDS.latMin);
  const lng = BOUNDS.lngMin + h2 * (BOUNDS.lngMax - BOUNDS.lngMin);
  return { lat, lng };
}

// ── Grid lines for map chrome ─────────────────────────────────────────────────

function MapGrid() {
  const lines = [0.25, 0.5, 0.75];
  return (
    <>
      {lines.map((f) => (
        <View
          key={`h${f}`}
          pointerEvents="none"
          style={[styles.gridLine, styles.gridH, { top: MAP_H * f }]}
        />
      ))}
      {lines.map((f) => (
        <View
          key={`v${f}`}
          pointerEvents="none"
          style={[styles.gridLine, styles.gridV, { left: MAP_W * f }]}
        />
      ))}
    </>
  );
}

// ── Site pin ──────────────────────────────────────────────────────────────────

interface PinProps {
  label: string;
  x: number;
  y: number;
  progress: number;
  isSelected: boolean;
  onPress: () => void;
}

function SitePin({ label, x, y, progress, isSelected, onPress }: PinProps) {
  const color = progress >= 80 ? colors.successText : colors.accent;
  const bg    = progress >= 80 ? colors.successBg   : colors.accentLight;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.pin,
        {
          left: x - (isSelected ? 18 : 14),
          top:  y - (isSelected ? 36 : 28),
        },
      ]}
    >
      {/* Bubble */}
      <View
        style={[
          styles.pinBubble,
          { backgroundColor: isSelected ? colors.accent : bg },
          isSelected && styles.pinBubbleSelected,
        ]}
      >
        <Ionicons
          name="business"
          size={isSelected ? 16 : 13}
          color={isSelected ? colors.textInverse : color}
        />
      </View>
      {/* Tail */}
      <View style={[styles.pinTail, { borderTopColor: isSelected ? colors.accent : bg }]} />
      {/* Label */}
      <View
        style={[
          styles.pinLabel,
          { backgroundColor: isSelected ? colors.accent : colors.surface },
        ]}
      >
        <Typography
          variant="overline"
          color={isSelected ? colors.textInverse : colors.textPrimary}
          numberOfLines={1}
        >
          {label}
        </Typography>
      </View>
    </TouchableOpacity>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export function SitesMapScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { sites, reports } = useReports();
  const [selectedId, setSelectedId] = useState<string | null>(sites[0]?.id ?? null);

  const selectedSite = sites.find((s) => s.id === selectedId);
  const siteReports  = selectedSite
    ? reports.filter((r) => r.siteId === selectedSite.id)
    : [];
  const flaggedCount  = siteReports.filter((r) => r.status === 'flagged').length;
  const approvedCount = siteReports.filter((r) => r.status === 'approved').length;
  const reviewable    = siteReports.filter(
    (r) => r.status !== 'uploading' && r.status !== 'pending',
  );
  const rei = reviewable.length > 0
    ? Math.round((approvedCount / reviewable.length) * 100)
    : 0;

  const handlePinPress = (siteId: string) => {
    Haptics.selectionAsync();
    setSelectedId(siteId);
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: insets.bottom + spacing[8] }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
            <Typography variant="footnote" color={colors.textSecondary}>
              Active site
            </Typography>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.successText }]} />
            <Typography variant="footnote" color={colors.textSecondary}>
              ≥ 80% complete
            </Typography>
          </View>
          <Typography variant="footnote" color={colors.textTertiary}>
            Tap a pin to select
          </Typography>
        </View>

        {/* Map canvas */}
        <View style={styles.mapCanvas}>
          <MapGrid />

          {/* Compass rose */}
          <View style={styles.compass} pointerEvents="none">
            <Ionicons name="compass-outline" size={20} color={colors.textQuaternary} />
          </View>

          {/* Scale bar */}
          <View style={styles.scaleBar} pointerEvents="none">
            <View style={styles.scaleBarLine} />
            <Typography variant="overline" color={colors.textQuaternary}>
              ~5 km
            </Typography>
          </View>

          {/* Site pins */}
          {sites.map((site) => {
            const coords = siteIdToCoords(site.id);
            const { x, y } = latLngToXY(coords.lat, coords.lng);
            return (
              <SitePin
                key={site.id}
                label={site.name}
                x={x}
                y={y}
                progress={site.progressPercent}
                isSelected={selectedId === site.id}
                onPress={() => handlePinPress(site.id)}
              />
            );
          })}
        </View>

        {/* Site detail card */}
        {selectedSite ? (
          <Card style={styles.detailCard} padded={false}>
            <View style={styles.detailHeader}>
              <View style={styles.detailMeta}>
                <Typography variant="subheadMedium" color={colors.textPrimary}>
                  {selectedSite.name}
                </Typography>
                <View style={styles.detailLocation}>
                  <Ionicons name="location-outline" size={12} color={colors.textTertiary} />
                  <Typography variant="footnote" color={colors.textTertiary}>
                    {selectedSite.location}
                  </Typography>
                </View>
              </View>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('SiteDetail', { siteId: selectedSite.id })
                }
                activeOpacity={0.8}
                style={styles.detailBtn}
              >
                <Typography variant="footnoteSemiBold" color={colors.accent}>
                  View detail
                </Typography>
                <Ionicons name="chevron-forward" size={13} color={colors.accent} />
              </TouchableOpacity>
            </View>

            <ProgressBar
              value={selectedSite.progressPercent}
              style={styles.detailProgress}
            />

            <View style={styles.detailStats}>
              <View style={styles.detailStat}>
                <Typography variant="title3" color={colors.accent}>
                  {selectedSite.progressPercent}%
                </Typography>
                <Typography variant="overline" color={colors.textTertiary}>
                  Complete
                </Typography>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.detailStat}>
                <Typography
                  variant="title3"
                  color={flaggedCount > 0 ? colors.warningText : colors.textPrimary}
                >
                  {flaggedCount}
                </Typography>
                <Typography variant="overline" color={colors.textTertiary}>
                  Flagged
                </Typography>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.detailStat}>
                <Typography
                  variant="title3"
                  color={rei >= 70 ? colors.successText : colors.textPrimary}
                >
                  {rei}
                </Typography>
                <Typography variant="overline" color={colors.textTertiary}>
                  REI
                </Typography>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.detailStat}>
                <Typography variant="title3" color={colors.textPrimary}>
                  {selectedSite.workerCount}
                </Typography>
                <Typography variant="overline" color={colors.textTertiary}>
                  Workers
                </Typography>
              </View>
            </View>

            <View style={styles.detailFooter}>
              <Typography variant="footnote" color={colors.textTertiary}>
                Current stage
              </Typography>
              <Typography variant="footnoteSemiBold" color={colors.textSecondary}>
                {STAGE_LABELS[selectedSite.currentStage]}
              </Typography>
            </View>
          </Card>
        ) : null}

        {/* All sites list */}
        <Typography variant="headline" color={colors.textPrimary} style={styles.listTitle}>
          All Sites
        </Typography>
        {sites.map((site) => {
          const isSelected = site.id === selectedId;
          return (
            <TouchableOpacity
              key={site.id}
              onPress={() => handlePinPress(site.id)}
              activeOpacity={0.82}
            >
              <Card
                style={isSelected
                  ? { ...styles.siteRow, ...styles.siteRowSelected }
                  : styles.siteRow}
                padded={false}
              >
                <View style={styles.siteRowInner}>
                  <View
                    style={[
                      styles.siteColorDot,
                      {
                        backgroundColor:
                          site.progressPercent >= 80
                            ? colors.successText
                            : colors.accent,
                      },
                    ]}
                  />
                  <View style={styles.siteRowMeta}>
                    <Typography variant="subheadMedium" color={colors.textPrimary}>
                      {site.name}
                    </Typography>
                    <Typography variant="footnote" color={colors.textTertiary}>
                      {site.location}
                    </Typography>
                  </View>
                  <View style={styles.siteRowRight}>
                    <Typography
                      variant="footnoteSemiBold"
                      color={isSelected ? colors.accent : colors.textSecondary}
                    >
                      {site.progressPercent}%
                    </Typography>
                    <Ionicons
                      name="chevron-forward"
                      size={14}
                      color={colors.textQuaternary}
                    />
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgSecondary },
  content: { padding: spacing[5], gap: spacing[4] },

  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    flexWrap: 'wrap',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  legendDot: { width: 8, height: 8, borderRadius: radii.full },

  // ── Map canvas ────────────────────────────────────────────────
  mapCanvas: {
    width: MAP_W,
    height: MAP_H,
    backgroundColor: '#EAF0F8',
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: borderWidths.thin,
    borderColor: colors.separator,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(27,63,122,0.06)',
  },
  gridH: { left: 0, right: 0, height: StyleSheet.hairlineWidth },
  gridV: { top: 0, bottom: 0, width: StyleSheet.hairlineWidth },

  compass: {
    position: 'absolute',
    top: spacing[3],
    right: spacing[3],
  },
  scaleBar: {
    position: 'absolute',
    bottom: spacing[3],
    left: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  scaleBarLine: {
    width: 40,
    height: 2,
    backgroundColor: colors.textQuaternary,
  },

  // ── Pins ──────────────────────────────────────────────────────
  pin: {
    position: 'absolute',
    alignItems: 'center',
  },
  pinBubble: {
    width: 28,
    height: 28,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinBubbleSelected: {
    width: 36,
    height: 36,
    borderRadius: radii.lg,
    shadowColor: colors.accent,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  pinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  pinLabel: {
    marginTop: 2,
    borderRadius: radii.xs,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    maxWidth: 100,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },

  // ── Detail card ───────────────────────────────────────────────
  detailCard: { paddingHorizontal: 0, paddingVertical: 0, overflow: 'hidden' },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
    gap: spacing[3],
  },
  detailMeta: { flex: 1, gap: 3 },
  detailLocation: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingVertical: spacing[1],
  },
  detailProgress: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  detailStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
  },
  detailStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
    backgroundColor: colors.separator,
  },
  detailFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    paddingTop: spacing[1],
    borderTopWidth: borderWidths.hairline,
    borderTopColor: colors.separator,
  },

  // ── Sites list ────────────────────────────────────────────────
  listTitle: { marginTop: spacing[2] },
  siteRow: { marginBottom: spacing[2] },
  siteRowSelected: {
    borderWidth: borderWidths.thin,
    borderColor: colors.accent,
  },
  siteRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
  },
  siteColorDot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
    flexShrink: 0,
  },
  siteRowMeta: { flex: 1, gap: 2 },
  siteRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
});
