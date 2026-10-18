import React from 'react';
import { Svg, Path } from 'react-native-svg';
import { colors, iconSizes } from '@/constants';

// Common icons used throughout the app

interface IconProps {
  size?: number;
  color?: string;
}

export const HomeIcon: React.FC<IconProps> = ({
  size = iconSizes.md,
  color = colors.textSecondary,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9 22V12H15V22"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
export const GlobeIcon: React.FC<IconProps> = ({
  size = iconSizes.md,
  color = colors.textSecondary,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M2 12H22"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
export const PieChartIcon: React.FC<IconProps> = ({
  size = iconSizes.md,
  color = colors.textSecondary,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21.21 15.89C20.5738 17.3945 19.5788 18.7202 18.3119 19.7513C17.0449 20.7824 15.5447 21.4874 13.9424 21.8048C12.3401 22.1221 10.6844 22.0421 9.12012 21.5718C7.55585 21.1014 6.1306 20.255 4.96893 19.1067C3.80725 17.9583 2.94479 16.5428 2.45661 14.984C1.96843 13.4252 1.86954 11.7706 2.16857 10.1647C2.46761 8.55886 3.15547 7.05071 4.17202 5.77211C5.18857 4.49351 6.50286 3.48332 8 2.83"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M22 12C22 10.6868 21.7413 9.38642 21.2388 8.17317C20.7362 6.95991 19.9997 5.85752 19.0711 4.92893C18.1425 4.00035 17.0401 3.26375 15.8268 2.7612C14.6136 2.25866 13.3132 2 12 2V12H22Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const TrendingIcon: React.FC<IconProps> = ({
  size = iconSizes.md,
  color = colors.textSecondary,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M22 7L13.5 15.5L8.5 10.5L2 17"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M16 7H22V13"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const UsersIcon: React.FC<IconProps> = ({
  size = iconSizes.md,
  color = colors.textSecondary,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M23 21V19C22.9993 18.1127 22.7034 17.2509 22.1582 16.5508C21.6131 15.8508 20.8508 15.3506 20 15.13"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M16 3.13C16.8523 3.34822 17.6169 3.84888 18.1633 4.55005C18.7098 5.25122 19.0067 6.11479 19.0067 7.00497C19.0067 7.89515 18.7098 8.75872 18.1633 9.45989C17.6169 10.1611 16.8523 10.6618 16 10.88"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const HeartIcon: React.FC<IconProps & { filled?: boolean }> = ({
  size = iconSizes.md,
  color = colors.textSecondary,
  filled = false,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'}>
    <Path
      d="M20.84 4.61C20.3292 4.09924 19.7228 3.69394 19.0554 3.41728C18.3879 3.14061 17.6725 2.99822 16.95 2.99822C16.2275 2.99822 15.5121 3.14061 14.8446 3.41728C14.1772 3.69394 13.5708 4.09924 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.57831 8.50903 2.99871 7.05 2.99871C5.59096 2.99871 4.19169 3.57831 3.16 4.61C2.1283 5.64169 1.54871 7.04097 1.54871 8.5C1.54871 9.95903 2.1283 11.3583 3.16 12.39L4.22 13.45L12 21.23L19.78 13.45L20.84 12.39C21.3508 11.8792 21.7561 11.2728 22.0327 10.6054C22.3094 9.93791 22.4518 9.22249 22.4518 8.5C22.4518 7.77751 22.3094 7.06209 22.0327 6.39465C21.7561 5.72721 21.3508 5.12076 20.84 4.61Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const MessageIcon: React.FC<IconProps> = ({
  size = iconSizes.md,
  color = colors.textSecondary,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ShareIcon: React.FC<IconProps> = ({
  size = iconSizes.md,
  color = colors.textSecondary,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M22 2L11 13"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M22 2L15 22L11 13L2 9L22 2Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const BookmarkIcon: React.FC<IconProps & { filled?: boolean }> = ({
  size = iconSizes.md,
  color = colors.textSecondary,
  filled = false,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'}>
    <Path
      d="M19 21L12 16L5 21V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H17C17.5304 3 18.0391 3.21071 18.4142 3.58579C18.7893 3.96086 19 4.46957 19 5V21Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ArrowLeftIcon: React.FC<IconProps> = ({
  size = iconSizes.md,
  color = colors.textPrimary,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 12H5"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 19L5 12L12 5"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const CheckIcon: React.FC<IconProps> = ({
  size = iconSizes.md,
  color = colors.teal,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 6L9 17L4 12"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ---- Delta zone & tool icons ----

export const ZapIcon: React.FC<IconProps> = ({ size = iconSizes.md, color = colors.textSecondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ClockIcon: React.FC<IconProps> = ({ size = iconSizes.md, color = colors.textSecondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke={color} strokeWidth={2} />
    <Path d="M12 6V12L16 14" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ShieldIcon: React.FC<IconProps> = ({ size = iconSizes.md, color = colors.textSecondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const LayersIcon: React.FC<IconProps> = ({ size = iconSizes.md, color = colors.textSecondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2L2 7L12 12L22 7L12 2Z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M2 17L12 22L22 17" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M2 12L12 17L22 12" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const GridIcon: React.FC<IconProps> = ({ size = iconSizes.md, color = colors.textSecondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 3H10V10H3V3Z M14 3H21V10H14V3Z M14 14H21V21H14V14Z M3 14H10V21H3V14Z" stroke={color} strokeWidth={2} strokeLinejoin="round" />
  </Svg>
);

export const SettingsIcon: React.FC<IconProps> = ({ size = iconSizes.md, color = colors.textSecondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke={color} strokeWidth={2} />
    <Path d="M19.4 15C19.1277 15.6171 19.2583 16.3378 19.73 16.82L19.79 16.88C20.1656 17.2551 20.3766 17.7642 20.3766 18.295C20.3766 18.8258 20.1656 19.3349 19.79 19.71C19.4149 20.0856 18.9058 20.2966 18.375 20.2966C17.8442 20.2966 17.3351 20.0856 16.96 19.71L16.9 19.65C16.4178 19.1783 15.6971 19.0477 15.08 19.32C14.4755 19.5791 14.0826 20.1724 14.08 20.83V21C14.08 22.1046 13.1846 23 12.08 23C10.9754 23 10.08 22.1046 10.08 21V20.91C10.0642 20.2327 9.63587 19.6339 9 19.4C8.38291 19.1277 7.66219 19.2583 7.18 19.73L7.12 19.79C6.74486 20.1656 6.23582 20.3766 5.705 20.3766C5.17418 20.3766 4.66514 20.1656 4.29 19.79C3.91445 19.4149 3.70343 18.9058 3.70343 18.375C3.70343 17.8442 3.91445 17.3351 4.29 16.96L4.35 16.9C4.82167 16.4178 4.95235 15.6971 4.68 15.08C4.42093 14.4755 3.82764 14.0826 3.17 14.08H3C1.89543 14.08 1 13.1846 1 12.08C1 10.9754 1.89543 10.08 3 10.08H3.09C3.76733 10.0642 4.36613 9.63587 4.6 9C4.87235 8.38291 4.74167 7.66219 4.27 7.18L4.21 7.12C3.83445 6.74486 3.62343 6.23582 3.62343 5.705C3.62343 5.17418 3.83445 4.66514 4.21 4.29C4.58514 3.91445 5.09418 3.70343 5.625 3.70343C6.15582 3.70343 6.66486 3.91445 7.04 4.29L7.1 4.35C7.58219 4.82167 8.30291 4.95235 8.92 4.68H9C9.60447 4.42093 9.99738 3.82764 10 3.17V3C10 1.89543 10.8954 1 12 1C13.1046 1 14 1.89543 14 3V3.09C14.0026 3.74764 14.3955 4.34093 15 4.6C15.6171 4.87235 16.3378 4.74167 16.82 4.27L16.88 4.21C17.2551 3.83445 17.7642 3.62343 18.295 3.62343C18.8258 3.62343 19.3349 3.83445 19.71 4.21C20.0856 4.58514 20.2966 5.09418 20.2966 5.625C20.2966 6.15582 20.0856 6.66486 19.71 7.04L19.65 7.1C19.1783 7.58219 19.0477 8.30291 19.32 8.92V9C19.5791 9.60447 20.1724 9.99738 20.83 10H21C22.1046 10 23 10.8954 23 12C23 13.1046 22.1046 14 21 14H20.91C20.2524 14.0026 19.6591 14.3955 19.4 15Z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ChevronRightIcon: React.FC<IconProps> = ({ size = iconSizes.md, color = colors.textSecondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18L15 12L9 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ChevronDownIcon: React.FC<IconProps> = ({ size = iconSizes.md, color = colors.textSecondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M6 9L12 15L18 9" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ActivityIcon: React.FC<IconProps> = ({ size = iconSizes.md, color = colors.textSecondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M22 12H18L15 21L9 3L6 12H2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const PlusIcon: React.FC<IconProps> = ({ size = iconSizes.md, color = colors.textSecondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 5V19M5 12H19" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

export const XIcon: React.FC<IconProps> = ({ size = iconSizes.md, color = colors.textSecondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6L18 18" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

export const ListIcon: React.FC<IconProps> = ({ size = iconSizes.md, color = colors.textSecondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M8 6H21M8 12H21M8 18H21" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M3 6H3.01M3 12H3.01M3 18H3.01" stroke={color} strokeWidth={3} strokeLinecap="round" />
  </Svg>
);

export const ChartIcon: React.FC<IconProps> = ({ size = iconSizes.md, color = colors.textSecondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 3V21H21" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M7 15L11 10L14 13L19 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const RadarIcon: React.FC<IconProps> = ({ size = iconSizes.md, color = colors.textSecondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke={color} strokeWidth={2} />
    <Path d="M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M12 12L19 5" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

export const NewspaperIcon: React.FC<IconProps> = ({ size = iconSizes.md, color = colors.textSecondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 4H20V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V4Z" stroke={color} strokeWidth={2} strokeLinejoin="round" />
    <Path d="M8 8H12V12H8V8Z" stroke={color} strokeWidth={2} strokeLinejoin="round" />
    <Path d="M14 8H16M14 12H16M8 16H16" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

export const UserIcon: React.FC<IconProps> = ({ size = iconSizes.md, color = colors.textSecondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke={color} strokeWidth={2} />
  </Svg>
);

export const ExternalLinkIcon: React.FC<IconProps> = ({ size = iconSizes.md, color = colors.textSecondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 13V19C18 20.1046 17.1046 21 16 21H5C3.89543 21 3 20.1046 3 19V8C3 6.89543 3.89543 6 5 6H11" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M15 3H21V9M21 3L10 14" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
