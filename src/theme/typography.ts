// DM Sans — geometric, Apple-adjacent, designed for UI legibility.
// Weights: 400 Regular, 500 Medium, 600 SemiBold, 700 Bold.

export const fontFamilies = {
  regular:   'DMSans_400Regular',
  medium:    'DMSans_500Medium',
  semiBold:  'DMSans_700Bold',
  bold:      'DMSans_700Bold',
} as const;

export const fontSizes = {
  xs:   11,
  sm:   13,
  base: 15,
  md:   17,
  lg:   20,
  xl:   24,
  '2xl':28,
  '3xl':34,
} as const;

export const lineHeights = {
  tight:  1.15,
  snug:   1.3,
  normal: 1.5,
  relaxed:1.65,
} as const;

export const letterSpacings = {
  tight:  -0.3,
  normal:  0,
  wide:    0.4,
  wider:   0.8,
  widest:  1.2,
} as const;

// Pre-composed text style variants — use via the <Text> component
export const textVariants = {
  largeTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes['3xl'],
    lineHeight: fontSizes['3xl'] * lineHeights.tight,
    letterSpacing: letterSpacings.tight,
  },
  title1: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes['2xl'],
    lineHeight: fontSizes['2xl'] * lineHeights.snug,
    letterSpacing: letterSpacings.tight,
  },
  title2: {
    fontFamily: fontFamilies.semiBold,
    fontSize: fontSizes.xl,
    lineHeight: fontSizes.xl * lineHeights.snug,
    letterSpacing: letterSpacings.tight,
  },
  title3: {
    fontFamily: fontFamilies.semiBold,
    fontSize: fontSizes.lg,
    lineHeight: fontSizes.lg * lineHeights.snug,
  },
  headline: {
    fontFamily: fontFamilies.semiBold,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.snug,
  },
  body: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.normal,
  },
  bodyMedium: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.normal,
  },
  callout: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.snug,
  },
  subhead: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
  },
  subheadMedium: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
  },
  footnote: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.xs,
    lineHeight: fontSizes.xs * lineHeights.normal,
  },
  footnoteSemiBold: {
    fontFamily: fontFamilies.semiBold,
    fontSize: fontSizes.xs,
    lineHeight: fontSizes.xs * lineHeights.normal,
  },
  // Uppercase label — used for section headers, status chips
  overline: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 10,
    lineHeight: 10 * lineHeights.normal,
    letterSpacing: letterSpacings.widest,
    textTransform: 'uppercase' as const,
  },
  // Monospaced — used for IDs, code snippets
  mono: {
    fontFamily: 'Courier',
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
    letterSpacing: letterSpacings.wide,
  },
} as const;

export type TextVariant = keyof typeof textVariants;
