import React from 'react';
import { StyleSheet, View, Text, Pressable, TextInput, ScrollView } from 'react-native';
import { colors, spacing, typography, borderRadius } from '@/constants';
import { XIcon, PlusIcon } from '@/components/ui';
import type { OptionChain, StrategyLeg } from '@/types';

interface Props {
  chain: OptionChain | undefined;
  legs: StrategyLeg[];
  onChange: (legs: StrategyLeg[]) => void;
}

let seq = 1;
const newId = () => `leg-${Date.now().toString(36)}-${seq++}`;

function sideFor(chain: OptionChain, strike: number, inst: 'CE' | 'PE') {
  const row = chain.rows.find((r) => r.strike === strike);
  return inst === 'CE' ? row?.call : row?.put;
}

/** Fill premium/iv from the chain for the leg's strike and type (FUT uses the future price or spot). */
export function priceLeg(leg: StrategyLeg, chain: OptionChain | undefined): StrategyLeg {
  if (!chain) return leg;
  if (leg.instrument === 'FUT') return { ...leg, premium: +(chain.futurePrice ?? chain.spot).toFixed(2), strike: 0, iv: undefined };
  const s = sideFor(chain, leg.strike, leg.instrument);
  return { ...leg, premium: s ? s.close : leg.premium, iv: s?.iv ?? leg.iv ?? 0.2, expiry: chain.expiry };
}

export type TemplateName = 'Bull Call Spread' | 'Bear Put Spread' | 'Short Straddle' | 'Long Straddle' | 'Short Strangle' | 'Iron Condor' | 'Long Future';
export const TEMPLATES: TemplateName[] = ['Bull Call Spread', 'Bear Put Spread', 'Short Straddle', 'Long Straddle', 'Short Strangle', 'Iron Condor', 'Long Future'];

export function buildTemplate(name: TemplateName, chain: OptionChain): StrategyLeg[] {
  const strikes = chain.rows.map((r) => r.strike);
  const i = strikes.indexOf(chain.atmStrike);
  const k = (off: number) => strikes[Math.min(Math.max(i + off, 0), strikes.length - 1)];
  const mk = (instrument: 'CE' | 'PE' | 'FUT', side: 'BUY' | 'SELL', strike: number): StrategyLeg => priceLeg({ id: newId(), instrument, side, strike, premium: 0, lots: 1 }, chain);
  switch (name) {
    case 'Bull Call Spread': return [mk('CE', 'BUY', k(0)), mk('CE', 'SELL', k(4))];
    case 'Bear Put Spread': return [mk('PE', 'BUY', k(0)), mk('PE', 'SELL', k(-4))];
    case 'Short Straddle': return [mk('CE', 'SELL', k(0)), mk('PE', 'SELL', k(0))];
    case 'Long Straddle': return [mk('CE', 'BUY', k(0)), mk('PE', 'BUY', k(0))];
    case 'Short Strangle': return [mk('CE', 'SELL', k(4)), mk('PE', 'SELL', k(-4))];
    case 'Iron Condor': return [mk('PE', 'BUY', k(-8)), mk('PE', 'SELL', k(-4)), mk('CE', 'SELL', k(4)), mk('CE', 'BUY', k(8))];
    case 'Long Future': return [mk('FUT', 'BUY', 0)];
  }
}

export const LegEditor: React.FC<Props> = ({ chain, legs, onChange }) => {
  const strikes = chain?.rows.map((r) => r.strike) ?? [];
  const update = (id: string, patch: Partial<StrategyLeg>, reprice = true) =>
    onChange(legs.map((l) => (l.id === id ? (reprice ? priceLeg({ ...l, ...patch }, chain) : { ...l, ...patch }) : l)));
  const stepStrike = (leg: StrategyLeg, dir: 1 | -1) => {
    if (strikes.length === 0) return update(leg.id, { strike: leg.strike + dir * 50 });
    const i = strikes.indexOf(leg.strike);
    const next = strikes[Math.min(Math.max((i < 0 ? strikes.indexOf(chain!.atmStrike) : i) + dir, 0), strikes.length - 1)];
    update(leg.id, { strike: next });
  };
  const addLeg = () => {
    const base: StrategyLeg = { id: newId(), instrument: 'CE', side: 'BUY', strike: chain?.atmStrike ?? 0, premium: 0, lots: 1 };
    onChange([...legs, priceLeg(base, chain)]);
  };

  return (
    <View style={styles.wrap}>
      {chain && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.templates}>
          {TEMPLATES.map((t) => (
            <Pressable key={t} onPress={() => onChange(buildTemplate(t, chain))} style={styles.template}><Text style={styles.templateText}>{t}</Text></Pressable>
          ))}
        </ScrollView>
      )}
      {legs.map((leg) => (
        <View key={leg.id} style={styles.leg}>
          <View style={styles.legRow}>
            <Pressable onPress={() => update(leg.id, { side: leg.side === 'BUY' ? 'SELL' : 'BUY' }, false)} style={[styles.sideBtn, leg.side === 'BUY' ? styles.buy : styles.sell]}>
              <Text style={styles.sideText}>{leg.side}</Text>
            </Pressable>
            <View style={styles.instGroup}>
              {(['CE', 'PE', 'FUT'] as const).map((inst) => (
                <Pressable key={inst} onPress={() => update(leg.id, { instrument: inst })} style={[styles.inst, leg.instrument === inst && styles.instActive]}>
                  <Text style={[styles.instText, leg.instrument === inst && styles.instTextActive]}>{inst}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.lots}>
              <Pressable onPress={() => update(leg.id, { lots: Math.max(1, leg.lots - 1) }, false)} hitSlop={6}><Text style={styles.step}>−</Text></Pressable>
              <Text style={styles.lotsText}>{leg.lots} lot{leg.lots > 1 ? 's' : ''}</Text>
              <Pressable onPress={() => update(leg.id, { lots: Math.min(100, leg.lots + 1) }, false)} hitSlop={6}><Text style={styles.step}>+</Text></Pressable>
            </View>
            <Pressable onPress={() => onChange(legs.filter((l) => l.id !== leg.id))} hitSlop={8} style={styles.remove}><XIcon size={16} color={colors.textTertiary} /></Pressable>
          </View>
          <View style={styles.legRow}>
            {leg.instrument !== 'FUT' ? (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Strike</Text>
                <View style={styles.strikeRow}>
                  <Pressable onPress={() => stepStrike(leg, -1)} hitSlop={6}><Text style={styles.step}>−</Text></Pressable>
                  <TextInput style={styles.input} keyboardType="numeric" value={String(leg.strike)} onChangeText={(t) => { const n = Number(t); if (Number.isFinite(n)) update(leg.id, { strike: n }); }} />
                  <Pressable onPress={() => stepStrike(leg, 1)} hitSlop={6}><Text style={styles.step}>+</Text></Pressable>
                </View>
              </View>
            ) : <View style={styles.field}><Text style={styles.fieldLabel}>Futures</Text><Text style={styles.fieldStatic}>{chain?.expiry ?? ''}</Text></View>}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{leg.instrument === 'FUT' ? 'Entry price' : 'Premium'}</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={String(leg.premium)} onChangeText={(t) => { const n = Number(t); if (Number.isFinite(n)) update(leg.id, { premium: n }, false); }} />
            </View>
            {leg.instrument !== 'FUT' && (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>IV</Text>
                <Text style={styles.fieldStatic}>{leg.iv ? `${(leg.iv * 100).toFixed(1)}%` : '—'}</Text>
              </View>
            )}
          </View>
        </View>
      ))}
      <Pressable onPress={addLeg} style={styles.add}><PlusIcon size={16} color={colors.indigo} /><Text style={styles.addText}>Add leg</Text></Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  templates: { gap: spacing.xs, paddingBottom: spacing.sm },
  template: { paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: borderRadius.full, backgroundColor: colors.indigoLight },
  templateText: { ...typography.smallMd, color: colors.indigo },
  leg: { backgroundColor: colors.white, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.borderLight, padding: spacing.sm, marginBottom: spacing.xs, gap: spacing.xs },
  legRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  sideBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: borderRadius.sm, minWidth: 54, alignItems: 'center' },
  buy: { backgroundColor: colors.gainBg },
  sell: { backgroundColor: colors.lossBg },
  sideText: { ...typography.smallMd, fontWeight: '700', color: colors.textPrimary },
  instGroup: { flexDirection: 'row', backgroundColor: colors.inputBg, borderRadius: borderRadius.sm, padding: 2 },
  inst: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  instActive: { backgroundColor: colors.white },
  instText: { ...typography.smallMd, color: colors.textSecondary },
  instTextActive: { color: colors.textPrimary, fontWeight: '700' },
  lots: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 'auto' },
  lotsText: { ...typography.smallMd, color: colors.textPrimary, minWidth: 44, textAlign: 'center' },
  step: { ...typography.h4, color: colors.indigo, paddingHorizontal: 6 },
  remove: { marginLeft: 4 },
  field: { flex: 1 },
  fieldLabel: { ...typography.label, color: colors.textTertiary, marginBottom: 2 },
  fieldStatic: { ...typography.smallMd, color: colors.textPrimary, paddingVertical: 6 },
  strikeRow: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, ...typography.smallMd, color: colors.textPrimary, backgroundColor: colors.inputBg, borderRadius: borderRadius.sm, paddingHorizontal: 8, paddingVertical: 6, minWidth: 60, fontVariant: ['tabular-nums'] },
  add: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: borderRadius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.indigo },
  addText: { ...typography.smallMd, color: colors.indigo },
});
