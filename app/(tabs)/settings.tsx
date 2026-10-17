import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, spacing, typography, borderRadius } from '@/constants';
import { Card, Button, Input } from '@/components/ui';
import { useAuthStore } from '@/stores';
import { api } from '@/services/api';

interface UserSettings {
  portfolioGoal: number | null;
  dividendGoalMonthly: number | null;
  pushNotifications: boolean;
  earningsNotifications: boolean;
  socialNotifications: boolean;
  priceAlertNotifications: boolean;
  weeklyDigestEnabled: boolean;
  privacyShowHoldings: boolean;
  privacyShowTrades: boolean;
  privacyShowActivity: boolean;
  theme: string;
  currency: string;
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  isVerified: boolean;
  isPro: boolean;
  isPublic: boolean;
}

export default function TabSettingsScreen() {
  const { user, logout, setUser } = useAuthStore();

  // Loading states
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  // Settings state
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [portfolioGoalInput, setPortfolioGoalInput] = useState('');
  const [dividendGoalInput, setDividendGoalInput] = useState('');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Broker state
  const [brokerStatus, setBrokerStatus] = useState<{
    connected: boolean;
    broker: string | null;
    lastSynced: string | null;
  } | null>(null);

  // Fetch profile and settings on mount
  useEffect(() => {
    fetchProfile();
    fetchSettings();
    fetchBrokerStatus();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.settings.getProfile();
      const data = response.data?.data;
      if (data) {
        setProfile(data);
        setDisplayName(data.displayName || data.username || '');
        setBio(data.bio || '');
        setIsPublic(data.isPublic ?? true);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await api.settings.get();
      const data = response.data?.data;
      if (data) {
        setSettings(data);
        setPortfolioGoalInput(data.portfolioGoal?.toString() || '');
        setDividendGoalInput(data.dividendGoalMonthly?.toString() || '');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoadingSettings(false);
    }
  };

  const fetchBrokerStatus = async () => {
    try {
      const response = await api.broker.getStatus();
      setBrokerStatus(response.data?.data || null);
    } catch (error) {
      console.error('Error fetching broker status:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (savingProfile) return;
    setSavingProfile(true);

    try {
      const response = await api.settings.updateProfile({
        displayName: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
        isPublic,
      });

      if (response.data?.data) {
        setProfile(response.data.data);
        // Update the auth store user as well
        if (user) {
          setUser({
            ...user,
            displayName: displayName.trim() || user.displayName,
            bio: bio.trim() || user.bio,
          });
        }
        Alert.alert('Success', 'Profile updated successfully');
      }
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveGoals = async () => {
    if (savingSettings) return;
    setSavingSettings(true);

    try {
      const portfolioGoal = parseInt(portfolioGoalInput.replace(/[^0-9]/g, '')) || 0;
      const dividendGoalMonthly = parseInt(dividendGoalInput.replace(/[^0-9]/g, '')) || 0;

      const response = await api.settings.update({
        portfolioGoal,
        dividendGoalMonthly,
      });

      if (response.data?.data) {
        setSettings(response.data.data);
        Alert.alert('Success', 'Goals saved successfully');
      }
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to save goals');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleNotification = async (
    type: 'pushNotifications' | 'earningsNotifications' | 'socialNotifications' | 'priceAlertNotifications' | 'weeklyDigestEnabled',
    value: boolean
  ) => {
    if (!settings) return;

    // Optimistic update
    setSettings({ ...settings, [type]: value });

    try {
      await api.settings.update({ [type]: value });
    } catch (error) {
      // Revert on error
      setSettings({ ...settings, [type]: !value });
      Alert.alert('Error', 'Failed to update notification setting');
    }
  };

  const handleTogglePrivacy = async (
    type: 'privacyShowHoldings' | 'privacyShowTrades' | 'privacyShowActivity',
    value: boolean
  ) => {
    if (!settings) return;

    // Optimistic update
    setSettings({ ...settings, [type]: value });

    try {
      await api.settings.updatePrivacy({ [type]: value });
    } catch (error) {
      // Revert on error
      setSettings({ ...settings, [type]: !value });
      Alert.alert('Error', 'Failed to update privacy setting');
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword.trim() || !newPassword.trim()) {
      Alert.alert('Missing fields', 'Enter current and new password.');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Password too short', 'New password must be at least 8 characters.');
      return;
    }

    setSavingPassword(true);
    try {
      await api.auth.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      Alert.alert('Success', 'Password changed successfully.');
    } catch (e: any) {
      Alert.alert('Password change failed', e?.response?.data?.message || e?.message || 'Try again.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDisconnectBroker = async () => {
    Alert.alert('Disconnect Broker', 'Are you sure you want to disconnect your brokerage?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: () => {
          // For now just update local state, backend would need a disconnect endpoint
          setBrokerStatus({ connected: false, broker: null, lastSynced: null });
          Alert.alert('Disconnected', 'Broker has been disconnected.');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert('Delete account?', 'This action cannot be undone. All your data will be permanently deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.auth.deleteAccount();
          } catch {
            // Even if backend call fails, allow local logout to unblock user.
          }
          await logout();
          router.replace('/(auth)/welcome');
        },
      },
    ]);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/welcome');
  };

  const isLoading = loadingProfile || loadingSettings;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.teal} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Edit Profile */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Edit Profile</Text>
          <Input
            label="Display Name"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your display name"
          />
          <Input
            label="Bio"
            value={bio}
            onChangeText={setBio}
            placeholder="Tell others about your investing style"
            multiline
          />
          <ToggleRow
            label="Public Profile"
            value={isPublic}
            onChange={setIsPublic}
            description="Allow others to see your profile and holdings"
          />
          <Button
            title="Save Profile"
            onPress={handleSaveProfile}
            loading={savingProfile}
            disabled={savingProfile}
            style={styles.sectionButton}
          />
        </Card>

        {/* Brokerage */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Brokerage</Text>
          {brokerStatus?.connected ? (
            <>
              <View style={styles.brokerInfo}>
                <View style={styles.brokerStatusRow}>
                  <View style={styles.connectedDot} />
                  <Text style={styles.brokerText}>Connected to {brokerStatus.broker}</Text>
                </View>
                {brokerStatus.lastSynced && (
                  <Text style={styles.lastSyncedText}>
                    Last synced: {new Date(brokerStatus.lastSynced).toLocaleDateString('en-IN')}
                  </Text>
                )}
              </View>
              <Button
                title="Sync Now"
                variant="outline"
                onPress={async () => {
                  try {
                    await api.broker.sync();
                    Alert.alert('Success', 'Portfolio synced successfully');
                    fetchBrokerStatus();
                  } catch {
                    Alert.alert('Error', 'Failed to sync portfolio');
                  }
                }}
                style={styles.sectionButton}
              />
              <Button
                title="Disconnect Broker"
                variant="ghost"
                onPress={handleDisconnectBroker}
                style={{ marginTop: spacing.xs }}
              />
            </>
          ) : (
            <>
              <Text style={styles.sectionText}>
                Connect your brokerage to automatically import your portfolio.
              </Text>
              <Button
                title="Connect Broker"
                onPress={() => router.push('/(auth)/link-broker')}
                style={styles.sectionButton}
              />
            </>
          )}
        </Card>

        {/* Portfolio Goals */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Portfolio Goals</Text>
          <Input
            label="Target Portfolio Value (₹)"
            value={portfolioGoalInput}
            onChangeText={setPortfolioGoalInput}
            keyboardType="numeric"
            placeholder="e.g., 1000000"
          />
          <Input
            label="Monthly Dividend Goal (₹)"
            value={dividendGoalInput}
            onChangeText={setDividendGoalInput}
            keyboardType="numeric"
            placeholder="e.g., 5000"
          />
          <Button
            title="Save Goals"
            onPress={handleSaveGoals}
            loading={savingSettings}
            disabled={savingSettings}
            style={styles.sectionButton}
          />
        </Card>

        {/* Notifications */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <ToggleRow
            label="Push Notifications"
            value={settings?.pushNotifications ?? true}
            onChange={(v) => handleToggleNotification('pushNotifications', v)}
            description="Receive push notifications"
          />
          <ToggleRow
            label="Earnings Alerts"
            value={settings?.earningsNotifications ?? true}
            onChange={(v) => handleToggleNotification('earningsNotifications', v)}
            description="Get notified about earnings reports"
          />
          <ToggleRow
            label="Social Activity"
            value={settings?.socialNotifications ?? true}
            onChange={(v) => handleToggleNotification('socialNotifications', v)}
            description="Likes, comments, and follows"
          />
          <ToggleRow
            label="Price Alerts"
            value={settings?.priceAlertNotifications ?? true}
            onChange={(v) => handleToggleNotification('priceAlertNotifications', v)}
            description="Get notified when stocks hit targets"
          />
          <ToggleRow
            label="Weekly Digest"
            value={settings?.weeklyDigestEnabled ?? true}
            onChange={(v) => handleToggleNotification('weeklyDigestEnabled', v)}
            description="Receive weekly portfolio summary"
          />
        </Card>

        {/* Privacy */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          <ToggleRow
            label="Show Holdings"
            value={settings?.privacyShowHoldings ?? true}
            onChange={(v) => handleTogglePrivacy('privacyShowHoldings', v)}
            description="Allow others to see your holdings"
          />
          <ToggleRow
            label="Show Trades"
            value={settings?.privacyShowTrades ?? false}
            onChange={(v) => handleTogglePrivacy('privacyShowTrades', v)}
            description="Allow others to see your trades"
          />
          <ToggleRow
            label="Show Activity"
            value={settings?.privacyShowActivity ?? true}
            onChange={(v) => handleTogglePrivacy('privacyShowActivity', v)}
            description="Show your activity in the feed"
          />
        </Card>

        {/* Change Password */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Change Password</Text>
          <Input
            label="Current Password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            placeholder="Enter current password"
          />
          <Input
            label="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholder="Enter new password (min 8 characters)"
          />
          <Button
            title="Update Password"
            onPress={handleChangePassword}
            loading={savingPassword}
            disabled={savingPassword}
            style={styles.sectionButton}
          />
        </Card>

        {/* Account Actions */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.accountInfo}>
            <Text style={styles.accountLabel}>Email</Text>
            <Text style={styles.accountValue}>{profile?.email || user?.email}</Text>
          </View>
          <View style={styles.accountInfo}>
            <Text style={styles.accountLabel}>Username</Text>
            <Text style={styles.accountValue}>@{profile?.username || user?.username}</Text>
          </View>
          <View style={styles.accountInfo}>
            <Text style={styles.accountLabel}>Member since</Text>
            <Text style={styles.accountValue}>
              {profile?.id ? 'Active member' : 'N/A'}
            </Text>
          </View>
          <Button title="Log Out" variant="outline" onPress={handleLogout} style={styles.sectionButton} />
          <Pressable style={styles.deleteButton} onPress={handleDeleteAccount}>
            <Text style={styles.deleteText}>Delete Account</Text>
          </Pressable>
        </Card>

        {/* App Info */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Version</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Build</Text>
            <Text style={styles.aboutValue}>2024.03.23</Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
  description,
}: {
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
  description?: string;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleTextContainer}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {description && <Text style={styles.toggleDescription}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.tealLight }}
        thumbColor={value ? colors.teal : colors.white}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  header: {
    backgroundColor: colors.white,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  sectionCard: {
    padding: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  sectionText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  sectionButton: {
    marginTop: spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.borderLight,
  },
  toggleTextContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  toggleLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  toggleDescription: {
    ...typography.small,
    color: colors.textTertiary,
    marginTop: 2,
  },
  brokerInfo: {
    marginVertical: spacing.sm,
  },
  brokerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  connectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gain,
  },
  brokerText: {
    ...typography.bodyMd,
    color: colors.textPrimary,
  },
  lastSyncedText: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
  accountInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.borderLight,
  },
  accountLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  accountValue: {
    ...typography.bodyMd,
    color: colors.textPrimary,
  },
  deleteButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  deleteText: {
    ...typography.bodyMd,
    color: colors.loss,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  aboutLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  aboutValue: {
    ...typography.body,
    color: colors.textPrimary,
  },
});
