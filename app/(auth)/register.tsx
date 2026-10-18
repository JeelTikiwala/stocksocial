import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, spacing, typography } from '@/constants';
import { Button, Input, ArrowLeftIcon } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useAppSettingsStore } from '@/stores';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    username?: string;
    password?: string;
  }>({});

  const register = useAuthStore((state) => state.register);
  const brokerConnected = useAppSettingsStore((state) => state.brokerConnected);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!username.trim()) {
      newErrors.username = 'Username is required';
    } else if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await register(email, username, password);
      router.replace(brokerConnected ? '/(tabs)/portfolio' : '/(auth)/link-broker');
    } catch (error: any) {
      setErrors({ email: error?.message || 'Unable to create account' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeftIcon size={24} color={colors.textPrimary} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Start your investment journey</Text>

          <View style={styles.form}>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email}
              containerStyle={styles.inputContainer}
            />

            <Input
              label="Username"
              value={username}
              onChangeText={setUsername}
              placeholder="Choose a username"
              autoCapitalize="none"
              autoComplete="username"
              error={errors.username}
              hint="This will be your @handle"
              containerStyle={styles.inputContainer}
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Create a password"
              secureTextEntry={!showPassword}
              autoComplete="new-password"
              error={errors.password}
              hint="At least 8 characters"
              containerStyle={styles.inputContainer}
              rightIcon={
                <Text style={styles.showHide}>
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              }
              onRightIconPress={() => setShowPassword(!showPassword)}
            />

            <Text style={styles.terms}>
              By signing up, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>

            <Button
              title="Create Account"
              onPress={handleRegister}
              loading={loading}
              disabled={loading}
              fullWidth
              size="lg"
              style={styles.submitButton}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Pressable onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.footerLink}>Sign in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backButton: {
    padding: spacing.xs,
    alignSelf: 'flex-start',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xxl,
  },
  form: {
    gap: spacing.md,
  },
  inputContainer: {
    marginBottom: spacing.xs,
  },
  showHide: {
    ...typography.smallMd,
    color: colors.teal,
  },
  terms: {
    ...typography.small,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  termsLink: {
    color: colors.teal,
  },
  submitButton: {
    marginTop: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xxl,
    paddingBottom: spacing.tabBar,
  },
  footerText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  footerLink: {
    ...typography.bodyMd,
    color: colors.teal,
  },
});
