import {
  Ionicons } from '@expo/vector-icons';
import { StyleSheet,
  View
} from 'react-native';

import { colors, spacing, typography } from '@/src/constants';

import { Button } from './Button';

import { Text } from '@/src/components/ui/TranslatedText';

interface ErrorStateProps {
  title: string;
  message?: string;
  retryLabel?: string;
  onRetry?: () => void;
}

export function ErrorState({ title, message, retryLabel = 'Retry', onRetry }: ErrorStateProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.iconShell}>
        <Ionicons name="alert-circle-outline" size={30} color={colors.error} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {onRetry ? <Button title={retryLabel} onPress={onRetry} style={styles.button} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'center',
    padding: spacing.xl
  },
  iconShell: {
    alignItems: 'center',
    backgroundColor: colors.errorSoft,
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    width: 56
  },
  title: {
    ...typography.headingMedium,
    textAlign: 'center'
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center'
  },
  button: {
    marginTop: spacing.md,
    minWidth: 180
  }
});

