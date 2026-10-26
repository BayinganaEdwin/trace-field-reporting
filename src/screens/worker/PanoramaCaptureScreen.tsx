/**
 * PanoramaCaptureScreen
 *
 * Guided multi-angle capture: Left → Center → Right.
 * Each position shows a simulated camera viewfinder with a target frame guide.
 * After all 3 captures the user taps "Use Photos" to return the URIs to the
 * caller (SubmitReportScreen).
 */
import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { colors } from '../../theme/colors';
import { spacing, radii, borderWidths } from '../../theme/spacing';
import type { WorkerStackParamList } from '../../types';

type Props = NativeStackScreenProps<WorkerStackParamList, 'PanoramaCapture'>;

// ── Position config ───────────────────────────────────────────────────────────

interface CapturePosition {
  id: 'left' | 'center' | 'right';
  label: string;
  hint: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  arrowDir: 'left' | 'none' | 'right';
}

const POSITIONS: CapturePosition[] = [
  {
    id: 'left',
    label: 'Left Angle',
    hint: 'Pan left — capture the left quarter of the structure',
    icon: 'arrow-back-outline',
    arrowDir: 'left',
  },
  {
    id: 'center',
    label: 'Centre',
    hint: 'Face the structure head-on from the centre',
    icon: 'radio-button-on-outline',
    arrowDir: 'none',
  },
  {
    id: 'right',
    label: 'Right Angle',
    hint: 'Pan right — capture the right quarter of the structure',
    icon: 'arrow-forward-outline',
    arrowDir: 'right',
  },
];

// ── Viewfinder ────────────────────────────────────────────────────────────────

interface ViewfinderProps {
  captured: boolean;
  arrowDir: 'left' | 'none' | 'right';
  uri: string | null;
}

function Viewfinder({ captured, arrowDir, uri }: ViewfinderProps) {
  return (
    <View style={viewfinder.wrap}>
      {/* Simulated camera feed (dark bg) */}
      <View style={viewfinder.frame}>
        {captured && uri ? (
          // Show a "captured" success overlay
          <View style={viewfinder.successOverlay}>
            <View style={viewfinder.successCircle}>
              <Ionicons name="checkmark" size={32} color={colors.textInverse} />
            </View>
          </View>
        ) : (
          <>
            {/* Corner guides */}
            <View style={[viewfinder.corner, viewfinder.topLeft]} />
            <View style={[viewfinder.corner, viewfinder.topRight]} />
            <View style={[viewfinder.corner, viewfinder.bottomLeft]} />
            <View style={[viewfinder.corner, viewfinder.bottomRight]} />

            {/* Direction arrow overlay */}
            {arrowDir !== 'none' && (
              <View style={viewfinder.arrowWrap}>
                <Ionicons
                  name={arrowDir === 'left' ? 'chevron-back' : 'chevron-forward'}
                  size={28}
                  color="rgba(255,255,255,0.5)"
                />
              </View>
            )}

            {/* Centre reticle */}
            <View style={viewfinder.reticle}>
              <View style={viewfinder.reticleH} />
              <View style={viewfinder.reticleV} />
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const CORNER_SIZE = 18;
const CORNER_THICK = 2.5;

const viewfinder = StyleSheet.create({
  wrap: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: radii.xl,
    overflow: 'hidden',
  },
  frame: {
    flex: 1,
    backgroundColor: '#0E0E12',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  // Corner guide marks
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  topLeft: {
    top: 20,
    left: 20,
    borderTopWidth: CORNER_THICK,
    borderLeftWidth: CORNER_THICK,
    borderTopLeftRadius: 4,
  },
  topRight: {
    top: 20,
    right: 20,
    borderTopWidth: CORNER_THICK,
    borderRightWidth: CORNER_THICK,
    borderTopRightRadius: 4,
  },
  bottomLeft: {
    bottom: 20,
    left: 20,
    borderBottomWidth: CORNER_THICK,
    borderLeftWidth: CORNER_THICK,
    borderBottomLeftRadius: 4,
  },
  bottomRight: {
    bottom: 20,
    right: 20,
    borderBottomWidth: CORNER_THICK,
    borderRightWidth: CORNER_THICK,
    borderBottomRightRadius: 4,
  },

  // Direction arrow
  arrowWrap: {
    position: 'absolute',
  },

  // Centre reticle
  reticle: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticleH: {
    position: 'absolute',
    width: 24,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  reticleV: {
    position: 'absolute',
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },

  // Captured state
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 103, 58, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.successText,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ── Progress steps ────────────────────────────────────────────────────────────

interface StepDotProps {
  label: string;
  status: 'done' | 'active' | 'pending';
}

function StepDot({ label, status }: StepDotProps) {
  const bg =
    status === 'done'
      ? colors.successText
      : status === 'active'
      ? colors.accent
      : colors.separator;

  const textColor =
    status === 'done'
      ? colors.successText
      : status === 'active'
      ? colors.accent
      : colors.textQuaternary;

  return (
    <View style={steps.step}>
      <View style={[steps.dot, { backgroundColor: bg }]}>
        {status === 'done' ? (
          <Ionicons name="checkmark" size={12} color={colors.textInverse} />
        ) : status === 'active' ? (
          <View style={steps.activePip} />
        ) : null}
      </View>
      <Typography variant="overline" color={textColor} style={steps.stepLabel}>
        {label}
      </Typography>
    </View>
  );
}

const steps = StyleSheet.create({
  step: {
    alignItems: 'center',
    gap: spacing[1],
    flex: 1,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePip: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.textInverse,
  },
  stepLabel: {
    textAlign: 'center',
  },
});

// ── Screen ────────────────────────────────────────────────────────────────────

export function PanoramaCaptureScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { onCaptures } = route.params;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [captures, setCaptures] = useState<(string | null)[]>([null, null, null]);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const currentPos = POSITIONS[currentIdx];
  const currentUri = captures[currentIdx];
  const allDone = captures.every((c) => c !== null);

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 4, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleCapture = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      const updated = [...captures];
      updated[currentIdx] = uri;
      setCaptures(updated);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Advance to next uncaptured position after a brief moment
      if (currentIdx < POSITIONS.length - 1) {
        setTimeout(() => {
          const nextUncaptured = updated.findIndex((c, i) => i > currentIdx && c === null);
          if (nextUncaptured !== -1) setCurrentIdx(nextUncaptured);
        }, 700);
      }
    }
  };

  const handleUsePhotos = () => {
    const uris = captures.filter(Boolean) as string[];
    onCaptures(uris);
    navigation.goBack();
  };

  const getStatus = (idx: number): 'done' | 'active' | 'pending' => {
    if (captures[idx]) return 'done';
    if (idx === currentIdx) return 'active';
    return 'pending';
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress steps */}
        <View style={styles.progressRow}>
          {POSITIONS.map((pos, idx) => (
            <React.Fragment key={pos.id}>
              <StepDot label={pos.label} status={getStatus(idx)} />
              {idx < POSITIONS.length - 1 && (
                <View
                  style={[
                    styles.progressConnector,
                    !!captures[idx] && styles.progressConnectorDone,
                  ]}
                />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Position selector tabs */}
        <View style={styles.posTabs}>
          {POSITIONS.map((pos, idx) => {
            const active = idx === currentIdx;
            return (
              <TouchableOpacity
                key={pos.id}
                onPress={() => { Haptics.selectionAsync(); setCurrentIdx(idx); }}
                activeOpacity={0.75}
                style={[styles.posTab, active && styles.posTabActive]}
              >
                <Ionicons
                  name={pos.icon}
                  size={16}
                  color={active ? colors.textInverse : colors.textTertiary}
                />
                <Typography
                  variant="footnote"
                  color={active ? colors.textInverse : colors.textTertiary}
                >
                  {pos.label}
                </Typography>
                {captures[idx] && (
                  <View style={styles.capturedDot} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Hint */}
        <View style={styles.hintRow}>
          <Ionicons name="information-circle-outline" size={14} color={colors.textTertiary} />
          <Typography variant="footnote" color={colors.textTertiary} style={styles.hintText}>
            {currentPos.hint}
          </Typography>
        </View>

        {/* Viewfinder */}
        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
          <Viewfinder
            captured={!!currentUri}
            arrowDir={currentPos.arrowDir}
            uri={currentUri}
          />
        </Animated.View>

        {/* Capture button */}
        {!currentUri ? (
          <TouchableOpacity
            onPress={handleCapture}
            activeOpacity={0.85}
            style={styles.captureBtn}
          >
            <View style={styles.captureBtnInner}>
              <Ionicons name="camera" size={22} color={colors.textInverse} />
            </View>
            <Typography variant="subheadMedium" color={colors.textPrimary} style={styles.captureBtnLabel}>
              Capture {currentPos.label}
            </Typography>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              const updated = [...captures];
              updated[currentIdx] = null;
              setCaptures(updated);
            }}
            activeOpacity={0.75}
            style={styles.retakeBtn}
          >
            <Ionicons name="refresh-outline" size={16} color={colors.accent} />
            <Typography variant="subheadMedium" color={colors.accent}>
              Retake
            </Typography>
          </TouchableOpacity>
        )}

        {/* Thumbnails row */}
        <View style={styles.thumbsRow}>
          {POSITIONS.map((pos, idx) => (
            <TouchableOpacity
              key={pos.id}
              onPress={() => { Haptics.selectionAsync(); setCurrentIdx(idx); }}
              activeOpacity={0.8}
              style={[
                styles.thumb,
                idx === currentIdx && styles.thumbActive,
                !!captures[idx] && styles.thumbCaptured,
              ]}
            >
              {captures[idx] ? (
                <Ionicons name="checkmark-circle" size={18} color={colors.successText} />
              ) : (
                <Ionicons
                  name={pos.icon}
                  size={16}
                  color={idx === currentIdx ? colors.accent : colors.textTertiary}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Use photos CTA */}
        <Button
          label={allDone ? 'Use 3 Photos' : `${captures.filter(Boolean).length}/3 captured`}
          onPress={handleUsePhotos}
          variant="primary"
          size="lg"
          fullWidth
          disabled={!allDone}
          style={styles.useCta}
        />
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
  content: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[10],
    gap: spacing[4],
  },

  // Progress
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing[2],
  },
  progressConnector: {
    flex: 1,
    height: 2,
    backgroundColor: colors.separator,
    marginHorizontal: spacing[1],
  },
  progressConnectorDone: {
    backgroundColor: colors.successText,
  },

  // Position tabs
  posTabs: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  posTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1] + 2,
    paddingVertical: spacing[2],
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: borderWidths.thin,
    borderColor: colors.separator,
    position: 'relative',
  },
  posTabActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  capturedDot: {
    position: 'absolute',
    top: 4,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.successText,
  },

  // Hint
  hintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  hintText: {
    flex: 1,
    lineHeight: 18,
  },

  // Capture button
  captureBtn: {
    alignItems: 'center',
    gap: spacing[2],
  },
  captureBtnInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.accentDark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
    }),
  },
  captureBtnLabel: {
    letterSpacing: 0.2,
  },

  // Retake
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    backgroundColor: colors.accentLight,
    borderRadius: radii.lg,
  },

  // Thumbnails
  thumbsRow: {
    flexDirection: 'row',
    gap: spacing[3],
    justifyContent: 'center',
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: borderWidths.thin,
    borderColor: colors.separator,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentLight,
  },
  thumbCaptured: {
    borderColor: colors.successBorder,
    backgroundColor: colors.successBg,
  },

  // CTA
  useCta: {
    marginTop: spacing[2],
  },
});
