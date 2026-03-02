// Font configuration for the app
export const FONTS = {
  regular: 'Futura Light',
  medium: 'futura', 
  semiBold: 'Futura Medium',
  bold: 'futura',
  heavy: 'Futura Heavy',
  black: 'Futura Extra Black',
};

export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  base: 14,
  lg: 16,
  xl: 18,
  '2xl': 20,
  '3xl': 24,
  '4xl': 28,
  '5xl': 32,
};

export const TYPOGRAPHY = {
  heading1: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES['4xl'],
    lineHeight: 36,
  },
  heading2: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES['3xl'],
    lineHeight: 32,
  },
  heading3: {
    fontFamily: FONTS.semiBold,
    fontSize: FONT_SIZES.xl,
    lineHeight: 28,
  },
  body: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.base,
    lineHeight: 22,
  },
  bodyMedium: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.base,
    lineHeight: 22,
  },
  caption: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    lineHeight: 18,
  },
  button: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.base,
    lineHeight: 20,
  },
};

export default { FONTS, FONT_SIZES, TYPOGRAPHY };