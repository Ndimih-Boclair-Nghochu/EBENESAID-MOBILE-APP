import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { PasswordChecklist } from '@/src/components/ui/PasswordChecklist';
import { toast } from '@/src/components/ui/Toast';
import { colors, spacing, typography } from '@/src/constants';
import { getApiMessage, useAuth } from '@/src/hooks/useAuth';
import { isPasswordStrong } from '@/src/lib/password';

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token?: string | string[] }>();
  const { resetPassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const tokenValue = Array.isArray(token) ? token[0] : token;
  const passwordError = useMemo(() => {
    if (!newPassword || isPasswordStrong(newPassword)) {
      return undefined;
    }

    return 'Password does not meet all requirements.';
  }, [newPassword]);

  const handleReset = async () => {
    setError(undefined);

    if (!tokenValue) {
      setError('Reset token is missing.');
      return;
    }

    if (!isPasswordStrong(newPassword)) {
      setError('Password does not meet all requirements.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords must match.');
      return;
    }

    setSubmitting(true);

    try {
      await resetPassword({
        token: tokenValue,
        newPassword,
        confirmPassword
      });
      toast.success('Password reset. Sign in with your new password.');
      router.replace('/(auth)/login');
    } catch (resetError) {
      setError(getApiMessage(resetError) ?? 'Unable to reset password right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Reset password</Text>
            <Text style={styles.subtitle}>Choose a new secure password.</Text>
          </View>
          <Card style={styles.form}>
            <Input
              label="New password"
              leftIcon="lock-closed-outline"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              error={passwordError}
            />
            <PasswordChecklist password={newPassword} />
            <Input
              label="Confirm password"
              leftIcon="lock-closed-outline"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              error={
                confirmPassword && newPassword !== confirmPassword
                  ? 'Passwords must match.'
                  : undefined
              }
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button title="Reset password" loading={isSubmitting} onPress={handleReset} />
            <Button
              title="Back to login"
              variant="ghost"
              onPress={() => router.replace('/(auth)/login')}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1
  },
  keyboardView: {
    flex: 1
  },
  content: {
    gap: spacing.xl,
    padding: spacing.xl
  },
  header: {
    gap: spacing.xs,
    paddingTop: spacing.xl
  },
  title: {
    ...typography.headingLarge
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary
  },
  form: {
    gap: spacing.md
  },
  error: {
    ...typography.body,
    color: colors.error
  }
});

