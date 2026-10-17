import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Avatar, HeartIcon, MessageIcon, PlusIcon } from '@/components/ui';
import { borderRadius, colors, spacing, typography } from '@/constants';
import { useAuthStore } from '@/stores';

const posts = [
  {
    id: 'market-discipline',
    name: 'Priya Mehta',
    handle: 'priyainvests',
    time: '18 min',
    body: 'The most useful thing I did this quarter was nothing. My thesis on HDFC Bank has not changed, so the price noise does not need a reaction.',
    ticker: 'HDFCBANK',
    likes: 84,
    comments: 12,
  },
  {
    id: 'earnings-notes',
    name: 'Arjun Rao',
    handle: 'compoundarjun',
    time: '1 hr',
    body: 'Three notes from the latest IT earnings: deal flow is steady, margins remain the real story, and guidance matters more than the headline beat.',
    ticker: 'TCS',
    likes: 46,
    comments: 8,
  },
];

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const [liked, setLiked] = useState<string[]>([]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>STOCKSOCIAL</Text>
            <Text style={styles.title}>Good morning{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}</Text>
          </View>
          <Pressable accessibilityLabel="Open settings" onPress={() => router.push('/settings')}>
            <Avatar name={user?.displayName || user?.username || 'Investor'} size="md" />
          </Pressable>
        </View>

        <View style={styles.marketStrip}>
          <View>
            <Text style={styles.marketLabel}>NIFTY 50</Text>
            <Text style={styles.marketValue}>24,834.70</Text>
          </View>
          <View style={styles.marketRight}>
            <Text style={styles.gain}>+0.84%</Text>
            <Text style={styles.marketNote}>Market open</Text>
          </View>
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>From your circle</Text>
          <Text style={styles.sectionMeta}>Latest</Text>
        </View>

        {posts.map((post) => {
          const isLiked = liked.includes(post.id);
          return (
            <Pressable key={post.id} style={styles.post} onPress={() => router.push(`/post/${post.id}`)}>
              <View style={styles.authorRow}>
                <Avatar name={post.name} size="md" />
                <View style={styles.authorCopy}>
                  <Text style={styles.author}>{post.name}</Text>
                  <Text style={styles.handle}>@{post.handle} · {post.time}</Text>
                </View>
              </View>
              <Text style={styles.postBody}>{post.body}</Text>
              <Pressable style={styles.tickerPill} onPress={() => router.push(`/stock/${post.ticker}`)}>
                <Text style={styles.tickerText}>${post.ticker}</Text>
              </Pressable>
              <View style={styles.actions}>
                <Pressable
                  style={styles.action}
                  onPress={(event) => {
                    event.stopPropagation();
                    setLiked((items) => isLiked ? items.filter((id) => id !== post.id) : [...items, post.id]);
                  }}
                >
                  <HeartIcon size={19} color={isLiked ? colors.loss : colors.textTertiary} filled={isLiked} />
                  <Text style={styles.actionText}>{post.likes + (isLiked ? 1 : 0)}</Text>
                </Pressable>
                <View style={styles.action}>
                  <MessageIcon size={19} color={colors.textTertiary} />
                  <Text style={styles.actionText}>{post.comments}</Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <Pressable accessibilityLabel="Create a post" style={styles.fab}>
        <PlusIcon size={22} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.offWhite },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 110 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.md, paddingBottom: spacing.xl },
  eyebrow: { ...typography.label, color: colors.teal, marginBottom: spacing.xxs },
  title: { ...typography.h1, color: colors.textPrimary },
  marketStrip: { backgroundColor: colors.indigo, borderRadius: borderRadius.xl, padding: spacing.lg, flexDirection: 'row', justifyContent: 'space-between' },
  marketLabel: { ...typography.label, color: '#AFC5C2' },
  marketValue: { fontSize: 26, fontWeight: '700', color: colors.white, marginTop: spacing.xxs, letterSpacing: -0.4 },
  marketRight: { alignItems: 'flex-end', justifyContent: 'center' },
  gain: { ...typography.bodyMd, color: '#8BE0BA', fontWeight: '700' },
  marketNote: { ...typography.small, color: '#AFC5C2', marginTop: spacing.xxs },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xxl, marginBottom: spacing.sm },
  sectionTitle: { ...typography.h3, color: colors.textPrimary },
  sectionMeta: { ...typography.small, color: colors.textTertiary },
  post: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.borderLight, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm },
  authorRow: { flexDirection: 'row', alignItems: 'center' },
  authorCopy: { marginLeft: spacing.sm },
  author: { ...typography.bodyMd, color: colors.textPrimary, fontWeight: '700' },
  handle: { ...typography.small, color: colors.textTertiary, marginTop: 2 },
  postBody: { ...typography.body, color: colors.textPrimary, marginTop: spacing.md, lineHeight: 23 },
  tickerPill: { alignSelf: 'flex-start', backgroundColor: colors.tealLight, borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: 6, marginTop: spacing.sm },
  tickerText: { ...typography.smallMd, color: colors.teal, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: spacing.xl, marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderLight },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: spacing.xxs },
  actionText: { ...typography.small, color: colors.textSecondary },
  fab: { position: 'absolute', right: spacing.lg, bottom: spacing.lg, width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.teal },
});
