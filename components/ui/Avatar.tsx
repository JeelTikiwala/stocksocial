import React from 'react';
import {
  StyleSheet,
  View,
  Image,
  Text,
  ViewStyle,
  ImageSourcePropType,
} from 'react-native';
import { colors, borderRadius, avatarSizes } from '@/constants';
import { getInitials } from '@/utils';

type AvatarSize = keyof typeof avatarSizes;

interface AvatarProps {
  source?: ImageSourcePropType | string | null;
  name?: string;
  size?: AvatarSize;
  style?: ViewStyle;
  showBorder?: boolean;
  borderColor?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  source,
  name,
  size = 'md',
  style,
  showBorder = false,
  borderColor = colors.white,
}) => {
  const dimension = avatarSizes[size];
  const fontSize = dimension * 0.4;

  const containerStyle: ViewStyle = {
    width: dimension,
    height: dimension,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    ...(showBorder && {
      borderWidth: 2,
      borderColor,
    }),
  };

  const renderContent = () => {
    if (source) {
      const imageSource =
        typeof source === 'string' ? { uri: source } : source;
      return (
        <Image
          source={imageSource}
          style={styles.image}
          resizeMode="cover"
        />
      );
    }

    const initials = name ? getInitials(name) : '?';
    const backgroundColor = getAvatarColor(name || '');

    return (
      <View style={[styles.placeholder, { backgroundColor }]}>
        <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
      </View>
    );
  };

  return <View style={[containerStyle, style]}>{renderContent()}</View>;
};

// Deterministic color based on name
const getAvatarColor = (name: string): string => {
  const colors_palette = [
    '#6C63FF',
    '#00C2A8',
    '#F59E0B',
    '#3B82F6',
    '#10B981',
    '#EC4899',
    '#8B5CF6',
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors_palette[Math.abs(hash) % colors_palette.length];
};

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.white,
    fontWeight: '600',
  },
});
