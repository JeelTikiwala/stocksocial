export const colors = {
  // One calm brand color. Keeping the legacy aliases avoids visual noise without
  // forcing feature components to know about a second palette.
  gold: '#0F766E',
  goldLight: '#E7F4F2',
  goldMuted: '#5FA49D',
  indigo: '#102A2E',
  indigoLight: '#E7F4F2',

  // Neutrals — warm obsidian to ivory
  white: '#FFFFFF',
  offWhite: '#F7F8F7',
  surface: '#FFFFFF',
  border: '#E4E8E7',
  borderLight: '#EEF1F0',

  // Text — warm, not cold
  textPrimary: '#14211F',
  textSecondary: '#5E6B68',
  textTertiary: '#8A9693',

  // Semantic
  gain: '#1A7A4A',
  gainBg: '#E3F5EC',
  loss: '#B83232',
  lossBg: '#FAEAEA',
  warning: '#C47B1A',
  neutral: '#7A7268',

  // Backward-compatible aliases used across existing UI
  teal: '#0F766E',
  tealLight: '#E7F4F2',
  purple: '#0F766E',
  purpleLight: '#E7F4F2',

  // Chart palette — 12 jewel tones, rich and distinct
  chart: [
    '#0F766E', '#4F8F88', '#77A9A3', '#9BC0BC',
    '#355C59', '#69817E', '#91A39F', '#B7C5C2',
    '#526D69', '#78928E', '#A5B5B2', '#CAD4D2',
  ] as const,
  chartOther: '#BDB5AE',

  // Input backgrounds
  inputBg: '#EEF1F0',

  // Transparent
  transparent: 'transparent',
  overlay: 'rgba(15, 13, 12, 0.55)',
} as const;

export type ColorName = keyof typeof colors;
