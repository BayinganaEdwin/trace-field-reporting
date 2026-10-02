// Design system — light mode only
// Palette rationale: warm off-white canvas + deep navy accent + rich ink text.
// Backgrounds feel like premium paper, not iOS system defaults.
// Status colors: muted tints with strong, readable text — inspired by Linear/Craft.

export const colors = {
  // ── Backgrounds ─────────────────────────────────────────────
  // Warm off-white: immediately distinctive vs. the cold iOS system gray.
  // Every premium mobile app (Bear, Craft, Linear) uses a warm canvas.
  bgPrimary:   '#FFFFFF',
  bgSecondary: '#F7F6F2',   // warm cream — not #F2F2F7
  bgGrouped:   '#F7F6F2',

  // ── Surfaces ────────────────────────────────────────────────
  surface:         '#FFFFFF',
  surfaceElevated: '#FAFAF8',  // very slightly warm elevated surface

  // ── Text ────────────────────────────────────────────────────
  textPrimary:    '#0F0F14',  // rich near-black — more depth than #1C1C1E
  textSecondary:  '#5B5967',  // warm medium gray
  textTertiary:   '#918FA0',  // warm light gray
  textQuaternary: '#C5C3CC',
  textInverse:    '#FFFFFF',
  textLink:       '#1B3F7A',

  // ── Separators ──────────────────────────────────────────────
  separator:       '#EDEDEA',  // warm hairline (was cold #E5E5EA)
  separatorOpaque: '#CCCAC2',  // warm opaque

  // ── Accent — deep navy-blue (precision, trust, authority) ───
  accent:      '#1B3F7A',
  accentMid:   '#2B5CB8',
  accentLight: '#EDF2FC',
  accentDark:  '#0F2348',

  // ── Semantic status — curated tints, no generic pastels ─────
  //
  // Warning (flagged): deep amber-brown on barely-there warm tint
  warningText:   '#7A4B00',
  warningBg:     '#FFF8EB',
  warningBorder: '#F5D489',

  // Success (verified, approved): forest green on ultra-light mint
  successText:   '#14673A',
  successBg:     '#EEFAF3',
  successBorder: '#6EDD9E',

  // Danger: crisp red, not muddy
  dangerText:    '#C11D1D',
  dangerBg:      '#FFF1F1',
  dangerBorder:  '#F7A3A3',

  // Info: rich blue aligned with accent direction
  infoText:      '#154EA8',
  infoBg:        '#EEF5FF',
  infoBorder:    '#A8C8FA',

  // ── UI chrome ───────────────────────────────────────────────
  tabBarBg:      '#FFFFFF',
  tabBarActive:  '#1B3F7A',
  tabBarInactive:'#9E9CB3',  // warmer, more personality than #8E8E93

  overlay:     'rgba(0,0,0,0.4)',
  overlayLight:'rgba(0,0,0,0.06)',
} as const;

export type ColorKey = keyof typeof colors;
