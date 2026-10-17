import { TextStyle } from 'react-native';

type TypographyStyle = Pick<
  TextStyle,
  'fontSize' | 'fontWeight' | 'letterSpacing' | 'lineHeight' | 'textTransform'
>;

export const typography: Record<string, TypographyStyle> = {
  h1: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
  },
  h4: {
    fontSize: 16,
    fontWeight: '600',
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
  },
  bodyMd: {
    fontSize: 15,
    fontWeight: '500',
  },
  small: {
    fontSize: 13,
    fontWeight: '400',
  },
  smallMd: {
    fontSize: 13,
    fontWeight: '500',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  mono: {
    fontSize: 14,
    fontWeight: '600',
  },
} as const;

export type TypographyName = keyof typeof typography;
