// 8pt grid spacing system
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  xxxxl: 48,
} as const;

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
} as const;

export const avatarSizes = {
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
} as const;

export const iconSizes = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 28,
  xl: 32,
} as const;

export const hitSlop = {
  top: 10,
  bottom: 10,
  left: 10,
  right: 10,
} as const;

export type SpacingName = keyof typeof spacing;
export type BorderRadiusName = keyof typeof borderRadius;
export type AvatarSizeName = keyof typeof avatarSizes;
