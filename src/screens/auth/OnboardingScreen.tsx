/**
 * OnboardingScreen.tsx
 *
 * Three-slide first-run onboarding. Each slide has a full-bleed illustrated
 * gradient hero, a headline, body copy, and a page indicator. Users can swipe
 * or tap "Next". On the final slide the CTA switches to "Get Started" which
 * navigates to Signup. A "Skip" link on all slides goes directly to Login.
 */

import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { colors } from '../../theme/colors';
import { spacing, radii } from '../../theme/spacing';
import type { RootStackParamList } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const { width: SCREEN_W } = Dimensions.get('window');

interface Slide {
  id: string;
  gradient: [string, string, string]; // top → bottom
  icon: string;
  iconBg: string;
  headline: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    id: 'report',
    gradient: ['#0F2348', '#1B3F7A', '#2B5CB8'],
    icon: 'camera-outline',
    iconBg: 'rgba(255,255,255,0.12)',
    headline: 'Capture Every Stage',
    body: 'Submit geo-tagged photo reports directly from the construction site — no desk, no delays. One photo, one tap.',
  },
  {
    id: 'ai',
    gradient: ['#0A3326', '#14673A', '#22A05B'],
    icon: 'shield-checkmark-outline',
    iconBg: 'rgba(255,255,255,0.12)',
    headline: 'AI Verifies Instantly',
    body: 'MobileNetV2 cross-checks your photo against the declared construction stage — on-device, even without connectivity.',
  },
  {
    id: 'manage',
    gradient: ['#3B1E00', '#7A4B00', '#D97706'],
    icon: 'bar-chart-outline',
    iconBg: 'rgba(255,255,255,0.12)',
    headline: 'Managers Stay in Control',
    body: 'Project managers get a live dashboard of verified and flagged reports with one-tap approve or flag — complete audit trail included.',
  },
];

export function OnboardingScreen({ navigation }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const goTo = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * SCREEN_W, animated: true });
    setActiveIndex(index);
    Haptics.selectionAsync();
  };

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      goTo(activeIndex + 1);
    } else {
      navigation.replace('Signup');
    }
  };

  const handleSkip = () => {
    navigation.replace('Login');
  };

  const handleScroll = (e: any) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (newIndex !== activeIndex) setActiveIndex(newIndex);
  };

  const slide = SLIDES[activeIndex];

  return (
    <View style={styles.root}>
      {/* Hero slides — horizontal scroll snap */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {SLIDES.map((s) => (
          <View key={s.id} style={[styles.slide, { width: SCREEN_W }]}>
            {/* Gradient background — simulated with layered views */}
            <View style={[styles.gradientBg, { backgroundColor: s.gradient[0] }]}>
              <View style={[styles.gradientMid, { backgroundColor: s.gradient[1] }]} />
              <View style={[styles.gradientBot, { backgroundColor: s.gradient[2] }]} />
            </View>

            {/* Large icon mark */}
            <View style={styles.heroCenter}>
              <View style={[styles.iconCircleOuter, { borderColor: 'rgba(255,255,255,0.1)' }]}>
                <View style={[styles.iconCircleInner, { backgroundColor: s.iconBg }]}>
                  <Ionicons name={s.icon as any} size={56} color="rgba(255,255,255,0.95)" />
                </View>
              </View>

              {/* Decorative rings */}
              <View style={styles.ring1} />
              <View style={styles.ring2} />
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Content panel — sits over the bottom half */}
      <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.panel}>
        {/* Skip */}
        <TouchableOpacity
          onPress={handleSkip}
          style={styles.skipBtn}
          activeOpacity={0.7}
        >
          <Typography variant="footnote" color={colors.textTertiary}>
            Skip
          </Typography>
        </TouchableOpacity>

        {/* Text */}
        <View style={styles.textBlock}>
          <Typography variant="title1" color={colors.textPrimary} style={styles.headline}>
            {slide.headline}
          </Typography>
          <Typography
            variant="body"
            color={colors.textSecondary}
            style={styles.bodyText}
          >
            {slide.body}
          </Typography>
        </View>

        {/* Page dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goTo(i)} hitSlop={8}>
              <View
                style={[
                  styles.dot,
                  i === activeIndex ? styles.dotActive : styles.dotInactive,
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* CTA */}
        <Button
          label={activeIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          onPress={handleNext}
          variant="primary"
          size="lg"
          fullWidth
          style={styles.cta}
        />

        {/* Already have account */}
        {activeIndex === SLIDES.length - 1 && (
          <TouchableOpacity onPress={handleSkip} style={styles.loginLink} activeOpacity={0.7}>
            <Typography variant="footnote" color={colors.textSecondary} align="center">
              Already have an account?{' '}
              <Typography variant="footnoteSemiBold" color={colors.accent}>
                Sign in
              </Typography>
            </Typography>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  scrollView: {
    flex: 1,
  },

  // ── Slide / gradient ─────────────────────────────────────────
  slide: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
    opacity: 1,
  },
  gradientMid: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '25%',
    bottom: 0,
    opacity: 0.7,
  },
  gradientBot: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '60%',
    bottom: 0,
    opacity: 0.5,
  },
  heroCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleOuter: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  iconCircleInner: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring1: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  ring2: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 180,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },

  // ── Content panel ────────────────────────────────────────────
  panel: {
    backgroundColor: colors.bgPrimary,
    borderTopLeftRadius: radii['2xl'] + 4,
    borderTopRightRadius: radii['2xl'] + 4,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[6],
    paddingBottom: spacing[4],
    // Overlap the hero
    marginTop: -32,
    // Shadow going upward
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -8 },
    elevation: 8,
  },
  skipBtn: {
    alignSelf: 'flex-end',
    paddingVertical: spacing[1],
    marginBottom: spacing[4],
  },
  textBlock: {
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  headline: {
    letterSpacing: -0.5,
  },
  bodyText: {
    lineHeight: 24,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[5],
  },
  dot: {
    height: 6,
    borderRadius: radii.full,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.accent,
  },
  dotInactive: {
    width: 6,
    backgroundColor: colors.separator,
  },
  cta: {},
  loginLink: {
    marginTop: spacing[4],
  },
});
