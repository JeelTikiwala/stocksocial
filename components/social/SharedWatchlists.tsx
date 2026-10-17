import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  TextInput,
  Share,
  ViewStyle,
  Alert,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '@/constants';
import { Card, Avatar } from '@/components/ui';

interface WatchlistStock {
  ticker: string;
  companyName: string;
  addedBy: string;
  addedAt: string;
}

interface SharedWatchlist {
  id: string;
  name: string;
  description?: string;
  isCollaborative: boolean;
  owner: {
    id: string;
    username: string;
    displayName: string;
  };
  collaborators: {
    id: string;
    username: string;
    displayName: string;
  }[];
  stocks: WatchlistStock[];
  followers: number;
  createdAt: string;
}

interface SharedWatchlistsProps {
  style?: ViewStyle;
}

const mockWatchlists: SharedWatchlist[] = [
  {
    id: 'w1',
    name: 'Tech Giants India',
    description: 'Top performing tech companies in India',
    isCollaborative: true,
    owner: { id: 'u1', username: 'rahul_inv', displayName: 'Rahul Sharma' },
    collaborators: [
      { id: 'u2', username: 'priya_trades', displayName: 'Priya Patel' },
    ],
    stocks: [
      { ticker: 'TCS', companyName: 'Tata Consultancy Services', addedBy: 'rahul_inv', addedAt: '2026-03-15' },
      { ticker: 'INFY', companyName: 'Infosys', addedBy: 'priya_trades', addedAt: '2026-03-16' },
      { ticker: 'WIPRO', companyName: 'Wipro', addedBy: 'rahul_inv', addedAt: '2026-03-18' },
    ],
    followers: 234,
    createdAt: '2026-03-01',
  },
  {
    id: 'w2',
    name: 'Banking Sector Picks',
    isCollaborative: false,
    owner: { id: 'me', username: 'my_account', displayName: 'You' },
    collaborators: [],
    stocks: [
      { ticker: 'HDFCBANK', companyName: 'HDFC Bank', addedBy: 'my_account', addedAt: '2026-03-10' },
      { ticker: 'ICICIBANK', companyName: 'ICICI Bank', addedBy: 'my_account', addedAt: '2026-03-10' },
    ],
    followers: 45,
    createdAt: '2026-02-15',
  },
];

export const SharedWatchlists: React.FC<SharedWatchlistsProps> = ({ style }) => {
  const [watchlists, setWatchlists] = useState(mockWatchlists);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [newWatchlistCollaborative, setNewWatchlistCollaborative] = useState(false);

  const handleShare = async (watchlist: SharedWatchlist) => {
    try {
      await Share.share({
        message: `Check out my watchlist "${watchlist.name}" on StockCircle! ${watchlist.stocks.length} stocks curated for you. 📈`,
        url: `https://stockcircle.app/watchlist/${watchlist.id}`,
      });
    } catch (error) {
      // Handle error
    }
  };

  const handleCreateWatchlist = () => {
    if (!newWatchlistName.trim()) return;

    const newWatchlist: SharedWatchlist = {
      id: `w${Date.now()}`,
      name: newWatchlistName,
      isCollaborative: newWatchlistCollaborative,
      owner: { id: 'me', username: 'my_account', displayName: 'You' },
      collaborators: [],
      stocks: [],
      followers: 0,
      createdAt: new Date().toISOString(),
    };

    setWatchlists([newWatchlist, ...watchlists]);
    setNewWatchlistName('');
    setNewWatchlistCollaborative(false);
    setShowCreateModal(false);
  };

  const handleDeleteStock = (watchlistId: string, ticker: string) => {
    Alert.alert(
      'Remove Stock',
      `Remove ${ticker} from this watchlist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setWatchlists(prev =>
              prev.map(w =>
                w.id === watchlistId
                  ? { ...w, stocks: w.stocks.filter(s => s.ticker !== ticker) }
                  : w
              )
            );
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Shared Watchlists</Text>
        <Pressable
          onPress={() => setShowCreateModal(true)}
          style={styles.createButton}
        >
          <Text style={styles.createButtonText}>+ Create</Text>
        </Pressable>
      </View>

      {/* Create Modal */}
      {showCreateModal && (
        <Card style={styles.createModal}>
          <Text style={styles.modalTitle}>Create Watchlist</Text>
          <TextInput
            style={styles.input}
            placeholder="Watchlist name"
            placeholderTextColor={colors.textTertiary}
            value={newWatchlistName}
            onChangeText={setNewWatchlistName}
          />
          <Pressable
            style={styles.collaborativeToggle}
            onPress={() => setNewWatchlistCollaborative(!newWatchlistCollaborative)}
          >
            <View style={[
              styles.checkbox,
              newWatchlistCollaborative && styles.checkboxChecked,
            ]}>
              {newWatchlistCollaborative && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Collaborative</Text>
              <Text style={styles.toggleDescription}>
                Allow others to add/remove tickers
              </Text>
            </View>
          </Pressable>
          <View style={styles.modalActions}>
            <Pressable
              onPress={() => setShowCreateModal(false)}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleCreateWatchlist}
              style={[
                styles.confirmButton,
                !newWatchlistName.trim() && styles.confirmButtonDisabled,
              ]}
              disabled={!newWatchlistName.trim()}
            >
              <Text style={styles.confirmText}>Create</Text>
            </Pressable>
          </View>
        </Card>
      )}

      {/* Watchlists */}
      {watchlists.map((watchlist) => (
        <Card key={watchlist.id} style={styles.watchlistCard}>
          <View style={styles.watchlistHeader}>
            <View style={styles.watchlistInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.watchlistName}>{watchlist.name}</Text>
                {watchlist.isCollaborative && (
                  <View style={styles.collaborativeBadge}>
                    <Text style={styles.collaborativeText}>👥 Collaborative</Text>
                  </View>
                )}
              </View>
              <Text style={styles.watchlistMeta}>
                by @{watchlist.owner.username} · {watchlist.stocks.length} stocks · {watchlist.followers} followers
              </Text>
            </View>
            <Pressable
              onPress={() => handleShare(watchlist)}
              style={styles.shareButton}
            >
              <Text style={styles.shareIcon}>↗</Text>
            </Pressable>
          </View>

          {watchlist.description && (
            <Text style={styles.watchlistDescription}>{watchlist.description}</Text>
          )}

          {/* Collaborators */}
          {watchlist.collaborators.length > 0 && (
            <View style={styles.collaborators}>
              <Text style={styles.collaboratorsLabel}>Collaborators:</Text>
              <View style={styles.collaboratorsList}>
                {watchlist.collaborators.map((collab) => (
                  <View key={collab.id} style={styles.collaboratorChip}>
                    <Text style={styles.collaboratorName}>@{collab.username}</Text>
                  </View>
                ))}
                <Pressable style={styles.inviteButton}>
                  <Text style={styles.inviteText}>+ Invite</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Stocks */}
          <View style={styles.stockList}>
            {watchlist.stocks.map((stock, index) => (
              <View
                key={stock.ticker}
                style={[
                  styles.stockRow,
                  index < watchlist.stocks.length - 1 && styles.stockRowBorder,
                ]}
              >
                <Avatar name={stock.companyName} size="sm" />
                <View style={styles.stockInfo}>
                  <Text style={styles.stockTicker}>{stock.ticker}</Text>
                  <Text style={styles.stockName}>{stock.companyName}</Text>
                </View>
                <Text style={styles.addedBy}>by @{stock.addedBy}</Text>
                {watchlist.owner.id === 'me' && (
                  <Pressable
                    onPress={() => handleDeleteStock(watchlist.id, stock.ticker)}
                    style={styles.removeButton}
                    hitSlop={10}
                  >
                    <Text style={styles.removeIcon}>×</Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>

          {/* Add Stock Button */}
          {(watchlist.owner.id === 'me' || watchlist.isCollaborative) && (
            <Pressable style={styles.addStockButton}>
              <Text style={styles.addStockText}>+ Add Stock</Text>
            </Pressable>
          )}
        </Card>
      ))}

      {/* Empty State */}
      {watchlists.length === 0 && (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No watchlists yet</Text>
          <Text style={styles.emptyText}>
            Create a watchlist to track stocks and share with friends
          </Text>
          <Pressable
            onPress={() => setShowCreateModal(true)}
            style={styles.emptyButton}
          >
            <Text style={styles.emptyButtonText}>Create Watchlist</Text>
          </Pressable>
        </Card>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  createButton: {
    backgroundColor: colors.teal,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  createButtonText: {
    ...typography.smallMd,
    color: colors.white,
    fontWeight: '600',
  },
  createModal: {
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.teal,
  },
  modalTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.offWhite,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  collaborativeToggle: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  checkmark: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleLabel: {
    ...typography.bodyMd,
    color: colors.textPrimary,
  },
  toggleDescription: {
    ...typography.small,
    color: colors.textSecondary,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  cancelButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  cancelText: {
    ...typography.bodyMd,
    color: colors.textSecondary,
  },
  confirmButton: {
    backgroundColor: colors.teal,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  confirmButtonDisabled: {
    backgroundColor: colors.border,
  },
  confirmText: {
    ...typography.bodyMd,
    color: colors.white,
    fontWeight: '600',
  },
  watchlistCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  watchlistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  watchlistInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  watchlistName: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  collaborativeBadge: {
    backgroundColor: colors.purpleLight,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  collaborativeText: {
    ...typography.small,
    color: colors.purple,
    fontSize: 10,
  },
  watchlistMeta: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
  shareButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.tealLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareIcon: {
    color: colors.teal,
    fontSize: 18,
    fontWeight: '600',
  },
  watchlistDescription: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  collaborators: {
    marginTop: spacing.sm,
  },
  collaboratorsLabel: {
    ...typography.small,
    color: colors.textTertiary,
    marginBottom: spacing.xxs,
  },
  collaboratorsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  collaboratorChip: {
    backgroundColor: colors.offWhite,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.full,
  },
  collaboratorName: {
    ...typography.small,
    color: colors.textSecondary,
  },
  inviteButton: {
    backgroundColor: colors.tealLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.full,
  },
  inviteText: {
    ...typography.small,
    color: colors.teal,
  },
  stockList: {
    marginTop: spacing.md,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  stockRowBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  stockInfo: {
    flex: 1,
  },
  stockTicker: {
    ...typography.bodyMd,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  stockName: {
    ...typography.small,
    color: colors.textSecondary,
  },
  addedBy: {
    ...typography.small,
    color: colors.textTertiary,
    fontSize: 10,
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.lossBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeIcon: {
    color: colors.loss,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 20,
  },
  addStockButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: borderRadius.md,
  },
  addStockText: {
    ...typography.smallMd,
    color: colors.teal,
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  emptyButton: {
    backgroundColor: colors.teal,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  emptyButtonText: {
    ...typography.bodyMd,
    color: colors.white,
    fontWeight: '600',
  },
});

export default SharedWatchlists;
