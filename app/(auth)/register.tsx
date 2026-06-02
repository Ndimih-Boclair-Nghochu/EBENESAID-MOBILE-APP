import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
import { colors, radius, spacing, typography } from '@/src/constants';
import { getApiMessage, getHttpStatus, useAuth } from '@/src/hooks/useAuth';
import { isPasswordStrong } from '@/src/lib/password';
import type { RegisterPayload } from '@/src/types';

type AccountType = RegisterPayload['accountType'];

export default function RegisterScreen() {
  const { register } = useAuth();
  const [accountType, setAccountType] = useState<AccountType>('student');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [university, setUniversity] = useState('');
  const [countryOfOrigin, setCountryOfOrigin] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const passwordError = useMemo(() => {
    if (!password || isPasswordStrong(password)) {
      return undefined;
    }

    return 'Password does not meet all requirements.';
  }, [password]);

  const handleRegister = async () => {
    setError(undefined);

    if (!email.trim() || !firstName.trim() || !lastName.trim()) {
      setError('Name and email are required.');
      return;
    }

    if (accountType === 'student' && !university.trim()) {
      setError('University is required for student accounts.');
      return;
    }

    if (!isPasswordStrong(password)) {
      setError('Password does not meet all requirements.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords must match.');
      return;
    }

    setSubmitting(true);

    try {
      await register({
        accountType,
        email: email.trim(),
        password,
        confirmPassword,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
        university: university.trim() || undefined,
        countryOfOrigin: countryOfOrigin.trim() || undefined
      });
      toast.success('Account created! Check your email then sign in.');
      router.replace('/(auth)/login');
    } catch (registerError) {
      if (getHttpStatus(registerError) === 409) {
        setError('An account with this email already exists.');
        return;
      }

      setError(getApiMessage(registerError) ?? 'Unable to create your account right now.');
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
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Start with a student or resident profile.</Text>
          </View>
          <Card style={styles.form}>
            <View style={styles.segmented}>
              <AccountTypeButton
                label="I'm a Student"
                selected={accountType === 'student'}
                onPress={() => setAccountType('student')}
              />
              <AccountTypeButton
                label="I'm a Resident"
                selected={accountType === 'resident'}
                onPress={() => setAccountType('resident')}
              />
            </View>
            <Input
              label="First name"
              leftIcon="person-outline"
              value={firstName}
              onChangeText={setFirstName}
              autoComplete="given-name"
            />
            <Input
              label="Last name"
              leftIcon="person-outline"
              value={lastName}
              onChangeText={setLastName}
              autoComplete="family-name"
            />
            <Input
              label="Email"
              leftIcon="mail-outline"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoComplete="email"
            />
            <Input
              label="Phone"
              leftIcon="call-outline"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoComplete="tel"
            />
            {accountType === 'student' ? (
              <>
                <Input
                  label="University"
                  leftIcon="school-outline"
                  value={university}
                  onChangeText={setUniversity}
                />
                <Input
                  label="Country of Origin"
                  leftIcon="flag-outline"
                  value={countryOfOrigin}
                  onChangeText={setCountryOfOrigin}
                />
              </>
            ) : null}
            <Input
              label="Password"
              leftIcon="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              error={passwordError}
            />
            <PasswordChecklist password={password} />
            <Input
              label="Confirm password"
              leftIcon="lock-closed-outline"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              error={
                confirmPassword && password !== confirmPassword ? 'Passwords must match.' : undefined
              }
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button title="Create account" loading={isSubmitting} onPress={handleRegister} />
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

interface AccountTypeButtonProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function AccountTypeButton({ label, selected, onPress }: AccountTypeButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.segmentButton, selected && styles.segmentButtonSelected]}
    >
      <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>{label}</Text>
    </Pressable>
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
  segmented: {
    backgroundColor: colors.neutralSoft,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs
  },
  segmentButton: {
    alignItems: 'center',
    borderRadius: radius.sm,
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm
  },
  segmentButtonSelected: {
    backgroundColor: colors.secondary
  },
  segmentText: {
    ...typography.label,
    color: colors.textSecondary,
    textAlign: 'center'
  },
  segmentTextSelected: {
    color: colors.primary
  },
  error: {
    ...typography.body,
    color: colors.error
  }
});

