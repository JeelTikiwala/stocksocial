import React from 'react';
import { StyleSheet, View, Text, Pressable, Image, ViewStyle } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { colors, spacing, typography, borderRadius } from '@/constants';
import { SearchBar, Avatar, BellIcon } from '@/components/ui';

interface FeedHeaderProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onNotificationPress?: () => void;
  onAvatarPress?: () => void;
  hasNotifications?: boolean;
  style?: ViewStyle;
}

export const FeedHeader: React.FC<FeedHeaderProps> = ({
  searchQuery,
  onSearchChange,
  onNotificationPress,
  onAvatarPress,
  hasNotifications = false,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* Logo */}
      <View style={styles.logo}>
        <LeafIcon />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Search stocks, people, posts..."
        />
      </View>

      {/* Actions */}
      <Pressable onPress={onNotificationPress} style={styles.iconButton}>
        <BellIcon size={24} color={colors.textPrimary} hasNotification={hasNotifications} />
      </Pressable>

      <Pressable onPress={onAvatarPress} style={styles.avatarButton}>
        <Avatar name="Me" size="sm" />
      </Pressable>
    </View>
  );
};

const LeafIcon: React.FC = () => (
  <View style={styles.leafContainer}>
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z"
        fill={colors.teal}
      />
      <Path
        d="M12 6C9.79 6 8 7.79 8 10C8 11.48 8.81 12.75 10 13.46V18H14V13.46C15.19 12.75 16 11.48 16 10C16 7.79 14.21 6 12 6Z"
        fill={colors.teal}
      />
    </Svg>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  logo: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leafContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.tealLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flex: 1,
  },
  iconButton: {
    padding: spacing.xxs,
  },
  avatarButton: {
    marginLeft: spacing.xxs,
  },
});

export default FeedHeader;
