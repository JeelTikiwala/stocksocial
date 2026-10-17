export const colors = {
  // Primary brand — champagne gold + deep indigo
  gold: '#B8965A',
  goldLight: '#F5EDD8',
  goldMuted: '#D4B483',
  indigo: '#1B2159',
  indigoLight: '#ECEFFE',

  // Neutrals — warm obsidian to ivory
  white: '#FFFFFF',
  offWhite: '#FAF8F5',
  surface: '#FFFFFF',
  border: '#E2DEDD',
  borderLight: '#EDE9E8',

  // Text — warm, not cold
  textPrimary: '#0F0D0C',
  textSecondary: '#5C5650',
  textTertiary: '#8C8480',

  // Semantic
  gain: '#1A7A4A',
  gainBg: '#E3F5EC',
  loss: '#B83232',
  lossBg: '#FAEAEA',
  warning: '#C47B1A',
  neutral: '#7A7268',

  // Backward-compatible aliases used across existing UI
  teal: '#1E7E9A',
  tealLight: '#E3F3F7',
  purple: '#7B3FA0',
  purpleLight: '#F1E9F7',

  // Chart palette — 12 jewel tones, rich and distinct
  chart: [
    '#1B2159', // deep indigo
    '#B8965A', // champagne gold
    '#2B6CB0', // sapphire
    '#1A7A4A', // emerald
    '#7B3FA0', // amethyst
    '#B83232', // ruby
    '#1E7E9A', // teal jade
    '#C47B1A', // amber
    '#4A5568', // graphite
    '#8B5E3C', // bronze
    '#2D6A6A', // patina
    '#9C3D6E', // garnet
  ] as const,
  chartOther: '#BDB5AE',

  // Input backgrounds
  inputBg: '#F0EDE9',

  // Transparent
  transparent: 'transparent',
  overlay: 'rgba(15, 13, 12, 0.55)',
} as const;

export type ColorName = keyof typeof colors;
