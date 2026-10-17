import React from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Text,
  Pressable,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { colors, borderRadius, spacing, typography } from '@/constants';

interface SearchBarProps extends Omit<TextInputProps, 'style'> {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  placeholder?: string;
  style?: ViewStyle;
  showCancelButton?: boolean;
  onCancel?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onClear,
  placeholder = 'Search',
  style,
  showCancelButton = false,
  onCancel,
  ...textInputProps
}) => {
  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  return (
    <View style={[styles.wrapper, style]}>
      <View style={styles.container}>
        <SearchIcon />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          {...textInputProps}
        />
        {value.length > 0 && (
          <Pressable onPress={handleClear} hitSlop={10}>
            <ClearIcon />
          </Pressable>
        )}
      </View>
      {showCancelButton && (
        <Pressable onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      )}
    </View>
  );
};

const SearchIcon: React.FC = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
      stroke={colors.textTertiary}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ClearIcon: React.FC = () => (
  <View style={styles.clearIcon}>
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6L18 18"
        stroke={colors.white}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    height: 40,
    gap: spacing.xs,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  clearIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.textTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    paddingHorizontal: spacing.xs,
  },
  cancelText: {
    ...typography.bodyMd,
    color: colors.teal,
  },
});
