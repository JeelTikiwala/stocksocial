import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text, Pressable, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '@/constants';
import { SearchBar, XIcon, CheckIcon, PlusIcon } from '@/components/ui';
import { useUniverse } from '@/hooks/useMarketData';

interface Props {
  visible: boolean;
  onClose: () => void;
  selected: string[];
  onToggle: (symbol: string) => void;
}

export const AddSymbolModal: React.FC<Props> = ({ visible, onClose, selected, onToggle }) => {
  const { data: universe = [] } = useUniverse();
  const [q, setQ] = useState('');
  const results = useMemo(() => {
    const s = q.trim().toUpperCase();
    return universe.filter((u) => !s || u.symbol.includes(s) || u.name.toUpperCase().includes(s) || u.sector.toUpperCase().includes(s));
  }, [universe, q]);
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <SafeAreaView style={styles.modal}>
        <View style={styles.header}>
          <Text style={styles.title}>Add to watchlist</Text>
          <Pressable onPress={onClose} hitSlop={10}><XIcon size={22} color={colors.textPrimary} /></Pressable>
        </View>
        <SearchBar value={q} onChangeText={setQ} placeholder="Search symbol, name or sector" autoFocus />
        <FlatList
          data={results}
          keyExtractor={(u) => u.symbol}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const on = selected.includes(item.symbol);
            return (
              <Pressable onPress={() => onToggle(item.symbol)} style={styles.item}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sym}>{item.symbol}{item.isIndex ? '  ·  index' : ''}</Text>
                  <Text style={styles.name} numberOfLines={1}>{item.name} · {item.sector} · lot {item.lotSize}</Text>
                </View>
                <View style={[styles.check, on && styles.checkOn]}>{on ? <CheckIcon size={16} color={colors.white} /> : <PlusIcon size={16} color={colors.indigo} />}</View>
              </Pressable>
            );
          }}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: { flex: 1, backgroundColor: colors.offWhite },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  title: { ...typography.h3, color: colors.textPrimary },
  item: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLight, backgroundColor: colors.white, gap: spacing.sm },
  sym: { ...typography.bodyMd, color: colors.textPrimary },
  name: { ...typography.small, color: colors.textSecondary },
  check: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: colors.indigo, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.gain, borderColor: colors.gain },
});
