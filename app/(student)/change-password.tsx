import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Input } from '@/src/components/ui/Input';
import { PasswordChecklist } from '@/src/components/ui/PasswordChecklist';
import { toast } from '@/src/components/ui/Toast';
import { colors, spacing, typography } from '@/src/constants';
import { isPasswordStrong } from '@/src/lib/password';
import { api } from '@/src/lib/api';

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | undefined>();

  const passwordError = useMemo(() => {
    if (!newPassword || isPasswordStrong(newPassword)) {
      return undefined;
    }

    return 'Password does not meet all requirements.';
  }, [newPassword]);

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/api/student/password', {
        currentPassword,
        newPassword,
        confirmPassword
      }),
    onSuccess: () => {
      toast.success('Password changed.');
      router.back();
    },
    onError: () => {
      setError('Unable to change password.');
    }
  });

  const submit = () => {
    setError(undefined);

    if (!isPasswordStrong(newPassword)) {
      setError('Password does not meet all requirements.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords must match.');
      return;
    }

    mutation.mutate();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={styles.keyboard}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View>
            <Text style={styles.title}>Change Password</Text>
            <Text style={styles.subtitle}>Use a strong password for this account.</Text>
          </View>
          <Card style={styles.form}>
            <Input
              label="Current password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              leftIcon="lock-closed-outline"
            />
            <Input
              label="New password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              leftIcon="lock-closed-outline"
              error={passwordError}
            />
            <PasswordChecklist password={newPassword} />
            <Input
              label="Confirm password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              leftIcon="lock-closed-outline"
              error={confirmPassword && newPassword !== confirmPassword ? 'Passwords must match.' : undefined}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button title="Change password" loading={mutation.isPending} onPress={submit} />
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
  keyboard: {
    flex: 1
  },
  content: {
    gap: spacing.xl,
    padding: spacing.xl
  },
  title: {
    ...typography.headingLarge
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs
  },
  form: {
    gap: spacing.md
  },
  error: {
    ...typography.body,
    color: colors.error
  }
});

