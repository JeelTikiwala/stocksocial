import React from 'react';
import { StyleSheet, View, Text, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, spacing, glass, FLOATING_TAB_BAR_HEIGHT, borderRadius } from '@/constants';
import { GlassView } from '@/components/ui/Glass';

/** Floating frosted pill tab bar; content scrolls underneath it. */
export const FloatingTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const visible = state.routes.filter((r) => (descriptors[r.key].options as { href?: string | null }).href !== null && (descriptors[r.key].options as any).tabBarButton === undefined);
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, 10) + 4 }]}>
      <GlassView radius={borderRadius.full} intensity={glass.tabBarBlur} strong style={styles.bar} contentStyle={styles.row}>
        {visible.map((route) => {
          const { options } = descriptors[route.key];
          const focused = state.routes[state.index].key === route.key;
          const label = typeof options.title === 'string' ? options.title : route.name;
          const color = focused ? colors.indigo : colors.textTertiary;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name as never);
          };
          return (
            <Pressable key={route.key} onPress={onPress} accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel={label} style={[styles.item, focused && styles.itemActive]}>
              {options.tabBarIcon?.({ focused, color, size: 22 })}
              <Text style={[styles.label, { color }]} numberOfLines={1}>{label}</Text>
            </Pressable>
          );
        })}
      </GlassView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: spacing.md, right: spacing.md, alignItems: 'center' },
  bar: { width: '100%', maxWidth: 520 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: FLOATING_TAB_BAR_HEIGHT, paddingHorizontal: 6 },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, height: FLOATING_TAB_BAR_HEIGHT - 12, borderRadius: borderRadius.full },
  itemActive: { backgroundColor: Platform.OS === 'web' ? 'rgba(27,33,89,0.08)' : colors.indigoLight },
  label: { fontSize: 10.5, fontWeight: '600' },
});
