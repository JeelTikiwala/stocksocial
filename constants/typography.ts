import { TextStyle } from 'react-native';

export const fontFamilies = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semiBold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
  mono: 'SpaceMono-Regular',
} as const;

type TypographyStyle = Pick<
  TextStyle,
  'fontSize' | 'fontWeight' | 'letterSpacing' | 'lineHeight' | 'textTransform' | 'fontFamily'
>;

export const typography: Record<string, TypographyStyle> = {
  h1: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    fontFamily: fontFamilies.bold,
  },
  h2: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    fontFamily: fontFamilies.bold,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: fontFamilies.semiBold,
  },
  h4: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fontFamilies.semiBold,
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
    fontFamily: fontFamilies.regular,
  },
  bodyMd: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: fontFamilies.medium,
  },
  small: {
    fontSize: 13,
    fontWeight: '400',
    fontFamily: fontFamilies.regular,
  },
  smallMd: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: fontFamilies.medium,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontFamily: fontFamilies.semiBold,
  },
  mono: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fontFamilies.mono,
  },
} as const;

export type TypographyName = keyof typeof typography;
