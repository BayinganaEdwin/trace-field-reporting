// 4pt base grid — all spacing is a multiple of 4.
export const spacing = {
  px:  1,
  0.5: 2,
  1:   4,
  1.5: 6,
  2:   8,
  2.5: 10,
  3:   12,
  4:   16,
  5:   20,
  6:   24,
  7:   28,
  8:   32,
  10:  40,
  12:  48,
  14:  56,
  16:  64,
} as const;

export const radii = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  '2xl':24,
  full: 9999,
} as const;

export const borderWidths = {
  hairline: 0.5,
  thin:     1,
  base:     1.5,
  thick:    2,
} as const;

// Layout constants
export const layout = {
  screenPaddingH:    16,
  screenPaddingTop:   8,
  screenPaddingBottom:24,
  cardPaddingH:      16,
  cardPaddingV:      14,
  sectionGap:        24,
  listItemGap:        8,
  tabBarHeight:      82,  // includes safe-area bottom padding
} as const;
