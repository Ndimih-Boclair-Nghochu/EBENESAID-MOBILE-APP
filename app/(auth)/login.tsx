import { router } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { toast } from '@/src/components/ui/Toast';
import { colors, spacing, typography } from '@/src/constants';
import { getApiMessage, getHttpStatus, useAuth } from '@/src/hooks/useAuth';
import { useBiometrics } from '@/src/hooks/useBiometrics';
import { getPortalRoute } from '@/src/lib/roleRoutes';
import { storage } from '@/src/lib/storage';

const LAST_EMAIL_KEY = 'last_email';

export default function LoginScreen() {
  const { login, probeSession, isLoading } = useAuth();
  const biometrics = useBiometrics();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [lastEmail, setLastEmail] = useState<string | null>(null);

  const canUseBiometrics = biometrics.isAvailable && Boolean(lastEmail);

  useEffect(() => {
    let isMounted = true;

    void storage.getString(LAST_EMAIL_KEY).then((savedEmail) => {
      if (!isMounted) {
        return;
      }

      setLastEmail(savedEmail);

      if (savedEmail) {
        setEmail(savedEmail);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogin = async () => {
    setError(undefined);

    try {
      await login(email.trim(), password);
      await storage.set(LAST_EMAIL_KEY, email.trim());
      setLastEmail(email.trim());
    } catch (loginError) {
      const status = getHttpStatus(loginError);

      if (status === 401) {
        setError('Invalid email or password.');
        return;
      }

      if (status === 429) {
        setError('Too many login attempts. Please wait.');
        return;
      }

      setError(getApiMessage(loginError) ?? 'Unable to sign in right now.');
    }
  };

  const handleBiometricLogin = async () => {
    setError(undefined);
    setBiometricLoading(true);

    try {
      const result = await biometrics.authenticate();

      if (!result.success) {
        setBiometricLoading(false);
        return;
      }

      const sessionUser = await probeSession();
      router.replace(getPortalRoute(sessionUser.userType));
    } catch {
      if (lastEmail) {
        setEmail(lastEmail);
      }

      setError('Session expired. Enter your password to sign in again.');
      toast.error('Session expired. Please sign in again.');
    } finally {
      setBiometricLoading(false);
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
            <Text style={styles.brand}>EBENESAID</Text>
            <Text style={styles.title}>Sign in</Text>
            <Text style={styles.subtitle}>Access your relocation portal.</Text>
          </View>
          <Card style={styles.form}>
            <Input
              label="Email"
              leftIcon="mail-outline"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoComplete="email"
              placeholder="you@example.com"
            />
            <Input
              label="Password"
              leftIcon="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              placeholder="Your password"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button title="Login" loading={isLoading} onPress={handleLogin} />
            {canUseBiometrics ? (
              <Button
                title={`Login with ${biometrics.label}`}
                variant="secondary"
                loading={biometricLoading}
                onPress={handleBiometricLogin}
              />
            ) : null}
            <Button
              title="Forgot password?"
              variant="ghost"
              onPress={() => router.push('/(auth)/forgot-password')}
            />
          </Card>
          <View style={styles.footer}>
            <Text style={styles.footerText}>New to EBENESAID?</Text>
            <Button
              title="Create account"
              variant="secondary"
              onPress={() => router.push('/(auth)/register')}
            />
          </View>
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
  brand: {
    ...typography.headingSmall,
    color: colors.secondary
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
  },
  footer: {
    gap: spacing.sm
  },
  footerText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center'
  }
});
