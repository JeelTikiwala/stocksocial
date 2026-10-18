/** Glassmorphism tokens — translucent surfaces over a soft gradient background. */
export const glass = {
  surface: 'rgba(255, 255, 255, 0.55)',
  surfaceStrong: 'rgba(255, 255, 255, 0.72)',
  surfaceSoft: 'rgba(255, 255, 255, 0.38)',
  border: 'rgba(255, 255, 255, 0.65)',
  borderDark: 'rgba(15, 13, 12, 0.06)',
  blurIntensity: 38,
  tabBarBlur: 55,
  shadow: {
    shadowColor: '#1B2159',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  /** Background gradient + colour blobs the blur has something to diffuse. */
  gradient: ['#F4F1FF', '#FAF8F5', '#F6F3EC'] as const,
  blobs: [
    { color: '#1B2159', opacity: 0.16, size: 360, top: -140, left: -120 },
    { color: '#B8965A', opacity: 0.2, size: 320, top: 180, right: -160 },
    { color: '#1E7E9A', opacity: 0.14, size: 300, bottom: 120, left: -110 },
    { color: '#7B3FA0', opacity: 0.1, size: 260, bottom: -80, right: -60 },
  ],
} as const;

/** Space screens must leave for the floating tab bar (bar + margin). */
export const FLOATING_TAB_BAR_HEIGHT = 64;
export const TAB_BAR_SPACE = FLOATING_TAB_BAR_HEIGHT + 36;
