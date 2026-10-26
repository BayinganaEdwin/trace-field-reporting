import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { colors } from '../../theme/colors';
import { spacing, radii, borderWidths } from '../../theme/spacing';
import { useReports } from '../../hooks/useReports';
import type { ManagerStackParamList, ConstructionStage, Site } from '../../types';
import { STAGE_OPTIONS } from '../../types';

type Props = NativeStackScreenProps<ManagerStackParamList, 'CreateProject'>;

// ── Simulated GPS capture ─────────────────────────────────────────────────────

interface CapturedCoords {
  lat: number;
  lng: number;
  accuracy: number; // metres
}

function simulateSiteGps(): Promise<CapturedCoords> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Kigali CBD approx — ±100m jitter
      const jitter = () => (Math.random() - 0.5) * 0.002;
      resolve({
        lat: -1.9441 + jitter(),
        lng: 30.0619 + jitter(),
        accuracy: Math.round(5 + Math.random() * 12),
      });
    }, 1800);
  });
}

// ── Stage picker item ─────────────────────────────────────────────────────────

interface StagePickerProps {
  value: ConstructionStage;
  onChange: (stage: ConstructionStage) => void;
}

function StagePicker({ value, onChange }: StagePickerProps) {
  return (
    <View style={stagePicker.wrap}>
      {STAGE_OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => { Haptics.selectionAsync(); onChange(opt.value); }}
            activeOpacity={0.78}
            style={[stagePicker.item, active && stagePicker.itemActive]}
          >
            <View style={stagePicker.itemLeft}>
              <View style={[stagePicker.orderBadge, active && stagePicker.orderBadgeActive]}>
                <Typography variant="overline" color={active ? colors.textInverse : colors.textTertiary}>
                  {opt.order}
                </Typography>
              </View>
              <View style={stagePicker.itemText}>
                <Typography
                  variant="subheadMedium"
                  color={active ? colors.accent : colors.textPrimary}
                >
                  {opt.label}
                </Typography>
                <Typography variant="overline" color={colors.textTertiary}>
                  {opt.description}
                </Typography>
              </View>
            </View>
            {active && (
              <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const stagePicker = StyleSheet.create({
  wrap: { gap: spacing[2] },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: borderWidths.thin,
    borderColor: colors.separator,
    padding: spacing[3],
    gap: spacing[3],
  },
  itemActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentLight,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    flex: 1,
  },
  orderBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderBadgeActive: {
    backgroundColor: colors.accent,
  },
  itemText: {
    flex: 1,
    gap: 2,
  },
});

// ── Screen ────────────────────────────────────────────────────────────────────

export function CreateProjectScreen({ navigation }: Props) {
  const { addSite } = useReports();

  // Form state
  const [siteName, setSiteName] = useState('');
  const [location, setLocation] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [stage, setStage] = useState<ConstructionStage>('formwork_erected');

  // GPS state
  const [coords, setCoords] = useState<CapturedCoords | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Submission
  const [submitting, setSubmitting] = useState(false);

  // Auto-capture GPS on mount
  useEffect(() => {
    setGpsLoading(true);
    simulateSiteGps().then((c) => {
      setCoords(c);
      setGpsLoading(false);
    });
  }, []);

  const canSubmit = siteName.trim().length > 0 && location.trim().length > 0 && !!coords;

  const handleCreate = () => {
    if (!canSubmit) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);
    setTimeout(() => {
      const newSite: Site = {
        id: `site-${Date.now()}`,
        name: siteName.trim(),
        location: location.trim(),
        currentStage: stage,
        progressPercent: 0,
        workerCount: parseInt(teamSize, 10) || 0,
        lastReportAt: null,
      };
      addSite(newSite);
      setSubmitting(false);
      navigation.goBack();
    }, 900);
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Site details ────────────────────────────────────────── */}
        <View style={styles.section}>
          <Typography variant="headline" color={colors.textPrimary}>
            Site Details
          </Typography>

          <View style={styles.field}>
            <Typography variant="overline" color={colors.textTertiary} style={styles.label}>
              Site Name
            </Typography>
            <TextInput
              value={siteName}
              onChangeText={setSiteName}
              placeholder="e.g. Kimironko Block C"
              placeholderTextColor={colors.textQuaternary}
              style={styles.input}
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Typography variant="overline" color={colors.textTertiary} style={styles.label}>
              Location / Address
            </Typography>
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="e.g. Kimironko, Gasabo District"
              placeholderTextColor={colors.textQuaternary}
              style={styles.input}
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Typography variant="overline" color={colors.textTertiary} style={styles.label}>
              Initial Team Size
            </Typography>
            <TextInput
              value={teamSize}
              onChangeText={setTeamSize}
              placeholder="Number of workers"
              placeholderTextColor={colors.textQuaternary}
              keyboardType="number-pad"
              style={styles.input}
            />
          </View>
        </View>

        {/* GPS ─────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Typography variant="headline" color={colors.textPrimary}>
            Site Location
          </Typography>

          <View style={[styles.gpsBanner, gpsLoading && styles.gpsBannerLoading]}>
            {gpsLoading ? (
              <>
                <ActivityIndicator size="small" color={colors.accent} />
                <Typography variant="footnote" color={colors.textSecondary}>
                  Capturing GPS coordinates…
                </Typography>
              </>
            ) : coords ? (
              <>
                <View style={styles.gpsIconWrap}>
                  <Ionicons name="location" size={16} color={colors.successText} />
                </View>
                <View style={styles.gpsText}>
                  <Typography variant="subheadMedium" color={colors.successText}>
                    Location captured
                  </Typography>
                  <Typography variant="overline" color={colors.textTertiary}>
                    {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)} · ±{coords.accuracy}m
                  </Typography>
                </View>
              </>
            ) : null}
          </View>

          <TouchableOpacity
            onPress={() => {
              setCoords(null);
              setGpsLoading(true);
              simulateSiteGps().then((c) => { setCoords(c); setGpsLoading(false); });
            }}
            activeOpacity={0.75}
            style={styles.retryGps}
            disabled={gpsLoading}
          >
            <Ionicons name="refresh-outline" size={14} color={gpsLoading ? colors.textQuaternary : colors.accent} />
            <Typography variant="footnote" color={gpsLoading ? colors.textQuaternary : colors.accent}>
              Recapture location
            </Typography>
          </TouchableOpacity>
        </View>

        {/* Starting stage ─────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.stageTitleRow}>
            <Typography variant="headline" color={colors.textPrimary}>
              Starting Stage
            </Typography>
            <Typography variant="footnote" color={colors.textTertiary}>
              Select current progress
            </Typography>
          </View>
          <StagePicker value={stage} onChange={setStage} />
        </View>

        {/* CTA ─────────────────────────────────────────────────── */}
        <Button
          label="Create Project"
          onPress={handleCreate}
          variant="primary"
          size="lg"
          fullWidth
          loading={submitting}
          disabled={!canSubmit || submitting}
          style={styles.cta}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgSecondary,
  },
  content: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[12],
    gap: spacing[6],
  },

  // Sections
  section: {
    gap: spacing[3],
  },

  // Fields
  field: {
    gap: spacing[1] + 2,
  },
  label: {
    letterSpacing: 0.8,
  },
  input: {
    height: 50,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: borderWidths.thin,
    borderColor: colors.separator,
    paddingHorizontal: spacing[4],
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: colors.textPrimary,
  },

  // GPS banner
  gpsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: borderWidths.thin,
    borderColor: colors.successBorder,
    padding: spacing[4],
    minHeight: 56,
  },
  gpsBannerLoading: {
    borderColor: colors.separator,
  },
  gpsIconWrap: {
    width: 28,
    height: 28,
    borderRadius: radii.md,
    backgroundColor: colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsText: {
    flex: 1,
    gap: 2,
  },
  retryGps: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1] + 2,
    alignSelf: 'flex-start',
  },

  // Stage
  stageTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },

  // CTA
  cta: {
    marginTop: spacing[2],
  },
});
