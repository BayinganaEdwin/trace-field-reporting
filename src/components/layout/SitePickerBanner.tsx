/**
 * SitePickerBanner
 *
 * Tappable banner that shows the currently active site and opens a bottom-sheet
 * modal to switch between sites. Used on both the worker and manager home screens
 * and carried through automatically to SubmitReportScreen via useReports context.
 */
import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../ui/Typography';
import { useReports } from '../../hooks/useReports';
import { colors } from '../../theme/colors';
import { spacing, radii, borderWidths } from '../../theme/spacing';
import type { ViewStyle } from 'react-native';

interface SitePickerBannerProps {
  style?: ViewStyle;
}

export function SitePickerBanner({ style }: SitePickerBannerProps) {
  const { sites, activeSite, setActiveSite } = useReports();
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();

  // Nothing to switch if there's only one (or zero) sites
  const canSwitch = sites.length > 1;

  const handleSelect = (site: typeof sites[0]) => {
    setActiveSite(site);
    setOpen(false);
  };

  return (
    <>
      {/* ── Banner ───────────────────────────────────────────────── */}
      <TouchableOpacity
        onPress={() => canSwitch && setOpen(true)}
        activeOpacity={canSwitch ? 0.75 : 1}
        style={[styles.banner, style]}
      >
        <View style={styles.iconWrap}>
          <Ionicons name="business-outline" size={14} color={colors.accent} />
        </View>
        <View style={styles.bannerText}>
          <Typography variant="overline" color={colors.textTertiary}>
            Active Site
          </Typography>
          <Typography variant="subheadMedium" color={colors.textPrimary} numberOfLines={1}>
            {activeSite?.name ?? 'No site assigned'}
          </Typography>
          {activeSite?.location ? (
            <Typography variant="footnote" color={colors.textTertiary} numberOfLines={1}>
              {activeSite.location}
            </Typography>
          ) : null}
        </View>
        {canSwitch && (
          <Ionicons name="chevron-down" size={16} color={colors.textTertiary} />
        )}
      </TouchableOpacity>

      {/* ── Picker sheet ─────────────────────────────────────────── */}
      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        {/* Backdrop */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        />

        {/* Sheet */}
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing[4] }]}>
          {/* Handle */}
          <View style={styles.handle} />

          <Typography variant="headline" color={colors.textPrimary} style={styles.sheetTitle}>
            Switch Site
          </Typography>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.siteList}
          >
            {sites.map((site) => {
              const isActive = site.id === activeSite?.id;
              return (
                <TouchableOpacity
                  key={site.id}
                  onPress={() => handleSelect(site)}
                  activeOpacity={0.75}
                  style={[styles.siteRow, isActive && styles.siteRowActive]}
                >
                  <View style={styles.siteRowLeft}>
                    <View style={[styles.siteIcon, isActive && styles.siteIconActive]}>
                      <Ionicons
                        name="business-outline"
                        size={16}
                        color={isActive ? colors.textInverse : colors.textSecondary}
                      />
                    </View>
                    <View style={styles.siteMeta}>
                      <Typography
                        variant="subheadMedium"
                        color={isActive ? colors.accent : colors.textPrimary}
                      >
                        {site.name}
                      </Typography>
                      {site.location ? (
                        <Typography variant="footnote" color={colors.textTertiary}>
                          {site.location}
                        </Typography>
                      ) : null}
                    </View>
                  </View>
                  {isActive && (
                    <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // ── Banner ────────────────────────────────────────────────────
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3] + 2,
    borderWidth: borderWidths.hairline,
    borderColor: colors.separator,
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
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: radii.sm,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: {
    flex: 1,
    gap: 1,
  },

  // ── Backdrop ──────────────────────────────────────────────────
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  // ── Sheet ─────────────────────────────────────────────────────
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    maxHeight: '70%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
      },
      android: { elevation: 16 },
    }),
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.separator,
    alignSelf: 'center',
    marginBottom: spacing[4],
  },
  sheetTitle: {
    marginBottom: spacing[4],
  },
  siteList: {
    gap: spacing[2],
    paddingBottom: spacing[2],
  },

  // ── Site row ──────────────────────────────────────────────────
  siteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3] + 2,
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
    borderColor: colors.separator,
    backgroundColor: colors.bgSecondary,
  },
  siteRowActive: {
    borderColor: colors.accent + '40',
    backgroundColor: colors.accentLight,
  },
  siteRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    flex: 1,
  },
  siteIcon: {
    width: 34,
    height: 34,
    borderRadius: radii.md,
    backgroundColor: colors.separator,
    alignItems: 'center',
    justifyContent: 'center',
  },
  siteIconActive: {
    backgroundColor: colors.accent,
  },
  siteMeta: {
    gap: 2,
    flex: 1,
  },
});
