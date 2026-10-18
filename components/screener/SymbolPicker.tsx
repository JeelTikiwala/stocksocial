import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, borderRadius } from '@/constants';
import { SearchBar, XIcon } from '@/components/ui';
import { useUniverse } from '@/hooks/useMarketData';

interface Props {
  value: string;
  onChange: (symbol: string) => void;
  /** Show only these symbols as quick chips (defaults to indices + first few stocks). */
  quick?: string[];
}

export const SymbolPicker: React.FC<Props> = ({ value, onChange, quick }) => {
  const { data: universe = [] } = useUniverse();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const quickList = useMemo(() => {
    if (quick) return quick;
    const idx = universe.filter((u) => u.isIndex).map((u) => u.symbol);
    const st = universe.filter((u) => !u.isIndex).slice(0, 6).map((u) => u.symbol);
    return [...idx, ...st];
  }, [universe, quick]);
  const results = useMemo(() => {
    const s = q.trim().toUpperCase();
    return universe.filter((u) => !s || u.symbol.includes(s) || u.name.toUpperCase().includes(s));
  }, [universe, q]);
  const chips = quickList.includes(value) ? quickList : [value, ...quickList];

  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {chips.map((s) => (
          <Pressable key={s} onPress={() => onChange(s)} style={[styles.chip, s === value && styles.chipActive]}>
            <Text style={[styles.chipText, s === value && styles.chipTextActive]}>{s}</Text>
          </Pressable>
        ))}
        <Pressable onPress={() => setOpen(true)} style={[styles.chip, styles.chipMore]}>
          <Text style={[styles.chipText, { color: colors.indigo }]}>All {universe.length}…</Text>
        </Pressable>
      </ScrollView>
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose underlying</Text>
            <Pressable onPress={() => setOpen(false)} hitSlop={10}><XIcon size={22} color={colors.textPrimary} /></Pressable>
          </View>
          <SearchBar value={q} onChangeText={setQ} placeholder="Search symbol or name" autoFocus />
          <FlatList
            data={results}
            keyExtractor={(u) => u.symbol}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => { onChange(item.symbol); setOpen(false); setQ(''); }}
                style={styles.item}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemSymbol}>{item.symbol}</Text>
                  <Text style={styles.itemName} numberOfLines={1}>{item.name} · {item.sector}</Text>
                </View>
                <Text style={styles.itemLot}>Lot {item.lotSize}</Text>
              </Pressable>
            )}
            keyboardShouldPersistTaps="handled"
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  chips: { paddingHorizontal: spacing.md, gap: spacing.xs },
  chip: { paddingHorizontal: spacing.sm, paddingVertical: 7, borderRadius: borderRadius.full, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.indigo, borderColor: colors.indigo },
  chipMore: { borderStyle: 'dashed', borderColor: colors.indigo },
  chipText: { ...typography.smallMd, color: colors.textSecondary },
  chipTextActive: { color: colors.white },
  modal: { flex: 1, backgroundColor: colors.offWhite },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  modalTitle: { ...typography.h3, color: colors.textPrimary },
  item: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLight, backgroundColor: colors.white },
  itemSymbol: { ...typography.bodyMd, color: colors.textPrimary },
  itemName: { ...typography.small, color: colors.textSecondary },
  itemLot: { ...typography.small, color: colors.textTertiary },
});
